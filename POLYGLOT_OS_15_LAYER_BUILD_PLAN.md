# POLYGLOT OS — 15-LAYER BUILD PLAN
## From Zero to Full Language Mastery App

**One project. Not two.**

The existing `polyglot-palace` project (grammar trainer + palace cards + Next.js shell) BECOMES Polyglot OS. Everything merges into one codebase. The grammar trainer HTML and palace card HTML files are temporary tools — they keep working while you build the real app layer by layer underneath them.

---

## THE MERGE DECISION

| Existing Project | What Happens |
|-----------------|-------------|
| `grammar_trainer.html` + `exercises_database.json` | → Becomes the Grammar Module inside Polyglot OS (Layer 5) |
| `palace_cards_v2.py` + 86 HTML files | → Becomes the Palace Module inside Polyglot OS (Layer 6) |
| `polyglot-palace/` Next.js shell | → Becomes the foundation of Polyglot OS (Layer 3) |
| `German_Grammar_Trainer_App.html` (old) | → Archived, replaced |
| `German_Palace_Master.xlsx` | → Data imported into SQLite (Layer 4) |
| `fix_images.py` / `add_translations.py` | → Become import scripts in `scripts/` folder |

**Why one project:** You don't want two databases, two UIs, two codebases. The palace and grammar trainer share the same language, the same error tracking, the same journal, the same progression system. Splitting them means duplicating everything.

---

## TECH STACK EXPLAINER

Before the layers, here's what each technology actually IS and WHY you need it:

### Node.js
**What:** JavaScript that runs on your computer (not in a browser). Think of it as Python but for web apps.
**Why you need it:** Next.js runs on Node.js. Your database queries run on Node.js. Every `npm` command uses Node.js.
**Install:** Download from nodejs.org, run installer. That's it.
**Data engineering relevance:** Node.js is used in data pipeline orchestration, API building, and real-time data processing. Understanding it makes you a more versatile engineer.

### npm (Node Package Manager)
**What:** Like pip for Python. Downloads libraries other people wrote so you don't have to.
**Why you need it:** One command (`npm install`) downloads React, Next.js, Tailwind, SQLite driver, and 50 other things your app needs.
**Key commands:** `npm install` (download everything), `npm run dev` (start the app), `npm run build` (make production version).

### Next.js
**What:** A framework built on top of React. It handles routing (URLs → pages), server-side logic (API routes), and file organization.
**Why you need it (vs plain React):** Plain React is just UI components. Next.js adds: file-based routing (create `app/grammar/page.js` → you get `/grammar` URL automatically), API routes (create `app/api/exercises/route.js` → you get a backend endpoint), server components (pages that load data before rendering).
**Data engineering relevance:** Next.js API routes are essentially the same pattern as building REST APIs — a core data engineering skill.

### React
**What:** A library for building UIs out of reusable pieces called "components." A PalaceCard is a component. A GrammarExercise is a component. A JournalEntry is a component.
**Why you need it:** Every modern web frontend uses React (or Vue/Svelte which are similar). Once you know React, you can build any web UI.
**Key concepts:** Components (reusable UI pieces), Props (data passed into a component), State (data that changes and causes re-renders), Hooks (useState, useEffect — functions that add behavior to components).
**Data engineering relevance:** Data dashboards (Grafana alternatives, internal tools) are built in React. Many data teams need someone who can build a frontend for their pipelines.

### Tailwind CSS
**What:** Instead of writing CSS files, you add utility classes directly to HTML elements. `className="bg-white rounded-lg shadow-md p-4"` = white background, rounded corners, shadow, padding.
**Why you need it:** Fast styling without switching between files. You see what the element looks like by reading its classes. Perfect for your light/colorful UI preference.
**Data engineering relevance:** Not directly relevant, but makes you faster at building internal tools and dashboards.

### SQLite
**What:** A database that lives in a single file. No server, no installation, no configuration. Your entire app's data sits in `data/polyglot.db`.
**Why you need it:** You have 4,214 vocabulary words, 1,350 exercises with 9,155 prompts, session logs, journal entries, error patterns, assessment results. That's too much for JSON files or localStorage.
**Key concepts:** Tables (like spreadsheets), Rows (individual records), Columns (fields), SQL queries (SELECT, INSERT, UPDATE, JOIN), Foreign keys (links between tables).
**Data engineering relevance:** THIS IS DIRECTLY RELEVANT. SQLite uses the same SQL as PostgreSQL, MySQL, BigQuery, Snowflake. Every data engineer writes SQL daily. Building this app is SQL practice.

### better-sqlite3
**What:** A Node.js library that lets your app read/write SQLite databases. It's the bridge between your JavaScript code and your .db file.
**Why this one:** It's synchronous (simpler code than async alternatives), fast, and well-documented.

### Recharts
**What:** A React library for drawing charts — line charts, bar charts, radar charts, etc.
**Why you need it:** Your weakness radar, progress over time, accuracy trends — all visualized with Recharts.
**Data engineering relevance:** Data visualization is a core skill. Recharts uses the same concepts as D3.js, Matplotlib, etc.

---

## THE 15 LAYERS

---

### ═══════════════════════════════════════
### LAYER 1 — STANDALONE HTML TOOLS (DONE)
### ═══════════════════════════════════════

**Status: ✅ COMPLETE**

**What exists:**
- `grammar_trainer.html` — Browser app showing all 27 chapters, 1,350 exercises
- `exercises_database.json` — 9,155 prompts in structured JSON
- `palace_cards_v2.py` — Python script generating 86 HTML palace review pages
- `fix_images.py` — Anki .apkg image extractor
- 86 palace card HTML files (generated, with light UI, gender colors, click-to-reveal)

**What you can do with Layer 1:**
- [x] Open grammar_trainer.html, browse all 27 chapters
- [x] Do exercises, type answers, export as text
- [x] Paste exported answers into Claude chat for correction
- [x] Open palace card HTML files, review vocabulary by landmark

**Deliverable:** Two working HTML apps you use daily for German practice while building the rest.

**Move-on criteria:** You've used both tools at least 5 times and understand what data they contain.

---

### ═══════════════════════════════════════
### LAYER 2 — SESSION TRACKING + ANSWER RECORDING
### ═══════════════════════════════════════

**Goal:** Add a timer and answer persistence to the grammar trainer HTML so your practice is tracked.

**Deliverables:**
1. Session timer that starts when you begin a chapter and stops when you leave
2. Answer saving to localStorage — your typed answers persist after page reload
3. "Mark as difficult" button on each exercise (flags it for review)
4. Improved export format: exports include timestamp, duration, chapter, and difficulty flags
5. Basic stats on the chapter page: exercises completed, flagged count

