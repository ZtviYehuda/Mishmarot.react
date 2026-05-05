import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv('backend/.env')

def check_schema():
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'postgres'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASS', '8245'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'feedbacks'")
        columns = cur.fetchall()
        if not columns:
            print("Table 'feedbacks' not found!")
            return
            
        print("Table: feedbacks")
        for col in columns:
            print(f"Column: {col['column_name']}, Type: {col['data_type']}, Nullable: {col['is_nullable']}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
