#!/usr/bin/env node
/**
 * scripts/seed-languages.js — Populates the 10-language portfolio
 * Run: npm run db:seed
 */

const { getDb, saveDb, queryAll, queryOne, run, transaction, closeDb } = require('../lib/db');

const languages = [
  { code:'de', name:'German', name_native:'Deutsch', flag:'🇩🇪', color:'#FFD700', script:'latin',
    palace_route:'Nettelnburg station commute — 52 landmarks, 1km walking route',
    palace_landmark_count:52, status:'active', sprint_order:1, assessed_level:'B1.3', current_phase:'integration',
    background_notes:'B1 certified. Living in Hamburg. 4,214-word mental palace (52 landmarks). Grammar trainer complete: 27 chapters, 1,350 exercises, 9,155 prompts. Passive voice = biggest weakness. Reading: Quality Land + Die Welt von Gestern. Targeting Goethe C1 June 2026.' },
  { code:'es', name:'Spanish', name_native:'Español', flag:'🇪🇸', color:'#E74C3C', script:'latin',
    palace_route:'Zara stockroom — 50 landmarks',
    palace_landmark_count:50, status:'locked', sprint_order:2, assessed_level:'B2.1', current_phase:'reactivation',
    background_notes:'Dormant fluency from 2017. Reactivation sprint. Grammar trainer: 34 chapters, 25 ex/ch. 5,000-word palace planned. Big Red Book of Spanish Idioms for C1.' },
  { code:'el', name:'Greek', name_native:'Ελληνικά', flag:'🇬🇷', color:'#2980B9', script:'greek',
    palace_route:'Nice/Vauban route — 37 landmarks',
    palace_landmark_count:37, status:'locked', sprint_order:3, assessed_level:'A2.2', current_phase:'foundation',
    background_notes:'A2. 200+ hours on Greek deck (2,920 words). 37 landmarks on Nice/Vauban route. Grammar: Books 1a+1b complete (4,026 items), Book 2a partial. Talked with locals Santorini 2020.' },
  { code:'ru', name:'Russian', name_native:'Русский', flag:'🇷🇺', color:'#C0392B', script:'cyrillic',
    palace_route:'University CIV complex — ~40 landmarks (awaiting real list)',
    palace_landmark_count:40, status:'locked', sprint_order:4, assessed_level:'A1.4', current_phase:'foundation',
    background_notes:'Grammar studied extensively (Penguin Russian Course). Near-zero vocabulary. THIS TAUGHT ME VOCABULARY IS KING. Grammar trainer: 30 chapters, 1,500 exercises, 7,051 prompts. Palace blocked until landmark list provided.' },
  { code:'ko', name:'Korean', name_native:'한국어', flag:'🇰🇷', color:'#8E44AD', script:'hangul',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:5, assessed_level:'A1.2', current_phase:'script',
    background_notes:'Hangul reading mastered via Talk To Me In Korean (2018-2019). Skips script phase entirely.' },
  { code:'pt', name:'Portuguese', name_native:'Português', flag:'🇵🇹', color:'#27AE60', script:'latin',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:6, assessed_level:'A2.3', current_phase:'reactivation',
    background_notes:'A2-B1 from Lisbon 2022 conversational experience. European Portuguese target. Romance cascade from French + Spanish.' },
  { code:'ja', name:'Japanese', name_native:'日本語', flag:'🇯🇵', color:'#E91E63', script:'kanji',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:7, assessed_level:'A1.5', current_phase:'foundation',
    background_notes:'900 kanji via Heisig RTK (2024 intensive month). Meanings known, readings NOT. Anime listening = subconscious patterns. Saves ~300h vs cold start.' },
  { code:'it', name:'Italian', name_native:'Italiano', flag:'🇮🇹', color:'#F39C12', script:'latin',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:8, assessed_level:'A2.4', current_phase:'reactivation',
    background_notes:'A2-B1 via Romance cascade (French L1 89% + Spanish 82%). Fastest sprint expected. ~3-4 months to B1, ~150 hours.' },
  { code:'ar', name:'Arabic', name_native:'العربية', flag:'🇸🇦', color:'#1ABC9C', script:'arabic',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:9, assessed_level:'A0.5', current_phase:'script',
    background_notes:'Family phonetic exposure (brother is Arabic). Some alphabet work. Familiar with sounds — significant advantage.' },
  { code:'zh', name:'Mandarin', name_native:'中文', flag:'🇨🇳', color:'#D4380D', script:'kanji',
    palace_route:'TBD', palace_landmark_count:0, status:'locked', sprint_order:10, assessed_level:'A0.3', current_phase:'script',
    background_notes:'Kanji transfer from Japanese (900 chars). Watched Mandarin anime. Tones = main challenge. Kanji provides reading shortcut.' }
];

