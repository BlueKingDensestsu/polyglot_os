/**
 * lib/db-server.js — Database helper for Next.js API routes
 * 
 * Next.js API routes use ESM imports. This module wraps lib/db.js
 * and provides a clean async interface for route handlers.
 * 
 * Usage in a route:
 *   import { withDb } from '@/lib/db-server';
 *   export async function GET(request) {
 *     return withDb((db, { queryAll, queryOne, run }) => {
 *       const langs = queryAll(db, 'SELECT * FROM languages');
 *       return NextResponse.json(langs);
 *     });
 *   }
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const DB_PATH = path.join(process.cwd(), 'data', 'polyglot.db');

let _SQL = null;

async function loadDb() {
  if (!_SQL) {
    _SQL = await initSqlJs();
  }
  if (!fs.existsSync(DB_PATH)) {
    throw new Error('Database not found. Run: npm run db:setup && npm run db:seed');
  }
  const buffer = fs.readFileSync(DB_PATH);
  const db = new _SQL.Database(buffer);
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function saveAndClose(db) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  db.close();
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || undefined;
}

function run(db, sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const lastId = queryOne(db, 'SELECT last_insert_rowid() as id');
  return { changes, lastId: lastId ? lastId.id : 0 };
}

/**
 * Wraps a route handler with database lifecycle management.
 * Opens the DB, runs your handler, saves if writes happened, closes.
 * 
 * @param {function} handler - (db, helpers) => NextResponse
 * @param {boolean} writes - Set true if handler does INSERT/UPDATE/DELETE
 */
export async function withDb(handler, writes = false) {
  let db;
  try {
    db = await loadDb();
    const helpers = { queryAll, queryOne, run };
    const result = await handler(db, helpers);
    if (writes) saveAndClose(db);
    else db.close();
    return result;
  } catch (e) {
    if (db) db.close();
    console.error('DB Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Same as withDb but always saves (for write operations)
 */
export async function withDbWrite(handler) {
  return withDb(handler, true);
}
