# POLYGLOT OS — Full Product Specification
## The Language Mastery Sprint System

**Author:** Olivier × Claude  
**Date:** March 17, 2026  
**Version:** 1.0  
**Stack:** Next.js + SQLite + Tailwind CSS  

---

## 1. PRODUCT VISION

### What Is It
A local-first language learning app that takes you from wherever you are to C1 fluency in one language at a time through serial intensive sprints, using a hybrid method combining the Mental Palace system, grammar drills, shadowing, bidirectional translation, comprehensible input tracking, and adaptive weakness targeting.

### Who Is It For
Olivier first. Then anyone who learns the way Olivier learns — by building tools, not by drilling passively. Designed to be explainable on YouTube, walkable component by component.

### Core Philosophy
- **Serial sprints, not parallel maintenance.** One language gets full focus until C1 exam is passed. Maybe a second for variety. No maintenance burden — after passing, the language lives through natural consumption (reading, watching, listening for pleasure).
- **Active retrieval only.** No multiple choice. No passive review. Every interaction requires production: write the sentence, transform the grammar, recall from the palace.
- **The system adapts to YOU, not the reverse.** Initial assessment determines your real level. Error pattern tracking reshapes what the app serves you. The app gets harder where you're weak and skips what you already know.
- **Everything in one place.** Every minute of language learning — whether in the app, on italki, watching Netflix, reading a book — gets logged in one journal. One source of truth.

### The Sprint Model
```
ASSESS (30 min) → SPRINT (weeks/months) → TEST (1 hour) → PASS? → NEXT LANGUAGE
                        ↑                        |
                        └── FAIL: regenerate ─────┘
                            training plan from
                            weakness analysis
```

---

## 2. LANGUAGE PORTFOLIO (Starting Points)

Each language enters the app with a pre-loaded background profile that becomes the first journal entry. These are Olivier's actual starting points:

| # | Language | Flag | Starting Level | Key Assets | Key Gaps | Sprint Order |
|---|----------|------|---------------|------------|----------|-------------|
| 1 | German | 🇩🇪 | B1 certified | 4,214-word palace, grammar trainer, 1,306 exercises, reading Quality Land | Passive voice, preterite irregulars, formal writing, ~4,000 words short of C1 | NOW (Sprint 1) |
| 2 | Spanish | 🇪🇸 | Dormant B2 (fluent 2017) | Full grammar framework, massive dormant vocabulary, phonetic comfort | 9 years dormant, needs reactivation + C1 formal register | Sprint 2 |
| 3 | Greek | 🇬🇷 | A2 | 200-hour vocab deck, grammar studied, spoke with locals Santorini 2020 | Palace mapping needed, verb conjugation system, listening at speed | Sprint 3 |
| 4 | Russian | 🇷🇺 | A1 grammar / A0 vocab | Grammar book completed multiple times, case system understood | Vocabulary is almost zero. Cyrillic reading speed. Production. | Sprint 4 |
| 5 | Korean | 🇰🇷 | A1 reading | Can read/pronounce Hangul confidently (TTMIK 2018-2019) | Vocabulary, grammar (SOV, particles, honorifics), listening | Sprint 5 |
| 6 | Portuguese | 🇵🇹 | A2-B1 | Conversational from Lisbon 2022, Spanish+French transfer | Portuguese-specific grammar, listening (compressed phonetics), false friends | Sprint 6 |
| 7 | Japanese | 🇯🇵 | 900 kanji (Heisig) | 900 kanji meanings + years of anime listening exposure | Kanji readings (on/kun), grammar, vocabulary in context, speaking | Sprint 7 |
| 8 | Italian | 🇮🇹 | A0 (but cascade) | French L1 + Spanish + Portuguese = can already read A2-B1 | Italian-specific grammar, pronunciation, active production | Sprint 8 |
| 9 | Arabic | 🇸🇦 | Pre-A1 | Brother is Arabic, familiar with sounds, tried alphabet | Everything: script mastery, MSA vs dialect, root system, grammar | Sprint 9 |
| 10 | Mandarin | 🇨🇳 | Pre-A1 + kanji | 900 Japanese kanji transfer, watched Mandarin-dubbed anime | Pinyin, tones, hanzi readings, grammar, vocabulary | Sprint 10 |

