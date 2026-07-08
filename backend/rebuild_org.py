"""
Completely wipe and rebuild the organizational structure from scratch,
using the canonical structure defined in generate_dummy_data.py.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app import create_app
from app.utils.db import get_db_connection

app = create_app()


STRUCTURE = {
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
        "מדור סייבר ארצי": [
            'חוליית מס"א',
            "חוליית קריפטו",
        ],
    },
}


def rebuild_org():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("ERROR: Could not connect to database.")
            return

        cur = conn.cursor()
        try:
            print("=== STEP 1: Clearing existing org data ===")

            # Null out all commander references
            cur.execute("UPDATE teams       SET commander_id = NULL")
            cur.execute("UPDATE sections    SET commander_id = NULL")
            cur.execute("UPDATE departments SET commander_id = NULL")

            # Detach all employees from org units
            cur.execute("UPDATE employees SET team_id = NULL, section_id = NULL, department_id = NULL")

            # Remove mock (seeded) employees
            cur.execute(
                "DELETE FROM attendance_logs WHERE employee_id IN "
                "(SELECT id FROM employees WHERE username LIKE 'user_%')"
            )
            cur.execute("DELETE FROM employees WHERE username LIKE 'user_%'")

            # Delete all org tables
            cur.execute("DELETE FROM teams")
            cur.execute("DELETE FROM sections")
            cur.execute("DELETE FROM departments")

            # Reset sequences so IDs start from 1
            cur.execute("ALTER SEQUENCE teams_id_seq       RESTART WITH 1")
            cur.execute("ALTER SEQUENCE sections_id_seq    RESTART WITH 1")
            cur.execute("ALTER SEQUENCE departments_id_seq RESTART WITH 1")

            print("  Done. All org units cleared.")

            print()
            print("=== STEP 2: Rebuilding org structure ===")

            for dept_name, sections in STRUCTURE.items():
                cur.execute(
                    "INSERT INTO departments (name) VALUES (%s) RETURNING id",
                    (dept_name,)
                )
                dept_id = cur.fetchone()[0]
                print(f"\n  [{dept_id}] {dept_name}")

                for sect_name, teams in sections.items():
                    cur.execute(
                        "INSERT INTO sections (name, department_id) VALUES (%s, %s) RETURNING id",
                        (sect_name, dept_id)
                    )
                    sect_id = cur.fetchone()[0]
                    print(f"    [{sect_id}] {sect_name}")

                    for team_name in teams:
                        cur.execute(
                            "INSERT INTO teams (name, section_id) VALUES (%s, %s) RETURNING id",
                            (team_name, sect_id)
                        )
                        team_id = cur.fetchone()[0]
                        print(f"      [{team_id}] {team_name}")

            conn.commit()
            print()
            print("=== SUCCESS: Org structure rebuilt from scratch. ===")

        except Exception as e:
            conn.rollback()
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
        finally:
            cur.close()
            conn.close()


if __name__ == "__main__":
    rebuild_org()
