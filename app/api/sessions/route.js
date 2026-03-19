/**
 * app/api/sessions/route.js
 * 
 * POST  /api/sessions                      → Start a new session
 * PATCH /api/sessions                      → End/update a session
 * GET   /api/sessions?lang=de              → Session history
 * GET   /api/sessions?lang=de&stats=daily  → Daily stats (for heatmap)
 * GET   /api/sessions?lang=de&stats=streak → Current & longest streak
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function POST(request) {
  const { lang, type, chapter_id, notes } = await request.json();
  if (!lang || !type) return NextResponse.json({ error: 'lang and type required' }, { status: 400 });

  return withDbWrite((db, { queryOne, run }) => {
    const language = queryOne(db, 'SELECT id FROM languages WHERE code = ?', [lang]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    const result = run(db,
      "INSERT INTO sessions (language_id, type, started_at, chapter_id, notes) VALUES (?, ?, datetime('now'), ?, ?)",
      [language.id, type, chapter_id || null, notes || null]
    );

    return NextResponse.json({
      session_id: result.lastId,
      started_at: new Date().toISOString(),
      type
    });
  });
}

export async function PATCH(request) {
  const { session_id, exercises_completed, prompts_answered, accuracy, notes } = await request.json();
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  return withDbWrite((db, { queryOne, run }) => {
    // End the session and calculate duration
    run(db, `
      UPDATE sessions SET
        ended_at = datetime('now'),
        duration_minutes = ROUND((julianday('now') - julianday(started_at)) * 1440, 1),
        exercises_completed = COALESCE(?, exercises_completed),
        prompts_answered = COALESCE(?, prompts_answered),
        accuracy = COALESCE(?, accuracy),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `, [exercises_completed ?? null, prompts_answered ?? null, accuracy ?? null, notes ?? null, session_id]);

    const session = queryOne(db, 'SELECT * FROM sessions WHERE id = ?', [session_id]);

    // Auto-create journal entry
    if (session && session.duration_minutes > 0) {
      const catMap = {
        grammar: 'output', palace: 'output', writing: 'output', speaking: 'output',
        reading: 'input', listening: 'input', shadowing: 'input',
        translation: 'output', scriptorium: 'output',
        assessment: 'output', level_test: 'output'
      };

      run(db, `
        INSERT OR IGNORE INTO journal_entries
          (language_id, entry_date, category, subcategory, duration_minutes, source, session_id, title)
        VALUES (?, date('now'), ?, ?, ?, 'app', ?, ?)
      `, [session.language_id, catMap[session.type] || 'output', session.type,
          session.duration_minutes, session.id, `${session.type} session`]);

      // Update daily_stats
      run(db, `
        INSERT INTO daily_stats (language_id, stat_date, total_minutes, sessions_count, prompts_answered)
        VALUES (?, date('now'), ?, 1, ?)
        ON CONFLICT(language_id, stat_date) DO UPDATE SET
          total_minutes = total_minutes + excluded.total_minutes,
          sessions_count = sessions_count + 1,
          prompts_answered = prompts_answered + excluded.prompts_answered
      `, [session.language_id, session.duration_minutes, session.prompts_answered || 0]);

      // Update total_hours on language
      const totalMins = queryOne(db,
        'SELECT COALESCE(SUM(duration_minutes), 0) as m FROM sessions WHERE language_id = ?',
        [session.language_id]);
      run(db, 'UPDATE languages SET total_hours = ? WHERE id = ?',
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

  return withDb((db, { queryAll, queryOne }) => {
    const language = queryOne(db, 'SELECT id FROM languages WHERE code = ?', [langCode]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    // ─── DAILY STATS (heatmap) ───
    if (stats === 'daily') {
      const days = parseInt(searchParams.get('days') || '365');
      const dailyStats = queryAll(db, `
        SELECT * FROM daily_stats
        WHERE language_id = ? AND stat_date >= date('now', '-' || ? || ' days')
        ORDER BY stat_date
      `, [language.id, days]);
      return NextResponse.json(dailyStats);
    }

    // ─── STREAK ───
    if (stats === 'streak') {
      const dates = queryAll(db, `
        SELECT DISTINCT date(started_at) as session_date
        FROM sessions WHERE language_id = ? AND duration_minutes > 0
        ORDER BY session_date DESC
      `, [language.id]);

      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (dates[i].session_date === expectedStr) {
          currentStreak++;
        } else if (i === 0) {
          // No session today yet — check yesterday
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (dates[i].session_date === yesterday.toISOString().split('T')[0]) {
            currentStreak++;
            continue;
          } else break;
        } else break;
      }

      // Longest streak
      let longest = 0, temp = 1;
      for (let i = 1; i < dates.length; i++) {
        const curr = new Date(dates[i].session_date);
        const prev = new Date(dates[i-1].session_date);
        if ((prev - curr) / 86400000 === 1) temp++;
        else { longest = Math.max(longest, temp); temp = 1; }
      }
      longest = Math.max(longest, temp, currentStreak);

      const totals = queryOne(db, `
        SELECT COUNT(*) as total_sessions,
          COALESCE(SUM(duration_minutes), 0) as total_minutes,
          COALESCE(AVG(duration_minutes), 0) as avg_minutes,
          COUNT(DISTINCT date(started_at)) as active_days
        FROM sessions WHERE language_id = ? AND duration_minutes > 0
      `, [language.id]);

      return NextResponse.json({
        current_streak: currentStreak,
        longest_streak: longest,
        ...totals,
        total_hours: (totals.total_minutes / 60).toFixed(1)
      });
    }

    // ─── SESSION HISTORY ───
    const sessions = queryAll(db, `
      SELECT s.*, gc.chapter_number, gc.title as chapter_title
      FROM sessions s
      LEFT JOIN grammar_chapters gc ON s.chapter_id = gc.id
      WHERE s.language_id = ?
      ORDER BY s.started_at DESC LIMIT ?
    `, [language.id, limit]);

    return NextResponse.json(sessions);
  });
}
