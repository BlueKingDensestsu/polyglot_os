#!/usr/bin/env python3
"""
scripts/extract_palace_html.py — Extract vocabulary from existing HTML palace files into PostgreSQL

Usage:
    python scripts/extract_palace_html.py <palace_cards_folder> <media_source_folder> <media_dest_folder>

Example:
    python scripts/extract_palace_html.py path/to/palace_cards path/to/german_media public/media/de

What it does:
    1. Reads every landmark_XX_left.html and landmark_XX_right.html
    2. Parses each word card: word, translation, gender, POS, examples, image filename, audio filename
    3. Copies media files to public/media/de/ for the app to serve
    4. Inserts everything into PostgreSQL vocabulary table (matched to existing landmarks)

Requires: pip install beautifulsoup4 psycopg2-binary python-dotenv
"""

import os
import sys
import re
import shutil
import json
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ Install beautifulsoup4: pip install beautifulsoup4")
    sys.exit(1)

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ Install psycopg2: pip install psycopg2-binary")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print("⚠️  dotenv not installed, using environment variables directly")

# ─── Parse CLI args ───
if len(sys.argv) < 3:
    print("Usage: python scripts/extract_palace_html.py <palace_cards_folder> <media_source_folder> [media_dest_folder]")
    print()
    print("Example:")
    print('  python scripts/extract_palace_html.py "path/to/palace_cards" "path/to/german_media" "public/media/de"')
    sys.exit(1)

PALACE_DIR = sys.argv[1]
MEDIA_SRC = sys.argv[2]
MEDIA_DEST = sys.argv[3] if len(sys.argv) > 3 else os.path.join("public", "media", "de")

if not os.path.isdir(PALACE_DIR):
    print(f"❌ Palace cards folder not found: {PALACE_DIR}")
    sys.exit(1)

# ─── Database connection ───
def get_conn():
    return psycopg2.connect(
        host=os.environ.get('PGHOST', 'localhost'),
        port=os.environ.get('PGPORT', 5432),
        database=os.environ.get('PGDATABASE', 'polyglot_os'),
        user=os.environ.get('PGUSER', 'postgres'),
        password=os.environ.get('PGPASSWORD', ''),
    )

# ─── Gender/POS detection from card HTML ───
GENDER_MAP = {
    '#4A90D9': 'M',    # blue = masculine
    '#4a90d9': 'M',
    '#E87BA8': 'F',    # pink = feminine
    '#e87ba8': 'F',
    '#7BC67E': 'N',    # green = neuter
    '#7bc67e': 'N',
}

POS_MAP = {
    '#F59E0B': 'verb',      # amber
    '#f59e0b': 'verb',
    '#8B5CF6': 'adjective', # violet
    '#8b5cf6': 'adjective',
    '#EC4899': 'adverb',    # hot pink
    '#ec4899': 'adverb',
    '#4ECDC4': None,        # teal = default (no specific POS)
    '#4ecdc4': None,
}

def detect_gender_pos(card_html):
    """Extract gender and POS from the card's border color"""
    gender = None
    pos = None
    
    # Look for border-left-color or border color in style
    color_match = re.search(r'border(?:-left)?(?:-color)?\s*:\s*([^;"\s]+)', str(card_html))
    if color_match:
        color = color_match.group(1).strip()
        gender = GENDER_MAP.get(color)
        if not gender:
            pos = POS_MAP.get(color)
    
    # Also check for color in the word text span
    word_color = re.search(r'color\s*:\s*(#[0-9a-fA-F]{6})', str(card_html))
    if word_color:
        c = word_color.group(1)
        if not gender:
            gender = GENDER_MAP.get(c)
        if not pos:
            pos = POS_MAP.get(c)
    
    # Check POS tag span
    pos_tag = card_html.find(class_='pos-tag') if hasattr(card_html, 'find') else None
    if pos_tag:
        tag_text = pos_tag.get_text(strip=True).lower()
        if tag_text in ('m', 'masc'): gender = 'M'
        elif tag_text in ('f', 'fem'): gender = 'F'
        elif tag_text in ('n', 'neut'): gender = 'N'
        elif tag_text in ('v', 'verb'): pos = 'verb'
        elif tag_text in ('adj', 'adjective'): pos = 'adjective'
        elif tag_text in ('adv', 'adverb'): pos = 'adverb'
    
    return gender, pos

