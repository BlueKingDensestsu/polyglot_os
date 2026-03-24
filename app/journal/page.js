'use client';

import { useState, useEffect, useCallback } from 'react';
import HeatmapCalendar from '@/components/HeatmapCalendar';

/**
 * /journal — Learning Journal
 * 
 * Single source of truth for ALL language learning activity.
 * Auto-logged sessions from grammar/palace + manual entries for
 * italki, Netflix, reading, podcasts, conversations, etc.
 * 
 * Features:
 * - GitHub-style heatmap calendar
 * - Streak counter
 * - Timeline with category filters
 * - Manual entry form
 * - Weekly summary cards
 * - Input/Output/Immersion balance indicator
 */

const SUBCATEGORIES = {
  input: [
    { value: 'reading', label: '📖 Reading', desc: 'Lute, books, articles' },
    { value: 'listening', label: '🎧 Listening', desc: 'Podcasts, Easy German' },
    { value: 'shadowing', label: '🗣 Shadowing', desc: 'Repeat after audio' },
    { value: 'textbook', label: '📚 Textbook', desc: 'Grammar book study' },
  ],
  output: [
    { value: 'grammar', label: '📝 Grammar', desc: 'Grammar trainer exercises' },
    { value: 'palace', label: '🏛 Palace', desc: 'Mental palace review' },
    { value: 'writing', label: '✍️ Writing', desc: 'Essays, letters, free writing' },
    { value: 'speaking', label: '💬 Speaking', desc: 'Conversation, presentation' },
    { value: 'italki', label: '👤 italki', desc: 'Tutor session' },
    { value: 'conversation', label: '🗨 Conversation', desc: 'Native speaker practice' },
  ],
  immersion: [
    { value: 'netflix', label: '🎬 Netflix/TV', desc: 'Shows, movies' },
    { value: 'youtube', label: '📺 YouTube', desc: 'Videos in target language' },
    { value: 'music', label: '🎵 Music', desc: 'Songs in target language' },
    { value: 'podcast', label: '🎙 Podcast', desc: 'Background listening' },
    { value: 'social', label: '📱 Social Media', desc: 'Scrolling in target language' },
    { value: 'gaming', label: '🎮 Gaming', desc: 'Games in target language' },
  ],
};

