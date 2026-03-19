'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * / — Polyglot OS Dashboard
 * 
 * Layer 5: Shows active language card with link to grammar module.
 * Future layers will add: palace, journal, assessments, streak, heatmap.
 */

export default function Home() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => { setLanguages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading...</p>
    </div>
  );

  const active = languages.find(l => l.status === 'active');
  const upcoming = languages.filter(l => l.status === 'locked');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
          Polyglot OS
        </h1>
        <p style={{ fontSize: 16, color: '#888', margin: 0 }}>
          Serial sprints to C1. One language at a time.
        </p>
      </div>

      {/* Active Sprint */}
      {active && (
        <div style={{
          background: 'linear-gradient(135deg, #2E86AB 0%, #2EC4B6 100%)',
          borderRadius: 20, padding: 32, color: 'white', marginBottom: 32
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, opacity: 0.8, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Sprint
              </p>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
                {active.flag} {active.name}
              </h2>
              <div style={{ display: 'flex', gap: 20, fontSize: 14 }}>
                <span>Level: <strong>{active.assessed_level}</strong></span>
                <span>Target: <strong>{active.target_level}</strong></span>
                <span>Hours: <strong>{Number(active.total_minutes / 60).toFixed(1)}h</strong></span>
                <span>Chapters: <strong>{active.chapter_count}</strong></span>
                <span>Prompts: <strong>{active.total_prompts?.toLocaleString()}</strong></span>
              </div>
            </div>
            <span style={{ fontSize: 64, opacity: 0.3 }}>{active.flag}</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Link href="/grammar" style={{
              padding: '12px 28px', borderRadius: 12, background: 'white', color: '#2E86AB',
              fontWeight: 700, fontSize: 15, textDecoration: 'none', transition: 'transform 0.2s'
            }}>
              📝 Grammar Trainer
            </Link>
            <span style={{
              padding: '12px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.15)',
              color: 'white', fontWeight: 600, fontSize: 15, opacity: 0.6
            }}>
              🏛 Palace (Layer 6)
            </span>
            <span style={{
              padding: '12px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.15)',
              color: 'white', fontWeight: 600, fontSize: 15, opacity: 0.6
            }}>
              📓 Journal (Layer 7)
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Languages */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px' }}>
        Sprint Queue
      </h3>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12
      }}>
        {upcoming.map(lang => (
          <div key={lang.id} style={{
            background: 'white', borderRadius: 14, padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', opacity: 0.7
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{lang.flag}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                background: '#f0f0f0', color: '#999'
              }}>
                #{lang.sprint_order}
              </span>
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#333', margin: '0 0 4px' }}>
              {lang.name}
            </h4>
            <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
              {lang.assessed_level} · {lang.chapter_count > 0 ? `${lang.chapter_count} chapters` : 'No exercises yet'}
            </p>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div style={{
        marginTop: 40, padding: '20px 0', borderTop: '1px solid #eee',
        display: 'flex', justifyContent: 'center', gap: 32, fontSize: 13, color: '#aaa'
      }}>
        <span>{languages.length} languages</span>
        <span>{languages.reduce((s, l) => s + (l.total_prompts || 0), 0).toLocaleString()} total prompts</span>
        <span>{languages.filter(l => l.chapter_count > 0).length} with exercises</span>
      </div>
    </div>
  );
}
