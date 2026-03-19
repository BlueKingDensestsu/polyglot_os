# POLYGLOT OS — Layer 3 & Layer 4 (PostgreSQL) Complete Guide

---

## PART 0: INSTALL PostgreSQL (one-time, 10 minutes)

### macOS
```bash
brew install postgresql@16
brew services start postgresql@16

# Create your user and database
createuser -s olivier        # superuser for dev (fine locally)
createdb polyglot_os         # the database itself
psql polyglot_os             # connect and verify — type \q to quit
```

### Ubuntu / Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql   # auto-start on boot

# Create your user and database
sudo -u postgres createuser -s olivier
sudo -u postgres createdb polyglot_os -O olivier
psql polyglot_os             # connect and verify — type \q to quit
```

### Windows
Download from https://www.postgresql.org/download/windows/
Run the installer, set a password, keep port 5432.
Then in pgAdmin or Command Prompt:
```
createdb polyglot_os
```

### Verify it works
```bash
psql polyglot_os -c "SELECT version();"
# Should show: PostgreSQL 16.x on ...
```

---

## PART 1: LAYER 3 — HOW TO USE, MAINTAIN & RUN

*(Same as the SQLite guide — nothing changes in Layer 3.
  Layer 3 is React + Next.js + Tailwind. The database isn't involved yet.)*

```bash
# First time setup
git clone https://github.com/YOUR_USERNAME/polyglot-os.git
cd polyglot-os
npm install
npm run dev          # → http://localhost:3000

# Daily workflow
cd polyglot-os
npm run dev          # that's it
```

Refer to the previous guide for React concepts, Tailwind reference, routing explanation,
and troubleshooting. All of that is identical regardless of database choice.

---

## PART 2: LAYER 4 — PostgreSQL DATABASE SETUP

### Install the Node.js driver
```bash
npm install pg       # that's it — no native compilation, no build tools
```

### Configure the connection
```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with your settings:
PGHOST=localhost
PGPORT=5432
PGDATABASE=polyglot_os
PGUSER=olivier
PGPASSWORD=
```

### Run the pipeline
```bash
npm run db:setup                                          # 14 tables + 13 indexes
npm run db:seed                                           # 10 languages + 89 landmarks
node scripts/import-exercises.js de data/exercises_database.json  # 9,155 prompts
npm run db:verify                                         # check counts
npm run dev                                               # start the app
```

### Query your data directly with psql
```bash
psql polyglot_os

# Try these:
SELECT flag, name, status, assessed_level FROM languages ORDER BY sprint_order;
SELECT chapter_number, title, prompt_count FROM grammar_chapters WHERE language_id = 1;
SELECT COUNT(*) FROM grammar_prompts;  -- should be 9,155

# Useful psql commands:
\dt          -- list all tables
\d languages -- describe a table's columns
\di          -- list all indexes
\q           -- quit
```

---

## PART 3: ANNOTATED DIFF — Every Change from SQLite → PostgreSQL

This is the reference for doing it yourself. Every section shows the SQLite code,
the PostgreSQL replacement, and WHY it changed.

---

### CHANGE 1: Connection model

**SQLite (sql.js):** Load entire .db file into memory → query → save file back.
```js
// SQLite
const initSqlJs = require('sql.js');
const SQL = await initSqlJs();
const buffer = fs.readFileSync('data/polyglot.db');
const db = new SQL.Database(buffer);
// ... queries ...
fs.writeFileSync('data/polyglot.db', Buffer.from(db.export()));
db.close();
```

**PostgreSQL (pg):** Connect over TCP to a running server. No file loading/saving.
```js
// PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({ database: 'polyglot_os', user: 'olivier' });
// ... queries ... (auto-persisted)
await pool.end();
```

**WHY:** PostgreSQL is a client-server database. You send queries over a network
socket. The server handles persistence, concurrency, and caching. No manual file I/O.

**CONSEQUENCE:** The `saveDb()` function is gone entirely. Every INSERT/UPDATE
persists immediately. The `withDbWrite()` wrapper still exists but is identical
to `withDb()` — kept for API compatibility so your routes don't need changes.

---

### CHANGE 2: Placeholder syntax

**SQLite:** `?` for every parameter
```sql
SELECT * FROM languages WHERE code = ? AND status = ?
-- Params: ['de', 'active']
```

**PostgreSQL:** `$1, $2, $3...` numbered placeholders
```sql
SELECT * FROM languages WHERE code = $1 AND status = $2
-- Params: ['de', 'active']
```

**WHY:** PostgreSQL uses numbered placeholders so you can reuse the same parameter
multiple times in one query (`WHERE id = $1 OR parent_id = $1`). SQLite can't do this.

**CONSEQUENCE:** Every query in every file needed its `?` replaced with `$1, $2...`.
This is the most tedious part of the migration but requires zero thinking — just count.

---

### CHANGE 3: Auto-increment primary keys

**SQLite:**
```sql
CREATE TABLE languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);
```

**PostgreSQL:**
```sql
CREATE TABLE languages (
  id SERIAL PRIMARY KEY,
  ...
);
```

**WHY:** `SERIAL` is PostgreSQL's shorthand for "create an integer column with an
auto-incrementing sequence attached". Same result, different keyword.

**MODERN ALTERNATIVE:** PostgreSQL 10+ also supports `GENERATED ALWAYS AS IDENTITY`
which is the SQL standard. `SERIAL` is simpler and what most tutorials use.

---

### CHANGE 4: Data types

**SQLite → PostgreSQL mappings used in our schema:**

| SQLite                | PostgreSQL          | Why                                    |
|-----------------------|---------------------|----------------------------------------|
| `TEXT` for dates      | `TIMESTAMP`         | PG has real datetime types with math    |
| `TEXT` for booleans   | `BOOLEAN`           | PG has real true/false                  |
| `REAL`                | `DOUBLE PRECISION`  | PG's double-precision float             |
| `INTEGER` (boolean)   | `BOOLEAN`           | PG uses true/false, not 0/1            |

**CONSEQUENCE:** In your JavaScript code, boolean values are now `true`/`false`
instead of `1`/`0`. No `.flagged_difficult === 1` checks — just `.flagged_difficult`.

---

### CHANGE 5: Date/time functions

**SQLite:**
```sql
DEFAULT (datetime('now'))           -- current timestamp
date('now')                         -- current date
date('now', '-30 days')             -- 30 days ago
julianday('now') - julianday(col)   -- time difference
```

**PostgreSQL:**
```sql
DEFAULT NOW()                       -- current timestamp
CURRENT_DATE                        -- current date
CURRENT_DATE - INTERVAL '30 days'   -- 30 days ago
EXTRACT(EPOCH FROM (NOW() - col))   -- time difference in seconds
```

**For duration calculation (sessions):**
```sql
-- SQLite
ROUND((julianday('now') - julianday(started_at)) * 1440, 1)

