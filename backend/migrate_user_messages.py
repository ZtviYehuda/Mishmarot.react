"""
Migration: Add user_messages table for internal messaging system
"""

from app.utils.db import get_db_connection


def run_migration():
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False

    try:
        cur = conn.cursor()

        # Create user_messages table
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
                recipient_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # Create indexes
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_user_messages_recipient 
            ON user_messages(recipient_id)
        """
        )

        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_user_messages_created
            ON user_messages(created_at)
        """
        )

        conn.commit()
        print("✅ Migration completed successfully: user_messages table created")
        return True

    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()
