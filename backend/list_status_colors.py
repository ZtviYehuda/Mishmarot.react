import os
import sys

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection

def list_colors():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, color FROM status_types")
    rows = cur.fetchall()
    for r in rows:
        print(f"ID: {r[0]}, Name: {r[1]}, Color: {r[2]}")
    conn.close()

if __name__ == "__main__":
    list_colors()
