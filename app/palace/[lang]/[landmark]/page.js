'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PalaceCard from '@/components/PalaceCard';

/**
 * /palace/de/5 — Shows all words at landmark #5
 * 
 * Split into LEFT (50 words) and RIGHT (50 words).
 * Each word is a PalaceCard with click-to-reveal and grading.
 * Navigation to prev/next landmark at top and bottom.
 */

export default function LandmarkPage() {
  const params = useParams();
  const lang = params.lang;
  const landmarkPos = params.landmark;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('left');
  const [allLandmarks, setAllLandmarks] = useState([]);

  useEffect(() => {
    async function load() {
      const [lmRes, allRes] = await Promise.all([
        fetch(`/api/palace?lang=${lang}&landmark=${landmarkPos}`),
        fetch(`/api/palace?lang=${lang}`)
      ]);
      const lmData = await lmRes.json();
      const allData = await allRes.json();
      setData(lmData);
      setAllLandmarks(allData.landmarks || []);
      setLoading(false);
    }
    load();
  }, [lang, landmarkPos]);

  const handleStatusChange = (wordId, newStatus) => {
    setData(prev => {
      if (!prev) return prev;
      const updateWords = (words) => words.map(w =>
        w.id === wordId ? { ...w, status: newStatus } : w
      );
      return {
        ...prev,
        words: {
          left: updateWords(prev.words.left),
          right: updateWords(prev.words.right),
          all: updateWords(prev.words.all),
        },
        stats: {
          ...prev.stats,
          known: prev.words.all.filter(w => (w.id === wordId ? newStatus : w.status) === 'known').length,
          shaky: prev.words.all.filter(w => (w.id === wordId ? newStatus : w.status) === 'shaky').length,
          forgot: prev.words.all.filter(w => (w.id === wordId ? newStatus : w.status) === 'forgot').length,
        }
      };
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading landmark...</p>
    </div>
  );

  if (!data || !data.landmark) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Landmark not found.</p>
    </div>
  );

  const { landmark, words, stats } = data;
  const pos = parseInt(landmarkPos);
  const maxPos = allLandmarks.length;
  const hasPrev = pos > 1;
  const hasNext = pos < maxPos;

  const activeWords = activeTab === 'left' ? words.left : 
                      activeTab === 'right' ? words.right : words.all;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Navigation header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24
      }}>
        {hasPrev ? (
          <a href={`/palace/${lang}/${pos - 1}`} style={{
            fontSize: 14, color: '#2E86AB', textDecoration: 'none', fontWeight: 600
          }}>
            ← #{pos - 1}
          </a>
        ) : <span />}

        <a href="/palace" style={{ fontSize: 13, color: '#2E86AB', textDecoration: 'none' }}>
          Back to route
        </a>

        {hasNext ? (
          <a href={`/palace/${lang}/${pos + 1}`} style={{
            fontSize: 14, color: '#2E86AB', textDecoration: 'none', fontWeight: 600
          }}>
            #{pos + 1} →
          </a>
        ) : <span />}
      </div>

      {/* Landmark header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #4ECDC4 100%)',
        borderRadius: 16, padding: '24px 28px', color: 'white', marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontSize: 32, fontWeight: 800, opacity: 0.4
          }}>
            #{landmark.position}
          </span>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              {landmark.name}
            </h1>
            {landmark.description && (
              <p style={{ fontSize: 14, opacity: 0.8, margin: '4px 0 0' }}>{landmark.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 14 }}>
          <span>{stats.total} words</span>
          <span style={{ color: '#BBF7D0' }}>✓ {stats.known} known</span>
          <span style={{ color: '#FEF08A' }}>~ {stats.shaky} shaky</span>
          <span style={{ color: '#FECACA' }}>✗ {stats.forgot} forgot</span>
          <span style={{ color: '#E0E7FF' }}>• {stats.new} new</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 12, display: 'flex', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.known / stats.total) * 100 : 0}%`, background: '#22C55E' }} />
          <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.shaky / stats.total) * 100 : 0}%`, background: '#F59E0B' }} />
          <div style={{ height: '100%', width: `${stats.total > 0 ? (stats.forgot / stats.total) * 100 : 0}%`, background: '#EF4444' }} />
        </div>
      </div>

      {/* Left / Right / All tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['left', 'right', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: activeTab === tab ? '#2E86AB' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#666',
              transition: 'all 0.15s'
            }}
          >
            {tab === 'left' ? `← Left (${words.left.length})` :
             tab === 'right' ? `Right → (${words.right.length})` :
             `All (${words.all.length})`}
          </button>
        ))}
      </div>

      {/* Word cards */}
      {activeWords.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          <p style={{ fontSize: 18 }}>No words on this side yet.</p>
          <p style={{ fontSize: 14 }}>Import vocabulary to populate this landmark.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeWords.map(word => (
            <PalaceCard
              key={word.id}
              word={word}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Bottom navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 32, padding: '20px 0',
        borderTop: '1px solid #eee'
      }}>
        {hasPrev ? (
          <a href={`/palace/${lang}/${pos - 1}`} style={{
            padding: '10px 24px', borderRadius: 10, background: '#f0f0f0',
            color: '#333', fontWeight: 600, fontSize: 14, textDecoration: 'none'
          }}>
            ← Previous Landmark
          </a>
        ) : <span />}
        {hasNext ? (
          <a href={`/palace/${lang}/${pos + 1}`} style={{
            padding: '10px 24px', borderRadius: 10, background: '#2E86AB',
            color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none'
          }}>
            Next Landmark →
          </a>
        ) : <span />}
      </div>
    </div>
  );
}
