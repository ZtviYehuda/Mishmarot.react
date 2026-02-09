import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

def check_columns():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'postgres'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASS', '8245'),
            port=os.getenv('DB_PORT', 5435)
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'")
        columns = [row['column_name'] for row in cur.fetchall()]
        print("Columns in employees table:")
        for col in columns:
            print(f"- {col}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
