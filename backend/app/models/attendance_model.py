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
    def get_unit_comparison_stats(requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            # Determine grouping level based on user role
            grouping_col = "d.name"
            grouping_id = "d.id"
            grouping_label = "department"

            scoping_clause = ""
            params = []

            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    grouping_col = "s.name"
                    grouping_id = "s.id"
                    grouping_label = "section"
                    scoping_clause = " AND d.id = %s"
                    params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    grouping_col = "t.name"
                    grouping_id = "t.id"
                    grouping_label = "team"
                    scoping_clause = " AND s.id = %s"
                    params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    return []

            query = f"""
                SELECT 
                    {grouping_id} as unit_id,
                    COALESCE({grouping_col}, 'אחר') as unit_name,
                    COUNT(e.id) as total_count,
                    COUNT(CASE WHEN st.is_presence = TRUE THEN 1 END) as present_count,
                    COUNT(CASE WHEN st.is_presence = FALSE THEN 1 END) as absent_count,
                    COUNT(CASE WHEN al.id IS NULL THEN 1 END) as unknown_count
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                -- Current Status Join
                LEFT JOIN LATERAL (
                    SELECT status_type_id, id FROM attendance_logs 
                    WHERE employee_id = e.id AND end_datetime IS NULL
                    ORDER BY start_datetime DESC LIMIT 1
                ) al ON true
                LEFT JOIN status_types st ON al.status_type_id = st.id
                WHERE e.is_active = TRUE {scoping_clause}
                GROUP BY {grouping_id}, {grouping_col}
                ORDER BY {grouping_col}
            """

            cur.execute(query, tuple(params))
            results = cur.fetchall()

            # Add metadata about level
            for r in results:
                r["level"] = grouping_label

            return results
        finally:
            conn.close()

    @staticmethod
    def get_attendance_trend(days=7, requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            scoping_clause = ""
            params = []

            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    scoping_clause = " AND (d.id = %s)"
                    params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    scoping_clause = " AND (s.id = %s)"
                    params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    scoping_clause = " AND (t.id = %s)"
                    params.append(requesting_user["commands_team_id"])
                else:
                    scoping_clause = " AND e.id = %s"
                    params.append(requesting_user["id"])

            query = f"""
                WITH params AS (
                    SELECT CURRENT_DATE - (n || ' days')::interval as date
                    FROM generate_series(0, %s) n
                ),
                scoped_employees AS (
                    SELECT e.id 
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    WHERE e.is_active = TRUE {scoping_clause}
                )
                SELECT 
                    TO_CHAR(p.date, 'DD/MM') as date_str,
                    p.date,
                    (SELECT COUNT(*) FROM scoped_employees) as total_employees,
                    (
                        SELECT COUNT(DISTINCT se.id)
                        FROM scoped_employees se
                        JOIN attendance_logs al ON al.employee_id = se.id
                        JOIN status_types st ON al.status_type_id = st.id
                        WHERE st.is_presence = TRUE
                        AND DATE(al.start_datetime) <= p.date
                        AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= p.date)
                    ) as present_count
                FROM params p
                ORDER BY p.date ASC
            """

            final_params = [days - 1] + params
            cur.execute(query, tuple(final_params))
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_dashboard_stats(requesting_user=None, filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            params = []
            status_condition = "AND end_datetime IS NULL"

            if filters and filters.get("date"):
                status_condition = "AND DATE(start_datetime) <= %s AND (end_datetime IS NULL OR DATE(end_datetime) >= %s)"
                params.extend([filters["date"], filters["date"]])

            query = f"""
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
                    WHERE employee_id = e.id {status_condition}
                    ORDER BY start_datetime DESC LIMIT 1
                ) last_log ON true
                LEFT JOIN status_types st ON last_log.status_type_id = st.id
                WHERE e.is_active = TRUE
            """

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
                    params.append(requesting_user["id"])

            # 2. Drill-down Filters (User Selection)
            if filters:
                if filters.get("department_id"):
                    query += " AND d.id = %s"
                    params.append(filters["department_id"])
                if filters.get("section_id"):
                    query += " AND s.id = %s"
                    params.append(filters["section_id"])
                if filters.get("team_id"):
                    query += " AND t.id = %s"
                    params.append(filters["team_id"])
                if filters.get("status_id"):
                    query += " AND st.id = %s"
                    params.append(filters["status_id"])

            # Exclude requesting user (Commander) from stats
            if requesting_user and requesting_user.get("is_commander"):
                query += " AND e.id != %s"
                params.append(requesting_user["id"])

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
                    params.append(requesting_user["id"])

            # Exclude requesting user from birthdays
            if requesting_user and requesting_user.get("is_commander"):
                query += " AND e.id != %s"
                params.append(requesting_user["id"])

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

    @staticmethod
    def get_logs_for_employees(employee_ids, start_date, end_date):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Find logs that overlap with the range [start, end]
            # Overlap logic: LogStart <= RangeEnd AND (LogEnd IS NULL OR LogEnd >= RangeStart)
            query = """
                SELECT 
                    al.employee_id,
                    st.name as status_name,
                    al.start_datetime,
                    al.end_datetime
                FROM attendance_logs al
                JOIN status_types st ON al.status_type_id = st.id
                WHERE al.employee_id = ANY(%s)
                AND DATE(al.start_datetime) <= %s 
                AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
                ORDER BY al.start_datetime ASC
            """
            cur.execute(query, (list(employee_ids), end_date, start_date))
            return cur.fetchall()
        finally:
            conn.close()
