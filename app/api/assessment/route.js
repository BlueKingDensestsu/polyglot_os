/**
 * app/api/assessment/route.js — Assessment Test API
 * 
 * GET  /api/assessment?lang=de                → Assessment history + 50-hour gate status
 * GET  /api/assessment?lang=de&id=5           → Single assessment details
 * POST /api/assessment { action: 'start' }    → Start a new assessment
 * POST /api/assessment { action: 'submit' }   → Submit test answers
 * POST /api/assessment { action: 'export' }   → Export .txt for Claude grading
 * POST /api/assessment { action: 'import' }   → Import Claude's correction + set gradient
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const assessmentId = searchParams.get('id');

  if (!langCode) return NextResponse.json({ error: 'lang required' }, { status: 400 });

  return withDb(async (pool, { queryAll, queryOne }) => {
    const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    // Single assessment detail
    if (assessmentId) {
      const assessment = await queryOne(pool, 'SELECT * FROM assessments WHERE id = $1', [parseInt(assessmentId)]);
      if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      return NextResponse.json(assessment);
    }

    // Assessment history + gate status
    const assessments = await queryAll(pool, `
      SELECT id, type, taken_at, duration_minutes, overall_level, passed,
        vocabulary_score, grammar_score, reading_score, writing_score,
        hours_logged_at_test
      FROM assessments
      WHERE language_id = $1
      ORDER BY taken_at DESC
    `, [language.id]);

    // Calculate hours logged since last assessment
    const lastAssessment = assessments[0] || null;
    const totalHours = Number(language.total_hours || 0);
    const hoursAtLastTest = lastAssessment ? Number(lastAssessment.hours_logged_at_test || 0) : 0;
    const hoursSinceLastTest = totalHours - hoursAtLastTest;

    // 50-hour gate: test unlocks at 50 hours since last test
    // First test (initial) is always available
    const hasInitial = assessments.some(a => a.type === 'initial');
    const gateHours = 50;
    const hoursUntilUnlock = Math.max(0, gateHours - hoursSinceLastTest);
    const testUnlocked = !hasInitial || hoursUntilUnlock <= 0;

    return NextResponse.json({
      language: {
        code: language.code,
        name: language.name,
        flag: language.flag,
        assessed_level: language.assessed_level,
        total_hours: totalHours,
      },
      assessments,
      gate: {
        has_initial: hasInitial,
        test_unlocked: testUnlocked,
        hours_since_last_test: Math.round(hoursSinceLastTest * 10) / 10,
        hours_until_unlock: Math.round(hoursUntilUnlock * 10) / 10,
        gate_hours: gateHours,
      }
    });
  });
}

export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  // ─── START ASSESSMENT ───
  if (action === 'start') {
    const { lang, type } = body;
    if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });

    return withDbWrite(async (pool, { queryOne, run }) => {
      const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [lang]);
      if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

      const assessmentType = type || 'initial';
      const result = await run(pool, `
        INSERT INTO assessments (language_id, type, taken_at, hours_logged_at_test)
        VALUES ($1, $2, NOW(), $3)
        RETURNING id
      `, [language.id, assessmentType, language.total_hours || 0]);

      return NextResponse.json({
        assessment_id: result.lastId,
        type: assessmentType,
        language: language.name,
        current_level: language.assessed_level,
      });
    });
  }

  // ─── SUBMIT TEST ANSWERS ───
  if (action === 'submit') {
    const { assessment_id, duration_minutes, sections } = body;
    if (!assessment_id) return NextResponse.json({ error: 'assessment_id required' }, { status: 400 });

    return withDbWrite(async (pool, { run }) => {
      // Store the raw answers as JSON in export_text for now
      await run(pool, `
        UPDATE assessments SET 
          duration_minutes = $1,
          export_text = $2
        WHERE id = $3
      `, [duration_minutes, JSON.stringify(sections), assessment_id]);

      return NextResponse.json({ saved: true, assessment_id });
    });
  }

  // ─── EXPORT FOR CLAUDE GRADING ───
  if (action === 'export') {
    const { assessment_id } = body;
    if (!assessment_id) return NextResponse.json({ error: 'assessment_id required' }, { status: 400 });

    return withDb(async (pool, { queryOne }) => {
      const assessment = await queryOne(pool, `
        SELECT a.*, l.name as language_name, l.code as language_code,
          l.flag, l.assessed_level
        FROM assessments a
        JOIN languages l ON a.language_id = l.id
        WHERE a.id = $1
      `, [assessment_id]);

      if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

      const sections = JSON.parse(assessment.export_text || '{}');

      // Build .txt export
      let txt = `${'═'.repeat(60)}\n`;
      txt += `POLYGLOT OS — ${assessment.type.toUpperCase()} ASSESSMENT\n`;
      txt += `Language: ${assessment.language_name} (${assessment.language_code})\n`;
      txt += `Date: ${new Date(assessment.taken_at).toISOString().split('T')[0]}\n`;
      txt += `Duration: ${assessment.duration_minutes || '?'} minutes\n`;
      txt += `Current Level: ${assessment.assessed_level || 'unassessed'}\n`;
      txt += `${'═'.repeat(60)}\n\n`;

      txt += `GRADING INSTRUCTIONS:\n`;
      txt += `─────────────────────\n`;
      txt += `Grade each section on a 0-5 scale.\n`;
      txt += `Then provide:\n`;
      txt += `1. Overall gradient level (A1.1 through C1.5)\n`;
      txt += `   Scale: X.1-X.5 within level, X.6 = promotion\n`;
      txt += `2. Per-section scores (vocabulary, grammar, reading, writing out of 5.0)\n`;
      txt += `3. Top 3 weaknesses to target\n`;
      txt += `4. Recommended training plan focus areas\n`;
      txt += `5. Whether to enforce input-only phase (0/1/2 weeks)\n\n`;
      txt += `Return JSON:\n`;
      txt += `{\n`;
      txt += `  "assessment_id": ${assessment_id},\n`;
      txt += `  "overall_level": "B1.3",\n`;
      txt += `  "vocabulary_score": 3.5,\n`;
      txt += `  "grammar_score": 2.8,\n`;
      txt += `  "reading_score": 4.0,\n`;
      txt += `  "writing_score": 2.5,\n`;
      txt += `  "listening_score": 3.0,\n`;
      txt += `  "speaking_score": 2.0,\n`;
      txt += `  "passed": true,\n`;
      txt += `  "weaknesses": ["passive voice", "dative prepositions", "formal register"],\n`;
      txt += `  "input_only_weeks": 0,\n`;
      txt += `  "training_focus": ["grammar_ch25", "grammar_ch6", "writing_formal_letters"]\n`;
      txt += `}\n\n`;
      txt += `${'═'.repeat(60)}\n\n`;

      // Output each section's answers
      if (sections.vocabulary) {
        txt += `SECTION 1: VOCABULARY (${sections.vocabulary.time_limit || 5} min)\n`;
        txt += `${'─'.repeat(40)}\n`;
        txt += `Translate these words:\n\n`;
        (sections.vocabulary.answers || []).forEach((a, i) => {
          txt += `  ${i + 1}. ${a.word}\n`;
          txt += `     → ${a.answer || '(no answer)'}\n\n`;
        });
      }

      if (sections.grammar) {
        txt += `\nSECTION 2: GRAMMAR (${sections.grammar.time_limit || 10} min)\n`;
        txt += `${'─'.repeat(40)}\n`;
        txt += `Translate into ${assessment.language_name}:\n\n`;
        (sections.grammar.answers || []).forEach((a, i) => {
          txt += `  ${i + 1}. ${a.prompt}\n`;
          txt += `     → ${a.answer || '(no answer)'}\n\n`;
        });
      }

      if (sections.reading) {
        txt += `\nSECTION 3: READING (${sections.reading.time_limit || 5} min)\n`;
        txt += `${'─'.repeat(40)}\n`;
        (sections.reading.answers || []).forEach((a, i) => {
          txt += `  Text ${i + 1}: ${a.text_title || ''}\n`;
          txt += `  Question: ${a.question}\n`;
          txt += `  Answer: ${a.answer || '(no answer)'}\n\n`;
        });
      }

      if (sections.writing) {
        txt += `\nSECTION 4: WRITING (${sections.writing.time_limit || 5} min)\n`;
        txt += `${'─'.repeat(40)}\n`;
        txt += `Prompt: ${sections.writing.prompt || ''}\n\n`;
        txt += `Student's response:\n`;
        txt += `${sections.writing.answer || '(no answer)'}\n\n`;
      }

      txt += `${'═'.repeat(60)}\n`;
      txt += `END OF ASSESSMENT — AWAITING GRADING\n`;

      return NextResponse.json({ export_text: txt, assessment_id });
    });
  }

  // ─── IMPORT CLAUDE'S GRADING ───
  if (action === 'import') {
    const { correction } = body;
    if (!correction || !correction.assessment_id) {
      return NextResponse.json({ error: 'correction with assessment_id required' }, { status: 400 });
    }

    return withDbWrite(async (pool, { queryOne, run }) => {
      const assessment = await queryOne(pool,
        'SELECT * FROM assessments WHERE id = $1', [correction.assessment_id]);
      if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

      // Update assessment with scores
      await run(pool, `
        UPDATE assessments SET
          vocabulary_score = $1,
          grammar_score = $2,
          reading_score = $3,
          listening_score = $4,
          writing_score = $5,
          speaking_score = $6,
          overall_level = $7,
          passed = $8,
          weakness_report = $9,
          correction_json = $10
        WHERE id = $11
      `, [
        correction.vocabulary_score || null,
        correction.grammar_score || null,
        correction.reading_score || null,
        correction.listening_score || null,
        correction.writing_score || null,
        correction.speaking_score || null,
        correction.overall_level,
        correction.passed !== false,
        JSON.stringify({
          weaknesses: correction.weaknesses || [],
          input_only_weeks: correction.input_only_weeks || 0,
          training_focus: correction.training_focus || [],
        }),
        JSON.stringify(correction),
        correction.assessment_id,
      ]);

      // Update language's assessed level
      await run(pool,
        'UPDATE languages SET assessed_level = $1 WHERE id = $2',
        [correction.overall_level, assessment.language_id]
      );

      // Create training plan if focus areas provided
      if (correction.training_focus && correction.training_focus.length > 0) {
        await run(pool, `
          INSERT INTO training_plans 
            (language_id, assessment_id, plan_json, focus_areas, active)
          VALUES ($1, $2, $3, $4, true)
        `, [
          assessment.language_id,
          correction.assessment_id,
          JSON.stringify({
            weaknesses: correction.weaknesses,
            focus: correction.training_focus,
            input_only_weeks: correction.input_only_weeks || 0,
            created: new Date().toISOString(),
          }),
          (correction.training_focus || []).join(','),
        ]);

        // Deactivate old training plans
        await run(pool, `
          UPDATE training_plans SET active = false
          WHERE language_id = $1 AND id != (
            SELECT id FROM training_plans WHERE language_id = $1 ORDER BY created_at DESC LIMIT 1
          )
        `, [assessment.language_id]);
      }

      // Log to journal
      await run(pool, `
        INSERT INTO journal_entries 
          (language_id, entry_date, category, subcategory, duration_minutes, source, title, notes)
        VALUES ($1, CURRENT_DATE, 'output', $2, $3, 'app', $4, $5)
      `, [
        assessment.language_id,
        assessment.type,
        assessment.duration_minutes || 30,
        `${assessment.type === 'initial' ? 'Initial' : 'Level-Up'} Assessment: ${correction.overall_level}`,
        `Scores — Vocab: ${correction.vocabulary_score}, Grammar: ${correction.grammar_score}, Reading: ${correction.reading_score}, Writing: ${correction.writing_score}. Weaknesses: ${(correction.weaknesses || []).join(', ')}`,
      ]);

      return NextResponse.json({
        updated: true,
        new_level: correction.overall_level,
        weaknesses: correction.weaknesses,
        training_focus: correction.training_focus,
      });
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
