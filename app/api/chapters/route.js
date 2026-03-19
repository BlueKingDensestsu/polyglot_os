/**
 * app/api/chapters/route.js — PostgreSQL version
 */

import { NextResponse } from 'next/server';
import { withDb } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const chapterNum = searchParams.get('chapter');
  if (!langCode) return NextResponse.json({ error: 'lang parameter required' }, { status: 400 });

  return withDb(async (pool, { queryAll, queryOne }) => {
    const language = await queryOne(pool, 'SELECT id FROM languages WHERE code = $1', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    if (chapterNum) {
      const chapter = await queryOne(pool,
        'SELECT * FROM grammar_chapters WHERE language_id = $1 AND chapter_number = $2',
        [language.id, parseInt(chapterNum)]
      );
      if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });

      const exercises = await queryAll(pool,
        'SELECT * FROM grammar_exercises WHERE chapter_id = $1 ORDER BY exercise_number',
        [chapter.id]
      );

      for (const exercise of exercises) {
        exercise.prompts = await queryAll(pool, `
          SELECT gp.*,
            (SELECT ga.user_answer FROM grammar_answers ga 
             WHERE ga.prompt_id = gp.id ORDER BY ga.answered_at DESC LIMIT 1) as last_answer,
            (SELECT ga.is_correct FROM grammar_answers ga 
             WHERE ga.prompt_id = gp.id ORDER BY ga.answered_at DESC LIMIT 1) as last_correct,
            (SELECT ga.flagged_difficult FROM grammar_answers ga 
             WHERE ga.prompt_id = gp.id ORDER BY ga.answered_at DESC LIMIT 1) as flagged
          FROM grammar_prompts gp
          WHERE gp.exercise_id = $1
          ORDER BY gp.prompt_number
        `, [exercise.id]);
      }

      return NextResponse.json({ chapter, exercises });
    }

    const chapters = await queryAll(pool, `
      SELECT gc.*,
        (SELECT COUNT(DISTINCT ga.prompt_id)::int
         FROM grammar_answers ga
         JOIN grammar_prompts gp ON ga.prompt_id = gp.id
         JOIN grammar_exercises ge ON gp.exercise_id = ge.id
         WHERE ge.chapter_id = gc.id) as prompts_answered,
        (SELECT COUNT(*)::int
         FROM grammar_answers ga
         JOIN grammar_prompts gp ON ga.prompt_id = gp.id
         JOIN grammar_exercises ge ON gp.exercise_id = ge.id
         WHERE ge.chapter_id = gc.id AND ga.flagged_difficult = true) as flagged_count
      FROM grammar_chapters gc
      WHERE gc.language_id = $1
      ORDER BY gc.chapter_number
    `, [language.id]);

    return NextResponse.json(chapters);
  });
}
