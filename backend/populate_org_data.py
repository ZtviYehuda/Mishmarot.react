import random
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from app import create_app
from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash
import logging

# Force load .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = create_app()

def populate():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            logger.error("❌ Failed to connect to DB")
            return
        
        cur = conn.cursor()
        
        try:
            logger.info("🌱 Starting Data Population...")
            
            # Debug Config
            logger.info(f"DEBUG DB Config: HOST={app.config.get('DB_HOST')}, PORT={app.config.get('DB_PORT')}, USER={app.config.get('DB_USER')}, DB={app.config.get('DB_NAME')}")
            
            # 1. Clean Slate (Except Admin if exists, but we can recreate to be safe)
            # CAUTION: This wipes data!
            logger.info("   - Cleaning existing data...")
            cur.execute("TRUNCATE TABLE attendance_logs CASCADE")
            cur.execute("TRUNCATE TABLE transfer_requests CASCADE")
            cur.execute("TRUNCATE TABLE employees CASCADE")
            cur.execute("TRUNCATE TABLE teams CASCADE")
            cur.execute("TRUNCATE TABLE sections CASCADE")
            cur.execute("TRUNCATE TABLE departments CASCADE")
            
            # Reset sequences
            cur.execute("ALTER SEQUENCE employees_id_seq RESTART WITH 1")
            cur.execute("ALTER SEQUENCE teams_id_seq RESTART WITH 1")
            cur.execute("ALTER SEQUENCE sections_id_seq RESTART WITH 1")
            cur.execute("ALTER SEQUENCE departments_id_seq RESTART WITH 1")

            # 2. Status Types & Roles (Ensure they exist)
            # Typically these are static, assuming they exist from migration.
            
            # 3. Create Structure
            logger.info("   - Creating Organization Hierarchy...")
            
            # Departments
            depts = ["אגף מבצעים", "אגף חקירות", "מטה"]
            dept_map = {} # name -> id
            
            for d in depts:
                cur.execute("INSERT INTO departments (name) VALUES (%s) RETURNING id", (d,))
                dept_map[d] = cur.fetchone()[0]

            # Sections per Department
            sections_structure = {
                "אגף מבצעים": ["סיור", "תנועה", "יס\"מ"],
                "אגף חקירות": ["תשאול", "זיהוי פלילי"],
                "מטה": ["משאבי אנוש", "לוגיסטיקה"]
            }
            
            section_map = {} # name -> id
            
            for d_name, sects in sections_structure.items():
                d_id = dept_map[d_name]
                for s in sects:
                    cur.execute("INSERT INTO sections (name, department_id) VALUES (%s, %s) RETURNING id", (s, d_id))
                    section_map[s] = cur.fetchone()[0]

            # Teams per Section
            team_map = {} # name -> id
            team_ids = []
            
            for s_name, s_id in section_map.items():
                # Create 2-3 teams per section
                for i in range(1, random.randint(3, 4)):
                    t_name = f"צוות {s_name} {i}"
                    cur.execute("INSERT INTO teams (name, section_id) VALUES (%s, %s) RETURNING id", (t_name, s_id))
                    tid = cur.fetchone()[0]
                    team_map[t_name] = tid
                    team_ids.append(tid)

            # 4. Create Employees
            logger.info("   - Creating Personnel...")
            
            # Roles (Assuming IDs 1=Soldier, 2=Commander, 3=Admin from typical setup, but fetching is safer)
            # If tables don't exist, we might need to insert them. Assuming they exist.
            cur.execute("SELECT id FROM roles WHERE name = 'חייל'")
            res = cur.fetchone()
            role_soldier = res[0] if res else 1
            
            cur.execute("SELECT id FROM roles WHERE name = 'מפקד'")
            res = cur.fetchone()
            role_commander = res[0] if res else 2

            # Admin User
            logger.info("   - Creating Root Admin...")
            admin_pass = generate_password_hash("admin123")
            cur.execute("""
                INSERT INTO employees (
                    first_name, last_name, personal_number, password_hash, 
                    is_admin, is_commander, is_active, role_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, ("מנהל", "מערכת", "admin", admin_pass, True, True, True, role_commander))

            # Names Pools
            first_names = ["דוד", "יוסי", "משה", "דני", "רוני", "אבי", "שלמה", "יעקב", "אלי", "חיים", "נועה", "תמר", "שרה", "רחל", "מיכל", "יעל", "עדי", "שירה"]
            last_names = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אברהם", "פרידמן", "מלכה", "אסולין", "גבאי", "חדד", "קריף", "בן דוד"]

            employees_created = 0
            
            # Create Commanders for Units (Departments, Sections, Teams)
            # Simplified: Just Team Commanders and some loose soldiers.
            
            used_pns = {"admin"}

            def get_unique_pn(prefix="s"):
                while True:
                    pn = f"{prefix}{random.randint(1000, 9999)}"
                    if pn not in used_pns:
                        used_pns.add(pn)
                        return pn

            today = datetime.now().date()
            
            # 4.1 Team Commanders
            for t_name, t_id in team_map.items():
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                pn = get_unique_pn("c")
                
                # Birthday logic: 20% chance to have birthday THIS WEEK (for testing report)
                if random.random() < 0.2:
                    # Birthday in 2 days
                    bday_month = today.month
                    bday_day = (today + timedelta(days=random.randint(0, 6))).day
                    birth_date = datetime(year=random.randint(1980, 2000), month=bday_month, day=bday_day).date()
                else:
                    birth_date = datetime(year=random.randint(1980, 2000), month=random.randint(1, 12), day=random.randint(1, 28)).date()

                cur.execute("""
                    INSERT INTO employees (
                        first_name, last_name, personal_number, password_hash, 
                        is_admin, is_commander, is_active, role_id, team_id, birth_date, phone_number
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (fname, lname, pn, generate_password_hash("123456"), False, True, True, role_commander, t_id, birth_date, f"050000{random.randint(1000,9999)}"))
                
                cid = cur.fetchone()[0]
                # Link commander to team
                cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (cid, t_id))
                employees_created += 1

            # 4.2 Soldiers
            for _ in range(50):
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                pn = get_unique_pn("s")
                t_id = random.choice(team_ids)
                
                # Birthday logic
                if random.random() < 0.1: # 10% chance for upcoming birthday
                    bday_date = today + timedelta(days=random.randint(0, 7))
                    birth_date = datetime(year=random.randint(1995, 2004), month=bday_date.month, day=bday_date.day).date()
                else:
                    birth_date = datetime(year=random.randint(1995, 2004), month=random.randint(1, 12), day=random.randint(1, 28)).date()

                cur.execute("""
                    INSERT INTO employees (
                        first_name, last_name, personal_number, password_hash, 
                        is_admin, is_commander, is_active, role_id, team_id, birth_date, phone_number
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (fname, lname, pn, generate_password_hash("123456"), False, False, True, role_soldier, t_id, birth_date, f"050000{random.randint(1000,9999)}"))
                employees_created += 1

            conn.commit()
            logger.info(f"✅ Successfully created {employees_created} employees.")
            logger.info("✅ Admin credentials: admin / admin123")
            
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Population failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            cur.close()
            conn.close()

if __name__ == '__main__':
    populate()
