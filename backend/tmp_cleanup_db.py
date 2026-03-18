from app.utils.db import get_db_connection
import sys
import os

# Add parent directory to path to reach app module if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_db_schema():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
        """)
        columns = [row[0] for row in cur.fetchall()]
        print(f"Columns in 'employees' table: {columns}")
        
        target_columns = ['personal_number', 'national_id', 'personal_id']
        found = [col for col in target_columns if col in columns]
        
        if found:
            print(f"Found sensitive columns to remove: {found}")
            for col in found:
                print(f"Removing column {col}...")
                cur.execute(f"ALTER TABLE employees DROP COLUMN {col} CASCADE")
            conn.commit()
            print("Successfully removed columns from database.")
        else:
            print("No sensitive columns found in database.")
            
    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_db_schema()
