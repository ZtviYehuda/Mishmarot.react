from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime, date, timedelta


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
            now = datetime.now()
            start = start_date
            if not start_date:
                start = now
            elif isinstance(start_date, str) and len(start_date) == 10:
                if start_date == now.strftime("%Y-%m-%d"):
                    start = now

            # Split range into daily logs, skipping non-weekend statuses on weekends
            # 1. Fetch status info to check for weekend permission
            cur.execute(
                "SELECT name FROM status_types WHERE id = %s", (status_type_id,)
            )
            st_res = cur.fetchone()
            status_name = st_res[0] if st_res else ""
            is_weekend_allowed = "תגבור" in status_name or "אחר" in status_name

            # 2. Determine date range
            start_date_obj = None
            if isinstance(start, str):
                start_date_obj = datetime.strptime(start[:10], "%Y-%m-%d").date()
            elif isinstance(start, (datetime, date)):
                start_date_obj = start.date() if isinstance(start, datetime) else start

            end_date_obj = None
            if end_date:
                if isinstance(end_date, str):
                    end_date_obj = datetime.strptime(end_date[:10], "%Y-%m-%d").date()
                elif isinstance(end_date, (datetime, date)):
                    end_date_obj = (
                        end_date.date() if isinstance(end_date, datetime) else end_date
                    )

            # If it's a multi-day range, split it
            if start_date_obj and end_date_obj and start_date_obj < end_date_obj:
                current_date = start_date_obj
                while current_date <= end_date_obj:
                    # Skip weekends (Friday=4, Saturday=5 in Python's weekday() if we use 0-6 index?)
                    # Wait, datetime.weekday(): 0=Monday... 4=Friday, 5=Saturday, 6=Sunday
                    # In Israel: 4=Friday, 5=Saturday (Wait, 0=Mon, 4=Fri, 5=Sat)
                    wd = current_date.weekday()
                    if (wd == 4 or wd == 5) and not is_weekend_allowed:
                        current_date += timedelta(days=1)
                        continue

                    # Log this specific day
                    day_start = datetime.combine(current_date, datetime.min.time())
                    day_end = datetime.combine(current_date, datetime.max.time())

                    # Close previous
                    cur.execute(
                        "UPDATE attendance_logs SET end_datetime = %s WHERE employee_id = %s AND end_datetime IS NULL AND start_datetime < %s",
                        (day_start, employee_id, day_start),
                    )

                    # Insert
                    cur.execute(
                        """
                        INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                        (
                            employee_id,
                            status_type_id,
                            day_start,
                            day_end,
                            note,
                            reported_by,
                            True,
                        ),
                    )
                    current_date += timedelta(days=1)
            else:
                # Single day or open-ended
                # Close previous status at the new status start time
                cur.execute(
                    """
                    UPDATE attendance_logs 
                    SET end_datetime = %s 
                    WHERE employee_id = %s AND end_datetime IS NULL
                """,
                    (start, employee_id),
                )

                # Insert new status
                cur.execute(
                    """
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                    (
                        employee_id,
                        status_type_id,
                        start,
                        end_date,
                        note,
                        reported_by,
                        True,
                    ),
                )

            # --- COMMAND RETURN LOGIC ---
            # If this is a presence status, automatically return command authority by ending active delegations
            cur.execute(
                "SELECT is_presence FROM status_types WHERE id = %s", (status_type_id,)
            )
            st_info = cur.fetchone()
            if st_info and st_info[0]:  # If is_presence is True
                cur.execute(
                    """
                    UPDATE delegations 
                    SET is_active = FALSE, end_date = %s 
                    WHERE commander_id = %s AND is_active = TRUE
                """,
                    (start, employee_id),
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
    def _get_log_source(user_id=None, date_val=None):
        """
        Returns the table(s) to query for logs.
        If a restoration grant exists, returns a UNION of active and archive.
        Otherwise, returns just active logs.
        """
        from app.models.archive_model import ArchiveModel

        if not user_id or not date_val:
            return "attendance_logs"

        # Check if there's an approved restore request for this user and date
        if ArchiveModel.check_access(user_id, date_val):
            cols = "id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at"
            return f"(SELECT {cols} FROM attendance_logs UNION ALL SELECT {cols} FROM attendance_logs_archive)"
        return "attendance_logs"

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

                # Insert new status
                start = start_date
                if not start_date:
                    start = now
                elif isinstance(start_date, str) and len(start_date) == 10:
                    if start_date == now.strftime("%Y-%m-%d"):
                        start = now

                # Fetch status info to check for weekend permission
                cur.execute(
                    "SELECT name FROM status_types WHERE id = %s", (status_type_id,)
                )
                st_res = cur.fetchone()
                status_name = st_res[0] if st_res else ""
                is_weekend_allowed = "תגבור" in status_name or "אחר" in status_name

                # Determine dates
                start_date_obj = None
                if isinstance(start, str):
                    start_date_obj = datetime.strptime(start[:10], "%Y-%m-%d").date()
                elif isinstance(start, (datetime, date)):
                    start_date_obj = (
                        start.date() if isinstance(start, datetime) else start
                    )

                end_date_obj = None
                if end_date:
                    if isinstance(end_date, str):
                        end_date_obj = datetime.strptime(
                            end_date[:10], "%Y-%m-%d"
                        ).date()
                    elif isinstance(end_date, (datetime, date)):
                        end_date_obj = (
                            end_date.date()
                            if isinstance(end_date, datetime)
                            else end_date
                        )

                # If multi-day range, split it
                if start_date_obj and end_date_obj and start_date_obj < end_date_obj:
                    current_date = start_date_obj
                    while current_date <= end_date_obj:
                        wd = current_date.weekday()
                        if (wd == 4 or wd == 5) and not is_weekend_allowed:
                            current_date += timedelta(days=1)
                            continue

                        day_start = datetime.combine(current_date, datetime.min.time())
                        day_end = datetime.combine(current_date, datetime.max.time())

                        # Surgical removal/truncation of existing logs for this day
                        # 1. Delete logs fully contained within this day
                        cur.execute(
                            "DELETE FROM attendance_logs WHERE employee_id = %s AND start_datetime >= %s AND end_datetime <= %s",
                            (employee_id, day_start, day_end),
                        )

                        # 2. Truncate logs that start before but end DURING or after the day
                        cur.execute(
                            "UPDATE attendance_logs SET end_datetime = %s WHERE employee_id = %s AND start_datetime < %s AND (end_datetime IS NULL OR end_datetime >= %s)",
                            (
                                day_start - timedelta(seconds=1),
                                employee_id,
                                day_start,
                                day_start,
                            ),
                        )

                        # 3. Truncate logs that start DURING the day but end after
                        cur.execute(
                            "UPDATE attendance_logs SET start_datetime = %s WHERE employee_id = %s AND start_datetime >= %s AND start_datetime <= %s AND (end_datetime IS NULL OR end_datetime > %s)",
                            (
                                day_end + timedelta(seconds=1),
                                employee_id,
                                day_start,
                                day_end,
                                day_end,
                            ),
                        )

                        cur.execute(
                            """
                            INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                            (
                                employee_id,
                                status_type_id,
                                day_start,
                                day_end,
                                note,
                                reported_by,
                                True,
                            ),
                        )
                        current_date += timedelta(days=1)
                else:
                    # Single day / open-ended
                    # Determine day bounds if it's a full-day update
                    if isinstance(start, (datetime, date)) or (
                        isinstance(start, str) and len(start) == 10
                    ):
                        day_start = datetime.combine(
                            start_date_obj, datetime.min.time()
                        )
                        day_end = datetime.combine(start_date_obj, datetime.max.time())

                        # Apply same surgical logic for single day
                        cur.execute(
                            "DELETE FROM attendance_logs WHERE employee_id = %s AND start_datetime >= %s AND end_datetime <= %s",
                            (employee_id, day_start, day_end),
                        )
                        cur.execute(
                            "UPDATE attendance_logs SET end_datetime = %s WHERE employee_id = %s AND start_datetime < %s AND (end_datetime IS NULL OR end_datetime >= %s)",
                            (
                                day_start - timedelta(seconds=1),
                                employee_id,
                                day_start,
                                day_start,
                            ),
                        )
                        cur.execute(
                            "UPDATE attendance_logs SET start_datetime = %s WHERE employee_id = %s AND start_datetime >= %s AND start_datetime <= %s AND (end_datetime IS NULL OR end_datetime > %s)",
                            (
                                day_end + timedelta(seconds=1),
                                employee_id,
                                day_start,
                                day_end,
                                day_end,
                            ),
                        )

                        start_to_insert = day_start
                        end_to_insert = day_end
                    else:
                        # If it's a specific timestamp (unlikely from Roster but good to handle)
                        cur.execute(
                            "UPDATE attendance_logs SET end_datetime = %s WHERE employee_id = %s AND end_datetime IS NULL AND start_datetime < %s",
                            (start, employee_id, start),
                        )
                        start_to_insert = start
                        end_to_insert = end_date

                    cur.execute(
                        """
                        INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                        (
                            employee_id,
                            status_type_id,
                            start_to_insert,
                            end_to_insert,
                            note,
                            reported_by,
                            True,
                        ),
                    )

                # --- COMMAND RETURN LOGIC (Bulk) ---
                cur.execute(
                    "SELECT is_presence FROM status_types WHERE id = %s",
                    (status_type_id,),
                )
                st_info = cur.fetchone()
                if st_info and st_info[0]:
                    cur.execute(
                        """
                        UPDATE delegations 
                        SET is_active = FALSE, end_date = %s 
                        WHERE commander_id = %s AND is_active = TRUE
                    """,
                        (start, employee_id),
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
    def log_scope_status(
        scope_type, scope_id, status_type_id, start_date, end_date, note=None, reported_by=None
    ):
        """
        Logs a status for ALL employees in a given scope.
        scope_type: 'team', 'section', 'department'
        """
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # 1. Find all active employees in scope
            query = "SELECT id FROM employees WHERE is_active = TRUE AND username != 'admin'"
            if scope_type == "team":
                query += " AND team_id = %s"
            elif scope_type == "section":
                query += " AND (section_id = %s OR team_id IN (SELECT id FROM teams WHERE section_id = %s))"
            elif scope_type == "department":
                query += " AND (department_id = %s OR section_id IN (SELECT id FROM sections WHERE department_id = %s) OR team_id IN (SELECT t.id FROM teams t JOIN sections s ON t.section_id = s.id WHERE s.department_id = %s))"
            
            if scope_type == "team":
                cur.execute(query, (scope_id,))
            elif scope_type == "section":
                cur.execute(query, (scope_id, scope_id))
            elif scope_type == "department":
                cur.execute(query, (scope_id, scope_id, scope_id))
            else:
                return False # Invalid scope

            employees = cur.fetchall()
            if not employees:
                return True # No one to update
            
            updates = []
            for emp in employees:
                updates.append({
                    "employee_id": emp["id"],
                    "status_type_id": status_type_id,
                    "start_date": start_date,
                    "end_date": end_date,
                    "note": note
                })
            
            # Reuse bulk logic
            success = AttendanceModel.log_bulk_status(updates, reported_by=reported_by)
            
            if success:
                # Send notifications to all affected employees
                from app.models.notification_model import NotificationModel
                
                # Get status name
                cur.execute("SELECT name FROM status_types WHERE id = %s", (status_type_id,))
                st_res = cur.fetchone()
                status_name = st_res[0] if st_res else "אירוע יחידה"
                
                msg_title = f"נקבע {status_name}"
                msg_desc = f"עבור התאריכים {start_date} עד {end_date or start_date}"
                if note:
                    msg_desc += f". הערה: {note}"
                
                for emp in employees:
                    if emp["id"] != reported_by:
                        NotificationModel.send_message(reported_by, emp["id"], msg_title, msg_desc)
            
            return success
        except Exception as e:
            print(f"Error logging scope status: {e}")
            return False
        finally:
            conn.close()



    @staticmethod
    def upsert_roster_log(employee_id, status_type_id, date_obj, reported_by=None):
        """
        Sets a specific daily roster entry (00:00-23:59).
        Overwrites any existing logs for that day.
        Sets is_verified = FALSE (unless date < today).
        """
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()

            # Define range for the day
            start_dt = datetime.combine(date_obj, datetime.min.time())
            end_dt = datetime.combine(date_obj, datetime.max.time())

            # Roster entries are considered verified/final by default
            is_verified = True

            # 1. Surgical overlapping management
            # a) Delete logs fully contained within this day
            cur.execute(
                "DELETE FROM attendance_logs WHERE employee_id = %s AND start_datetime >= %s AND end_datetime <= %s",
                (employee_id, start_dt, end_dt),
            )

            # b) Truncate logs that surround this day (Start before, End after) - SPLIT them
            cur.execute(
                """
                SELECT id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified
                FROM attendance_logs
                WHERE employee_id = %s 
                AND start_datetime < %s 
                AND (end_datetime IS NULL OR end_datetime > %s)
            """,
                (employee_id, start_dt, end_dt),
            )
            surrounders = cur.fetchall()
            for s in surrounders:
                # Insert the 'after' portion
                cur.execute(
                    """
                    INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                    (
                        employee_id,
                        s[1],
                        end_dt + timedelta(seconds=1),
                        s[3],
                        s[4],
                        s[5],
                        s[6],
                    ),
                )
                # Update the 'before' portion
                cur.execute(
                    "UPDATE attendance_logs SET end_datetime = %s WHERE id = %s",
                    (start_dt - timedelta(seconds=1), s[0]),
                )

            # c) Truncate logs that start before but end DURING the day
            cur.execute(
                """
                UPDATE attendance_logs 
                SET end_datetime = %s 
                WHERE employee_id = %s 
                AND start_datetime < %s 
                AND end_datetime >= %s AND end_datetime <= %s
            """,
                (
                    start_dt - timedelta(seconds=1),
                    employee_id,
                    start_dt,
                    start_dt,
                    end_dt,
                ),
            )

            # d) Truncate logs that start DURING but end after the day
            cur.execute(
                """
                UPDATE attendance_logs 
                SET start_datetime = %s 
                WHERE employee_id = %s 
                AND start_datetime >= %s AND start_datetime <= %s 
                AND (end_datetime IS NULL OR end_datetime > %s)
            """,
                (end_dt + timedelta(seconds=1), employee_id, start_dt, end_dt, end_dt),
            )

            # 2. Insert new daily log
            cur.execute(
                """
                INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, end_datetime, reported_by, is_verified)
                VALUES (%s, %s, %s, %s, %s, %s)
            """,
                (
                    employee_id,
                    status_type_id,
                    start_dt,
                    end_dt,
                    reported_by,
                    is_verified,
                ),
            )

            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error upserting roster: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def verify_day(date_obj, employee_ids=None):
        """
        Marks records for a specific day as verified.
        If employee_ids is provided, only verifies those.
        """
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()

            start_dt = datetime.combine(date_obj, datetime.min.time())
            end_dt = datetime.combine(date_obj, datetime.max.time())

            query = """
                UPDATE attendance_logs
                SET is_verified = TRUE, verified_at = NOW()
                WHERE start_datetime <= %s 
                AND (end_datetime IS NULL OR end_datetime >= %s)
                AND is_verified = FALSE
            """
            params = [end_dt, start_dt]

            if employee_ids:
                query += " AND employee_id = ANY(%s)"
                params.append(list(employee_ids))

            cur.execute(query, tuple(params))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error verifying day: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def auto_approve_daily_roster():
        """
        Automatically approves (verifies) all roster logs for TODAY that are currently unverified.
        This runs on dashboard load to ensure the 'pull' happens automatically in the morning.
        """
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()

            # Update all unverified logs for today to verified
            # Logic: IF start_date is Today (or in past) AND is_verified is False -> Set True
            # We also ensure the log is actually active today (start <= now <= end/null)

            query = """
                UPDATE attendance_logs
                SET is_verified = TRUE, verified_at = NOW()
                WHERE start_datetime::date <= CURRENT_DATE 
                AND (end_datetime IS NULL OR end_datetime >= CURRENT_TIMESTAMP)
                AND is_verified = FALSE
            """
            cur.execute(query)
            count = cur.rowcount
            if count > 0:
                print(
                    f"[AUTO-ROSTER] Automatically verified {count} records for today."
                )

            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error in auto_approve_daily_roster: {e}")
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
                "SELECT id, name, color, is_presence, is_persistent, parent_status_id FROM status_types ORDER BY COALESCE(parent_status_id, id), id"
            )
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_monthly_summary(year, month, requesting_user_id=None):
        conn = get_db_connection()
        if not conn:
            return {}
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            table_source = AttendanceModel._get_log_source(requesting_user_id, f"{year}-{month:02d}-01")
            query = f"""
                SELECT 
                    DATE(al.start_datetime) as date,
                    st.name as status,
                    st.color,
                    COUNT(*) as count
                FROM {table_source} al
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
    def get_unit_comparison_stats(
        requesting_user=None, date=None, days=1, filters=None
    ):
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
                    grouping_col = "e.first_name || ' ' || e.last_name"
                    grouping_id = "e.id"
                    grouping_label = "employee"
                    scoping_clause = " AND t.id = %s"
                    scoping_params.append(requesting_user["commands_team_id"])

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
                status_id = int(filters["status_id"])
                count_condition = (
                    f"(st.id = {status_id} OR st.parent_status_id = {status_id})"
                )

            # 4. Execute Query
            # If days > 1, we calculate average over requested range
            if days > 1:
                query = f"""
                    WITH RECURSIVE date_range AS (
                        SELECT DATE(%s) as date_val
                        UNION ALL
                        SELECT (date_val - INTERVAL '1 day')::date
                        FROM date_range
                        WHERE date_val > DATE(%s) - (INTERVAL '1 day' * %s) + INTERVAL '1 day'
                    ),
                    daily_presence AS (
                        SELECT 
                            dr.date_val,
                            {grouping_id} as unit_id,
                            COALESCE({grouping_col}, 'ללא שיוך') as unit_name,
                            e.id as emp_id,
                            (
                                SELECT st.is_presence
                                FROM (
                                    SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs
                                    UNION ALL
                                    SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs_archive
                                ) al
                                JOIN status_types st ON al.status_type_id = st.id
                                WHERE al.employee_id = e.id
                                AND DATE(al.start_datetime) <= dr.date_val
                                AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= dr.date_val)
                                AND (st.is_persistent = TRUE OR DATE(al.start_datetime) = dr.date_val)
                                ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                            ) as is_present
                        FROM date_range dr
                        CROSS JOIN employees e
                        LEFT JOIN teams t ON e.team_id = t.id
                        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                        LEFT JOIN service_types srv ON e.service_type_id = srv.id
                        WHERE e.is_active = TRUE 
                        AND e.username != 'admin'
                        {scoping_clause}
                        AND e.id != %s
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
                # Standardized Snapshot logic for single day
                target_date = date if date else date.today().strftime("%Y-%m-%d")
                status_params = [target_date, target_date, target_date]

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
                        SELECT al.status_type_id, al.id,
                               (CASE WHEN al.status_type_id IS NOT NULL
                                          AND (
                                            (al.end_datetime IS NOT NULL AND DATE(al.end_datetime) >= %s)
                                            OR
                                            (al.end_datetime IS NULL AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s))
                                          )
                                     THEN TRUE
                                     ELSE FALSE
                               END) as is_active_for_date
                        FROM (
                            SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs
                            UNION ALL
                            SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs_archive
                        ) al
                        JOIN status_types sti ON al.status_type_id = sti.id
                        WHERE al.employee_id = e.id AND DATE(al.start_datetime) <= %s
                        ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                    ) al ON al.is_active_for_date = TRUE
                    LEFT JOIN status_types st ON al.status_type_id = st.id
                    WHERE e.is_active = TRUE 
                    AND e.username != 'admin' 
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
            print(f"[DEBUG] Comparison stats results count: {len(results)}")
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
                status_id = int(filters["status_id"])
                count_condition = (
                    f"(st.id = {status_id} OR st.parent_status_id = {status_id})"
                )

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
                    WHERE e.is_active = TRUE AND e.username != 'admin' AND e.id != %s {scoping_clause}
                )
                SELECT 
                    TO_CHAR(p.date, 'DD/MM') as date_str,
                    p.date,
                    (SELECT COUNT(*) FROM scoped_employees) as total_employees,
                    (
                        SELECT COUNT(*)
                        FROM scoped_employees se
                        LEFT JOIN LATERAL (
                            SELECT st.is_presence, st.id
                            FROM (
                                SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs
                                UNION ALL
                                SELECT id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at FROM attendance_logs_archive
                            ) al
                            JOIN status_types st ON al.status_type_id = st.id
                            WHERE al.employee_id = se.id
                                AND DATE(al.start_datetime) <= p.date 
                                AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= p.date)
                                AND (st.is_persistent = TRUE OR DATE(al.start_datetime) = p.date)
                                ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                        ) st ON true
                        WHERE {count_condition}
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
            return {"stats": [], "total_employees": 0}
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)

            target_date = (filters or {}).get("date") or date.today().strftime("%Y-%m-%d")

            # Build scoping conditions dynamically
            scope_conditions = ["e.is_active = TRUE", "e.username != 'admin'"]
            scope_params = {"target_date": target_date}

            # 1. Base Scoping (Security)
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    scope_conditions.append("d.id = %(cmd_dept_id)s")
                    scope_params["cmd_dept_id"] = requesting_user["commands_department_id"]
                elif requesting_user.get("commands_section_id"):
                    scope_conditions.append("s.id = %(cmd_sec_id)s")
                    scope_params["cmd_sec_id"] = requesting_user["commands_section_id"]
                elif requesting_user.get("commands_team_id"):
                    scope_conditions.append("t.id = %(cmd_team_id)s")
                    scope_params["cmd_team_id"] = requesting_user["commands_team_id"]
                else:
                    scope_conditions.append("e.id = %(cmd_user_id)s")
                    scope_params["cmd_user_id"] = requesting_user["id"]

            # 2. Drill-down Filters (User Selection)
            if filters:
                if filters.get("department_id"):
                    scope_conditions.append("d.id = %(f_dept_id)s")
                    scope_params["f_dept_id"] = filters["department_id"]
                if filters.get("section_id"):
                    scope_conditions.append("s.id = %(f_sec_id)s")
                    scope_params["f_sec_id"] = filters["section_id"]
                if filters.get("team_id"):
                    scope_conditions.append("t.id = %(f_team_id)s")
                    scope_params["f_team_id"] = filters["team_id"]
                if filters.get("serviceTypes"):
                    srv_list = (
                        filters["serviceTypes"].split(",")
                        if isinstance(filters["serviceTypes"], str)
                        else filters["serviceTypes"]
                    )
                    scope_conditions.append("srv.name = ANY(%(srv_list)s)")
                    scope_params["srv_list"] = srv_list
                if filters.get("min_age"):
                    scope_conditions.append("EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) >= %(min_age)s")
                    scope_params["min_age"] = int(filters["min_age"])
                if filters.get("max_age"):
                    scope_conditions.append("EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) <= %(max_age)s")
                    scope_params["max_age"] = int(filters["max_age"])

            # Exclude requesting user (Commander/Admin) from stats
            if requesting_user:
                scope_conditions.append("e.id != %(req_user_id)s")
                scope_params["req_user_id"] = requesting_user["id"]

            scope_where = " AND ".join(scope_conditions)

            requesting_user_id = requesting_user.get("id") if requesting_user else None
            table_source = AttendanceModel._get_log_source(requesting_user_id, target_date)

            query = f"""
                WITH scoped_employees AS (
                    SELECT e.id
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    LEFT JOIN service_types srv ON e.service_type_id = srv.id
                    WHERE {scope_where}
                ),
                employee_status AS (
                    SELECT
                        se.id as emp_id,
                        (CASE 
                            WHEN last_log.status_type_id IS NOT NULL 
                                 AND (
                                     (last_log.end_datetime IS NOT NULL AND DATE(last_log.end_datetime) >= %(target_date)s)
                                     OR 
                                     (last_log.end_datetime IS NULL AND (last_log.is_persistent = TRUE OR DATE(last_log.start_datetime) = %(target_date)s))
                                 ) 
                            THEN last_log.status_type_id 
                            ELSE NULL 
                        END) as status_type_id,
                        last_log.is_verified,
                        last_log.note
                    FROM scoped_employees se
                    LEFT JOIN LATERAL (
                        SELECT al.status_type_id, al.is_verified, al.start_datetime, al.end_datetime, sti.is_persistent, al.note
                        FROM {table_source} al
                        JOIN status_types sti ON al.status_type_id = sti.id
                        WHERE al.employee_id = se.id
                        AND DATE(al.start_datetime) <= %(target_date)s
                        ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                    ) last_log ON true
                )
                SELECT
                    st.id as status_id,
                    (CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF(es.note, ''), 'אחר') ELSE st.name END) as status_name,
                    COUNT(es.emp_id) as count,
                    COUNT(CASE WHEN es.is_verified = FALSE THEN 1 END) as unverified_count,
                    st.color as color
                FROM employee_status es
                JOIN status_types st ON es.status_type_id = st.id
                GROUP BY st.id, (CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF(es.note, ''), 'אחר') ELSE st.name END), st.color
                UNION ALL
                SELECT
                    NULL as status_id,
                    'לא דווח' as status_name,
                    COUNT(es.emp_id) as count,
                    0 as unverified_count,
                    '#94a3b8' as color
                FROM employee_status es
                WHERE es.status_type_id IS NULL
                HAVING COUNT(es.emp_id) > 0
                ORDER BY count DESC
            """

            total_query = f"""
                SELECT COUNT(e.id) as total
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                LEFT JOIN service_types srv ON e.service_type_id = srv.id
                WHERE {scope_where}
            """

            age_query = f"""
                WITH scoped_ages AS (
                    SELECT 
                        EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) as age
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    LEFT JOIN service_types srv ON e.service_type_id = srv.id
                    WHERE {scope_where} AND e.birth_date IS NOT NULL
                ),
                age_ranges AS (
                    SELECT 
                        CASE 
                            WHEN age BETWEEN 18 AND 21 THEN '18-21'
                            WHEN age BETWEEN 22 AND 25 THEN '22-25'
                            WHEN age BETWEEN 26 AND 30 THEN '26-30'
                            WHEN age BETWEEN 31 AND 35 THEN '31-35'
                            WHEN age BETWEEN 36 AND 40 THEN '36-40'
                            WHEN age BETWEEN 41 AND 50 THEN '41-50'
                            ELSE '50+'
                        END as range_label,
                        age
                    FROM scoped_ages
                )
                SELECT 
                    range_label,
                    COUNT(*) as count,
                    (SELECT ROUND(AVG(age), 1) FROM scoped_ages) as avg_age
                FROM age_ranges
                GROUP BY range_label
                ORDER BY range_label
            """

            try:
                cur.execute(query, scope_params)
                stats = cur.fetchall()
                cur.execute(total_query, scope_params)
                total_row = cur.fetchone()
                total_employees = total_row["total"] if total_row else 0

                cur.execute(age_query, scope_params)
                age_data = cur.fetchall()
                avg_age = age_data[0]["avg_age"] if age_data else 0
                age_distribution = [{"range": r["range_label"], "count": r["count"]} for r in age_data]

                # Check for archive access
                has_archive_access = False
                if requesting_user_id and target_date:
                    from app.models.archive_model import ArchiveModel
                    has_archive_access = ArchiveModel.check_access(requesting_user_id, target_date)

                return {
                    "stats": stats,
                    "total_employees": total_employees,
                    "age_distribution": age_distribution,
                    "average_age": avg_age,
                    "has_archive_access": has_archive_access,
                    "table_source": table_source
                }
            except Exception as e:
                print(f"SQL Error in get_dashboard_stats: {e}")
                import traceback
                traceback.print_exc()
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
                WHERE e.is_active = TRUE AND e.birth_date IS NOT NULL AND e.username != 'admin'
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
                        CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF((ARRAY_AGG(gl.note ORDER BY gl.start_datetime))[1], ''), st.name) ELSE st.name END as status_name,
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
    def get_logs_for_employees(employee_ids, start_date, end_date, requesting_user_id=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Align Roster logs with Smart Continuity:
            # Only show logs that actually manifest on those dates.
            # 1. Started on or before the end of the range
            # 2. Ends on or after the start of the range (or is ongoing)
            # 3. If NOT persistent, must have started on one of the days in the range
            # Instead of a complex multi-join for each day, we fetch logs that meet basic Smart Continuity
            # criteria for the WHOLE range.
            table_source = AttendanceModel._get_log_source(requesting_user_id, start_date)
            query = f"""
                SELECT 
                    al.id as log_id,
                    al.employee_id,
                    al.status_type_id,
                    CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF(al.note, ''), st.name) ELSE st.name END as status_name,
                    st.color as status_color,
                    al.start_datetime,
                    al.end_datetime,
                    al.is_verified
                FROM {table_source} al
                JOIN status_types st ON al.status_type_id = st.id
                WHERE al.employee_id = ANY(%s)
                AND DATE(al.start_datetime) <= %s 
                AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= %s)
                AND (st.is_persistent = TRUE OR (DATE(al.start_datetime) >= %s AND DATE(al.start_datetime) <= %s))
                ORDER BY al.start_datetime ASC
            """
            cur.execute(
                query, (list(employee_ids), end_date, start_date, start_date, end_date)
            )
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
                        CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF((ARRAY_AGG(gl.note ORDER BY gl.start_datetime))[1], ''), st.name) ELSE st.name END as status_name,
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

    @staticmethod
    def get_daily_attendance_log(date, requesting_user=None, filters=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            params = []

            # "Status active on that date"
            # We want BOTH verified and unverified (planned) logs to show up here,
            # so the daily attendance view reflects the Roster planning.
            params.extend([date, date, date])

            query = f"""
                SELECT 
                    e.id,
                    e.first_name,
                    e.last_name,
                    e.username,
                    CASE WHEN st.name = 'אחר' THEN COALESCE(NULLIF(last_log.note, ''), st.name) ELSE st.name END as status_name,
                    st.color as status_color,
                    last_log.start_datetime,
                    last_log.end_datetime,
                    last_log.note,
                    t.name as team_name,
                    s.name as section_name
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                LEFT JOIN service_types srv ON e.service_type_id = srv.id
                LEFT JOIN LATERAL (
                    SELECT al.status_type_id, al.start_datetime, al.end_datetime, al.note,
                           (CASE WHEN al.status_type_id IS NOT NULL
                                      AND (
                                        (al.end_datetime IS NOT NULL AND DATE(al.end_datetime) >= %s)
                                        OR
                                        (al.end_datetime IS NULL AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s))
                                      )
                                 THEN TRUE
                                 ELSE FALSE
                           END) as is_active_for_date
                    FROM attendance_logs al
                    JOIN status_types sti ON al.status_type_id = sti.id
                    WHERE al.employee_id = e.id AND DATE(al.start_datetime) <= %s
                    ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                ) last_log ON last_log.is_active_for_date = TRUE
                LEFT JOIN status_types st ON last_log.status_type_id = st.id
                WHERE e.is_active = TRUE AND e.username != 'admin'
            """

            # 1. Base Scoping (Security)
            if requesting_user and not requesting_user.get("is_admin"):
                if requesting_user.get("commands_department_id"):
                    query += " AND d.id = %s"
                    params.append(int(requesting_user["commands_department_id"]))
                elif requesting_user.get("commands_section_id"):
                    query += " AND s.id = %s"
                    params.append(int(requesting_user["commands_section_id"]))
                elif requesting_user.get("commands_team_id"):
                    query += " AND t.id = %s"
                    params.append(int(requesting_user["commands_team_id"]))
                else:
                    # Individual Fallback
                    query += " AND e.id = %s"
                    params.append(int(requesting_user["id"]))

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

            query += " ORDER BY e.first_name, e.last_name"

            cur.execute(query, tuple(params))
            results = cur.fetchall()

            # Convert dates/datetimes to ISO strings for JSON serialization
            for row in results:
                for key, value in row.items():
                    if hasattr(value, "isoformat"):
                        row[key] = value.isoformat()
            return results
        finally:
            conn.close()
