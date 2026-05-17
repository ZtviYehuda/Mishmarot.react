from app.utils.db import get_db_connection

def clean_audit_logs():
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        # Clean up login failure descriptions that might contain numbers
        # Usually these are "Failed login attempt for username: ..." 
        # But in the past they might have been "Failed login attempt for personal_number: ..."
        
        print("Cleaning up audit_logs descriptions...")
        cur.execute("""
            UPDATE audit_logs 
            SET description = REPLACE(description, 'personal_number', 'username')
            WHERE description LIKE '%personal_number%'
        """)
        print(f"Updated {cur.rowcount} rows with 'personal_number'.")
        
        cur.execute("""
            UPDATE audit_logs 
            SET description = REPLACE(description, 'National ID', 'Username')
            WHERE description LIKE '%National ID%'
        """)
        print(f"Updated {cur.rowcount} rows with 'National ID'.")

        cur.execute("""
            UPDATE audit_logs 
            SET description = REPLACE(description, 'ת.ז', 'שם משתמש')
            WHERE description LIKE '%ת.ז%'
        """)
        print(f"Updated {cur.rowcount} rows with 'ת.ז'.")

        cur.execute("""
            UPDATE audit_logs 
            SET description = REPLACE(description, 'מספר אישי', 'שם משתמש')
            WHERE description LIKE '%מספר אישי%'
        """)
        print(f"Updated {cur.rowcount} rows with 'מספר אישי'.")

        conn.commit()
        print("Successfully cleaned up audit_logs.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clean_audit_logs()
