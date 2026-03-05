import os
import sys

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def update_persistence():
    conn = get_db_connection()
    cur = conn.cursor()
    names = ["משרד", "משרד/שגרה", "שגרתי", "בבסיס", "שיגרה"]
    cur.execute(
        "UPDATE status_types SET is_persistent = TRUE WHERE name = ANY(%s)", (names,)
    )
    rows = cur.rowcount
    conn.commit()
    conn.close()
    print(f"Updated {rows} status types to be persistent.")


if __name__ == "__main__":
    update_persistence()