def extract_card_data(card):
    """Extract all data from a single palace card HTML element"""
    data = {
        'word': '',
        'translation': '',
        'gender': None,
        'part_of_speech': None,
        'plural': None,
        'example_sentence': None,
        'example_translation': None,
        'example_sentence_2': None,
        'example_translation_2': None,
        'example_sentence_3': None,
        'example_translation_3': None,
        'image_filename': None,
        'audio_filename': None,
    }
    
    # Word (usually in a heading, strong, or .word class)
    word_el = (card.find(class_='word') or 
               card.find(class_='word-text') or
               card.find('h3') or 
               card.find('h4') or
               card.find('strong'))
    if word_el:
        data['word'] = word_el.get_text(strip=True)
    
    # If no word found, try the first significant text
    if not data['word']:
        texts = [t.strip() for t in card.stripped_strings]
        if texts:
            data['word'] = texts[0]
    
    # Gender and POS from colors
    data['gender'], data['part_of_speech'] = detect_gender_pos(card)
    
    # Translation (usually in .translation, .meaning, or after the word)
    trans_el = (card.find(class_='translation') or 
                card.find(class_='meaning') or
                card.find(class_='back'))
    if trans_el:
        data['translation'] = trans_el.get_text(strip=True)
    
    # Examples (usually in .example, .sentence, or <em>/<i> tags)
    examples = card.find_all(class_=re.compile(r'example|sentence'))
    if not examples:
        examples = card.find_all('em')
    if not examples:
        examples = card.find_all('i')
    
    for i, ex in enumerate(examples[:3]):
        text = ex.get_text(strip=True)
        if text:
            if i == 0:
                data['example_sentence'] = text
            elif i == 1:
                data['example_sentence_2'] = text
            elif i == 2:
                data['example_sentence_3'] = text
    
    # Image
    img = card.find('img')
    if img:
        src = img.get('src', '')
        # Extract just the filename
        data['image_filename'] = os.path.basename(src)
    
    # Audio
    audio = card.find('audio')
    if audio:
        source = audio.find('source')
        if source:
            data['audio_filename'] = os.path.basename(source.get('src', ''))
    
    # Also check for [sound:xxx] pattern
    card_text = str(card)
    sound_match = re.search(r'\[sound:([^\]]+)\]', card_text)
    if sound_match and not data['audio_filename']:
        data['audio_filename'] = sound_match.group(1)
    
    # Onclick audio
    onclick_match = re.search(r'playAudio\(["\']([^"\']+)', card_text)
    if onclick_match and not data['audio_filename']:
        data['audio_filename'] = os.path.basename(onclick_match.group(1))
    
    # Plural badge
    plural_el = card.find(class_='plural-badge')
    if plural_el:
        data['plural'] = plural_el.get_text(strip=True)
    
    return data

def parse_html_file(filepath):
    """Parse a single landmark HTML file and extract all word cards"""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Find all word cards — try multiple selectors
    cards = (soup.find_all(class_='card') or
             soup.find_all(class_='word-card') or
             soup.find_all(class_='palace-card') or
             soup.find_all(class_='vocab-card'))
    
    # Fallback: look for divs with border-left style (gender-colored cards)
    if not cards:
        cards = soup.find_all('div', style=re.compile(r'border-left'))
    
    # Another fallback: grid children
    if not cards:
        grid = soup.find(class_=re.compile(r'grid|cards'))
        if grid:
            cards = grid.find_all('div', recursive=False)
    
    words = []
    for card in cards:
        data = extract_card_data(card)
        if data['word'] and len(data['word']) > 0:
            words.append(data)
    
    return words

