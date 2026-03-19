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
    text += '═══════════════════════════════════════════\n';
    text += 'POLYGLOT OS — GRAMMAR TEST EXPORT\n';
    text += 'Language: ' + { de: 'German', el: 'Greek', ru: 'Russian', es: 'Spanish' }[lang] + '\n';
    text += 'Chapter: ' + chapterNum + ' (' + (chapter.topic_de || chapter.topic) + ')\n';
    text += 'Date: ' + new Date().toISOString().slice(0, 10) + '\n';
    text += 'Session Duration: ' + mins + 'm ' + String(secs).padStart(2, '0') + 's\n';
    text += '═══════════════════════════════════════════\n\n';
    text += 'GRADING INSTRUCTIONS FOR CLAUDE:\n';
    text += '─────────────────────────────────\n';
    text += 'Grade each answer 0-3: 0=wrong, 1=major errors, 2=minor errors, 3=perfect\n';
    text += 'Error categories: case / gender / conjugation / word_order / register / vocabulary / spelling\n';
    text += 'Provide: accuracy %, gradient score (e.g. B1.4), weakness radar (0-5), top 3 weaknesses\n';
    text += 'Format results as CORRECTION FILE (JSON) for app import\n\n';

    // Flagged exercises
    text += 'FLAGGED EXERCISES:\n';
    let flaggedAny = false;
    chapter.exercises.forEach(ex => {
      const key = 'ch' + chapterNum + '_ex' + ex.exercise_number;
      if (flags[key]) {
        text += '  ⚑ Ex ' + ex.exercise_number + ': ' + ex.title + '\n';
        flaggedAny = true;
      }
    });
    if (!flaggedAny) text += '  (none)\n';
    text += '\n';

    chapter.exercises.forEach(ex => {
      const key = 'ch' + chapterNum + '_ex' + ex.exercise_number;
      const hasAny = Object.keys(answers).some(k => k.startsWith(key) && answers[k]?.trim());
      if (!hasAny) return;

      const isFlagged = flags[key] ? ' ⚑ FLAGGED' : '';
      text += '───────────────────────────────────────────\n';
      text += 'EXERCISE ' + ex.exercise_number + ': ' + ex.title + isFlagged + '\n';
      if (ex.instruction) text += 'Instruction: ' + ex.instruction + '\n';
      text += '───────────────────────────────────────────\n';

      if (!ex.prompts || ex.prompts.length === 0) {
        const ans = answers[key] || '';
        if (ans.trim()) text += 'Answer:\n' + ans + '\n';
      } else {
        ex.prompts.forEach(p => {
          const pKey = key + '_p' + p.number;
          const ans = answers[pKey] || '';
          if (ans.trim()) {
            text += '\nPrompt ' + p.number + ': ' + p.text + '\n';
            text += 'Answer: ' + ans + '\n';
          }
        });
      }
      text += '\n';
    });

    text += '═══════════════════════════════════════════\n';
    text += 'END OF EXPORT — AWAITING CORRECTION FILE\n';
    text += '═══════════════════════════════════════════\n';

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