---

## 3. FEATURE LIST

### 3.1 LANGUAGE DASHBOARD (Home Screen)

**What it shows:**
- Current sprint language (large, prominent, with progress ring)
- Optional secondary language (smaller card)
- Completed languages (greyed out with C1 badge and completion date)
- Upcoming languages (locked, showing only flag + name + starting level)

**Data displayed per active language:**
- Current CEFR level (assessed, not guessed)
- Hours logged (total + today + this week)
- Palace progress (X / total words loaded)
- Grammar progress (chapters completed / total, accuracy %)
- Error pattern summary (top 3 weakness categories)
- Days in current sprint
- Streak counter (consecutive days with ≥1 session logged)

---

### 3.2 INITIAL ASSESSMENT TEST (30 minutes)

**Triggered:** First time you log a session for any language. Cannot be skipped.

**Purpose:** Establish real CEFR level so the app starts you at the right phase. No guessing, no self-reporting.

**Test Structure (30 min, timed):**

**Section 1 — Vocabulary Breadth (5 min)**
- 50 words shown in target language, frequency-sorted from common to rare
- For each: type the English/French meaning (production, not recognition)
- Scoring: words 1-200 = A1, 201-500 = A2, 501-1500 = B1, 1501-3000 = B2, 3001-5000 = C1
- Result: estimated vocabulary size + frequency ceiling

**Section 2 — Grammar Production (10 min)**
- 20 sentences in English/French → translate to target language
- Sentences are designed to test specific structures:
  - Present tense (A1)
  - Past tenses (A2)
  - Subjunctive/conditional (B1)
  - Passive voice (B2)
  - Complex subordination + formal register (C1)
- Graded by Claude API: identifies which structures are solid vs broken
- Result: grammar level + specific weakness list

**Section 3 — Reading Comprehension (5 min)**
- 3 short texts at A2, B1, and B2 levels
- 2 questions per text (open-ended, must write answer in target language)
- Result: reading comprehension level

**Section 4 — Listening Comprehension (5 min)**
- 3 audio clips at A2, B1, B2 levels (pre-recorded, stored locally)
- After each: write what you understood (in target language or English)
- Result: listening level

**Section 5 — Free Writing (5 min)**
- One prompt: "Describe your motivation for learning this language and what you want to achieve" (in target language, any length)
- Graded by Claude API for grammar accuracy, vocabulary range, coherence
- Result: writing level + error patterns

**Output:**
- Overall CEFR level (composite)
- Per-skill breakdown (reading / writing / listening / grammar / vocabulary)
- Specific weakness list (e.g., "passive voice: 0/3 correct", "dative prepositions: 1/4 correct")
- Generated training plan targeting weaknesses
- Starting phase assignment (Script / Foundation / Integration / Reactivation / Advanced)
- All results saved as first entry in the language's learning journal

---

### 3.3 MENTAL PALACE MODULE

**What exists (built for German):**
- 52 landmarks on Nettelnburg commute, each holding 100 words (50 left / 50 right)
- Python pipeline: Anki export → parse → image extraction from .apkg → HTML generation
- Light colorful UI: white cards, blue/pink/green gender borders, click-to-reveal

**What the app adds:**

**Palace Builder:**
- Import vocabulary from: Anki export (.txt), Lute word lists, Language Reactor exports, CSV, manual entry
- Auto-sort by frequency (most common words → first landmarks)
- Each word gets: target language word, translation, gender (if applicable), example sentence, image (from Anki or Google Images API), audio (from Anki or Forvo API), landmark assignment, side (left/right), position
- For languages with shared characters (Japanese → Mandarin): import existing palace entries and map new pronunciations onto them

**Palace Review:**
- Walk-through mode: navigate landmark by landmark in commute order
- Click-to-reveal: tap card to show translation + example sentence
- Self-grading: after reveal, mark as ✅ Known / ⚠️ Shaky / ❌ Forgot
- Spaced resurfacing: forgotten words reappear more frequently
- Stats per landmark: % known, % shaky, % forgot, last reviewed date

