/**
 * app/api/exercises/route.js — PostgreSQL version
 * 
 * Key changes: $1/$2 params, RETURNING id, true/false booleans,
 * NOW() instead of datetime('now')
 */

import { NextResponse } from 'next/server';
import { withDbWrite } from '@/lib/db-server';

export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  // ─── SINGLE ANSWER ───
  if (action === 'answer') {
    const { prompt_id, session_id, user_answer, flagged_difficult } = body;
    if (!prompt_id || !user_answer) {
      return NextResponse.json({ error: 'prompt_id and user_answer required' }, { status: 400 });
    }
    return withDbWrite(async (pool, { run }) => {
      const result = await run(pool,
        'INSERT INTO grammar_answers (prompt_id, session_id, user_answer, flagged_difficult) VALUES ($1,$2,$3,$4) RETURNING id',
        [prompt_id, session_id || null, user_answer, !!flagged_difficult]
      );
      return NextResponse.json({ id: result.lastId, saved: true });
    });
  }

  // ─── BATCH ANSWERS ───
  if (action === 'answers') {
    const { answers, session_id } = body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'answers array required' }, { status: 400 });
    }
    return withDbWrite(async (pool, { run, queryOne }) => {
      // Postgres transactions in the pool
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of answers) {
          await client.query(
            'INSERT INTO grammar_answers (prompt_id, session_id, user_answer, flagged_difficult) VALUES ($1,$2,$3,$4)',
            [item.prompt_id, session_id || null, item.user_answer, !!item.flagged_difficult]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      if (session_id) {
        const answered = await queryOne(pool,
          'SELECT COUNT(*)::int as c FROM grammar_answers WHERE session_id = $1', [session_id]);
        const exCompleted = await queryOne(pool, `
          SELECT COUNT(DISTINCT ge.id)::int as c FROM grammar_answers ga
          JOIN grammar_prompts gp ON ga.prompt_id = gp.id
          JOIN grammar_exercises ge ON gp.exercise_id = ge.id
          WHERE ga.session_id = $1`, [session_id]);
        await run(pool,
          'UPDATE sessions SET prompts_answered = $1, exercises_completed = $2 WHERE id = $3',
          [answered.c, exCompleted.c, session_id]);
      }

      return NextResponse.json({ saved: answers.length });
    });
  }

  // ─── EXPORT FOR CLAUDE CORRECTION ───
  if (action === 'export') {
    const { lang, chapter_number, session_id } = body;
    if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });

    return withDbWrite(async (pool, { queryAll, queryOne }) => {
      const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [lang]);
      if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

      let sql = `
        SELECT gc.chapter_number, gc.title as chapter_title,
          ge.exercise_number, ge.title as exercise_title, ge.type as exercise_type, ge.instruction,
          gp.id as prompt_id, gp.prompt_number, gp.text as prompt_text,
          ga.user_answer, ga.flagged_difficult, ga.answered_at
        FROM grammar_answers ga
        JOIN grammar_prompts gp ON ga.prompt_id = gp.id
        JOIN grammar_exercises ge ON gp.exercise_id = ge.id
        JOIN grammar_chapters gc ON ge.chapter_id = gc.id
        WHERE gc.language_id = $1
      `;
      const params = [language.id];
      let pIdx = 2;

      if (chapter_number) { sql += ` AND gc.chapter_number = $${pIdx}`; params.push(chapter_number); pIdx++; }
      if (session_id) { sql += ` AND ga.session_id = $${pIdx}`; params.push(session_id); pIdx++; }
      sql += ' ORDER BY gc.chapter_number, ge.exercise_number, gp.prompt_number';

      const rows = await queryAll(pool, sql, params);
      if (rows.length === 0) return NextResponse.json({ error: 'No answers found' }, { status: 404 });

      // Build .txt export (identical to SQLite version)
      let txt = `=== POLYGLOT OS — ${language.name} Grammar Correction ===\n`;
      txt += `Date: ${new Date().toISOString().split('T')[0]}\nLevel: ${language.assessed_level || 'unknown'}\n\n`;
      txt += `GRADING INSTRUCTIONS:\nFor each answer: mark correct/incorrect, categorize errors\n`;
      txt += `(case/gender/conjugation/word_order/register/vocabulary),\nprovide correction + brief rule explanation.\n\n`;
      txt += `Return JSON array:\n[{"prompt_id":<id>,"is_correct":true/false,"error_category":"...","correction":"...","explanation":"..."}]\n\n`;
      txt += `${'═'.repeat(55)}\n\n`;

      let curCh = null, curEx = null;
      for (const row of rows) {
        if (row.chapter_number !== curCh) {
          curCh = row.chapter_number; curEx = null;
          txt += `\n${'─'.repeat(45)}\nCHAPTER ${row.chapter_number}: ${row.chapter_title}\n${'─'.repeat(45)}\n\n`;
        }
        if (row.exercise_number !== curEx) {
          curEx = row.exercise_number;
          txt += `  Exercise ${row.exercise_number}: ${row.exercise_title}\n  Type: ${row.exercise_type}`;
          if (row.instruction) txt += ` | ${row.instruction}`;
          txt += '\n\n';
        }
        const flag = row.flagged_difficult ? ' ⚠️' : '';
        txt += `    [prompt_id:${row.prompt_id}] ${row.prompt_number}. ${row.prompt_text}\n       → ${row.user_answer}${flag}\n\n`;
      }
      txt += `${'═'.repeat(55)}\nTotal: ${rows.length} | Flagged: ${rows.filter(r => r.flagged_difficult).length}\n`;

      return NextResponse.json({ export_text: txt, prompt_count: rows.length, language: language.name, chapter: chapter_number || 'all' });
    });
  }

  // ─── IMPORT CLAUDE'S CORRECTIONS ───
  if (action === 'import') {
    const { corrections } = body;
    if (!Array.isArray(corrections)) return NextResponse.json({ error: 'corrections array required' }, { status: 400 });

    return withDbWrite(async (pool, { run, queryOne }) => {
      let corrected = 0, errors = 0;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of corrections) {
          const latest = (await client.query(
            'SELECT id FROM grammar_answers WHERE prompt_id = $1 ORDER BY answered_at DESC LIMIT 1',
            [item.prompt_id]
          )).rows[0];
          if (latest) {
            await client.query(
              'UPDATE grammar_answers SET is_correct=$1, error_category=$2, correction=$3, explanation=$4 WHERE id=$5',
              [!!item.is_correct, item.error_category || null, item.correction || null, item.explanation || null, latest.id]
            );
            corrected++;
            if (!item.is_correct) errors++;
          }
        }
        await client.query('COMMIT');
      } catch(e) { await client.query('ROLLBACK'); throw e; }
      finally { client.release(); }

      // Update error_patterns
      const errorCategories = {};
      corrections.filter(c => !c.is_correct && c.error_category).forEach(c => {
        errorCategories[c.error_category] = (errorCategories[c.error_category] || 0) + 1;
      });

      if (corrections.length > 0) {
        const promptInfo = await queryOne(pool, `
          SELECT gc.language_id FROM grammar_prompts gp
          JOIN grammar_exercises ge ON gp.exercise_id = ge.id
          JOIN grammar_chapters gc ON ge.chapter_id = gc.id
          WHERE gp.id = $1
        `, [corrections[0].prompt_id]);

        if (promptInfo) {
          for (const [category, count] of Object.entries(errorCategories)) {
            await run(pool, `
              INSERT INTO error_patterns (language_id, category, occurrence_count, last_occurred, first_occurred)
              VALUES ($1, $2, $3, NOW(), NOW())
              ON CONFLICT (language_id, category) DO UPDATE SET
                occurrence_count = error_patterns.occurrence_count + $3,
                last_occurred = NOW()
            `, [promptInfo.language_id, category, count]);
          }
        }
      }

      const total = corrections.length;
      const correct = corrections.filter(c => c.is_correct).length;
      return NextResponse.json({
        imported: corrected, total_errors: errors, error_breakdown: errorCategories,
        accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) + '%' : 'N/A'
      });
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
