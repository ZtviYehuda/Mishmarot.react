import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def find_missing_logs():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"

    print(f"Finding employees with missing logs for {target_date}...")

    cur.execute(
        """
        SELECT e.id, e.first_name, e.last_name
        FROM employees e
        LEFT JOIN LATERAL (
            SELECT al.id 
            FROM attendance_logs al
            JOIN status_types sti ON al.status_type_id = sti.id
            WHERE al.employee_id = e.id 
            AND DATE(al.start_datetime) <= %s 
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s) 
            AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s)
            ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
        ) al ON true
        WHERE e.is_active = TRUE AND e.personal_number != 'admin' AND al.id IS NULL
        LIMIT 5
    """,
        (target_date, target_date, target_date),
    )
    missing = cur.fetchall()

    for eid, fname, lname in missing:
        print(f"\nEmployee: {fname} {lname} (ID: {eid})")
        # Check ALL logs for this employee
        cur.execute(
            """
            SELECT al.id, st.name, al.start_datetime, al.end_datetime, st.is_persistent
            FROM attendance_logs al
            JOIN status_types st ON al.status_type_id = st.id
            WHERE al.employee_id = %s
            ORDER BY al.start_datetime DESC LIMIT 5
        """,
            (eid,),
        )
        logs = cur.fetchall()
        for l in logs:
            print(f"  - Log: {l}")

    conn.close()


if __name__ == "__main__":
    find_missing_logs()