-- PostgreSQL
ROUND(EXTRACT(EPOCH FROM (NOW() - started_at)) / 60.0, 1)
```

**WHY:** SQLite stores dates as text strings. PostgreSQL has native TIMESTAMP/DATE
types with built-in arithmetic, timezone support, and formatting functions.

---

### CHANGE 6: Getting the inserted row's ID

**SQLite:**
```js
db.run('INSERT INTO languages (code, name) VALUES (?, ?)');
const id = db.prepare('SELECT last_insert_rowid() as id').get().id;
```

**PostgreSQL:**
```js
const result = await pool.query(
  'INSERT INTO languages (code, name) VALUES ($1, $2) RETURNING id',
  ['de', 'German']
);
const id = result.rows[0].id;
```

**WHY:** `RETURNING` is more powerful — you can return ANY columns from the
inserted row, not just the ID. This is a PostgreSQL extension that many other
databases have adopted.

---

### CHANGE 7: INSERT OR IGNORE → ON CONFLICT DO NOTHING

**SQLite:**
```sql
INSERT OR IGNORE INTO languages (code, name) VALUES (?, ?);
```

**PostgreSQL:**
```sql
INSERT INTO languages (code, name) VALUES ($1, $2)
ON CONFLICT (code) DO NOTHING;
```

**WHY:** PostgreSQL requires you to specify WHICH unique constraint to check.
This is actually better — it's explicit about what conflict you're handling.

---

### CHANGE 8: Upsert (INSERT or UPDATE)

**SQLite:**
```sql
INSERT INTO daily_stats (language_id, stat_date, total_minutes)
VALUES (?, date('now'), ?)
ON CONFLICT(language_id, stat_date) DO UPDATE SET
  total_minutes = total_minutes + excluded.total_minutes;
```

**PostgreSQL:**
```sql
INSERT INTO daily_stats (language_id, stat_date, total_minutes)
VALUES ($1, CURRENT_DATE, $2)
ON CONFLICT (language_id, stat_date) DO UPDATE SET
  total_minutes = daily_stats.total_minutes + EXCLUDED.total_minutes;
