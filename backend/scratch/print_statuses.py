from app.utils.db import get_db_connection
import sys

conn = get_db_connection()
cur = conn.cursor()
cur.execute('SELECT id, name, parent_status_id, is_presence FROM status_types')
rows = cur.fetchall()

with open('scratch/db_statuses.txt', 'w', encoding='utf-8') as f:
    for row in rows:
        f.write(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}\n")

print("Done! Check scratch/db_statuses.txt")
