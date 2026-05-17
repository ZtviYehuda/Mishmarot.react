import random
from datetime import datetime, timedelta
import os
import sys

# Add the parent directory to sys.path to import from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash

app = create_app()

def seed_v2():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("❌ Failed to connect to DB")
            return
        
        cur = conn.cursor()
        
        try:
            print("--- Seeding data (v2) ---")
            
            # 1. Clean existing data (except admin)
            print("   - Cleaning tables...")
            cur.execute("TRUNCATE TABLE attendance_logs CASCADE")
            cur.execute("TRUNCATE TABLE transfer_requests CASCADE")
            cur.execute("UPDATE departments SET commander_id = NULL")
            cur.execute("UPDATE sections SET commander_id = NULL")
            cur.execute("UPDATE teams SET commander_id = NULL")
            cur.execute("DELETE FROM employees WHERE username != 'admin'")
            cur.execute("TRUNCATE TABLE teams CASCADE")
            cur.execute("TRUNCATE TABLE sections CASCADE")
            cur.execute("TRUNCATE TABLE departments CASCADE")
            
            # 2. Create Structure
            print("   - Creating Structure...")
            cur.execute("INSERT INTO departments (name) VALUES ('אגף מבצעים') RETURNING id")
            dept_id = cur.fetchone()[0]
            
            section_ids = []
            for s_name in ['סיור', 'תנועה']:
                cur.execute("INSERT INTO sections (name, department_id) VALUES (%s, %s) RETURNING id", (s_name, dept_id))
                section_ids.append(cur.fetchone()[0])
            
            team_ids = []
            for s_id in section_ids:
                for i in range(1, 3):
                    cur.execute("INSERT INTO teams (name, section_id) VALUES (%s, %s) RETURNING id", (f"צוות {i}", s_id))
                    team_ids.append(cur.fetchone()[0])
            
            # 3. Create Employees
            print("   - Creating Employees...")
            
            # Common Hebrew names
            first_names = ['דוד', 'משה', 'חיים', 'יוסי', 'שרה', 'רחל', 'לאה', 'דני', 'מיכל', 'רוני']
            last_names = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דנינו', 'וסרמן', 'פרידמן', 'אזולאי', 'גולן']
            
            # Get role IDs
            cur.execute("SELECT id FROM roles WHERE name = 'Soldier'")
            role_soldier = cur.fetchone()[0]
            cur.execute("SELECT id FROM roles WHERE name = 'Commander'")
            role_commander = cur.fetchone()[0]
            
            # Get a service type
            cur.execute("SELECT id FROM service_types LIMIT 1")
            service_type_id = cur.fetchone()[0]
            
            pw_hash = generate_password_hash("123456")
            
            # Create a commander for each team
            commander_ids = []
            for idx, t_id in enumerate(team_ids):
                username = f"commander{idx+1}"
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                
                cur.execute("""
                    INSERT INTO employees (
                        username, first_name, last_name, team_id, role_id, 
                        is_commander, password_hash, is_active, must_change_password,
                        service_type_id, birth_date
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    username, fname, lname, t_id, role_commander, 
                    True, pw_hash, True, False, 
                    service_type_id, (datetime.now() - timedelta(days=365*25)).date()
                ))
                emp_id = cur.fetchone()[0]
                commander_ids.append(emp_id)
                cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp_id, t_id))
            
            # Create some soldiers
            soldier_ids = []
            for i in range(15):
                username = f"soldier{i+1}"
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                t_id = random.choice(team_ids)
                
                cur.execute("""
                    INSERT INTO employees (
                        username, first_name, last_name, team_id, role_id, 
                        is_commander, password_hash, is_active, must_change_password,
                        service_type_id, birth_date
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (
                    username, fname, lname, t_id, role_soldier, 
                    False, pw_hash, True, False, 
                    service_type_id, (datetime.now() - timedelta(days=365*20)).date()
                ))
                soldier_ids.append(cur.fetchone()[0])
            
            # 4. Attendance Logs
            print("   - Creating Attendance Logs...")
            cur.execute("SELECT id FROM status_types WHERE is_presence = TRUE LIMIT 1")
            present_id = cur.fetchone()[0]
            
            all_emp_ids = commander_ids + soldier_ids
            cur.execute("SELECT id FROM employees WHERE username = 'admin' LIMIT 1")
            admin_row = cur.fetchone()
            admin_id = admin_row[0] if admin_row else all_emp_ids[0]
            
            for eid in all_emp_ids:
                # Today's log
                cur.execute("""
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by)
                    VALUES (%s, %s, %s, %s)
                """, (eid, present_id, datetime.now(), admin_id))
                
            conn.commit()
            print("SUCCESS: Seeding v2 completed!")
            
        except Exception as e:
            conn.rollback()
            print(f"ERROR: Seeding v2 failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            cur.close()
            conn.close()

if __name__ == "__main__":
    seed_v2()
