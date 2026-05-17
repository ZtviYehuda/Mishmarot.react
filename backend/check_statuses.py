
import os
import sys
sys.path.append(os.getcwd())
from app.utils.db import get_db_connection

def check():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM status_types")
    for row in cur.fetchall():
        print(f"{row[0]}: {row[1]}")
    conn.close()

if __name__ == "__main__":
    check()
