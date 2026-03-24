/**
 * app/api/gradient/route.js — Gradient Level System API
 * 
 * GET  /api/gradient?lang=de                → Current gradient + progression history
 * GET  /api/gradient?lang=de&view=chart     → Data points for progression chart
 * GET  /api/gradient?lang=de&view=plan      → Active training plan
 * POST /api/gradient { action: 'promote' }  → Manual promotion check (usually auto)
 * POST /api/gradient { action: 'plan' }     → Generate new training plan from weaknesses
 * 
 * THE GRADIENT SCALE:
 *   A1.1 → A1.2 → A1.3 → A1.4 → A1.5 → [A1.6 = A2.1]
 *   A2.1 → A2.2 → A2.3 → A2.4 → A2.5 → [A2.6 = B1.1]
 *   B1.1 → B1.2 → B1.3 → B1.4 → B1.5 → [B1.6 = B2.1]
 *   B2.1 → B2.2 → B2.3 → B2.4 → B2.5 → [B2.6 = C1.1]
 *   C1.1 → C1.2 → C1.3 → C1.4 → C1.5 → [SPRINT COMPLETE ✅]
 *   30 steps. X.6 = auto-promotion to next major level.
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

// ─── Gradient Helpers ───

const LEVELS = ['A1','A2','B1','B2','C1'];
const ALL_GRADIENTS = [];
for (const level of LEVELS) {
  for (let i = 1; i <= 5; i++) ALL_GRADIENTS.push(`${level}.${i}`);
}
// ALL_GRADIENTS = ['A1.1','A1.2',...,'C1.5'] — 25 displayable steps
// X.6 is transient: it immediately becomes the next X.1

function gradientToIndex(gradient) {
  const idx = ALL_GRADIENTS.indexOf(gradient);
  return idx >= 0 ? idx : 0;
}

function indexToGradient(idx) {
  return ALL_GRADIENTS[Math.max(0, Math.min(idx, ALL_GRADIENTS.length - 1))];
}

function parseGradient(g) {
  if (!g) return { level: 'A1', sub: 1 };
  const match = g.match(/^([ABC]\d)\.(\d)$/);
  if (!match) return { level: 'A1', sub: 1 };
  return { level: match[1], sub: parseInt(match[2]) };
}

function applyPromotion(gradient) {
  // X.6 = promotion to next level's .1
  const { level, sub } = parseGradient(gradient);
  if (sub >= 6) {
    const levelIdx = LEVELS.indexOf(level);
    if (levelIdx < LEVELS.length - 1) {
      return `${LEVELS[levelIdx + 1]}.1`;
    }
    return `${level}.5`; // C1.6 caps at C1.5 (sprint complete)
  }
  return gradient;
}

function isSprintComplete(gradient) {
  return gradient === 'C1.5';
}

function getTrend(history) {
  if (history.length < 2) return 'new';
  const latest = gradientToIndex(history[0].overall_level);
  const previous = gradientToIndex(history[1].overall_level);
  if (latest > previous) return 'improving';
  if (latest < previous) return 'declining';
  return 'stagnant';
}

function getProgressPercent(gradient) {
  const idx = gradientToIndex(gradient);
  return Math.round((idx / (ALL_GRADIENTS.length - 1)) * 100);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const view = searchParams.get('view');

  if (!langCode) return NextResponse.json({ error: 'lang required' }, { status: 400 });

  return withDb(async (pool, { queryAll, queryOne }) => {
    const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    // ─── CHART DATA ───
    if (view === 'chart') {
      const assessments = await queryAll(pool, `
        SELECT taken_at, overall_level, vocabulary_score, grammar_score,
          reading_score, listening_score, writing_score, speaking_score,
          type, passed, hours_logged_at_test
        FROM assessments
        WHERE language_id = $1 AND overall_level IS NOT NULL
        ORDER BY taken_at ASC
      `, [language.id]);

      const chartData = assessments.map(a => ({
        date: new Date(a.taken_at).toISOString().split('T')[0],
        level: a.overall_level,
        level_index: gradientToIndex(a.overall_level),
        type: a.type,
        passed: a.passed,
        hours: Number(a.hours_logged_at_test || 0),
        scores: {
          vocabulary: a.vocabulary_score,
          grammar: a.grammar_score,
          reading: a.reading_score,
          listening: a.listening_score,
          writing: a.writing_score,
          speaking: a.speaking_score,
        },
      }));

      return NextResponse.json({
        chart: chartData,
        all_levels: ALL_GRADIENTS,
        current_index: gradientToIndex(language.assessed_level),
      });
    }

    // ─── ACTIVE TRAINING PLAN ───
    if (view === 'plan') {
      const plan = await queryOne(pool, `
        SELECT * FROM training_plans
        WHERE language_id = $1 AND active = true
        ORDER BY created_at DESC LIMIT 1
      `, [language.id]);

      if (!plan) return NextResponse.json({ plan: null });

      return NextResponse.json({
        plan: {
          id: plan.id,
          focus_areas: plan.focus_areas ? plan.focus_areas.split(',') : [],
          details: JSON.parse(plan.plan_json || '{}'),
          created: plan.created_at,
        },
      });
    }

    // ─── DEFAULT: Current gradient + history ───
    const assessments = await queryAll(pool, `
      SELECT id, type, taken_at, overall_level, passed,
        vocabulary_score, grammar_score, reading_score,
        listening_score, writing_score, speaking_score,
        hours_logged_at_test
      FROM assessments
      WHERE language_id = $1 AND overall_level IS NOT NULL
      ORDER BY taken_at DESC
    `, [language.id]);

    const current = language.assessed_level || 'A1.1';
    const trend = getTrend(assessments);
    const progress = getProgressPercent(current);
    const complete = isSprintComplete(current);

    // Latest scores for radar
    const latestScores = assessments[0] ? {
      vocabulary: assessments[0].vocabulary_score,
      grammar: assessments[0].grammar_score,
      reading: assessments[0].reading_score,
      listening: assessments[0].listening_score,
      writing: assessments[0].writing_score,
      speaking: assessments[0].speaking_score,
    } : null;

    // Active training plan
    const plan = await queryOne(pool, `
      SELECT focus_areas, plan_json FROM training_plans
      WHERE language_id = $1 AND active = true
      ORDER BY created_at DESC LIMIT 1
    `, [language.id]);

    return NextResponse.json({
      language: { code: language.code, name: language.name, flag: language.flag },
      gradient: {
        current: current,
        index: gradientToIndex(current),
        total_steps: ALL_GRADIENTS.length,
        progress_percent: progress,
        trend,
        is_complete: complete,
        next_promotion: complete ? null : `${parseGradient(current).level}.6 → ${applyPromotion(parseGradient(current).level + '.6')}`,
      },
      scores: latestScores,
      assessments: assessments.slice(0, 10),
      training_plan: plan ? {
        focus_areas: plan.focus_areas ? plan.focus_areas.split(',') : [],
        details: JSON.parse(plan.plan_json || '{}'),
      } : null,
    });
  });
}

export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  // ─── CHECK AND APPLY PROMOTION ───
  if (action === 'promote') {
    const { lang } = body;
    if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });

    return withDbWrite(async (pool, { queryOne, run }) => {
      const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [lang]);
      if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

      const current = language.assessed_level || 'A1.1';
      const promoted = applyPromotion(current);

      if (promoted !== current) {
        await run(pool,
          'UPDATE languages SET assessed_level = $1 WHERE id = $2',
          [promoted, language.id]
        );

        // Check sprint complete
        if (isSprintComplete(promoted)) {
          await run(pool, `
            UPDATE languages SET 
              status = 'completed', 
              completed_at = NOW(),
              current_phase = 'completed'
            WHERE id = $1
          `, [language.id]);

          // Log to journal
          await run(pool, `
            INSERT INTO journal_entries 
              (language_id, entry_date, category, subcategory, source, title, notes)
            VALUES ($1, CURRENT_DATE, 'output', 'level_test', 'app', $2, $3)
          `, [language.id, `🎉 SPRINT COMPLETE — ${language.name} C1.5`, `Reached C1.5! Sprint finished. Language moves to natural consumption mode.`]);
        }

        return NextResponse.json({
          promoted: true,
          from: current,
          to: promoted,
          sprint_complete: isSprintComplete(promoted),
        });
      }

      return NextResponse.json({ promoted: false, current });
    });
  }

  // ─── GENERATE TRAINING PLAN FROM WEAKNESS DATA ───
  if (action === 'plan') {
    const { lang, weaknesses, focus_areas, input_only_weeks } = body;
    if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });

    return withDbWrite(async (pool, { queryOne, queryAll, run }) => {
      const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [lang]);
      if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

      // Get error patterns to inform the plan
      const errors = await queryAll(pool, `
        SELECT category, occurrence_count, severity
        FROM error_patterns
        WHERE language_id = $1
        ORDER BY occurrence_count DESC
        LIMIT 10
      `, [language.id]);

      // Get weakest grammar chapters
      const weakChapters = await queryAll(pool, `
        SELECT gc.chapter_number, gc.title,
          COUNT(CASE WHEN ga.is_correct = false THEN 1 END)::int as error_count,
          COUNT(CASE WHEN ga.is_correct = true THEN 1 END)::int as correct_count
        FROM grammar_chapters gc
        JOIN grammar_exercises ge ON ge.chapter_id = gc.id
        JOIN grammar_prompts gp ON gp.exercise_id = ge.id
        LEFT JOIN grammar_answers ga ON ga.prompt_id = gp.id
        WHERE gc.language_id = $1 AND ga.id IS NOT NULL
        GROUP BY gc.id, gc.chapter_number, gc.title
        HAVING COUNT(CASE WHEN ga.is_correct = false THEN 1 END) > 0
        ORDER BY COUNT(CASE WHEN ga.is_correct = false THEN 1 END) DESC
        LIMIT 5
      `, [language.id]);

      const planJson = {
        weaknesses: weaknesses || errors.map(e => e.category),
        focus: focus_areas || errors.slice(0, 3).map(e => e.category),
        weak_chapters: weakChapters.map(c => ({ chapter: c.chapter_number, title: c.title, errors: c.error_count })),
        input_only_weeks: input_only_weeks || 0,
        daily_schedule: {
          grammar: 60,
          palace: 30,
          input: 30,
          focus_drill: 30,
        },
        estimated_weeks: 2,
        created: new Date().toISOString(),
      };

      // Deactivate old plans
      await run(pool,
        'UPDATE training_plans SET active = false WHERE language_id = $1',
        [language.id]
      );

      // Create new plan
      const result = await run(pool, `
        INSERT INTO training_plans (language_id, plan_json, focus_areas, active, estimated_weeks)
        VALUES ($1, $2, $3, true, 2)
        RETURNING id
      `, [language.id, JSON.stringify(planJson), (focus_areas || []).join(',')]);

      return NextResponse.json({ plan_id: result.lastId, plan: planJson });
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
