'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PalaceCard from '@/components/PalaceCard';

/**
 * /palace/de/5 — Single landmark Bauhaus edition
 * 
 * Matches HTML palace v7:
 *   - Bauhaus header strip
 *   - Station pills (1-43) with active highlight
 *   - Legend bar
 *   - Alle zeigen / Alle verbergen buttons
 *   - Global search embedded
 *   - Cards in grid with Bauhaus styling
 */

export default function LandmarkPage() {
  const params = useParams();
  const lang = params.lang;
  const landmarkPos = parseInt(params.landmark);

  const [data, setData] = useState(null);
  const [allLandmarks, setAllLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('left');
  const [revealAll, setRevealAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    async function load() {
      const [lmRes, allRes] = await Promise.all([
        fetch(`/api/palace?lang=${lang}&landmark=${landmarkPos}`),
        fetch(`/api/palace?lang=${lang}`)
      ]);
      setData(await lmRes.json());
      const allData = await allRes.json();
      setAllLandmarks(allData.landmarks || []);
      setTotalWords(allData.total_words || 0);
      setLoading(false);
    }
    load();
  }, [lang, landmarkPos]);

  // Search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/palace?lang=${lang}&search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, lang]);

  const handleStatusChange = (wordId, newStatus) => {
    setData(prev => {
      if (!prev) return prev;
      const update = words => words.map(w => w.id === wordId ? { ...w, status: newStatus } : w);
      return {
        ...prev,
        words: { left: update(prev.words.left), right: update(prev.words.right), all: update(prev.words.all) }
      };
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888', fontFamily: "'DM Sans', sans-serif" }}>Laden...</p>
    </div>
  );

  if (!data?.landmark) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Station nicht gefunden.</div>
  );

  const { landmark, words, stats } = data;
  const maxPos = allLandmarks.length;
  const activeWords = activeTab === 'left' ? words.left : activeTab === 'right' ? words.right : words.all;
  const sideLabel = { left: 'Links', right: 'Rechts' };
  const startNum = activeTab === 'left' ? ((landmarkPos - 1) * 100 + 1) : ((landmarkPos - 1) * 100 + 51);
  const endNum = startNum + activeWords.length - 1;

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
      </div>

      <div style={{ maxWidth: 1260, margin: '0 auto', padding: 16 }}>
        {/* Station title */}
        <div style={{
          textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1D1D1B',
          margin: '12px 0 2px', textTransform: 'uppercase', letterSpacing: 1
        }}>
          Station {landmarkPos} — {sideLabel[activeTab] || 'Alle'}
        </div>
        <div style={{ textAlign: 'center', color: '#E63946', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          {landmark.name}
        </div>
        <div style={{
          textAlign: 'center', color: '#AAA', fontSize: 11, marginBottom: 10,
          fontFamily: "'DM Mono', monospace"
        }}>
          Wörter #{startNum}–{endNum} · {activeWords.length} Karten
        </div>

        {/* Station pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3, margin: '8px 0' }}>
          {Array.from({ length: maxPos }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`/palace/${lang}/${p}`}
              style={{
                minWidth: 28, height: 28, border: '2px solid ' + (p === landmarkPos ? '#1D1D1B' : '#DDD'),
                background: p === landmarkPos ? '#1D1D1B' : '#FFF',
                color: p === landmarkPos ? '#FFBE0B' : '#999',
                fontSize: 10, fontWeight: 700, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', transition: '.1s', borderRadius: 0,
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {p}
            </a>
          ))}
        </div>

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

        {/* Toolbar */}
        <div style={{
          background: '#1D1D1B', padding: '10px 16px', display: 'flex',
          flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14
        }}>
          {/* Left / Right / All tabs */}
          {['left', 'right', 'all'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setRevealAll(false); }}
              style={{
                background: activeTab === tab ? '#E63946' : 'transparent',
                color: '#FFF', border: `2px solid ${activeTab === tab ? '#E63946' : '#FFF'}`,
                padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1
              }}
            >
              {tab === 'left' ? `Links (${words.left.length})` :
               tab === 'right' ? `Rechts (${words.right.length})` :
               `Alle (${words.all.length})`}
            </button>
          ))}

          <div style={{ width: 1, background: '#444', margin: '0 4px' }} />

          {/* Show/Hide all */}
          <button
            onClick={() => setRevealAll(true)}
            style={{
              background: 'transparent', color: '#FFF', border: '2px solid #FFF',
              padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            Alle zeigen
          </button>
          <button
            onClick={() => setRevealAll(false)}
            style={{
              background: 'transparent', color: '#FFF', border: '2px solid #FFF',
              padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            Alle verbergen
          </button>

          <a
            href="/palace"
            style={{
              background: 'transparent', color: '#FFF', border: '2px solid #FFF',
              padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', borderRadius: 0, textTransform: 'uppercase',
              letterSpacing: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center'
            }}
          >
            🏠 Übersicht
          </a>
        </div>

        {/* Search */}
        <div style={{ maxWidth: 460, margin: '10px auto', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`🔍 Alle ${totalWords} Wörter durchsuchen...`}
            style={{
              width: '100%', padding: '10px 14px', border: '2px solid #1D1D1B',
              borderRadius: 0, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              background: '#FFF', transition: '.12s'
            }}
            onFocus={e => { e.target.style.borderColor = '#E63946'; e.target.style.boxShadow = '4px 4px 0 #FFBE0B'; }}
            onBlur={e => { e.target.style.borderColor = '#1D1D1B'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {searchResults && (
          <div style={{ textAlign: 'center', color: '#AAA', fontSize: 11, margin: '4px 0', fontFamily: "'DM Mono', monospace" }}>
            {searchResults.count} Ergebnisse
          </div>
        )}

        {/* Search results or cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 10, margin: '10px 0'
        }}>
          {searchResults ? (
            searchResults.words?.slice(0, 50).map(word => (
              <PalaceCard
                key={word.id}
                word={word}
                index={word.position_at_landmark}
                showLandmarkLink={true}
              />
            ))
          ) : (
            activeWords.map((word, i) => (
              <PalaceCardRevealed
                key={word.id}
                word={word}
                index={i + 1}
                revealed={revealAll}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>

        {/* Navigation */}
        <div style={{
          textAlign: 'center', margin: '16px 0', fontSize: 12,
          textTransform: 'uppercase', letterSpacing: 1
        }}>
          {landmarkPos > 1 && (
            <a href={`/palace/${lang}/${landmarkPos - 1}`}
              style={{ color: '#E63946', textDecoration: 'none', margin: '0 6px', fontWeight: 700 }}>
              ← Zurück
            </a>
          )}
          <a href="/palace"
            style={{ color: '#E63946', textDecoration: 'none', margin: '0 6px', fontWeight: 700 }}>
            🏠 Übersicht
          </a>
          {landmarkPos < maxPos && (
            <a href={`/palace/${lang}/${landmarkPos + 1}`}
              style={{ color: '#E63946', textDecoration: 'none', margin: '0 6px', fontWeight: 700 }}>
              Weiter →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PalaceCard wrapper that supports external reveal control
 */
function PalaceCardRevealed({ word, index, revealed, onStatusChange }) {
  const [localRevealed, setLocalRevealed] = useState(false);
  const isRevealed = revealed || localRevealed;
  const audioRef = { current: null };

  const TC = {
    M:     { c:'#1B4B8A', bdr:'#3A7BD5', dot:'#3A7BD5', lbl:'Maskulin' },
    F:     { c:'#9B1B4D', bdr:'#D53A6F', dot:'#D53A6F', lbl:'Feminin' },
    N:     { c:'#1B7A3D', bdr:'#3AD574', dot:'#3AD574', lbl:'Neutrum' },
    verb:  { c:'#C43E00', bdr:'#E8651A', dot:'#E8651A', lbl:'Verb' },
    adj:   { c:'#6B21A8', bdr:'#9B59B6', dot:'#9B59B6', lbl:'Adjektiv' },
    adv:   { c:'#0E6B60', bdr:'#20B2AA', dot:'#20B2AA', lbl:'Adverb' },
    other: { c:'#4A4A4A', bdr:'#AAAAAA', dot:'#999999', lbl:'Andere' },
  };

  function getTypeKey() {
    if (word.gender === 'M') return 'M';
    if (word.gender === 'F') return 'F';
    if (word.gender === 'N') return 'N';
    const pos = (word.part_of_speech || '').toLowerCase();
    if (pos.includes('verb')) return 'verb';
    if (pos.includes('adj')) return 'adj';
    if (pos.includes('adv')) return 'adv';
    return 'other';
  }

  const tc = TC[getTypeKey()] || TC.other;

  const playAudio = (e) => {
    e.stopPropagation();
    if (!word.audio_filename) return;
    const audio = new Audio(`/media/de/${word.audio_filename}`);
    audio.play().catch(err => console.log('Audio:', err));
  };

  const handleGrade = (status, e) => {
    e.stopPropagation();
    fetch('/api/vocabulary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: word.id, status })
    }).then(() => { if (onStatusChange) onStatusChange(word.id, status); });
  };

  return (
    <div
      onClick={() => setLocalRevealed(!localRevealed)}
      style={{
        background: '#FFF', borderRadius: 0, padding: '16px 18px',
        borderLeft: `5px solid ${tc.bdr}`, cursor: 'pointer',
        transition: '.12s', boxShadow: '2px 2px 0 rgba(0,0,0,0.04)'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.04)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ color: '#CCC', fontSize: 14, fontFamily: "'DM Mono', monospace" }}>#{index}</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {word.gender && (
            <span style={{ padding: '2px 7px', fontSize: 12, fontWeight: 700, color: '#FFF', borderRadius: 0, background: tc.dot }}>
              {word.gender}
            </span>
          )}
          <span style={{
            padding: '2px 7px', fontSize: 12, fontWeight: 600, color: '#FFF',
            borderRadius: 0, background: tc.dot, textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {tc.lbl}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 27, fontWeight: 700, color: tc.c, marginBottom: 2, letterSpacing: '-0.3px' }}>
        {word.word}
      </div>

      {word.example_sentence && (
        <div style={{ color: '#777', fontSize: 18, lineHeight: 1.4 }}>{word.example_sentence}</div>
      )}
      {word.example_translation && (
        <div style={{ color: '#555', fontSize: 16, fontStyle: 'italic', marginTop: 2 }}>{word.example_translation}</div>
      )}

      {word.audio_filename && (
        <button onClick={playAudio} style={{
          background: '#FFF', border: '2px solid #1D1D1B', color: '#1D1D1B',
          padding: '4px 12px', borderRadius: 0, fontSize: 16, cursor: 'pointer',
          fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.5px',
          fontFamily: "'DM Sans', sans-serif", transition: '.1s'
        }}
          onMouseEnter={e => { e.target.style.background = '#1D1D1B'; e.target.style.color = '#FFF'; }}
          onMouseLeave={e => { e.target.style.background = '#FFF'; e.target.style.color = '#1D1D1B'; }}
        >
          ▶ Abspielen
        </button>
      )}

      {isRevealed && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '2px solid #F0F0F0' }}>
          {word.translation && (
            <div style={{ color: '#C43E00', fontWeight: 700, fontSize: 21, marginBottom: 3 }}>{word.translation}</div>
          )}
          {word.image_filename && (
            <img src={`/media/de/${word.image_filename}`} alt={word.word}
              style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 0, margin: '6px 0', objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          {onStatusChange && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[
                { s: 'known', l: '✓ Kann ich', bg: '#EDFAF1', c: '#1B7A3D' },
                { s: 'shaky', l: '~ Wackelig', bg: '#FFF8EB', c: '#C43E00' },
                { s: 'forgot', l: '✗ Vergessen', bg: '#FAEDF2', c: '#9B1B4D' },
              ].map(btn => (
                <button key={btn.s} onClick={e => handleGrade(btn.s, e)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 0, border: 'none',
                  cursor: 'pointer', background: btn.bg, color: btn.c,
                  fontWeight: 700, fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.5px', fontFamily: "'DM Sans', sans-serif"
                }}>
                  {btn.l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
