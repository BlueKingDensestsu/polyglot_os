# 🧠 Polyglot OS — Language Mastery Sprint System

Sprint to C1 fluency in 10 languages using the Mental Palace + Grammar Trainer system.

## Quick Start

```bash
npm install
cp your/exercises_database.json public/
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Layer 3 Features

- ✅ Next.js 14 + Tailwind CSS foundation
- ✅ Per-language, per-module theme system (Wozniak Rule 15)
- ✅ Grammar trainer with all 1,350 German exercises
- ✅ Session timer + autosave every 30 seconds
- ✅ Flag exercises as difficult
- ✅ Export with gradient rubric for Claude correction
- ✅ Wozniak 20 Rules reference tab on home page
- ✅ Ctrl+Enter to export, Ctrl+S to save

## Architecture

```
polyglot-os/
├── app/
│   ├── layout.js              ← Root layout
│   ├── page.js                ← Home dashboard
│   ├── globals.css            ← Tailwind + fonts
│   └── grammar/
│       ├── page.js            ← Chapter list (themed)
│       └── [lang]/[chapter]/
│           └── page.js        ← Exercise view (themed)
├── components/
│   └── WozniakRules.jsx       ← 20 Rules reference panel
├── lib/
│   ├── themes.js              ← Per-language, per-module visual configs
│   └── storage.js             ← localStorage helpers
└── public/
    └── exercises_database.json ← Your exercise data
```

## Tech Stack

- **Next.js 14.2.21** (stable, pinned)
- **React 18.3.1** (stable, NOT 19 RC)
- **Tailwind CSS 3.4.17**
- **SQLite** (coming in Layer 4)

## Build Layers

See POLYGLOT_OS_15_LAYER_BUILD_PLAN.md for the full roadmap.

Built by Olivier — from 16 months of manual Anki screenshots to a full automated system.
