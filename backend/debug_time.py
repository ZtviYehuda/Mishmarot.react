from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


def check_db_time():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT NOW() as now")
        print(f"DB Current Time: {cur.fetchone()['now']}")

        cur.execute(
            "SELECT email, code, created_at FROM verification_codes ORDER BY created_at DESC LIMIT 5"
        )
        rows = cur.fetchall()
        for row in rows:
            print(
                f"To: {row['email']}, Code: {row['code']}, Created: {row['created_at']}"
            )
    finally:
        conn.close()


if __name__ == "__main__":
    check_db_time()
