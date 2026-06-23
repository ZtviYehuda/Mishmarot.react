import os
from dotenv import load_dotenv
load_dotenv('.env')

import psycopg2
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS'),
    port=os.getenv('DB_PORT', 5432)
)
cur = conn.cursor()
cur.execute("""
    SELECT id, first_name, last_name, username, phone_number, email,
           is_commander, is_admin, is_active, last_seen, chat_status, chat_status_custom,
           (last_seen IS NOT NULL AND last_seen > NOW() - INTERVAL '30 seconds') as is_online
    FROM employees
    WHERE is_active = TRUE 
      AND (is_commander = TRUE OR is_admin = TRUE)
      AND id != 208
    ORDER BY first_name ASC
""")
rows = cur.fetchall()
for r in rows:
    print(r[0], repr(r[1]), repr(r[2]), r[3])
conn.close()
