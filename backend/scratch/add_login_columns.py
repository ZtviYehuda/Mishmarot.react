from app.utils.db import get_db_connection

conn = get_db_connection()
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_login TIMESTAMP")
    cur.execute("ALTER TABLE employees ADD COLUMN IF NOT EXISTS previous_login TIMESTAMP")
    conn.commit()
    print("Columns added successfully")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
conn.close()
