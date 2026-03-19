/**
 * app/api/exercises/route.js
 * 
 * POST { action: 'answer', prompt_id, user_answer }          → Save single answer
 * POST { action: 'answers', session_id, answers: [...] }     → Save batch answers
 * POST { action: 'export', lang, chapter_number? }           → Generate .txt for Claude
 * POST { action: 'import', corrections: [...] }              → Import Claude's corrections
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

    return withDbWrite((db, { run }) => {
      const result = run(db,
        'INSERT INTO grammar_answers (prompt_id, session_id, user_answer, flagged_difficult) VALUES (?,?,?,?)',
        [prompt_id, session_id || null, user_answer, flagged_difficult ? 1 : 0]
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

    return withDbWrite((db, { run, queryOne }) => {
      db.run('BEGIN TRANSACTION');
      for (const item of answers) {
        run(db,
          'INSERT INTO grammar_answers (prompt_id, session_id, user_answer, flagged_difficult) VALUES (?,?,?,?)',
          [item.prompt_id, session_id || null, item.user_answer, item.flagged_difficult ? 1 : 0]
        );
      }
      db.run('COMMIT');

      // Update session stats if session_id provided
      if (session_id) {
        const answered = queryOne(db,
          'SELECT COUNT(*) as c FROM grammar_answers WHERE session_id = ?', [session_id]);
        const exCompleted = queryOne(db, `
          SELECT COUNT(DISTINCT ge.id) as c FROM grammar_answers ga
          JOIN grammar_prompts gp ON ga.prompt_id = gp.id
          JOIN grammar_exercises ge ON gp.exercise_id = ge.id
          WHERE ga.session_id = ?`, [session_id]);
        run(db,
          'UPDATE sessions SET prompts_answered = ?, exercises_completed = ? WHERE id = ?',
          [answered.c, exCompleted.c, session_id]
        );
      }

      return NextResponse.json({ saved: answers.length });
    });
  }

  // ─── EXPORT FOR CLAUDE CORRECTION ───
  if (action === 'export') {
    const { lang, chapter_number, session_id } = body;
    if (!lang) return NextResponse.json({ error: 'lang required' }, { status: 400 });

    return withDbWrite((db, { queryAll, queryOne }) => {
      const language = queryOne(db, 'SELECT * FROM languages WHERE code = ?', [lang]);
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
        WHERE gc.language_id = ?
      `;
      const params = [language.id];

      if (chapter_number) { sql += ' AND gc.chapter_number = ?'; params.push(chapter_number); }
      if (session_id) { sql += ' AND ga.session_id = ?'; params.push(session_id); }
      sql += ' ORDER BY gc.chapter_number, ge.exercise_number, gp.prompt_number';

      const rows = queryAll(db, sql, params);
      if (rows.length === 0) {
        return NextResponse.json({ error: 'No answers found to export' }, { status: 404 });
      }

      // Build .txt export
      let txt = `=== POLYGLOT OS — ${language.name} Grammar Correction ===\n`;
      txt += `Date: ${new Date().toISOString().split('T')[0]}\n`;
      txt += `Level: ${language.assessed_level || 'unknown'}\n\n`;
      txt += `GRADING INSTRUCTIONS:\n`;
      txt += `For each answer: mark correct/incorrect, categorize errors\n`;
      txt += `(case/gender/conjugation/word_order/register/vocabulary),\n`;
      txt += `provide correction + brief rule explanation.\n\n`;
      txt += `Return JSON array:\n`;
      txt += `[{"prompt_id":<id>,"is_correct":true/false,"error_category":"...","correction":"...","explanation":"..."}]\n\n`;
      txt += `${'═'.repeat(55)}\n\n`;

      let curCh = null, curEx = null;
      for (const row of rows) {
        if (row.chapter_number !== curCh) {
          curCh = row.chapter_number;
          txt += `\n${'─'.repeat(45)}\nCHAPTER ${row.chapter_number}: ${row.chapter_title}\n${'─'.repeat(45)}\n\n`;
          curEx = null;
        }
        if (row.exercise_number !== curEx) {
          curEx = row.exercise_number;
          txt += `  Exercise ${row.exercise_number}: ${row.exercise_title}\n`;
          txt += `  Type: ${row.exercise_type}`;
          if (row.instruction) txt += ` | ${row.instruction}`;
          txt += '\n\n';
        }
        const flag = row.flagged_difficult ? ' ⚠️' : '';
        txt += `    [prompt_id:${row.prompt_id}] ${row.prompt_number}. ${row.prompt_text}\n`;
        txt += `       → ${row.user_answer}${flag}\n\n`;
      }

      txt += `${'═'.repeat(55)}\nTotal: ${rows.length} | Flagged: ${rows.filter(r => r.flagged_difficult).length}\n`;

      return NextResponse.json({
        export_text: txt,
        prompt_count: rows.length,
        language: language.name,
        chapter: chapter_number || 'all'
      });
    });
  }

  // ─── IMPORT CLAUDE'S CORRECTIONS ───
  if (action === 'import') {
    const { corrections } = body;
    if (!Array.isArray(corrections)) {
      return NextResponse.json({ error: 'corrections array required' }, { status: 400 });
    }

    return withDbWrite((db, { run, queryOne, queryAll }) => {
      let corrected = 0, errors = 0;

      db.run('BEGIN TRANSACTION');
      for (const item of corrections) {
        // Update the most recent answer for this prompt
        const latest = queryOne(db,
          'SELECT id FROM grammar_answers WHERE prompt_id = ? ORDER BY answered_at DESC LIMIT 1',
          [item.prompt_id]
        );
        if (latest) {
          run(db,
            'UPDATE grammar_answers SET is_correct=?, error_category=?, correction=?, explanation=? WHERE id=?',
            [item.is_correct ? 1 : 0, item.error_category || null, item.correction || null, item.explanation || null, latest.id]
          );
          corrected++;
          if (!item.is_correct) errors++;
        }
      }
      db.run('COMMIT');

      // Aggregate error categories
      const errorCategories = {};
      corrections.filter(c => !c.is_correct && c.error_category).forEach(c => {
        errorCategories[c.error_category] = (errorCategories[c.error_category] || 0) + 1;
      });

      // Update error_patterns table
      if (corrections.length > 0) {
        const promptInfo = queryOne(db, `
          SELECT gc.language_id FROM grammar_prompts gp
          JOIN grammar_exercises ge ON gp.exercise_id = ge.id
          JOIN grammar_chapters gc ON ge.chapter_id = gc.id
          WHERE gp.id = ?
        `, [corrections[0].prompt_id]);

        if (promptInfo) {
          for (const [category, count] of Object.entries(errorCategories)) {
            const existing = queryOne(db,
              'SELECT id, occurrence_count FROM error_patterns WHERE language_id=? AND category=?',
              [promptInfo.language_id, category]
            );
            if (existing) {
              run(db,
                'UPDATE error_patterns SET occurrence_count=occurrence_count+?, last_occurred=datetime("now") WHERE id=?',
                [count, existing.id]
              );
            } else {
              run(db,
                'INSERT INTO error_patterns (language_id,category,occurrence_count,last_occurred,first_occurred) VALUES (?,?,?,datetime("now"),datetime("now"))',
                [promptInfo.language_id, category, count]
              );
            }
          }
        }
      }

      const total = corrections.length;
      const correct = corrections.filter(c => c.is_correct).length;

      return NextResponse.json({
        imported: corrected,
        total_errors: errors,
        error_breakdown: errorCategories,
        accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) + '%' : 'N/A'
      });
    });
  }

  return NextResponse.json({ error: 'Unknown action. Use: answer, answers, export, import' }, { status: 400 });
}
