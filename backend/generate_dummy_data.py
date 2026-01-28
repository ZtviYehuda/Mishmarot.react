import sys
import os

# Add the current directory to sys.path to find 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash
import random

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

        print("Creating Admin...")
        cur.execute("""
            INSERT INTO employees (first_name, last_name, personal_number, national_id, password_hash, is_admin, is_commander, must_change_password)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, ("Admin", "System", "admin", "000000000", pw_hash, True, True, False))

        # 1. Create Department Commanders (5)
        print("Creating Department Commanders...")
        for i, d_id in enumerate(depts):
            p_num = f"600{i+1}"
            n_id = f"1000000{i:02d}" # Ensures 9 characters (1000000 + 01...)
            cur.execute("""
                INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, department_id, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, d_id, True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE departments SET commander_id = %s WHERE id = %s", (emp_id, d_id))

        # 2. Create Section Commanders (7)
        print("Creating Section Commanders...")
        for i, (s_id, d_id) in enumerate(sections):
            p_num = f"700{i+1}"
            n_id = f"2000000{i:02d}"
            cur.execute("""
                INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, section_id, department_id, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, s_id, d_id, True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE sections SET commander_id = %s WHERE id = %s", (emp_id, s_id))

        # 3. Create Team Commanders (11)
        print("Creating Team Commanders...")
        for i, (t_id, s_id, d_id) in enumerate(teams):
            p_num = f"800{i+1}"
            if len(p_num) > 5: p_num = p_num[:5] # Safety
            n_id = f"3000000{i:02d}"
            cur.execute("""
                INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, team_id, section_id, department_id, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, True, t_id, s_id, d_id, True))
            emp_id = cur.fetchone()[0]
            cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp_id, t_id))

        # 4. Create Regular Officers (7 remaining)
        print("Creating Regular Officers...")
        for i in range(7):
            p_num = f"100{i+1}"
            n_id = f"4000000{i:02d}"
            t_id, s_id, d_id = random.choice(teams)
            cur.execute("""
                INSERT INTO employees (personal_number, national_id, first_name, last_name, password_hash, is_commander, team_id, section_id, department_id, is_active, city)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (p_num, n_id, random.choice(first_names), random.choice(last_names), pw_hash, False, t_id, s_id, d_id, True, random.choice(cities)))

        conn.commit()
        print("✅ Successfully reset data and generated 30 dummy employees + Admin.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    generate_data()
