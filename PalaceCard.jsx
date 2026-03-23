'use client';

import { useState, useRef } from 'react';

/**
 * PalaceCard v2 — Full-featured vocabulary card
 * 
 * Features:
 *   - Gender-colored left border (blue M, pink F, green N, amber V, violet ADJ)
 *   - Word type caption badge (noun, verb, adjective, etc.)
 *   - Click-to-reveal translation + examples
 *   - Image display (from public/media/de/)
 *   - Audio playback button (Forvo pronunciation)
 *   - Known/Shaky/Forgot grading buttons
 *   - Frequency rank display
 */

const GENDER_STYLES = {
  M: { bg: '#EBF3FB', border: '#4A90D9', text: '#2563EB', label: 'der', caption: 'Masculine' },
  F: { bg: '#FCEEF4', border: '#E87BA8', text: '#DB2777', label: 'die', caption: 'Feminine' },
  N: { bg: '#EDFCF2', border: '#7BC67E', text: '#16A34A', label: 'das', caption: 'Neuter' },
};

const POS_STYLES = {
  verb:       { bg: '#FFF8EB', border: '#F59E0B', text: '#D97706', label: 'VERB' },
  adjective:  { bg: '#F3EEFF', border: '#8B5CF6', text: '#7C3AED', label: 'ADJ' },
  adverb:     { bg: '#FDF2F8', border: '#EC4899', text: '#DB2777', label: 'ADV' },
  noun:       { bg: '#F0F9FF', border: '#0EA5E9', text: '#0369A1', label: 'NOUN' },
  preposition:{ bg: '#F5F5F5', border: '#737373', text: '#525252', label: 'PREP' },
  conjunction:{ bg: '#F5F5F5', border: '#737373', text: '#525252', label: 'CONJ' },
};

const STATUS_STYLES = {
  known:    { label: '✓ Known',  color: '#22C55E', bg: '#F0FDF4' },
  learning: { label: '~ Learning', color: '#3B82F6', bg: '#EFF6FF' },
  shaky:    { label: '? Shaky',  color: '#F59E0B', bg: '#FFFBEB' },
  forgot:   { label: '✗ Forgot', color: '#EF4444', bg: '#FEF2F2' },
  new:      { label: '• New',    color: '#9CA3AF', bg: '#F9FAFB' },
};

