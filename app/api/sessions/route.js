/**
 * app/api/sessions/route.js — PostgreSQL version
 * 
 * Key changes: NOW() for timestamps, EXTRACT(EPOCH FROM ...) for duration calc,
 * CURRENT_DATE for date comparisons, INTERVAL for date math
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function POST(request) {
  const { lang, type, chapter_id, notes } = await request.json();
  if (!lang || !type) return NextResponse.json({ error: 'lang and type required' }, { status: 400 });

  return withDbWrite(async (pool, { queryOne, run }) => {
    const language = await queryOne(pool, 'SELECT id FROM languages WHERE code = $1', [lang]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    const result = await run(pool,
      'INSERT INTO sessions (language_id, type, started_at, chapter_id, notes) VALUES ($1, $2, NOW(), $3, $4) RETURNING id',
      [language.id, type, chapter_id || null, notes || null]
    );

    return NextResponse.json({ session_id: result.lastId, started_at: new Date().toISOString(), type });
  });
}

export async function PATCH(request) {
  const { session_id, exercises_completed, prompts_answered, accuracy, notes } = await request.json();
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  return withDbWrite(async (pool, { queryOne, run }) => {
    // Duration: EXTRACT(EPOCH FROM ...) gives seconds, divide by 60 for minutes
    await run(pool, `
      UPDATE sessions SET
        ended_at = NOW(),
        duration_minutes = ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60.0, 1),
        exercises_completed = COALESCE($1, exercises_completed),
        prompts_answered = COALESCE($2, prompts_answered),
        accuracy = COALESCE($3, accuracy),
        notes = COALESCE($4, notes)
      WHERE id = $5
    `, [exercises_completed ?? null, prompts_answered ?? null, accuracy ?? null, notes ?? null, session_id]);

    const session = await queryOne(pool, 'SELECT * FROM sessions WHERE id = $1', [session_id]);

    if (session && session.duration_minutes > 0) {
      const catMap = {
        grammar:'output', palace:'output', writing:'output', speaking:'output',
        reading:'input', listening:'input', shadowing:'input',
        translation:'output', scriptorium:'output', assessment:'output', level_test:'output'
      };

      await run(pool, `
        INSERT INTO journal_entries
          (language_id, entry_date, category, subcategory, duration_minutes, source, session_id, title)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, 'app', $5, $6)
        ON CONFLICT DO NOTHING
      `, [session.language_id, catMap[session.type] || 'output', session.type,
          session.duration_minutes, session.id, `${session.type} session`]);

      // Upsert daily_stats
      await run(pool, `
        INSERT INTO daily_stats (language_id, stat_date, total_minutes, sessions_count, prompts_answered)
        VALUES ($1, CURRENT_DATE, $2, 1, $3)
        ON CONFLICT (language_id, stat_date) DO UPDATE SET
          total_minutes = daily_stats.total_minutes + EXCLUDED.total_minutes,
          sessions_count = daily_stats.sessions_count + 1,
          prompts_answered = daily_stats.prompts_answered + EXCLUDED.prompts_answered
      `, [session.language_id, session.duration_minutes, session.prompts_answered || 0]);

      // Update total_hours
      const totalMins = await queryOne(pool,
        'SELECT COALESCE(SUM(duration_minutes), 0) as m FROM sessions WHERE language_id = $1',
        [session.language_id]);
      await run(pool, 'UPDATE languages SET total_hours = $1 WHERE id = $2',
        [(totalMins.m / 60), session.language_id]);
    }

    return NextResponse.json(session);
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const stats = searchParams.get('stats');
  const limit = parseInt(searchParams.get('limit') || '50');
  if (!langCode) return NextResponse.json({ error: 'lang parameter required' }, { status: 400 });

  return withDb(async (pool, { queryAll, queryOne }) => {
    const language = await queryOne(pool, 'SELECT id FROM languages WHERE code = $1', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    // ─── DAILY STATS (heatmap) ───
    if (stats === 'daily') {
      const days = parseInt(searchParams.get('days') || '365');
      const dailyStats = await queryAll(pool, `
        SELECT * FROM daily_stats
        WHERE language_id = $1 AND stat_date >= CURRENT_DATE - $2 * INTERVAL '1 day'
        ORDER BY stat_date
      `, [language.id, days]);
      return NextResponse.json(dailyStats);
    }

    // ─── STREAK ───
    if (stats === 'streak') {
      const dates = await queryAll(pool, `
        SELECT DISTINCT started_at::date as session_date
        FROM sessions WHERE language_id = $1 AND duration_minutes > 0
        ORDER BY session_date DESC
      `, [language.id]);

      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        const dateStr = new Date(dates[i].session_date).toISOString().split('T')[0];
        if (dateStr === expectedStr) {
          currentStreak++;
        } else if (i === 0) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (dateStr === yesterday.toISOString().split('T')[0]) { currentStreak++; continue; }
          else break;
        } else break;
      }

      let longest = 0, temp = 1;
      for (let i = 1; i < dates.length; i++) {
        const curr = new Date(dates[i].session_date);
        const prev = new Date(dates[i-1].session_date);
        if ((prev - curr) / 86400000 === 1) temp++;
        else { longest = Math.max(longest, temp); temp = 1; }
      }
      longest = Math.max(longest, temp, currentStreak);

      const totals = await queryOne(pool, `
        SELECT COUNT(*)::int as total_sessions,
          COALESCE(SUM(duration_minutes), 0) as total_minutes,
          COALESCE(AVG(duration_minutes), 0) as avg_minutes,
          COUNT(DISTINCT started_at::date)::int as active_days
        FROM sessions WHERE language_id = $1 AND duration_minutes > 0
      `, [language.id]);

      return NextResponse.json({
        current_streak: currentStreak, longest_streak: longest,
        ...totals, total_hours: (totals.total_minutes / 60).toFixed(1)
      });
    }

    // ─── SESSION HISTORY ───
    const sessions = await queryAll(pool, `
      SELECT s.*, gc.chapter_number, gc.title as chapter_title
      FROM sessions s
      LEFT JOIN grammar_chapters gc ON s.chapter_id = gc.id
      WHERE s.language_id = $1
      ORDER BY s.started_at DESC LIMIT $2
    `, [language.id, limit]);

    return NextResponse.json(sessions);
  });
}
