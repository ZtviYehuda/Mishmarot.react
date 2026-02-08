import os
import sys
from dotenv import load_dotenv

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

load_dotenv()

try:
    from app.utils.db import get_db_connection
except ImportError:
    # Fallback if running from a different directory depth
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    from app.utils.db import get_db_connection


def run_migration():
    print("Connecting to DB...")
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database.")
        sys.exit(1)

    try:
        cur = conn.cursor()
        print("Checking/Adding column last_birthday_message_sent to employees table...")

        # Add the column if it doesn't exist
        cur.execute(
            """
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS last_birthday_message_sent TIMESTAMP;
        """
        )

        conn.commit()
        print("Migration successful: Column ensured.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()
