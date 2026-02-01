import sys
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import Config


def get_connection():
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASS,
            port=Config.DB_PORT,
        )
        return conn
    except Exception as e:
        print(f"Connection failed: {e}")
        return None


def check_structure_gaps():
    conn = get_connection()
    if not conn:
        return
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # 1. Employees with NO department (Global Unassigned)
    cur.execute(
        """
        SELECT count(*) 
        FROM employees e
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
        WHERE e.is_active = TRUE AND d.id IS NULL AND e.personal_number != 'admin'
    """
    )
    no_dept = cur.fetchone()["count"]
    print(f"Employees with NO Department (Global 'Other'): {no_dept}")

    # 2. Employees with Department but NO Section (Dept HQ)
    cur.execute(
        """
        SELECT count(*)
        FROM employees e
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
        WHERE e.is_active = TRUE AND d.id IS NOT NULL AND s.id IS NULL AND e.personal_number != 'admin'
    """
    )
    dept_hq = cur.fetchone()["count"]
    print(f"Employees in Dept but NO Section (Dept HQ): {dept_hq}")

    # 3. Employees with Section but NO Team (Section HQ)
    cur.execute(
        """
        SELECT count(*)
        FROM employees e
        LEFT JOIN teams t ON e.team_id = t.id
        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
        WHERE e.is_active = TRUE AND s.id IS NOT NULL AND t.id IS NULL AND e.personal_number != 'admin'
    """
    )
    sect_hq = cur.fetchone()["count"]
    print(f"Employees in Section but NO Team (Section HQ): {sect_hq}")

    conn.close()


if __name__ == "__main__":
    check_structure_gaps()
