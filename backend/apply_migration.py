from app.utils.db import get_db_connection
import os

def run_migration():
    print("Running migration 002_add_email_and_codes...")
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    try:
        cur = conn.cursor()
        with open('app/migrations/003_fix_missing_column.sql', 'r') as f:
            sql = f.read()
            cur.execute(sql)
        conn.commit()
        print("Migration successful!")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
