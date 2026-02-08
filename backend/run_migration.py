from app.utils.db import get_db_connection
import sys


def run_migration():
    print("Connecting to DB...")
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        sys.exit(1)

    try:
        cur = conn.cursor()
        print("Adding column last_birthday_message_sent...")
        cur.execute(
            "ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_birthday_message_sent TIMESTAMP;"
        )
        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()