export default function PalaceCard({ word, onStatusChange, mediaPath = '/media/de' }) {
  const [revealed, setRevealed] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  // Determine card style from gender or POS
  const genderStyle = GENDER_STYLES[word.gender];
  const posStyle = POS_STYLES[word.part_of_speech];
  const cardStyle = genderStyle || posStyle || 
    { bg: '#F0FDFA', border: '#4ECDC4', text: '#0D9488', label: '', caption: '' };

  const statusStyle = STATUS_STYLES[word.status] || STATUS_STYLES.new;

  const playAudio = (e) => {
    e.stopPropagation();
    if (!word.audio_filename) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`${mediaPath}/${word.audio_filename}`);
    audioRef.current = audio;
    setAudioPlaying(true);
    audio.play().catch(() => setAudioPlaying(false));
    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => setAudioPlaying(false);
  };

  const handleGrade = async (status, e) => {
    e.stopPropagation();
    try {
      await fetch('/api/vocabulary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: word.id, status })
      });
      if (onStatusChange) onStatusChange(word.id, status);
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  return (
    <div
      onClick={() => !revealed && setRevealed(true)}
      style={{
        background: revealed ? cardStyle.bg : 'white',
        borderLeft: `5px solid ${cardStyle.border}`,
        borderRadius: 14,
        padding: '18px 22px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        cursor: revealed ? 'default' : 'pointer',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top row: word + badges + audio */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Gender article badge */}
          {genderStyle && (
            <span style={{
              fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 8,
              color: genderStyle.text, background: genderStyle.bg,
              border: `1.5px solid ${genderStyle.border}`
            }}>
              {genderStyle.label}
            </span>
          )}

          {/* POS caption badge */}
          {posStyle && !genderStyle && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
              color: posStyle.text, background: posStyle.bg,
              border: `1.5px solid ${posStyle.border}`
            }}>
              {posStyle.label}
            </span>
          )}

          {/* Word type caption (shown alongside gender) */}
          {genderStyle && word.part_of_speech && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              color: '#888', background: '#f5f5f5'
            }}>
              {word.part_of_speech}
            </span>
          )}

          {/* The word itself */}
          <span style={{ fontSize: 22, fontWeight: 800, color: cardStyle.text || '#1a1a2e' }}>
            {word.word}
          </span>

          {/* Plural */}
          {word.plural && (
            <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
              (pl: {word.plural})
            </span>
          )}
        </div>

        {/* Right side: audio button + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Audio button */}
          {word.audio_filename && (
            <button
              onClick={playAudio}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: audioPlaying ? '#2E86AB' : '#E3F2FD',
                color: audioPlaying ? 'white' : '#2E86AB',
                fontSize: 16, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              {audioPlaying ? '⏸' : '🔊'}
            </button>
          )}

          {/* Status badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
            color: statusStyle.color, background: statusStyle.bg,
            whiteSpace: 'nowrap'
          }}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Hidden prompt */}
      {!revealed && (
        <p style={{ fontSize: 13, color: '#ccc', margin: '12px 0 0', fontStyle: 'italic' }}>
          Click to reveal →
        </p>
      )}

      {/* Revealed content */}
      {revealed && (
        <div style={{ marginTop: 16 }}>
          {/* Image + Translation row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            {/* Image */}
            {word.image_filename && (
              <div style={{
                width: 100, height: 100, borderRadius: 10, overflow: 'hidden',
                flexShrink: 0, background: '#f0f0f0'
              }}>
                <img
                  src={`${mediaPath}/${word.image_filename}`}
                  alt={word.word}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Translation */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
                {word.translation || '(no translation)'}
              </p>

              {/* Gender caption when revealed */}
              {genderStyle && (
                <p style={{ fontSize: 12, color: genderStyle.text, margin: '0 0 4px', fontWeight: 600 }}>
                  {genderStyle.caption} — {genderStyle.label} {word.word}
                </p>
              )}

              {/* Frequency */}
              {word.frequency_rank && (
                <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>
                  Frequency rank: #{word.frequency_rank}
                </p>
              )}
            </div>
          </div>

          {/* Example sentences */}
          {[
            { text: word.example_sentence, trans: word.example_translation },
            { text: word.example_sentence_2, trans: word.example_translation_2 },
            { text: word.example_sentence_3, trans: word.example_translation_3 },
          ].filter(ex => ex.text).map((ex, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '10px 14px',
              margin: '0 0 8px', borderLeft: `3px solid ${cardStyle.border}40`
            }}>
              <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.5 }}>
                📝 {ex.text}
              </p>
              {ex.trans && (
                <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
                  → {ex.trans}
                </p>
              )}
            </div>
          ))}

          {/* Grade buttons */}
          <div style={{
            display: 'flex', gap: 8, marginTop: 16, paddingTop: 14,
            borderTop: '1px solid rgba(0,0,0,0.06)'
          }}>
            {[
              { status: 'known', label: '✓ Known', bg: '#F0FDF4', hover: '#DCFCE7', color: '#16A34A' },
              { status: 'shaky', label: '~ Shaky', bg: '#FFFBEB', hover: '#FEF3C7', color: '#D97706' },
              { status: 'forgot', label: '✗ Forgot', bg: '#FEF2F2', hover: '#FEE2E2', color: '#DC2626' },
            ].map(btn => (
              <button
                key={btn.status}
                onClick={(e) => handleGrade(btn.status, e)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  cursor: 'pointer', background: btn.bg, color: btn.color,
                  fontWeight: 700, fontSize: 14, transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.target.style.background = btn.hover}
                onMouseLeave={e => e.target.style.background = btn.bg}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
