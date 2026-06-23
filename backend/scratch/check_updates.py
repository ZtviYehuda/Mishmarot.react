import psycopg2
from app.config import Config

def check():
    conn = psycopg2.connect(
        host=Config.DB_HOST,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASS,
        port=Config.DB_PORT
    )
    try:
        cur = conn.cursor()
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'system_updates'")
        print("COLUMNS:")
        for r in cur.fetchall():
            print(r)
        
        cur.execute("SELECT * FROM system_updates")
        print("\nROWS:")
        for r in cur.fetchall():
            print(r)
    finally:
        conn.close()

if __name__ == "__main__":
    check()
