'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * /palace — All landmarks for the active language, shown as a route
 * 
 * Each landmark card shows:
 * - Position number + name
 * - Word count (filled/capacity)
 * - Status breakdown (known/shaky/forgot)
 * - Mini progress bar
 * - Last reviewed date
 */

const STATUS_COLORS = {
  known: '#22C55E',
  shaky: '#F59E0B',
  forgot: '#EF4444',
  new: '#E5E7EB',
};

export default function PalacePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const langCode = 'de'; // hardcoded until Layer 14

  useEffect(() => {
    fetch(`/api/palace?lang=${langCode}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading palace...</p>
    </div>
  );

  if (!data || !data.landmarks) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: 18, color: '#888' }}>No palace data found. Import vocabulary first.</p>
    </div>
  );

  const { language, landmarks, total_words } = data;
  const totalKnown = landmarks.reduce((s, l) => s + (l.known_count || 0), 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{language.flag}</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
            Mental Palace
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#666', margin: '4px 0 12px' }}>
          {language.palace_route}
        </p>

        {/* Overall stats */}
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <span style={{ color: '#333' }}>
            <strong>{landmarks.length}</strong> landmarks
          </span>
          <span style={{ color: '#333' }}>
            <strong>{total_words.toLocaleString()}</strong> words
          </span>
          <span style={{ color: '#22C55E' }}>
            <strong>{totalKnown}</strong> known
          </span>
          <span>
            <span style={{
              display: 'inline-block', width: 200, height: 8, background: '#eee',
              borderRadius: 4, verticalAlign: 'middle', marginLeft: 8
            }}>
              <span style={{
                display: 'block', height: '100%', borderRadius: 4,
                width: total_words > 0 ? `${(totalKnown / total_words) * 100}%` : '0%',
                background: 'linear-gradient(90deg, #22C55E, #4ECDC4)'
              }} />
            </span>
          </span>
        </div>

        {/* Review weakest button */}
        <Link href={`/palace/${langCode}/review`} style={{
          display: 'inline-block', marginTop: 16, padding: '10px 24px', borderRadius: 10,
          background: '#EF4444', color: 'white', fontWeight: 700, fontSize: 14,
          textDecoration: 'none', transition: 'all 0.2s'
        }}>
          🔥 Review Weakest Words
        </Link>
      </div>

      {/* Route visualization */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line connecting landmarks */}
        <div style={{
          position: 'absolute', left: 28, top: 30, bottom: 30,
          width: 3, background: 'linear-gradient(to bottom, #4ECDC4, #2E86AB)',
          borderRadius: 2, zIndex: 0
        }} />

        {/* Landmark cards */}
        {landmarks.map((lm, idx) => {
          const hasWords = lm.word_count > 0;
          const pct = lm.word_count > 0 ? (lm.known_count / lm.word_count) : 0;

          return (
            <Link
              key={lm.id}
              href={`/palace/${langCode}/${lm.position}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                marginBottom: 4, position: 'relative', zIndex: 1
              }}>
                {/* Position dot */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: hasWords ? (pct >= 1 ? '#22C55E' : pct > 0 ? '#2E86AB' : 'white') : '#f5f5f5',
                  color: hasWords && pct > 0 ? 'white' : '#888',
                  fontWeight: 800, fontSize: 16,
                  border: hasWords ? 'none' : '2px solid #ddd',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {lm.position}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, background: 'white', borderRadius: 14, padding: '16px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s', cursor: 'pointer',
                  opacity: hasWords ? 1 : 0.6
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                      {lm.name}
                    </h3>
                    <span style={{ fontSize: 13, color: '#888' }}>
                      {lm.word_count} words
                    </span>
                  </div>

                  {hasWords ? (
                    <div style={{ marginTop: 10 }}>
                      {/* Status dots row */}
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
                        <span style={{ color: STATUS_COLORS.known }}>
                          ● {lm.known_count} known
                        </span>
                        <span style={{ color: STATUS_COLORS.shaky }}>
                          ● {lm.shaky_count} shaky
                        </span>
                        <span style={{ color: STATUS_COLORS.forgot }}>
                          ● {lm.forgot_count} forgot
                        </span>
                      </div>

                      {/* Stacked progress bar */}
                      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(lm.known_count / lm.word_count) * 100}%`, background: STATUS_COLORS.known }} />
                        <div style={{ height: '100%', width: `${(lm.shaky_count / lm.word_count) * 100}%`, background: STATUS_COLORS.shaky }} />
                        <div style={{ height: '100%', width: `${(lm.forgot_count / lm.word_count) * 100}%`, background: STATUS_COLORS.forgot }} />
                      </div>

                      {lm.last_reviewed && (
                        <p style={{ fontSize: 11, color: '#bbb', margin: '6px 0 0' }}>
                          Last reviewed: {new Date(lm.last_reviewed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#bbb', margin: '8px 0 0' }}>
                      No vocabulary imported yet
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
