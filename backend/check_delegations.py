import psycopg2
from app.utils.db import get_db_connection

def check_delegations():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        return
    try:
        cur = conn.cursor()
        cur.execute("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'delegations'")
        rows = cur.fetchall()
        print("Delegations Schema:")
        for row in rows:
            print(row)
        
        cur.execute("SELECT * FROM delegations ORDER BY created_at DESC LIMIT 5")
        rows = cur.fetchall()
        print("\nRecent Delegations:")
        for row in rows:
            print(row)
            
    finally:
        conn.close()

if __name__ == "__main__":
    check_delegations()