**Files to modify:**
- `grammar_trainer.html` — add timer logic, localStorage saving, flag button, stats display

**Tech you'll learn:**
| Concept | Time | What it teaches you |
|---------|------|-------------------|
| `Date.now()` and time math | 30 min | How to measure elapsed time in JavaScript |
| `localStorage.setItem/getItem` | 30 min | Browser-based persistence (temporary, replaced by SQLite in Layer 4) |
| `JSON.stringify/parse` | 30 min | Converting objects to text and back (used everywhere in data engineering) |
| `Array.filter` and `Array.map` | 1 hour | Functional data transformation (same concept as SQL WHERE and pandas .apply) |

**"I can..." checklist:**
- [ ] When I start doing exercises, a timer appears and counts up
- [ ] When I type an answer and leave the page, my answer is still there when I come back
- [ ] I can flag an exercise as difficult and the flag persists
- [ ] When I export, the file includes: date, time spent, all answers, flagged items
- [ ] I can see "12/50 completed, 3 flagged" on the chapter page

**Move-on criteria:** All checkboxes green. You understand what localStorage is and why we'll replace it with SQLite later.

**Estimated time:** 3-4 hours to build. 1 hour to learn the concepts.

---

### ═══════════════════════════════════════
### LAYER 3 — NEXT.JS PROJECT FOUNDATION
### ═══════════════════════════════════════

**Goal:** Create the real app skeleton. This is where the HTML tools get replaced by a proper web application.