**Palace Drill Mode (Wozniak Minimum Information Principle):**
- Drill — Isolated Retrieval: each word generates 3-5 separate prompts testing one aspect at a time (meaning, gender, cloze, reverse, production)
- Drill — Weakest Only: filters to Shaky/Forgot words only
- Per-word scores tracked per drill type (meaning_score, gender_score, cloze_score, etc.)
- App serves prompts from the word's weakest type first

**Palace for Each Language:**
- German: 52 landmarks, Nettelnburg commute (already built)
- Other languages: same route OR new routes (user configurable)
- Language-specific features: gender colors for German/French/Portuguese/Italian/Arabic, script display for Korean/Japanese/Arabic/Mandarin/Greek/Russian

---

### 3.4 GRAMMAR TRAINER MODULE

**What exists (built for German):**
- 1,306 exercises across 27 chapters of German Grammar Drills (Ed Swick)
- Exercise types: sentence transformation, error correction, translation, free production, paragraph writing
- HTML app with Duolingo/Drops-inspired UI
- JSON database with all exercises and prompts (exercises_database.json with 9,155 prompts)

**What the app adds:**

**Multi-Language Grammar:**
- Each language has its own grammar chapter structure
- Exercise format stays identical: full sentences only, no fill-in-the-blank, no multiple choice
- Exercise types: Transform (rewrite sentence changing one element), Error Fix (find and correct the mistake), Translate (English/French → target language), Produce (write original sentences using a structure), Paragraph (write a paragraph using 3+ target structures)
- Exercises generated per language using Claude API (same quality bar as German: 50 real exercises per chapter)

**Adaptive Weakness Targeting:**
- After assessment test OR after any session: error patterns are logged
- Error categories per language (e.g., German: case confusion, gender, verb conjugation, word order, register; Russian: case endings, verb aspect, motion verbs; Japanese: particles, verb forms, keigo)
- The app surfaces exercises targeting your weakest categories first
- "Weakness Drill" mode: generates 20 fresh exercises on your worst error pattern on demand (Claude API)

**Interference Detection Engine (Wozniak Rule 11):**
- When you get item A wrong and your answer matches item B, the pair is flagged
- After 3+ occurrences, confirmed as an interference pair (e.g., wurde/würde, ser/estar, は/が)
- Discrimination drills auto-generated: present both items with rule reminder, force binary choice, then free production
- Pair marked "resolved" after 5 consecutive correct answers across separate sessions
- Interference dashboard shows all active pairs ranked by occurrence, with trend lines

**Grammar Reference:**
- Each chapter has a collapsible rule explanation section
- Rules link to specific exercises that test them
- When you get an exercise wrong, the violated rule is shown

**Progress Tracking:**
- Per chapter: exercises attempted, accuracy %, time spent
- Per error category: trend line (improving / stagnating / declining)
- Overall grammar accuracy across all sessions

---

### 3.5 SHADOWING MODULE

**What it does:**
- Hosts audio files for shadowing practice (Assimil lessons, podcast episodes, or imported audio)
- Plays audio with text displayed (target language + translation toggle)
- Records your voice while you shadow (optional)
- Tracks: lessons completed, minutes shadowed, current rotation (last 10 lessons)

**Shadowing Progression:**
1. **Pre-shadow:** Listen only, no text (builds familiarity)
2. **Blind shadow:** Repeat along with audio, no text
3. **Text shadow:** Repeat along with audio, text visible
4. **Solo shadow:** Text visible, try from memory, check against audio

**Integration with commute:**
- "Commute mode": queues up today's shadowing rotation (current lesson + previous 5-7 in cycle)
- Offline support: audio files stored locally

---

### 3.6 LEVEL-UP TEST (1 hour)

**Triggered:** When user believes they've reached a target level. Can be taken anytime.

**Purpose:** Verify you've actually reached the claimed level. If you pass, the app records it. If you fail, it generates a new training plan.

**Test Structure (60 min, timed, scored by Claude API):**

