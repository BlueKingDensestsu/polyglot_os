# POLYGLOT OS — Layer 3 & Layer 4 Complete Guide

---

## PART 1: LAYER 3 — HOW TO USE, MAINTAIN & RUN

Layer 3 is the Next.js foundation. Here's everything you need to know.

### Prerequisites (install once)

```bash
# 1. Install Node.js (v18 or newer)
# Download from: https://nodejs.org (LTS version)
# Verify it worked:
node --version    # Should show v18.x.x or v20.x.x
npm --version     # Should show 9.x.x or 10.x.x
```

### First-time Setup

```bash
# 2. Clone your repo (if not already done)
git clone https://github.com/YOUR_USERNAME/polyglot-os.git
cd polyglot-os

# 3. Install all dependencies
npm install
# This reads package.json and downloads React, Next.js, Tailwind, etc.
# into the node_modules/ folder (~200MB). Takes 1-2 minutes.
# You NEVER touch node_modules/ manually.

# 4. Start the development server
npm run dev
# Opens: http://localhost:3000
```

### Daily Workflow

```bash
# Every time you want to work on the app:
cd polyglot-os
npm run dev

# That's it. Open http://localhost:3000 in Chrome.
# The server watches for file changes and auto-reloads.
# Press Ctrl+C in the terminal to stop the server.
```

### Key Files You'll Edit

```
polyglot-os/
├── app/                      ← YOUR PAGES (Next.js App Router)
│   ├── layout.js             ← Root layout (wraps every page)
│   ├── page.js               ← Home page (http://localhost:3000/)
│   ├── grammar/
│   │   ├── page.js           ← Chapter list (http://localhost:3000/grammar)
│   │   └── [chapter]/
│   │       └── page.js       ← Single chapter (http://localhost:3000/grammar/25)
│   └── globals.css           ← Global styles (Tailwind directives live here)
├── components/               ← REUSABLE UI PIECES
│   ├── ChapterCard.js        ← One chapter card on the grid
│   ├── ExerciseBlock.js      ← Expandable exercise with prompts
│   └── Navbar.js             ← Top navigation bar
├── public/                   ← STATIC FILES (images, audio, etc.)
│   └── media/                ← Palace images and audio will go here
├── package.json              ← PROJECT CONFIG (dependencies, scripts)
├── tailwind.config.js        ← TAILWIND CONFIG (colors, fonts)
└── next.config.js            ← NEXT.JS CONFIG (usually leave alone)
```

### How Routing Works

Next.js App Router = folder structure IS the URL structure:

```
app/page.js                    → http://localhost:3000/
app/grammar/page.js            → http://localhost:3000/grammar
app/grammar/[chapter]/page.js  → http://localhost:3000/grammar/25
app/palace/page.js             → http://localhost:3000/palace
app/journal/page.js            → http://localhost:3000/journal
```

The `[chapter]` folder with brackets = dynamic route. Whatever value is in the URL
gets passed to the page as a parameter. So `/grammar/25` renders the page with
`chapter = "25"`.

### How to Add a New Page

```bash
# Example: add a palace page
mkdir -p app/palace
```

Then create `app/palace/page.js`:
```jsx
export default function PalacePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Mental Palace</h1>
      <p>Your landmarks will appear here.</p>
    </div>
  );
}
```

Visit `http://localhost:3000/palace` — it just works.

### How Tailwind CSS Works

Instead of writing CSS files, you add classes directly to HTML elements:

```jsx
// OLD WAY (CSS file):
// .title { font-size: 24px; font-weight: bold; color: blue; }
// <h1 className="title">Hello</h1>

// TAILWIND WAY (classes directly):
<h1 className="text-2xl font-bold text-blue-600">Hello</h1>
```

