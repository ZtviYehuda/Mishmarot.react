from app.utils.db import get_db_connection
import psycopg2


def migrate():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return

    try:
        cur = conn.cursor()

        # 1. Add is_verified column
        print("Adding is_verified column to attendance_logs...")
        cur.execute(
            """
            ALTER TABLE attendance_logs 
            ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
        """
        )

        # 2. Add verification_time column? Maybe useful for audit.
        print("Adding verified_at column to attendance_logs...")
        cur.execute(
            """
            ALTER TABLE attendance_logs 
            ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
        """
        )

        conn.commit()
        print("Migration successful!")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
