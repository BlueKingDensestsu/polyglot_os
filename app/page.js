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
