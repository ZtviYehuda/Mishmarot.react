import sys
import os

# Add the current directory to sys.path to find 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash
import random
from datetime import datetime, timedelta

def generate_data():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB.")
        return

    try:
        cur = conn.cursor()
        
        print("Cleaning up existing data...")
        cur.execute("DELETE FROM attendance_logs")
        cur.execute("DELETE FROM transfer_requests")
        cur.execute("DELETE FROM employees")
        cur.execute("UPDATE teams SET commander_id = NULL")
        cur.execute("UPDATE sections SET commander_id = NULL")
        cur.execute("UPDATE departments SET commander_id = NULL")

        # Constants
        pw_hash = generate_password_hash("123456")
        cities = ["תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה"]
        first_names = ["דני", "יוסי", "משה", "אברהם", "יצחק", "רון", "איתי", "נועם", "גיא", "אורי", "מיכל", "דנה", "עדי", "נועה", "מאיה", "רון", "שירה", "עמית", "ליה", "גאיה"]
        last_names = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "מלכה", "אזולאי", "חדד", "גבאי", "סבאג", "אוחנה", "דהן", "שלום", "וקנין", "יצחק", "חן", "ברק", "עוז"]

        # Structure from user
        depts = [6, 7, 8, 9, 10]
        sections = [
            (14, 6), (15, 6), (16, 7), (17, 8), (18, 9), (19, 9), (20, 10)
        ]
        teams = [
            (21, 14, 6), (22, 14, 6), (23, 15, 6), (24, 15, 6),
            (25, 16, 7), (26, 16, 7), (27, 17, 8), (28, 18, 9),
            (29, 19, 9), (30, 20, 10), (31, 20, 10)
        ]

        # 0. Fetch Status Types
        cur.execute("SELECT id FROM status_types")
        status_ids = [row[0] for row in cur.fetchall()]
        
        def add_attendance_history(emp_id, reporter_id):
            # Create logs for the last 7 days
            now = datetime.now()
            for day in range(7, -1, -1):
                log_date = now - timedelta(days=day)
                # Morning status
                start_time = log_date.replace(hour=8, minute=0, second=0)
                status = random.choice(status_ids)
                cur.execute("""
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by, note)
                    VALUES (%s, %s, %s, %s, %s)
                """, (emp_id, status, start_time, reporter_id, "דיווח בוקר אוטומטי"))

        def get_random_dates():
            birth = datetime(random.randint(1980, 2005), random.randint(1, 12), random.randint(1, 28))
            enlist = birth + timedelta(days=365 * 18 + random.randint(0, 365 * 5))
            assign = enlist + timedelta(days=random.randint(30, 365 * 2))
            discharge = enlist + timedelta(days=365 * 25) # Assuming 25 years career for dummy data
            return birth, enlist, assign, discharge

        print("Creating Admin...")
        cur.execute("""
            INSERT INTO employees (
                first_name, last_name, personal_number, national_id, password_hash, 
                is_admin, is_commander, must_change_password, city, birth_date, 
                enlistment_date, assignment_date, discharge_date, security_clearance, police_license
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, ("Admin", "System", "admin", "000000000", pw_hash, True, True, False, "תל אביב", "1985-01-01", "2003-01-01", "2003-06-01", "2028-01-01", 3, True))
        admin_id = cur.fetchone()[0]
        add_attendance_history(admin_id, admin_id)

        # 1. Create Department Commanders (5)
        print("Creating Department Commanders...")
        for i, d_id in enumerate(depts):
            p_num = f"600{i+1}"
            n_id = f"1000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute("""
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, d_id, True, random.choice(cities), b, e, a, dis, 3, True, 1, True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE departments SET commander_id = %s WHERE id = %s", (emp_id, d_id))
            add_attendance_history(emp_id, admin_id)

        # 2. Create Section Commanders (7)
        print("Creating Section Commanders...")
        for i, (s_id, d_id) in enumerate(sections):
            p_num = f"700{i+1}"
            n_id = f"2000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute("""
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, section_id, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, s_id, d_id, True, random.choice(cities), b, e, a, dis, 3, True, random.randint(1, 2), True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE sections SET commander_id = %s WHERE id = %s", (emp_id, s_id))
            add_attendance_history(emp_id, admin_id)

        # 3. Create Team Commanders (11)
        print("Creating Team Commanders...")
        for i, (t_id, s_id, d_id) in enumerate(teams):
            p_num = f"800{i+1}"
            n_id = f"3000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute("""
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, team_id, section_id, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, t_id, s_id, d_id, True, random.choice(cities), b, e, a, dis, 2, True, random.randint(1, 2), True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp_id, t_id))
            add_attendance_history(emp_id, admin_id)

        # 4. Create Regular Officers (7 remaining)
        print("Creating Regular Officers...")
        for i in range(7):
            p_num = f"100{i+1}"
            n_id = f"4000000{i:02d}"
            b, e, a, dis = get_random_dates()
            t_id, s_id, d_id = random.choice(teams)
            cur.execute("""
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, team_id, section_id, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, False, t_id, s_id, d_id, True, random.choice(cities), b, e, a, dis, random.randint(0, 2), random.choice([True, False]), random.randint(3, 8), True))
            emp_id = cur.fetchone()[0]
            add_attendance_history(emp_id, admin_id)

        conn.commit()
        print("✅ Successfully reset data and generated 30 dummy employees + Admin with full profiles and history.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    generate_data()