# ─── Main ───
def main():
    print(f"🏛️  Extracting German Mental Palace from HTML files...")
    print(f"   📁 Palace cards: {PALACE_DIR}")
    print(f"   🖼️  Media source: {MEDIA_SRC}")
    print(f"   📂 Media dest:   {MEDIA_DEST}\n")
    
    # Find all HTML files
    html_files = sorted(Path(PALACE_DIR).glob('landmark_*.html'))
    print(f"   📄 Found {len(html_files)} HTML files\n")
    
    if not html_files:
        print("❌ No landmark HTML files found. Expected files like landmark_01_left.html")
        sys.exit(1)
    
    # Parse all files
    all_words = []
    landmark_words = {}  # { (landmark_num, side): [words] }
    
    for filepath in html_files:
        filename = filepath.name
        
        # Parse landmark number and side from filename
        # Expected: landmark_01_left.html or landmark_01_right.html
        # Also handle: landmark_01.html (no side)
        match = re.match(r'landmark_(\d+)(?:_(left|right))?\.html', filename)
        if not match:
            print(f"   ⚠️  Skipping {filename} (unexpected format)")
            continue
        
        lm_num = int(match.group(1))
        side = match.group(2) or 'left'  # default to left if no side
        
        words = parse_html_file(filepath)
        
        if words:
            key = (lm_num, side)
            landmark_words[key] = words
            
            for i, w in enumerate(words):
                w['landmark_num'] = lm_num
                w['side'] = side
                w['position'] = i + 1
                all_words.append(w)
            
            print(f"   #{str(lm_num).rjust(2)} {side.ljust(5)} │ {len(words)} words")
        else:
            print(f"   #{str(lm_num).rjust(2)} {side.ljust(5)} │ ⚠️ 0 words extracted")
    
    print(f"\n   📝 Total words extracted: {len(all_words)}")
    
    # Count genders and POS
    genders = {'M': 0, 'F': 0, 'N': 0, None: 0}
    pos_counts = {}
    for w in all_words:
        genders[w['gender']] = genders.get(w['gender'], 0) + 1
        if w['part_of_speech']:
            pos_counts[w['part_of_speech']] = pos_counts.get(w['part_of_speech'], 0) + 1
    
    print(f"   🔵 Masculine: {genders['M']}")
    print(f"   🩷 Feminine: {genders['F']}")
    print(f"   🟢 Neuter: {genders['N']}")
    print(f"   ⬜ Unknown gender: {genders[None]}")
    for p, c in pos_counts.items():
        print(f"   🏷️  {p}: {c}")
    
    # ─── Copy media files ───
    if os.path.isdir(MEDIA_SRC):
        os.makedirs(MEDIA_DEST, exist_ok=True)
        media_count = 0
        
        # Collect all referenced filenames
        referenced = set()
        for w in all_words:
            if w['image_filename']:
                referenced.add(w['image_filename'])
            if w['audio_filename']:
                referenced.add(w['audio_filename'])
        
        print(f"\n   🖼️  Copying {len(referenced)} referenced media files...")
        
        for filename in referenced:
            src_path = os.path.join(MEDIA_SRC, filename)
            # Also check in palace_cards/media subfolder
            if not os.path.exists(src_path):
                src_path = os.path.join(PALACE_DIR, 'media', filename)
            if os.path.exists(src_path):
                dest_path = os.path.join(MEDIA_DEST, filename)
                if not os.path.exists(dest_path):
                    shutil.copy2(src_path, dest_path)
                media_count += 1
        
        print(f"   ✅ Copied {media_count} media files to {MEDIA_DEST}")
    else:
        print(f"\n   ⚠️  Media source not found: {MEDIA_SRC}")
        print("   Skipping media copy. Images/audio won't display until you copy them manually.")
    
    # ─── Insert into PostgreSQL ───
    print(f"\n   💾 Inserting into PostgreSQL...")
    
    conn = get_conn()
    cur = conn.cursor()
    
    # Get German language ID
    cur.execute("SELECT id FROM languages WHERE code = 'de'")
    lang_row = cur.fetchone()
    if not lang_row:
        print("❌ German language not found in DB. Run db:seed first.")
        conn.close()
        sys.exit(1)
    lang_id = lang_row[0]
    
    # Get landmarks
    cur.execute("SELECT id, position FROM landmarks WHERE language_id = %s ORDER BY position", (lang_id,))
    landmarks = {row[1]: row[0] for row in cur.fetchall()}  # { position: id }
    
    # Clean existing vocabulary
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s", (lang_id,))
    existing = cur.fetchone()[0]
    if existing > 0:
        print(f"   ⚠️  Cleaning {existing} existing words...")
        cur.execute("DELETE FROM vocabulary WHERE language_id = %s", (lang_id,))
    
    # Insert words
    inserted = 0
    for w in all_words:
        lm_id = landmarks.get(w['landmark_num'])
        if not lm_id:
            continue
        
        cur.execute("""
            INSERT INTO vocabulary 
                (language_id, landmark_id, side, position_at_landmark, word, translation,
                 gender, part_of_speech, plural,
                 example_sentence, example_translation,
                 example_sentence_2, example_translation_2,
                 example_sentence_3, example_translation_3,
                 image_filename, audio_filename, source, frequency_rank)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'palace_html',%s)
        """, (
            lang_id, lm_id, w['side'], w['position'],
            w['word'], w['translation'],
            w['gender'], w['part_of_speech'], w['plural'],
            w['example_sentence'], w.get('example_translation'),
            w['example_sentence_2'], w.get('example_translation_2'),
            w['example_sentence_3'], w.get('example_translation_3'),
            w['image_filename'], w['audio_filename'],
            inserted + 1,
        ))
        inserted += 1
    
    conn.commit()
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s", (lang_id,))
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s AND image_filename IS NOT NULL", (lang_id,))
    with_images = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s AND audio_filename IS NOT NULL", (lang_id,))
    with_audio = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s AND gender IS NOT NULL", (lang_id,))
    with_gender = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vocabulary WHERE language_id = %s AND example_sentence IS NOT NULL", (lang_id,))
    with_examples = cur.fetchone()[0]
    
    print(f"\n{'═' * 50}")
    print(f"✅ Import complete!")
    print(f"   📝 Words:         {total}")
    print(f"   🖼️  With images:   {with_images}")
    print(f"   🔊 With audio:    {with_audio}")
    print(f"   🏷️  With gender:   {with_gender}")
    print(f"   📝 With examples: {with_examples}")
    
    cur.close()
    conn.close()
    
    print(f"\n🎉 Done! Open http://localhost:3000/palace to see your mental palace.")
    print(f"   Media served from: {MEDIA_DEST}")

if __name__ == '__main__':
    main()
