
import os
import sys

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.db import get_db_connection

def add_gender_column():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return

    try:
        cur = conn.cursor()
        print("Checking for gender column...")
        
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='employees' AND column_name='gender';
        """)
        
        if cur.fetchone():
            print("Column 'gender' already exists.")
        else:
            print("Adding 'gender' column...")
            cur.execute("""
                ALTER TABLE employees 
                ADD COLUMN gender VARCHAR(10) DEFAULT 'male';
            """)
            conn.commit()
            print("Column 'gender' added successfully.")
            
    except Exception as e:
        conn.rollback()
        print(f"Error adding column: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_gender_column()
