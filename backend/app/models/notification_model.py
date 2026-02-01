from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


class NotificationModel:
    @staticmethod
    def get_alerts(requesting_user):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            alerts = []

            # 1. Check for Pending Transfers (if enabled)
            if requesting_user.get("notif_transfers", True):
                # Enhanced query to include hierarchy for visibility check
                base_query = """
                    SELECT COUNT(DISTINCT tr.id) as count 
                    FROM transfer_requests tr
                    LEFT JOIN teams t ON (tr.target_type = 'team' AND tr.target_id = t.id)
                    LEFT JOIN sections s ON (
                        (tr.target_type = 'section' AND tr.target_id = s.id) OR 
                        (tr.target_type = 'team' AND t.section_id = s.id)
                    )
                    LEFT JOIN departments d ON (
                        (tr.target_type = 'department' AND tr.target_id = d.id) OR 
                        (s.department_id = d.id)
                    )
                    WHERE tr.status = 'pending'
                """
                params = []

                if not requesting_user.get("is_admin"):
                    # Visibility Scoping: Check if user commands the target unit OR its parent units
                    scoping = """
                        AND (
                            (d.id = %s) OR
                            (s.id = %s) OR
                            (t.id = %s)
                        )
                    """
                    base_query += scoping
                    params.extend(
                        [
                            requesting_user.get("commands_department_id"),
                            requesting_user.get("commands_section_id"),
                            requesting_user.get("commands_team_id"),
                        ]
                    )

                cur.execute(base_query, params)
                res = cur.fetchone()
                if res and res["count"] > 0:
                    alerts.append(
                        {
                            "id": "transfers",
                            "type": "warning",
                            "title": "בקשות העברה ממתינות",
                            "description": f"ישנן {res['count']} בקשות העברה הממתינות לאישורך",
                            "link": "/transfers",
                        }
                    )

            # 2. Check for Long Sick Leave (if enabled)
            if requesting_user.get("notif_sick_leave", True):
                query = """
                    WITH current_sick AS (
                        SELECT e.id, e.first_name, e.last_name, e.team_id, e.section_id, e.department_id,
                               al.start_datetime, al.status_type_id
                        FROM employees e
                        JOIN attendance_logs al ON e.id = al.employee_id
                        JOIN status_types st ON al.status_type_id = st.id
                        WHERE st.name = 'מחלה' 
                          AND al.end_datetime IS NULL 
                          AND e.is_active = TRUE
                    )
                    SELECT cs.id, cs.first_name, cs.last_name, 
                           -- Effective start date is the end of the last non-sick log, 
                           -- or the start of the first ever log if no non-sick log exists.
                           COALESCE(
                               (SELECT MAX(end_datetime) 
                                FROM attendance_logs 
                                WHERE employee_id = cs.id 
                                  AND status_type_id != cs.status_type_id
                                  AND end_datetime <= cs.start_datetime),
                               (SELECT MIN(start_datetime) 
                                FROM attendance_logs 
                                WHERE employee_id = cs.id)
                           ) as effective_start,
                           
                           (CURRENT_DATE - DATE(COALESCE(
                               (SELECT MAX(end_datetime) 
                                FROM attendance_logs 
                                WHERE employee_id = cs.id 
                                  AND status_type_id != cs.status_type_id
                                  AND end_datetime <= cs.start_datetime),
                               (SELECT MIN(start_datetime) 
                                FROM attendance_logs 
                                WHERE employee_id = cs.id)
                           ))) + 1 as days_sick
                    FROM current_sick cs
                    -- Join explicit structure tables for scoping outside the CTE if needed, 
                    -- or just reuse the logic.
                    LEFT JOIN teams t ON cs.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR cs.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR cs.department_id = d.id)
                    WHERE 
                      (CURRENT_DATE - DATE(COALESCE(
                           (SELECT MAX(end_datetime) 
                            FROM attendance_logs 
                            WHERE employee_id = cs.id 
                              AND status_type_id != cs.status_type_id
                              AND end_datetime <= cs.start_datetime),
                           (SELECT MIN(start_datetime) 
                            FROM attendance_logs 
                            WHERE employee_id = cs.id)
                      ))) + 1 >= 4
                """
                params = []

                # Scoping
                if not requesting_user.get("is_admin"):
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
                        query += " AND cs.id = %s"
                        params.append(requesting_user["id"])

                cur.execute(query, params)
                sick_leave = cur.fetchall()
                for emp in sick_leave:
                    alerts.append(
                        {
                            "id": f"sick-{emp['id']}",
                            "type": "danger",
                            "title": "מחלה ממושכת",
                            "description": f"השוטר {emp['first_name']} {emp['last_name']} נמצא במחלה כבר {int(emp['days_sick'])} ימים רצופים",
                            "link": f"/employees/{emp['id']}",
                        }
                    )

            # 3. Check for Missing Morning Reports (After 09:00)
            from datetime import datetime

            now = datetime.now()

            # Check system settings regarding weekends
            cur.execute(
                "SELECT value FROM system_settings WHERE key = 'alerts_weekend_enabled'"
            )
            setting_res = cur.fetchone()
            weekend_enabled = False  # Default
            if setting_res and setting_res["value"].lower() == "true":
                weekend_enabled = True

            is_weekend = now.weekday() in [4, 5]

            # Check if it's after 09:00 AND allowed by weekend policy
            if now.hour >= 9:
                if is_weekend and not weekend_enabled:
                    pass  # Skip missing report alerts on weekends if disabled
                else:
                    # Find teams with missing reports
                    # We look for active employees who have no attendance log starting today
                    # Find teams with missing reports
                    # We look for active employees who have no attendance log starting today
                    query_teams = """
                        SELECT t.id, t.name, e_cmdr.first_name, e_cmdr.last_name, e_cmdr.id as commander_id,
                               s.id as section_id, d.id as department_id,
                               COUNT(e.id) as missing_count,
                               array_agg(e.id) as missing_ids
                        FROM employees e
                        JOIN teams t ON e.team_id = t.id
                        JOIN sections s ON t.section_id = s.id
                        JOIN departments d ON s.department_id = d.id
                        LEFT JOIN employees e_cmdr ON t.commander_id = e_cmdr.id
                        LEFT JOIN attendance_logs al ON e.id = al.employee_id 
                             AND al.start_datetime >= CURRENT_DATE 
                             AND al.start_datetime < CURRENT_DATE + INTERVAL '1 day'
                        WHERE e.is_active = TRUE AND al.id IS NULL
                        GROUP BY t.id, t.name, e_cmdr.first_name, e_cmdr.last_name, e_cmdr.id, s.id, d.id
                    """
                    cur.execute(query_teams)
                    missing_teams = cur.fetchall()

                    for team in missing_teams:
                        # Logic: Who should see this?
                        # 1. Admins
                        # 2. Section Commander of this team's section
                        # 3. Department Commander of this team's department

                        show_alert = False
                        if requesting_user.get("is_admin"):
                            show_alert = True
                        elif (
                            requesting_user.get("commands_department_id")
                            == team["department_id"]
                        ):
                            show_alert = True
                        elif (
                            requesting_user.get("commands_section_id")
                            == team["section_id"]
                        ):
                            show_alert = True

                        # Do not show to the team commander themselves here, or maybe yes?
                        # The request said "show to superiors".
                        if show_alert and team["first_name"]:
                            alerts.append(
                                {
                                    "id": f"missing-team-{team['id']}",
                                    "type": "warning",
                                    "title": "דיווח בוקר לא הושלם",
                                    "description": f"מפקד חוליית {team['name']}, {team['first_name']} {team['last_name']}, טרם השלים דיווח עבור {team['missing_count']} שוטרים",
                                    "link": "/attendance",
                                    "data": {
                                        "missing_ids": team["missing_ids"],
                                        "team_id": team["id"],
                                        "commander_id": team["commander_id"],
                                        "commander_name": f"{team['first_name']} {team['last_name']}",
                                        "missing_count": team["missing_count"],
                                    },
                                }
                            )

                    # Find sections with missing members (who are not in teams)
                    query_sections = """
                        SELECT s.id, s.name, e_cmdr.first_name, e_cmdr.last_name, e_cmdr.id as commander_id,
                               d.id as department_id,
                               COUNT(e.id) as missing_count,
                               array_agg(e.id) as missing_ids
                        FROM employees e
                        JOIN sections s ON e.section_id = s.id
                        JOIN departments d ON s.department_id = d.id
                        LEFT JOIN employees e_cmdr ON s.commander_id = e_cmdr.id
                        LEFT JOIN attendance_logs al ON e.id = al.employee_id 
                             AND al.start_datetime >= CURRENT_DATE 
                             AND al.start_datetime < CURRENT_DATE + INTERVAL '1 day'
                        WHERE e.is_active = TRUE AND e.team_id IS NULL AND al.id IS NULL
                        GROUP BY s.id, s.name, e_cmdr.first_name, e_cmdr.last_name, e_cmdr.id, d.id
                    """
                    cur.execute(query_sections)
                    missing_sections = cur.fetchall()

                    for section in missing_sections:
                        show_alert = False
                        if requesting_user.get("is_admin"):
                            show_alert = True
                        elif (
                            requesting_user.get("commands_department_id")
                            == section["department_id"]
                        ):
                            show_alert = True

                        if show_alert and section["first_name"]:
                            alerts.append(
                                {
                                    "id": f"missing-section-{section['id']}",
                                    "type": "warning",
                                    "title": "דיווח בוקר לא הושלם",
                                    "description": f"מפקד מדור {section['name']}, {section['first_name']} {section['last_name']}, טרם השלים דיווח עבור {section['missing_count']} שוטרים",
                                    "link": "/attendance",
                                    "data": {
                                        "missing_ids": section["missing_ids"],
                                        "section_id": section["id"],
                                        "commander_id": section["commander_id"],
                                        "commander_name": f"{section['first_name']} {section['last_name']}",
                                        "missing_count": section["missing_count"],
                                    },
                                }
                            )

            return alerts
        finally:
            conn.close()

    @staticmethod
    def mark_as_read(
        user_id, notification_id, title="התראה", description="", type="info", link=""
    ):
        """Mark a notification as read for a specific user with a snapshot of its content"""
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO notification_reads (user_id, notification_id, title, description, type, link)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, notification_id) DO UPDATE 
                SET title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    type = EXCLUDED.type,
                    link = EXCLUDED.link,
                    read_at = CURRENT_TIMESTAMP
            """,
                (user_id, notification_id, title, description, type, link),
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"❌ Error marking notification as read: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def mark_as_unread(user_id, notification_id):
        """Mark a notification as unread (remove from history) for a specific user"""
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                """
                DELETE FROM notification_reads 
                WHERE user_id = %s AND notification_id = %s
            """,
                (user_id, notification_id),
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"❌ Error marking notification as unread: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def mark_all_as_read(user_id, notifications):
        """Mark multiple notifications as read in a single transaction"""
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()

            # Prepare data for executemany
            values = []
            for notif in notifications:
                values.append(
                    (
                        user_id,
                        notif.get("id"),
                        notif.get("title", "התראה"),
                        notif.get("description", ""),
                        notif.get("type", "info"),
                        notif.get("link", ""),
                    )
                )

            from psycopg2.extras import execute_values

            execute_values(
                cur,
                """
                INSERT INTO notification_reads (user_id, notification_id, title, description, type, link)
                VALUES %s
                ON CONFLICT (user_id, notification_id) DO UPDATE 
                SET title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    type = EXCLUDED.type,
                    link = EXCLUDED.link,
                    read_at = CURRENT_TIMESTAMP
            """,
                values,
            )

            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"❌ Error marking all notifications as read: {e}")
            import traceback

            traceback.print_exc()
            return False
        finally:
            conn.close()

    @staticmethod
    def get_read_notifications(user_id):
        """Get list of notification IDs that the user has already read"""
        conn = get_db_connection()
        if not conn:
            return set()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT notification_id 
                FROM notification_reads 
                WHERE user_id = %s
            """,
                (user_id,),
            )
            rows = cur.fetchall()
            # Ensure IDs are strings to match the alerts formatting
            return {str(row[0]) for row in rows}
        except Exception as e:
            print(f"❌ Error getting read notifications: {e}")
            return set()
        finally:
            conn.close()

    @staticmethod
    def get_read_history(user_id):
        """Get notification history with read timestamps for a specific user"""
        from psycopg2.extras import RealDictCursor

        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Fetch actual snapshot data instead of placeholder
            cur.execute(
                """
                SELECT 
                    notification_id as id,
                    title,
                    description,
                    type,
                    link,
                    read_at
                FROM notification_reads 
                WHERE user_id = %s
                ORDER BY read_at DESC
                LIMIT 100
            """,
                (user_id,),
            )
            rows = cur.fetchall()

            # Convert rows to list of dicts with isoformat date
            history = []
            from datetime import timezone

            for row in rows:
                row_dict = dict(row)
                if row_dict["read_at"]:
                    # Assuming PostgreSQL saves as naive timestamp (local time usually in dev, UTC in prod)
                    # To allow frontend to convert properly, we'll ensure it has timezone info or format clearly.
                    # Best practice: Treat as UTC if naive, let frontend convert to local.
                    dt = row_dict["read_at"]
                    if dt.tzinfo is None:
                        # If naive, assume it's whatever the DB server time is.
                        # If we want to force Israeli time display issues to resolve if it *was* UTC:
                        # But simple isoformat() is safest default.
                        row_dict["read_at"] = dt.isoformat()
                    else:
                        row_dict["read_at"] = dt.isoformat()

                # Use saved values, fallback if they happen to be NULL (migration edge case)
                if not row_dict.get("title"):
                    row_dict["title"] = "התראה שנקראה"

                history.append(row_dict)

            return history
        except Exception as e:
            print(f"❌ Error getting notification history: {e}")
            import traceback

            traceback.print_exc()
            return []
        finally:
            conn.close()
