#!/usr/bin/env node
/**
 * scripts/import-vocabulary.js — Imports Anki vocabulary into PostgreSQL
 * 
 * Usage: node scripts/import-vocabulary.js <lang_code> <anki_export.txt> [media_folder]
 * 
 * Example:
 *   node scripts/import-vocabulary.js de data/german_vocab.txt public/media/de
 *   node scripts/import-vocabulary.js el data/greek_vocab.txt public/media/el
 * 
 * The Anki text export should be tab-separated with columns:
 *   Column 0: guid
 *   Column 1: deck name
 *   Column 2: deck group
 *   Column 3: word / front
 *   Column 4: translation / back (may contain HTML)
 *   Column 5: info / description (may contain Wiktionary links, gender info)
 *   Column 6: image HTML
 *   Column 7: audio reference [sound:filename.mp3]
 *   Column 8+: example sentences
 * 
 * The script:
 *   1. Parses the Anki export
 *   2. Extracts word, translation, gender, POS, examples, image/audio filenames
 *   3. Assigns words to landmarks (100 per landmark, 50 left / 50 right)
 *   4. Inserts into vocabulary table
 * 
 * Landmarks must already exist in the database (from db:seed).
 * Media files should be copied separately to public/media/<lang>/
 */

require('dotenv').config({ path: '.env.local' });
const { pool, queryAll, queryOne, transaction, closePool } = require('../lib/db');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/import-vocabulary.js <lang_code> <anki_export.txt> [media_folder]');
  console.log('  e.g: node scripts/import-vocabulary.js de data/german_vocab.txt public/media/de');
  process.exit(1);
}

const langCode = args[0];
const filePath = args[1];
const mediaFolder = args[2] || null;

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ─── Parse helpers ───

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function extractGender(info) {
  const lower = (info || '').toLowerCase();
  if (/\b(masculine|maskulin|männlich)\b/.test(lower) || /\(m\)/.test(lower)) return 'M';
  if (/\b(feminine|feminin|weiblich)\b/.test(lower) || /\(f\)/.test(lower)) return 'F';
  if (/\b(neuter|neutrum|sächlich)\b/.test(lower) || /\(n\)/.test(lower)) return 'N';
  // German article detection
  if (/\bder\b/.test(lower.slice(0, 20))) return 'M';
  if (/\bdie\b/.test(lower.slice(0, 20))) return 'F';
  if (/\bdas\b/.test(lower.slice(0, 20))) return 'N';
  return null;
}

function extractPOS(info) {
  const lower = (info || '').toLowerCase();
  if (/\b(verb|conjugat|konjug)\b/.test(lower)) return 'verb';
  if (/\b(adjective|adjektiv)\b/.test(lower)) return 'adjective';
  if (/\b(adverb)\b/.test(lower)) return 'adverb';
  if (/\b(noun|substantiv|nomen)\b/.test(lower)) return 'noun';
  if (/\b(preposition|präposition)\b/.test(lower)) return 'preposition';
  if (/\b(conjunction|konjunktion)\b/.test(lower)) return 'conjunction';
  return null;
}

function extractSound(text) {
  const match = (text || '').match(/\[sound:([^\]]+)\]/);
  return match ? match[1] : null;
}

function extractImage(html) {
  const match = (html || '').match(/src="([^"]+)"/);
  return match ? match[1] : null;
}

// ─── Main ───

