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
        cur.execute("DELETE FROM notification_reads")
        cur.execute("DELETE FROM employees")
        cur.execute("DELETE FROM teams")
        cur.execute("DELETE FROM sections")
        cur.execute("DELETE FROM departments")

        # Reset sequences
        sequences = [
            "departments_id_seq",
            "sections_id_seq",
            "teams_id_seq",
            "employees_id_seq",
        ]
        for seq in sequences:
            try:
                cur.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
            except:
                pass

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
            "רעננה",
            "גבעתיים",
            "הוד השרון",
            "מודיעין עילית",
            "ביתר עילית",
            "אלעד",
        ]

        # Extended list of names
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
            "איילת",
            "אורן",
            "עומר",
            "רביד",
            "שקד",
            "שני",
            "ליאור",
            "דניאל",
            "יניב",
            "שירי",
            "נטלי",
            "סיון",
            "מירב",
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
            "קדוש",
            "ביבס",
            "אמסלם",
            "צור",
            "יער",
            "פלד",
            "הראל",
        ]

        # 0. Create Departments (Real Data Names)
        print("Creating Departments...")
        # Define hierarchy
        structure = {
            "מחלקת טכנולוגיות": {
                "מדור הסייבר המבצעי": [
                    'חוליית מו"פ',
                    "חוליית סייבר מבצעי",
                    "חוליית נגישות בסייבר",
                ],
                "מדור מערכות הסייבר": [
                    "חוליית חברות תקשורת",
                    "חולייה פרויקטים ואמצעים",
                ],
                'מדור סיגמ"ה': [
                    "חוליית אמצעי קצה",
                    "חוליית סיוע מבצעי",
                    "חוליית מענים מהירים",
                ],
            },
            "מחלקת התעצמות": {
                "מדור תכנון ייעודי ואסטרטגיה": [
                    "חוליית תקציב",
                    "חוליית מערכה (אורית)",
                    "חוליית מערכה (רפאל)",
                    'חוליית נ"מ',
                    'חוליית קש"ח ושותפויות',
                ],
                "מדור הכוונה מבצעית": [
                    "חוליית הפקה ארצית",
                    'חוליית ב"ר',
                    "חוליית סייבר",
                    'חוליית מחת"ק',
                    "חוליית בקרות",
                ],
            },
            "מחלקת מענה מבצעי": {
                "מדור שטח": [
                    'חוליית מ"מ',
                    "חוליית ביטחון מידע וחסיונות",
                    'חוליית חות"ם',
                    'חוליית חוס"ם',
                ],
                "מדור יחידות ארציות": [
                    "חוליית סלע",
                    "חוליית שהם",
                    "חוליית רשויות",
                    "חוליית קיסר",
                ],
                "מדור שליטה מבצעית": [
                    "חוליית 7100",
                    "חוליית 7103",
                    'חוליית משל"ט טכנו סיגינטי',
                ],
                "מדור סייבר ארצי": ['חוליית מס"א', "חוליית קריפטו"],
            },
        }

        departments_objs = []
        sections_objs = []
        teams_objs = []

        # Build DB Structure
        for dept_name, sections_data in structure.items():
            cur.execute(
                "INSERT INTO departments (name) VALUES (%s) RETURNING id", (dept_name,)
            )
            dept_id = cur.fetchone()[0]
            departments_objs.append({"id": dept_id})

            for section_name, team_names in sections_data.items():
                cur.execute(
                    "INSERT INTO sections (name, department_id) VALUES (%s, %s) RETURNING id",
                    (section_name, dept_id),
                )
                section_id = cur.fetchone()[0]
                sections_objs.append({"id": section_id, "dept_id": dept_id})

                for team_name in team_names:
                    cur.execute(
                        "INSERT INTO teams (name, section_id) VALUES (%s, %s) RETURNING id",
                        (team_name, section_id),
                    )
                    team_id = cur.fetchone()[0]
                    teams_objs.append(
                        {"id": team_id, "section_id": section_id, "dept_id": dept_id}
                    )

        # 3. Fetch Status & Service Types
        cur.execute("SELECT id FROM status_types")
        status_ids = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT id FROM service_types")
        service_type_ids = [row[0] for row in cur.fetchall()]

        # Ensure we have service types if empty (fallback)
        if not service_type_ids:
            service_type_ids = [1, 2]  # Fallback

        def add_attendance_history(emp_id, reporter_id):
            now = datetime.now()
            days_to_update = sorted(
                random.sample(range(8), k=random.randint(4, 7)), reverse=True
            )
            for day in days_to_update:
                log_date = now - timedelta(days=day)
                start_time = log_date.replace(
                    hour=8, minute=random.randint(0, 59), second=0
                )
                status = random.choice(status_ids)
                cur.execute(
                    "INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by, note) VALUES (%s, %s, %s, %s, %s)",
                    (emp_id, status, start_time, reporter_id, "דיווח מערכת"),
                )

        def get_random_dates():
            birth = datetime(
                random.randint(1975, 2005), random.randint(1, 12), random.randint(1, 28)
            )
            enlist = birth + timedelta(days=365 * 18 + random.randint(0, 365 * 10))
            assign = enlist + timedelta(days=random.randint(30, 365 * 3))
            discharge = enlist + timedelta(days=365 * 30)
            return birth, enlist, assign, discharge

        # 4. Create Admin
        print("Creating Admin...")
        b, e, a, dis = get_random_dates()
        cur.execute(
            """INSERT INTO employees (first_name, last_name, personal_number, national_id, password_hash, is_admin, is_commander, must_change_password, city, birth_date, enlistment_date, assignment_date, discharge_date, security_clearance, police_license)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (
                "Admin",
                "System",
                "admin",
                "000000000",
                pw_hash,
                True,
                True,
                False,
                "ירושלים",
                b,
                e,
                a,
                dis,
                3,
                True,
            ),
        )
        admin_id = cur.fetchone()[0]
        add_attendance_history(admin_id, admin_id)

        # Helper for unique IDs
        used_pnums = set(["admin"])
        used_nids = set(["000000000"])

        def get_unique_id(prefix, used_set, length=9):
            while True:
                val = prefix + "".join(
                    [str(random.randint(0, 9)) for _ in range(length - len(prefix))]
                )
                if val not in used_set:
                    used_set.add(val)
                    return val

        # 5. Create Commanders for Departments
        print("Creating Dept Commanders...")
        for dept in departments_objs:
            b, e, a, dis = get_random_dates()
            cur.execute(
                """INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, department_id, is_active, city, birth_date, enlistment_date, assignment_date, discharge_date, security_clearance, police_license, service_type_id, must_change_password)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    get_unique_id("60", used_pnums, 6),
                    get_unique_id("11", used_nids, 9),
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    dept["id"],
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    3,
                    True,
                    1,
                    False,
                ),
            )
            c_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE departments SET commander_id = %s WHERE id = %s",
                (c_id, dept["id"]),
            )
            add_attendance_history(c_id, admin_id)

        # 6. Create Commanders for Sections
        print("Creating Section Commanders...")
        for section in sections_objs:
            b, e, a, dis = get_random_dates()
            cur.execute(
                """INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, section_id, department_id, is_active, city, birth_date, enlistment_date, assignment_date, discharge_date, security_clearance, police_license, service_type_id, must_change_password)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    get_unique_id("70", used_pnums, 6),
                    get_unique_id("22", used_nids, 9),
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    section["id"],
                    section["dept_id"],
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    3,
                    True,
                    random.randint(1, 2),
                    False,
                ),
            )
            c_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE sections SET commander_id = %s WHERE id = %s",
                (c_id, section["id"]),
            )
            add_attendance_history(c_id, admin_id)

        # 7. Create Commanders for Teams
        print("Creating Team Commanders...")
        for team in teams_objs:
            b, e, a, dis = get_random_dates()
            cur.execute(
                """INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, team_id, section_id, department_id, is_active, city, birth_date, enlistment_date, assignment_date, discharge_date, security_clearance, police_license, service_type_id, must_change_password)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    get_unique_id("80", used_pnums, 6),
                    get_unique_id("33", used_nids, 9),
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    True,
                    team["id"],
                    team["section_id"],
                    team["dept_id"],
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    2,
                    True,
                    random.randint(1, 2),
                    False,
                ),
            )
            c_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE teams SET commander_id = %s WHERE id = %s", (c_id, team["id"])
            )
            add_attendance_history(c_id, admin_id)

        # 8. Create 130 Regular Officers distributed across teams
        print("Creating 130 Regular Officers...")
        for i in range(130):
            p_num = get_unique_id("10", used_pnums, 6)
            n_id = get_unique_id("44", used_nids, 9)
            b, e, a, dis = get_random_dates()
            team = random.choice(teams_objs)

            # Ensure proper service types
            st_id = random.choice(service_type_ids)

            cur.execute(
                """INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, team_id, section_id, department_id, is_active, city, birth_date, enlistment_date, assignment_date, discharge_date, security_clearance, police_license, service_type_id, must_change_password, phone_number)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    p_num,
                    n_id,
                    random.choice(first_names),
                    random.choice(last_names),
                    pw_hash,
                    False,
                    team["id"],
                    team["section_id"],
                    team["dept_id"],
                    True,
                    random.choice(cities),
                    b,
                    e,
                    a,
                    dis,
                    random.randint(0, 3),
                    random.choice([True, False]),
                    st_id,
                    True,
                    f"050-{random.randint(1000000, 9999999)}",
                ),
            )
            emp_id = cur.fetchone()[0]
            add_attendance_history(emp_id, admin_id)

        conn.commit()
        print(
            f"✅ Real Data restored and diversified. Created structure with {len(departments_objs)} Departments, {len(sections_objs)} Sections, {len(teams_objs)} Teams, and Commanders/Employees."
        )

    except Exception as e:
        conn.rollback()
        print(f"❌ Error during data generation: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    generate_data()
