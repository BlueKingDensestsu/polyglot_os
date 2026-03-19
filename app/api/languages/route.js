/**
 * app/api/languages/route.js
 * 
 * GET  /api/languages         → All languages with stats
 * GET  /api/languages?code=de → Single language with full stats
 * PATCH /api/languages        → Update language fields
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  return withDb((db, { queryAll, queryOne }) => {
    if (code) {
      const lang = queryOne(db, `
        SELECT l.*,
          (SELECT COUNT(*) FROM grammar_chapters WHERE language_id = l.id) as chapter_count,
          (SELECT COUNT(*) FROM grammar_prompts WHERE exercise_id IN 
            (SELECT id FROM grammar_exercises WHERE chapter_id IN 
              (SELECT id FROM grammar_chapters WHERE language_id = l.id))) as total_prompts,
          (SELECT COUNT(*) FROM grammar_answers WHERE prompt_id IN
            (SELECT gp.id FROM grammar_prompts gp
             JOIN grammar_exercises ge ON gp.exercise_id = ge.id
             JOIN grammar_chapters gc ON ge.chapter_id = gc.id
             WHERE gc.language_id = l.id)) as total_answers,
          (SELECT COUNT(*) FROM landmarks WHERE language_id = l.id) as landmark_count,
          (SELECT COUNT(*) FROM vocabulary WHERE language_id = l.id) as vocab_count,
          (SELECT COUNT(*) FROM sessions WHERE language_id = l.id) as session_count,
          (SELECT COALESCE(SUM(duration_minutes), 0) FROM sessions WHERE language_id = l.id) as total_minutes
        FROM languages l WHERE l.code = ?
      `, [code]);

      if (!lang) return NextResponse.json({ error: 'Language not found' }, { status: 404 });
      return NextResponse.json(lang);
    }

    const languages = queryAll(db, `
      SELECT l.*,
        (SELECT COUNT(*) FROM grammar_chapters WHERE language_id = l.id) as chapter_count,
        (SELECT COUNT(*) FROM grammar_prompts WHERE exercise_id IN 
          (SELECT id FROM grammar_exercises WHERE chapter_id IN 
            (SELECT id FROM grammar_chapters WHERE language_id = l.id))) as total_prompts,
        (SELECT COALESCE(SUM(duration_minutes), 0) FROM sessions WHERE language_id = l.id) as total_minutes,
        (SELECT COUNT(*) FROM vocabulary WHERE language_id = l.id) as vocab_count
      FROM languages l ORDER BY l.sprint_order
    `);
    return NextResponse.json(languages);
  });
}

export async function PATCH(request) {
  const body = await request.json();
  const { code, ...updates } = body;

  if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

  const allowed = [
    'status', 'assessed_level', 'current_phase', 'total_hours',
    'started_at', 'completed_at', 'exam_passed_at', 'exam_score',
    'palace_route', 'palace_landmark_count', 'background_notes'
  ];

  const setClauses = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  return withDbWrite((db, { queryOne, run }) => {
    values.push(code);
    run(db, `UPDATE languages SET ${setClauses.join(', ')} WHERE code = ?`, values);
    const updated = queryOne(db, 'SELECT * FROM languages WHERE code = ?', [code]);
    return NextResponse.json(updated);
  });
}
