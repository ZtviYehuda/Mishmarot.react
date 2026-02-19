from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


def list_emails():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT personal_number, email FROM employees WHERE email IS NOT NULL"
        )
        rows = cur.fetchall()
        for row in rows:
            print(f"PN: {row['personal_number']}, Email: {row['email']}")
    finally:
        conn.close()


if __name__ == "__main__":
    list_emails()