**Section 1 — Grammar Production (15 min)**
- 30 sentences covering ALL grammar structures for the target level
- Must translate from English/French to target language
- Scored per grammar category

**Section 2 — Reading & Comprehension (10 min)**
- 2 texts at the target level (one factual, one opinion piece)
- 5 open-ended questions each (answer in target language)

**Section 3 — Listening Comprehension (10 min)**
- 2 audio clips at target level
- 5 questions each (answer in target language)

**Section 4 — Writing (15 min)**
- Task 1: Formal letter/email (if B2+)
- Task 2: Opinion essay on a given topic
- Scored for: grammar accuracy, vocabulary range, coherence, register appropriateness

**Section 5 — Speaking Simulation (10 min)**
- Record yourself giving a 4-minute presentation on a given topic
- Record yourself answering 3 follow-up questions
- Self-assessment rubric provided (fluency, grammar, vocabulary, coherence)
- Optional: submit to Claude API for transcript-based grading

**Output:**
- PASS / FAIL per section
- Overall PASS (≥80% across all sections) / FAIL
- Detailed weakness report with specific error examples
- If FAIL: auto-generated 2-week intensive training plan targeting identified weaknesses
- If PASS: language marked as complete, date recorded, moved to "completed" shelf, next language unlocked

---

### 3.7 LEARNING JOURNAL (Auto-Tracking + Manual Input)

**The single source of truth for all language learning activity.**

**Auto-Tracked (from app usage):**
- Every palace review session: duration, words reviewed, accuracy
- Every grammar session: duration, exercises completed, accuracy, error patterns
- Every shadowing session: duration, lessons covered
- Every assessment/test: full results
- Daily total time per language
- Streak data

**Manually Logged (from external sources):**
- italki conversation sessions: date, duration, tutor name, topics discussed, errors noted
- Netflix/YouTube watching: date, duration, show/channel, with/without subtitles
- Book reading (Lute or physical): date, duration, title, pages/words
- Podcast listening: date, duration, show name
- Native speaker conversations: date, duration, context, errors noted
- Assimil/textbook study: date, duration, lessons covered
- Any other activity: free-form entry with date, duration, category, notes

**Journal Entry Format:**
```
[2026-03-17] [German] [Grammar] [45 min] [Auto]
Session: Ch 7 Genitiv exercises 6-25
Accuracy: 78%
Errors: genitive prepositions (wegen + Dativ instead of Genitiv), 
        weak noun declension (des Herzen → des Herzens)
Weakness update: genitive prepositions moved from "shaky" to "critical"

[2026-03-17] [German] [External - Netflix] [60 min] [Manual]
Show: Dark S01E03
Subtitles: German
Notes: understood ~70%, struggled with Konjunktiv II in dialogue, 
       new words saved: Zusammenhang, Höhle, Verschwinden
```

**Starting Point Entry:**
When a language is first activated, the journal receives a pre-loaded entry containing Olivier's background with that language (from the profiles in Section 2 above). This ensures the full learning history is captured in one place.

**Journal Views:**
- Timeline (chronological, all entries)
- Calendar heatmap (GitHub-style, showing intensity per day)
- Per-language filter
- Per-activity-type filter
- Weekly summary (auto-generated: total hours, top activities, accuracy trends, streak status)
- Export to CSV/JSON

---

### 3.8 TRAINING PLAN GENERATOR

**Triggered by:** Assessment test results, level-up test failures, or manual request.

**What it produces:**
A week-by-week study plan with daily block allocations, based on:
- Current assessed level
- Target level
- Available daily hours (user configurable: 1h, 2h, 3h, 4h)
- Identified weaknesses from test results or error pattern tracker
- Current phase (Script / Foundation / Integration / Reactivation / Advanced)

