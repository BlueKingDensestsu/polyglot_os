'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PalaceCard from '@/components/PalaceCard';

/**
 * /palace — Landmark route + global word search
 * 
 * Search bar at the top searches ALL words across ALL landmarks.
 * Below: the landmark route timeline (same as before).
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

  // Search with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/palace?lang=${langCode}&search=${encodeURIComponent(searchQuery)}`);
        const results = await res.json();
        setSearchResults(results);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusChange = (wordId, newStatus) => {
    if (searchResults?.words) {
      setSearchResults(prev => ({
        ...prev,
        words: prev.words.map(w => w.id === wordId ? { ...w, status: newStatus } : w)
      }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading palace...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <p>No palace data. Import vocabulary first.</p>
    </div>
  );

  const { language, landmarks, total_words } = data;
  const totalKnown = landmarks.reduce((s, l) => s + (l.known_count || 0), 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
          {language.flag} Mental Palace
        </h1>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>
          {language.palace_route}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, fontSize: 14, marginBottom: 16 }}>
          <span><strong>{landmarks.length}</strong> landmarks</span>
          <span><strong>{total_words.toLocaleString()}</strong> words</span>
          <span style={{ color: '#22C55E' }}><strong>{totalKnown}</strong> known</span>
          <span style={{
            display: 'inline-block', width: 200, height: 8, background: '#eee',
            borderRadius: 4, verticalAlign: 'middle'
          }}>
            <span style={{
              display: 'block', height: '100%', borderRadius: 4,
              width: total_words > 0 ? `${(totalKnown / total_words) * 100}%` : '0%',
              background: 'linear-gradient(90deg, #22C55E, #4ECDC4)'
            }} />
          </span>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 500 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search all words... (type 2+ characters)"
            style={{
              width: '100%', padding: '12px 18px', borderRadius: 12,
              border: '2px solid #ddd', fontSize: 15, fontFamily: 'inherit',
              outline: 'none', transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.border = '2px solid #2E86AB'}
            onBlur={e => e.target.style.border = '2px solid #ddd'}
          />
          {searching && (
            <span style={{ position: 'absolute', right: 16, top: 14, fontSize: 14, color: '#888' }}>
              ...
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Link href={`/palace/${langCode}/review`} style={{
            padding: '10px 24px', borderRadius: 10, background: '#EF4444',
            color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none'
          }}>
            🔥 Review Weakest
          </Link>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && searchResults.words && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 12px' }}>
            Found {searchResults.words.length} words for "{searchQuery}"
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.words.slice(0, 20).map(word => (
              <PalaceCard key={word.id} word={word} onStatusChange={handleStatusChange} />
            ))}
          </div>
          {searchResults.words.length > 20 && (
            <p style={{ fontSize: 13, color: '#888', textAlign: 'center', marginTop: 12 }}>
              Showing 20 of {searchResults.words.length} results. Refine your search.
            </p>
          )}
        </div>
      )}

      {/* Landmark Route (hide when search is active) */}
      {!searchResults && (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 28, top: 30, bottom: 30,
            width: 3, background: 'linear-gradient(to bottom, #4ECDC4, #2E86AB)',
            borderRadius: 2, zIndex: 0
          }} />

          {landmarks.map(lm => {
            const hasWords = lm.word_count > 0;
            const pct = lm.word_count > 0 ? (lm.known_count / lm.word_count) : 0;

            return (
              <Link key={lm.id} href={`/palace/${langCode}/${lm.position}`}
                style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  marginBottom: 4, position: 'relative', zIndex: 1
                }}>
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

                  <div style={{
                    flex: 1, background: 'white', borderRadius: 14, padding: '16px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer',
                    transition: 'all 0.2s', opacity: hasWords ? 1 : 0.6
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{lm.name}</h3>
                      <span style={{ fontSize: 13, color: '#888' }}>{lm.word_count} words</span>
                    </div>
                    {hasWords && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
                          <span style={{ color: STATUS_COLORS.known }}>● {lm.known_count}</span>
                          <span style={{ color: STATUS_COLORS.shaky }}>● {lm.shaky_count}</span>
                          <span style={{ color: STATUS_COLORS.forgot }}>● {lm.forgot_count}</span>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, display: 'flex', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(lm.known_count / lm.word_count) * 100}%`, background: STATUS_COLORS.known }} />
                          <div style={{ height: '100%', width: `${(lm.shaky_count / lm.word_count) * 100}%`, background: STATUS_COLORS.shaky }} />
                          <div style={{ height: '100%', width: `${(lm.forgot_count / lm.word_count) * 100}%`, background: STATUS_COLORS.forgot }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
