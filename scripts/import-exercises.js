#!/usr/bin/env node
/**
 * scripts/import-exercises.js — Imports grammar exercises from JSON into SQLite
 * 
 * Usage: node scripts/import-exercises.js <language_code> <json_file>
 * Example: node scripts/import-exercises.js de data/exercises_database.json
 * 
 * Auto-detects JSON format:
 *   { chapters: [...] }           — German format
 *   { books: [{ lessons: [...] }] — Greek format
 *   [ chapter, chapter, ... ]     — Array of chapters
 *   { "1": {...}, "2": {...} }    — Numbered keys
 */

const { getDb, saveDb, queryAll, queryOne, run, transaction, closeDb } = require('../lib/db');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/import-exercises.js <lang_code> <json_file>');
  console.log('  e.g: node scripts/import-exercises.js de data/exercises_database.json');
  process.exit(1);
}

const langCode = args[0];
const jsonPath = args[1];

if (!fs.existsSync(jsonPath)) { console.error(`❌ File not found: ${jsonPath}`); process.exit(1); }

function guessType(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('übersetz') || t.includes('translat') || t.includes('μεταφρά')) return 'translate';
  if (t.includes('fehler') || t.includes('error') || t.includes('korrigier') || t.includes('διόρθω')) return 'error_fix';
  if (t.includes('schreib') || t.includes('write') || t.includes('produc') || t.includes('γράψτε')) return 'produce';
  if (t.includes('paragraph') || t.includes('aufsatz') || t.includes('essay')) return 'paragraph';
  return 'transform';
}

function normalizeData(data) {
  if (data.chapters && Array.isArray(data.chapters)) {
    return data.chapters.map(ch => ({
      chapter_number: ch.chapter_number || ch.number || ch.chapter,
      title: ch.title || ch.topic || `Chapter ${ch.chapter_number}`,
      rule: ch.rule || ch.rule_summary || '',
      sections: (ch.sections || ch.exercises || []).map((sec, idx) => ({
        section_id: sec.id || sec.section_id || `${ch.chapter_number || ''}${String.fromCharCode(65+idx)}`,
        title: sec.title || sec.name || `Exercise ${idx+1}`,
        instruction: sec.instruction || sec.instructions || '',
        type: sec.type || guessType(sec.title || ''),
        difficulty: sec.difficulty || sec.level || 'B1',
        prompts: sec.exercises || sec.items || sec.prompts || []
      }))
    }));
  }
  if (data.books && Array.isArray(data.books)) {
    let num = 0;
    const chapters = [];
    for (const book of data.books) {
      for (const lesson of (book.lessons || book.chapters || [])) {
        num++;
        chapters.push({
          chapter_number: num,
          title: lesson.title || `Lesson ${num}`,
          rule: lesson.rule || lesson.grammar_point || '',
          sections: (lesson.drills || lesson.exercises || lesson.sections || []).map((d, i) => ({
            section_id: d.id || `${num}${String.fromCharCode(65+i)}`,
            title: d.title || `Drill ${i+1}`,
            instruction: d.instruction || d.instructions || '',
            type: d.type || guessType(d.title || ''),
            difficulty: d.difficulty || 'A2',
            prompts: d.items || d.exercises || d.prompts || []
          }))
        });
      }
    }
    return chapters;
  }
  if (Array.isArray(data)) {
    return data.map((ch, i) => ({
      chapter_number: ch.chapter_number || ch.number || i+1,
      title: ch.title || `Chapter ${i+1}`,
      rule: ch.rule || '',
      sections: (ch.sections || ch.exercises || []).map((s, j) => ({
        section_id: s.id || `${i+1}${String.fromCharCode(65+j)}`,
        title: s.title || `Exercise ${j+1}`,
        instruction: s.instruction || '',
        type: s.type || 'transform',
        difficulty: s.difficulty || 'B1',
        prompts: s.exercises || s.items || s.prompts || []
      }))
    }));
  }
  // Numbered keys
  const keys = Object.keys(data).filter(k => !isNaN(k)).sort((a,b) => +a - +b);
  if (keys.length > 0) {
    return keys.map(k => {
      const ch = data[k];
      return {
        chapter_number: parseInt(k),
        title: ch.title || `Chapter ${k}`,
        rule: ch.rule || '',
        sections: (ch.sections || []).map((s, j) => ({
          section_id: s.id || `${k}${String.fromCharCode(65+j)}`,
          title: s.title || `Exercise ${j+1}`,
          instruction: s.instruction || '',
          type: s.type || 'transform',
          difficulty: s.difficulty || 'B1',
          prompts: s.exercises || s.items || s.prompts || []
        }))
      };
    });
  }
  console.error('❌ Unrecognized JSON format.'); process.exit(1);
}