**Plan Structure:**
```
INPUT PHASE (auto-determined by assessment):
  IF assessed_level < A2:  2 weeks input-only (no palace, no grammar, no memorization)
  IF assessed_level A2-B1: 1 week input-only
  IF assessed_level >= B1:  skip (reactivation — go straight to full sprint)

  Input Phase activities: listening, reading, shadowing, watching content
  Palace and Grammar modules locked with message: "Comprehension Phase"
  Journal tracks input hours with weekly target bar

FULL SPRINT (after Input Phase):
  Monday:   Shadowing (20 min) + Palace (20 min) + Grammar Ch X (20 min)
  Tuesday:  Shadowing (20 min) + Reading/Lute (20 min) + Grammar Ch X (20 min)
  ...
  Saturday: Level-check quiz (15 min) + Weakness drill (45 min)
  Sunday:   Fun input only (movie/music/book)

Weakness Focus This Week: [top 3 error categories]
Target: Complete palace landmarks 1-10, Grammar Ch 1-3, shadow Assimil L1-7
```

**Regeneration:** After each weekly check-in or failed level test, the plan regenerates based on updated weakness data.

---

### 3.9 BIDIRECTIONAL TRANSLATION MODULE

**Lampariello's core technique, built into the app:**

- User selects a text (from Assimil, imported article, or app-provided)
- Step 1: Read target language text
- Step 2: Read translation (French/English)
- Step 3: Hide target language. Translate back from French/English into target language. Type it.
- Step 4: App compares your translation to original, highlights differences
- Step 5: Errors are logged to error pattern tracker

**Text Sources:**
- Assimil lessons (imported as text files)
- User-imported articles/book excerpts
- Auto-fetched from RSS feeds in target language (if online)
- Curated texts per level (A2 → C1 progression)

---

### 3.10 SCRIPTORIUM MODULE

**Arguelles' technique for script-heavy languages (Arabic, Russian, Korean, Japanese, Mandarin, Greek):**

- Display a sentence in target language
- User reads it aloud (optional recording)
- User writes it by hand (paper) or types it
- User reads their copy aloud
- Mark as complete, move to next sentence
- Track: sentences completed, time spent, script fluency progression

**When activated:** Auto-enabled for languages with non-Latin scripts during Phase 1 (Script) and early Phase 2 (Foundation).

---

## 4. DATABASE SCHEMA

