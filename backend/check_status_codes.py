from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor

conn = get_db_connection()
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("SELECT id, name, code FROM status_types;")
rows = cur.fetchall()
for row in rows:
    print(f"{row['id']}: {row['name']} (Code: {row['code']})")
conn.close()
