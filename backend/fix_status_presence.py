import os
import sys

from app.utils.db import get_db_connection

def fix():
    conn = get_db_connection()
    if not conn:
        print("No db connection")
        return
    try:
        cur = conn.cursor()
        
        # We want "משרד" (and its children), "תגבור", and "קורס" to be TRUE
        cur.execute("UPDATE status_types SET is_presence = FALSE")
        
        cur.execute("UPDATE status_types SET is_presence = TRUE WHERE name IN ('משרד', 'תגבור', 'קורס')")
        
        cur.execute("""
            UPDATE status_types 
            SET is_presence = TRUE 
            WHERE parent_status_id IN (
                SELECT id FROM status_types WHERE name IN ('משרד', 'תגבור', 'קורס')
            )
        """)
        
        conn.commit()
        print("Success! Updated is_presence flags in DB to include קורס.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    fix()