const greekLandmarks = [
  'Living room','Bathroom','Hallway mirror','Basement','Building entrance',
  'Stairs (Camille)','Caisse d\'Epargne','Boulangerie','Carrefour Express',
  'Tram road','Big Poste','Tram stop 1','Tram stop 2','Tram stop 3',
  'Donut shop','Laundry','Monoprix','Beach entrance','Castle view',
  'O\'Tacos','Vauban court 1','Vauban court 2','Vauban court 3',
  'Student library ground','Student library L2','Student library L3',
  'Résidence étudiante entrance','Résidence étudiante courtyard',
  'Monop (workplace)','Garage door','Photo corner','Ex\'s building entrance',
  'Ex\'s house door','Landmark 34','Landmark 35','Landmark 36','Landmark 37'
];

async function main() {
  console.log('🌍 Seeding 10 languages...\n');
  const db = await getDb();

  transaction(db, () => {
    for (const lang of languages) {
      db.run(
        `INSERT OR IGNORE INTO languages 
          (code,name,name_native,flag,color,script,palace_route,palace_landmark_count,
           status,sprint_order,assessed_level,current_phase,background_notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [lang.code, lang.name, lang.name_native, lang.flag, lang.color, lang.script,
         lang.palace_route, lang.palace_landmark_count, lang.status, lang.sprint_order,
         lang.assessed_level, lang.current_phase, lang.background_notes]
      );
    }
  });

  // Seed German landmarks (52 placeholders)
  const de = queryOne(db, 'SELECT id FROM languages WHERE code = ?', ['de']);
  const deLandmarks = queryOne(db, 'SELECT COUNT(*) as c FROM landmarks WHERE language_id = ?', [de.id]);
  if (de && deLandmarks.c === 0) {
    console.log('   📍 Seeding German landmark placeholders (52)...');
    transaction(db, () => {
      for (let i = 1; i <= 52; i++) {
        db.run('INSERT INTO landmarks (language_id, position, name) VALUES (?,?,?)',
          [de.id, i, `Landmark ${i} (update with real name)`]);
      }
    });
  }

  // Seed Greek landmarks (37 Nice/Vauban route)
  const el = queryOne(db, 'SELECT id FROM languages WHERE code = ?', ['el']);
  const elLandmarks = queryOne(db, 'SELECT COUNT(*) as c FROM landmarks WHERE language_id = ?', [el.id]);
  if (el && elLandmarks.c === 0) {
    console.log('   📍 Seeding Greek landmarks (37 Nice/Vauban)...');
    transaction(db, () => {
      greekLandmarks.forEach((name, i) => {
        db.run('INSERT INTO landmarks (language_id, position, name) VALUES (?,?,?)',
          [el.id, i + 1, name]);
      });
    });
  }

  saveDb();

  // Verify
  const count = queryOne(db, 'SELECT COUNT(*) as c FROM languages');
  const lmCount = queryOne(db, 'SELECT COUNT(*) as c FROM landmarks');
  console.log(`\n✅ Languages: ${count.c}`);
  console.log(`✅ Landmarks: ${lmCount.c}`);

  const allLangs = queryAll(db, 'SELECT flag,name,code,status,assessed_level,sprint_order FROM languages ORDER BY sprint_order');
  allLangs.forEach(l => console.log(`   ${l.flag} ${l.name} (${l.code}) — ${l.status} — ${l.assessed_level} — Sprint #${l.sprint_order}`));

  closeDb();
  console.log('\n🎉 Seeding complete! Next: npm run db:import-exercises');
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); });
