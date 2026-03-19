'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * /grammar — Shows all grammar chapters for the active language
 * 
 * Each chapter card shows:
 * - Chapter number + title
 * - Exercise count and prompt count
 * - Progress bar (answered / total prompts)
 * - Color badge based on completion
 */

const TYPE_COLORS = {
  transform: '#2EC4B6',
  translate: '#E07A5F',
  error_fix: '#F2CC8F',
  produce: '#81B29A',
  paragraph: '#3D405B',
};

export default function GrammarPage() {
  const [chapters, setChapters] = useState([]);
  const [language, setLanguage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For now, hardcode 'de' as active language
  // Layer 14 will add language switching
  const langCode = 'de';

  useEffect(() => {
    async function load() {
      try {
        const [chapRes, langRes] = await Promise.all([
          fetch(`/api/chapters?lang=${langCode}`),
          fetch(`/api/languages?code=${langCode}`)
        ]);
        const chapData = await chapRes.json();
        const langData = await langRes.json();
        setChapters(chapData);
        setLanguage(langData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading chapters...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#E07A5F' }}>
      <p style={{ fontSize: 18 }}>Error: {error}</p>
      <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Make sure PostgreSQL is running and exercises are imported.</p>
    </div>
  );

  const totalPrompts = chapters.reduce((sum, ch) => sum + (ch.prompt_count || 0), 0);
  const totalAnswered = chapters.reduce((sum, ch) => sum + (ch.prompts_answered || 0), 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{language?.flag}</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
            {language?.name} Grammar
          </h1>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: '#E3F2FD', color: '#2E86AB'
          }}>
            {language?.assessed_level}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <span style={{ fontSize: 14, color: '#666' }}>
            {chapters.length} chapters · {totalPrompts.toLocaleString()} prompts
          </span>
          <div style={{ flex: 1, maxWidth: 300, height: 8, background: '#eee', borderRadius: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 0.5s',
              width: totalPrompts > 0 ? `${(totalAnswered / totalPrompts) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #2EC4B6, #2E86AB)'
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2E86AB' }}>
            {totalAnswered}/{totalPrompts}
          </span>
        </div>
      </div>

      {/* Chapter Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16
      }}>
        {chapters.map(ch => {
          const pct = ch.prompt_count > 0 ? (ch.prompts_answered || 0) / ch.prompt_count : 0;
          const isDone = pct >= 1;
          const hasProgress = pct > 0;

          return (
            <Link
              key={ch.id}
              href={`/grammar/${langCode}/${ch.chapter_number}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: isDone ? '2px solid #2EC4B6' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              >
                {/* Chapter number badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: 'white', padding: '3px 10px',
                    borderRadius: 12,
                    background: isDone ? '#2EC4B6' : hasProgress ? '#2E86AB' : '#ccc'
                  }}>
                    Ch {ch.chapter_number}
                  </span>
                  {isDone && <span style={{ fontSize: 18 }}>✅</span>}
                  {ch.flagged_count > 0 && !isDone && (
                    <span style={{ fontSize: 12, color: '#E07A5F' }}>
                      ⚠️ {ch.flagged_count}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px 0' }}>
                  {ch.title}
                </h3>

                {/* Stats */}
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px 0' }}>
                  {ch.exercise_count} exercises · {ch.prompt_count} prompts
                </p>

                {/* Progress bar */}
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.4s',
                    width: `${pct * 100}%`,
                    background: isDone ? '#2EC4B6' : '#2E86AB'
                  }} />
                </div>
                <p style={{ fontSize: 12, color: '#aaa', margin: '6px 0 0', textAlign: 'right' }}>
                  {ch.prompts_answered || 0} / {ch.prompt_count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
