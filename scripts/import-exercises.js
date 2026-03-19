#!/usr/bin/env node
/**
 * scripts/import-exercises.js — Import grammar exercises into PostgreSQL
 * 
 * Usage: node scripts/import-exercises.js de data/exercises_database.json
 * 
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  WHAT CHANGED FROM SQLite:                                   ║
 * ║                                                              ║
 * ║  ? placeholders → $1, $2, $3...                              ║
 * ║  last_insert_rowid() → INSERT ... RETURNING id               ║
 * ║  All queries async (await client.query)                      ║
 * ║  Transaction uses client from pool.connect()                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { pool, queryOne, queryAll, transaction, closePool } = require('../lib/db');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/import-exercises.js <lang_code> <json_file>');
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
    let num = 0; const chapters = [];
    for (const book of data.books) {
      for (const lesson of (book.lessons || book.chapters || [])) {
        num++;
        chapters.push({
          chapter_number: num, title: lesson.title || `Lesson ${num}`,
          rule: lesson.rule || '', sections: (lesson.drills || lesson.exercises || lesson.sections || []).map((d,i) => ({
            section_id: d.id || `${num}${String.fromCharCode(65+i)}`,
            title: d.title || `Drill ${i+1}`, instruction: d.instruction || '',
            type: d.type || guessType(d.title || ''), difficulty: d.difficulty || 'A2',
            prompts: d.items || d.exercises || d.prompts || []
          }))
        });
      }
    } return chapters;
  }
  if (Array.isArray(data)) {
    return data.map((ch, i) => ({
      chapter_number: ch.chapter_number || i+1, title: ch.title || `Chapter ${i+1}`,
      rule: ch.rule || '', sections: (ch.sections || ch.exercises || []).map((s,j) => ({
        section_id: s.id || `${i+1}${String.fromCharCode(65+j)}`,
        title: s.title || `Exercise ${j+1}`, instruction: s.instruction || '',
        type: s.type || 'transform', difficulty: s.difficulty || 'B1',
        prompts: s.exercises || s.items || s.prompts || []
      }))
    }));
  }
  const keys = Object.keys(data).filter(k => !isNaN(k)).sort((a,b) => +a - +b);
  if (keys.length > 0) {
    return keys.map(k => { const ch = data[k]; return {
      chapter_number: parseInt(k), title: ch.title || `Chapter ${k}`, rule: ch.rule || '',
      sections: (ch.sections || []).map((s,j) => ({
        section_id: s.id || `${k}${String.fromCharCode(65+j)}`,
        title: s.title || `Exercise ${j+1}`, instruction: s.instruction || '',
        type: s.type || 'transform', difficulty: s.difficulty || 'B1',
        prompts: s.exercises || s.items || s.prompts || []
      }))
    };});
  }
  console.error('❌ Unrecognized JSON format.'); process.exit(1);
}

async function main() {
  console.log(`📥 Importing ${langCode.toUpperCase()} from ${jsonPath}...\n`);
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const language = await queryOne('SELECT id FROM languages WHERE code = $1', [langCode]);
  if (!language) { console.error(`❌ Language '${langCode}' not in DB. Run db:seed first.`); await closePool(); process.exit(1); }
  const langId = language.id;

  // Clean existing exercises
  const existing = await queryOne('SELECT COUNT(*)::int as c FROM grammar_chapters WHERE language_id = $1', [langId]);
  if (existing.c > 0) {
    console.log(`⚠️  Found ${existing.c} existing chapters. Cleaning...`);
    // Postgres cascades handle children if ON DELETE CASCADE is set,
    // but we do explicit deletes for clarity and safety
    await pool.query(`DELETE FROM grammar_answers WHERE prompt_id IN (
      SELECT gp.id FROM grammar_prompts gp JOIN grammar_exercises ge ON gp.exercise_id=ge.id
      JOIN grammar_chapters gc ON ge.chapter_id=gc.id WHERE gc.language_id=$1)`, [langId]);
    await pool.query(`DELETE FROM grammar_prompts WHERE exercise_id IN (
      SELECT ge.id FROM grammar_exercises ge JOIN grammar_chapters gc ON ge.chapter_id=gc.id
      WHERE gc.language_id=$1)`, [langId]);
    await pool.query(`DELETE FROM grammar_exercises WHERE chapter_id IN (
      SELECT id FROM grammar_chapters WHERE language_id=$1)`, [langId]);
    await pool.query('DELETE FROM grammar_chapters WHERE language_id=$1', [langId]);
    console.log('   ✅ Cleaned.\n');
  }

  const chapters = normalizeData(rawData);
  let totalCh = 0, totalEx = 0, totalPr = 0;

  await transaction(async (client) => {
    for (const chapter of chapters) {
      // INSERT ... RETURNING id  ← this is how PG gives you the new row's ID
      const chResult = await client.query(
        'INSERT INTO grammar_chapters (language_id,chapter_number,title,rule_summary) VALUES ($1,$2,$3,$4) RETURNING id',
        [langId, chapter.chapter_number, chapter.title, chapter.rule]
      );
      const chId = chResult.rows[0].id;
      totalCh++;

      let chEx = 0, chPr = 0;

      for (let ei = 0; ei < chapter.sections.length; ei++) {
        const sec = chapter.sections[ei];
        const exResult = await client.query(
          'INSERT INTO grammar_exercises (chapter_id,exercise_number,section_id,title,instruction,type,difficulty) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
          [chId, ei+1, sec.section_id, sec.title, sec.instruction, sec.type, sec.difficulty]
        );
        const exId = exResult.rows[0].id;
        totalEx++; chEx++;

        for (let pi = 0; pi < sec.prompts.length; pi++) {
          const text = typeof sec.prompts[pi] === 'string' ? sec.prompts[pi] : JSON.stringify(sec.prompts[pi]);
          await client.query(
            'INSERT INTO grammar_prompts (exercise_id,prompt_number,text) VALUES ($1,$2,$3)',
            [exId, pi+1, text]
          );
          totalPr++; chPr++;
        }

        await client.query('UPDATE grammar_exercises SET prompt_count=$1 WHERE id=$2', [sec.prompts.length, exId]);
      }

      await client.query('UPDATE grammar_chapters SET exercise_count=$1, prompt_count=$2 WHERE id=$3', [chEx, chPr, chId]);

      const bar = '█'.repeat(Math.min(chapter.sections.length, 50));
      console.log(`   Ch ${String(chapter.chapter_number).padStart(2)} │ ${bar} │ ${chEx} ex, ${chPr} prompts — ${chapter.title}`);
    }
  });

  // Verify
  const vCh = await queryOne('SELECT COUNT(*)::int as c FROM grammar_chapters WHERE language_id=$1', [langId]);
  const vEx = await queryOne('SELECT COUNT(*)::int as c FROM grammar_exercises WHERE chapter_id IN (SELECT id FROM grammar_chapters WHERE language_id=$1)', [langId]);
  const vPr = await queryOne('SELECT COUNT(*)::int as c FROM grammar_prompts WHERE exercise_id IN (SELECT id FROM grammar_exercises WHERE chapter_id IN (SELECT id FROM grammar_chapters WHERE language_id=$1))', [langId]);

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Import complete for ${langCode.toUpperCase()}`);
  console.log(`   📚 Chapters:  ${totalCh} (DB: ${vCh.c})`);
  console.log(`   📝 Exercises: ${totalEx} (DB: ${vEx.c})`);
  console.log(`   💬 Prompts:   ${totalPr} (DB: ${vPr.c})`);
  console.log(vCh.c===totalCh && vEx.c===totalEx && vPr.c===totalPr ? '   ✅ All counts match!' : '   ⚠️ Count mismatch.');

  await closePool();
  console.log('\n🎉 Done!');
}

main().catch(e => { console.error('❌ Import failed:', e.message); process.exit(1); });