**Deliverables:**
1. Working Next.js project that runs with `npm run dev`
2. Home page (`/`) showing a dashboard placeholder
3. Grammar route (`/grammar`) showing 27 chapter cards
4. Chapter route (`/grammar/de/5`) showing exercises for chapter 5
5. Tailwind styling matching your light/colorful preference
6. Theme system foundation: `lib/themes.js` that stores per-language, per-module visual configs (colors, fonts, card styles, layouts). Each module reads its theme from this config. German Palace looks different from German Grammar. Greek Palace looks different from German Palace. The visual identity of each existing HTML tool is preserved.
7. Exercises loaded from JSON file (same exercises_database.json, now served by Next.js)
8. Home page with collapsible "20 Rules" reference tab (Wozniak's rules, always accessible)
9. Same functionality as Layer 2 HTML but now in React components

**Files created:**
```
polyglot-os/
├── app/
│   ├── layout.js              ← Master layout with header + navigation
│   ├── page.js                ← Dashboard home page
│   ├── globals.css            ← Tailwind imports
│   └── grammar/
│       ├── page.js            ← Chapter list (all 27 chapters)
│       └── [lang]/[chapter]/
│           └── page.js        ← Single chapter's exercises
├── components/
│   ├── Header.jsx             ← App header with current language
│   ├── ChapterCard.jsx        ← One chapter card with progress
│   ├── ExerciseCard.jsx       ← One exercise (collapsible)
│   ├── PromptInput.jsx        ← Single prompt with text input
│   └── ExportButton.jsx       ← Export answers as text file
├── lib/
│   ├── storage.js             ← localStorage helpers (temporary)
│   └── themes.js              ← Per-language, per-module theme configs
├── public/
│   ├── exercises_database.json
│   └── wozniak_rules.json     ← 20 rules content for reference tab
├── package.json
├── tailwind.config.js
├── next.config.js
└── postcss.config.js
```

**Terminal commands:**
```bash
npx create-next-app@latest polyglot-os --tailwind --eslint --app
cd polyglot-os
cp ~/path/to/exercises_database.json public/
npm run dev
# Open http://localhost:3000
```

**Tech you'll learn:**
| Concept | Time | What it teaches you |
|---------|------|-------------------|
| React components + JSX | 4 hours | Building UIs from reusable pieces |
| React useState hook | 2 hours | Managing data that changes (answers, flags, open/closed states) |
| React useEffect hook | 1 hour | Loading data when a page opens |
| Next.js App Router | 2 hours | File-based routing (folders = URLs) |
| Next.js dynamic routes `[chapter]` | 30 min | URL parameters → page props |
| Tailwind CSS basics | 2 hours | Rapid styling with utility classes |
| package.json | 15 min | What dependencies are, how npm install works |

**"I can..." checklist:**
- [ ] I can run `npm run dev` and see the app at localhost:3000
- [ ] Navigating to `/grammar` shows 27 chapter cards
- [ ] Clicking a chapter card takes me to `/grammar/de/5` showing that chapter's exercises
- [ ] I can type answers and they save (localStorage for now)
- [ ] I can export answers in the same format as Layer 2
- [ ] The app looks good on mobile (phone width)
- [ ] The home page has a collapsible "20 Rules" tab I can open anytime
- [ ] The theme system exists in lib/themes.js with at least the German palace and German grammar themes defined
- [ ] I can explain what each file does

**Move-on criteria:** The Next.js app fully replaces the HTML grammar trainer. You stop using the HTML file and use the app instead.

**Estimated time:** 6-8 hours to build. 12 hours to learn React/Next.js/Tailwind.

---

### ═══════════════════════════════════════
### LAYER 4 — SQLITE DATABASE
### ═══════════════════════════════════════

**Goal:** Replace localStorage with a real database. All data is now permanent, queryable, and structured.

**Deliverables:**
1. SQLite database file created at `data/polyglot.db`
2. Setup script that creates ALL tables (languages, landmarks, vocabulary, grammar tables, sessions, journal, assessments, error_patterns, training_plans, shadowing_lessons)
3. Import script that loads `exercises_database.json` → grammar tables (9,155 prompts)
4. Seed script that creates the 10 language entries with your background notes
5. API routes that the frontend calls instead of localStorage
6. All existing functionality now reads/writes from SQLite

**Files created:**
```
polyglot-os/
├── scripts/
│   ├── setup-db.js            ← Creates polyglot.db with all tables
│   ├── import-exercises.js    ← Loads exercises_database.json into grammar tables
│   └── seed-languages.js     ← Creates 10 language rows with background profiles
├── lib/
│   └── db.js                 ← Database connection + query helper functions
├── app/api/
│   ├── exercises/route.js    ← GET exercises by chapter, POST answers
│   ├── sessions/route.js     ← POST new session, GET session history
│   └── languages/route.js    ← GET all languages, GET single language
└── data/
    └── polyglot.db           ← THE database (created by setup script)
```

**Terminal commands:**
```bash
npm install better-sqlite3
npm run db:setup              # Creates empty database with all tables
npm run db:seed               # Adds 10 languages with backgrounds
npm run db:import-exercises   # Loads 1,350 exercises → 9,155 prompts
npm run dev
```

**Database verification queries you should run:**
```sql
SELECT COUNT(*) FROM grammar_exercises;           -- Should be 1,350
SELECT COUNT(*) FROM grammar_prompts;             -- Should be 9,155
SELECT COUNT(*) FROM languages;                   -- Should be 10
SELECT * FROM languages WHERE code = 'de';        -- German with background notes
SELECT * FROM grammar_exercises WHERE chapter_id = 25 LIMIT 5;  -- Passive voice exercises
```

**Tech you'll learn:**
| Concept | Time | What it teaches you |
|---------|------|-------------------|
| SQL: CREATE TABLE | 1 hour | Defining data structures (same as data warehouse schemas) |
| SQL: SELECT, WHERE, JOIN | 2 hours | Querying data (THE core data engineering skill) |
| SQL: INSERT, UPDATE | 1 hour | Writing data |
| Foreign keys | 30 min | Relationships between tables (same in PostgreSQL, Snowflake, etc.) |
| Next.js API routes | 2 hours | Building backend endpoints (same pattern as Flask/FastAPI) |
| HTTP GET/POST | 1 hour | How frontend talks to backend (universal web concept) |

**"I can..." checklist:**
- [ ] `npm run db:setup` creates the database with no errors
- [ ] `npm run db:import-exercises` loads all 1,350 exercises
- [ ] I can open polyglot.db with a SQLite viewer and see all tables
- [ ] I can write a SQL query that finds all Passive Voice exercises
- [ ] The app loads exercises from the database (not from JSON)
- [ ] Answers save to the database, not localStorage
- [ ] If I delete localStorage, my answers are still there (from database)

**Move-on criteria:** You can write basic SQL queries and understand the table relationships.

**Estimated time:** 4-5 hours to build. 5 hours to learn SQL + API routes.

---

### ═══════════════════════════════════════
### LAYER 5 — GRAMMAR MODULE (FULL)
### ═══════════════════════════════════════

**Goal:** The grammar trainer becomes a complete module with session flow, answer recording, difficulty flagging, and per-chapter progress tracking. This replaces the HTML grammar trainer entirely.

**Deliverables:**
1. Full session flow: start session → do exercises → end session → save to database
2. Answer recording per prompt with timestamp
3. Difficulty flagging per exercise (persisted in database)
4. Progress bar per chapter (X/50 completed, Y% accuracy)
5. Session history page: list of all past sessions with date, duration, accuracy
6. Export function: generates .txt file with all answers + grading instructions + gradient rubric
7. Import function: upload correction file from Claude → updates error patterns in database

**The export .txt format (for Claude grading):**
```
═══════════════════════════════════════════
POLYGLOT OS — GRAMMAR TEST EXPORT
Language: German | Chapter: 25 (Passive Voice)
Date: 2026-03-20 | Duration: 42 min
Student Level: B1.3 | Target: C1
═══════════════════════════════════════════

GRADING INSTRUCTIONS FOR CLAUDE:
- Grade each answer on a 0-3 scale:
  0 = completely wrong
  1 = right idea, major grammar errors
  2 = mostly correct, minor errors
  3 = perfect
- For each error, categorize it: case/gender/conjugation/word_order/register/vocabulary
- At the end, provide:
  1. Overall accuracy percentage
  2. Gradient score (e.g., B1.4)
  3. Weakness radar scores (grammar 0-5, vocabulary 0-5, etc.)
  4. Top 3 specific weaknesses to drill
  5. Format the results as a CORRECTION FILE that can be imported back

───────────────────────────────────────────
EXERCISE 1: Rewrite in Passive Voice
───────────────────────────────────────────
Prompt 1: "Der Mechaniker repariert das Auto."
Answer: "Das Auto wird vom Mechaniker repariert."

Prompt 2: "Die Firma hat den Vertrag unterschrieben."
Answer: "Der Vertrag ist von der Firma unterschrieben worden."

[... all prompts and answers ...]

═══════════════════════════════════════════
END OF EXPORT — AWAITING CORRECTION FILE
═══════════════════════════════════════════
```

**The correction file format (from Claude, imported back):**
```json
{
  "language": "de",
  "date": "2026-03-20",
  "chapter": 25,
  "overall_accuracy": 0.76,
  "gradient_level": "B1.4",
  "weakness_radar": {
    "grammar": 3.8,
    "vocabulary": 4.2,
    "reading": 4.0,
    "listening": 3.1,
    "writing": 3.5,
    "speaking": 2.8
  },
  "error_categories": {
    "passive_voice_perfect": 3,
    "passive_voice_preterite": 1,
    "auxiliary_choice_werden_sein": 2,
    "agent_preposition_von_durch": 1
  },
  "top_weaknesses": [
    "Passive voice in Perfekt (sein vs. werden confusion)",
    "Agent preposition: 'durch' for impersonal, 'von' for personal agents",
    "Preterite passive: wurde + Partizip II (not wird)"
  ],
  "prompt_grades": [
    { "prompt_id": 1, "grade": 3, "errors": [] },
    { "prompt_id": 2, "grade": 1, "errors": ["auxiliary: 'ist...worden' should be 'ist...unterschrieben worden' — word order"] },
  ]
}
```

**When imported, the app:**
- Updates your gradient level (B1.3 → B1.4)
- Updates the weakness radar chart
- Updates error_patterns table with new occurrences
- Marks specific prompts as incorrect with error categories
- Adjusts which exercises surface next (weakest categories first)

**"I can..." checklist:**
- [ ] Starting a grammar session creates a session record in the database
- [ ] My answers save per-prompt with timestamps
- [ ] I can flag exercises as difficult
- [ ] Each chapter shows a progress bar (completed/total, accuracy)
- [ ] I can see a list of all past sessions
- [ ] Export generates a well-formatted .txt file with grading instructions
- [ ] I can paste a correction JSON file and the app updates my level and radar

**Move-on criteria:** The full grammar workflow loop works: do exercises → export → Claude grades → import correction → app updates.

**Estimated time:** 6-8 hours to build. 3 hours to learn new concepts.

---

### ═══════════════════════════════════════
### LAYER 6 — PALACE MODULE
### ═══════════════════════════════════════

**Goal:** The mental palace review system moves into the app. Import vocabulary from Anki, browse by landmark, review with click-to-reveal, track knowledge status. **Includes Palace Drill Mode (see Appendix A, Change 1) — separate retrieval testing per word aspect based on Wozniak's minimum information principle.**

**Deliverables:**
1. Anki import pipeline: run script → vocabulary populates database with images + audio
2. Landmark browser: visual list of all 52 landmarks in commute order
3. Landmark detail page: shows 50 words (left side) or 50 words (right side)
4. PalaceCard component: word, gender color, image, click-to-reveal translation + example
5. Self-grading: after reveal, mark as Known/Shaky/Forgot
6. Review stats per landmark: % known, last reviewed date
7. "Review weakest" mode: surfaces only Shaky + Forgot words across all landmarks

**Files created:**
```
app/palace/
├── page.js                    ← Landmark list (all 52 in order)
└── [lang]/[landmark]/
    └── page.js                ← Single landmark's words

components/
├── PalaceCard.jsx             ← Vocabulary card — reads visual style from module_themes (colors, borders, layout differ per language)
├── LandmarkList.jsx           ← Visual commute route overview — themed per language
└── ReviewStats.jsx            ← Per-landmark progress

scripts/
├── import-anki.js             ← Parses Anki export + copies images
└── import-lute.js             ← Imports Lute word lists

data/media/
└── de/                        ← German vocabulary images (from Anki)
```

**"I can..." checklist:**
- [ ] Running the import script loads 4,214 German words with images into the database
- [ ] I can browse landmarks 1-52 in commute order
- [ ] Clicking a landmark shows its 50 words with images and gender colors
- [ ] Clicking a card reveals the translation and example sentence
- [ ] I can mark words as Known/Shaky/Forgot and the status persists
- [ ] "Review weakest" shows only words I've marked as Shaky or Forgot
- [ ] Each landmark shows its review stats
- [ ] German palace UI matches the existing HTML visual style (colors, card design, layout)
- [ ] When Greek is imported later, its palace will render with its OWN visual style, not German's

**Move-on criteria:** You stop using the 86 HTML palace files and use the app instead.

**Estimated time:** 6-8 hours to build. 2 hours to learn new concepts (mostly image handling).

---

### ═══════════════════════════════════════
### LAYER 7 — LEARNING JOURNAL
### ═══════════════════════════════════════

**Goal:** Single source of truth for ALL language learning activity. Auto-logs app sessions. Manual entry for everything else.

**Deliverables:**
1. Auto-logging: every grammar session and palace review automatically creates a journal entry
2. Manual entry form: date, language, category (italki/Netflix/reading/podcast/textbook/conversation/other), duration, notes, words learned, errors noted
3. Starting point entries: when a language is first activated, its background profile (from Section 2 of the spec) appears as the first journal entry
4. Timeline view: chronological list of all entries, filterable by language and category
5. Calendar heatmap: GitHub-style grid showing activity intensity per day
6. Weekly summary: auto-generated text showing total hours, top activities, accuracy trends
7. Streak counter: consecutive days with at least 1 logged session

**"I can..." checklist:**
- [ ] After doing grammar exercises, a journal entry appears automatically
- [ ] I can manually add an italki session with notes
- [ ] I can manually log Netflix watching time
- [ ] German's journal starts with my background: "B1 certified, 4,214-word palace, 1,306 exercises..."
- [ ] I can filter the journal by language or activity type
- [ ] The calendar heatmap shows my activity for the last 3 months
- [ ] I can see a weekly summary of my learning
- [ ] My streak is tracked and visible on the dashboard

**Move-on criteria:** You log every learning activity (app and external) for 1 full week.

**Estimated time:** 5-6 hours to build. 2 hours to learn (date handling, calendar rendering).

---

### ═══════════════════════════════════════
### LAYER 8 — INITIAL ASSESSMENT TEST
### ═══════════════════════════════════════

**Goal:** 30-minute test that fires the first time you start a new language. Determines your real CEFR gradient level. **Also implements Input-First Sprint Opening (see Appendix A, Change 3) — first 1-2 weeks of any sprint are locked to comprehensible input only, based on Wozniak's "learn before you memorize" principle.**

**Deliverables:**
1. Test engine: timed sections (vocabulary 5 min, grammar 10 min, reading 5 min, listening 5 min, writing 5 min)
2. Vocabulary section: 50 frequency-sorted words → type the meaning
3. Grammar section: 20 sentences to translate into target language
4. Reading section: 3 texts with open-ended questions
5. Listening section: 3 audio clips with comprehension questions
6. Writing section: free writing prompt (in target language)
7. Export as .txt with grading instructions for Claude
8. Import correction file → sets initial gradient level (e.g., A2.3)
9. Auto-generates first training plan based on weaknesses
10. All results saved to assessments table + first journal entry

**50-hour gate logic:**
- After initial assessment, the next test unlocks after 50 hours of logged journal time
- Hours counter visible on dashboard: "Next test unlocks in: 12h 30m"
- When unlocked, a "Take Level-Up Test" button appears

**"I can..." checklist:**
- [ ] Starting German for the first time presents the 30-min assessment
- [ ] Each section is timed and auto-advances
- [ ] I can export the full test with answers as a .txt file
- [ ] After importing the correction file, my gradient level is set (e.g., B1.3)
- [ ] A training plan is generated and visible
- [ ] The next test unlocks after 50 hours of logged activity
- [ ] The hours counter is visible and accurate

**Move-on criteria:** You've taken the assessment for German, imported the correction, and see your gradient level.

**Estimated time:** 6-8 hours to build. 2 hours for new concepts (timer logic, file generation).

---

### ═══════════════════════════════════════
### LAYER 9 — LEVEL-UP TEST + GRADIENT SYSTEM
### ═══════════════════════════════════════

**Goal:** 1-hour test available every 50 journal hours. Grades you on the A1.1→C1.5 gradient. Pass/fail logic. Training plan regeneration on failure.

**Deliverables:**
1. Full 1-hour test with 5 sections (grammar 15 min, reading 10 min, listening 10 min, writing 15 min, speaking 10 min)
2. Test available at EVERY level from A1 to C1 (test difficulty scales with claimed level)
3. Export with gradient-specific grading rubric
4. Import correction file → updates gradient level
5. If gradient reaches X.6 → auto-promotes to next level (A2.6 = B1.1)
6. If test shows regression → gradient can go DOWN
7. Failure generates targeted 2-week training plan from weakness data
8. History of all tests with gradient progression chart
9. Gradient displayed prominently on dashboard with trend arrow (↑ improving, → stagnant, ↓ declining)

**The Gradient Scale:**
```
A1.1 → A1.2 → A1.3 → A1.4 → A1.5 → [A1.6 = A2.1]
A2.1 → A2.2 → A2.3 → A2.4 → A2.5 → [A2.6 = B1.1]
B1.1 → B1.2 → B1.3 → B1.4 → B1.5 → [B1.6 = B2.1]
B2.1 → B2.2 → B2.3 → B2.4 → B2.5 → [B2.6 = C1.1]
C1.1 → C1.2 → C1.3 → C1.4 → C1.5 → [SPRINT COMPLETE ✅]
```
30 steps total. Each 0.1 increment = measurable progress.

**"I can..." checklist:**
- [ ] After 50 logged hours, the "Take Test" button unlocks
- [ ] The test has all 5 sections, properly timed
- [ ] Export includes the gradient rubric and weakness radar format
- [ ] Importing the correction updates my gradient from B1.3 to B1.4 (or wherever)
- [ ] Reaching X.6 auto-promotes me to the next major level
- [ ] A failure generates a new training plan focused on my weaknesses
- [ ] I can see a chart of my gradient progression over time

**Move-on criteria:** You've taken a level-up test, imported the results, seen your gradient update, and understand the promotion logic.

**Estimated time:** 8-10 hours to build. 2 hours for new concepts.

---

### ═══════════════════════════════════════
### LAYER 10 — WEAKNESS RADAR + ERROR PATTERN DASHBOARD
### ═══════════════════════════════════════

**Goal:** Visual dashboard showing your strengths and weaknesses, built automatically from accumulated correction files and session data. **Includes Interference Detection Engine (see Appendix A, Change 2) — automatically detects when you consistently confuse two items and generates discrimination drills, based on Wozniak's Rule 11 + Eliason's deliberate practice principles.**

**Deliverables:**
1. Radar chart (6 axes): Grammar, Vocabulary, Reading, Listening, Writing, Speaking — scores 0-5
2. Error category breakdown: bar chart showing frequency of each error type
3. Trend lines: each skill's score over time (from multiple test corrections)
4. "Worst 5 errors" list with example sentences and correct forms
5. Grammar chapter heatmap: which chapters you're strong/weak in
6. Drill recommendation: "Based on your data, you should focus on: [top 3 weaknesses]"
7. All data comes from imported correction files + grammar session accuracy

**"I can..." checklist:**
- [ ] After importing 2+ correction files, the radar chart renders with real data
- [ ] I can see which error categories occur most frequently
- [ ] Trend lines show improvement or stagnation per skill
- [ ] The "worst errors" list updates after each correction import
- [ ] The grammar heatmap shows red for weak chapters, green for strong
- [ ] The drill recommendation changes based on my latest data

**Move-on criteria:** The dashboard tells you something you didn't already know about your weaknesses.

**Estimated time:** 5-6 hours to build (Recharts). 3 hours to learn charting.

---

### ═══════════════════════════════════════
### LAYER 11 — SHADOWING MODULE
### ═══════════════════════════════════════

**Goal:** Audio player for shadowing practice with lesson rotation tracking and progression stages.

**Deliverables:**
1. Import audio files (Assimil lessons, podcast episodes, custom audio)
2. Audio player with text display (target language transcript + translation toggle)
3. Lesson rotation: tracks current lesson + previous 5-7 in active rotation
4. Stage progression per lesson: Pre-shadow → Blind → Text → Solo
5. "Commute mode": queues today's rotation, auto-advances, works offline
6. Session auto-logged to journal
7. Minutes shadowed counter on dashboard

**"I can..." checklist:**
- [ ] I can import an Assimil audio file with its transcript
- [ ] The audio plays with text displayed underneath
- [ ] I can toggle the translation on/off
- [ ] Each lesson tracks its stage (pre-shadow, blind, text, solo)
- [ ] Commute mode queues my daily rotation and plays through them
- [ ] Sessions are auto-logged in the journal

**Estimated time:** 5-6 hours to build. 2 hours for audio handling concepts.

---

### ═══════════════════════════════════════
### LAYER 12 — BIDIRECTIONAL TRANSLATION MODULE
### ═══════════════════════════════════════

**Goal:** Lampariello's method built into the app. Read → understand → translate back → compare.

**Deliverables:**
1. Import texts (Assimil, articles, book excerpts, or paste directly)
2. Step-by-step flow: show target text → show translation → hide target → type your translation
3. Diff comparison: highlights differences between your translation and original
4. Errors logged to error pattern tracker
5. Texts organized by difficulty level and source
6. Sessions auto-logged to journal

**"I can..." checklist:**
- [ ] I can import or paste a bilingual text
- [ ] The app guides me through the 4-step bidirectional process
- [ ] After I translate back, it highlights where I differ from the original
- [ ] Errors are categorized and added to my error pattern data
- [ ] I can browse my translation history

**Estimated time:** 4-5 hours to build. 1 hour for new concepts (diff logic).

---

### ═══════════════════════════════════════
### LAYER 13 — SCRIPTORIUM MODULE
### ═══════════════════════════════════════

**Goal:** Arguelles' technique for script-heavy languages (Russian, Korean, Japanese, Arabic, Mandarin, Greek).

**Deliverables:**
1. Display a sentence in target language
2. Prompt: "Read aloud → Write by hand → Read your copy aloud"
3. Optional: record your reading (stored locally)
4. Mark as complete, advance to next sentence
5. Auto-enabled for non-Latin script languages during Script/Foundation phases
6. Sentences per session counter
7. Sessions auto-logged to journal

**"I can..." checklist:**
- [ ] The app presents sentences one at a time for scriptorium practice
- [ ] I can mark each sentence complete and move to the next
- [ ] My scriptorium sessions are tracked and logged
- [ ] The module is automatically suggested when I start Russian, Arabic, etc.

**Estimated time:** 3-4 hours to build. Minimal new concepts.

---

### ═══════════════════════════════════════
### LAYER 14 — MULTI-LANGUAGE + SECOND LANGUAGE SPRINT
### ═══════════════════════════════════════

**Goal:** Everything built for German now works for any language. Run the Greek deck through the pipeline to validate.

**Deliverables:**
1. Language selector on dashboard — switch active sprint language
2. All modules (palace, grammar, journal, tests) are language-scoped
3. Import pipeline tested on Greek deck (200-hour vocabulary)
4. Grammar exercise generation for Greek (using Claude chat, same JSON format, imported via script)
5. Sprint lifecycle: Locked → Active → Completed flow
6. Completed languages show on dashboard with C1 badge + date
7. "Next language" auto-suggests based on sprint order

**"I can..." checklist:**
- [ ] I can switch from German to Greek and see Greek-specific palace/grammar/journal
- [ ] Greek vocabulary imports correctly from the 200-hour deck
- [ ] Greek grammar exercises work in the same format as German
- [ ] Completing German's C1 test marks it as "Completed" with a badge
- [ ] The app suggests Spanish as the next sprint

**Move-on criteria:** Two languages work end-to-end in the app.

**Estimated time:** 6-8 hours to build. Mostly data pipeline work.

---

### ═══════════════════════════════════════
### LAYER 15 — POLISH, EXPORT, YOUTUBE MODE
### ═══════════════════════════════════════

**Goal:** The app is beautiful, fully functional, and ready to be shown on YouTube.

**Deliverables:**
1. Polished UI: animations, transitions, micro-interactions, loading states
2. Dashboard "hero section" with current sprint progress ring, gradient level, streak, hours
3. YouTube Mode: hides personal data, enlarges text, screen-recording friendly
4. Full data export: PDF report of learning journey per language
5. CSV/JSON export of all data (for backup or analysis)
6. "About this app" page explaining the method + tech stack (for YouTube walkthrough)
7. README.md with setup instructions for anyone who wants to fork it
8. Light/colorful theme refinement — your preferred white/blue/pink/green palette perfected
9. Mobile responsive — palace review and shadowing work on phone during commute
10. Performance optimization — app loads fast even with 10 languages of data

**"I can..." checklist:**
- [ ] The app feels polished and professional
- [ ] YouTube Mode makes the UI look great on screen recordings
- [ ] I can export a PDF report of my German learning journey
- [ ] The app works smoothly on my phone
- [ ] I can explain every component of the codebase on camera
- [ ] Someone could clone the repo, run setup, and have a working app

**Move-on criteria:** You're proud enough to put it on YouTube.

**Estimated time:** 8-10 hours to build. Mostly design and polish work.

---

## SUMMARY TABLE

| Layer | Core Deliverable | Key Skill Learned | Build Hours | Learn Hours |
|-------|-----------------|-------------------|-------------|-------------|
| 1 ✅ | HTML tools (DONE) | — | 0 | 0 |
| 2 | Session tracking + answers | JS Date, localStorage, Array methods | 3-4h | 1h |
| 3 | Next.js app foundation | React, Next.js, Tailwind | 6-8h | 12h |
| 4 | SQLite database | SQL, API routes, better-sqlite3 | 4-5h | 5h |
| 5 | Grammar module (full) | Export/import workflow, JSON parsing | 6-8h | 3h |
| 6 | Palace module | Image handling, file imports | 6-8h | 2h |
| 7 | Learning journal | Date handling, calendar rendering | 5-6h | 2h |
| 8 | Initial assessment test | Timer logic, file generation | 6-8h | 2h |
| 9 | Level-up test + gradient | Promotion logic, state machines | 8-10h | 2h |
| 10 | Weakness radar + dashboard | Recharts, data visualization | 5-6h | 3h |
| 11 | Shadowing module | Audio handling, offline storage | 5-6h | 2h |
| 12 | Bidirectional translation | Text diff, multi-step flows | 4-5h | 1h |
| 13 | Scriptorium | Audio recording (optional) | 3-4h | 1h |
| 14 | Multi-language + 2nd sprint | Data pipeline, language scoping | 6-8h | 2h |
| 15 | Polish + YouTube mode | Animations, PDF export, responsive | 8-10h | 2h |
| **TOTAL** | | | **~80-100h build** | **~40h learn** |
| **With Claude helping** | | | **~40-50h build** | **~40h learn** |

---

## THE RULE

**Don't move to the next layer until ALL "I can..." checkboxes pass for the current layer.**

Each layer is a YouTube video. Each layer teaches you a real engineering skill. Each layer makes the app more useful for your actual language learning.

Layer 1 is done. Start Layer 2 whenever you're ready.

---
---

# APPENDIX A — RESEARCH-BASED DESIGN PRINCIPLES
## Sourced from Piotr Wozniak (SuperMemo 20 Rules) & Nat Eliason (Deliberate Practice)

These three changes are non-negotiable design requirements derived from research documents Olivier accumulated during years of obsessively studying how to learn languages efficiently. They affect Layers 6, 8, 9, and 10.

---

## CHANGE 1: PALACE DRILL MODE (Affects Layer 6)
### Source: Wozniak Rule 4 — Minimum Information Principle

**The problem with the current palace card design:**
Each card currently shows everything at once: word, gender, translation, example sentence, image. This is great for initial learning and casual review. But Wozniak's research proves that retrieval is far more effective when each card tests ONE thing. The brain processes simple, single-retrieval items faster, retains them longer, and encounters less interference.

**The solution — three drill modes added to the Palace Module:**

**Mode 1: BROWSE (existing)**
Show the full card as designed. Word, gender color, image, click-to-reveal translation + example. This is the "walking the palace" experience. Used during commute review and initial vocabulary loading.

**Mode 2: DRILL — Isolated Retrieval**
Each vocabulary word generates 3-5 separate drill prompts, shown one at a time:

For a gendered language (German, French, Portuguese, Italian, Arabic):
```
Prompt Type 1 — Meaning:     "What does 'Schmetterling' mean?"    → butterfly
Prompt Type 2 — Gender:      "der, die, or das: Schmetterling?"   → der
Prompt Type 3 — Cloze:       "Der ___ flog über den Garten."      → Schmetterling
Prompt Type 4 — Reverse:     "How do you say 'butterfly' in German?" → Schmetterling
Prompt Type 5 — Example:     "Use 'Schmetterling' in a sentence." → free production
```

For a non-gendered language (Japanese, Korean, Mandarin, Russian):
```
Prompt Type 1 — Meaning:     "What does '蝶' mean?"               → butterfly
Prompt Type 2 — Reading:     "How do you read '蝶'?"              → ちょう (chou)
Prompt Type 3 — Cloze:       "庭に___が飛んでいた。"                → 蝶
Prompt Type 4 — Reverse:     "How do you say 'butterfly'?"         → 蝶 (ちょう)
Prompt Type 5 — Script:      "Write the character for butterfly"   → 蝶
```

The app serves prompts from the word's weakest type first. If you always get gender right but fail cloze, you see more cloze prompts for that word.

**Mode 3: DRILL — Weakest Words Only**
Same as Mode 2 but filtered to only show words marked as Shaky or Forgot. This is your "clean up the mess" session before moving to new landmarks.

**Database changes:**
```sql
-- Add to vocabulary table:
ALTER TABLE vocabulary ADD COLUMN drill_meaning_score REAL DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN drill_gender_score REAL DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN drill_cloze_score REAL DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN drill_reverse_score REAL DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN drill_production_score REAL DEFAULT 0;

-- Each drill attempt is logged:
CREATE TABLE vocabulary_drills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL,
  drill_type TEXT NOT NULL,       -- 'meaning', 'gender', 'cloze', 'reverse', 'production'
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,       -- how long it took to answer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id)
);
```

**UI behavior:**
- Palace landing page shows three buttons: Browse | Drill | Drill Weakest
- Drill mode shows one prompt at a time, full screen, clean UI
- After answering, immediate feedback: green flash for correct, red + correct answer for wrong
- Session stats at the end: X/Y correct, weakest type identified, time per prompt
- Auto-logged to journal

**"I can..." additions to Layer 6 checklist:**
- [ ] I can switch between Browse and Drill modes for any landmark
- [ ] Drill mode shows one prompt at a time testing a single aspect
- [ ] Each word has separate scores per drill type
- [ ] "Drill Weakest" filters to only Shaky/Forgot words
- [ ] After a drill session, I can see which prompt type I'm weakest at per word

**Estimated additional time:** +3-4 hours on top of Layer 6's existing 6-8 hours.

---

## CHANGE 2: INTERFERENCE DETECTION + DISCRIMINATION DRILLS (Affects Layer 10)
### Source: Wozniak Rule 11 — Combat Interference + Eliason — Deliberate Practice Targeting Weakest Sub-Skills

**The problem:**
When you learn similar things, you confuse them. This is the single biggest source of errors for advanced learners. Examples from your specific languages:

| Language | Interference Pair | Why it's confusing |
|----------|------------------|-------------------|
| German | Akkusativ / Dativ | Same prepositions take both depending on motion vs. location |
| German | wurde / würde | One letter difference: Preterite passive vs. Konjunktiv II |
| Spanish | ser / estar | Both mean "to be" with different usage rules |
| Spanish | por / para | Both mean "for" with different usage rules |
| Portuguese | Portuguese / Spanish false friends | exquisito, embarazada, etc. |
| Russian | imperfective / perfective verbs | Same verb with different aspects |
| Japanese | は (wa) / が (ga) | Both mark subjects but with different emphasis |
| Korean | 은/는 / 이/가 | Same topic/subject distinction as Japanese |
| Arabic | Form I-X verb patterns | 10 different patterns modifying the same root |
| Mandarin | 了/过/着 | Three aspect particles with overlapping functions |

**The solution — Interference Detection Engine:**

**Step 1: Automatic detection**
The error pattern tracker already logs every mistake with its category. The interference engine adds a second layer: when you get item A wrong and your wrong answer matches or resembles item B, that's an interference pair.

Example: You write "wurde" when the correct answer is "würde" → the system detects (wurde ↔ würde) as an interference pair. After this happens 3+ times, it's flagged as a confirmed interference pattern.

```sql
CREATE TABLE interference_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language_id INTEGER NOT NULL,
  item_a TEXT NOT NULL,           -- the correct answer you should have given
  item_b TEXT NOT NULL,           -- what you wrote instead (or vice versa)
  category TEXT,                  -- 'grammar', 'vocabulary', 'pronunciation'
  description TEXT,               -- human-readable: "Akkusativ/Dativ confusion with Wechselpräpositionen"
  occurrence_count INTEGER DEFAULT 1,
  last_occurred DATETIME,
  resolved BOOLEAN DEFAULT 0,    -- true when you get both right 5 times in a row
  FOREIGN KEY (language_id) REFERENCES languages(id)
);
```

**Step 2: Discrimination drills**
When an interference pair is detected, the app generates a special drill that presents BOTH items side by side and forces you to distinguish them.

Format:
```
═══════════════════════════════════════
DISCRIMINATION DRILL: wurde vs. würde
═══════════════════════════════════════

RULE REMINDER:
• wurde = Präteritum (past tense) → "was done"
• würde = Konjunktiv II (hypothetical) → "would be done"

DRILL: Choose the correct form for each sentence.

1. Das Haus _____ letztes Jahr gebaut.        [wurde / würde]
2. Wenn ich reich wäre, _____ ich ein Haus kaufen.  [wurde / würde]
3. Der Brief _____ gestern geschickt.          [wurde / würde]
4. Er sagte, er _____ gern helfen.             [wurde / würde]
5. Das Problem _____ sofort gelöst.            [wurde / würde]
6. Ich _____ das nie tun.                      [wurde / würde]
7. Die Straße _____ im Sommer repariert.       [wurde / würde]
8. Was _____ passieren, wenn...?               [wurde / würde]
```

Wait — this looks like multiple choice. And your system says no multiple choice. Here's the critical distinction: this is **forced binary discrimination**, not multiple choice. You're not picking from 4 random options. You're being forced to confront exactly the two items you confuse and decide between them. Wozniak specifically recommends this format for combating interference. After the binary drill, the app follows up with production drills where you have to write the full sentence from scratch.

**Step 3: Resolution tracking**
An interference pair is marked as "resolved" when you get both items correct 5 consecutive times in separate sessions. Until then, the discrimination drill keeps appearing in your review rotation.

**Step 4: Interference dashboard (part of Weakness Radar)**
Visual display showing:
- All active interference pairs ranked by occurrence count
- Trend line per pair (improving / stagnating)
- Resolved pairs (with date resolved)
- "Most confused" highlight at top of dashboard

**"I can..." additions to Layer 10 checklist:**
- [ ] When I consistently confuse two items, the app detects it automatically
- [ ] A discrimination drill appears that forces me to distinguish the pair
- [ ] Each pair tracks its occurrence count and resolution status
- [ ] The interference dashboard shows my most confused pairs
- [ ] A pair is marked "resolved" after 5 consecutive correct answers in separate sessions

**Estimated additional time:** +4-5 hours on top of Layer 10's existing 5-6 hours.

---

## CHANGE 3: INPUT-FIRST SPRINT OPENING (Affects Layer 8 Training Plan Generator)
### Source: Wozniak Rule 2 — Learn Before You Memorize

**The problem:**
The natural instinct when starting a new language is to immediately start memorizing vocabulary and drilling grammar. Wozniak's research shows this is backwards. If you memorize individual pieces before understanding the overall structure, each piece is an isolated fact with no framework to attach to — like memorizing individual German words before knowing what a sentence even looks like. Retention is dramatically worse.

**The solution — enforce a "Comprehension Phase" at the start of every sprint:**

When the Training Plan Generator creates a plan after the initial assessment, the first 1-2 weeks are LOCKED to input-only activities. No palace loading. No grammar drills. No vocabulary memorization.

**What the first 2 weeks look like:**

| Day | Activity | Duration | Method | Purpose |
|-----|----------|----------|--------|---------|
| 1-3 | Listen to beginner audio (Assimil, Pod101) | 60 min | Kaufmann | Hear the sounds, rhythm, patterns |
| 1-3 | Read beginner text with translation alongside | 60 min | Lampariello | See the structure, recognize cognates |
| 1-3 | Watch content with target language subtitles | 60 min | Kaufmann | Connect sounds to written forms |
| 4-7 | Shadowing beginner audio (pre-shadow stage) | 30 min | Arguelles | Begin producing sounds without understanding |
| 4-7 | Bilingual reading (read target → read translation → re-read target) | 30 min | Lampariello | Deepen structural understanding |
| 4-7 | Extended listening (podcasts, radio, TV) | 60 min | Kaufmann | Build tolerance for natural speed |
| 8-14 | Shadowing with text | 30 min | Arguelles | Connect sounds to words |
| 8-14 | First Assimil lessons (read, listen, understand — NO memorization yet) | 30 min | Lampariello | Structured introduction to grammar |
| 8-14 | Continue extensive input | 60 min | Kaufmann | Volume, volume, volume |

**What is NOT allowed in the first 2 weeks:**
- ❌ Palace vocabulary loading
- ❌ Grammar exercises
- ❌ Anki/SRS review
- ❌ Vocabulary memorization of any kind
- ❌ Writing practice
- ❌ Level-up tests

**What IS tracked in the journal:**
- ✅ Listening hours
- ✅ Reading hours (with source: Assimil, book, article)
- ✅ Shadowing minutes
- ✅ Content watched (show, episode, duration)
- ✅ "Words I noticed" — a casual list of words that jumped out (NOT for memorization, just awareness)

**After 2 weeks, the plan unlocks Phase 2:**
- Palace loading begins (the words from "words I noticed" get priority slots)
- Grammar exercises begin (starting with the structures you encountered most in your reading)
- Shadowing progresses to text-shadow and solo stages
- The sprint enters full intensity

**App enforcement:**
- During the Input Phase, the Palace and Grammar modules show a lock icon with the message: "Comprehension Phase: Week X of 2. Focus on input. These modules unlock on [date]."
- The Journal tracks input hours with a target bar: "Input target this week: 15 hours. Current: 8.5 hours."
- At the end of Week 2, the app runs a quick comprehension check: "After 2 weeks of input, can you understand the gist of a simple text? If yes, you're ready for Phase 2." This is not graded — it's a self-assessment gate.

**Exception for reactivation sprints:**
For languages where you have a dormant foundation (Spanish, Portuguese, Italian), the Input Phase is shortened to 1 week or can be skipped entirely after the initial assessment proves you're already at B1+. The assessment test results determine whether the Input Phase is 0, 1, or 2 weeks.

**Training plan generator logic:**
```
IF assessed_level >= B1:
    input_phase_weeks = 0   # Skip — you already have the big picture
ELIF assessed_level >= A2:
    input_phase_weeks = 1   # Abbreviated — refresh the structure
ELSE:
    input_phase_weeks = 2   # Full comprehension phase
```

**"I can..." additions to Layer 8 checklist:**
- [ ] When I start a new language from below A2, the first 2 weeks only allow input activities
- [ ] Palace and Grammar modules show a lock icon during the Input Phase
- [ ] The journal tracks input hours with a weekly target bar
- [ ] After the Input Phase, modules unlock and the sprint enters full intensity
- [ ] For reactivation languages (assessed B1+), the Input Phase is skipped automatically

**Estimated additional time:** +2-3 hours on top of Layer 8's existing 6-8 hours.

---

## APPENDIX A-2: WOZNIAK'S 20 RULES — IN-APP REFERENCE PAGE

The app should include a reference page (accessible from Settings or Help) that lists all 20 rules with language-learning-specific examples. This serves two purposes: it reminds you WHY the app works the way it does, and it's YouTube content ("The 20 rules that every language learner should know").

**The 10 rules most relevant to Polyglot OS:**

| # | Rule | How the App Implements It |
|---|------|--------------------------|
| 1 | Do not learn what you don't understand | Grammar rule explanation appears before exercises. Palace words require example sentences. |
| 2 | Learn before you memorize | Input-First Sprint Opening (Change 3). No memorization for first 1-2 weeks. |
| 3 | Build upon the basics | Frequency-sorted vocabulary. Most common words loaded into palace first. |
| 4 | Minimum information principle | Palace Drill Mode (Change 1). One retrieval per prompt. |
| 5 | Cloze deletion is effective | Cloze is one of the 5 drill types in Palace Drill Mode. |
| 6 | Use imagery | Palace cards include images. Requirement to add images for all language decks. |
| 7 | Use mnemonics | The entire mental palace system IS a mnemonic technique. |
| 9 | Avoid sets | Grammar exercises test one structure per sentence. Palace reviews one word at a time. |
| 11 | Combat interference | Interference Detection Engine (Change 2). Discrimination drills. |
| 13 | Personalize and provide examples | Palace words accept personal notes. Emotional/vivid associations encouraged. |

The remaining 10 rules (redundancy, sources, date stamping, prioritizing, emotional states, context cues, optimize wording, refer to other memories, graphic deletion, avoid enumerations) are displayed as secondary reference with brief explanations.

**Build time:** 1-2 hours. Can be done during Layer 15 (Polish) or earlier as a static markdown page.

---

## UPDATED SUMMARY TABLE

| Layer | Core Deliverable | Original Hours | Added by Appendix A | New Total |
|-------|-----------------|---------------|---------------------|-----------|
| 6 | Palace module | 6-8h build | +3-4h (Drill Mode) | 9-12h build |
| 8 | Initial assessment + training plan | 6-8h build | +2-3h (Input Phase enforcement) | 8-11h build |
| 10 | Weakness radar + dashboard | 5-6h build | +4-5h (Interference Engine) | 9-11h build |
| 15 | Polish + YouTube mode | 8-10h build | +1-2h (Wozniak reference page) | 9-12h build |
| **Total impact** | | **~80-100h** | **+10-14h** | **~90-114h build** |
| **With Claude helping** | | **~40-50h** | **+5-7h** | **~45-57h build** |
