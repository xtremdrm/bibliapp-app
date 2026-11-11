import sqlite3, json, os


BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'bible')
DB_PATH = os.path.join(BASE, 'SpaPlatense.db')
out = BASE

os.makedirs(out, exist_ok=True)
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()


# Un JSON por libro: bible_1.json, bible_2.json ... bible_73.json
cur.execute('SELECT book_id, chapter, verse, text FROM SpaPlatense_verses WHERE book_id <= 73 ORDER BY book_id, chapter, verse')
rows = cur.fetchall()

books_data = {}
for book_id, chapter, verse, text in rows:
    k, c = str(book_id), str(chapter)
    if k not in books_data: books_data[k] = {}
    if c not in books_data[k]: books_data[k][c] = []
    books_data[k][c].append({'v': verse, 't': text.strip()})

for book_id, chapters in books_data.items():
    path = os.path.join(out, f'bible_{book_id}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, separators=(',', ':'))

print(f'Generados {len(books_data)} archivos bible_N.json')
conn.close()