Common classes you'll use:
```
p-4         → padding: 1rem (all sides)
px-6        → padding-left + right: 1.5rem
mt-4        → margin-top: 1rem
flex        → display: flex
grid        → display: grid
grid-cols-3 → 3-column grid
rounded-xl  → border-radius: 0.75rem
bg-white    → background: white
shadow-md   → medium box shadow
text-lg     → font-size: 1.125rem
font-bold   → font-weight: 700
hover:bg-gray-100 → background on hover
```

Full reference: https://tailwindcss.com/docs

### Common Commands

```bash
npm run dev          # Start development server (auto-reload)
npm run build        # Build for production (check for errors)
npm run lint         # Check for code issues
npx next info        # Show Next.js environment info
```

### Troubleshooting

**"Module not found" error:**
```bash
npm install          # Reinstall dependencies
```

**Port 3000 already in use:**
```bash
# Either kill the old process:
lsof -i :3000       # Find the PID
kill -9 <PID>        # Kill it

# Or use a different port:
npm run dev -- -p 3001
```

**Blank page / hydration error:**
- Check the terminal for error messages
- Make sure you're using `'use client'` at the top of files that use useState/useEffect
- Make sure component names start with uppercase

**Changes not showing:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Restart server: Ctrl+C then `npm run dev`

### Git Workflow (commit after each feature)

```bash
git add .
git commit -m "Layer 3: grammar chapter grid with Tailwind styling"
git push origin main
```

### Key React Concepts (minimum you need)

```jsx
'use client';  // Required at top of any file using useState/useEffect

import { useState, useEffect } from 'react';

export default function MyComponent() {
  // STATE: data that changes and triggers re-renders
  const [count, setCount] = useState(0);
  const [chapters, setChapters] = useState([]);

  // EFFECT: runs code when component loads or dependencies change
  useEffect(() => {
    fetch('/api/chapters?lang=de')
      .then(res => res.json())
      .then(data => setChapters(data));
  }, []);  // [] = run once on load

  // JSX: HTML-like syntax that React renders
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {chapters.map(ch => (
        <div key={ch.id}>{ch.title}</div>
      ))}
    </div>
  );
}
```

That's 90% of what you need for Layers 3-6.

---

## PART 2: LAYER 4 — SQLITE DATABASE SETUP

### What Layer 4 Does

Replaces localStorage (browser-only, fragile) with SQLite (permanent file on disk,
queryable with SQL). Your exercises, answers, sessions, and progress are now in
`data/polyglot.db` — a single file that you can back up, query, and never lose.

### Files to Add

Copy these files into your project:

```
polyglot-os/
├── lib/
│   └── db.js                    ← Database connection helper
├── scripts/
│   ├── setup-db.js              ← Creates all tables
│   ├── seed-languages.js        ← Populates 10 languages + landmarks
│   └── import-exercises.js      ← Loads exercises JSON into tables
├── app/api/
│   ├── languages/route.js       ← GET/PATCH languages
│   ├── chapters/route.js        ← GET chapters + exercises
│   ├── exercises/route.js       ← POST answers, export, import corrections
│   └── sessions/route.js        ← POST/PATCH/GET sessions + streaks
└── data/
    └── .gitkeep                 ← Placeholder (polyglot.db created by setup)
```

### Step-by-Step Setup

```bash
# 1. Install the SQLite library (pure JS — no compilation needed)
npm install sql.js

# 2. Add scripts to package.json
# Open package.json and add these to the "scripts" section:
#   "db:setup": "node scripts/setup-db.js",
#   "db:seed": "node scripts/seed-languages.js",
#   "db:import-exercises": "node scripts/import-exercises.js",
#   "db:reset": "rm -f data/polyglot.db && npm run db:setup && npm run db:seed",
#   "db:verify": "node -e \"const D=require('better-sqlite3');const db=new D('data/polyglot.db');console.log('Languages:',db.prepare('SELECT COUNT(*) as c FROM languages').get().c);console.log('Chapters:',db.prepare('SELECT COUNT(*) as c FROM grammar_chapters').get().c);console.log('Exercises:',db.prepare('SELECT COUNT(*) as c FROM grammar_exercises').get().c);console.log('Prompts:',db.prepare('SELECT COUNT(*) as c FROM grammar_prompts').get().c);db.close()\""

# 3. Create the database
npm run db:setup
# Expected output: ✅ Created 14 tables, ✅ Created 11 indexes

# 4. Seed the languages
npm run db:seed
# Expected output: ✅ Languages seeded: 10 (with all flags and backgrounds)

# 5. Import your exercises (put exercises_database.json in data/ first)
cp /path/to/exercises_database.json data/
node scripts/import-exercises.js de data/exercises_database.json
# Expected output for German: 27 chapters, 1,350 exercises, 9,155 prompts

# 6. Verify everything
npm run db:verify
# Should show: Languages: 10, Chapters: 27, Exercises: 1350, Prompts: 9155

# 7. Start the app
npm run dev
```