async function main() {
  console.log(`📥 Importing vocabulary for ${langCode.toUpperCase()} from ${filePath}...\n`);

  const language = await queryOne('SELECT id FROM languages WHERE code = $1', [langCode]);
  if (!language) {
    console.error(`❌ Language '${langCode}' not in DB. Run db:seed first.`);
    await closePool();
    process.exit(1);
  }
  const langId = language.id;

  // Get landmarks
  const landmarks = await queryAll(
    'SELECT id, position FROM landmarks WHERE language_id = $1 ORDER BY position',
    [langId]
  );
  if (landmarks.length === 0) {
    console.error(`❌ No landmarks found for ${langCode}. Seed them first.`);
    await closePool();
    process.exit(1);
  }
  console.log(`   📍 ${landmarks.length} landmarks available\n`);

  // Read and parse Anki export
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('#'));

  // Rejoin multiline entries (Anki sometimes splits on embedded newlines)
  const entries = [];
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length >= 4) {
      entries.push(cols);
    } else if (entries.length > 0) {
      // Continuation of previous entry
      const last = entries[entries.length - 1];
      last[last.length - 1] += '\n' + line;
    }
  }

  console.log(`   📄 Parsed ${entries.length} entries from Anki export`);

  // Clean existing vocabulary
  const existing = await queryOne(
    'SELECT COUNT(*)::int as c FROM vocabulary WHERE language_id = $1', [langId]
  );
  if (existing.c > 0) {
    console.log(`   ⚠️  Cleaning ${existing.c} existing words...`);
    await pool.query('DELETE FROM vocabulary WHERE language_id = $1', [langId]);
  }

  // Process entries into word objects
  const words = [];
  for (const cols of entries) {
    const word = stripHtml(cols[3] || cols[0] || '');
    if (!word || word.length < 1) continue;

    const translation = stripHtml(cols[4] || cols[1] || '');
    const info = cols[5] || cols[2] || '';
    const imageHtml = cols[6] || '';
    const audioRef = cols[7] || cols[6] || '';
    const example1 = stripHtml(cols[8] || '');
    const example2 = stripHtml(cols[9] || '');
    const example3 = stripHtml(cols[10] || '');

    words.push({
      word,
      translation,
      gender: extractGender(info) || extractGender(word),
      part_of_speech: extractPOS(info),
      example_sentence: example1 || null,
      example_sentence_2: example2 || null,
      example_sentence_3: example3 || null,
      image_filename: extractImage(imageHtml),
      audio_filename: extractSound(audioRef) || extractSound(cols.join('\t')),
      source: 'anki',
    });
  }

  console.log(`   📝 ${words.length} valid words extracted`);

  // Assign to landmarks: 100 per landmark (50 left, 50 right)
  const WORDS_PER_SIDE = 50;
  let landmarkIdx = 0;
  let sideCount = { left: 0, right: 0 };
  let currentSide = 'left';

  await transaction(async (client) => {
    for (let i = 0; i < words.length; i++) {
      const w = words[i];

      // Determine landmark and side
      if (landmarkIdx < landmarks.length) {
        if (currentSide === 'left' && sideCount.left >= WORDS_PER_SIDE) {
          currentSide = 'right';
        }
        if (currentSide === 'right' && sideCount.right >= WORDS_PER_SIDE) {
          landmarkIdx++;
          currentSide = 'left';
          sideCount = { left: 0, right: 0 };
        }
      }

      const lm = landmarks[landmarkIdx] || null;
      const posAtLandmark = currentSide === 'left' ? sideCount.left + 1 : sideCount.right + 1;

      await client.query(`
        INSERT INTO vocabulary 
          (language_id, landmark_id, side, position_at_landmark, word, translation, 
           gender, part_of_speech, example_sentence, example_sentence_2, example_sentence_3,
           image_filename, audio_filename, source, frequency_rank)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, [
        langId,
        lm ? lm.id : null,
        lm ? currentSide : null,
        lm ? posAtLandmark : null,
        w.word,
        w.translation,
        w.gender,
        w.part_of_speech,
        w.example_sentence,
        w.example_sentence_2,
        w.example_sentence_3,
        w.image_filename,
        w.audio_filename,
        w.source,
        i + 1  // frequency rank = import order
      ]);

      sideCount[currentSide]++;
    }
  });

  // Verify
  const totalWords = await queryOne(
    'SELECT COUNT(*)::int as c FROM vocabulary WHERE language_id = $1', [langId]
  );
  const withLandmark = await queryOne(
    'SELECT COUNT(*)::int as c FROM vocabulary WHERE language_id = $1 AND landmark_id IS NOT NULL', [langId]
  );
  const withGender = await queryOne(
    'SELECT COUNT(*)::int as c FROM vocabulary WHERE language_id = $1 AND gender IS NOT NULL', [langId]
  );

  // Show per-landmark summary
  const lmStats = await queryAll(`
    SELECT l.position, l.name, COUNT(v.id)::int as words,
      COUNT(CASE WHEN v.side = 'left' THEN 1 END)::int as left_count,
      COUNT(CASE WHEN v.side = 'right' THEN 1 END)::int as right_count
    FROM landmarks l
    LEFT JOIN vocabulary v ON v.landmark_id = l.id
    WHERE l.language_id = $1
    GROUP BY l.id, l.position, l.name
    ORDER BY l.position
  `, [langId]);

  console.log('\n   📍 Words per landmark:');
  for (const lm of lmStats) {
    if (lm.words > 0) {
      const bar = '█'.repeat(Math.round(lm.words / 2));
      console.log(`   #${String(lm.position).padStart(2)} │ ${bar} │ ${lm.left_count}L + ${lm.right_count}R = ${lm.words} — ${lm.name}`);
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Import complete for ${langCode.toUpperCase()}`);
  console.log(`   📝 Words:         ${totalWords.c}`);
  console.log(`   📍 With landmark: ${withLandmark.c}`);
  console.log(`   🏷️  With gender:   ${withGender.c}`);
  console.log(`   🔗 Unassigned:    ${totalWords.c - withLandmark.c} (overflow beyond last landmark)`);

  // Update language palace stats
  await pool.query(
    'UPDATE languages SET palace_landmark_count = $1 WHERE id = $2',
    [landmarks.length, langId]
  );

  await closePool();
  console.log('\n🎉 Done! Open /palace to see your mental palace.');
}

main().catch(e => { console.error('❌ Import failed:', e.message); process.exit(1); });
