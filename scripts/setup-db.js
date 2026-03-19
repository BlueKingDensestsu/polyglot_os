#!/usr/bin/env node
/**
 * scripts/setup-db.js — Creates all tables in PostgreSQL
 * 
 * PREREQUISITE: The database 'polyglot_os' must exist.
 * Run once:  createdb polyglot_os
 * Then:      npm run db:setup
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SQL CHANGES FROM SQLite → PostgreSQL:                       ║
 * ║                                                              ║
 * ║  INTEGER PRIMARY KEY AUTOINCREMENT  → SERIAL PRIMARY KEY     ║
 * ║    (SERIAL = auto-incrementing integer, PG manages it)       ║
 * ║                                                              ║
 * ║  TEXT for dates                     → TIMESTAMP / DATE       ║
 * ║    (PG has real date/time types with built-in functions)     ║
 * ║                                                              ║
 * ║  DEFAULT (datetime('now'))          → DEFAULT NOW()          ║
 * ║    (PG function for current timestamp)                       ║
 * ║                                                              ║
 * ║  INTEGER for booleans               → BOOLEAN                ║
 * ║    (PG has a real BOOLEAN type: true/false)                  ║
 * ║                                                              ║
 * ║  REAL                               → DOUBLE PRECISION       ║
 * ║    (or NUMERIC for exact decimals)                           ║
 * ║                                                              ║
 * ║  No change: TEXT, INTEGER, UNIQUE, FOREIGN KEY, INDEX        ║
 * ║  No change: INSERT, SELECT, UPDATE, DELETE, JOIN, WHERE      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { pool, queryAll, closePool } = require('../lib/db');

async function main() {
  console.log('🗄️  Setting up Polyglot OS database (PostgreSQL)...\n');

  await pool.query(`

  -- ─────────────────────────────────────
  -- LANGUAGES
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_native TEXT,
    flag TEXT,
    color TEXT,
    script TEXT DEFAULT 'latin',
    palace_route TEXT,
    palace_landmark_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'locked',
    sprint_order INTEGER,
    assessed_level TEXT,
    target_level TEXT DEFAULT 'C1',
    current_phase TEXT,
    total_hours DOUBLE PRECISION DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    exam_passed_at TIMESTAMP,
    exam_score DOUBLE PRECISION,
    background_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- ─────────────────────────────────────
  -- LANDMARKS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS landmarks (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    word_capacity INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- ─────────────────────────────────────
  -- VOCABULARY
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS vocabulary (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    landmark_id INTEGER REFERENCES landmarks(id) ON DELETE SET NULL,
    side TEXT,
    position_at_landmark INTEGER,
    word TEXT NOT NULL,
    translation TEXT,
    gender TEXT,
    part_of_speech TEXT,
    plural TEXT,
    example_sentence TEXT,
    example_translation TEXT,
    example_sentence_2 TEXT,
    example_translation_2 TEXT,
    example_sentence_3 TEXT,
    example_translation_3 TEXT,
    frequency_rank INTEGER,
    image_filename TEXT,
    audio_filename TEXT,
    parent_word_id INTEGER REFERENCES vocabulary(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'anki',
    status TEXT DEFAULT 'new',
    confusion_pairs TEXT,
    last_reviewed TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_vocab_landmark ON vocabulary(landmark_id, side, position_at_landmark);
  CREATE INDEX IF NOT EXISTS idx_vocab_frequency ON vocabulary(language_id, frequency_rank);
  CREATE INDEX IF NOT EXISTS idx_vocab_status ON vocabulary(language_id, status);

  -- ─────────────────────────────────────
  -- GRAMMAR CHAPTERS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS grammar_chapters (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    title_native TEXT,
    rule_summary TEXT,
    exercise_count INTEGER DEFAULT 0,
    prompt_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(language_id, chapter_number)
  );

  -- ─────────────────────────────────────
  -- GRAMMAR EXERCISES
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS grammar_exercises (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES grammar_chapters(id) ON DELETE CASCADE,
    exercise_number INTEGER NOT NULL,
    section_id TEXT,
    title TEXT NOT NULL,
    instruction TEXT,
    type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'B1',
    prompt_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_exercises_chapter ON grammar_exercises(chapter_id, exercise_number);

  -- ─────────────────────────────────────
  -- GRAMMAR PROMPTS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS grammar_prompts (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES grammar_exercises(id) ON DELETE CASCADE,
    prompt_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    correct_answer TEXT,
    hint TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_prompts_exercise ON grammar_prompts(exercise_id, prompt_number);

  -- ─────────────────────────────────────
  -- SESSIONS (must exist before grammar_answers references it)
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_minutes DOUBLE PRECISION,
    exercises_completed INTEGER DEFAULT 0,
    prompts_answered INTEGER DEFAULT 0,
    accuracy DOUBLE PRECISION,
    chapter_id INTEGER REFERENCES grammar_chapters(id) ON DELETE SET NULL,
    notes TEXT,
    auto_tracked BOOLEAN DEFAULT true
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(language_id, started_at);

  -- ─────────────────────────────────────
  -- GRAMMAR ANSWERS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS grammar_answers (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES grammar_prompts(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN,
    error_category TEXT,
    correction TEXT,
    explanation TEXT,
    flagged_difficult BOOLEAN DEFAULT false,
    answered_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_answers_session ON grammar_answers(session_id);
  CREATE INDEX IF NOT EXISTS idx_answers_prompt ON grammar_answers(prompt_id, answered_at);

  -- ─────────────────────────────────────
  -- JOURNAL ENTRIES
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    duration_minutes DOUBLE PRECISION,
    source TEXT DEFAULT 'manual',
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    title TEXT,
    notes TEXT,
    errors_noted TEXT,
    words_learned TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(language_id, entry_date);

  -- ─────────────────────────────────────
  -- ASSESSMENTS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    taken_at TIMESTAMP NOT NULL,
    duration_minutes DOUBLE PRECISION,
    vocabulary_score DOUBLE PRECISION,
    grammar_score DOUBLE PRECISION,
    reading_score DOUBLE PRECISION,
    listening_score DOUBLE PRECISION,
    writing_score DOUBLE PRECISION,
    speaking_score DOUBLE PRECISION,
    overall_level TEXT,
    passed BOOLEAN,
    hours_logged_at_test DOUBLE PRECISION,
    weakness_report TEXT,
    training_plan TEXT,
    export_text TEXT,
    correction_json TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- ─────────────────────────────────────
  -- ERROR PATTERNS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS error_patterns (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    severity TEXT DEFAULT 'moderate',
    occurrence_count INTEGER DEFAULT 0,
    last_occurred TIMESTAMP,
    first_occurred TIMESTAMP,
    improving BOOLEAN DEFAULT false,
    is_interference_pair BOOLEAN DEFAULT false,
    pair_item_a TEXT,
    pair_item_b TEXT,
    discrimination_drill_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(language_id, category)
  );

  CREATE INDEX IF NOT EXISTS idx_errors_severity ON error_patterns(language_id, severity, occurrence_count);

  -- ─────────────────────────────────────
  -- TRAINING PLANS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS training_plans (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    plan_json TEXT NOT NULL,
    focus_areas TEXT,
    daily_schedule TEXT,
    estimated_weeks INTEGER
  );

  -- ─────────────────────────────────────
  -- PALACE DRILLS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS palace_drills (
    id SERIAL PRIMARY KEY,
    vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
    drill_type TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    drilled_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_drills_vocab ON palace_drills(vocabulary_id, drill_type, drilled_at);

  -- ─────────────────────────────────────
  -- DAILY STATS
  -- ─────────────────────────────────────
  CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    language_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    total_minutes DOUBLE PRECISION DEFAULT 0,
    input_minutes DOUBLE PRECISION DEFAULT 0,
    output_minutes DOUBLE PRECISION DEFAULT 0,
    immersion_minutes DOUBLE PRECISION DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    prompts_answered INTEGER DEFAULT 0,
    words_drilled INTEGER DEFAULT 0,
    accuracy DOUBLE PRECISION,
    UNIQUE(language_id, stat_date)
  );

  CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(language_id, stat_date);

  `);

  // ─── Verify ───
  const tables = await queryAll(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const indexes = await queryAll(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    ORDER BY indexname
  `);

  console.log(`✅ Created ${tables.length} tables:`);
  tables.forEach(t => console.log(`   📋 ${t.tablename}`));
  console.log(`\n✅ Created ${indexes.length} custom indexes:`);
  indexes.forEach(i => console.log(`   🔍 ${i.indexname}`));

  await closePool();
  console.log('\n🎉 Setup complete! Next: npm run db:seed');
}

main().catch(e => { console.error('❌ Setup failed:', e.message); process.exit(1); });