```sql
-- LANGUAGES
CREATE TABLE languages (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- 'de', 'es', 'el', 'ru', etc.
  name TEXT NOT NULL,
  flag TEXT,                         -- emoji
  color TEXT,                        -- hex color for UI
  script TEXT DEFAULT 'latin',       -- 'latin', 'cyrillic', 'hangul', 'kanji', 'arabic', 'devanagari'
  palace_route TEXT,                 -- description of palace path
  status TEXT DEFAULT 'locked',      -- 'locked', 'active', 'secondary', 'completed'
  sprint_order INTEGER,
  assessed_level TEXT,               -- 'A1', 'A2', etc.
  target_level TEXT DEFAULT 'C1',
  current_phase TEXT,                -- 'script', 'foundation', 'integration', 'reactivation', 'advanced'
  started_at DATETIME,
  completed_at DATETIME,
  background_notes TEXT              -- pre-loaded starting point text
);

-- LANDMARKS (Palace System)
CREATE TABLE landmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  side TEXT,                         -- 'left', 'right', or NULL
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- VOCABULARY (Palace Words)
CREATE TABLE vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  landmark_id INTEGER,
  word TEXT NOT NULL,
  translation TEXT,
  gender TEXT,                       -- 'M', 'F', 'N' or NULL
  example_sentence TEXT,
  example_translation TEXT,
  part_of_speech TEXT,
  frequency_rank INTEGER,
  image_path TEXT,
  audio_path TEXT,
  source TEXT,                       -- 'anki', 'lute', 'language_reactor', 'manual'
  status TEXT DEFAULT 'new',         -- 'new', 'known', 'shaky', 'forgot'
  last_reviewed DATETIME,
  review_count INTEGER DEFAULT 0,
  FOREIGN KEY (language_id) REFERENCES languages(id),
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id)
);

-- GRAMMAR CHAPTERS
CREATE TABLE grammar_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  topic_native TEXT,                 -- topic name in target language
  rule_explanation TEXT,
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- GRAMMAR EXERCISES
CREATE TABLE grammar_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  exercise_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT,
  type TEXT NOT NULL,                -- 'transform', 'error_fix', 'translate', 'produce', 'paragraph'
  difficulty TEXT DEFAULT 'B1',      -- CEFR level
  FOREIGN KEY (chapter_id) REFERENCES grammar_chapters(id)
);

-- GRAMMAR PROMPTS (individual items within exercises)
CREATE TABLE grammar_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  text TEXT NOT NULL,
  correct_answer TEXT,               -- for auto-grading where applicable
  FOREIGN KEY (exercise_id) REFERENCES grammar_exercises(id)
);

-- USER ANSWERS (to grammar prompts)
CREATE TABLE grammar_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_id INTEGER NOT NULL,
  session_id INTEGER,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  error_category TEXT,               -- 'case', 'gender', 'conjugation', 'word_order', 'register', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prompt_id) REFERENCES grammar_prompts(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- ERROR PATTERNS
CREATE TABLE error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  category TEXT NOT NULL,            -- 'passive_voice', 'dative_prepositions', 'verb_aspect', etc.
  severity TEXT DEFAULT 'moderate',  -- 'critical', 'moderate', 'minor'
  occurrence_count INTEGER DEFAULT 0,
  last_occurred DATETIME,
  improving BOOLEAN DEFAULT 0,       -- trend direction
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- SESSIONS
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  type TEXT NOT NULL,                -- 'palace', 'grammar', 'shadowing', 'translation', 'scriptorium', 'assessment', 'level_test'
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_minutes INTEGER,
  exercises_completed INTEGER DEFAULT 0,
  accuracy REAL,                     -- 0.0 to 1.0
  notes TEXT,
  auto_tracked BOOLEAN DEFAULT 1,
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- JOURNAL ENTRIES (manual + auto)
CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  category TEXT NOT NULL,            -- 'palace', 'grammar', 'shadowing', 'translation', 'scriptorium',
                                     -- 'assessment', 'level_test', 'italki', 'netflix', 'reading',
                                     -- 'podcast', 'conversation', 'music', 'textbook', 'other', 'background'
  duration_minutes INTEGER,
  source TEXT DEFAULT 'app',         -- 'app' (auto) or 'manual'
  session_id INTEGER,                -- links to sessions table if auto-tracked
  title TEXT,
  notes TEXT,
  errors_noted TEXT,                 -- free text for manual error logging
  words_learned TEXT,                -- comma-separated new words
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (language_id) REFERENCES languages(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- ASSESSMENTS (initial + level-up tests)
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  type TEXT NOT NULL,                -- 'initial' or 'level_up'
  target_level TEXT,                 -- for level_up tests
  taken_at DATETIME NOT NULL,
  duration_minutes INTEGER,
  vocabulary_score REAL,
  grammar_score REAL,
  reading_score REAL,
  listening_score REAL,
  writing_score REAL,
  speaking_score REAL,
  overall_level TEXT,                -- assessed CEFR level
  passed BOOLEAN,
  weakness_report TEXT,              -- JSON blob with detailed weakness data
  generated_plan TEXT,               -- JSON blob with training plan
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- MODULE THEMES (per-language, per-module visual identity)
CREATE TABLE module_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  module TEXT NOT NULL,              -- 'palace', 'grammar', 'shadowing', 'translation', 'scriptorium'
  primary_color TEXT,                -- hex color
  accent_color TEXT,
  background_color TEXT,
  card_style TEXT,                   -- 'rounded', 'sharp', 'minimal', 'bordered', etc.
  card_background TEXT,              -- hex or gradient
  card_border_color TEXT,
  font_family TEXT,                  -- 'Nunito', 'Outfit', 'Noto Sans JP', etc.
  header_style TEXT,                 -- 'gradient', 'solid', 'minimal'
  layout_pattern TEXT,               -- 'grid', 'list', 'carousel'
  custom_css TEXT,                   -- any additional CSS overrides
  UNIQUE(language_id, module),
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- SHADOWING LESSONS
CREATE TABLE shadowing_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  lesson_number INTEGER,
  source TEXT,                       -- 'assimil', 'podcast', 'audiobook', 'custom'
  title TEXT,
  audio_path TEXT,
  text_native TEXT,                  -- target language transcript
  text_translation TEXT,             -- French/English translation
  current_stage TEXT DEFAULT 'pre_shadow', -- 'pre_shadow', 'blind', 'text', 'solo'
  completed_count INTEGER DEFAULT 0,
  FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- TRAINING PLANS
CREATE TABLE training_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  assessment_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  plan_data TEXT NOT NULL,           -- JSON blob with week-by-week structure
  daily_hours REAL,
  target_level TEXT,
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY (language_id) REFERENCES languages(id),
  FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);
```

