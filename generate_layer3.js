#!/usr/bin/env node
/**
 * POLYGLOT OS — Layer 3 Project Generator
 * Run: node generate_layer3.js
 * Creates the complete Next.js project structure
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, 'polyglot-os');

function writeFile(relPath, content) {
  const fullPath = path.join(PROJECT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart());
  console.log(`  ✓ ${relPath}`);
}

console.log('🧠 Generating Polyglot OS — Layer 3...\n');

// ═══════════════════════════════════════════
// PACKAGE.JSON — Pinned stable versions
// ═══════════════════════════════════════════
writeFile('package.json', `
{
  "name": "polyglot-os",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.21",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "autoprefixer": "10.4.20",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.17",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.21"
  }
}
`);

// ═══════════════════════════════════════════
// CONFIG FILES
// ═══════════════════════════════════════════
writeFile('next.config.js', `
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
`);

writeFile('postcss.config.js', `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

writeFile('tailwind.config.js', `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
`);

writeFile('.gitignore', `
node_modules/
.next/
.env.local
.env
*.db
.DS_Store
`);

writeFile('.eslintrc.json', `
{
  "extends": "next/core-web-vitals"
}
`);

// ═══════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════
writeFile('app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
    font-family: 'Nunito', system-ui, sans-serif;
  }
}
`);

// ═══════════════════════════════════════════
// LIB — THEME SYSTEM
// ═══════════════════════════════════════════
writeFile('lib/themes.js', `
/**
 * POLYGLOT OS — Per-Language, Per-Module Theme System
 * 
 * Each language-module pair has its own visual identity.
 * Components read from this config to render differently.
 * German Palace looks different from German Grammar.
 * Greek Palace looks different from German Palace.
 * 
 * This is Wozniak Rule 15: context cues simplify recall.
 */

export const THEMES = {
  // ─── GERMAN ───
  'de-grammar': {
    name: 'German Grammar',
    primary: '#0d9488',        // teal
    accent: '#0ea5e9',         // sky blue
    headerGradient: 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    exerciseColors: {
      transform: '#14b8a6',    // teal
      error_fix: '#f43f5e',    // coral
      translate: '#f59e0b',    // amber
      produce: '#8b5cf6',      // violet
      paragraph: '#0ea5e9',    // sky
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'der' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'die' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'das' },
    },
  },
  'de-palace': {
    name: 'German Palace',
    primary: '#2563eb',        // blue
    accent: '#7c3aed',         // violet
    headerGradient: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'der' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'die' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'das' },
    },
  },

  // ─── GREEK ───
  'el-grammar': {
    name: 'Greek Grammar',
    primary: '#1e40af',        // deep blue
    accent: '#06b6d4',         // cyan
    headerGradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    exerciseColors: {
      transform: '#2563eb',
      error_fix: '#dc2626',
      translate: '#ea580c',
      produce: '#7c3aed',
      paragraph: '#0891b2',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'ο' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'η' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'το' },
    },
  },
  'el-palace': {
    name: 'Greek Palace',
    primary: '#0369a1',        // ocean blue
    accent: '#0d9488',         // teal
    headerGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'ο' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'η' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'το' },
    },
  },

  // ─── RUSSIAN ───
  'ru-grammar': {
    name: 'Russian Grammar',
    primary: '#7f1d1d',        // deep red
    accent: '#dc2626',         // red
    headerGradient: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    exerciseColors: {
      transform: '#b91c1c',
      error_fix: '#c2410c',
      translate: '#a16207',
      produce: '#6d28d9',
      paragraph: '#0e7490',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'м' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'ж' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'ср' },
    },
  },
  'ru-palace': {
    name: 'Russian Palace',
    primary: '#991b1b',
    accent: '#ea580c',
    headerGradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Noto Sans', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'м' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'ж' },
      N: { bg: '#dcfce7', border: '#22c55e', text: '#15803d', label: 'ср' },
    },
  },

  // ─── SPANISH ───
  'es-grammar': {
    name: 'Spanish Grammar',
    primary: '#c2410c',        // orange-red
    accent: '#f59e0b',         // amber
    headerGradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    exerciseColors: {
      transform: '#ea580c',
      error_fix: '#dc2626',
      translate: '#ca8a04',
      produce: '#7c3aed',
      paragraph: '#0891b2',
    },
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'el' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'la' },
    },
  },
  'es-palace': {
    name: 'Spanish Palace',
    primary: '#b45309',
    accent: '#d97706',
    headerGradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    fontFamily: "'Nunito', system-ui, sans-serif",
    genderColors: {
      M: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', label: 'el' },
      F: { bg: '#fce7f3', border: '#ec4899', text: '#be185d', label: 'la' },
    },
  },
};

