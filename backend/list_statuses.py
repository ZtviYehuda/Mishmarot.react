import os
import sys

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def list_statuses():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, is_presence, is_persistent FROM status_types ORDER BY id"
    )
    rows = cur.fetchall()
    print(f"{'ID':<5} | {'Name':<15} | {'Presence':<10} | {'Persistent':<10}")
    print("-" * 50)
    for r in rows:
        print(f"{r[0]:<5} | {r[1]:<15} | {str(r[2]):<10} | {str(r[3]):<10}")
    conn.close()


if __name__ == "__main__":
    list_statuses()
