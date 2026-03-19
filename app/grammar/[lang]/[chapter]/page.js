'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

/**
 * /grammar/de/25 — Exercise view for a single chapter
 * 
 * Features:
 * - All exercises with expandable prompt input fields
 * - Auto-save answers to PostgreSQL every 30 seconds
 * - Manual save with Ctrl+S
 * - Flag individual prompts as difficult
 * - Session timer (auto-starts, auto-ends)
 * - Export for Claude correction
 * - Import Claude's correction JSON
 */

const TYPE_BADGES = {
  transform: { label: 'Transform', color: '#2EC4B6', bg: '#E6FAF8' },
  translate: { label: 'Translate', color: '#E07A5F', bg: '#FCF0EC' },
  error_fix: { label: 'Error Fix', color: '#DAA520', bg: '#FFF8E7' },
  produce:   { label: 'Produce',   color: '#81B29A', bg: '#EFF6F1' },
  paragraph: { label: 'Paragraph', color: '#3D405B', bg: '#ECEDF0' },
};

export default function ChapterPage() {
  const params = useParams();
  const lang = params.lang;
  const chapterNum = params.chapter;

  const [chapter, setChapter] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [answers, setAnswers] = useState({});    // { promptId: 'user text' }
  const [flags, setFlags] = useState({});         // { promptId: true }
  const [expanded, setExpanded] = useState({});   // { exerciseId: true }
  const [sessionId, setSessionId] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const answersRef = useRef(answers);
  const flagsRef = useRef(flags);
  answersRef.current = answers;
  flagsRef.current = flags;

  // ─── Load chapter data ───
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/chapters?lang=${lang}&chapter=${chapterNum}`);
      const data = await res.json();
      setChapter(data.chapter);
      setExercises(data.exercises);

      // Pre-fill answers from last session
      const existingAnswers = {};
      const existingFlags = {};
      data.exercises.forEach(ex => {
        ex.prompts.forEach(p => {
          if (p.last_answer) existingAnswers[p.id] = p.last_answer;
          if (p.flagged) existingFlags[p.id] = true;
        });
      });
      setAnswers(existingAnswers);
      setFlags(existingFlags);

      // Auto-expand first exercise
      if (data.exercises.length > 0) {
        setExpanded({ [data.exercises[0].id]: true });
      }

      setLoading(false);
    }
    load();
  }, [lang, chapterNum]);

  // ─── Start session ───
  useEffect(() => {
    async function startSession() {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, type: 'grammar', chapter_id: chapter?.id })
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setSessionStart(Date.now());
    }
    if (chapter) startSession();
  }, [chapter]);

  // ─── Timer ───
  useEffect(() => {
    if (!sessionStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Save answers ───
  const saveAnswers = useCallback(async () => {
    const currentAnswers = answersRef.current;
    const currentFlags = flagsRef.current;
    const batch = Object.entries(currentAnswers)
      .filter(([id, text]) => text.trim().length > 0)
      .map(([prompt_id, user_answer]) => ({
        prompt_id: parseInt(prompt_id),
        user_answer,
        flagged_difficult: !!currentFlags[prompt_id]
      }));

    if (batch.length === 0) return;

    setSaving(true);
    try {
      await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answers', session_id: sessionId, answers: batch })
      });
      setLastSaved(new Date());
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  }, [sessionId]);

  // ─── Auto-save every 30 seconds ───
  useEffect(() => {
    const interval = setInterval(saveAnswers, 30000);
    return () => clearInterval(interval);
  }, [saveAnswers]);

  // ─── Ctrl+S / Cmd+S to save ───
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAnswers();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveAnswers]);

  // ─── Ctrl+Enter shortcut ───
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveAnswers();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveAnswers]);

  // ─── Export ───
  const handleExport = async () => {
    await saveAnswers();
    const res = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export', lang, chapter_number: parseInt(chapterNum), session_id: sessionId })
    });
    const data = await res.json();
    if (data.export_text) {
      setExportText(data.export_text);
      setShowExport(true);
    } else {
      alert('No answers to export. Type some answers first!');
    }
  };

  // ─── Import corrections ───
  const handleImport = async () => {
    try {
      const corrections = JSON.parse(importJson);
      const payload = Array.isArray(corrections) ? corrections : corrections.prompt_grades || corrections.corrections;
      if (!Array.isArray(payload)) {
        setImportResult({ error: 'Expected a JSON array of corrections' });
        return;
      }
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', corrections: payload })
      });
      const result = await res.json();
      setImportResult(result);
    } catch (e) {
      setImportResult({ error: 'Invalid JSON: ' + e.message });
    }
  };

  // ─── End session on unmount ───
  useEffect(() => {
    return () => {
      if (sessionId) {
        // Fire and forget — save + end session
        const batch = Object.entries(answersRef.current)
          .filter(([, text]) => text.trim().length > 0);
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            prompts_answered: batch.length,
          })
        });
      }
    };
  }, [sessionId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading exercises...</p>
    </div>
  );

  const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length;
  const totalPrompts = exercises.reduce((sum, ex) => sum + ex.prompts.length, 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 100px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa',
        padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <a href={`/grammar`} style={{ fontSize: 13, color: '#2E86AB', textDecoration: 'none' }}>
              ← Back to chapters
            </a>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '4px 0 0' }}>
              Ch {chapterNum}: {chapter?.title}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Timer */}
            <span style={{
              fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
              color: '#2E86AB', background: '#E3F2FD', padding: '6px 14px', borderRadius: 12
            }}>
              ⏱ {formatTime(elapsed)}
            </span>
            {/* Progress */}
            <span style={{ fontSize: 13, color: '#666' }}>
              {answeredCount}/{totalPrompts}
            </span>
            {/* Save indicator */}
            <span style={{ fontSize: 12, color: saving ? '#E07A5F' : '#2EC4B6' }}>
              {saving ? '💾 Saving...' : lastSaved ? `✓ ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          </div>
        </div>

        {/* Rule summary */}
        {chapter?.rule_summary && (
          <p style={{
            fontSize: 13, color: '#555', background: '#fff', padding: '10px 16px',
            borderRadius: 10, margin: '12px 0 0', borderLeft: '4px solid #2EC4B6'
          }}>
            {chapter.rule_summary}
          </p>
        )}
      </div>

      {/* Exercises */}
      {exercises.map(ex => {
        const badge = TYPE_BADGES[ex.type] || TYPE_BADGES.transform;
        const isExpanded = expanded[ex.id];
        const exAnswered = ex.prompts.filter(p => answers[p.id]?.trim()).length;

        return (
          <div key={ex.id} style={{
            background: 'white', borderRadius: 14, marginBottom: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden'
          }}>
            {/* Exercise header — click to expand/collapse */}
            <div
              onClick={() => setExpanded(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
              style={{
                padding: '16px 20px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                background: isExpanded ? '#fafbfc' : 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                  color: badge.color, background: badge.bg
                }}>
                  {badge.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                  {ex.exercise_number}. {ex.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#aaa' }}>
                  {exAnswered}/{ex.prompts.length}
                </span>
                <span style={{ fontSize: 14, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  ▼
                </span>
              </div>
            </div>

            {/* Prompts */}
            {isExpanded && (
              <div style={{ padding: '0 20px 20px' }}>
                {ex.instruction && (
                  <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic', margin: '0 0 16px', paddingLeft: 4 }}>
                    {ex.instruction}
                  </p>
                )}

                {ex.prompts.map(prompt => (
                  <div key={prompt.id} style={{
                    display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start'
                  }}>
                    {/* Prompt number */}
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: '#aaa', minWidth: 28,
                      paddingTop: 10, textAlign: 'right'
                    }}>
                      {prompt.prompt_number}.
                    </span>

                    <div style={{ flex: 1 }}>
                      {/* Prompt text */}
                      <p style={{ fontSize: 14, color: '#333', margin: '0 0 6px', lineHeight: 1.4 }}>
                                                {(() => {
                          try {
                            const parsed = JSON.parse(prompt.text);
                            return parsed.text || prompt.text;
                          } catch {
                            return prompt.text;
                          }
                        })()}
                      </p>

                      {/* Answer input */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={answers[prompt.id] || ''}
                          onChange={e => setAnswers(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                          placeholder="Type your answer..."
                          style={{
                            flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: 8,
                            border: prompt.last_correct === true ? '2px solid #2EC4B6' :
                                   prompt.last_correct === false ? '2px solid #E07A5F' :
                                   '1px solid #ddd',
                            outline: 'none', transition: 'border 0.2s',
                            background: prompt.last_correct === true ? '#f0faf9' :
                                       prompt.last_correct === false ? '#fdf3f0' : 'white'
                          }}
                          onFocus={e => { if (!prompt.last_correct) e.target.style.border = '2px solid #2E86AB'; }}
                          onBlur={e => { if (!prompt.last_correct) e.target.style.border = '1px solid #ddd'; }}
                        />

                        {/* Flag button */}
                        <button
                          onClick={() => setFlags(prev => ({ ...prev, [prompt.id]: !prev[prompt.id] }))}
                          title="Flag as difficult"
                          style={{
                            padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                            border: 'none', fontSize: 16,
                            background: flags[prompt.id] ? '#FFF3E0' : '#f5f5f5',
                          }}
                        >
                          {flags[prompt.id] ? '🚩' : '⚑'}
                        </button>
                      </div>

                      {/* Correction feedback (after import) */}
                      {prompt.last_correct === false && (
                        <p style={{ fontSize: 12, color: '#E07A5F', margin: '4px 0 0', paddingLeft: 4 }}>
                          ✗ Check correction in export
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom action bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #eee', padding: '12px 20px',
        display: 'flex', justifyContent: 'center', gap: 12, zIndex: 20
      }}>
        <button
          onClick={saveAnswers}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#2E86AB', color: 'white', fontWeight: 700, fontSize: 14
          }}
        >
          💾 Save (Ctrl+S)
        </button>
        <button
          onClick={() => setExpanded(exercises.reduce((acc, ex) => ({ ...acc, [ex.id]: true }), {}))}
          style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid #ddd',
            cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14, color: '#555'
          }}
        >
          Expand All
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#2EC4B6', color: 'white', fontWeight: 700, fontSize: 14
          }}
        >
          📋 Export for Claude
        </button>
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#81B29A', color: 'white', fontWeight: 700, fontSize: 14
          }}
        >
          📥 Import Corrections
        </button>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
        }}
          onClick={() => setShowExport(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 24, maxWidth: 700,
              width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>📋 Export for Correction</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              Copy this text and paste it into Claude chat. Claude will grade your answers and return a JSON correction file.
            </p>
            <textarea
              readOnly
              value={exportText}
              style={{
                flex: 1, minHeight: 300, padding: 16, fontSize: 13, fontFamily: 'monospace',
                borderRadius: 10, border: '1px solid #ddd', resize: 'none', background: '#fafafa'
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => { navigator.clipboard.writeText(exportText); }}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
                  background: '#2E86AB', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([exportText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `grammar_ch${chapterNum}_${new Date().toISOString().split('T')[0]}.txt`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 10, border: '1px solid #ddd',
                  background: 'white', color: '#333', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}
              >
                💾 Download .txt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
        }}
          onClick={() => { setShowImport(false); setImportResult(null); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 16, padding: 24, maxWidth: 700,
              width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>📥 Import Corrections</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
              Paste the JSON correction array that Claude returned.
            </p>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder='[{"prompt_id": 1, "is_correct": true, "error_category": null, "correction": null, "explanation": null}]'
              style={{
                flex: 1, minHeight: 200, padding: 16, fontSize: 13, fontFamily: 'monospace',
                borderRadius: 10, border: '1px solid #ddd', resize: 'none'
              }}
            />
            {importResult && (
              <div style={{
                marginTop: 12, padding: 16, borderRadius: 10,
                background: importResult.error ? '#FFF0EE' : '#F0FAF9',
                color: importResult.error ? '#E07A5F' : '#2EC4B6',
                fontSize: 14
              }}>
                {importResult.error ? (
                  <p>❌ {importResult.error}</p>
                ) : (
                  <div>
                    <p style={{ fontWeight: 700 }}>✅ Imported {importResult.imported} corrections</p>
                    <p>Accuracy: {importResult.accuracy}</p>
                    <p>Errors: {importResult.total_errors}</p>
                    {Object.entries(importResult.error_breakdown || {}).map(([cat, count]) => (
                      <p key={cat} style={{ fontSize: 13 }}>  • {cat}: {count}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleImport}
              style={{
                marginTop: 16, padding: '12px 20px', borderRadius: 10, border: 'none',
                background: '#81B29A', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >
              Import & Grade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
