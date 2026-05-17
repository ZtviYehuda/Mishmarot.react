from app.utils.db import get_db_connection
import json

conn = get_db_connection()
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees'")
columns = cur.fetchall()
print(json.dumps(columns, indent=2))
conn.close()
