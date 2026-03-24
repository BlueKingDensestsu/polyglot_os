'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PalaceCard from '@/components/PalaceCard';

/**
 * /palace — Bauhaus Gedächtnispalast
 * 
 * Matches the HTML palace v7:
 *   - German flag strip + GEDÄCHTNISPALAST header
 *   - Landmark grid with phase headers
 *   - Global search across all 4,214 words
 *   - Sharp Bauhaus geometry (no rounded corners)
 */

const PHASES = {
  1:  'Phase 1 · Grundwortschatz',
  11: 'Phase 2 · Aufbauwortschatz',
  21: 'Phase 3 · Erweiterung',
  31: 'Phase 4 · Vertiefung',
  41: 'Phase 5 · Feinschliff',
};

export default function PalacePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const langCode = 'de';

  useEffect(() => {
    fetch(`/api/palace?lang=${langCode}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/palace?lang=${langCode}&search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(await res.json());
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Laden...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <p>Keine Palastdaten. Wörter importieren.</p>
    </div>
  );

  const { language, landmarks, total_words } = data;
  const totalKnown = landmarks.reduce((s, l) => s + (l.known_count || 0), 0);

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Bauhaus strip */}
      <div style={{ height: 6, display: 'flex' }}>
        <div style={{ flex: 3, background: '#1D1D1B' }} />
        <div style={{ flex: 2, background: '#E63946' }} />
        <div style={{ flex: 2, background: '#FFBE0B' }} />
        <div style={{ flex: 1, background: '#3A7BD5' }} />
      </div>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '2px solid #1D1D1B',
        padding: '20px 24px', textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: '#1D1D1B',
          letterSpacing: '-0.5px', textTransform: 'uppercase', margin: 0
        }}>
          DEUTSCHES <span style={{ color: '#E63946' }}>GEDÄCHTNIS</span><span style={{ color: '#FFBE0B' }}>PALAST</span>
        </h1>
        <div style={{
          color: '#888', fontSize: 11, marginTop: 4,
          letterSpacing: 3, textTransform: 'uppercase', fontWeight: 500
        }}>
          {total_words} Wörter · {landmarks.length} Stationen · Nettelnburg → Home
        </div>

        {/* Stats badges */}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { dot: '#1D1D1B', label: `${landmarks.length} Stationen` },
            { dot: '#E63946', label: `${total_words} Wörter` },
            { dot: '#3AD574', label: `${totalKnown} Kann ich` },
          ].map((s, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: '#1D1D1B',
              padding: '4px 12px', border: '2px solid #1D1D1B', borderRadius: 0
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 0, background: s.dot, display: 'inline-block' }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1260, margin: '0 auto', padding: 16 }}>
        {/* Legend */}
        <div style={{
          textAlign: 'center', margin: '6px 0 10px', fontSize: 10, color: '#888',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
          fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {[
            { c: '#3A7BD5', l: 'Maskulin' }, { c: '#D53A6F', l: 'Feminin' },
            { c: '#3AD574', l: 'Neutrum' }, { c: '#E8651A', l: 'Verb' },
            { c: '#9B59B6', l: 'Adjektiv' }, { c: '#20B2AA', l: 'Adverb' },
            { c: '#999', l: 'Andere' },
          ].map((item, i) => (
            <span key={i}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 0, background: item.c, verticalAlign: 'middle', marginRight: 3 }} />
              {item.l}
            </span>
          ))}
        </div>

        {/* Search */}
        <div style={{ maxWidth: 460, margin: '10px auto', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`🔍 Alle ${total_words} Wörter durchsuchen...`}
            style={{
              width: '100%', padding: '10px 14px 10px 14px',
              border: '2px solid #1D1D1B', borderRadius: 0,
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              background: '#FFF', transition: '.12s'
            }}
            onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '4px 4px 0 #FFBE0B'; }}
            onBlur={e => { e.target.style.borderColor = '#1D1D1B'; e.target.style.boxShadow = 'none'; }}
          />
          {searching && <span style={{ position: 'absolute', right: 12, top: 12, color: '#888' }}>...</span>}
        </div>

        {/* Search count */}
        {searchResults && (
          <div style={{ textAlign: 'center', color: '#AAA', fontSize: 11, margin: '4px 0', fontFamily: "'DM Mono', monospace" }}>
            {searchResults.count} Ergebnisse
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.words && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 10, margin: '10px 0'
          }}>
            {searchResults.words.slice(0, 50).map(word => (
              <PalaceCard
                key={word.id}
                word={word}
                index={word.position_at_landmark}
                showLandmarkLink={true}
              />
            ))}
          </div>
        )}

        {/* Landmark Grid (hidden during search) */}
        {!searchResults && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 10, margin: '10px 0'
          }}>
            {landmarks.map((lm, idx) => {
              const pos = lm.position;
              const phase = PHASES[pos];

              return (
                <div key={lm.id} style={{ display: 'contents' }}>
                  {/* Phase header */}
                  {phase && (
                    <div style={{
                      gridColumn: '1 / -1',
                      color: '#E63946', fontSize: 10, letterSpacing: 3,
                      textTransform: 'uppercase', fontWeight: 700,
                      margin: '18px 0 6px', padding: '6px 0',
                      borderTop: '3px solid #1D1D1B', borderBottom: '1px solid #EEE'
                    }}>
                      {phase}
                    </div>
                  )}

                  {/* Landmark card */}
                  <Link
                    href={`/palace/${langCode}/${pos}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: '#FFF', borderRadius: 0, padding: 14,
                      borderLeft: '5px solid #1D1D1B',
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.04)',
                      transition: '.12s', cursor: 'pointer'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translate(0,0)'; }}
                    >
                      <div style={{ fontSize: 32, color: '#1D1D1B', fontWeight: 700, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
                        {pos}
                      </div>
                      <div style={{
                        color: '#666', fontWeight: 600, fontSize: 11,
                        margin: '2px 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>
                        {lm.name}
                      </div>
                      <div style={{ color: '#BBB', fontSize: 10, marginBottom: 5 }}>
                        {lm.word_count > 0 ? `${lm.word_count} Wörter` : 'Keine Wörter'}
                      </div>
                      {lm.word_count > 0 && (
                        <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#888' }}>
                          <span style={{ color: '#3AD574' }}>● {lm.known_count}</span>
                          <span style={{ color: '#FFBE0B' }}>● {lm.shaky_count}</span>
                          <span style={{ color: '#E63946' }}>● {lm.forgot_count}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <span style={{ color: '#E63946', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Links ({Math.min(lm.word_count, 50)})
                        </span>
                        {lm.word_count > 50 && (
                          <span style={{ color: '#E63946', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Rechts ({lm.word_count - 50})
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
