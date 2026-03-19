#!/usr/bin/env node
/**
 * scripts/setup-db.js — Creates polyglot.db with all tables
 * 
 * Run: npm run db:setup    OR    node scripts/setup-db.js
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
 */

const { getDb, saveDb, queryAll, closeDb } = require('../lib/db');

async function main() {
  console.log('🗄️  Setting up Polyglot OS database...\n');

  const db = await getDb();

  // ═══════════════════════════════════════════════════════════
  // ALL TABLES
  // ═══════════════════════════════════════════════════════════

  db.exec(`

  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    total_hours REAL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    exam_passed_at TEXT,
    exam_score REAL,
    background_notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS landmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    word_capacity INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    landmark_id INTEGER,
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
    parent_word_id INTEGER,
    source TEXT DEFAULT 'anki',
    status TEXT DEFAULT 'new',
    confusion_pairs TEXT,
    last_reviewed TEXT,
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_word_id) REFERENCES vocabulary(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_vocab_landmark ON vocabulary(landmark_id, side, position_at_landmark);
  CREATE INDEX IF NOT EXISTS idx_vocab_frequency ON vocabulary(language_id, frequency_rank);
  CREATE INDEX IF NOT EXISTS idx_vocab_status ON vocabulary(language_id, status);

  CREATE TABLE IF NOT EXISTS grammar_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    title_native TEXT,
    rule_summary TEXT,
    exercise_count INTEGER DEFAULT 0,
    prompt_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    UNIQUE(language_id, chapter_number)
  );

  CREATE TABLE IF NOT EXISTS grammar_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    exercise_number INTEGER NOT NULL,
    section_id TEXT,
    title TEXT NOT NULL,
    instruction TEXT,
    type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'B1',
    prompt_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chapter_id) REFERENCES grammar_chapters(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_exercises_chapter ON grammar_exercises(chapter_id, exercise_number);

  CREATE TABLE IF NOT EXISTS grammar_prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    prompt_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    correct_answer TEXT,
    hint TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (exercise_id) REFERENCES grammar_exercises(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_prompts_exercise ON grammar_prompts(exercise_id, prompt_number);

  CREATE TABLE IF NOT EXISTS grammar_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    session_id INTEGER,
    user_answer TEXT NOT NULL,
    is_correct INTEGER,
    error_category TEXT,
    correction TEXT,
    explanation TEXT,
    flagged_difficult INTEGER DEFAULT 0,
    answered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (prompt_id) REFERENCES grammar_prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_answers_session ON grammar_answers(session_id);
  CREATE INDEX IF NOT EXISTS idx_answers_prompt ON grammar_answers(prompt_id, answered_at);

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_minutes REAL,
    exercises_completed INTEGER DEFAULT 0,
    prompts_answered INTEGER DEFAULT 0,
    accuracy REAL,
    chapter_id INTEGER,
    notes TEXT,
    auto_tracked INTEGER DEFAULT 1,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES grammar_chapters(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(language_id, started_at);

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    duration_minutes REAL,
    source TEXT DEFAULT 'manual',
    session_id INTEGER,
    title TEXT,
    notes TEXT,
    errors_noted TEXT,
    words_learned TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(language_id, entry_date);

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    taken_at TEXT NOT NULL,
    duration_minutes REAL,
    vocabulary_score REAL,
    grammar_score REAL,
    reading_score REAL,
    listening_score REAL,
    writing_score REAL,
    speaking_score REAL,
    overall_level TEXT,
    passed INTEGER,
    hours_logged_at_test REAL,
    weakness_report TEXT,
    training_plan TEXT,
    export_text TEXT,
    correction_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS error_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    severity TEXT DEFAULT 'moderate',
    occurrence_count INTEGER DEFAULT 0,
    last_occurred TEXT,
    first_occurred TEXT,
    improving INTEGER DEFAULT 0,
    is_interference_pair INTEGER DEFAULT 0,
    pair_item_a TEXT,
    pair_item_b TEXT,
    discrimination_drill_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_error_unique ON error_patterns(language_id, category);
  CREATE INDEX IF NOT EXISTS idx_errors_severity ON error_patterns(language_id, severity, occurrence_count);

  CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    assessment_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    active INTEGER DEFAULT 1,
    plan_json TEXT NOT NULL,
    focus_areas TEXT,
    daily_schedule TEXT,
    estimated_weeks INTEGER,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS palace_drills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocabulary_id INTEGER NOT NULL,
    session_id INTEGER,
    drill_type TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    response_time_ms INTEGER,
    drilled_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_drills_vocab ON palace_drills(vocabulary_id, drill_type, drilled_at);

  CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER NOT NULL,
    stat_date TEXT NOT NULL,
    total_minutes REAL DEFAULT 0,
    input_minutes REAL DEFAULT 0,
    output_minutes REAL DEFAULT 0,
    immersion_minutes REAL DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    prompts_answered INTEGER DEFAULT 0,
    words_drilled INTEGER DEFAULT 0,
    accuracy REAL,
    UNIQUE(language_id, stat_date)
  );

  CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(language_id, stat_date);

  `);

  saveDb();

  // ─── Verify ───
  const tables = queryAll(db,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  const indexes = queryAll(db,
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );

  console.log(`✅ Created ${tables.length} tables:`);
  tables.forEach(t => console.log(`   📋 ${t.name}`));
  console.log(`\n✅ Created ${indexes.length} indexes:`);
  indexes.forEach(i => console.log(`   🔍 ${i.name}`));

  const fs = require('fs');
  const size = fs.statSync(require('../lib/db').DB_PATH).size;
  console.log(`\n🗄️  Database: ${require('../lib/db').DB_PATH} (${(size/1024).toFixed(1)} KB)`);

  closeDb();
  console.log('\n🎉 Setup complete! Next: npm run db:seed');
}

main().catch(e => { console.error('❌ Setup failed:', e); process.exit(1); });
