from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


def check_codes():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        return
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 5")
        rows = cur.fetchall()
        for row in rows:
            print(
                f"ID: {row['id']}, Email: {row['email']}, Created: {row['created_at']}, Used: {row['is_used']}"
            )
    finally:
        conn.close()


if __name__ == "__main__":
    check_codes()
