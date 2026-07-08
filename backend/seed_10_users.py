"""
Seed at least one employee per team (all 31 teams) so every unit appears
in the org-tree, stats, and charts.
"""
import sys, io, random
from datetime import datetime, date
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

from app import create_app
from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash

app = create_app()

# ── Name pool ──────────────────────────────────────────────────────────────
FIRST_NAMES_M = [
    "יוסי", "חיים", "משה", "רוני", "אבי", "שלמה", "יעקב", "אלי", "דוד", "נחום",
    "גדי", "ברק", "עמית", "ליאור", "אורי", "נתן", "שי", "תומר", "עידו", "ירון",
    "מאיר", "גיל", "אסף", "נועם", "ראם", "אייל", "עמוס", "גבי", "ישי", "רן",
    "זיו",
]
FIRST_NAMES_F = [
    "מיכל", "יעל", "רחל", "אורית", "ענת", "רות", "שירה", "נעמה", "אביגיל", "לירון",
]
LAST_NAMES = [
    "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אברהם", "פרידמן", "מלכה", "בן דוד",
    "שפירו", "גולדברג", "רוזנברג", "גרין", "שמש", "אלון", "ברק", "שגב", "נוי", "טל",
    "אמיר", "שני", "גל", "רז", "שלם", "יוסף", "קפלן", "לוין", "שטרן", "חדד",
    "אזולאי",
]

# Birth-year pool cycling through every age bucket
def make_birth_date(idx: int) -> date:
    y = date.today().year
    buckets = [
        y - 19, y - 20, y - 21,  # 18-21
        y - 23, y - 24, y - 25,  # 22-25
        y - 27, y - 28, y - 29, y - 30,  # 26-30
        y - 32, y - 33, y - 34, y - 35,  # 31-35
        y - 37, y - 38, y - 39, y - 40,  # 36-40
        y - 43, y - 45, y - 47, y - 50,  # 41-50
        y - 52, y - 55, y - 58, y - 60,  # 50+
    ]
    birth_year = buckets[idx % len(buckets)]
    return date(birth_year, random.randint(1, 12), random.randint(1, 28))


def seed():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("ERROR: Could not connect.")
            return

        cur = conn.cursor()
        try:
            # ── 1. Clean up previous mock employees ───────────────────────────
            cur.execute("""
                UPDATE teams    SET commander_id = NULL
                WHERE commander_id IN (SELECT id FROM employees WHERE username LIKE 'user_%')
            """)
            cur.execute("""
                UPDATE sections SET commander_id = NULL
                WHERE commander_id IN (SELECT id FROM employees WHERE username LIKE 'user_%')
            """)
            cur.execute("DELETE FROM attendance_logs WHERE note = 'דיווח בדיקה גנרי'")
            cur.execute("DELETE FROM employees WHERE username LIKE 'user_%'")
            print("Cleaned up previous mock data.")

            # ── 2. Load org units ─────────────────────────────────────────────
            cur.execute("""
                SELECT t.id AS team_id, t.name AS team_name,
                       s.id AS sect_id, s.name AS sect_name,
                       d.id AS dept_id, d.name AS dept_name
                FROM teams t
                JOIN sections s ON t.section_id = s.id
                JOIN departments d ON s.department_id = d.id
                ORDER BY d.id, s.id, t.id
            """)
            teams = cur.fetchall()
            print(f"Found {len(teams)} teams to populate.\n")

            # ── 3. Service & status types ─────────────────────────────────────
            cur.execute("SELECT id FROM service_types ORDER BY id")
            service_ids = [r[0] for r in cur.fetchall()]
            if not service_ids:
                service_ids = [None]

            cur.execute("SELECT id FROM status_types WHERE parent_status_id IS NULL ORDER BY id")
            status_ids = [r[0] for r in cur.fetchall()]

            pw_hash = generate_password_hash("123456")

            # ── 4. One employee per team ──────────────────────────────────────
            inserted = 0
            for i, team in enumerate(teams):
                team_id   = team[0]
                team_name = team[1]
                sect_id   = team[2]
                # sect_name = team[3]
                dept_id   = team[4]
                # dept_name = team[5]

                fname = FIRST_NAMES_M[i % len(FIRST_NAMES_M)]
                lname = LAST_NAMES[i % len(LAST_NAMES)]
                username   = f"user_{random.randint(10000, 99999)}"
                birth_date = make_birth_date(i)
                service_id = service_ids[i % len(service_ids)]
                status_id  = status_ids[i % len(status_ids)]

                cur.execute(
                    """
                    INSERT INTO employees (
                        username, first_name, last_name, password_hash,
                        is_admin, is_commander, is_active,
                        department_id, section_id, team_id, service_type_id,
                        must_change_password, birth_date
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id
                    """,
                    (username, fname, lname, pw_hash,
                     False, False, True,
                     dept_id, sect_id, team_id, service_id,
                     False, birth_date),
                )
                emp_id = cur.fetchone()[0]

                # Today's attendance
                cur.execute(
                    """
                    INSERT INTO attendance_logs
                        (employee_id, status_type_id, start_datetime, reported_by, note)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (emp_id, status_id, datetime.now(), emp_id, "דיווח בדיקה גנרי"),
                )

                inserted += 1
                print(f"  [{inserted:02d}] {fname} {lname} → {team_name}")

            conn.commit()
            print(f"\nDone! {inserted} employees seeded across {len(teams)} teams.")

        except Exception as e:
            conn.rollback()
            print(f"ERROR: {e}")
            import traceback; traceback.print_exc()
        finally:
            cur.close()
            conn.close()


if __name__ == "__main__":
    seed()
