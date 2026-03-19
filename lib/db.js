/**
 * lib/db.js — PostgreSQL connection pool for Polyglot OS
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WHAT CHANGED FROM SQLite:                                   ║
 * ║                                                              ║
 * ║  SQLite: loads entire DB into memory from a single file      ║
 * ║  Postgres: connects over TCP to a running database server    ║
 * ║                                                              ║
 * ║  SQLite: synchronous — db.prepare(sql).all()                 ║
 * ║  Postgres: asynchronous — await pool.query(sql)              ║
 * ║                                                              ║
 * ║  SQLite: one process, one file, no server                    ║
 * ║  Postgres: server process, multiple connections, pool        ║
 * ║                                                              ║
 * ║  The "Pool" concept: instead of opening a new connection     ║
 * ║  for every query (slow), you keep 10-20 connections open     ║
 * ║  and reuse them. This is how every production app works.     ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * Used by: scripts (setup-db, seed, import)
 * For API routes: use lib/db-server.js instead (ESM imports)
 */

const { Pool } = require('pg');

// Connection config — reads from environment or falls back to defaults
// Set these in a .env file or export in your terminal
const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  port:     process.env.PGPORT     || 5432,
  database: process.env.PGDATABASE || 'polyglot_os',
  user:     process.env.PGUSER     || 'olivier',
  password: process.env.PGPASSWORD || '',
  max: 10,  // max connections in pool
});

/**
 * Run a query and return all rows
 * 
 * SQLite was:  db.prepare(sql).all(params)        — synchronous
 * Postgres is: await pool.query(sql, params)       — async
 * 
 * Placeholder syntax also changed:
 *   SQLite:   WHERE code = ?            (question marks)
 *   Postgres: WHERE code = $1           (numbered: $1, $2, $3...)
 */
async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * Run a query and return the first row
 */
async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || undefined;
}

/**
 * Run INSERT/UPDATE/DELETE and return { rowCount, rows }
 * 
 * To get the inserted ID in Postgres, add RETURNING id to your INSERT:
 *   INSERT INTO languages (code, name) VALUES ($1, $2) RETURNING id
 * 
 * SQLite used: lastInsertRowid
 * Postgres uses: RETURNING clause (more powerful — can return any columns)
 */
async function run(sql, params = []) {
  const result = await pool.query(sql, params);
  return {
    rowCount: result.rowCount,
    rows: result.rows,
    // Convenience: if RETURNING was used, grab the first row's id
    lastId: result.rows[0]?.id || 0,
  };
}

/**
 * Run multiple statements inside a transaction
 * 
 * Same concept as SQLite transactions, but uses a dedicated client
 * from the pool to ensure all queries run on the same connection.
 * 
 * Usage:
 *   await transaction(async (client) => {
 *     await client.query('INSERT INTO ...', [...]);
 *     await client.query('INSERT INTO ...', [...]);
 *   });
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Close all connections (call on script exit)
 */
async function closePool() {
  await pool.end();
}

module.exports = { pool, queryAll, queryOne, run, transaction, closePool };
