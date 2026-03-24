'use client';

import { useState, useRef } from 'react';

/**
 * PalaceCard — Bauhaus Edition
 * Matches the German palace HTML v7 exactly:
 *   - Sharp corners (border-radius: 0)
 *   - Hard shadow (2px 2px 0)
 *   - Colored word text by type
 *   - Click to toggle reveal (english + image)
 *   - Audio button with ABSPIELEN
 *   - DM Sans/Mono typography
 *   - Type badge + gender dot
 */

const TC = {
  M:     { c:'#1B4B8A', bg:'#EDF2FA', bdr:'#3A7BD5', dot:'#3A7BD5', lbl:'Maskulin' },
  F:     { c:'#9B1B4D', bg:'#FAEDF2', bdr:'#D53A6F', dot:'#D53A6F', lbl:'Feminin' },
  N:     { c:'#1B7A3D', bg:'#EDFAF1', bdr:'#3AD574', dot:'#3AD574', lbl:'Neutrum' },
  verb:  { c:'#C43E00', bg:'#FFF4EC', bdr:'#E8651A', dot:'#E8651A', lbl:'Verb' },
  adj:   { c:'#6B21A8', bg:'#F5EEFA', bdr:'#9B59B6', dot:'#9B59B6', lbl:'Adjektiv' },
  adv:   { c:'#0E6B60', bg:'#ECFAF8', bdr:'#20B2AA', dot:'#20B2AA', lbl:'Adverb' },
  other: { c:'#4A4A4A', bg:'#F5F5F5', bdr:'#AAAAAA', dot:'#999999', lbl:'Andere' },
};

function getTypeKey(word) {
  if (word.gender === 'M') return 'M';
  if (word.gender === 'F') return 'F';
  if (word.gender === 'N') return 'N';
  const pos = (word.part_of_speech || '').toLowerCase();
  if (pos.includes('verb')) return 'verb';
  if (pos.includes('adj')) return 'adj';
  if (pos.includes('adv')) return 'adv';
  return 'other';
}

export default function PalaceCard({ word, index, onStatusChange, mediaPath = '/media/de', showLandmarkLink }) {
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef(null);

  const typeKey = getTypeKey(word);
  const tc = TC[typeKey] || TC.other;

  const playAudio = (e) => {
    e.stopPropagation();
    if (!word.audio_filename) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`${mediaPath}/${word.audio_filename}`);
    audioRef.current = audio;
    audio.play().catch(err => console.log('Audio:', err));
  };

  const handleGrade = (status, e) => {
    e.stopPropagation();
    fetch('/api/vocabulary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: word.id, status })
    }).then(() => {
      if (onStatusChange) onStatusChange(word.id, status);
    });
  };

  return (
    <div
      onClick={() => setRevealed(!revealed)}
      style={{
        background: '#FFF',
        borderRadius: 0,
        padding: '16px 18px',
        borderLeft: `5px solid ${tc.bdr}`,
        cursor: 'pointer',
        transition: '.12s',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.04)',
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '2px 2px 0 rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translate(0,0)'; }}
    >
      {/* Top row: number + badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ color: '#CCC', fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
          #{index || word.position_at_landmark || ''}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {/* Gender dot */}
          {word.gender && (
            <span style={{
              display: 'inline-block', padding: '2px 7px', fontSize: 12,
              fontWeight: 700, color: '#FFF', borderRadius: 0, background: tc.dot
            }}>
              {word.gender}
            </span>
          )}
          {/* Type badge */}
          <span style={{
            display: 'inline-block', padding: '2px 7px', fontSize: 12,
            fontWeight: 600, color: '#FFF', borderRadius: 0, background: tc.dot,
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {tc.lbl}
          </span>
        </div>
      </div>

      {/* Word — colored by type */}
      <div style={{
        fontSize: 27, fontWeight: 700, color: tc.c,
        marginBottom: 2, letterSpacing: '-0.3px'
      }}>
        {word.word}
      </div>

      {/* Example sentence */}
      {word.example_sentence && (
        <div style={{ color: '#777', fontSize: 18, lineHeight: 1.4 }}>
          {word.example_sentence}
        </div>
      )}

      {/* Translation (under example) */}
      {word.example_translation && (
        <div style={{ color: '#555', fontSize: 16, fontStyle: 'italic', marginTop: 2 }}>
          {word.example_translation}
        </div>
      )}

      {/* Audio button */}
      {word.audio_filename && (
        <button
          onClick={playAudio}
          style={{
            background: '#FFF', border: '2px solid #1D1D1B', color: '#1D1D1B',
            padding: '4px 12px', borderRadius: 0, fontSize: 16, cursor: 'pointer',
            transition: '.1s', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.5px'
          }}
          onMouseEnter={e => { e.target.style.background = '#1D1D1B'; e.target.style.color = '#FFF'; }}
          onMouseLeave={e => { e.target.style.background = '#FFF'; e.target.style.color = '#1D1D1B'; }}
        >
          &#9654; Abspielen
        </button>
      )}

      {/* Reveal section (click to show) */}
      {revealed && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '2px solid #F0F0F0' }}>
          {/* English meaning */}
          {word.translation && (
            <div style={{ color: '#C43E00', fontWeight: 700, fontSize: 21, marginBottom: 3 }}>
              {word.translation}
            </div>
          )}

          {/* Image */}
          {word.image_filename && (
            <img
              src={`${mediaPath}/${word.image_filename}`}
              alt={word.word}
              style={{
                maxWidth: '100%', maxHeight: 240, borderRadius: 0,
                margin: '6px 0', objectFit: 'contain'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Extra examples */}
          {word.example_sentence_2 && (
            <div style={{ color: '#AAA', fontSize: 16, marginTop: 3 }}>
              {word.example_sentence_2}
            </div>
          )}

          {/* Landmark link (for search results) */}
          {showLandmarkLink && word.landmark_position && (
            <div style={{ fontSize: 11, marginTop: 3 }}>
              <a
                href={`/palace/de/${word.landmark_position}`}
                onClick={e => e.stopPropagation()}
                style={{
                  color: '#E63946', textDecoration: 'none', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}
              >
                → Station {word.landmark_position} ({word.side})
              </a>
            </div>
          )}

          {/* Grade buttons */}
          {onStatusChange && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[
                { s: 'known', l: '✓ Kann ich', bg: '#EDFAF1', hover: '#D4F5DC', c: '#1B7A3D' },
                { s: 'shaky', l: '~ Wackelig', bg: '#FFF8EB', hover: '#FEF3C7', c: '#C43E00' },
                { s: 'forgot', l: '✗ Vergessen', bg: '#FAEDF2', hover: '#FEE2E2', c: '#9B1B4D' },
              ].map(btn => (
                <button
                  key={btn.s}
                  onClick={(e) => handleGrade(btn.s, e)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 0, border: 'none',
                    cursor: 'pointer', background: btn.bg, color: btn.c,
                    fontWeight: 700, fontSize: 13, transition: '.12s',
                    fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={e => e.target.style.background = btn.hover}
                  onMouseLeave={e => e.target.style.background = btn.bg}
                >
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
