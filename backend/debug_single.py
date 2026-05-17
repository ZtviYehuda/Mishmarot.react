import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def debug_one_employee():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"
    eid = 143  # שירי מזרחי, from my previous check she had logs

    print(f"Debugging Employee ID {eid} for date {target_date}")

    # 1. Lateral Join subquery
    cur.execute(
        """
        SELECT al.status_type_id, al.id, sti.name, sti.is_persistent, al.start_datetime, al.end_datetime
        FROM attendance_logs al
        JOIN status_types sti ON al.status_type_id = sti.id
        WHERE al.employee_id = %s 
        AND DATE(al.start_datetime) <= %s 
        AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s) 
        AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s)
        ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
    """,
        (eid, target_date, target_date, target_date),
    )
    res = cur.fetchone()
    print(f"Latereal Join result: {res}")

    # 2. If it's NULL, check why.
    if not res:
        print("Subquery returned nothing. Checking all overlapping logs...")
        cur.execute(
            """
            SELECT al.id, st.name, al.start_datetime, al.end_datetime, st.is_persistent
            FROM attendance_logs al
            JOIN status_types st ON al.status_type_id = st.id
            WHERE al.employee_id = %s
            AND DATE(al.start_datetime) <= %s
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
        """,
            (eid, target_date, target_date),
        )
        overlaps = cur.fetchall()
        print(f"Found {len(overlaps)} overlapping logs:")
        for o in overlaps:
            print(f"  - {o}")

    conn.close()


if __name__ == "__main__":
    debug_one_employee()
