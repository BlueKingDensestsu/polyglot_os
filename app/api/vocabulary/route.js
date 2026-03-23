/**
 * app/api/vocabulary/route.js — Vocabulary status + drill tracking
 * 
 * PATCH /api/vocabulary  { id, status }              → Update word status
 * PATCH /api/vocabulary  { ids, status }              → Batch update
 * POST  /api/vocabulary  { action: 'drill', ... }     → Record drill result
 */

import { NextResponse } from 'next/server';
import { withDbWrite } from '@/lib/db-server';

export async function PATCH(request) {
  const body = await request.json();

  return withDbWrite(async (pool, { run, queryOne }) => {
    // Batch update
    if (body.ids && Array.isArray(body.ids)) {
      const { ids, status } = body;
      if (!['new', 'learning', 'known', 'shaky', 'forgot'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const id of ids) {
          await client.query(
            'UPDATE vocabulary SET status = $1, last_reviewed = NOW(), review_count = review_count + 1 WHERE id = $2',
            [status, id]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      return NextResponse.json({ updated: ids.length });
    }

    // Single update
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }
    if (!['new', 'learning', 'known', 'shaky', 'forgot'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const isCorrect = status === 'known';
    await run(pool, `
      UPDATE vocabulary SET 
        status = $1, 
        last_reviewed = NOW(), 
        review_count = review_count + 1,
        correct_count = correct_count + $2
      WHERE id = $3
    `, [status, isCorrect ? 1 : 0, id]);

    const updated = await queryOne(pool, 'SELECT * FROM vocabulary WHERE id = $1', [id]);
    return NextResponse.json(updated);
  });
}

export async function POST(request) {
  const body = await request.json();

  // ─── RECORD DRILL RESULT ───
  if (body.action === 'drill') {
    const { vocabulary_id, session_id, drill_type, is_correct, response_time_ms } = body;

    if (!vocabulary_id || !drill_type) {
      return NextResponse.json({ error: 'vocabulary_id and drill_type required' }, { status: 400 });
    }
    if (!['meaning', 'gender', 'cloze', 'reverse', 'production'].includes(drill_type)) {
      return NextResponse.json({ error: 'Invalid drill_type' }, { status: 400 });
    }

    return withDbWrite(async (pool, { run }) => {
      await run(pool, `
        INSERT INTO palace_drills (vocabulary_id, session_id, drill_type, is_correct, response_time_ms)
        VALUES ($1, $2, $3, $4, $5)
      `, [vocabulary_id, session_id || null, drill_type, is_correct, response_time_ms || null]);

      // Update vocabulary status based on drill result
      if (is_correct) {
        await run(pool, `
          UPDATE vocabulary SET 
            correct_count = correct_count + 1, 
            review_count = review_count + 1,
            last_reviewed = NOW(),
            status = CASE 
              WHEN status = 'forgot' THEN 'shaky'
              WHEN status = 'shaky' THEN 'learning'
              WHEN status = 'new' THEN 'learning'
              ELSE status 
            END
          WHERE id = $1
        `, [vocabulary_id]);
      } else {
        await run(pool, `
          UPDATE vocabulary SET 
            review_count = review_count + 1,
            last_reviewed = NOW(),
            status = CASE 
              WHEN status = 'known' THEN 'shaky'
              WHEN status = 'learning' THEN 'shaky'
              ELSE 'forgot'
            END
          WHERE id = $1
        `, [vocabulary_id]);
      }

      return NextResponse.json({ recorded: true });
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
