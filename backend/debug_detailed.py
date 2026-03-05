import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def check_all():
    conn = get_db_connection()
    cur = conn.cursor()

    target_date = "2026-02-23"
    print(f"Target Date: {target_date}")

    # Check all logs for a specific employee that appears filled in roster
    # Let's find one employee who has many logs in roster
    cur.execute(
        "SELECT id, first_name, last_name FROM employees WHERE is_active = TRUE LIMIT 20"
    )
    emps = cur.fetchall()

    print("\nDetailed Log Check for first 20 employees:")
    for eid, fname, lname in emps:
        cur.execute(
            """
            SELECT al.id, st.name, al.start_datetime, al.end_datetime, al.is_verified, st.is_presence, st.is_persistent
            FROM attendance_logs al
            JOIN status_types st ON al.status_type_id = st.id
            WHERE al.employee_id = %s
            AND DATE(al.start_datetime) <= %s
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
            ORDER BY al.start_datetime DESC
        """,
            (eid, target_date, target_date),
        )
        logs = cur.fetchall()
        if logs:
            print(
                f"Employee {fname} {lname} (ID {eid}): {len(logs)} overlapping logs found"
            )
            for l in logs:
                print(f"  - {l}")
        else:
            print(f"Employee {fname} {lname} (ID {eid}): NO LOGS FOUND")

    # Check the count of employees who would match the status_condition
    cur.execute(
        """
        SELECT COUNT(*) 
        FROM employees e
        LEFT JOIN LATERAL (
            SELECT al.status_type_id, al.id 
            FROM attendance_logs al
            JOIN status_types sti ON al.status_type_id = sti.id
            WHERE al.employee_id = e.id 
            AND DATE(al.start_datetime) <= %s 
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s) 
            AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s)
            ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
        ) al ON true
        WHERE e.is_active = TRUE AND e.personal_number != 'admin' AND al.id IS NOT NULL
    """,
        (target_date, target_date, target_date),
    )
    match_count = cur.fetchone()[0]
    print(f"\nEmployees with matching log via Smart Continuity: {match_count}")

    conn.close()


if __name__ == "__main__":
    check_all()
