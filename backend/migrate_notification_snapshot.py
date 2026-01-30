"""
Migration: Add notification snapshot fields to notification_reads table
"""
from app.utils.db import get_db_connection

def run_migration():
    conn = get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return False
    
    try:
        cur = conn.cursor()
        
        # Add new columns for notification snapshot
        migrations = [
            "ALTER TABLE notification_reads ADD COLUMN IF NOT EXISTS title VARCHAR(255)",
            "ALTER TABLE notification_reads ADD COLUMN IF NOT EXISTS description TEXT",
            "ALTER TABLE notification_reads ADD COLUMN IF NOT EXISTS type VARCHAR(20)",
            "ALTER TABLE notification_reads ADD COLUMN IF NOT EXISTS link VARCHAR(255)",
        ]
        
        for migration in migrations:
            cur.execute(migration)
        
        conn.commit()
        print("✅ Migration completed: Added notification snapshot fields")
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