---

## 5. UI / UX PRINCIPLES

- **Light, colorful theme.** White backgrounds, colored accents per language, no dark mode. Explicitly requested.
- **Per-module, per-language visual identity.** Every language-module combination has its own distinct UI style. German Palace looks different from German Grammar. Greek Palace looks different from German Palace. These visual differences are not decoration — they are memory triggers (Wozniak Rule 15: context cues simplify recall). When importing existing HTML tools, their specific visual design choices (colors, layouts, card styles, fonts, interactions) are preserved as part of that language-module's theme config.
- **Theme config structure:** Each language-module pair (e.g., `de-palace`, `de-grammar`, `el-palace`, `el-grammar`) has its own theme object controlling: primary color, accent colors, card style (border radius, shadow, background), font family, header style, animation style, layout pattern (grid vs list vs carousel), and any custom visual elements. The underlying React components are the same code — they read from the theme config to render differently.
- **Duolingo/Drops energy** — rounded cards, subtle shadows, progress animations, satisfying micro-interactions. But each module-language pair applies this energy through its own visual lens.
- **Gender colors:** Blue (masculine), Pink (feminine), Green (neuter) — consistent across all gendered languages.
- **One-click-to-start:** Opening the app should immediately show what to do today. No menu hunting.
- **Home page "Rules" tab:** A toggleable panel on the dashboard that displays Wozniak's 20 Rules of Formulating Knowledge, adapted for language learning, with "In the app" annotations showing how each rule is implemented. Can be collapsed/hidden. Serves as both a reference and a motivation/methodology reminder.
- **Mobile-friendly:** Palace review and shadowing happen on the commute. Must work on phone.
- **Offline-first:** SQLite is local. No internet required for core features.

---

## 6. TECH ARCHITECTURE

