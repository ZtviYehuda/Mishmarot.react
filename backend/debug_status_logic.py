import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


def check_statuses(conn):
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- Status Types ---")
    cur.execute("SELECT id, name, is_persistent FROM status_types ORDER BY id")
    for row in cur.fetchall():
        print(
            f"ID: {row['id']}, Name: {row['name']}, Persistent: {row['is_persistent']}"
        )

    print("\n--- Missing Reports Calculation ---")
    query = """
        SELECT COUNT(e.id) as count
        FROM employees e
        WHERE e.is_active = TRUE 
          AND e.personal_number != 'admin'
          AND NOT EXISTS (
              SELECT 1 FROM attendance_logs al
              JOIN status_types st ON al.status_type_id = st.id
              WHERE al.employee_id = e.id
              AND DATE(al.start_datetime) <= CURRENT_DATE
              AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
              AND (
                  DATE(al.start_datetime) = CURRENT_DATE
                  OR st.is_persistent = TRUE
              )
          )
    """
    cur.execute(query)
    res = cur.fetchone()
    print(f"Missing Reports Count (Global): {res['count']}")

    conn.close()


if __name__ == "__main__":
    conn = get_db_connection()
    if conn:
        check_statuses(conn)
    else:
        print("Failed to connect to DB")
