import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def check_dashboard():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"

    print(f"Checking Dashboard Stats for {target_date}...")

    query = """
        SELECT 
            st.name as status_name,
            st.is_presence,
            st.is_persistent,
            COUNT(e.id) as count
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
        LEFT JOIN status_types st ON al.status_type_id = st.id
        WHERE e.is_active = TRUE AND e.personal_number != 'admin'
        GROUP BY st.name, st.is_presence, st.is_persistent
    """
    cur.execute(query, (target_date, target_date, target_date))
    rows = cur.fetchall()

    print(f"{'Status':<20} | {'Presence':<10} | {'Persistent':<10} | {'Count':<5}")
    print("-" * 60)
    for r in rows:
        print(f"{str(r[0]):<20} | {str(r[1]):<10} | {str(r[2]):<10} | {r[3]:<5}")

    conn.close()


if __name__ == "__main__":
    check_dashboard()
