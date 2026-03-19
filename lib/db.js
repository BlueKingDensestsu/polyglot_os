/**
 * lib/db.js — Database connection + query helpers for Polyglot OS
 * 
 * Uses sql.js (pure JavaScript SQLite compiled via Emscripten).
 * Works everywhere — no native compilation, no build tools needed.
 * 
 * The database loads into memory from a file and saves back on writes.
 * For our data volume (< 50MB), this is perfectly fast.
 * 
 * ──────────────────────────────────────────────────────────────
 * UPGRADE PATH: If you ever need more performance (100k+ rows),
 * swap sql.js for better-sqlite3. The SQL is identical.
 * Just change this file — nothing else needs to change.
 * ──────────────────────────────────────────────────────────────
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Database lives at project_root/data/polyglot.db
const DB_PATH = path.join(process.cwd(), 'data', 'polyglot.db');
const DB_DIR = path.dirname(DB_PATH);

let _db = null;
let _SQL = null;

/**
 * Initialize sql.js and load or create the database
 */
async function getDb() {
  if (_db) return _db;

  if (!_SQL) {
    _SQL = await initSqlJs();
  }

  // Create data/ directory if needed
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Load existing database or create empty one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(buffer);
  } else {
    _db = new _SQL.Database();
  }

  // Enable foreign key enforcement
  _db.run('PRAGMA foreign_keys = ON');

  return _db;
}

/**
 * Save the in-memory database to disk
 * Call this after any INSERT/UPDATE/DELETE
 */
function saveDb() {
  if (_db) {
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Run a SELECT query and return all rows as objects
 */
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Run a SELECT query and return the first row
 */
function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

/**
 * Run an INSERT/UPDATE/DELETE statement
 */
function run(db, sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const lastId = queryOne(db, 'SELECT last_insert_rowid() as id');
  return { changes, lastId: lastId ? lastId.id : 0 };
}

/**
 * Run multiple statements inside a transaction
 */
function transaction(db, fn) {
  db.run('BEGIN TRANSACTION');
  try {
    fn(db);
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

/**
 * Close the database and save
 */
function closeDb() {
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

process.on('exit', () => { if (_db) { try { saveDb(); _db.close(); } catch(e){} _db = null; } });
process.on('SIGINT', () => { closeDb(); process.exit(); });
process.on('SIGTERM', () => { closeDb(); process.exit(); });

module.exports = { getDb, saveDb, queryAll, queryOne, run, transaction, closeDb, DB_PATH };
