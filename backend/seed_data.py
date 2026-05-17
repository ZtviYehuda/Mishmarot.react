import random
from datetime import datetime, timedelta
from app import create_app
from app.utils.db import get_db_connection
from app.models.employee_model import EmployeeModel
from werkzeug.security import generate_password_hash

app = create_app()

def seed():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("❌ Failed to connect to DB")
            return
        
        cur = conn.cursor()
        
        try:
            print("🌱 Seeding data...")
            
            # 1. Clear existing data (optional, but good for "reset")
            # We must be careful with foreign keys.
            print("   - Cleaning tables...")
            cur.execute("TRUNCATE TABLE attendance_logs CASCADE")
            cur.execute("TRUNCATE TABLE transfer_requests CASCADE")
            
            # Unlink commanders to avoid FK constraints during delete
            cur.execute("UPDATE departments SET commander_id = NULL")
            cur.execute("UPDATE sections SET commander_id = NULL")
            cur.execute("UPDATE teams SET commander_id = NULL")
            
            cur.execute("DELETE FROM employees WHERE personal_number != 'admin'")
            cur.execute("TRUNCATE TABLE teams CASCADE")
            cur.execute("TRUNCATE TABLE sections CASCADE")
            cur.execute("TRUNCATE TABLE departments CASCADE")
            
            conn.commit()
            
            # 2. Create Units
            print("   - Creating Structure...")
            
            # Department
            cur.execute("INSERT INTO departments (name) VALUES ('אגף מבצעים') RETURNING id")
            dept_id = cur.fetchone()[0]
            
            # Sections
            sections_data = ['סיור', 'תנועה']
            section_ids = []
            for s_name in sections_data:
                cur.execute("INSERT INTO sections (name, department_id) VALUES (%s, %s) RETURNING id", (s_name, dept_id))
                section_ids.append(cur.fetchone()[0])
            
            # Teams
            team_ids = []
            for s_id in section_ids:
                for i in range(1, 4): # 3 teams per section
                    cur.execute("INSERT INTO teams (name, section_id) VALUES (%s, %s) RETURNING id", (f"צוות {i}", s_id))
                    team_ids.append(cur.fetchone()[0])
            
            conn.commit()
            
            # 3. Create Employees
            print("   - Creating Employees...")
            
            first_names = ['דוד', 'משה', 'חיים', 'יוסי', 'שרה', 'רחל', 'לאה', 'דני', 'מיכל', 'רוני']
            last_names = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דנינו', 'וסרמן', 'פרידמן', 'אזולאי', 'גולן']
            
            # Fetch roles for assignment
            cur.execute("SELECT id FROM roles WHERE name = 'חייל'")
            role_soldier = cur.fetchone()[0]
            cur.execute("SELECT id FROM roles WHERE name = 'מפקד'")
            role_commander = cur.fetchone()[0]
            
            employees = []
            
            # Create a commander for each team
            for t_id in team_ids:
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                pn = f"c{t_id}000"
                
                emp_data = {
                    "first_name": fname,
                    "last_name": lname,
                    "personal_number": pn,
                    "national_id": str(random.randint(100000000, 999999999)),
                    "team_id": t_id,
                    "role_id": role_commander,
                    "is_commander": True,
                    "is_admin": False,
                    "password_hash": generate_password_hash("123456")
                }
                
                cur.execute("""
                    INSERT INTO employees (
                        first_name, last_name, personal_number, national_id, team_id, role_id, is_commander, password_hash
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (emp_data['first_name'], emp_data['last_name'], emp_data['personal_number'], emp_data['national_id'], emp_data['team_id'], emp_data['role_id'], emp_data['is_commander'], emp_data['password_hash']))
                
                emp_id = cur.fetchone()[0]
                employees.append(emp_id)
                
                # Update team commander
                cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp_id, t_id))
                
            # Create soldiers
            for i in range(20):
                fname = random.choice(first_names)
                lname = random.choice(last_names)
                pn = f"s{i}123"
                t_id = random.choice(team_ids)
                
                cur.execute("""
                    INSERT INTO employees (
                        first_name, last_name, personal_number, national_id, team_id, role_id, is_commander, password_hash
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (fname, lname, pn, str(random.randint(100000000, 999999999)), t_id, role_soldier, False, generate_password_hash("123456")))
                
                employees.append(cur.fetchone()[0])
                
            conn.commit()
            
            # 4. Create Logs (Attendance)
            print("   - Creating Attendance Logs...")
            
            cur.execute("SELECT id, name FROM status_types")
            statuses = cur.fetchall() # list of (id, name)
            status_ids = [s[0] for s in statuses]
            
            # Provide logs for the last 5 days
            today = datetime.now().date()
            for day_offset in range(5):
                log_date = today - timedelta(days=day_offset)
                
                for emp_id in employees:
                    # Random status
                    sid = random.choice(status_ids)
                    
                    # Create log
                    start_dt = datetime.combine(log_date, datetime.min.time())
                    end_dt = datetime.combine(log_date, datetime.max.time())
                    
                    # Log active status for today, closed for past
                    if day_offset == 0:
                         cur.execute("""
                            INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by)
                            VALUES (%s, %s, %s, %s)
                        """, (emp_id, sid, datetime.now(), 5)) # Assuming 5 is admin, doesn't matter much
                    else:
                        cur.execute("""
                            INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, reported_by)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (emp_id, sid, start_dt, end_dt, 5))
            
            conn.commit()
            print("✅ Seeding completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Seeding failed: {e}")
            import traceback
            traceback.print_exc()
        finally:
            cur.close()
            conn.close()

if __name__ == '__main__':
    seed()