const CATEGORY_COLORS = {
  input:     { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD', label: '📥 Input' },
  output:    { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D', label: '📤 Output' },
  immersion: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC', label: '🌊 Immersion' },
};

const CATEGORY_ICON = {
  grammar: '📝', palace: '🏛', reading: '📖', listening: '🎧', shadowing: '🗣',
  writing: '✍️', speaking: '💬', italki: '👤', conversation: '🗨', netflix: '🎬',
  youtube: '📺', music: '🎵', podcast: '🎙', social: '📱', gaming: '🎮',
  textbook: '📚', assessment: '📋', level_test: '🎯', other: '📌', background: '🏁',
};

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [streak, setStreak] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: null, subcategory: null });
  const [showForm, setShowForm] = useState(false);
  const [languages, setLanguages] = useState([]);

  // Form state
  const [form, setForm] = useState({
    lang: 'de',
    entry_date: new Date().toISOString().split('T')[0],
    category: 'output',
    subcategory: '',
    duration_minutes: 30,
    title: '',
    notes: '',
    errors_noted: '',
    words_learned: '',
  });

  const langCode = 'de'; // hardcoded until Layer 14

  const loadData = useCallback(async () => {
    try {
      let entryUrl = `/api/journal?lang=${langCode}&limit=50`;
      if (filter.category) entryUrl += `&category=${filter.category}`;
      if (filter.subcategory) entryUrl += `&subcategory=${filter.subcategory}`;

      const [entriesRes, heatmapRes, streakRes, summaryRes, langsRes] = await Promise.all([
        fetch(entryUrl),
        fetch(`/api/journal?lang=${langCode}&view=heatmap&days=365`),
        fetch(`/api/journal?lang=${langCode}&view=streak`),
        fetch(`/api/journal?lang=${langCode}&view=summary&weeks=4`),
        fetch('/api/languages'),
      ]);

      setEntries(await entriesRes.json());
      setHeatmapData(await heatmapRes.json());
      setStreak(await streakRes.json());
      setSummaries(await summaryRes.json());
      setLanguages(await langsRes.json());
    } catch (e) {
      console.error('Failed to load journal:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async () => {
    if (!form.subcategory) return alert('Pick an activity type');
    if (form.duration_minutes <= 0) return alert('Duration must be > 0');

    await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setShowForm(false);
    setForm(f => ({ ...f, title: '', notes: '', errors_noted: '', words_learned: '', duration_minutes: 30 }));
    loadData();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: 18, color: '#888' }}>Loading journal...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
            📓 Learning Journal
          </h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            Every minute of learning — in one place.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: showForm ? '#EF4444' : '#2E86AB', color: 'white',
            fontWeight: 700, fontSize: 14, transition: 'all 0.15s'
          }}
        >
          {showForm ? '✕ Cancel' : '+ Log Activity'}
        </button>
      </div>

      {/* Stats row */}
      {streak && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap'
        }}>
          {[
            { label: 'Current Streak', value: `${streak.current_streak} days`, color: streak.current_streak > 0 ? '#22C55E' : '#999' },
            { label: 'Longest Streak', value: `${streak.longest_streak} days`, color: '#2E86AB' },
            { label: 'Total Hours', value: `${streak.total_hours}h`, color: '#8B5CF6' },
            { label: 'Active Days', value: streak.active_days, color: '#F59E0B' },
            { label: 'Total Entries', value: streak.total_entries, color: '#888' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '14px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: '1 1 150px', textAlign: 'center'
            }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: stat.color, margin: '0 0 2px' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 12px' }}>
          Activity Heatmap
        </h3>
        <HeatmapCalendar data={heatmapData} days={365} />
      </div>

      {/* Weekly Summaries */}
      {summaries.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 4
        }}>
          {summaries.map((week, i) => {
            const total = Number(week.total_minutes || 0);
            const inp = Number(week.input_minutes || 0);
            const out = Number(week.output_minutes || 0);
            const imm = Number(week.immersion_minutes || 0);
            return (
              <div key={i} style={{
                background: 'white', borderRadius: 14, padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: 200, flexShrink: 0
              }}>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>
                  Week of {new Date(week.week_start).toLocaleDateString()}
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
                  {(total / 60).toFixed(1)}h
                </p>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>
                  {week.active_days} active days · {week.total_entries} entries
                </p>
                {/* Input/Output/Immersion bar */}
                {total > 0 && (
                  <div style={{ height: 6, borderRadius: 3, display: 'flex', overflow: 'hidden', background: '#f0f0f0' }}>
                    <div style={{ height: '100%', width: `${(inp/total)*100}%`, background: '#3B82F6' }} title={`Input: ${Math.round(inp)}min`} />
                    <div style={{ height: '100%', width: `${(out/total)*100}%`, background: '#F59E0B' }} title={`Output: ${Math.round(out)}min`} />
                    <div style={{ height: '100%', width: `${(imm/total)*100}%`, background: '#22C55E' }} title={`Immersion: ${Math.round(imm)}min`} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: '#aaa' }}>
                  <span style={{ color: '#3B82F6' }}>● In {Math.round(inp)}m</span>
                  <span style={{ color: '#F59E0B' }}>● Out {Math.round(out)}m</span>
                  <span style={{ color: '#22C55E' }}>● Imm {Math.round(imm)}m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 24,
          border: '2px solid #2E86AB'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px' }}>
            Log Learning Activity
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Date */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={form.entry_date}
                onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Duration */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Language */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Language</label>
              <select
                value={form.lang}
                onChange={e => setForm(f => ({ ...f, lang: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, fontFamily: 'inherit', background: 'white'
                }}
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(CATEGORY_COLORS).map(([cat, style]) => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat, subcategory: '' }))}
                  style={{
                    padding: '8px 20px', borderRadius: 10, border: `2px solid ${form.category === cat ? style.border : '#eee'}`,
                    background: form.category === cat ? style.bg : 'white',
                    color: form.category === cat ? style.text : '#888',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory grid */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>Activity</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(SUBCATEGORIES[form.category] || []).map(sub => (
                <button
                  key={sub.value}
                  onClick={() => setForm(f => ({ ...f, subcategory: sub.value, title: sub.label.replace(/^[^\s]+ /, '') }))}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: form.subcategory === sub.value ? '2px solid #2E86AB' : '1px solid #eee',
                    background: form.subcategory === sub.value ? '#E3F2FD' : 'white',
                    color: form.subcategory === sub.value ? '#2E86AB' : '#555',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What did you work on? What did you learn? Any observations?"
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd',
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical'
              }}
            />
          </div>

          {/* Errors + Words row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Errors Noted</label>
              <input
                type="text"
                value={form.errors_noted}
                onChange={e => setForm(f => ({ ...f, errors_noted: e.target.value }))}
                placeholder="wurde/würde confusion, dative prepositions..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, fontFamily: 'inherit'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>New Words Learned</label>
              <input
                type="text"
                value={form.words_learned}
                onChange={e => setForm(f => ({ ...f, words_learned: e.target.value }))}
                placeholder="allerdings, dennoch, infolgedessen..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                  fontSize: 14, fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#2E86AB', color: 'white', fontWeight: 700, fontSize: 15,
              transition: 'all 0.15s'
            }}
          >
            Save Entry
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter({ category: null, subcategory: null })}
          style={{
            padding: '6px 16px', borderRadius: 8, border: !filter.category ? '2px solid #2E86AB' : '1px solid #ddd',
            background: !filter.category ? '#E3F2FD' : 'white',
            color: !filter.category ? '#2E86AB' : '#888',
            fontWeight: 600, fontSize: 13, cursor: 'pointer'
          }}
        >
          All
        </button>
        {Object.entries(CATEGORY_COLORS).map(([cat, style]) => (
          <button
            key={cat}
            onClick={() => setFilter({ category: cat, subcategory: null })}
            style={{
              padding: '6px 16px', borderRadius: 8,
              border: filter.category === cat ? `2px solid ${style.border}` : '1px solid #ddd',
              background: filter.category === cat ? style.bg : 'white',
              color: filter.category === cat ? style.text : '#888',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <p style={{ fontSize: 18 }}>No journal entries yet.</p>
          <p style={{ fontSize: 14 }}>Click "Log Activity" to add your first entry, or do some grammar exercises — they'll appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(entry => {
            const catStyle = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.output;
            const icon = CATEGORY_ICON[entry.subcategory] || CATEGORY_ICON[entry.category] || '📌';
            const isAuto = entry.source === 'app';

            return (
              <div key={entry.id} style={{
                background: 'white', borderRadius: 12, padding: '14px 20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                borderLeft: `4px solid ${catStyle.border}`,
                display: 'flex', gap: 16, alignItems: 'flex-start'
              }}>
                {/* Icon */}
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{icon}</span>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                        {entry.title || entry.subcategory || entry.category}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: catStyle.bg, color: catStyle.text
                      }}>
                        {entry.category}
                      </span>
                      {isAuto && (
                        <span style={{ fontSize: 10, color: '#bbb' }}>auto</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#2E86AB' }}>
                        {Number(entry.duration_minutes || 0).toFixed(0)}m
                      </span>
                      <span style={{ fontSize: 12, color: '#aaa' }}>
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {entry.notes && (
                    <p style={{ fontSize: 13, color: '#666', margin: '6px 0 0', lineHeight: 1.5 }}>
                      {entry.notes}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    {entry.errors_noted && (
                      <span style={{ fontSize: 11, color: '#E07A5F' }}>
                        ⚠️ {entry.errors_noted}
                      </span>
                    )}
                    {entry.words_learned && (
                      <span style={{ fontSize: 11, color: '#22C55E' }}>
                        📚 {entry.words_learned}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