async function main() {
  console.log(`📥 Importing ${langCode.toUpperCase()} from ${jsonPath}...\n`);
  const db = await getDb();
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const language = queryOne(db, 'SELECT id FROM languages WHERE code = ?', [langCode]);
  if (!language) { console.error(`❌ Language '${langCode}' not in DB. Run db:seed first.`); closeDb(); process.exit(1); }
  const langId = language.id;

  // Clean existing exercises for this language
  const existing = queryOne(db, 'SELECT COUNT(*) as c FROM grammar_chapters WHERE language_id = ?', [langId]);
  if (existing.c > 0) {
    console.log(`⚠️  Found ${existing.c} existing chapters. Cleaning...`);
    // Delete children first (foreign key order)
    db.run(`DELETE FROM grammar_answers WHERE prompt_id IN (
      SELECT gp.id FROM grammar_prompts gp JOIN grammar_exercises ge ON gp.exercise_id=ge.id
      JOIN grammar_chapters gc ON ge.chapter_id=gc.id WHERE gc.language_id=?)`, [langId]);
    db.run(`DELETE FROM grammar_prompts WHERE exercise_id IN (
      SELECT ge.id FROM grammar_exercises ge JOIN grammar_chapters gc ON ge.chapter_id=gc.id
      WHERE gc.language_id=?)`, [langId]);
    db.run(`DELETE FROM grammar_exercises WHERE chapter_id IN (
      SELECT id FROM grammar_chapters WHERE language_id=?)`, [langId]);
    db.run(`DELETE FROM grammar_chapters WHERE language_id=?`, [langId]);
    console.log('   ✅ Cleaned.\n');
  }

  const chapters = normalizeData(rawData);
  let totalCh = 0, totalEx = 0, totalPr = 0;

  transaction(db, () => {
    for (const chapter of chapters) {
      db.run(
        'INSERT INTO grammar_chapters (language_id,chapter_number,title,rule_summary) VALUES (?,?,?,?)',
        [langId, chapter.chapter_number, chapter.title, chapter.rule]
      );
      const chId = queryOne(db, 'SELECT last_insert_rowid() as id').id;
      totalCh++;

      let chEx = 0, chPr = 0;

      for (let ei = 0; ei < chapter.sections.length; ei++) {
        const sec = chapter.sections[ei];
        db.run(
          'INSERT INTO grammar_exercises (chapter_id,exercise_number,section_id,title,instruction,type,difficulty) VALUES (?,?,?,?,?,?,?)',
          [chId, ei+1, sec.section_id, sec.title, sec.instruction, sec.type, sec.difficulty]
        );
        const exId = queryOne(db, 'SELECT last_insert_rowid() as id').id;
        totalEx++; chEx++;

        for (let pi = 0; pi < sec.prompts.length; pi++) {
          const text = typeof sec.prompts[pi] === 'string' ? sec.prompts[pi] : JSON.stringify(sec.prompts[pi]);
          db.run('INSERT INTO grammar_prompts (exercise_id,prompt_number,text) VALUES (?,?,?)',
            [exId, pi+1, text]);
          totalPr++; chPr++;
        }

        // Cache prompt count on exercise
        db.run('UPDATE grammar_exercises SET prompt_count=? WHERE id=?', [sec.prompts.length, exId]);
      }

      // Cache counts on chapter
      db.run('UPDATE grammar_chapters SET exercise_count=?, prompt_count=? WHERE id=?', [chEx, chPr, chId]);

      const bar = '█'.repeat(Math.min(chapter.sections.length, 50));
      console.log(`   Ch ${String(chapter.chapter_number).padStart(2)} │ ${bar} │ ${chEx} ex, ${chPr} prompts — ${chapter.title}`);
    }
  });

  saveDb();

  // Verify
  const vCh = queryOne(db, 'SELECT COUNT(*) as c FROM grammar_chapters WHERE language_id=?', [langId]);
  const vEx = queryOne(db, 'SELECT COUNT(*) as c FROM grammar_exercises WHERE chapter_id IN (SELECT id FROM grammar_chapters WHERE language_id=?)', [langId]);
  const vPr = queryOne(db, 'SELECT COUNT(*) as c FROM grammar_prompts WHERE exercise_id IN (SELECT id FROM grammar_exercises WHERE chapter_id IN (SELECT id FROM grammar_chapters WHERE language_id=?))', [langId]);

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Import complete for ${langCode.toUpperCase()}`);
  console.log(`   📚 Chapters:  ${totalCh} (DB: ${vCh.c})`);
  console.log(`   📝 Exercises: ${totalEx} (DB: ${vEx.c})`);
  console.log(`   💬 Prompts:   ${totalPr} (DB: ${vPr.c})`);

  if (vCh.c === totalCh && vEx.c === totalEx && vPr.c === totalPr) {
    console.log('   ✅ All counts match!');
  } else {
    console.log('   ⚠️ Count mismatch — check format.');
  }

  closeDb();
  console.log('\n🎉 Done!');
}

main().catch(e => { console.error('❌ Import failed:', e.message); process.exit(1); });
