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
