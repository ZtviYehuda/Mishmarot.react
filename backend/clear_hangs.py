import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def clear_hangs():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("Clearing hanging audit_logs queries...")
        cur.execute("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE query ILIKE '%audit_logs%'
              AND state = 'active'
              AND pid != pg_backend_pid();
        """)
        rows = cur.fetchall()
        print(f"Terminated {len(rows)} sessions.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clear_hangs()
