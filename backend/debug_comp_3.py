import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def debug_comp_3():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"
    status_condition = "AND DATE(al.start_datetime) <= %s AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s) AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s)"
    status_params = [target_date, target_date, target_date]

    query = f"""
        SELECT 
            d.name as unit_name,
            COUNT(e.id) as total_count,
            COUNT(CASE WHEN st.is_presence = TRUE THEN 1 END) as present_count
        FROM employees e
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
        LEFT JOIN LATERAL (
            SELECT al.status_type_id, al.id FROM attendance_logs al
            JOIN status_types sti ON al.status_type_id = sti.id
            WHERE al.employee_id = e.id {status_condition}
            ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
        ) al ON true
        LEFT JOIN status_types st ON al.status_type_id = st.id
        WHERE e.is_active = TRUE AND e.personal_number != 'admin'
        AND d.id = 3
        GROUP BY d.name
    """
    cur.execute(query, tuple(status_params))
    res = cur.fetchone()
    print(f"Result for Dept 3: {res}")
    conn.close()


if __name__ == "__main__":
    debug_comp_3()
