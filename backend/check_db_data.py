import os
import psycopg2
from dotenv import load_dotenv

def check_db():
    load_dotenv()
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        cur = conn.cursor()
        
        # 1. Active employees
        cur.execute("SELECT COUNT(*) FROM employees WHERE is_active=True")
        print(f"Active employees: {cur.fetchone()[0]}")
        
        # 2. Employees by Dept
        cur.execute("""
            SELECT d.name, COUNT(e.id) 
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            WHERE e.is_active=True
            GROUP BY d.name
        """)
        print("\nEmployees per Dept:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]}")
            
        # 3. Attendance Logs today
        cur.execute("""
            SELECT COUNT(*) 
            FROM attendance_logs al
            JOIN status_types st ON al.status_type_id = st.id
            WHERE (al.end_datetime IS NULL OR al.end_datetime >= CURRENT_DATE)
            AND al.start_datetime <= CURRENT_TIMESTAMP
        """)
        print(f"\nActive logs right now: {cur.fetchone()[0]}")
        
        # 4. Check status types presence flag
        cur.execute("SELECT name, is_presence FROM status_types")
        print("\nStatus Types Presence:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
