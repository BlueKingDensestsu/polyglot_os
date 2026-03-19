/**
 * app/api/languages/route.js — PostgreSQL version
 * 
 * Changes from SQLite: $1/$2 params, COALESCE for aggregations, 
 * ::int casts for COUNT(*), no other logic changes.
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  return withDb(async (pool, { queryAll, queryOne }) => {
    if (code) {
      const lang = await queryOne(pool, `
        SELECT l.*,
          (SELECT COUNT(*)::int FROM grammar_chapters WHERE language_id = l.id) as chapter_count,
          (SELECT COUNT(*)::int FROM grammar_prompts WHERE exercise_id IN 
            (SELECT id FROM grammar_exercises WHERE chapter_id IN 
              (SELECT id FROM grammar_chapters WHERE language_id = l.id))) as total_prompts,
          (SELECT COUNT(*)::int FROM grammar_answers WHERE prompt_id IN
            (SELECT gp.id FROM grammar_prompts gp
             JOIN grammar_exercises ge ON gp.exercise_id = ge.id
             JOIN grammar_chapters gc ON ge.chapter_id = gc.id
             WHERE gc.language_id = l.id)) as total_answers,
          (SELECT COUNT(*)::int FROM landmarks WHERE language_id = l.id) as landmark_count,
          (SELECT COUNT(*)::int FROM vocabulary WHERE language_id = l.id) as vocab_count,
          (SELECT COUNT(*)::int FROM sessions WHERE language_id = l.id) as session_count,
          (SELECT COALESCE(SUM(duration_minutes), 0) FROM sessions WHERE language_id = l.id) as total_minutes
        FROM languages l WHERE l.code = $1
      `, [code]);
      if (!lang) return NextResponse.json({ error: 'Language not found' }, { status: 404 });
      return NextResponse.json(lang);
    }

    const languages = await queryAll(pool, `
      SELECT l.*,
        (SELECT COUNT(*)::int FROM grammar_chapters WHERE language_id = l.id) as chapter_count,
        (SELECT COUNT(*)::int FROM grammar_prompts WHERE exercise_id IN 
          (SELECT id FROM grammar_exercises WHERE chapter_id IN 
            (SELECT id FROM grammar_chapters WHERE language_id = l.id))) as total_prompts,
        (SELECT COALESCE(SUM(duration_minutes), 0) FROM sessions WHERE language_id = l.id) as total_minutes,
        (SELECT COUNT(*)::int FROM vocabulary WHERE language_id = l.id) as vocab_count
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
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  return withDbWrite(async (pool, { queryOne, run }) => {
    values.push(code);
    await run(pool, `UPDATE languages SET ${setClauses.join(', ')} WHERE code = $${paramIndex}`, values);
    const updated = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [code]);
    return NextResponse.json(updated);
  });
}
