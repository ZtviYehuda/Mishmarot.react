
import psycopg2
from app.config import Config

def check_commanders():
    conn = psycopg2.connect(
        host=Config.DB_HOST,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASS,
        port=Config.DB_PORT
    )
    cur = conn.cursor()
    cur.execute("SELECT id, first_name, last_name, is_commander, is_admin FROM employees WHERE is_commander = TRUE OR is_admin = TRUE LIMIT 10")
    for row in cur.fetchall():
        print(row)
    conn.close()

if __name__ == "__main__":
    check_commanders()
