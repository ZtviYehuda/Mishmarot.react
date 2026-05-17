import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def check_raw_logs_today():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"

    print(f"Checking all logs for {target_date}...")
    cur.execute(
        """
        SELECT st.name, COUNT(*)
        FROM attendance_logs al
        JOIN status_types st ON al.status_type_id = st.id
        WHERE DATE(al.start_datetime) <= %s 
        AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
        GROUP BY st.name
    """,
        (target_date, target_date),
    )
    rows = cur.fetchall()
    for name, count in rows:
        print(f"Status: {name} | Count: {count}")

    conn.close()


if __name__ == "__main__":
    check_raw_logs_today()
