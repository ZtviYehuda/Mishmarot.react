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
                       COALESCE(d.name, d2.name, d3.name, d_cmd.name) as department_name, 
                       COALESCE(s.name, s2.name, s_cmd.name) as section_name, 
                       COALESCE(t.name, t_cmd.name) as team_name,
                       st.name as status_name, 
                       st.color as status_color,
                       r.name as role_name
                FROM employees e
                -- Structure Joins
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON t.section_id = s.id
                LEFT JOIN departments d ON s.department_id = d.id
                -- Commander Structure Joins
                LEFT JOIN teams t_cmd ON t_cmd.commander_id = e.id
                LEFT JOIN sections s2 ON t_cmd.section_id = s2.id 
                LEFT JOIN departments d3 ON s2.department_id = d3.id
                LEFT JOIN sections s_cmd ON s_cmd.commander_id = e.id
                LEFT JOIN departments d2 ON s_cmd.department_id = d2.id
                LEFT JOIN departments d_cmd ON d_cmd.commander_id = e.id
                LEFT JOIN roles r ON e.role_id = r.id
                -- Active Status
                LEFT JOIN attendance_logs al ON al.employee_id = e.id AND al.end_datetime IS NULL
                LEFT JOIN status_types st ON al.status_type_id = st.id
                WHERE e.id = %s
            """
            cur.execute(query, (emp_id,))
            return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def get_all_employees(filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT e.id, e.first_name, e.last_name, e.personal_number, e.phone_number,
                       e.birth_date, e.is_commander, e.security_clearance, e.police_license,
                       COALESCE(t.name, 'מטה') as team_name, 
                       COALESCE(s.name, s_dir.name, 'מטה') as section_name, 
                       COALESCE(d.name, d_dir.name, 'מטה') as department_name,
                       COALESCE(st.name, 'משרד') as status_name,
                       COALESCE(st.color, '#22c55e') as status_color,
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
                WHERE e.is_active = TRUE
            """
            params = []
            if filters:
                if filters.get("search"):
                    term = f"%{filters['search']}%"
                    query += " AND (e.first_name ILIKE %s OR e.last_name ILIKE %s OR e.personal_number ILIKE %s)"
                    params.extend([term, term, term])
                if filters.get("dept_id"):
                    query += " AND d.id = %s"
                    params.append(filters["dept_id"])

            query += " ORDER BY e.first_name ASC"
            cur.execute(query, tuple(params))
            return cur.fetchall()
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
                "is_active": "is_active"
            }

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
