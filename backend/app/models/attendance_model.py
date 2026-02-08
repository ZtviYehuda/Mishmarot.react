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
                SET end_datetime = %s 
                WHERE employee_id = %s AND end_datetime IS NULL
            """,
                (datetime.now(), employee_id),
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
                    SET end_datetime = %s 
                    WHERE employee_id = %s AND end_datetime IS NULL
                """,
                    (now, employee_id),
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
                print(
                    f"DEBUG: Inserted log for emp {employee_id}, status {status_type_id}, start {start}"
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
    def get_unit_comparison_stats(requesting_user=None, date=None, days=1, filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            # 1. Determine base grouping level
            grouping_col = "d.name"
            grouping_id = "d.id"
            grouping_label = "department"
            
            # 2. Base Scoping (Security)
            scoping_clause = ""
            scoping_params = []

            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    grouping_col = "s.name"
                    grouping_id = "s.id"
                    grouping_label = "section"
                    scoping_clause = " AND d.id = %s"
                    scoping_params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    grouping_col = "t.name"
                    grouping_id = "t.id"
                    grouping_label = "team"
                    scoping_clause = " AND s.id = %s"
                    scoping_params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    return []

            # 3. Dynamic Filtering & Drill-down Adjustment
            if filters:
                if filters.get("department_id"):
                    scoping_clause += " AND d.id = %s"
                    scoping_params.append(filters["department_id"])
                    # If we filter by dept, we want to see sections
                    grouping_col = "s.name"
                    grouping_id = "s.id"
                    grouping_label = "section"
                
                if filters.get("section_id"):
                    scoping_clause += " AND s.id = %s"
                    scoping_params.append(filters["section_id"])
                    # If we filter by section, we want to see teams
                    grouping_col = "t.name"
                    grouping_id = "t.id"
                    grouping_label = "team"

                if filters.get("team_id"):
                    scoping_clause += " AND t.id = %s"
                    scoping_params.append(filters["team_id"])
                    # Keep at team level or show individuals? Let's stay at team for now.
                    grouping_col = "t.name"
                    grouping_id = "t.id"
                    grouping_label = "team"

                if filters.get("serviceTypes"):
                    srv_list = (
                        filters["serviceTypes"].split(",")
                        if isinstance(filters["serviceTypes"], str)
                        else filters["serviceTypes"]
                    )
                    scoping_clause += " AND srv.name = ANY(%s)"
                    scoping_params.append(srv_list)

            # 3.5. Status Comparison Filter Logic
            count_condition = "st.is_presence = TRUE"
            if filters and filters.get("status_id"):
                count_condition = f"st.id = {int(filters['status_id'])}"

            # 4. Execute Query
            # If days > 1, we calculate average over requested range
            if days > 1:
                query = f"""
                    WITH RECURSIVE date_range AS (
                        SELECT DATE(%s) as date_val
                        UNION ALL
                        SELECT date_val - INTERVAL '1 day'
                        FROM date_range
                        WHERE date_val > DATE(%s) - INTERVAL '%s day' + INTERVAL '1 day'
                    ),
                    daily_presence AS (
                        SELECT 
                            dr.date_val,
                            {grouping_id} as unit_id,
                            COALESCE({grouping_col}, 'ללא שיוך') as unit_name,
                            e.id as emp_id,
                            (
                                SELECT {count_condition}
                                FROM attendance_logs al
                                JOIN status_types st ON al.status_type_id = st.id
                                WHERE al.employee_id = e.id
                                AND DATE(al.start_datetime) <= dr.date_val
                                AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= dr.date_val)
                                ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                            ) as is_present
                        FROM date_range dr
                        CROSS JOIN employees e
                        LEFT JOIN teams t ON e.team_id = t.id
                        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                        LEFT JOIN service_types srv ON e.service_type_id = srv.id
                        WHERE e.is_active = TRUE 
                        AND e.personal_number != 'admin'
                        {scoping_clause}
                        AND e.id != %s
                        AND e.id NOT IN (
                            SELECT commander_id FROM departments WHERE commander_id IS NOT NULL
                            UNION 
                            SELECT commander_id FROM sections WHERE commander_id IS NOT NULL
                        )
                    )
                    SELECT 
                        unit_id,
                        unit_name,
                        COUNT(DISTINCT emp_id) as total_count,
                        ROUND(CAST(COUNT(CASE WHEN is_present = TRUE THEN 1 END) AS NUMERIC) / {days}, 1) as present_count,
                        ROUND(CAST(COUNT(CASE WHEN is_present = FALSE THEN 1 END) AS NUMERIC) / {days}, 1) as absent_count,
                        ROUND(CAST(COUNT(CASE WHEN is_present IS NULL THEN 1 END) AS NUMERIC) / {days}, 1) as unknown_count
                    FROM daily_presence
                    WHERE unit_id IS NOT NULL
                    GROUP BY unit_id, unit_name
                    ORDER BY unit_name
                """
                base_date = date if date else "CURRENT_DATE"
                userId = requesting_user["id"] if requesting_user else None
                final_params = [base_date, base_date, days] + scoping_params + [userId]
                cur.execute(query, tuple(final_params))
            else:
                # Original Snapshot logic for single day
                status_condition = (
                    "AND (end_datetime IS NULL OR end_datetime > CURRENT_TIMESTAMP)"
                )
                status_params = []
                if date:
                    status_condition = "AND DATE(start_datetime) <= %s AND (end_datetime IS NULL OR DATE(end_datetime) >= %s)"
                    status_params = [date, date]

                query = f"""
                    SELECT 
                        {grouping_id} as unit_id,
                        COALESCE({grouping_col}, 'ללא שיוך') as unit_name,
                        COUNT(e.id) as total_count,
                        COUNT(CASE WHEN {count_condition} THEN 1 END) as present_count,
                        COUNT(CASE WHEN st.is_presence = FALSE THEN 1 END) as absent_count,
                        COUNT(CASE WHEN al.id IS NULL THEN 1 END) as unknown_count
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    LEFT JOIN service_types srv ON e.service_type_id = srv.id
                    LEFT JOIN LATERAL (
                        SELECT status_type_id, id FROM attendance_logs 
                        WHERE employee_id = e.id {status_condition}
                        ORDER BY start_datetime DESC, id DESC LIMIT 1
                    ) al ON true
                    LEFT JOIN status_types st ON al.status_type_id = st.id
                    WHERE e.is_active = TRUE 
                    AND e.personal_number != 'admin' 
                    AND e.id != %s
                    AND e.id NOT IN (
                        SELECT commander_id FROM departments WHERE commander_id IS NOT NULL
                        UNION 
                        SELECT commander_id FROM sections WHERE commander_id IS NOT NULL
                    )
                    {scoping_clause}
                    GROUP BY {grouping_id}, {grouping_col}
                    HAVING {grouping_id} IS NOT NULL
                    ORDER BY {grouping_col}
                """
                userId = requesting_user["id"] if requesting_user else None
                final_params = status_params + [userId] + scoping_params
                cur.execute(query, tuple(final_params))

            results = cur.fetchall()
            for r in results:
                r["level"] = grouping_label
            return results
        finally:
            conn.close()

    @staticmethod
    def get_attendance_trend(days=7, requesting_user=None, end_date=None, filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            scoping_clause = ""
            scoping_params = []

            # 1. Base Scoping (Security)
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    scoping_clause = " AND (d.id = %s)"
                    scoping_params.append(requesting_user["commands_department_id"])
                elif requesting_user.get("commands_section_id"):
                    scoping_clause = " AND (s.id = %s)"
                    scoping_params.append(requesting_user["commands_section_id"])
                elif requesting_user.get("commands_team_id"):
                    scoping_clause = " AND (t.id = %s)"
                    scoping_params.append(requesting_user["commands_team_id"])
                else:
                    scoping_clause = " AND e.id = %s"
                    scoping_params.append(requesting_user["id"])

            # 2. Dynamic Filtering
            if filters:
                if filters.get("department_id"):
                    scoping_clause += " AND d.id = %s"
                    scoping_params.append(filters["department_id"])
                if filters.get("section_id"):
                    scoping_clause += " AND s.id = %s"
                    scoping_params.append(filters["section_id"])
                if filters.get("team_id"):
                    scoping_clause += " AND t.id = %s"
                    scoping_params.append(filters["team_id"])
                
                if filters.get("serviceTypes"):
                    srv_list = (
                        filters["serviceTypes"].split(",")
                        if isinstance(filters["serviceTypes"], str)
                        else filters["serviceTypes"]
                    )
                    scoping_clause += " AND srv.name = ANY(%s)"
                    scoping_params.append(srv_list)

            # 2.5. Status Trend Filter Logic
            count_condition = "st.is_presence = TRUE"
            if filters and filters.get("status_id"):
                count_condition = f"st.id = {int(filters['status_id'])}"

            date_anchor = "CURRENT_DATE"
            date_params = []
            if end_date:
                date_anchor = "%s::date"
                date_params = [end_date]

            query = f"""
                WITH params AS (
                    SELECT {date_anchor} - (n || ' days')::interval as date
                    FROM generate_series(0, %s) n
                ),
                scoped_employees AS (
                    SELECT e.id 
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    LEFT JOIN service_types srv ON e.service_type_id = srv.id
                    WHERE e.is_active = TRUE AND e.personal_number != 'admin' AND e.id != %s {scoping_clause}
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
                        WHERE {count_condition}
                        AND DATE(al.start_datetime) <= p.date
                        AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= p.date)
                    ) as present_count
                FROM params p
                ORDER BY p.date ASC
            """

            userId = requesting_user["id"] if requesting_user else None
            final_params = (
                date_params + [days - 1] + ([userId] if userId else []) + scoping_params
            )
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
            status_condition = (
                "AND (end_datetime IS NULL OR end_datetime > CURRENT_TIMESTAMP)"
            )

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
                    ORDER BY start_datetime DESC, id DESC LIMIT 1
                ) last_log ON true
                LEFT JOIN status_types st ON last_log.status_type_id = st.id
                LEFT JOIN service_types srv ON e.service_type_id = srv.id
                WHERE e.is_active = TRUE AND e.personal_number != 'admin'
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
                if filters.get("serviceTypes"):
                    srv_list = (
                        filters["serviceTypes"].split(",")
                        if isinstance(filters["serviceTypes"], str)
                        else filters["serviceTypes"]
                    )
                    query += " AND srv.name = ANY(%s)"
                    params.append(srv_list)

            # Exclude requesting user (Commander/Admin) from stats
            if requesting_user:
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
                SELECT e.id, e.first_name, e.last_name, e.birth_date, e.phone_number,
                    DATE_PART('day', e.birth_date) as day,
                    DATE_PART('month', e.birth_date) as month
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                WHERE e.is_active = TRUE AND e.birth_date IS NOT NULL AND e.personal_number != 'admin'
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
            if requesting_user:
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
                WITH marked_changes AS (
                    SELECT 
                        al.id,
                        al.status_type_id,
                        al.start_datetime,
                        al.end_datetime,
                        al.note,
                        al.reported_by,
                        CASE 
                            WHEN LAG(al.status_type_id) OVER (ORDER BY al.start_datetime) = al.status_type_id THEN 0 
                            ELSE 1 
                        END as is_new_group
                    FROM attendance_logs al
                    WHERE al.employee_id = %s
                ),
                grouped_logs AS (
                    SELECT 
                        *,
                        SUM(is_new_group) OVER (ORDER BY start_datetime) as group_id
                    FROM marked_changes
                ),
                aggregated_history AS (
                    SELECT 
                        MIN(gl.id) as id,
                        st.name as status_name,
                        st.color as status_color,
                        MIN(gl.start_datetime) as start_datetime,
                        CASE 
                            WHEN BOOL_OR(gl.end_datetime IS NULL) THEN NULL 
                            ELSE MAX(gl.end_datetime) 
                        END as end_datetime,
                        (ARRAY_AGG(gl.note ORDER BY gl.start_datetime))[1] as note,
                        (ARRAY_AGG(gl.reported_by ORDER BY gl.start_datetime))[1] as reported_by_id
                    FROM grouped_logs gl
                    JOIN status_types st ON gl.status_type_id = st.id
                    GROUP BY gl.group_id, st.id, st.name, st.color
                )
                SELECT 
                    ah.id,
                    ah.status_name,
                    ah.status_color,
                    ah.start_datetime,
                    ah.end_datetime,
                    ah.note,
                    r.first_name || ' ' || r.last_name as reported_by_name
                FROM aggregated_history ah
                LEFT JOIN employees r ON ah.reported_by_id = r.id
                ORDER BY ah.start_datetime DESC
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

    @staticmethod
    def get_employee_history_export(employee_id, start_date=None, end_date=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                WITH marked_changes AS (
                    SELECT 
                        al.id,
                        al.status_type_id,
                        al.start_datetime,
                        al.end_datetime,
                        al.note,
                        al.reported_by,
                        CASE 
                            WHEN LAG(al.status_type_id) OVER (ORDER BY al.start_datetime) = al.status_type_id THEN 0 
                            ELSE 1 
                        END as is_new_group
                    FROM attendance_logs al
                    WHERE al.employee_id = %s
                ),
                grouped_logs AS (
                    SELECT 
                        *,
                        SUM(is_new_group) OVER (ORDER BY start_datetime) as group_id
                    FROM marked_changes
                ),
                aggregated_history AS (
                    SELECT 
                        MIN(gl.id) as id,
                        st.name as status_name,
                        st.color as status_color,
                        MIN(gl.start_datetime) as start_datetime,
                        CASE 
                            WHEN BOOL_OR(gl.end_datetime IS NULL) THEN NULL 
                            ELSE MAX(gl.end_datetime) 
                        END as end_datetime,
                        (ARRAY_AGG(gl.note ORDER BY gl.start_datetime))[1] as note,
                        (ARRAY_AGG(gl.reported_by ORDER BY gl.start_datetime))[1] as reported_by_id
                    FROM grouped_logs gl
                    JOIN status_types st ON gl.status_type_id = st.id
                    GROUP BY gl.group_id, st.id, st.name, st.color
                )
                SELECT 
                    ah.id,
                    ah.status_name,
                    ah.start_datetime,
                    ah.end_datetime,
                    ah.note,
                    r.first_name || ' ' || r.last_name as reported_by_name
                FROM aggregated_history ah
                LEFT JOIN employees r ON ah.reported_by_id = r.id
                WHERE 1=1
            """

            params = [employee_id]

            if start_date:
                query += " AND DATE(ah.start_datetime) >= %s"
                params.append(start_date)

            if end_date:
                query += " AND DATE(ah.start_datetime) <= %s"
                params.append(end_date)

            query += " ORDER BY ah.start_datetime DESC"

            cur.execute(query, tuple(params))
            return cur.fetchall()
        finally:
            conn.close()
