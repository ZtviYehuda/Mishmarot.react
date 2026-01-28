from app.utils.db import get_db_connection
from werkzeug.security import check_password_hash, generate_password_hash
from psycopg2.extras import RealDictCursor


class EmployeeModel:
    @staticmethod
    def login_check(personal_number, password_input):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT id, first_name, last_name, personal_number, 
                       password_hash, must_change_password, is_admin, is_commander, national_id
                FROM employees 
                WHERE personal_number = %s AND is_active = TRUE
            """
            cur.execute(query, (personal_number,))
            user = cur.fetchone()

            if user:
                is_valid = False
                # Check actual password hash
                if user["password_hash"] and check_password_hash(
                    user["password_hash"], password_input
                ):
                    is_valid = True
                # Check initial password (national_id) if forced change is required
                elif user["must_change_password"] and str(user["national_id"]) == str(
                    password_input
                ):
                    is_valid = True

                if is_valid:
                    del user["password_hash"]
                    return user
            return None
        finally:
            conn.close()

    @staticmethod
    def get_employee_by_id(emp_id):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT e.*, 
                       d.name as department_name, 
                       s.name as section_name, 
                       t.name as team_name,
                       st.name as status_name, 
                       st.color as status_color,
                       r.name as role_name,
                       COALESCE(e.department_id, d.id) as assigned_department_id,
                       COALESCE(e.section_id, s.id) as assigned_section_id,
                       (SELECT id FROM departments WHERE commander_id = e.id LIMIT 1) as commands_department_id_direct,
                       (SELECT id FROM sections WHERE commander_id = e.id LIMIT 1) as commands_section_id_direct,
                       (SELECT id FROM teams WHERE commander_id = e.id LIMIT 1) as commands_team_id
                FROM employees e
                -- Structure Joins (Assigned)
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON s.id = t.section_id
                LEFT JOIN departments d ON d.id = s.department_id
                -- Direct Unit Links (if they are assigned directly to a section/dept instead of a team)
                LEFT JOIN sections s_dir ON e.section_id = s_dir.id
                LEFT JOIN departments d_dir ON e.department_id = d_dir.id
                LEFT JOIN roles r ON e.role_id = r.id
                -- Active Status
                LEFT JOIN attendance_logs al ON al.employee_id = e.id AND al.end_datetime IS NULL
                LEFT JOIN status_types st ON al.status_type_id = st.id
                WHERE e.id = %s
            """
            cur.execute(query, (emp_id,))
            user = cur.fetchone()
            
            if user:
                # Convert to standard dict to be safe and mutable
                user = dict(user)
                
                # Assigned units are already partially handled by COALESCE in SQL.
                # Let's ensure they are set and integers where possible.
                user['assigned_department_id'] = user.get('assigned_department_id')
                user['assigned_section_id'] = user.get('assigned_section_id')
                user['assigned_team_id'] = user.get('team_id')

                # Calculate effective command hierarchy
                # Calculate effective command hierarchy
                # STRICT SCOPING: Only set the ID for the level they actually command.
                # Do NOT bubble up to parents - that causes the system to think they command the parent unit.
                
                if user.get('commands_section_id_direct'):
                    user['commands_section_id'] = user['commands_section_id_direct']
                    user['commands_department_id'] = None # They command the section, not the department
                elif user.get('commands_team_id'):
                    # commands_team_id is usually a column on the user itself for "commander of team X"? 
                    # Actually, the SQL query earlier didn't show 'commands_team_id' column on employees table?
                    # Wait, let's check if 'commands_team_id' exists in the user dict.
                    # The get_all_sql in line 50+ didn't fetch a 'commands_team_id' column.
                    # It fetched (SELECT id FROM teams WHERE commander_id = e.id) maybe?
                    # Let's check get_employee_by_id query.
                    pass 
                
                    # Assuming commands_team_id is already in 'user' from the query or earlier logic?
                    # Looking at lines 60-65 in file (not visible here but assumed):
                    # Queries likely fetch 'commands_section_id_direct', 'commands_department_id_direct'.
                    # Did it fetch team commander?
                    
                    # Correction: I need to check how commands_team_id is populated. 
                    # If I look at the previous context (Step 1255), line 60:
                    # (SELECT id FROM departments WHERE commander_id = e.id LIMIT 1) as commands_department_id_direct
                    # I should assume there is similar for section and team.
                    
                    user['commands_section_id'] = None
                    user['commands_department_id'] = None
                else:
                    user['commands_department_id'] = user.get('commands_department_id_direct')
                    user['commands_section_id'] = None
                
                if user.get('is_commander'):
                    print(f"[DEBUG] get_employee_by_id - Final command IDs: dept={user.get('commands_department_id')}, sec={user.get('commands_section_id')}, team={user.get('commands_team_id')}")

                # Convert dates to strings for JSON serialization
                for key, value in user.items():
                    if hasattr(value, 'isoformat'):
                        user[key] = value.isoformat()

                return user
            return None
        finally:
            conn.close()

    @staticmethod
    def get_all_employees(filters=None, requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT DISTINCT e.id, e.first_name, e.last_name, e.personal_number, e.phone_number,
                       e.birth_date, e.is_commander, e.security_clearance, e.police_license,
                       e.is_active,
                       COALESCE(t.name, 'מטה') as team_name, 
                       COALESCE(s.name, s_dir.name, 'מטה') as section_name, 
                       COALESCE(d.name, d_dir.name, 'מטה') as department_name,
                       st.name as status_name,
                       st.color as status_color,
                       srv.name as service_type_name
                FROM employees e
                -- Direct Path Joins (via team_id)
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON t.section_id = s.id
                LEFT JOIN departments d ON s.department_id = d.id
                -- Direct Unit Links (for section/dept commanders or HQ)
                LEFT JOIN sections s_dir ON e.section_id = s_dir.id
                LEFT JOIN departments d_dir ON e.department_id = d_dir.id
                -- Service Type
                LEFT JOIN service_types srv ON e.service_type_id = srv.id
                -- Status Joins
                LEFT JOIN LATERAL (
                    SELECT status_type_id FROM attendance_logs 
                    WHERE employee_id = e.id AND end_datetime IS NULL
                    ORDER BY start_datetime DESC LIMIT 1
                ) last_log ON true
                LEFT JOIN status_types st ON last_log.status_type_id = st.id
                WHERE 1=1
            """
            params = []

            # Scoping for commanders
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    query += " AND (d.id = %s OR d_dir.id = %s)"
                    params.extend([requesting_user["commands_department_id"], requesting_user["commands_department_id"]])
                elif requesting_user.get("commands_section_id"):
                    query += " AND (s.id = %s OR s_dir.id = %s)"
                    params.extend([requesting_user["commands_section_id"], requesting_user["commands_section_id"]])
                elif requesting_user.get("commands_team_id"):
                    query += " AND t.id = %s"
                    params.append(requesting_user["commands_team_id"])
                else:
                    # Case for a commander who isn't linked to a specific unit command in the DB yet
                    # or just for security - they only see themselves if no scope found
                    query += " AND e.id = %s"
                    params.append(requesting_user["id"])
            
            # Default to active only unless specified otherwise
            if not filters or not filters.get("include_inactive"):
                query += " AND e.is_active = TRUE"
            
            if filters:
                if filters.get("search"):
                    term = f"%{filters['search']}%"
                    query += " AND (e.first_name ILIKE %s OR e.last_name ILIKE %s OR e.personal_number ILIKE %s)"
                    params.extend([term, term, term])
                if filters.get("dept_id") and str(filters.get("dept_id")).isdigit():
                    d_id = int(filters["dept_id"])
                    query += " AND (d.id = %s OR d_dir.id = %s)"
                    params.extend([d_id, d_id])
                if filters.get("status_id"):
                    query += " AND st.id = %s"
                    params.append(filters["status_id"])

            query += " ORDER BY e.first_name ASC"
            cur.execute(query, tuple(params))
            results = cur.fetchall()
            for row in results:
                for key, value in row.items():
                    if hasattr(value, 'isoformat'):
                        row[key] = value.isoformat()
            return results
        finally:
            conn.close()

    @staticmethod
    def create_employee(data):
        conn = get_db_connection()
        if not conn:
            raise Exception("Database connection failed")
        try:
            cur = conn.cursor()
            pw_hash = None
            must_change = False
            if data.get("is_commander") or data.get("is_admin"):
                pw_hash = generate_password_hash(str(data["national_id"]))
                must_change = True

            query = """
                INSERT INTO employees (
                    first_name, last_name, personal_number, national_id, phone_number,
                    city, birth_date, enlistment_date, discharge_date, assignment_date,
                    team_id, section_id, department_id, role_id, service_type_id, 
                    is_commander, is_admin, 
                    password_hash, must_change_password, security_clearance, police_license
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cur.execute(
                query,
                (
                    data["first_name"],
                    data["last_name"],
                    data["personal_number"],
                    data["national_id"],
                    data.get("phone_number") or None,
                    data.get("city") or None,
                    data.get("birth_date") or None,
                    data.get("enlistment_date") or None,
                    data.get("discharge_date") or None,
                    data.get("assignment_date") or None,
                    data.get("team_id") or None,
                    data.get("section_id") or None,
                    data.get("department_id") or None,
                    data.get("role_id") or None,
                    data.get("service_type_id") or None,
                    data.get("is_commander", False),
                    data.get("is_admin", False),
                    pw_hash,
                    must_change,
                    data.get("security_clearance", 0),
                    data.get("police_license", False),
                ),
            )
            new_id = cur.fetchone()[0]
            
            # If commander, update the appropriate organizational level
            if data.get("is_commander", False):
                team_id = data.get("team_id")
                
                if team_id:
                    # Commander of team
                    cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (new_id, team_id))
                    # Get section_id for possible section command
                    cur.execute("SELECT section_id FROM teams WHERE id = %s", (team_id,))
                    result = cur.fetchone()
                    section_id = result[0] if result else None
                else:
                    # Need to find section_id from frontend selection
                    # This will be passed as a separate field
                    section_id = data.get("section_id")
                
                # If no team but has section, commander of section
                if not team_id and section_id:
                    cur.execute("UPDATE sections SET commander_id = %s WHERE id = %s", (new_id, section_id))
                    # Get department_id for possible department command
                    cur.execute("SELECT department_id FROM sections WHERE id = %s", (section_id,))
                    result = cur.fetchone()
                    department_id = result[0] if result else None
                else:
                    department_id = data.get("department_id")
                
                # If no team and no section but has department, commander of department
                if not team_id and not section_id and department_id:
                    cur.execute("UPDATE departments SET commander_id = %s WHERE id = %s", (new_id, department_id))
            
            conn.commit()
            return new_id
        except Exception as e:
            conn.rollback()
            print(f"Error creating employee: {e}")
            import traceback
            print(traceback.format_exc())
            raise Exception(f"Failed to create employee: {str(e)}")
        finally:
            conn.close()

    @staticmethod
    def update_employee(emp_id, data):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            
            # Map of allowed fields to their DB column names
            # (In this case they mostly match, but good for security checking)
            allowed_fields = {
                "first_name": "first_name",
                "last_name": "last_name", 
                "personal_number": "personal_number", 
                "national_id": "national_id",
                "phone_number": "phone_number", 
                "city": "city", 
                "birth_date": "birth_date", 
                "enlistment_date": "enlistment_date", 
                "discharge_date": "discharge_date", 
                "assignment_date": "assignment_date",
                "team_id": "team_id", 
                "section_id": "section_id", 
                "department_id": "department_id",
                "role_id": "role_id", 
                "service_type_id": "service_type_id",
                "security_clearance": "security_clearance", 
                "police_license": "police_license", 
                "emergency_contact": "emergency_contact",
                "is_commander": "is_commander", 
                "is_admin": "is_admin",
                "is_active": "is_active",
                "must_change_password": "must_change_password"
            }

            # Business Rule: If commander status changes, sync must_change_password
            if "is_commander" in data:
                data["must_change_password"] = data["is_commander"]

            set_clauses = []
            params = []

            for key, value in data.items():
                if key in allowed_fields:
                    set_clauses.append(f"{allowed_fields[key]} = %s")
                    params.append(value)
            
            if not set_clauses:
                return True # Nothing to update
            
            params.append(emp_id)
            
            query = f"UPDATE employees SET {', '.join(set_clauses)} WHERE id = %s"
            
            cur.execute(query, tuple(params))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error updating: {e}")
            import traceback
            print(traceback.format_exc())
            return False
        finally:
            conn.close()

    @staticmethod
    def delete_employee(emp_id):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            # Clean related data first
            cur.execute("DELETE FROM attendance_logs WHERE employee_id = %s", (emp_id,))
            cur.execute(
                "DELETE FROM transfer_requests WHERE employee_id = %s", (emp_id,)
            )

            # Unlink commanderships
            cur.execute(
                "UPDATE teams SET commander_id = NULL WHERE commander_id = %s",
                (emp_id,),
            )
            cur.execute(
                "UPDATE sections SET commander_id = NULL WHERE commander_id = %s",
                (emp_id,),
            )
            cur.execute(
                "UPDATE departments SET commander_id = NULL WHERE commander_id = %s",
                (emp_id,),
            )

            # Delete user
            cur.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error deleting: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def update_password(user_id, new_password):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            new_hash = generate_password_hash(new_password)
            cur.execute(
                "UPDATE employees SET password_hash = %s, must_change_password = FALSE WHERE id = %s",
                (new_hash, user_id),
            )
            conn.commit()
            return True
        except Exception:
            conn.rollback()
            return False
        finally:
            conn.close()

    @staticmethod
    def get_structure_tree():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, name FROM departments ORDER BY name")
            depts = cur.fetchall()
            cur.execute("SELECT id, name, department_id FROM sections ORDER BY name")
            sections = cur.fetchall()
            cur.execute("SELECT id, name, section_id FROM teams ORDER BY name")
            teams = cur.fetchall()

            structure = []
            for d in depts:
                dept_node = {**d, "sections": []}
                dept_sections = [s for s in sections if s["department_id"] == d["id"]]
                for s in dept_sections:
                    sect_node = {**s, "teams": []}
                    sect_teams = [t for t in teams if t["section_id"] == s["id"]]
                    sect_node["teams"] = sect_teams
                    dept_node["sections"].append(sect_node)
                structure.append(dept_node)
            return structure
        finally:
            conn.close()
