'use client';

const RULES = [
  { num: 1, title: 'Do not learn what you do not understand', summary: 'Understanding comes first. Memorization comes second.', app: 'Grammar rule explanations appear before exercises. Palace words require example sentences.' },
  { num: 2, title: 'Learn before you memorize', summary: 'Build the big picture first, then drill details.', app: 'Input-First Sprint Opening: no memorization for the first 1-2 weeks of a new language.' },
  { num: 3, title: 'Build upon the basics', summary: 'Start simple. Don\'t skip the fundamentals.', app: 'Vocabulary loads frequency-sorted. Grammar starts with the most fundamental structures.' },
  { num: 4, title: 'Minimum information principle', summary: 'Each card tests ONE thing. Split complex items.', app: 'Palace Drill Mode tests meaning, gender, cloze, reverse, and production separately.' },
  { num: 5, title: 'Cloze deletion is effective', summary: 'Fill-the-blank in context sentences works.', app: 'Cloze is one of the 5 drill types in Palace Drill Mode.' },
  { num: 6, title: 'Use imagery', summary: 'Pictures are retained far better than text.', app: 'Palace cards include images. Google Images in target language for new words.' },
  { num: 7, title: 'Use mnemonic techniques', summary: 'The mental palace IS the most powerful mnemonic.', app: 'The entire palace system is built on the method of loci.' },
  { num: 8, title: 'Graphic deletion works too', summary: 'Remove part of an image and identify it.', app: 'Future: kanji recognition, Arabic letter position drills.' },
  { num: 9, title: 'Avoid sets', summary: 'Never ask "list all dative prepositions."', app: 'Every exercise targets one structure in one sentence.' },
  { num: 10, title: 'Avoid enumerations', summary: 'If you must learn sequences, use overlapping cloze.', app: 'Grammar chapters are sequential but each exercise is independent.' },
  { num: 11, title: 'Combat interference', summary: 'Detect when you confuse similar items and drill the difference.', app: 'Interference Detection Engine flags pairs like wurde/würde and generates discrimination drills.' },
  { num: 12, title: 'Optimize wording', summary: 'Shorter prompts = faster retrieval = better retention.', app: 'Exercise prompts are concise. Export formats strip unnecessary context.' },
  { num: 13, title: 'Personalize and provide examples', summary: 'Link every word to YOUR life and memories.', app: 'Palace landmarks are real places from your commute. Personal notes on vocabulary.' },
  { num: 14, title: 'Rely on emotional states', summary: 'Vivid, absurd, funny associations stick 25x better.', app: 'Palace encourages bizarre mental images at each landmark.' },
  { num: 15, title: 'Context cues simplify recall', summary: 'Different visual contexts activate different neural pathways.', app: 'Per-language, per-module visual themes. Each module looks distinct.' },
  { num: 16, title: 'Redundancy is OK', summary: 'Multiple cards testing the same word from different angles helps.', app: 'Palace Drill Mode: 3-5 prompts per word, each a different angle.' },
  { num: 17, title: 'Provide sources', summary: 'Know where your knowledge came from.', app: 'Vocabulary tracks source: Anki, Lute, Language Reactor, manual.' },
  { num: 18, title: 'Date stamp your knowledge', summary: 'Track when you learned things.', app: 'Every entry has timestamps. Gradient level system tracks progression.' },
  { num: 19, title: 'Prioritize ruthlessly', summary: 'High-frequency words first. Common structures first.', app: 'Vocabulary loads frequency-sorted. Training plan targets weakest areas.' },
  { num: 20, title: 'Keep updating old knowledge', summary: 'Your understanding deepens as you advance.', app: 'Level-up tests reassess everything. Palace review resurfaces old words.' },
];

const TOP_5 = [2, 4, 6, 11, 14];

export default function WozniakRules({ onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-extrabold text-base">📖 The 20 Rules of Formulating Knowledge</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dr. Piotr Wozniak · Adapted for Polyglot OS</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
        {RULES.map(rule => {
          const isTop5 = TOP_5.includes(rule.num);
          return (
            <div key={rule.num} className={'py-3 border-b border-gray-50 ' + (isTop5 ? 'bg-amber-50/50 -mx-5 px-5 rounded-lg' : '')}>
              <div className="flex items-start gap-3">
                <span className={'font-mono text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ' + 
                  (isTop5 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500')}>
                  {rule.num}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-sm">{rule.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{rule.summary}</div>
                  <div className="text-[11px] text-teal-600 mt-1 font-semibold">🔧 {rule.app}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-[11px] text-gray-400">
          ⭐ Highlighted rules are the 5 most critical for language learning: Learn before memorize, Minimum information, 
          Use imagery, Combat interference, Rely on emotion.
        </p>
      </div>
    </div>
  );
}
