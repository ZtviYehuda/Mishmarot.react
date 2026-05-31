import sys
import os

sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from app.utils.db import get_db_connection

def cleanup():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to the database.")
        return
    
    try:
        cur = conn.cursor()
        
        # 1. Update references in attendance_logs
        cur.execute("UPDATE attendance_logs SET status_type_id = 11 WHERE status_type_id = 16")
        logs_updated = cur.rowcount
        print(f"Updated {logs_updated} records in attendance_logs.")
        
        # 2. Update references in attendance_logs_archive
        cur.execute("UPDATE attendance_logs_archive SET status_type_id = 11 WHERE status_type_id = 16")
        archive_updated = cur.rowcount
        print(f"Updated {archive_updated} records in attendance_logs_archive.")
        
        # 3. Delete the duplicate status type with ID 16 ('שטח')
        cur.execute("DELETE FROM status_types WHERE id = 16")
        deleted = cur.rowcount
        print(f"Deleted {deleted} records from status_types (ID 16).")
        
        conn.commit()
        print("Database cleanup committed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error during database cleanup: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    cleanup()
