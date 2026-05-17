import os
import sys
from datetime import date

# Add current directory to path
sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def check_data():
    conn = get_db_connection()
    cur = conn.cursor()

    target_date = "2026-02-23"
    print(f"Checking logs for {target_date}...")

    # 1. Count logs for today
    cur.execute(
        "SELECT COUNT(*) FROM attendance_logs WHERE DATE(start_datetime) = %s",
        (target_date,),
    )
    count = cur.fetchone()[0]
    print(f"Total logs starting today: {count}")

    # 2. Check if they are verified
    cur.execute(
        "SELECT is_verified, COUNT(*) FROM attendance_logs WHERE DATE(start_datetime) = %s GROUP BY is_verified",
        (target_date,),
    )
    verified_counts = cur.fetchall()
    print(f"Verified counts: {verified_counts}")

    # 3. Check status types is_presence and is_persistent
    cur.execute(
        """
        SELECT st.name, st.is_presence, st.is_persistent, COUNT(*) 
        FROM attendance_logs al
        JOIN status_types st ON al.status_type_id = st.id
        WHERE DATE(al.start_datetime) = %s
        GROUP BY st.name, st.is_presence, st.is_persistent
    """,
        (target_date,),
    )
    status_stats = cur.fetchall()
    print(f"Status stats for today: {status_stats}")

    # 4. Try the LATERAL JOIN for a few employees
    cur.execute(
        "SELECT id, first_name, last_name FROM employees WHERE is_active = TRUE LIMIT 5"
    )
    emps = cur.fetchall()
    for eid, fname, lname in emps:
        cur.execute(
            """
            SELECT st.name, al.start_datetime, al.end_datetime, al.is_verified
            FROM attendance_logs al
            JOIN status_types st ON al.status_type_id = st.id
            WHERE al.employee_id = %s
            AND DATE(al.start_datetime) <= %s
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
            AND (st.is_persistent = TRUE OR DATE(al.start_datetime) = %s)
            ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
        """,
            (eid, target_date, target_date, target_date),
        )
        res = cur.fetchone()
        print(f"Employee {fname} {lname} (ID {eid}): {res}")

    conn.close()


if __name__ == "__main__":
    check_data()