### Importing Other Language Exercises

```bash
# Greek exercises
node scripts/import-exercises.js el data/greek_exercises.json

# Russian exercises
node scripts/import-exercises.js ru data/russian_exercises.json

# Spanish exercises
node scripts/import-exercises.js es data/spanish_exercises.json
```

The import script auto-detects the JSON format (German, Greek, Russian, Spanish
all have slightly different structures — it handles all of them).

### How to Query the Database Directly

For learning SQL (critical for data engineering), you can query directly:

```bash
# Option 1: Use the sqlite3 CLI
# Install: sudo apt install sqlite3 (Linux) or brew install sqlite3 (Mac)
sqlite3 data/polyglot.db

# Then type SQL:
SELECT * FROM languages ORDER BY sprint_order;
SELECT COUNT(*) FROM grammar_prompts;
SELECT gc.title, COUNT(gp.id) as prompts
  FROM grammar_chapters gc
  JOIN grammar_exercises ge ON ge.chapter_id = gc.id
  JOIN grammar_prompts gp ON gp.exercise_id = ge.id
  WHERE gc.language_id = 1
  GROUP BY gc.id
  ORDER BY gc.chapter_number;

# Option 2: Use a GUI tool
# Download "DB Browser for SQLite" — free, visual, great for learning
# https://sqlitebrowser.org/
# Open data/polyglot.db, click "Browse Data", run queries in the SQL tab
```

### How the Frontend Calls the Database

The frontend (React components) NEVER touches the database directly.
Instead it calls API routes, which talk to SQLite:

```
Browser (React)  →  API Route (/api/chapters)  →  SQLite (polyglot.db)
     ↑                                                    ↓
     └──────────── JSON response ←─────────────────────────┘
```

Example in a React component:
```jsx
'use client';
import { useState, useEffect } from 'react';

export default function GrammarPage() {
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    // This calls app/api/chapters/route.js → which queries SQLite
    fetch('/api/chapters?lang=de')
      .then(res => res.json())
      .then(data => setChapters(data));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 p-8">
      {chapters.map(ch => (
        <a key={ch.id} href={`/grammar/${ch.chapter_number}`}
           className="bg-white rounded-xl p-4 shadow hover:shadow-lg">
          <span className="text-sm text-gray-500">Ch {ch.chapter_number}</span>
          <h3 className="font-bold">{ch.title}</h3>
          <p className="text-sm text-green-600">
            {ch.prompts_answered}/{ch.prompt_count} answered
          </p>
        </a>
      ))}
    </div>
  );
}
```

### API Reference

**Languages:**
```
GET  /api/languages           → All 10 languages with stats
GET  /api/languages?code=de   → German with full stats
PATCH /api/languages          → Update: { code: 'de', status: 'active' }
```

**Chapters:**
```
GET  /api/chapters?lang=de              → All 27 German chapters with completion %
GET  /api/chapters?lang=de&chapter=25   → Chapter 25 with all exercises + prompts + last answers
```

