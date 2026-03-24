/**
 * app/api/journal/route.js — Learning Journal API
 * 
 * GET  /api/journal?lang=de                          → All entries for German
 * GET  /api/journal?lang=de&category=input            → Filtered by category
 * GET  /api/journal?lang=de&from=2026-01-01&to=2026-03-31 → Date range
 * GET  /api/journal?lang=de&view=heatmap              → Daily totals for heatmap
 * GET  /api/journal?lang=de&view=summary              → Weekly summary stats
 * GET  /api/journal?lang=de&view=streak               → Current streak info
 * POST /api/journal                                    → Create manual entry
 */

import { NextResponse } from 'next/server';
import { withDb, withDbWrite } from '@/lib/db-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const langCode = searchParams.get('lang');
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const view = searchParams.get('view');
  const limit = parseInt(searchParams.get('limit') || '100');

  return withDb(async (pool, { queryAll, queryOne }) => {
    // Language filter (optional — if not provided, show all languages)
    let langId = null;
    let langData = null;
    if (langCode) {
      langData = await queryOne(pool, 'SELECT * FROM languages WHERE code = $1', [langCode]);
      if (!langData) return NextResponse.json({ error: 'Language not found' }, { status: 404 });
      langId = langData.id;
    }

    // ─── HEATMAP VIEW ───
    if (view === 'heatmap') {
      const days = parseInt(searchParams.get('days') || '365');
      let sql = `
        SELECT entry_date, 
          SUM(duration_minutes) as total_minutes,
          COUNT(*)::int as entry_count,
          array_agg(DISTINCT subcategory) as activities
        FROM journal_entries
        WHERE entry_date >= CURRENT_DATE - $1 * INTERVAL '1 day'
      `;
      const params = [days];
      let pIdx = 2;

      if (langId) {
        sql += ` AND language_id = $${pIdx}`;
        params.push(langId);
        pIdx++;
      }

      sql += ' GROUP BY entry_date ORDER BY entry_date';

      const heatmap = await queryAll(pool, sql, params);
      return NextResponse.json(heatmap);
    }

    // ─── WEEKLY SUMMARY ───
    if (view === 'summary') {
      const weeks = parseInt(searchParams.get('weeks') || '4');

      let sql = `
        SELECT 
          date_trunc('week', entry_date::timestamp)::date as week_start,
          SUM(duration_minutes) as total_minutes,
          COUNT(*)::int as total_entries,
          COUNT(DISTINCT entry_date)::int as active_days,
          SUM(CASE WHEN category = 'input' THEN duration_minutes ELSE 0 END) as input_minutes,
          SUM(CASE WHEN category = 'output' THEN duration_minutes ELSE 0 END) as output_minutes,
          SUM(CASE WHEN category = 'immersion' THEN duration_minutes ELSE 0 END) as immersion_minutes
        FROM journal_entries
        WHERE entry_date >= CURRENT_DATE - ($1 * 7) * INTERVAL '1 day'
      `;
      const params = [weeks];
      let pIdx = 2;

      if (langId) {
        sql += ` AND language_id = $${pIdx}`;
        params.push(langId);
        pIdx++;
      }

      sql += ' GROUP BY week_start ORDER BY week_start DESC';

      const summaries = await queryAll(pool, sql, params);
      return NextResponse.json(summaries);
    }

    // ─── STREAK ───
    if (view === 'streak') {
      let sql = `
        SELECT DISTINCT entry_date
        FROM journal_entries
        WHERE duration_minutes > 0
      `;
      const params = [];
      let pIdx = 1;

      if (langId) {
        sql += ` AND language_id = $${pIdx}`;
        params.push(langId);
        pIdx++;
      }

      sql += ' ORDER BY entry_date DESC';

      const dates = await queryAll(pool, sql, params);

      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        const dateStr = new Date(dates[i].entry_date).toISOString().split('T')[0];

        if (dateStr === expectedStr) {
          currentStreak++;
        } else if (i === 0) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (dateStr === yesterday.toISOString().split('T')[0]) {
            currentStreak++;
            continue;
          } else break;
        } else break;
      }

      let longest = 0, temp = 1;
      for (let i = 1; i < dates.length; i++) {
        const curr = new Date(dates[i].entry_date);
        const prev = new Date(dates[i - 1].entry_date);
        if ((prev - curr) / 86400000 === 1) temp++;
        else { longest = Math.max(longest, temp); temp = 1; }
      }
      longest = Math.max(longest, temp, currentStreak);

      // Total stats
      let totalSql = `
        SELECT 
          COALESCE(SUM(duration_minutes), 0) as total_minutes,
          COUNT(DISTINCT entry_date)::int as active_days,
          COUNT(*)::int as total_entries
        FROM journal_entries WHERE duration_minutes > 0
      `;
      const totalParams = [];
      if (langId) {
        totalSql += ' AND language_id = $1';
        totalParams.push(langId);
      }
      const totals = await queryOne(pool, totalSql, totalParams);

      return NextResponse.json({
        current_streak: currentStreak,
        longest_streak: longest,
        total_hours: (totals.total_minutes / 60).toFixed(1),
        active_days: totals.active_days,
        total_entries: totals.total_entries,
      });
    }

    // ─── TIMELINE (default) ───
    let sql = `
      SELECT j.*, l.flag, l.name as language_name, l.code as language_code
      FROM journal_entries j
      JOIN languages l ON j.language_id = l.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (langId) {
      sql += ` AND j.language_id = $${pIdx}`;
      params.push(langId);
      pIdx++;
    }
    if (category) {
      sql += ` AND j.category = $${pIdx}`;
      params.push(category);
      pIdx++;
    }
    if (subcategory) {
      sql += ` AND j.subcategory = $${pIdx}`;
      params.push(subcategory);
      pIdx++;
    }
    if (from) {
      sql += ` AND j.entry_date >= $${pIdx}`;
      params.push(from);
      pIdx++;
    }
    if (to) {
      sql += ` AND j.entry_date <= $${pIdx}`;
      params.push(to);
      pIdx++;
    }

    sql += ` ORDER BY j.entry_date DESC, j.created_at DESC LIMIT $${pIdx}`;
    params.push(limit);

    const entries = await queryAll(pool, sql, params);
    return NextResponse.json(entries);
  });
}

export async function POST(request) {
  const body = await request.json();
  const { lang, entry_date, category, subcategory, duration_minutes, title, notes, errors_noted, words_learned } = body;

  if (!lang || !category) {
    return NextResponse.json({ error: 'lang and category required' }, { status: 400 });
  }

  const validCategories = ['input', 'output', 'immersion'];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'category must be: input, output, or immersion' }, { status: 400 });
  }

  return withDbWrite(async (pool, { queryOne, run }) => {
    const language = await queryOne(pool, 'SELECT id FROM languages WHERE code = $1', [lang]);
    if (!language) return NextResponse.json({ error: 'Language not found' }, { status: 404 });

    const result = await run(pool, `
      INSERT INTO journal_entries 
        (language_id, entry_date, category, subcategory, duration_minutes, source, title, notes, errors_noted, words_learned)
      VALUES ($1, $2, $3, $4, $5, 'manual', $6, $7, $8, $9)
      RETURNING id
    `, [
      language.id,
      entry_date || new Date().toISOString().split('T')[0],
      category,
      subcategory || null,
      duration_minutes || 0,
      title || null,
      notes || null,
      errors_noted || null,
      words_learned || null,
    ]);

    // Update daily_stats
    await run(pool, `
      INSERT INTO daily_stats (language_id, stat_date, total_minutes, sessions_count,
        input_minutes, output_minutes, immersion_minutes)
      VALUES ($1, $2, $3, 1,
        CASE WHEN $4 = 'input' THEN $3 ELSE 0 END,
        CASE WHEN $4 = 'output' THEN $3 ELSE 0 END,
        CASE WHEN $4 = 'immersion' THEN $3 ELSE 0 END)
      ON CONFLICT (language_id, stat_date) DO UPDATE SET
        total_minutes = daily_stats.total_minutes + EXCLUDED.total_minutes,
        sessions_count = daily_stats.sessions_count + 1,
        input_minutes = daily_stats.input_minutes + EXCLUDED.input_minutes,
        output_minutes = daily_stats.output_minutes + EXCLUDED.output_minutes,
        immersion_minutes = daily_stats.immersion_minutes + EXCLUDED.immersion_minutes
    `, [language.id, entry_date || new Date().toISOString().split('T')[0], duration_minutes || 0, category]);

    return NextResponse.json({ id: result.lastId, created: true });
  });
}
