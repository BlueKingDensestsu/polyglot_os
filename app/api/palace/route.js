/**
 * app/api/palace/route.js — Palace landmarks + vocabulary API
 * 
 * GET /api/palace?lang=de                    → All landmarks for German
 * GET /api/palace?lang=de&landmark=5         → Vocabulary for landmark #5
 * GET /api/palace?lang=de&review=weakest     → All Shaky + Forgot words
 * GET /api/palace?lang=de&stats=true         → Summary stats per landmark
 */

import { NextResponse } from 'next/server';
import { withDb } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const landmarkPos = searchParams.get('landmark');
  const review = searchParams.get('review');
  const stats = searchParams.get('stats');

  if (!langCode) return NextResponse.json({ error: 'lang parameter required' }, { status: 400 });

  return withDb(async (pool, { queryAll, queryOne }) => {
    const language = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    // ─── REVIEW WEAKEST ───
    if (review === 'weakest') {
      const words = await queryAll(pool, `
        SELECT v.*, l.name as landmark_name, l.position as landmark_position
        FROM vocabulary v
        JOIN landmarks l ON v.landmark_id = l.id
        WHERE v.language_id = $1 AND v.status IN ('shaky', 'forgot')
        ORDER BY 
          CASE v.status WHEN 'forgot' THEN 0 WHEN 'shaky' THEN 1 END,
          v.last_reviewed ASC NULLS FIRST
      `, [language.id]);
      return NextResponse.json({ mode: 'weakest', words, count: words.length });
    }

    // ─── SINGLE LANDMARK VOCABULARY ───
    if (landmarkPos) {
      const landmark = await queryOne(pool,
        'SELECT * FROM landmarks WHERE language_id = $1 AND position = $2',
        [language.id, parseInt(landmarkPos)]
      );
      if (!landmark) return NextResponse.json({ error: 'Landmark not found' }, { status: 404 });

      const words = await queryAll(pool, `
        SELECT * FROM vocabulary
        WHERE landmark_id = $1
        ORDER BY side, position_at_landmark
      `, [landmark.id]);

      const left = words.filter(w => w.side === 'left');
      const right = words.filter(w => w.side === 'right');

      return NextResponse.json({
        landmark,
        words: { left, right, all: words },
        stats: {
          total: words.length,
          known: words.filter(w => w.status === 'known').length,
          shaky: words.filter(w => w.status === 'shaky').length,
          forgot: words.filter(w => w.status === 'forgot').length,
          new: words.filter(w => w.status === 'new').length,
        }
      });
    }

    // ─── ALL LANDMARKS WITH STATS ───
    const landmarks = await queryAll(pool, `
      SELECT l.*,
        (SELECT COUNT(*)::int FROM vocabulary WHERE landmark_id = l.id) as word_count,
        (SELECT COUNT(*)::int FROM vocabulary WHERE landmark_id = l.id AND status = 'known') as known_count,
        (SELECT COUNT(*)::int FROM vocabulary WHERE landmark_id = l.id AND status = 'shaky') as shaky_count,
        (SELECT COUNT(*)::int FROM vocabulary WHERE landmark_id = l.id AND status = 'forgot') as forgot_count,
        (SELECT MAX(last_reviewed) FROM vocabulary WHERE landmark_id = l.id) as last_reviewed
      FROM landmarks l
      WHERE l.language_id = $1
      ORDER BY l.position
    `, [language.id]);

    const totalVocab = await queryOne(pool,
      'SELECT COUNT(*)::int as total FROM vocabulary WHERE language_id = $1', [language.id]);

    return NextResponse.json({
      language: { flag: language.flag, name: language.name, palace_route: language.palace_route },
      landmarks,
      total_words: totalVocab.total
    });
  });
}
