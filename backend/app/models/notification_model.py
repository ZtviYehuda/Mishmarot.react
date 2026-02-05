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

            # 3. Check for Missing Morning Reports
            # This alert shows to commanders if any of their subordinates haven't reported status today
            # STRICT SCOPING: Only show to commanders who have a direct command unit assigned.
            # Explicitly exclude general Admins who don't have a command role from this specific "Call to Action" alert.
            user_has_command = (
                requesting_user.get("commands_team_id")
                or requesting_user.get("commands_section_id")
                or requesting_user.get("commands_department_id")
            )

            if requesting_user.get("notif_morning_report", True) and user_has_command:
                # Check weekend setting
                cur.execute(
                    "SELECT value FROM system_settings WHERE key = 'alerts_weekend_enabled'"
                )
                setting_res = cur.fetchone()
                weekend_alerts_enabled = (
                    setting_res["value"].lower() == "true" if setting_res else False
                )

                show_alert = True
                if not weekend_alerts_enabled:
                    # In Israel: Friday (5) and Saturday (6) are weekend (PostgreSQL DOW uses 0-6 where 0 is Sunday, 6 is Saturday)
                    cur.execute("SELECT EXTRACT(DOW FROM CURRENT_DATE)")
                    dow_res = cur.fetchone()
                    if dow_res:
                        # dow_res['extract'] will be 5.0 for Friday, 6.0 for Saturday
                        dow = int(dow_res["extract"])
                        if dow in [5, 6]:
                            show_alert = False

                if show_alert:
                    # Retrieve IDs of missing employees specifically under this commander's scope
                    missing_query = """
                        SELECT e.id
                        FROM employees e
                        LEFT JOIN teams t ON e.team_id = t.id
                        LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                        LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                        WHERE e.is_active = TRUE 
                          AND e.personal_number != 'admin'
                          AND e.id != %s  -- Exclude the commander themselves
                          AND (
                              (d.id = %s) OR
                              (s.id = %s) OR
                              (t.id = %s)
                          )
                          AND NOT EXISTS (
                              SELECT 1 FROM attendance_logs al
                              WHERE al.employee_id = e.id
                              AND DATE(al.start_datetime) <= CURRENT_DATE
                              AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                              AND (
                                  DATE(al.start_datetime) = CURRENT_DATE  -- Reported today
                                  OR al.status_type_id IN (2, 4, 5, 6)    -- OR is in persistent status
                              )
                          )
                    """
                    # Strict params - always filter by command scope
                    missing_params = [
                        requesting_user["id"],
                        requesting_user.get("commands_department_id"),
                        requesting_user.get("commands_section_id"),
                        requesting_user.get("commands_team_id"),
                    ]

                    cur.execute(missing_query, missing_params)
                    missing_rows = cur.fetchall()
                    missing_count = len(missing_rows)

                    if missing_count > 0:
                        missing_ids = [row["id"] for row in missing_rows]
                        from datetime import datetime

                        today_str = datetime.now().strftime("%Y-%m-%d")
                        alerts.append(
                            {
                                "id": f"missing-reports-{today_str}",
                                "type": "danger",
                                "title": "דיווח חסר ביחידה",
                                "description": f"ישנם {missing_count} שוטרים שטרם הוזן להם סטטוס להיום",
                                "link": "#bulk-update-missing",  # Special link for frontend handler
                                "data": {
                                    "commander_id": requesting_user["id"],
                                    "missing_count": missing_count,
                                    "missing_ids": missing_ids,  # Pass IDs to frontend
                                },
                            }
                        )

            # 4. Check for Internal Messages
            query_msgs = """
                SELECT um.id, um.title, um.description, um.created_at, 
                       s.first_name, s.last_name
                FROM user_messages um
                LEFT JOIN employees s ON um.sender_id = s.id
                WHERE um.recipient_id = %s
                ORDER BY um.created_at DESC
            """
            cur.execute(query_msgs, (requesting_user["id"],))
            messages = cur.fetchall()
            for msg in messages:
                sender_name = (
                    f"{msg['first_name']} {msg['last_name']}"
                    if msg["first_name"]
                    else "מערכת"
                )
                alerts.append(
                    {
                        "id": f"msg-{msg['id']}",
                        "type": "info",
                        "title": f"הודעה מאת {sender_name}",
                        "description": msg["title"] + ": " + msg["description"],
                        "sender": sender_name,
                        "link": "",
                        "data": {"is_message": True, "sender": sender_name},
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
    def send_message(sender_id, recipient_id, title, description):
        """Send an internal message to a specific user"""
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO user_messages (sender_id, recipient_id, title, description)
                VALUES (%s, %s, %s, %s)
            """,
                (sender_id, recipient_id, title, description),
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"❌ Error sending message: {e}")
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