/**
 * Get theme for a language-module combination
 * Falls back to German grammar if not found
 */
export function getTheme(langCode, module) {
  const key = langCode + '-' + module;
  return THEMES[key] || THEMES['de-grammar'];
}

/**
 * Get all available languages
 */
export function getLanguages() {
  const langs = {};
  Object.keys(THEMES).forEach(key => {
    const [code] = key.split('-');
    if (!langs[code]) {
      langs[code] = {
        code,
        name: { de: 'German', el: 'Greek', ru: 'Russian', es: 'Spanish', 
                ko: 'Korean', pt: 'Portuguese', ja: 'Japanese', it: 'Italian',
                ar: 'Arabic', zh: 'Mandarin' }[code] || code,
        flag: { de: '🇩🇪', el: '🇬🇷', ru: '🇷🇺', es: '🇪🇸',
                ko: '🇰🇷', pt: '🇵🇹', ja: '🇯🇵', it: '🇮🇹',
                ar: '🇸🇦', zh: '🇨🇳' }[code] || '🌍',
      };
    }
  });
  return Object.values(langs);
}
`);

// ═══════════════════════════════════════════
// LIB — LOCALSTORAGE HELPERS
// ═══════════════════════════════════════════
writeFile('lib/storage.js', `
/**
 * POLYGLOT OS — localStorage helpers
 * Temporary persistence layer (replaced by SQLite in Layer 4)
 */

const PREFIX = 'polyglot_';

export function loadJSON(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('loadJSON failed:', key, e);
    return fallback;
  }
}

export function saveJSON(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('saveJSON failed:', key, e);
  }
}

export function removeKey(key) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFIX + key);
}
`);

// ═══════════════════════════════════════════
// APP — ROOT LAYOUT
// ═══════════════════════════════════════════
writeFile('app/layout.js', `
import './globals.css';

