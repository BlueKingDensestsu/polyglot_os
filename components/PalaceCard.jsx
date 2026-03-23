'use client';

import { useState } from 'react';

/**
 * PalaceCard — A single vocabulary card in the mental palace
 * 
 * Gender colors:
 *   Blue #4A90D9   = Masculine
 *   Pink #E87BA8   = Feminine
 *   Green #7BC67E  = Neuter
 *   Amber #F59E0B  = Verb
 *   Violet #8B5CF6 = Adjective
 *   Teal #4ECDC4   = Default/Other
 * 
 * States:
 *   Hidden  → shows word only, click to reveal translation + examples
 *   Revealed → shows everything, grade buttons appear
 *   Graded  → card dims slightly, status badge shows
 */

const GENDER_COLORS = {
  M:   { bg: '#EBF3FB', border: '#4A90D9', text: '#2563EB', label: 'M' },
  F:   { bg: '#FCEEF4', border: '#E87BA8', text: '#DB2777', label: 'F' },
  N:   { bg: '#EDFCF2', border: '#7BC67E', text: '#16A34A', label: 'N' },
};

const POS_COLORS = {
  verb:      { bg: '#FFF8EB', border: '#F59E0B', text: '#D97706', label: 'V' },
  adjective: { bg: '#F3EEFF', border: '#8B5CF6', text: '#7C3AED', label: 'ADJ' },
  adverb:    { bg: '#FDF2F8', border: '#EC4899', text: '#DB2777', label: 'ADV' },
};

const STATUS_BADGES = {
  known:    { label: '✓', color: '#22C55E', bg: '#F0FDF4' },
  learning: { label: '~', color: '#3B82F6', bg: '#EFF6FF' },
  shaky:    { label: '?', color: '#F59E0B', bg: '#FFFBEB' },
  forgot:   { label: '✗', color: '#EF4444', bg: '#FEF2F2' },
  new:      { label: '•', color: '#9CA3AF', bg: '#F9FAFB' },
};

export default function PalaceCard({ word, onStatusChange }) {
  const [revealed, setRevealed] = useState(false);

  // Determine card color based on gender or POS
  const genderStyle = GENDER_COLORS[word.gender] ||
    POS_COLORS[word.part_of_speech] ||
    { bg: '#F0FDFA', border: '#4ECDC4', text: '#0D9488', label: '' };

  const statusBadge = STATUS_BADGES[word.status] || STATUS_BADGES.new;

  const handleGrade = async (status) => {
    try {
      await fetch('/api/vocabulary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: word.id, status })
      });
      if (onStatusChange) onStatusChange(word.id, status);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  return (
    <div
      style={{
        background: revealed ? genderStyle.bg : 'white',
        borderLeft: `4px solid ${genderStyle.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: revealed ? 'default' : 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
      onClick={() => !revealed && setRevealed(true)}
    >
      {/* Top row: word + badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Gender/POS badge */}
          {genderStyle.label && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              color: genderStyle.text, background: genderStyle.bg,
              border: `1px solid ${genderStyle.border}`
            }}>
              {genderStyle.label}
            </span>
          )}

          {/* The word */}
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
            {word.word}
          </span>

          {/* Plural */}
          {word.plural && (
            <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
              pl: {word.plural}
            </span>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          color: statusBadge.color, background: statusBadge.bg
        }}>
          {statusBadge.label} {word.status}
        </span>
      </div>

      {/* Hidden state — click prompt */}
      {!revealed && (
        <p style={{ fontSize: 13, color: '#bbb', margin: '10px 0 0', fontStyle: 'italic' }}>
          Click to reveal →
        </p>
      )}

      {/* Revealed state */}
      {revealed && (
        <div style={{ marginTop: 14 }}>
          {/* Translation */}
          <p style={{ fontSize: 17, fontWeight: 600, color: genderStyle.text, margin: '0 0 10px' }}>
            {word.translation}
          </p>

          {/* Example sentences */}
          {word.example_sentence && (
            <div style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 14px',
              margin: '0 0 8px', fontSize: 13, lineHeight: 1.6
            }}>
              <p style={{ margin: 0, color: '#333' }}>📝 {word.example_sentence}</p>
              {word.example_translation && (
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>
                  → {word.example_translation}
                </p>
              )}
            </div>
          )}

          {word.example_sentence_2 && (
            <div style={{
              background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 14px',
              margin: '0 0 8px', fontSize: 13, lineHeight: 1.6
            }}>
              <p style={{ margin: 0, color: '#333' }}>📝 {word.example_sentence_2}</p>
              {word.example_translation_2 && (
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>
                  → {word.example_translation_2}
                </p>
              )}
            </div>
          )}

          {/* Frequency rank */}
          {word.frequency_rank && (
            <p style={{ fontSize: 11, color: '#aaa', margin: '8px 0 0' }}>
              Frequency: #{word.frequency_rank}
            </p>
          )}

          {/* Grade buttons */}
          <div style={{
            display: 'flex', gap: 8, marginTop: 14, paddingTop: 14,
            borderTop: '1px solid rgba(0,0,0,0.06)'
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleGrade('known'); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: 13,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.target.style.background = '#DCFCE7'}
              onMouseLeave={e => e.target.style.background = '#F0FDF4'}
            >
              ✓ Known
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleGrade('shaky'); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: 13,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.target.style.background = '#FEF3C7'}
              onMouseLeave={e => e.target.style.background = '#FFFBEB'}
            >
              ~ Shaky
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleGrade('forgot'); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: 13,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.target.style.background = '#FEE2E2'}
              onMouseLeave={e => e.target.style.background = '#FEF2F2'}
            >
              ✗ Forgot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
