import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import get_db_connection


def fix_persistence():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        return

    cur = conn.cursor()

    # Set Sick (2) and Abroad (6) to Persistent=TRUE
    # Assuming IDs from previous debug output:
    # 2: חולה
    # 6: חופשה חו"ל

    print("Updating persistence for Sick (2) and Abroad (6)...")
    cur.execute("UPDATE status_types SET is_persistent = TRUE WHERE id IN (2, 6)")
    conn.commit()
    print("Update complete.")

    conn.close()


if __name__ == "__main__":
    fix_persistence()