export const metadata = {
  title: 'Polyglot OS — Language Mastery System',
  description: 'Sprint to C1 fluency in 10 languages with the Mental Palace + Grammar Trainer system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

// ═══════════════════════════════════════════
// APP — HOME PAGE (DASHBOARD)
// ═══════════════════════════════════════════
writeFile('app/page.js', `
'use client';

import { useState } from 'react';
import Link from 'next/link';
import WozniakRules from '../components/WozniakRules';

export default function Home() {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="text-white px-6 py-5 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">🧠 Polyglot OS</h1>
            <p className="text-sm opacity-70 mt-0.5">Language Mastery Sprint System</p>
          </div>
          <button
            onClick={() => setShowRules(!showRules)}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{ 
              background: showRules ? 'white' : 'rgba(255,255,255,0.15)',
              color: showRules ? '#1a1a2e' : 'white',
            }}
          >
            📖 20 Rules
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Wozniak Rules Panel */}
        {showRules && <WozniakRules onClose={() => setShowRules(false)} />}

        {/* Active Sprint */}
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-gray-700 mb-4">🔥 Active Sprint</h2>
          <div 
            className="rounded-2xl p-6 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0ea5e9 100%)' }}
          >
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl">🇩🇪</span>
              <div>
                <h3 className="text-xl font-extrabold">German — C1 Sprint</h3>
                <p className="text-sm opacity-80">B1 → C1 · Goethe Exam June 2026</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Link 
                href="/grammar?lang=de"
                className="px-5 py-2.5 bg-white text-teal-700 rounded-xl font-bold text-sm hover:shadow-md transition-all"
              >
                📝 Grammar Trainer
              </Link>
              <button 
                className="px-5 py-2.5 bg-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/30 transition-all cursor-not-allowed"
                title="Coming in Layer 6"
              >
                🏰 Mental Palace (Layer 6)
              </button>
            </div>
          </div>
        </section>

        {/* Upcoming Languages */}
        <section>
          <h2 className="text-lg font-extrabold text-gray-700 mb-4">📋 Sprint Queue</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { flag: '🇪🇸', name: 'Spanish', level: 'Dormant B2', order: 2 },
              { flag: '🇬🇷', name: 'Greek', level: 'A2', order: 3 },
              { flag: '🇷🇺', name: 'Russian', level: 'A1 gram.', order: 4 },
              { flag: '🇰🇷', name: 'Korean', level: 'A1 read', order: 5 },
              { flag: '🇵🇹', name: 'Portuguese', level: 'A2-B1', order: 6 },
              { flag: '🇯🇵', name: 'Japanese', level: '900 kanji', order: 7 },
              { flag: '🇮🇹', name: 'Italian', level: 'Cascade', order: 8 },
              { flag: '🇸🇦', name: 'Arabic', level: 'Pre-A1', order: 9 },
              { flag: '🇨🇳', name: 'Mandarin', level: 'Pre-A1', order: 10 },
            ].map((lang) => (
              <div 
                key={lang.name}
                className="bg-white rounded-xl p-3 shadow-sm border-2 border-gray-100 opacity-60 text-center"
              >
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="text-xs font-bold text-gray-800">{lang.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{lang.level}</div>
                <div className="text-[10px] text-gray-300 mt-1">Sprint #{lang.order}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
`);

// ═══════════════════════════════════════════
// APP — GRAMMAR CHAPTER LIST
// ═══════════════════════════════════════════
writeFile('app/grammar/page.js', `
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getTheme } from '../../lib/themes';
import { loadJSON } from '../../lib/storage';

export default function GrammarChapterList() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') || 'de';
  const theme = getTheme(lang, 'grammar');
  
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});

  useEffect(() => {
    // Load exercises from JSON
    fetch('/exercises_database.json')
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => setData(d))
      .catch(() => setData(null));

    setAnswers(loadJSON('grammar_answers', {}));
    setFlags(loadJSON('grammar_flags', {}));
  }, []);

  function getChapterProgress(chNum) {
    const prefix = 'ch' + chNum + '_';
    const answered = Object.keys(answers).filter(k => k.startsWith(prefix) && answers[k]?.trim()).length;
    return answered;
  }

  function getChapterTotal(chapter) {
    return chapter.exercises.reduce((s, ex) => s + Math.max(ex.prompts?.length || 0, 1), 0);
  }

  function getChapterFlagCount(chNum) {
    const prefix = 'ch' + chNum + '_';
    return Object.keys(flags).filter(k => k.startsWith(prefix) && flags[k]).length;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-bold mb-2">Loading exercises...</h2>
          <p className="text-gray-400 text-sm">
            Place exercises_database.json in the public/ folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — uses theme */}
      <header className="text-white px-6 py-4 shadow-lg" style={{ background: theme.headerGradient }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/70 hover:text-white text-sm font-bold">← Home</Link>
            <div>
              <h1 className="text-lg font-extrabold">{theme.name}</h1>
              <p className="text-xs opacity-70">{data.chapters.length} chapters · {data.total_exercises} exercises</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chapter Grid */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.chapters.map((ch) => {
            const answered = getChapterProgress(ch.chapter);
            const total = getChapterTotal(ch);
            const pct = total > 0 ? Math.round(answered / total * 100) : 0;
            const flagCount = getChapterFlagCount(ch.chapter);

            return (
              <Link
                key={ch.chapter}
                href={'/grammar/' + lang + '/' + ch.chapter}
                className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 hover:border-teal-300 hover:shadow-md transition-all relative group"
              >
                {flagCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {flagCount}
                  </span>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span 
                    className="font-mono text-lg font-extrabold text-white w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: theme.primary }}
                  >
                    {ch.chapter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{ch.topic_de || ch.topic}</div>
                    <div className="text-xs text-gray-400 truncate">{ch.topic}</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: pct + '%',
                      background: pct >= 80 ? '#22c55e' : pct >= 40 ? '#f59e0b' : pct > 0 ? theme.primary : '#e2e8f0'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px]">
                  <span className="text-gray-400">{answered}/{total} prompts</span>
                  <span className="font-bold" style={{ color: pct > 0 ? theme.primary : '#cbd5e1' }}>
                    {pct}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
`);

// ═══════════════════════════════════════════
// APP — SINGLE CHAPTER (EXERCISES)
// ═══════════════════════════════════════════
writeFile('app/grammar/[lang]/[chapter]/page.js', `
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTheme } from '../../../../lib/themes';
import { loadJSON, saveJSON } from '../../../../lib/storage';

export default function ChapterExercises() {
  const params = useParams();
  const lang = params.lang || 'de';
  const chapterNum = parseInt(params.chapter);
  const theme = getTheme(lang, 'grammar');
  
  const [data, setData] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [expanded, setExpanded] = useState({});
  
  // Session timer (Layer 2 feature)
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  
  // Autosave ref
  const autosaveRef = useRef(null);

  // Load data
  useEffect(() => {
    fetch('/exercises_database.json')
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => {
        setData(d);
        const ch = d.chapters.find(c => c.chapter === chapterNum);
        setChapter(ch);
      })
      .catch(() => {});

    setAnswers(loadJSON('grammar_answers', {}));
    setFlags(loadJSON('grammar_flags', {}));
  }, [chapterNum]);

  // Session timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Log session on unmount
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 10) {
        const log = loadJSON('session_log', []);
        log.push({
          date: new Date().toISOString(),
          chapter: chapterNum,
          duration_seconds: elapsed,
          lang,
        });
        saveJSON('session_log', log);
      }
    };
  }, [chapterNum, lang]);

  // Autosave every 30 seconds
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      saveJSON('grammar_answers', answers);
      saveJSON('grammar_flags', flags);
    }, 30000);
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [answers, flags]);

  const handleAnswer = useCallback((key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleFlag = useCallback((key) => {
    setFlags(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      saveJSON('grammar_flags', next);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandAll = () => {
    if (!chapter) return;
    const all = {};
    chapter.exercises.forEach(ex => { all['ch' + chapterNum + '_ex' + ex.exercise_number] = true; });
    setExpanded(all);
  };

  const collapseAll = () => setExpanded({});

  const save = () => {
    saveJSON('grammar_answers', answers);
    saveJSON('grammar_flags', flags);
  };

  // Export function
  const exportAnswers = () => {
    if (!chapter) return;
    const mins = Math.floor(sessionSeconds / 60);
    const secs = sessionSeconds % 60;
    
    let text = '';
    text += '═══════════════════════════════════════════\\n';
    text += 'POLYGLOT OS — GRAMMAR TEST EXPORT\\n';
    text += 'Language: ' + { de: 'German', el: 'Greek', ru: 'Russian', es: 'Spanish' }[lang] + '\\n';
    text += 'Chapter: ' + chapterNum + ' (' + (chapter.topic_de || chapter.topic) + ')\\n';
    text += 'Date: ' + new Date().toISOString().slice(0, 10) + '\\n';
    text += 'Session Duration: ' + mins + 'm ' + String(secs).padStart(2, '0') + 's\\n';
    text += '═══════════════════════════════════════════\\n\\n';
    text += 'GRADING INSTRUCTIONS FOR CLAUDE:\\n';
    text += '─────────────────────────────────\\n';
    text += 'Grade each answer 0-3: 0=wrong, 1=major errors, 2=minor errors, 3=perfect\\n';
    text += 'Error categories: case / gender / conjugation / word_order / register / vocabulary / spelling\\n';
    text += 'Provide: accuracy %, gradient score (e.g. B1.4), weakness radar (0-5), top 3 weaknesses\\n';
    text += 'Format results as CORRECTION FILE (JSON) for app import\\n\\n';

    // Flagged exercises
    text += 'FLAGGED EXERCISES:\\n';
    let flaggedAny = false;
    chapter.exercises.forEach(ex => {
      const key = 'ch' + chapterNum + '_ex' + ex.exercise_number;
      if (flags[key]) {
        text += '  ⚑ Ex ' + ex.exercise_number + ': ' + ex.title + '\\n';
        flaggedAny = true;
      }
    });
    if (!flaggedAny) text += '  (none)\\n';
    text += '\\n';

    chapter.exercises.forEach(ex => {
      const key = 'ch' + chapterNum + '_ex' + ex.exercise_number;
      const hasAny = Object.keys(answers).some(k => k.startsWith(key) && answers[k]?.trim());
      if (!hasAny) return;

      const isFlagged = flags[key] ? ' ⚑ FLAGGED' : '';
      text += '───────────────────────────────────────────\\n';
      text += 'EXERCISE ' + ex.exercise_number + ': ' + ex.title + isFlagged + '\\n';
      if (ex.instruction) text += 'Instruction: ' + ex.instruction + '\\n';
      text += '───────────────────────────────────────────\\n';

      if (!ex.prompts || ex.prompts.length === 0) {
        const ans = answers[key] || '';
        if (ans.trim()) text += 'Answer:\\n' + ans + '\\n';
      } else {
        ex.prompts.forEach(p => {
          const pKey = key + '_p' + p.number;
          const ans = answers[pKey] || '';
          if (ans.trim()) {
            text += '\\nPrompt ' + p.number + ': ' + p.text + '\\n';
            text += 'Answer: ' + ans + '\\n';
          }
        });
      }
      text += '\\n';
    });

    text += '═══════════════════════════════════════════\\n';
    text += 'END OF EXPORT — AWAITING CORRECTION FILE\\n';
    text += '═══════════════════════════════════════════\\n';

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!')).catch(() => {
      // Fallback: download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grammar_ch' + chapterNum + '_' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
    });
  };

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading chapter {chapterNum}...</p>
      </div>
    );
  }

  const prefix = 'ch' + chapterNum + '_';
  const totalAnswered = Object.keys(answers).filter(k => k.startsWith(prefix) && answers[k]?.trim()).length;
  const totalPrompts = chapter.exercises.reduce((s, ex) => s + Math.max(ex.prompts?.length || 0, 1), 0);
  const totalFlagged = Object.keys(flags).filter(k => k.startsWith(prefix) && flags[k]).length;
  const pct = totalPrompts > 0 ? Math.round(totalAnswered / totalPrompts * 100) : 0;
  const timerMins = Math.floor(sessionSeconds / 60);
  const timerSecs = sessionSeconds % 60;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="text-white px-6 py-4 shadow-lg sticky top-0 z-50" style={{ background: theme.headerGradient }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={'/grammar?lang=' + lang} className="text-white/70 hover:text-white text-sm font-bold">←</Link>
            <div>
              <h1 className="text-base font-extrabold">Kapitel {chapterNum}: {chapter.topic_de || chapter.topic}</h1>
              <p className="text-xs opacity-70">{chapter.topic} · {chapter.exercises.length} exercises</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full font-mono text-sm">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            {String(timerMins).padStart(2, '0')}:{String(timerSecs).padStart(2, '0')}
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 sticky top-[60px] z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-4 text-xs flex-wrap">
          <span><strong className="font-mono text-teal-600">{totalAnswered}</strong> answered</span>
          <span className="text-gray-300">|</span>
          <span><strong className="font-mono">{totalPrompts}</strong> total</span>
          <span className="text-gray-300">|</span>
          <span><strong className="font-mono text-rose-500">{totalFlagged}</strong> flagged</span>
          <div className="flex-1 max-w-[200px]">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: pct + '%', background: theme.primary }} />
            </div>
          </div>
          <span className="font-bold" style={{ color: theme.primary }}>{pct}%</span>
        </div>
      </div>

      {/* Exercises */}
      <main className="max-w-3xl mx-auto px-6 py-4">
        {chapter.rule && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-4 text-sm text-amber-900 italic">
            {chapter.rule}
          </div>
        )}

        {chapter.exercises.map(ex => {
          const key = 'ch' + chapterNum + '_ex' + ex.exercise_number;
          const isFlagged = flags[key] || false;
          const isExpanded = expanded[key] || false;
          const hasAnswer = Object.keys(answers).some(k => k.startsWith(key) && answers[k]?.trim());
          const typeColor = theme.exerciseColors?.[ex.type] || theme.primary;

          return (
            <div 
              key={key}
              className="bg-white rounded-2xl mb-3 shadow-sm overflow-hidden transition-all"
              style={{ borderLeft: '4px solid ' + (isFlagged ? '#f43f5e' : hasAnswer ? '#22c55e' : '#e2e8f0') }}
            >
              {/* Exercise header */}
              <div 
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(key)}
              >
                <span 
                  className="font-mono text-xs font-bold text-white w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: typeColor }}
                >
                  {ex.exercise_number}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{ex.title}</div>
                  <div className="text-[11px] text-gray-400">{ex.type || 'exercise'}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFlag(key); }}
                  className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm flex-shrink-0 transition-all"
                  style={{
                    borderColor: isFlagged ? '#f43f5e' : '#e2e8f0',
                    background: isFlagged ? '#f43f5e' : 'white',
                    color: isFlagged ? 'white' : '#94a3b8',
                  }}
                  title="Flag as difficult"
                >
                  {isFlagged ? '🚩' : '⚐'}
                </button>
                <svg 
                  className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform" 
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>

              {/* Exercise body */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {ex.instruction && (
                    <div className="bg-amber-50 border-l-3 border-amber-400 rounded-r-lg p-3 mb-3 text-xs text-amber-800 italic">
                      {ex.instruction}
                    </div>
                  )}

                  {(!ex.prompts || ex.prompts.length === 0) ? (
                    <textarea
                      className="w-full min-h-[80px] p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none resize-y transition-colors"
                      style={{ borderColor: answers[key]?.trim() ? '#22c55e' : undefined, background: answers[key]?.trim() ? '#f0fdf4' : undefined }}
                      placeholder="Write your answer here..."
                      value={answers[key] || ''}
                      onChange={(e) => handleAnswer(key, e.target.value)}
                    />
                  ) : (
                    ex.prompts.map(p => {
                      const pKey = key + '_p' + p.number;
                      const val = answers[pKey] || '';
                      return (
                        <div key={pKey} className="mb-2.5">
                          <div className="text-xs mb-1 leading-relaxed">
                            <strong className="font-mono text-blue-500">{p.number}.</strong> {p.text}
                          </div>
                          <input
                            type="text"
                            className="w-full p-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none transition-colors"
                            style={{ borderColor: val.trim() ? '#22c55e' : undefined, background: val.trim() ? '#f0fdf4' : undefined }}
                            placeholder="→ Your answer..."
                            value={val}
                            onChange={(e) => handleAnswer(pKey, e.target.value)}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2.5 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
          <button onClick={expandAll} className="px-3 py-2 rounded-lg border-2 border-gray-200 text-xs font-bold hover:border-blue-300 transition-all">
            Expand All
          </button>
          <button onClick={collapseAll} className="px-3 py-2 rounded-lg border-2 border-gray-200 text-xs font-bold hover:border-blue-300 transition-all">
            Collapse All
          </button>
          <span className="flex-1" />
          <span className="text-[10px] text-gray-400 hidden sm:inline">Ctrl+Enter to export</span>
          <button onClick={exportAnswers} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all">
            📋 Export
          </button>
          <button onClick={save} className="px-4 py-2 rounded-lg text-white text-xs font-bold transition-all" style={{ background: theme.primary }}>
            💾 Save
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// ═══════════════════════════════════════════
// COMPONENT — WOZNIAK 20 RULES
// ═══════════════════════════════════════════
writeFile('components/WozniakRules.jsx', `
'use client';

const RULES = [
  { num: 1, title: 'Do not learn what you do not understand', summary: 'Understanding comes first. Memorization comes second.', app: 'Grammar rule explanations appear before exercises. Palace words require example sentences.' },
  { num: 2, title: 'Learn before you memorize', summary: 'Build the big picture first, then drill details.', app: 'Input-First Sprint Opening: no memorization for the first 1-2 weeks of a new language.' },
  { num: 3, title: 'Build upon the basics', summary: 'Start simple. Don\\'t skip the fundamentals.', app: 'Vocabulary loads frequency-sorted. Grammar starts with the most fundamental structures.' },
  { num: 4, title: 'Minimum information principle', summary: 'Each card tests ONE thing. Split complex items.', app: 'Palace Drill Mode tests meaning, gender, cloze, reverse, and production separately.' },
  { num: 5, title: 'Cloze deletion is effective', summary: 'Fill-the-blank in context sentences works.', app: 'Cloze is one of the 5 drill types in Palace Drill Mode.' },
  { num: 6, title: 'Use imagery', summary: 'Pictures are retained far better than text.', app: 'Palace cards include images. Google Images in target language for new words.' },
  { num: 7, title: 'Use mnemonic techniques', summary: 'The mental palace IS the most powerful mnemonic.', app: 'The entire palace system is built on the method of loci.' },
  { num: 8, title: 'Graphic deletion works too', summary: 'Remove part of an image and identify it.', app: 'Future: kanji recognition, Arabic letter position drills.' },
  { num: 9, title: 'Avoid sets', summary: 'Never ask "list all dative prepositions."', app: 'Every exercise targets one structure in one sentence.' },
  { num: 10, title: 'Avoid enumerations', summary: 'If you must learn sequences, use overlapping cloze.', app: 'Grammar chapters are sequential but each exercise is independent.' },
  { num: 11, title: 'Combat interference', summary: 'Detect when you confuse similar items and drill the difference.', app: 'Interference Detection Engine flags pairs like wurde/würde and generates discrimination drills.' },
  { num: 12, title: 'Optimize wording', summary: 'Shorter prompts = faster retrieval = better retention.', app: 'Exercise prompts are concise. Export formats strip unnecessary context.' },
  { num: 13, title: 'Personalize and provide examples', summary: 'Link every word to YOUR life and memories.', app: 'Palace landmarks are real places from your commute. Personal notes on vocabulary.' },
  { num: 14, title: 'Rely on emotional states', summary: 'Vivid, absurd, funny associations stick 25x better.', app: 'Palace encourages bizarre mental images at each landmark.' },
  { num: 15, title: 'Context cues simplify recall', summary: 'Different visual contexts activate different neural pathways.', app: 'Per-language, per-module visual themes. Each module looks distinct.' },
  { num: 16, title: 'Redundancy is OK', summary: 'Multiple cards testing the same word from different angles helps.', app: 'Palace Drill Mode: 3-5 prompts per word, each a different angle.' },
  { num: 17, title: 'Provide sources', summary: 'Know where your knowledge came from.', app: 'Vocabulary tracks source: Anki, Lute, Language Reactor, manual.' },
  { num: 18, title: 'Date stamp your knowledge', summary: 'Track when you learned things.', app: 'Every entry has timestamps. Gradient level system tracks progression.' },
  { num: 19, title: 'Prioritize ruthlessly', summary: 'High-frequency words first. Common structures first.', app: 'Vocabulary loads frequency-sorted. Training plan targets weakest areas.' },
  { num: 20, title: 'Keep updating old knowledge', summary: 'Your understanding deepens as you advance.', app: 'Level-up tests reassess everything. Palace review resurfaces old words.' },
];

const TOP_5 = [2, 4, 6, 11, 14];

export default function WozniakRules({ onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-extrabold text-base">📖 The 20 Rules of Formulating Knowledge</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dr. Piotr Wozniak · Adapted for Polyglot OS</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
        {RULES.map(rule => {
          const isTop5 = TOP_5.includes(rule.num);
          return (
            <div key={rule.num} className={'py-3 border-b border-gray-50 ' + (isTop5 ? 'bg-amber-50/50 -mx-5 px-5 rounded-lg' : '')}>
              <div className="flex items-start gap-3">
                <span className={'font-mono text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ' + 
                  (isTop5 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500')}>
                  {rule.num}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-sm">{rule.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{rule.summary}</div>
                  <div className="text-[11px] text-teal-600 mt-1 font-semibold">🔧 {rule.app}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-[11px] text-gray-400">
          ⭐ Highlighted rules are the 5 most critical for language learning: Learn before memorize, Minimum information, 
          Use imagery, Combat interference, Rely on emotion.
        </p>
      </div>
    </div>
  );
}
`);

// ═══════════════════════════════════════════
// GITIGNORE
// ═══════════════════════════════════════════
writeFile('.gitignore', `
node_modules/
.next/
.env.local
.env
*.db
.DS_Store
out/
`);

// ═══════════════════════════════════════════
// README
// ═══════════════════════════════════════════
writeFile('README.md', `
# 🧠 Polyglot OS — Language Mastery Sprint System

Sprint to C1 fluency in 10 languages using the Mental Palace + Grammar Trainer system.

## Quick Start

\`\`\`bash
npm install
cp your/exercises_database.json public/
npm run dev
\`\`\`

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

\`\`\`
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
\`\`\`

## Tech Stack

- **Next.js 14.2.21** (stable, pinned)
- **React 18.3.1** (stable, NOT 19 RC)
- **Tailwind CSS 3.4.17**
- **SQLite** (coming in Layer 4)

## Build Layers

See POLYGLOT_OS_15_LAYER_BUILD_PLAN.md for the full roadmap.

Built by Olivier — from 16 months of manual Anki screenshots to a full automated system.
`);

// ═══════════════════════════════════════════
// DONE
// ═══════════════════════════════════════════
console.log('\n✅ Polyglot OS Layer 3 generated!');
console.log('\nNext steps:');
console.log('  1. cd polyglot-os');
console.log('  2. npm install');
console.log('  3. cp your/exercises_database.json public/');
console.log('  4. npm run dev');
console.log('  5. Open http://localhost:3000');
console.log('  6. git init && git add -A && git commit -m "Layer 3: Next.js foundation"');