```

**WHY:** Almost identical. Two differences: `$1/$2` params and `daily_stats.total_minutes`
requires the table name prefix (SQLite inferred it). `EXCLUDED` is the same concept.

---

### CHANGE 9: COUNT(*) returns bigint in PostgreSQL

**SQLite:** `COUNT(*)` returns a regular integer.
**PostgreSQL:** `COUNT(*)` returns `bigint` (8-byte integer) — which JavaScript's
`pg` driver returns as a string, not a number.

**Fix:** Cast to int in every COUNT:
```sql
-- PostgreSQL
SELECT COUNT(*)::int as c FROM languages;
```

**WHY:** This is a common gotcha. PostgreSQL is conservative about integer overflow.
The `::int` cast tells it "I know this count fits in 4 bytes, give me a number."

---

### CHANGE 10: Async everywhere

**SQLite (sql.js):**
```js
const rows = queryAll(db, 'SELECT ...', []);       // synchronous
const one = queryOne(db, 'SELECT ...', []);         // synchronous
```

**PostgreSQL (pg):**
```js
const rows = await queryAll(pool, 'SELECT ...', []);  // async
const one = await queryOne(pool, 'SELECT ...', []);    // async
```

**WHY:** Network I/O is inherently asynchronous. The query travels over TCP to the
PostgreSQL server, which processes it and sends results back. `await` pauses your
code until the result arrives, without blocking other requests.

**CONSEQUENCE:** Every route handler function and every helper call needs `async/await`.
This is the second-most-tedious change after placeholder syntax — add `await` before
every `queryAll`, `queryOne`, and `run` call.

---

### CHANGE 11: Table creation order matters more

**SQLite:** Foreign key enforcement is off by default. You can create tables in any order.
**PostgreSQL:** Foreign keys are enforced immediately. If `grammar_answers` references
`sessions`, the `sessions` table must be created FIRST.

**FIX:** Moved `sessions` table creation before `grammar_answers` in setup-db.js.

---

### FILES UNCHANGED (no edits needed)

| File | Why unchanged |
|------|--------------|
| `next.config.js` | `pg` is pure JS, no webpack externals needed |
| `.gitignore` | Remove the `data/polyglot.db` entries (no .db file anymore) |
| All React components | Frontend calls `/api/*` routes — doesn't know or care about the DB |
| Export .txt format | The text format sent to Claude is identical |
| Correction JSON format | The JSON you import back is identical |

---

## PART 4: DOING IT YOURSELF (Practice Guide)

If you want to convert the SQLite version yourself instead of using the pre-built files:

**Step 1 (30 min):** Open `scripts/setup-db.js` and change every data type:
- `AUTOINCREMENT` → delete it, add `SERIAL` before `PRIMARY KEY`
- `TEXT DEFAULT (datetime('now'))` → `TIMESTAMP DEFAULT NOW()`
- `INTEGER` (where used as boolean) → `BOOLEAN`
- `REAL` → `DOUBLE PRECISION`
- Move `sessions` table before `grammar_answers`

**Step 2 (30 min):** Rewrite `lib/db.js`:
- Replace `require('sql.js')` with `require('pg')`
- Replace file load/save with `new Pool({...})`
- Make `queryAll/queryOne/run` async
- Remove `saveDb()` entirely

**Step 3 (20 min):** Update `lib/db-server.js`:
- Same Pool-based approach
- `withDb` is simpler — no open/save/close cycle

**Step 4 (30 min):** Fix every `?` → `$1, $2...` in seed + import scripts.
- Add `RETURNING id` to every INSERT where you need the new ID.
- Add `::int` to every `COUNT(*)`.

**Step 5 (30 min):** Same placeholder fix in all 4 API routes.
- Add `await` before every query call.
- Change `datetime('now')` → `NOW()`, `date('now')` → `CURRENT_DATE`.
- Change `flagged_difficult = 1` → `flagged_difficult = true`.

**Total: ~2.5 hours.** The SQL logic doesn't change. It's mechanical find-and-replace.

---

## "I can..." Checklist (Layer 4 Done When All Pass)

- [ ] PostgreSQL is installed and `psql polyglot_os` connects
- [ ] `npm run db:setup` creates 14 tables (verify with `\dt` in psql)
- [ ] `npm run db:seed` creates 10 languages + 89 landmarks
- [ ] `node scripts/import-exercises.js de data/exercises_database.json` imports 9,155 prompts
- [ ] `npm run db:verify` shows correct counts
- [ ] `psql polyglot_os -c "SELECT flag, name FROM languages ORDER BY sprint_order"` shows all 10
- [ ] `http://localhost:3000/api/languages` returns JSON with 10 languages
- [ ] `http://localhost:3000/api/chapters?lang=de` returns chapters
- [ ] `http://localhost:3000/api/chapters?lang=de&chapter=25` returns Passiv exercises with prompts
- [ ] I can submit an answer via the API and see it in psql
- [ ] I can export answers, paste to Claude, import corrections back
- [ ] I can explain what a connection pool is (can explain on YouTube)
- [ ] I committed: `git commit -m "Layer 4: PostgreSQL database with full exercise import"`

---

## Data Engineering Skills Gained

| Skill | Why it matters |
|-------|---------------|
| PostgreSQL installation + config | Every data team uses Postgres |
| psql CLI | Standard tool for DB admin and debugging |
| Connection pools | How every production app manages DB connections |
| `$1, $2` parameterized queries | Prevents SQL injection — required knowledge |
| `RETURNING` clause | PostgreSQL power feature, used in ETL pipelines |
| `ON CONFLICT DO UPDATE` (upsert) | Core pattern for incremental data loading |
| Transactions with `BEGIN/COMMIT` | Data integrity in multi-step operations |
| `EXTRACT`, `INTERVAL`, date math | Time-series analysis fundamentals |
| `::int` type casting | PostgreSQL's explicit type system |
| Foreign keys + cascading deletes | Referential integrity in data warehouses |

Every one of these shows up in data engineering interviews and daily work.