**Exercises:**
```
POST /api/exercises  { action: 'answer', prompt_id: 42, user_answer: 'Das Haus wird gebaut' }
POST /api/exercises  { action: 'answers', session_id: 1, answers: [...] }
POST /api/exercises  { action: 'export', lang: 'de', chapter_number: 25 }
POST /api/exercises  { action: 'import', corrections: [...] }
```

**Sessions:**
```
POST  /api/sessions           → Start: { lang: 'de', type: 'grammar' }
PATCH /api/sessions           → End: { session_id: 1, notes: 'Focused on Passiv' }
GET   /api/sessions?lang=de   → Recent sessions
GET   /api/sessions?lang=de&stats=daily   → Daily minutes (for heatmap)
GET   /api/sessions?lang=de&stats=streak  → Current & longest streak
```

### The Correction Workflow

This is the full loop that replaces the manual paste-to-Claude process:

1. **Do exercises** → answers saved to `grammar_answers` table
2. **Click Export** → app calls `POST /api/exercises { action: 'export', lang: 'de', chapter_number: 25 }`
3. **App shows .txt** → you copy it
4. **Paste to Claude** → Claude grades it and returns a JSON array
5. **Click Import** → paste Claude's JSON, app calls `POST /api/exercises { action: 'import', corrections: [...] }`
6. **App updates** → answers marked correct/incorrect, error patterns updated, weakness radar recalculated

### .gitignore Addition

Add this to your `.gitignore`:
```
# Database (don't commit — it's generated from scripts + your personal data)
data/polyglot.db
data/polyglot.db-wal
data/polyglot.db-shm

# Keep the data directory itself
!data/.gitkeep
```

### Maintenance

**Backup your database:**
```bash
cp data/polyglot.db data/polyglot_backup_$(date +%Y%m%d).db
```

**Reset everything (nuclear option):**
```bash
npm run db:reset
# Then re-import exercises:
node scripts/import-exercises.js de data/exercises_database.json
```

**Add a new table later:**
Edit `scripts/setup-db.js`, add the new CREATE TABLE, run `npm run db:setup` again.
It uses IF NOT EXISTS so it won't break existing tables.

### "I can..." Checklist (Layer 4 Done When All Pass)

- [ ] `npm run db:setup` creates polyglot.db with 14 tables
- [ ] `npm run db:seed` creates 10 languages with flags and backgrounds
- [ ] `node scripts/import-exercises.js de data/exercises_database.json` imports 27 chapters / 1,350 exercises / 9,155 prompts
- [ ] `npm run db:verify` shows correct counts for all tables
- [ ] I can open DB Browser for SQLite and see my data
- [ ] `http://localhost:3000/api/languages` returns JSON with 10 languages
- [ ] `http://localhost:3000/api/chapters?lang=de` returns 27 chapters
- [ ] `http://localhost:3000/api/chapters?lang=de&chapter=25` returns Passiv exercises with prompts
- [ ] The grammar page loads exercises from SQLite instead of localStorage
- [ ] I can submit an answer via the API and see it in the database
- [ ] I can export answers as .txt, paste to Claude, and import corrections back
- [ ] I understand what each SQL table does (can explain on YouTube)
- [ ] I committed to GitHub: `git commit -m "Layer 4: SQLite database with full exercise import"`

### What You'll Learn (Data Engineering Skills)

| Skill | Relevance |
|-------|-----------|
| SQL CREATE TABLE with types and constraints | Same in PostgreSQL, Snowflake, BigQuery |
| Foreign keys and referential integrity | Core database design concept |
| Indexes for query performance | Critical for data pipelines |
| Transactions for batch operations | Used in every ETL job |
| SQL JOINs across related tables | THE most important SQL skill |
| INSERT ... ON CONFLICT (upsert) | Common pattern in data loading |
| Aggregation (COUNT, SUM, AVG, GROUP BY) | Daily bread of data engineering |
| WAL mode and concurrency | How production databases handle reads/writes |

---

*After Layer 4 passes all checkboxes: commit, push, and move to Layer 5
(answer tracking + the full export→Claude→import correction loop in the UI).*
