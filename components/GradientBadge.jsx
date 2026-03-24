'use client';

/**
 * GradientBadge — Displays the current gradient level with visual indicators
 * 
 * Shows: level text (B1.3), trend arrow (↑↓→), progress ring,
 * and color-coded background based on CEFR band.
 * 
 * Props:
 *   gradient: { current, progress_percent, trend, is_complete }
 *   size: 'small' | 'medium' | 'large' (default medium)
 */

const LEVEL_COLORS = {
  A1: { bg: '#DBEAFE', text: '#1D4ED8', ring: '#3B82F6' },
  A2: { bg: '#D1FAE5', text: '#059669', ring: '#10B981' },
  B1: { bg: '#FEF3C7', text: '#D97706', ring: '#F59E0B' },
  B2: { bg: '#FDE68A', text: '#B45309', ring: '#F59E0B' },
  C1: { bg: '#E0E7FF', text: '#4338CA', ring: '#6366F1' },
};

const TREND_ICONS = {
  improving: { icon: '↑', color: '#22C55E', label: 'Improving' },
  stagnant:  { icon: '→', color: '#F59E0B', label: 'Stagnant' },
  declining: { icon: '↓', color: '#EF4444', label: 'Declining' },
  new:       { icon: '•', color: '#9CA3AF', label: 'New' },
};

const SIZES = {
  small:  { badge: 40, font: 14, ring: 36, stroke: 3 },
  medium: { badge: 64, font: 22, ring: 56, stroke: 4 },
  large:  { badge: 96, font: 36, ring: 88, stroke: 5 },
};

export default function GradientBadge({ gradient, size = 'medium' }) {
  if (!gradient) return null;

  const level = gradient.current?.slice(0, 2) || 'A1';
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.A1;
  const trend = TREND_ICONS[gradient.trend] || TREND_ICONS.new;
  const s = SIZES[size] || SIZES.medium;

  const pct = gradient.progress_percent || 0;
  const circumference = 2 * Math.PI * (s.ring / 2 - s.stroke);
  const dashoffset = circumference - (pct / 100) * circumference;

  if (gradient.is_complete) {
    return (
      <div style={{
        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4
      }}>
        <div style={{
          width: s.badge + 20, height: s.badge + 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,215,0,0.4)'
        }}>
          <span style={{ fontSize: s.font + 8 }}>🏆</span>
        </div>
        <span style={{ fontSize: s.font * 0.6, fontWeight: 800, color: '#D97706' }}>C1.5</span>
        <span style={{ fontSize: s.font * 0.4, color: '#22C55E', fontWeight: 700 }}>COMPLETE</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4
    }}>
      {/* Progress ring with level inside */}
      <div style={{ position: 'relative', width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={s.ring / 2} cy={s.ring / 2} r={s.ring / 2 - s.stroke}
            fill="none" stroke="#E5E7EB" strokeWidth={s.stroke}
          />
          {/* Progress ring */}
          <circle
            cx={s.ring / 2} cy={s.ring / 2} r={s.ring / 2 - s.stroke}
            fill="none" stroke={colors.ring} strokeWidth={s.stroke}
            strokeDasharray={circumference} strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        {/* Level text centered */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{
            fontSize: s.font, fontWeight: 800, color: colors.text
          }}>
            {gradient.current}
          </span>
        </div>
      </div>

      {/* Trend arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: s.font * 0.7, color: trend.color, fontWeight: 800 }}>
          {trend.icon}
        </span>
        <span style={{ fontSize: s.font * 0.45, color: trend.color, fontWeight: 600 }}>
          {trend.label}
        </span>
      </div>
    </div>
  );
}
