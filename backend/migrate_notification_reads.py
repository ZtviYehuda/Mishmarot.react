"""
Migration: Add notification_reads table
"""
from app.utils.db import get_db_connection

def run_migration():
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cur = conn.cursor()
        
        # Create notification_reads table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notification_reads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                notification_id VARCHAR(255) NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, notification_id)
            )
        """)
        
        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_notification_reads_user 
            ON notification_reads(user_id)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_notification_reads_notif 
            ON notification_reads(notification_id)
        """)
        
        conn.commit()
        print("✅ Migration completed successfully: notification_reads table created")
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