```
polyglot-os/
├── app/                          # Next.js app router
│   ├── page.js                   # Dashboard (home)
│   ├── [lang]/                   # Language-specific routes
│   │   ├── palace/               # Palace review
│   │   ├── grammar/              # Grammar trainer
│   │   ├── shadow/               # Shadowing module
│   │   ├── translate/            # Bidirectional translation
│   │   ├── scriptorium/          # Scriptorium (script languages)
│   │   ├── journal/              # Learning journal
│   │   ├── assess/               # Assessment test
│   │   └── test/                 # Level-up test
│   └── api/                      # API routes
│       ├── exercises/            # CRUD for exercises
│       ├── vocabulary/           # CRUD for vocabulary
│       ├── sessions/             # Session tracking
│       ├── journal/              # Journal entries
│       ├── assess/               # Assessment logic + Claude API grading
│       └── import/               # Import from Anki/Lute/LR
├── components/                   # Shared React components
│   ├── PalaceCard.jsx
│   ├── GrammarExercise.jsx
│   ├── JournalEntry.jsx
│   ├── ProgressRing.jsx
│   ├── LevelBadge.jsx
│   └── ...
├── lib/
│   ├── db.js                     # SQLite connection + helpers
│   └── claude.js                 # Claude API integration
├── scripts/
│   ├── setup-db.js               # Create all tables
│   ├── import-anki.js            # Import Anki exports
│   ├── import-exercises.js       # Import grammar exercise JSON
│   └── seed-languages.js         # Seed 10 languages with backgrounds
├── data/
│   ├── polyglot.db               # SQLite database
│   └── media/                    # Images + audio per language
│       ├── de/
│       ├── el/
│       └── ...
├── public/                       # Static assets
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 7. IMPORT PIPELINES (Existing, to Integrate)

### From Anki (.apkg → vocabulary)
- **Script:** `palace_cards_v2.py` (Python) — already built
- **Flow:** Rename .apkg to .zip → extract → read `media` JSON mapping → parse export .txt → match images → insert into vocabulary table with landmark assignments
- **Tested on:** German deck (4,214 words, 86 pages generated)

### From Lute (word lists → vocabulary)
- Export unknown words from Lute as CSV
- Import script maps words to frequency rank and assigns palace positions

### From Language Reactor (saved words → vocabulary)
- Export saved words from LR as CSV
- Import script deduplicates against existing vocabulary and adds new entries

### Grammar Exercises (JSON → grammar tables)
- **Existing:** `exercises_database.json` — 1,306 exercises, 9,155 prompts for German
- **Import script:** `import-exercises.js` — already designed (see Layer 4 architecture)
- **For new languages:** Claude API generates exercises in same JSON format, imported identically

---

## 8. CLAUDE API INTEGRATION POINTS

| Feature | When Called | What It Does |
|---------|-----------|--------------|
| Assessment grading | During initial test + level-up test | Grades free writing and translations, identifies error patterns |
| Weakness drill generation | On demand ("give me 20 passive voice exercises") | Generates fresh exercises targeting specific error categories |
| Training plan generation | After assessment or failed test | Creates week-by-week study plan from weakness data |
| Grammar exercise generation | When building exercises for a new language | Generates 50 exercises per chapter in standardized JSON format |
| Bidirectional translation checking | During translation module | Compares user's translation to original, identifies errors |

**Offline fallback:** All features work without API except the 5 above. Assessment tests can be taken offline and graded later when online. Weakness drills fall back to serving existing exercises from the database.

---

## 9. BUILD PRIORITIES

### Phase A — NOW (German sprint, existing tools integration)
1. ✅ Grammar exercises Ch 1-6 complete (300 exercises)
2. ⬜ Resume grammar exercise generation Ch 7-27 (945 exercises remaining)
3. ⬜ Palace cards already generated (86 HTML files)
4. ⬜ Grammar trainer HTML app working

### Phase B — App Foundation
1. Next.js project setup with SQLite + Tailwind
2. Database schema creation + seed scripts
3. Import existing German data (4,214 vocabulary + 1,306+ exercises)
4. Dashboard with language cards
5. Palace review module (replaces HTML files)
6. Grammar trainer module (replaces HTML app)

### Phase C — Assessment & Journal
1. Initial assessment test (30 min, with Claude API grading)
2. Learning journal (auto-tracking from app sessions + manual entry)
3. Pre-loaded language backgrounds as first journal entries
4. Session timer and auto-logging

### Phase D — Sprint Modules
1. Shadowing module with audio player + lesson rotation
2. Bidirectional translation module
3. Scriptorium module (for non-Latin scripts)
4. Level-up test (1 hour, with Claude API grading)
5. Training plan generator

### Phase E — Second Language
1. Run Python pipeline on Greek deck → import vocabulary
2. Generate Greek grammar exercises
3. Validate full sprint cycle: assess → train → test → pass → next

### Phase F — Scale
1. Repeat for each subsequent language
2. YouTube documentation of each component

---

## 10. YOUTUBE CONTENT HOOKS

Each component of this app is a video:
- "I built a polyglot app to learn 10 languages" (overview)
- "16 months of screenshots vs 3 days of code" (the palace pipeline origin story)
- "How I use a mental palace to memorize 8,000 German words" (palace system deep dive)
- "I reverse-engineered how hyperpolyglots learn languages" (method research)
- "Can I pass the C1 exam in 60 days?" (German sprint documentation)
- "The app that tells me exactly what I suck at" (error pattern tracker)
- "Sprint 2: From zero to C1 in Spanish" (reactivation documentation)
- Component walk-throughs where Olivier explains each piece of the codebase

---

*This document is the single source of truth for the Polyglot OS project. All future development references this spec.*
