from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime


class AttendanceModel:
    @staticmethod
    def log_status(
        employee_id,
        status_type_id,
        note=None,
        reported_by=None,
        start_date=None,
        end_date=None,
    ):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE attendance_logs 
                SET end_datetime = CURRENT_TIMESTAMP 
                WHERE employee_id = %s AND end_datetime IS NULL
            """,
                (employee_id,),
            )

            now = datetime.now()
            start = start_date
            if not start_date:
                start = now
            elif isinstance(start_date, str) and len(start_date) == 10:
                # If provided string is just YYYY-MM-DD and matches today, use now()
                if start_date == now.strftime("%Y-%m-%d"):
                    start = now

            cur.execute(
                """
                INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by)
                VALUES (%s, %s, %s, %s, %s, %s)
            """,
                (employee_id, status_type_id, start, end_date, note, reported_by),
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error logging status: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def log_bulk_status(updates, reported_by=None):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            now = datetime.now()
            for update in updates:
                employee_id = update.get("employee_id")
                status_type_id = update.get("status_type_id")
                note = update.get("note")
                start_date = update.get("start_date")
                end_date = update.get("end_date")
                
                if not employee_id or not status_type_id:
                    continue

                # Close previous status
                cur.execute(
                    """
                    UPDATE attendance_logs 
                    SET end_datetime = CURRENT_TIMESTAMP 
                    WHERE employee_id = %s AND end_datetime IS NULL
                """,
                    (employee_id,),
                )

                # Insert new status
                start = start_date
                if not start_date:
                    start = now
                elif isinstance(start_date, str) and len(start_date) == 10:
                    if start_date == now.strftime("%Y-%m-%d"):
                        start = now

                cur.execute(
                    """
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """,
                    (employee_id, status_type_id, start, end_date, note, reported_by),
                )
            
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error bulk logging status: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def get_status_types():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT id, name, color, is_presence FROM status_types ORDER BY id"
            )
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_monthly_summary(year, month):
        conn = get_db_connection()
        if not conn:
            return {}
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT 
                    DATE(al.start_datetime) as date,
                    st.name as status,
                    st.color,
                    COUNT(*) as count
                FROM attendance_logs al
                JOIN status_types st ON al.status_type_id = st.id
                WHERE EXTRACT(YEAR FROM al.start_datetime) = %s 
                AND EXTRACT(MONTH FROM al.start_datetime) = %s
                GROUP BY date, st.name, st.color
                ORDER BY date
            """
            cur.execute(query, (year, month))
            rows = cur.fetchall()
            summary = {}
            for row in rows:
                d = str(row["date"])
                if d not in summary:
                    summary[d] = []
                summary[d].append(row)
            return summary
        finally:
            conn.close()

    @staticmethod
    def get_dashboard_stats(requesting_user=None, filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT 
                    st.id as status_id,
                    st.name as status_name,
                    COUNT(e.id) as count,
                    st.color as color
                FROM employees e
                -- Direct Path Joins (for scoping)
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
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
            
            # 1. Base Scoping (Security)
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    query += " AND d.id = %s"
                    params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    query += " AND s.id = %s"
                    params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    query += " AND t.id = %s"
                    params.append(requesting_user["commands_team_id"])
                else:
                    # Individual Fallback
                    query += " AND e.id = %s"
                    params.append(requesting_user['id'])

            # 2. Drill-down Filters (User Selection)
            if filters:
                if filters.get('department_id'):
                    query += " AND d.id = %s"
                    params.append(filters['department_id'])
                if filters.get('section_id'):
                    query += " AND s.id = %s"
                    params.append(filters['section_id'])
                if filters.get('team_id'):
                    query += " AND t.id = %s"
                    params.append(filters['team_id'])
                if filters.get('status_id'):
                    query += " AND st.id = %s"
                    params.append(filters['status_id'])

            # Exclude requesting user (Commander) from stats
            if requesting_user and requesting_user.get('is_commander'):
                query += " AND e.id != %s"
                params.append(requesting_user['id'])

            query += " GROUP BY st.id, st.name, st.color"
            
            # Debug SQL
            # print(f"Executing SQL: {query} \nParams: {params}")
            
            try:
                cur.execute(query, tuple(params))
                return cur.fetchall()
            except Exception as e:
                print(f"SQL Error in get_dashboard_stats: {e}")
                print(f"Query: {query}")
                print(f"Params: {params}")
                raise e
        finally:
            conn.close()

    @staticmethod
    def get_birthdays(requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT e.first_name, e.last_name, e.birth_date, e.phone_number,
                    DATE_PART('day', e.birth_date) as day,
                    DATE_PART('month', e.birth_date) as month
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                WHERE e.is_active = TRUE AND e.birth_date IS NOT NULL
            """
            params = []
            
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    query += " AND d.id = %s"
                    params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    query += " AND s.id = %s"
                    params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    query += " AND t.id = %s"
                    params.append(requesting_user["commands_team_id"])
                else:
                    query += " AND e.id = %s"
                    params.append(requesting_user['id'])

            # Exclude requesting user from birthdays
            if requesting_user and requesting_user.get('is_commander'):
                query += " AND e.id != %s"
                params.append(requesting_user['id'])

            query += """
                AND (
                    (EXTRACT(DOY FROM e.birth_date) - EXTRACT(DOY FROM CURRENT_DATE) + 365) %% 365 < 7
                )
                ORDER BY month, day
            """
            cur.execute(query, tuple(params))
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_employee_history(employee_id, limit=50):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT 
                    al.id,
                    st.name as status_name,
                    st.color as status_color,
                    al.start_datetime,
                    al.end_datetime,
                    al.note,
                    r.first_name || ' ' || r.last_name as reported_by_name
                FROM attendance_logs al
                JOIN status_types st ON al.status_type_id = st.id
                LEFT JOIN employees r ON al.reported_by = r.id
                WHERE al.employee_id = %s
                ORDER BY al.start_datetime DESC
                LIMIT %s
            """
            cur.execute(query, (employee_id, limit))
            return cur.fetchall()
        finally:
            conn.close()
