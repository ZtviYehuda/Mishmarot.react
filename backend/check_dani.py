import os
import sys
import json
from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor

def run():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM employees WHERE first_name = 'דני' AND last_name = 'וסרמן'")
    res = cur.fetchall()
    print(json.dumps(res, ensure_ascii=False, default=str))

if __name__ == "__main__":
    run()
