'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GradientBadge from '@/components/GradientBadge';

/**
 * /progress/de — Gradient Progression Dashboard
 * 
 * Shows: current gradient level with ring, progression chart over time,
 * latest weakness radar scores, active training plan, and assessment history.
 */

const SKILL_LABELS = {
  vocabulary: { label: 'Vocabulary', icon: '📚', color: '#3B82F6' },
  grammar:    { label: 'Grammar',    icon: '📝', color: '#F59E0B' },
  reading:    { label: 'Reading',    icon: '📖', color: '#22C55E' },
  listening:  { label: 'Listening',  icon: '🎧', color: '#8B5CF6' },
  writing:    { label: 'Writing',    icon: '✍️', color: '#EC4899' },
  speaking:   { label: 'Speaking',   icon: '💬', color: '#EF4444' },
};

export default function ProgressPage() {
  const params = useParams();
  const lang = params.lang;

  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/gradient?lang=${lang}`).then(r => r.json()),
      fetch(`/api/gradient?lang=${lang}&view=chart`).then(r => r.json()),
      fetch(`/api/gradient?lang=${lang}&view=plan`).then(r => r.json()),
    ]).then(([gradientData, chart, planData]) => {
      setData(gradientData);
      setChartData(chart);
      setPlan(planData.plan);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lang]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading progress...</p>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <p style={{ fontSize: 18 }}>No assessment data yet.</p>
      <a href={`/assessment/${lang}`} style={{ color: '#2E86AB', fontWeight: 700, textDecoration: 'none' }}>
        Take your first assessment →
      </a>
    </div>
  );

  const { gradient, scores, assessments, training_plan } = data;

  // Build simple SVG chart for progression
  const chart = chartData?.chart || [];
  const chartWidth = 700;
  const chartHeight = 200;
  const chartPadding = 40;
  const maxIndex = (chartData?.all_levels?.length || 25) - 1;

  const points = chart.map((d, i) => {
    const x = chartPadding + (i / Math.max(chart.length - 1, 1)) * (chartWidth - 2 * chartPadding);
    const y = chartHeight - chartPadding - (d.level_index / maxIndex) * (chartHeight - 2 * chartPadding);
    return { x, y, ...d };
  });

  const pathD = points.length > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <a href="/" style={{ fontSize: 13, color: '#2E86AB', textDecoration: 'none' }}>← Dashboard</a>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '4px 0 0' }}>
            {data.language?.flag} Progression
          </h1>
        </div>
        <GradientBadge gradient={gradient} size="large" />
      </div>

      {/* Gradient Progress Bar */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>A1.1</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#2E86AB' }}>
            {gradient.current} — {gradient.progress_percent}%
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>C1.5</span>
        </div>
        <div style={{ height: 12, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6, transition: 'width 0.8s ease',
            width: `${gradient.progress_percent}%`,
            background: 'linear-gradient(90deg, #3B82F6, #22C55E, #F59E0B, #EF4444, #6366F1)',
          }} />
        </div>
        {/* Level markers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#aaa' }}>
          {['A1','A2','B1','B2','C1'].map(l => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>

      {/* Progression Chart */}
      {chart.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 16px' }}>
            📈 Gradient Progression
          </h3>
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = chartHeight - chartPadding - pct * (chartHeight - 2 * chartPadding);
              const levelIdx = Math.round(pct * maxIndex);
              const label = chartData.all_levels?.[levelIdx] || '';
              return (
                <g key={i}>
                  <line x1={chartPadding} y1={y} x2={chartWidth - chartPadding} y2={y}
                    stroke="#f0f0f0" strokeWidth={1} />
                  <text x={chartPadding - 8} y={y + 4} textAnchor="end"
                    style={{ fontSize: 10, fill: '#aaa' }}>{label}</text>
                </g>
              );
            })}

            {/* Line */}
            {pathD && (
              <path d={pathD} fill="none" stroke="#2E86AB" strokeWidth={2.5} strokeLinejoin="round" />
            )}

            {/* Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill={p.passed ? '#22C55E' : '#EF4444'} stroke="white" strokeWidth={2} />
                <text x={p.x} y={p.y - 12} textAnchor="middle" style={{ fontSize: 10, fill: '#555', fontWeight: 700 }}>
                  {p.level}
                </text>
                <text x={p.x} y={chartHeight - 8} textAnchor="middle" style={{ fontSize: 9, fill: '#aaa' }}>
                  {p.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Weakness Radar (simple bar version) */}
      {scores && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 16px' }}>
            🎯 Skill Radar (Latest Assessment)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(SKILL_LABELS).map(([key, { label, icon, color }]) => {
              const score = Number(scores[key] || 0);
              const pct = (score / 5) * 100;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                      {icon} {label}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color }}>{score.toFixed(1)} / 5</span>
                  </div>
                  <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: color,
                      width: `${pct}%`, transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Training Plan */}
      {(plan || training_plan) && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24,
          border: '2px solid #F59E0B'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#D97706', margin: '0 0 12px' }}>
            🎯 Active Training Plan
          </h3>

          {(() => {
            const p = plan || training_plan;
            const details = p.details || p;
            return (
              <div>
                {details.weaknesses && details.weaknesses.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>Focus Areas:</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {details.weaknesses.map((w, i) => (
                        <span key={i} style={{
                          padding: '4px 12px', borderRadius: 8, background: '#FEF3C7',
                          color: '#92400E', fontSize: 13, fontWeight: 600
                        }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {details.weak_chapters && details.weak_chapters.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>Weakest Chapters:</p>
                    {details.weak_chapters.map((ch, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: i < details.weak_chapters.length - 1 ? '1px solid #f5f5f5' : 'none'
                      }}>
                        <a href={`/grammar/${lang}/${ch.chapter}`} style={{
                          fontSize: 14, color: '#2E86AB', textDecoration: 'none', fontWeight: 600
                        }}>
                          Ch {ch.chapter}: {ch.title}
                        </a>
                        <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 700 }}>
                          {ch.errors} errors
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {details.daily_schedule && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#555', margin: '0 0 6px' }}>Recommended Daily Schedule:</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(details.daily_schedule).map(([key, mins]) => (
                        <span key={key} style={{
                          padding: '4px 12px', borderRadius: 8, background: '#f0f0f0',
                          color: '#555', fontSize: 13
                        }}>
                          {key}: {mins}min
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {details.input_only_weeks > 0 && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px', borderRadius: 10,
                    background: '#EFF6FF', border: '1px solid #93C5FD'
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', margin: 0 }}>
                      📥 Input-Only Phase: {details.input_only_weeks} week(s)
                    </p>
                    <p style={{ fontSize: 13, color: '#1D4ED8', margin: '4px 0 0', opacity: 0.8 }}>
                      Focus on reading and listening only. Palace and grammar modules are recommended to be paused.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Assessment History */}
      {assessments && assessments.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '20px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 16px' }}>
            📋 Assessment History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assessments.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderRadius: 10, background: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
                    background: a.type === 'initial' ? '#E3F2FD' : '#F3E8FF',
                    color: a.type === 'initial' ? '#2E86AB' : '#7C3AED'
                  }}>
                    {a.type === 'initial' ? 'Initial' : 'Level-Up'}
                  </span>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    {new Date(a.taken_at).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    at {Number(a.hours_logged_at_test || 0).toFixed(0)}h
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontSize: 18, fontWeight: 800,
                    color: a.passed ? '#22C55E' : '#EF4444'
                  }}>
                    {a.overall_level || '—'}
                  </span>
                  <span style={{ fontSize: 14 }}>
                    {a.passed ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Take test link */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <a href={`/assessment/${lang}`} style={{
          display: 'inline-block', padding: '12px 32px', borderRadius: 12,
          background: '#2E86AB', color: 'white', fontWeight: 700, fontSize: 15,
          textDecoration: 'none'
        }}>
          📋 Take a Test
        </a>
      </div>
    </div>
  );
}
