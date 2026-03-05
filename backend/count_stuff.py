import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def count_stuff():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM employees WHERE is_active = TRUE AND personal_number != 'admin'"
    )
    print(f"Total Active Employees: {cur.fetchone()[0]}")

    target_date = "2026-02-23"
    # Count how many employees HAVE a status matching our condition
    query = """
        SELECT COUNT(*)
        FROM employees e
        JOIN LATERAL (
            SELECT al.id 
            FROM attendance_logs al
            JOIN status_types sti ON al.status_type_id = sti.id
            WHERE al.employee_id = e.id 
            AND DATE(al.start_datetime) <= %s 
            AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s) 
            AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s)
            ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
        ) al ON true
        WHERE e.is_active = TRUE AND e.personal_number != 'admin'
    """
    cur.execute(query, (target_date, target_date, target_date))
    print(f"Employees with found status: {cur.fetchone()[0]}")

    conn.close()


if __name__ == "__main__":
    count_stuff()
