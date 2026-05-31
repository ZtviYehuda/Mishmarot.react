import sys
import os

sys.path.append('backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from app.utils.db import get_db_connection

def rename_status():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to the database.")
        return
    
    try:
        cur = conn.cursor()
        cur.execute("UPDATE status_types SET name = 'שטח', code = 'שטח' WHERE id = 11")
        updated = cur.rowcount
        conn.commit()
        print(f"Successfully renamed {updated} status type(s) to 'שטח'.")
    except Exception as e:
        conn.rollback()
        print(f"Error during renaming: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    rename_status()
