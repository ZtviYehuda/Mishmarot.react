import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load .env
dotenv_path = os.path.join(os.getcwd(), '.env')
load_dotenv(dotenv_path)

def check_users():
    try:
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST"),
            database=os.environ.get("DB_NAME"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASS"),
            port=os.environ.get("DB_PORT")
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- ACTIVE USERS ---")
        cur.execute("SELECT id, username, first_name, last_name, is_admin, is_commander, is_active FROM employees WHERE is_active = TRUE")
        users = cur.fetchall()
        for u in users:
            print(f"ID: {u['id']} | User: {u['username']} | Name: {u['first_name']} {u['last_name']} | Admin: {u['is_admin']} | Cmd: {u['is_commander']}")
            
        print("\n--- ALL USERS (Limited) ---")
        cur.execute("SELECT id, username, is_active FROM employees LIMIT 10")
        all_users = cur.fetchall()
        for u in all_users:
            print(f"ID: {u['id']} | User: {u['username']} | Active: {u['is_active']}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
