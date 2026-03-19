/**
 * lib/db-server.js — PostgreSQL helper for Next.js API routes
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WHAT CHANGED FROM SQLite:                                   ║
 * ║                                                              ║
 * ║  SQLite: withDb() loaded file → ran queries → saved file     ║
 * ║  Postgres: withDb() gets pool connection → runs queries      ║
 * ║            No save step needed — Postgres persists instantly  ║
 * ║                                                              ║
 * ║  SQLite: needed separate "write" mode to save to disk        ║
 * ║  Postgres: every INSERT/UPDATE auto-persists. No withDbWrite ║
 * ║            needed, but kept for API compatibility.            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import pg from 'pg';
import { NextResponse } from 'next/server';

const { Pool } = pg;

// Singleton pool — reused across all API requests in the same process
let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      host:     process.env.PGHOST     || 'localhost',
      port:     process.env.PGPORT     || 5432,
      database: process.env.PGDATABASE || 'polyglot_os',
      user:     process.env.PGUSER     || 'olivier',
      password: process.env.PGPASSWORD || '',
      max: 10,
    });
  }
  return _pool;
}

// Helper functions that match the SQLite API shape
async function queryAll(pool, sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(pool, sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || undefined;
}

async function run(pool, sql, params = []) {
  const result = await pool.query(sql, params);
  return {
    rowCount: result.rowCount,
    rows: result.rows,
    lastId: result.rows[0]?.id || 0,
  };
}

/**
 * Wraps a route handler with database pool access.
 * 
 * SQLite version opened/closed a file each request.
 * Postgres version just hands you the pool — connections are managed automatically.
 * 
 * The handler signature is the same: (pool, { queryAll, queryOne, run }) => NextResponse
 */
export async function withDb(handler) {
  try {
    const pool = getPool();
    const helpers = {
      queryAll: (p, sql, params) => queryAll(p, sql, params),
      queryOne: (p, sql, params) => queryOne(p, sql, params),
      run:      (p, sql, params) => run(p, sql, params),
    };
    return await handler(pool, helpers);
  } catch (e) {
    console.error('DB Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Kept for API compatibility — same as withDb for Postgres
// (SQLite needed a separate "write" wrapper to save the file)
export async function withDbWrite(handler) {
  return withDb(handler);
}
