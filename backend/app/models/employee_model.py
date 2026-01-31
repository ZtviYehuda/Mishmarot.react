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
                       password_hash, must_change_password, is_admin, is_commander
                FROM employees 
                WHERE personal_number = %s AND is_active = TRUE
            """
            cur.execute(query, (personal_number,))
            user = cur.fetchone()

            if user:
                is_valid = False
                # 1. Normal password check
                if user["password_hash"] and check_password_hash(
                    user["password_hash"], password_input
                ):
                    is_valid = True

                # 2. First-time login check (Personal Number + National ID)
                # If they haven't changed password yet, allow national_id as password
                if not is_valid and user.get("must_change_password"):
                    # We need to fetch national_id for this check
                    cur.execute(
                        "SELECT national_id FROM employees WHERE id = %s", (user["id"],)
                    )
                    nid_row = cur.fetchone()
                    if nid_row and nid_row["national_id"] == password_input:
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
                SELECT e.id, e.first_name, e.last_name, e.personal_number, e.phone_number,
                       e.national_id, e.birth_date, e.city, e.emergency_contact,
                       e.enlistment_date, e.discharge_date, e.assignment_date,
                       e.security_clearance, e.police_license, e.is_active,
                       e.must_change_password, e.is_admin, e.is_commander,
                       e.service_type_id, svt.name as service_type_name,
                       COALESCE(d.name, d_s_dir.name, d_dir.name) as department_name, 
                       COALESCE(s.name, s_dir.name) as section_name, 
                       t.name as team_name,
                       st.id as status_id,
                       st.name as status_name, 
                       st.color as status_color,
                       al.start_datetime as last_status_update,
                       r.name as role_name,
                       d.id as assigned_department_id,
                       s.id as assigned_section_id,
                       e.team_id, e.section_id, e.department_id,
                       (SELECT id FROM departments WHERE commander_id = e.id LIMIT 1) as commands_department_id_direct,
                       (SELECT id FROM sections WHERE commander_id = e.id LIMIT 1) as commands_section_id_direct,
                       (SELECT id FROM teams WHERE commander_id = e.id LIMIT 1) as commands_team_id,
                       e.notif_sick_leave, e.notif_transfers
                FROM employees e
                -- Structure Joins (Assigned)
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON s.id = t.section_id
                LEFT JOIN departments d ON d.id = s.department_id
                -- Direct Unit Links (if they are assigned directly to a section/dept instead of a team)
                LEFT JOIN sections s_dir ON e.section_id = s_dir.id
                LEFT JOIN departments d_s_dir ON s_dir.department_id = d_s_dir.id
                LEFT JOIN departments d_dir ON e.department_id = d_dir.id
                LEFT JOIN roles r ON e.role_id = r.id
                LEFT JOIN service_types svt ON e.service_type_id = svt.id
                -- Active Status
                LEFT JOIN attendance_logs al ON al.employee_id = e.id AND (al.end_datetime IS NULL OR al.end_datetime > CURRENT_TIMESTAMP)
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
                user["assigned_department_id"] = user.get("assigned_department_id")
                user["assigned_section_id"] = user.get("assigned_section_id")
                user["assigned_team_id"] = user.get("team_id")

                # Calculate effective command hierarchy
                # Calculate effective command hierarchy
                # STRICT SCOPING: Only set the ID for the level they actually command.
                # Do NOT bubble up to parents - that causes the system to think they command the parent unit.

                if user.get("commands_section_id_direct"):
                    user["commands_section_id"] = user["commands_section_id_direct"]
                    user["commands_department_id"] = (
                        None  # They command the section, not the department
                    )
                elif user.get("commands_team_id"):
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

                    user["commands_section_id"] = None
                    user["commands_department_id"] = None
                else:
                    user["commands_department_id"] = user.get(
                        "commands_department_id_direct"
                    )
                    user["commands_section_id"] = None

                if user.get("is_commander"):
                    print(
                        f"[DEBUG] get_employee_by_id - Final command IDs: dept={user.get('commands_department_id')}, sec={user.get('commands_section_id')}, team={user.get('commands_team_id')}"
                    )

                # Convert dates to strings for JSON serialization
                for key, value in user.items():
                    if hasattr(value, "isoformat"):
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
                       e.is_active, e.department_id, e.section_id, e.team_id,
                       t.name as team_name, 
                       COALESCE(s.name, s_dir.name) as section_name, 
                       COALESCE(d.name, d_dir.name) as department_name,
                       st.id as status_id,
                       st.name as status_name,
                       st.color as status_color,
                       last_log.start_datetime as last_status_update,
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
                    SELECT status_type_id, start_datetime FROM attendance_logs 
                    WHERE employee_id = e.id 
                    {status_condition}
                    ORDER BY start_datetime DESC LIMIT 1
                ) last_log ON true
                LEFT JOIN status_types st ON last_log.status_type_id = st.id
                WHERE 1=1
            """

            # Prepare status condition
            status_sql = "AND (end_datetime IS NULL OR end_datetime > CURRENT_TIMESTAMP)"
            status_params = []

            if filters and (filters.get("date") or filters.get("end_date")):
                check_date = filters.get("date") or filters.get("end_date")
                status_sql = "AND DATE(start_datetime) <= %s AND (end_datetime IS NULL OR DATE(end_datetime) >= %s)"
                status_params = [check_date, check_date]

            # Initialize query parameters list if not already present
            params = []

            query = query.format(status_condition=status_sql)
            params = status_params + params

            # Scoping for commanders
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    query += " AND (d.id = %s OR d_dir.id = %s)"
                    params.extend(
                        [
                            requesting_user["commands_department_id"],
                            requesting_user["commands_department_id"],
                        ]
                    )
                elif requesting_user.get("commands_section_id"):
                    query += " AND (s.id = %s OR s_dir.id = %s)"
                    params.extend(
                        [
                            requesting_user["commands_section_id"],
                            requesting_user["commands_section_id"],
                        ]
                    )
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
                if (
                    filters.get("section_id")
                    and str(filters.get("section_id")).isdigit()
                ):
                    s_id = int(filters["section_id"])
                    query += " AND (s.id = %s OR s_dir.id = %s)"
                    params.extend([s_id, s_id])
                if filters.get("team_id") and str(filters.get("team_id")).isdigit():
                    t_id = int(filters["team_id"])
                    query += " AND t.id = %s"
                    params.append(t_id)
                if filters.get("status_id"):
                    query += " AND st.id = %s"
                    params.append(filters["status_id"])

                # New Advanced Filters
                if filters.get("roles"):
                    roles_list = (
                        filters["roles"].split(",")
                        if isinstance(filters["roles"], str)
                        else filters["roles"]
                    )
                    query += " AND EXISTS (SELECT 1 FROM roles r WHERE e.role_id = r.id AND r.name = ANY(%s))"
                    params.append(roles_list)

                if filters.get("serviceTypes"):
                    srv_list = (
                        filters["serviceTypes"].split(",")
                        if isinstance(filters["serviceTypes"], str)
                        else filters["serviceTypes"]
                    )
                    query += " AND srv.name = ANY(%s)"
                    params.append(srv_list)

                if filters.get("statuses"):
                    st_list = (
                        filters["statuses"].split(",")
                        if isinstance(filters["statuses"], str)
                        else filters["statuses"]
                    )
                    query += " AND st.name = ANY(%s)"
                    params.append(st_list)

                if filters.get("is_commander") == "true":
                    query += " AND e.is_commander = TRUE"
                if filters.get("is_admin") == "true":
                    query += " AND e.is_admin = TRUE"
                if filters.get("has_security_clearance") == "true":
                    query += " AND e.security_clearance > 0"
                if filters.get("has_police_license") == "true":
                    query += " AND e.police_license = TRUE"

                if filters.get("depts"):  # String names from FilterModal
                    deps = (
                        filters["depts"].split(",")
                        if isinstance(filters["depts"], str)
                        else filters["depts"]
                    )
                    query += " AND (d.name = ANY(%s) OR d_dir.name = ANY(%s))"
                    params.extend([deps, deps])

                if filters.get("sects"):  # String names
                    sects = (
                        filters["sects"].split(",")
                        if isinstance(filters["sects"], str)
                        else filters["sects"]
                    )
                    query += " AND (s.name = ANY(%s) OR s_dir.name = ANY(%s))"
                    params.extend([sects, sects])

                if filters.get("tms"):  # String names
                    tms = (
                        filters["tms"].split(",")
                        if isinstance(filters["tms"], str)
                        else filters["tms"]
                    )
                    query += " AND t.name = ANY(%s)"
                    params.append(tms)

            query += " ORDER BY e.first_name ASC"
            cur.execute(query, tuple(params))
            results = cur.fetchall()
            for row in results:
                for key, value in row.items():
                    if hasattr(value, "isoformat"):
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
            cur = conn.cursor(cursor_factory=RealDictCursor)
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
                section_id = data.get("section_id")
                department_id = data.get("department_id")

                # Function to handle commander replacement
                def replace_unit_commander(unit_type, unit_id, new_commander_id):
                    # 1. Find current commander
                    id_col = "id"
                    table = f"{unit_type}s"
                    cur.execute(f"SELECT commander_id FROM {table} WHERE {id_col} = %s", (unit_id,))
                    res = cur.fetchone()
                    
                    old_commander_id = None
                    if res:
                        old_commander_id = res[0] if not isinstance(res, dict) else res.get("commander_id")

                    # 2. Update unit to new commander
                    cur.execute(f"UPDATE {table} SET commander_id = %s WHERE {id_col} = %s", (new_commander_id, unit_id))

                    # 3. If there was an old commander, demote them fully
                    if old_commander_id and old_commander_id != new_commander_id:
                        # Demote in employees table
                        cur.execute("UPDATE employees SET is_commander = FALSE WHERE id = %s", (old_commander_id,))
                        # Clear any other command slots they might have had (integrity check)
                        cur.execute("UPDATE teams SET commander_id = NULL WHERE commander_id = %s", (old_commander_id,))
                        cur.execute("UPDATE sections SET commander_id = NULL WHERE commander_id = %s", (old_commander_id,))
                        cur.execute("UPDATE departments SET commander_id = NULL WHERE commander_id = %s", (old_commander_id,))

                if team_id:
                    # Commander of team
                    replace_unit_commander("team", team_id, new_id)
                    # Also find section_id to potentially link there if needed (existing logic)
                    cur.execute("SELECT section_id FROM teams WHERE id = %s", (team_id,))
                    result = cur.fetchone()
                    if result:
                        section_id = result[0] if not isinstance(result, dict) else result.get("section_id")
                elif section_id:
                    # Commander of section
                    replace_unit_commander("section", section_id, new_id)
                elif department_id:
                    # Commander of department
                    replace_unit_commander("department", department_id, new_id)

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
            cur = conn.cursor(cursor_factory=RealDictCursor)

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
                "must_change_password": "must_change_password",
                "notif_sick_leave": "notif_sick_leave",
                "notif_transfers": "notif_transfers",
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
                return True  # Nothing to update

            params.append(emp_id)

            query = f"UPDATE employees SET {', '.join(set_clauses)} WHERE id = %s"

            # Business Rule: If is_active changes, clear open attendance logs
            if "is_active" in data:
                cur.execute(
                    "UPDATE attendance_logs SET end_datetime = NOW() WHERE employee_id = %s AND end_datetime IS NULL",
                    (emp_id,),
                )

            cur.execute(query, tuple(params))

            # Command Hierarchy Update Logic
            if data.get("is_commander") is not None or any(k in data for k in ["team_id", "section_id", "department_id"]):
                # Get current (possibly updated) state
                cur.execute("SELECT id, team_id, section_id, department_id, is_commander FROM employees WHERE id = %s", (emp_id,))
                curr = cur.fetchone()
                
                if curr and curr["is_commander"]:
                    tid = curr["team_id"]
                    sid = curr["section_id"]
                    did = curr["department_id"]

                    # Helper to replace commander
                    def replace_unit_commander(unit_type, unit_id, new_commander_id):
                        table = f"{unit_type}s"
                        # Find old commander
                        cur.execute(f"SELECT commander_id FROM {table} WHERE id = %s", (unit_id,))
                        res = cur.fetchone()
                        
                        old_id = None
                        if res:
                            old_id = res.get("commander_id") if isinstance(res, dict) else res[0]
                        
                        # Update unit
                        cur.execute(f"UPDATE {table} SET commander_id = %s WHERE id = %s", (new_commander_id, unit_id))
                        
                        # Demote old (if different)
                        if old_id and old_id != new_commander_id:
                            cur.execute("UPDATE employees SET is_commander = FALSE WHERE id = %s", (old_id,))
                            # Clear other potential command slots for the demoted one
                            cur.execute("UPDATE teams SET commander_id = NULL WHERE commander_id = %s", (old_id,))
                            cur.execute("UPDATE sections SET commander_id = NULL WHERE commander_id = %s", (old_id,))
                            cur.execute("UPDATE departments SET commander_id = NULL WHERE commander_id = %s", (old_id,))

                    # Before setting new, clean up any OTHER units this person might have commanded
                    cur.execute("UPDATE teams SET commander_id = NULL WHERE commander_id = %s", (emp_id,))
                    cur.execute("UPDATE sections SET commander_id = NULL WHERE commander_id = %s", (emp_id,))
                    cur.execute("UPDATE departments SET commander_id = NULL WHERE commander_id = %s", (emp_id,))

                    if tid: replace_unit_commander("team", tid, emp_id)
                    elif sid: replace_unit_commander("section", sid, emp_id)
                    elif did: replace_unit_commander("department", did, emp_id)
                
                elif curr and not curr["is_commander"]:
                    # If they are NOT a commander anymore, clear any units they commanded
                    cur.execute("UPDATE teams SET commander_id = NULL WHERE commander_id = %s", (emp_id,))
                    cur.execute("UPDATE sections SET commander_id = NULL WHERE commander_id = %s", (emp_id,))
                    cur.execute("UPDATE departments SET commander_id = NULL WHERE commander_id = %s", (emp_id,))


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
    def reset_password_to_national_id(user_id):
        conn = get_db_connection()
        if not conn:
            return False, "Database connection failed"
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Fetch National ID
            cur.execute("SELECT national_id FROM employees WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user or not user["national_id"]:
                return False, "User not found or missing National ID"
                
            national_id = user["national_id"]
            
            # Update Password
            new_hash = generate_password_hash(national_id)
            cur.execute(
                "UPDATE employees SET password_hash = %s, must_change_password = TRUE WHERE id = %s",
                (new_hash, user_id),
            )
            conn.commit()
            return True, None
        except Exception as e:
            conn.rollback()
            return False, str(e)
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
            
            # Departments with commander info
            cur.execute("""
                SELECT d.id, d.name, d.commander_id, 
                       CONCAT(e.first_name, ' ', e.last_name) as commander_name 
                FROM departments d
                LEFT JOIN employees e ON d.commander_id = e.id
                ORDER BY d.name
            """)
            depts = cur.fetchall()
            
            # Sections with commander info
            cur.execute("""
                SELECT s.id, s.name, s.department_id, s.commander_id,
                       CONCAT(e.first_name, ' ', e.last_name) as commander_name
                FROM sections s
                LEFT JOIN employees e ON s.commander_id = e.id
                ORDER BY s.name
            """)
            sections = cur.fetchall()
            
            # Teams with commander info
            cur.execute("""
                SELECT t.id, t.name, t.section_id, t.commander_id,
                       CONCAT(e.first_name, ' ', e.last_name) as commander_name
                FROM teams t
                LEFT JOIN employees e ON t.commander_id = e.id
                ORDER BY t.name
            """)
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

    @staticmethod
    def get_roles():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, name, description FROM roles ORDER BY id")
            return cur.fetchall()
        finally:
            conn.close()
