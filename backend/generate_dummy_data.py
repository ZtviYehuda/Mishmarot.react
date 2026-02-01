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
        cities = [
            "תל אביב",
            "ירושלים",
            "חיפה",
            "ראשון לציון",
            "פתח תקווה",
            "אשדוד",
            "נתניה",
            "באר שבע",
            "בני ברק",
            "חולון",
            "רמת גן",
            "אשקלון",
            "רחובות",
            "בת ים",
            "כפר סבא",
            "הרצליה",
            "מודיעין",
            "נס ציונה",
        ]
        first_names = [
            "דני",
            "יוסי",
            "משה",
            "אברהם",
            "יצחק",
            "רון",
            "איתי",
            "נועם",
            "גיא",
            "אורי",
            "מיכל",
            "דנה",
            "עדי",
            "נועה",
            "מאיה",
            "שירה",
            "עמית",
            "ליה",
            "גאיה",
            "אלון",
            "תמר",
            "יעל",
            "אופיר",
            "שי",
            "טל",
            "רועי",
            "ליאור",
            "ענבל",
            "אסף",
            "מור",
            "יובל",
            "שחר",
            "ניר",
            "הדר",
            "עידו",
            "רותם",
            "אלעד",
            "כרמל",
            "דור",
            "אביב",
            "סהר",
            "ערן",
            "נטע",
            "אדיר",
            "לירון",
            "מיטל",
            "אלה",
            "בר",
            "זוהר",
            "קרן",
        ]
        last_names = [
            "כהן",
            "לוי",
            "מזרחי",
            "פרץ",
            "ביטון",
            "אברהם",
            "פרידמן",
            "מלכה",
            "אזולאי",
            "חדד",
            "גבאי",
            "סבאג",
            "אוחנה",
            "דהן",
            "שלום",
            "וקנין",
            "יצחק",
            "חן",
            "ברק",
            "עוז",
            "שמש",
            "אלון",
            "גולן",
            "כץ",
            "רוזן",
            "שפירא",
            "גרין",
            "ברגר",
            "סלע",
            "נחום",
            "אשכנזי",
            "ספרדי",
            "מור",
            "זהבי",
            "ארד",
            "גל",
            "שחר",
            "אור",
            "נוי",
            "טל",
            "רז",
            "עמית",
            "שני",
            "אדר",
            "ניסן",
            "תמוז",
            "אייר",
            "אלול",
        ]

        # Structure from user
        depts = [6, 7, 8, 9, 10]
        sections = [(14, 6), (15, 6), (16, 7), (17, 8), (18, 9), (19, 9), (20, 10)]
        teams = [
            (21, 14, 6),
            (22, 14, 6),
            (23, 15, 6),
            (24, 15, 6),
            (25, 16, 7),
            (26, 16, 7),
            (27, 17, 8),
            (28, 18, 9),
            (29, 19, 9),
            (30, 20, 10),
            (31, 20, 10),
        ]

        # 0. Fetch Status Types
        cur.execute("SELECT id FROM status_types")
        status_ids = [row[0] for row in cur.fetchall()]

        def add_attendance_history(emp_id, reporter_id):
            # Create logs for random days within the last 7 days
            now = datetime.now()
            # Select random days (between 2 to 6 days) out of the last 8 days (0-7)
            days_to_update = sorted(
                random.sample(range(8), k=random.randint(2, 6)), reverse=True
            )

            for day in days_to_update:
                log_date = now - timedelta(days=day)
                # Morning status
                start_time = log_date.replace(hour=8, minute=0, second=0)
                status = random.choice(status_ids)

                # Close any previous open log for this employee to keep data clean
                cur.execute(
                    "UPDATE attendance_logs SET end_datetime = %s WHERE employee_id = %s AND end_datetime IS NULL",
                    (start_time, emp_id),
                )

                cur.execute(
                    """
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by, note)
                    VALUES (%s, %s, %s, %s, %s)
                """,
                    (emp_id, status, start_time, reporter_id, "דיווח בוקר אוטומטי"),
                )

        def get_random_dates():
            birth = datetime(
                random.randint(1980, 2005), random.randint(1, 12), random.randint(1, 28)
            )
            enlist = birth + timedelta(days=365 * 18 + random.randint(0, 365 * 5))
            assign = enlist + timedelta(days=random.randint(30, 365 * 2))
            discharge = enlist + timedelta(
                days=365 * 25
            )  # Assuming 25 years career for dummy data
            return birth, enlist, assign, discharge

        print("Creating Admin...")
        cur.execute(
            """
            INSERT INTO employees (
                first_name, last_name, personal_number, national_id, password_hash, 
                is_admin, is_commander, must_change_password, city, birth_date, 
                enlistment_date, assignment_date, discharge_date, security_clearance, police_license
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """,
            (
                "Admin",
                "System",
                "admin",
                "000000000",
                pw_hash,
                True,
                True,
                False,
                "תל אביב",
                "1985-01-01",
                "2003-01-01",
                "2003-06-01",
                "2028-01-01",
                3,
                True,
            ),
        )
        admin_id = cur.fetchone()[0]
        add_attendance_history(admin_id, admin_id)

        # Helper functions for generating contact info
        def generate_phone():
            prefixes = ["050", "052", "053", "054", "055", "058"]
            return f"{random.choice(prefixes)}-{random.randint(1000000, 9999999)}"

        def generate_emergency_contact():
            contact_names = ["אמא", "אבא", "בן/בת זוג", "אח/אחות", "חבר/ה"]
            return f"{random.choice(contact_names)} - {generate_phone()}"

        # 1. Create Department Commanders (5)
        print("Creating Department Commanders...")
        for i, d_id in enumerate(depts):
            p_num = f"600{i+1}"
            n_id = f"1000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute(
                """
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password, phone_number, emergency_contact
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """,
                (
                    p_num,
                    n_id,
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    d_id,
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    3,
                    True,
                    1,
                    True,
                    generate_phone(),
                    generate_emergency_contact(),
                ),
            )
            emp_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE departments SET commander_id = %s WHERE id = %s", (emp_id, d_id)
            )
            add_attendance_history(emp_id, admin_id)

        # 2. Create Section Commanders (7)
        print("Creating Section Commanders...")
        for i, (s_id, d_id) in enumerate(sections):
            p_num = f"700{i+1}"
            n_id = f"2000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute(
                """
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, section_id, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password, phone_number, emergency_contact
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """,
                (
                    p_num,
                    n_id,
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    s_id,
                    d_id,
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    3,
                    True,
                    random.randint(1, 2),
                    True,
                    generate_phone(),
                    generate_emergency_contact(),
                ),
            )
            emp_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE sections SET commander_id = %s WHERE id = %s", (emp_id, s_id)
            )
            add_attendance_history(emp_id, admin_id)

        # 3. Create Team Commanders (11)
        print("Creating Team Commanders...")
        for i, (t_id, s_id, d_id) in enumerate(teams):
            p_num = f"800{i+1}"
            n_id = f"3000000{i:02d}"
            b, e, a, dis = get_random_dates()
            cur.execute(
                """
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, team_id, section_id, department_id, is_active, city, birth_date,
                    enlistment_date, assignment_date, discharge_date, security_clearance, police_license,
                    service_type_id, must_change_password, phone_number, emergency_contact
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """,
                (
                    p_num,
                    n_id,
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    t_id,
                    s_id,
                    d_id,
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    2,
                    True,
                    random.randint(1, 2),
                    True,
                    generate_phone(),
                    generate_emergency_contact(),
                ),
            )
            emp_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE teams SET commander_id = %s WHERE id = %s", (emp_id, t_id)
            )
            add_attendance_history(emp_id, admin_id)

        # 4. Create Regular Officers (50 officers with diverse data)
        print("Creating Regular Officers...")

        for i in range(50):
            p_num = f"100{i+1:02d}"
            n_id = f"4000000{i:02d}"
            if i < 3:
                # Force birthday to be today for testing
                today = datetime.now()
                year = random.randint(1980, 2000)
                b = datetime(year, today.month, today.day)
                e = b + timedelta(days=365 * 18)
                a = e + timedelta(days=90)
                dis = e + timedelta(days=365 * 25)
            else:
                b, e, a, dis = get_random_dates()
            t_id, s_id, d_id = random.choice(teams)

            # Generate diverse data
            phone = generate_phone()
            emergency = generate_emergency_contact()
            city = random.choice(cities)
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)

            # Varied attributes
            security_level = random.randint(0, 3)  # 0-3 security clearance levels
            has_police_license = random.choice([True, False])
            service_type = random.randint(1, 8)  # Assuming service_types 1-8 exist

            cur.execute(
                """
                INSERT INTO employees (
                    personal_number, national_id, first_name, last_name, password_hash, 
                    is_commander, team_id, section_id, department_id, is_active, 
                    city, birth_date, enlistment_date, assignment_date, discharge_date, 
                    security_clearance, police_license, service_type_id, must_change_password,
                    phone_number, emergency_contact
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """,
                (
                    p_num,
                    n_id,
                    first_name,
                    last_name,
                    pw_hash,
                    False,
                    t_id,
                    s_id,
                    d_id,
                    True,
                    city,
                    b,
                    e,
                    a,
                    dis,
                    security_level,
                    has_police_license,
                    service_type,
                    True,
                    phone,
                    emergency,
                ),
            )
            emp_id = cur.fetchone()[0]
            add_attendance_history(emp_id, admin_id)

        conn.commit()
        print(
            "✅ Successfully reset data and generated 73 dummy employees (1 Admin + 5 Dept Commanders + 7 Section Commanders + 11 Team Commanders + 50 Regular Officers) with full profiles and history."
        )

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    generate_data()
