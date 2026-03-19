#!/usr/bin/env node
/**
 * scripts/seed-languages.js — Populates 10 languages + landmarks (PostgreSQL)
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WHAT CHANGED FROM SQLite:                                   ║
 * ║                                                              ║
 * ║  Placeholders: ? → $1, $2, $3...                             ║
 * ║  INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING        ║
 * ║  All queries are now async (await)                           ║
 * ║  RETURNING id to get inserted row's ID                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { pool, queryOne, queryAll, transaction, closePool } = require('../lib/db');

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

  // Insert languages (ON CONFLICT DO NOTHING = safe to re-run)
  await transaction(async (client) => {
    for (const lang of languages) {
      await client.query(`
        INSERT INTO languages
          (code,name,name_native,flag,color,script,palace_route,palace_landmark_count,
           status,sprint_order,assessed_level,current_phase,background_notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (code) DO NOTHING
      `, [lang.code, lang.name, lang.name_native, lang.flag, lang.color, lang.script,
          lang.palace_route, lang.palace_landmark_count, lang.status, lang.sprint_order,
          lang.assessed_level, lang.current_phase, lang.background_notes]);
    }
  });

  // German landmarks (52 placeholders)
  const de = await queryOne('SELECT id FROM languages WHERE code = $1', ['de']);
  const deLm = await queryOne('SELECT COUNT(*)::int as c FROM landmarks WHERE language_id = $1', [de.id]);
  if (de && deLm.c === 0) {
    console.log('   📍 Seeding German landmark placeholders (52)...');
    await transaction(async (client) => {
      for (let i = 1; i <= 52; i++) {
        await client.query(
          'INSERT INTO landmarks (language_id, position, name) VALUES ($1, $2, $3)',
          [de.id, i, `Landmark ${i} (update with real name)`]
        );
      }
    });
  }

  // Greek landmarks (37 Nice/Vauban)
  const el = await queryOne('SELECT id FROM languages WHERE code = $1', ['el']);
  const elLm = await queryOne('SELECT COUNT(*)::int as c FROM landmarks WHERE language_id = $1', [el.id]);
  if (el && elLm.c === 0) {
    console.log('   📍 Seeding Greek landmarks (37 Nice/Vauban)...');
    await transaction(async (client) => {
      for (let i = 0; i < greekLandmarks.length; i++) {
        await client.query(
          'INSERT INTO landmarks (language_id, position, name) VALUES ($1, $2, $3)',
          [el.id, i + 1, greekLandmarks[i]]
        );
      }
    });
  }

  // Verify
  const count = await queryOne('SELECT COUNT(*)::int as c FROM languages');
  const lmCount = await queryOne('SELECT COUNT(*)::int as c FROM landmarks');
  console.log(`\n✅ Languages: ${count.c}`);
  console.log(`✅ Landmarks: ${lmCount.c}`);

  const allLangs = await queryAll(
    'SELECT flag,name,code,status,assessed_level,sprint_order FROM languages ORDER BY sprint_order'
  );
  allLangs.forEach(l => console.log(`   ${l.flag} ${l.name} (${l.code}) — ${l.status} — ${l.assessed_level} — Sprint #${l.sprint_order}`));

  await closePool();
  console.log('\n🎉 Seeding complete! Next: npm run db:import-exercises');
}

main().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
