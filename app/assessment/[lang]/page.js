'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

/**
 * /assessment/de — Initial Assessment or Level-Up Test
 * 
 * 30-minute initial test with 4 timed sections:
 *   1. Vocabulary (5 min) — 50 words → type translations
 *   2. Grammar (10 min) — 20 sentences → translate to target language
 *   3. Reading (5 min) — 3 texts with comprehension questions
 *   4. Writing (10 min) — free writing prompt
 * 
 * Timer counts down per section. Auto-advances when time runs out.
 * At the end: export .txt for Claude, import correction JSON.
 */

const SECTIONS = [
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    icon: '📚',
    time_minutes: 5,
    instructions: 'Type the translation for each word. Work quickly — guess if unsure.',
  },
  {
    id: 'grammar',
    title: 'Grammar',
    icon: '📝',
    time_minutes: 10,
    instructions: 'Translate each sentence into the target language. Use complete sentences with correct grammar.',
  },
  {
    id: 'reading',
    title: 'Reading Comprehension',
    icon: '📖',
    time_minutes: 5,
    instructions: 'Read each text carefully and answer the questions in the target language.',
  },
  {
    id: 'writing',
    title: 'Free Writing',
    icon: '✍️',
    time_minutes: 10,
    instructions: 'Write a response to the prompt in the target language. Show your best grammar, vocabulary, and expression.',
  },
];

// Sample test content — German initial assessment
// In production, this would be generated per-language and per-level
const GERMAN_TEST = {
  vocabulary: [
    'the time', 'always', 'therefore', 'the example', 'to make',
    'where', 'actually', 'for the first time', 'long', 'every',
    'to believe', 'the government', 'to run', 'the way', 'the knowledge',
    'against', 'suddenly', 'the success', 'to reach', 'the relationship',
    'the development', 'nevertheless', 'to prove', 'the responsibility', 'to consider',
    'the influence', 'obviously', 'to determine', 'the event', 'to demand',
    'the consequence', 'accordingly', 'to implement', 'the investigation', 'to establish',
    'the significance', 'in this regard', 'to contribute', 'the criticism', 'to justify',
    'the requirement', 'with reference to', 'to point out', 'the circumstance', 'to evaluate',
    'the perspective', 'in light of', 'to emphasize', 'the framework', 'to differentiate',
  ],
  grammar: [
    'The book was read by the student.',
    'If I had more time, I would travel to Japan.',
    'He said he has no time today.',
    'The house that was built last year is already sold.',
    'Despite the rain, we went for a walk.',
    'She must have forgotten about the meeting.',
    'The more I study, the better I understand.',
    'It is important that everyone participates.',
    'The letter should be written by Friday.',
    'Having finished the work, she went home.',
    'Not only did he come late, but he also forgot the documents.',
    'The results were presented at the conference.',
    'Were I the boss, I would change the policy.',
    'The problem is too complex to solve quickly.',
    'By the time we arrived, the store had already closed.',
    'The children are not allowed to play outside today.',
    'She pretends as if she knew everything.',
    'The application needs to be submitted immediately.',
    'Regarding your request, we would like to inform you that...',
    'It must be pointed out that the data is not reliable.',
  ],
  reading: [
    {
      title: 'Die Digitalisierung der Arbeitswelt',
      text: 'Die zunehmende Digitalisierung verändert die Arbeitswelt grundlegend. Viele traditionelle Berufe verschwinden, während neue entstehen. Experten betonen, dass lebenslanges Lernen immer wichtiger wird. Gleichzeitig warnen Kritiker vor wachsender Ungleichheit, da nicht alle Menschen gleichen Zugang zu digitaler Bildung haben. Die Bundesregierung hat ein Förderprogramm aufgelegt, das Arbeitnehmer bei der Weiterbildung unterstützen soll.',
      question: 'Was sind laut dem Text die Vor- und Nachteile der Digitalisierung?',
    },
    {
      title: 'Umweltschutz im Alltag',
      text: 'Immer mehr Deutsche achten im Alltag auf Nachhaltigkeit. Der Trend zum regionalen Einkaufen wächst stetig. Unverpackt-Läden verzeichnen steigende Kundenzahlen. Allerdings zeigen Studien, dass der ökologische Fußabdruck Deutschlands insgesamt kaum gesunken ist. Der Grund: Während die privaten Haushalte sparen, steigt der industrielle Verbrauch weiter.',
      question: 'Warum sinkt der ökologische Fußabdruck trotz privater Bemühungen nicht?',
    },
    {
      title: 'Sprachenlernen und Gehirnforschung',
      text: 'Neurowissenschaftler haben herausgefunden, dass das Lernen einer Fremdsprache die kognitive Flexibilität steigert. Mehrsprachige Menschen können besser zwischen Aufgaben wechseln und zeigen eine höhere Konzentrationsfähigkeit. Besonders effektiv ist es, wenn der Lernende die neue Sprache aktiv verwendet — etwa durch Gespräche oder Schreiben — anstatt nur passiv zuzuhören.',
      question: 'Welche Methode des Sprachenlernens ist laut der Forschung besonders effektiv und warum?',
    },
  ],
  writing: {
    prompt: 'Schreiben Sie einen formellen Brief an Ihren Arbeitgeber, in dem Sie um eine Weiterbildung im Bereich Datenanalyse bitten. Begründen Sie, warum diese Weiterbildung für Ihre Arbeit und das Unternehmen von Vorteil wäre. Verwenden Sie eine formelle Anrede und Grußformel. (Mindestens 150 Wörter)',
  },
};

export default function AssessmentPage() {
  const params = useParams();
  const lang = params.lang;

  const [phase, setPhase] = useState('intro');  // intro, testing, section_break, review, export, done
  const [currentSection, setCurrentSection] = useState(0);
  const [assessmentId, setAssessmentId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({
    vocabulary: { answers: [], time_limit: 5 },
    grammar: { answers: [], time_limit: 10 },
    reading: { answers: [], time_limit: 5 },
    writing: { answer: '', prompt: GERMAN_TEST.writing.prompt, time_limit: 10 },
  });
  const [exportText, setExportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [gateInfo, setGateInfo] = useState(null);

  const timerRef = useRef(null);

  // Load gate info
  useEffect(() => {
    fetch(`/api/assessment?lang=${lang}`)
      .then(r => r.json())
      .then(data => setGateInfo(data))
      .catch(() => {});
  }, [lang]);

  // Initialize answer arrays
  useEffect(() => {
    setAnswers(prev => ({
      ...prev,
      vocabulary: {
        ...prev.vocabulary,
        answers: GERMAN_TEST.vocabulary.map(word => ({ word, answer: '' })),
      },
      grammar: {
        ...prev.grammar,
        answers: GERMAN_TEST.grammar.map(prompt => ({ prompt, answer: '' })),
      },
      reading: {
        ...prev.reading,
        answers: GERMAN_TEST.reading.map(r => ({
          text_title: r.title,
          question: r.question,
          answer: '',
        })),
      },
    }));
  }, []);

  // Section timer
  useEffect(() => {
    if (phase !== 'testing') return;
    const timeLimit = SECTIONS[currentSection].time_minutes * 60;
    setSectionTimeLeft(timeLimit);

    timerRef.current = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-advance
          if (currentSection < SECTIONS.length - 1) {
            setPhase('section_break');
          } else {
            setPhase('review');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, currentSection]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = sectionTimeLeft < 60 ? '#EF4444' : sectionTimeLeft < 180 ? '#F59E0B' : '#2E86AB';

  // Start assessment
  const handleStart = async () => {
    const type = gateInfo?.gate?.has_initial ? 'level_up' : 'initial';
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', lang, type }),
    });
    const data = await res.json();
    setAssessmentId(data.assessment_id);
    setStartTime(Date.now());
    setPhase('testing');
  };

  // Next section
  const handleNextSection = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(prev => prev + 1);
      setPhase('testing');
    } else {
      setPhase('review');
    }
  };

  // Skip to next section early
  const handleSkipSection = () => {
    clearInterval(timerRef.current);
    if (currentSection < SECTIONS.length - 1) {
      setPhase('section_break');
    } else {
      setPhase('review');
    }
  };

  // Submit + export
  const handleExport = async () => {
    const duration = Math.round((Date.now() - startTime) / 60000);

    // Save answers
    await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', assessment_id: assessmentId, duration_minutes: duration, sections: answers }),
    });

    // Get export text
    const res = await fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'export', assessment_id: assessmentId }),
    });
    const data = await res.json();
    setExportText(data.export_text);
    setPhase('export');
  };

  // Import correction
  const handleImport = async () => {
    try {
      const correction = JSON.parse(importJson);
      correction.assessment_id = assessmentId;
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', correction }),
      });
      const result = await res.json();
      setImportResult(result);
      setPhase('done');
    } catch (e) {
      setImportResult({ error: 'Invalid JSON: ' + e.message });
    }
  };

  // Update answer helper
  const updateVocabAnswer = (idx, value) => {
    setAnswers(prev => {
      const newAnswers = [...prev.vocabulary.answers];
      newAnswers[idx] = { ...newAnswers[idx], answer: value };
      return { ...prev, vocabulary: { ...prev.vocabulary, answers: newAnswers } };
    });
  };

  const updateGrammarAnswer = (idx, value) => {
    setAnswers(prev => {
      const newAnswers = [...prev.grammar.answers];
      newAnswers[idx] = { ...newAnswers[idx], answer: value };
      return { ...prev, grammar: { ...prev.grammar, answers: newAnswers } };
    });
  };

  const updateReadingAnswer = (idx, value) => {
    setAnswers(prev => {
      const newAnswers = [...prev.reading.answers];
      newAnswers[idx] = { ...newAnswers[idx], answer: value };
      return { ...prev, reading: { ...prev.reading, answers: newAnswers } };
    });
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  // ─── INTRO ───
  if (phase === 'intro') {
    const gate = gateInfo?.gate;
    const isInitial = !gate?.has_initial;
    const canTest = gate?.test_unlocked;

    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <a href="/" style={{ fontSize: 13, color: '#2E86AB', textDecoration: 'none' }}>← Back to dashboard</a>

        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2E86AB 100%)',
          borderRadius: 20, padding: '40px 36px', color: 'white', marginTop: 16, marginBottom: 24
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
            {isInitial ? '📋 Initial Assessment' : '🎯 Level-Up Test'}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.8, margin: '0 0 20px' }}>
            {isInitial
              ? 'This test determines your starting level. It takes about 30 minutes.'
              : 'Prove your progress. This test takes about 30 minutes.'}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
            {SECTIONS.map(s => (
              <div key={s.id} style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px'
              }}>
                <span>{s.icon} {s.title}</span>
                <span style={{ opacity: 0.6, marginLeft: 8 }}>{s.time_minutes} min</span>
              </div>
            ))}
          </div>
        </div>

        {/* 50-hour gate */}
        {!isInitial && !canTest && (
          <div style={{
            background: '#FEF3C7', borderRadius: 14, padding: '20px 24px',
            border: '2px solid #FCD34D', marginBottom: 24
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#92400E', margin: '0 0 8px' }}>
              🔒 Test locked — {gate.hours_until_unlock}h until unlock
            </p>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0 }}>
              You need {gate.gate_hours} hours of study since your last test.
              You've logged {gate.hours_since_last_test}h so far.
              Keep studying!
            </p>
            <div style={{ height: 8, background: '#FDE68A', borderRadius: 4, marginTop: 12 }}>
              <div style={{
                height: '100%', borderRadius: 4, background: '#F59E0B',
                width: `${Math.min(100, (gate.hours_since_last_test / gate.gate_hours) * 100)}%`,
                transition: 'width 0.5s'
              }} />
            </div>
          </div>
        )}

        {(isInitial || canTest) && (
          <button
            onClick={handleStart}
            style={{
              padding: '14px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: '#2E86AB', color: 'white', fontWeight: 800, fontSize: 18,
              transition: 'all 0.15s'
            }}
          >
            {isInitial ? 'Start Assessment' : 'Start Level-Up Test'}
          </button>
        )}

        {/* Past assessments */}
        {gateInfo?.assessments?.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#333', margin: '0 0 12px' }}>Past Assessments</h3>
            {gateInfo.assessments.map(a => (
              <div key={a.id} style={{
                background: 'white', borderRadius: 10, padding: '12px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 8,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{a.type === 'initial' ? 'Initial' : 'Level-Up'}</span>
                  <span style={{ fontSize: 13, color: '#888', marginLeft: 12 }}>
                    {new Date(a.taken_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#2E86AB' }}>{a.overall_level || '—'}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>{a.duration_minutes}min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── TESTING ───
  if (phase === 'testing') {
    const section = SECTIONS[currentSection];

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 100px' }}>
        {/* Section header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10, background: '#f8f9fa',
          padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px' }}>
                Section {currentSection + 1} of {SECTIONS.length}
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
                {section.icon} {section.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 28, fontWeight: 800, fontFamily: 'monospace',
                color: timerColor, padding: '6px 16px', borderRadius: 12,
                background: timerColor === '#EF4444' ? '#FEF2F2' : '#E3F2FD'
              }}>
                {formatTimer(sectionTimeLeft)}
              </span>
              <button
                onClick={handleSkipSection}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
                  background: 'white', fontSize: 13, cursor: 'pointer', color: '#666'
                }}
              >
                Skip →
              </button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: '8px 0 0', fontStyle: 'italic' }}>
            {section.instructions}
          </p>
        </div>

        {/* Section content */}
        {section.id === 'vocabulary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {answers.vocabulary.answers.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'center',
                background: 'white', borderRadius: 10, padding: '10px 14px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <span style={{ fontSize: 12, color: '#aaa', minWidth: 24, textAlign: 'right' }}>{i + 1}.</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#333', minWidth: 120 }}>{item.word}</span>
                <input
                  type="text"
                  value={item.answer}
                  onChange={e => updateVocabAnswer(i, e.target.value)}
                  placeholder="→"
                  style={{
                    flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd',
                    fontSize: 14, fontFamily: 'inherit'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'grammar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {answers.grammar.answers.map((item, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 12, padding: '14px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#aaa', minWidth: 24 }}>{i + 1}.</span>
                  <p style={{ fontSize: 14, color: '#333', margin: 0 }}>{item.prompt}</p>
                </div>
                <input
                  type="text"
                  value={item.answer}
                  onChange={e => updateGrammarAnswer(i, e.target.value)}
                  placeholder="Type your German translation..."
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd',
                    fontSize: 14, fontFamily: 'inherit', marginLeft: 32
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'reading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {GERMAN_TEST.reading.map((item, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 14, padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 10px' }}>
                  Text {i + 1}: {item.title}
                </h3>
                <p style={{
                  fontSize: 14, color: '#444', lineHeight: 1.7, margin: '0 0 14px',
                  background: '#fafafa', padding: '14px 18px', borderRadius: 10, borderLeft: '4px solid #2E86AB'
                }}>
                  {item.text}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: '0 0 8px' }}>
                  {item.question}
                </p>
                <textarea
                  value={answers.reading.answers[i]?.answer || ''}
                  onChange={e => updateReadingAnswer(i, e.target.value)}
                  placeholder="Answer in German..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd',
                    fontSize: 14, fontFamily: 'inherit', resize: 'vertical'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'writing' && (
          <div style={{
            background: 'white', borderRadius: 14, padding: '24px 28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <p style={{
              fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 16px',
              background: '#fafafa', padding: '14px 18px', borderRadius: 10, borderLeft: '4px solid #8B5CF6'
            }}>
              {GERMAN_TEST.writing.prompt}
            </p>
            <textarea
              value={answers.writing.answer}
              onChange={e => setAnswers(prev => ({ ...prev, writing: { ...prev.writing, answer: e.target.value } }))}
              placeholder="Write your response here..."
              rows={12}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 10, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7
              }}
            />
            <p style={{ fontSize: 12, color: '#aaa', margin: '8px 0 0', textAlign: 'right' }}>
              {answers.writing.answer.split(/\s+/).filter(w => w).length} words
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── SECTION BREAK ───
  if (phase === 'section_break') {
    const nextSection = SECTIONS[currentSection + 1];
    return (
      <div style={{
        maxWidth: 600, margin: '0 auto', padding: '80px 20px', textAlign: 'center'
      }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>✅</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
          Section {currentSection + 1} Complete
        </h2>
        <p style={{ fontSize: 16, color: '#888', margin: '0 0 32px' }}>
          Next: {nextSection.icon} {nextSection.title} ({nextSection.time_minutes} min)
        </p>
        <button
          onClick={handleNextSection}
          style={{
            padding: '14px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#2E86AB', color: 'white', fontWeight: 800, fontSize: 16
          }}
        >
          Start Next Section →
        </button>
      </div>
    );
  }

  // ─── REVIEW / EXPORT ───
  if (phase === 'review') {
    const vocabAnswered = answers.vocabulary.answers.filter(a => a.answer.trim()).length;
    const grammarAnswered = answers.grammar.answers.filter(a => a.answer.trim()).length;
    const readingAnswered = answers.reading.answers.filter(a => a.answer.trim()).length;
    const writingWords = answers.writing.answer.split(/\s+/).filter(w => w).length;

    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: '0 0 24px' }}>
          📋 Test Complete — Review
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Vocabulary', count: `${vocabAnswered}/50 answered`, icon: '📚' },
            { label: 'Grammar', count: `${grammarAnswered}/20 translated`, icon: '📝' },
            { label: 'Reading', count: `${readingAnswered}/3 answered`, icon: '📖' },
            { label: 'Writing', count: `${writingWords} words`, icon: '✍️' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 12, padding: '14px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{s.icon} {s.label}</span>
              <span style={{ fontSize: 14, color: '#2E86AB', fontWeight: 700 }}>{s.count}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleExport}
          style={{
            padding: '14px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#2EC4B6', color: 'white', fontWeight: 800, fontSize: 16, width: '100%'
          }}
        >
          📋 Export for Claude Grading
        </button>
      </div>
    );
  }

  // ─── EXPORT VIEW ───
  if (phase === 'export') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px' }}>
          📋 Export for Grading
        </h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Copy this text, paste it to Claude, and ask for grading. Then paste the JSON response below.
        </p>
        <textarea
          readOnly
          value={exportText}
          style={{
            width: '100%', minHeight: 300, padding: 16, fontSize: 13, fontFamily: 'monospace',
            borderRadius: 10, border: '1px solid #ddd', background: '#fafafa', resize: 'vertical',
            marginBottom: 16
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <button
            onClick={() => navigator.clipboard.writeText(exportText)}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
              background: '#2E86AB', color: 'white', fontWeight: 700, cursor: 'pointer'
            }}
          >
            📋 Copy to Clipboard
          </button>
          <button
            onClick={() => {
              const blob = new Blob([exportText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `assessment_${lang}_${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
            }}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, border: '1px solid #ddd',
              background: 'white', fontWeight: 600, cursor: 'pointer'
            }}
          >
            💾 Download .txt
          </button>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px' }}>
          📥 Import Grading
        </h2>
        <textarea
          value={importJson}
          onChange={e => setImportJson(e.target.value)}
          placeholder='Paste Claude\'s JSON response here...'
          rows={8}
          style={{
            width: '100%', padding: 16, fontSize: 13, fontFamily: 'monospace',
            borderRadius: 10, border: '1px solid #ddd', resize: 'vertical', marginBottom: 12
          }}
        />
        {importResult?.error && (
          <p style={{ color: '#EF4444', fontSize: 14, margin: '0 0 12px' }}>❌ {importResult.error}</p>
        )}
        <button
          onClick={handleImport}
          style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: '#81B29A', color: 'white', fontWeight: 700, cursor: 'pointer'
          }}
        >
          Import & Set Level
        </button>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === 'done' && importResult && !importResult.error) {
    return (
      <div style={{
        maxWidth: 600, margin: '0 auto', padding: '80px 20px', textAlign: 'center'
      }}>
        <p style={{ fontSize: 64, margin: '0 0 16px' }}>🎉</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: '0 0 12px' }}>
          Assessment Complete
        </h1>
        <p style={{ fontSize: 48, fontWeight: 800, color: '#2E86AB', margin: '0 0 8px' }}>
          {importResult.new_level}
        </p>
        <p style={{ fontSize: 16, color: '#888', margin: '0 0 32px' }}>
          Your assessed level has been set.
        </p>

        {importResult.weaknesses && importResult.weaknesses.length > 0 && (
          <div style={{
            background: '#FEF2F2', borderRadius: 14, padding: '16px 24px',
            margin: '0 auto 24px', maxWidth: 400, textAlign: 'left'
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: '0 0 8px' }}>
              Focus Areas:
            </p>
            {importResult.weaknesses.map((w, i) => (
              <p key={i} style={{ fontSize: 14, color: '#7F1D1D', margin: '4px 0' }}>• {w}</p>
            ))}
          </div>
        )}

        <a href="/" style={{
          display: 'inline-block', padding: '14px 40px', borderRadius: 14,
          background: '#2E86AB', color: 'white', fontWeight: 700, fontSize: 16,
          textDecoration: 'none'
        }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  return null;
}
