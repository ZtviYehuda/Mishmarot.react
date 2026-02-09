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
                    SELECT DISTINCT ON (cs.id) cs.id, cs.first_name, cs.last_name, 
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

                query += " ORDER BY cs.id"
                cur.execute(query, params)
                sick_leave_rows = cur.fetchall()

                # Filter out the requesting user's own sick leave (they know they are sick)
                sick_employees = [
                    emp for emp in sick_leave_rows if emp["id"] != requesting_user["id"]
                ]

                if sick_employees:
                    count = len(sick_employees)
                    # Create a summary description
                    if count == 1:
                        emp = sick_employees[0]
                        desc = f"השוטר/ת {emp['first_name']} {emp['last_name']} נמצא/ת במחלה כבר {int(emp['days_sick'])} ימים"
                        link = f"/employees/{emp['id']}"
                    else:
                        # List first 3 names
                        names = [
                            f"{e['first_name']} {e['last_name']}"
                            for e in sick_employees[:3]
                        ]
                        if count > 3:
                            names.append(f"ועוד {count - 3} אחרים")
                        desc = f"ישנם {count} שוטרים במחלה ממושכת: {', '.join(names)}"
                        link = "/attendance"  # General link since it's multiple people

                    alerts.append(
                        {
                            "id": f"sick-summary-{len(sick_employees)}",  # Dynamic ID based on count to avoid stale keys if needed, or just 'sick-summary'
                            "type": "danger",
                            "title": f"מחלה ממושכת ({count})",
                            "description": desc,
                            "link": link,
                            "data": {
                                "employee_ids": [e["id"] for e in sick_employees],
                                "sick_employees": [
                                    {
                                        "id": e["id"],
                                        "first_name": e["first_name"],
                                        "last_name": e["last_name"],
                                        "days_sick": e["days_sick"],
                                        "start_date": (
                                            e["effective_start"].isoformat()
                                            if e["effective_start"]
                                            else None
                                        ),
                                    }
                                    for e in sick_employees
                                ],
                            },
                        }
                    )


            # 3. Check for Missing Morning Reports (if enabled)
            if requesting_user.get("notif_morning_report", True) and (requesting_user.get("is_commander") or requesting_user.get("is_admin")):
                missing_query = """
                    SELECT COUNT(e.id) as count
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    WHERE e.is_active = TRUE 
                      AND e.personal_number != 'admin'
                      AND e.id != %s
                      AND NOT EXISTS (
                          SELECT 1 FROM attendance_logs al
                          WHERE al.employee_id = e.id
                          AND DATE(al.start_datetime) <= CURRENT_DATE
                          AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                          AND (
                              DATE(al.start_datetime) = CURRENT_DATE
                              OR al.status_type_id IN (2, 4, 5, 6) -- Items that persist (Vacation, Course, etc.)
                          )
                      )
                """
                params_missing = [requesting_user["id"]]

                if not requesting_user.get("is_admin"):
                    missing_query += """
                      AND (
                          (d.id = %s) OR
                          (s.id = %s) OR
                          (t.id = %s)
                      )
                    """
                    params_missing.extend([
                        requesting_user.get("commands_department_id"),
                        requesting_user.get("commands_section_id"),
                        requesting_user.get("commands_team_id")
                    ])

                cur.execute(missing_query, params_missing)
                res_missing = cur.fetchone()
                if res_missing and res_missing["count"] > 0:
                    alerts.append({
                        "id": "missing-reports",
                        "type": "warning",
                        "title": "אי-דיווח בוקר ביחידה",
                        "description": f"ישנם {res_missing['count']} שוטרים ביחידתך שטרם הוזן להם סטטוס להיום",
                        "link": "/attendance"
                    })

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

            # 5. Check for Missed Birthdays (Shabbat & Holidays)
            # Logic: Has birthday in last 3 days (Fri/Sat/Holiday) AND no message sent in last 7 days
            if requesting_user.get("is_commander") or requesting_user.get("is_admin"):
                # Simplified check: Employees with birthday in last few days who haven't received a message recently
                query_bday = """
                    SELECT id, first_name, last_name, birth_date, phone_number, last_birthday_message_sent
                    FROM employees
                    WHERE is_active = TRUE
                    AND birth_date IS NOT NULL
                    AND (
                        -- Check for recent birthdays (last 3 days)
                        (
                            EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 day')
                            AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE - INTERVAL '1 day')
                        ) OR (
                            EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '2 days')
                            AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE - INTERVAL '2 days')
                        ) OR (
                            EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '3 days')
                            AND EXTRACT(DAY FROM birth_date) = EXTRACT(DAY FROM CURRENT_DATE - INTERVAL '3 days')
                        )
                    )
                    AND (
                        last_birthday_message_sent IS NULL 
                        OR last_birthday_message_sent < CURRENT_DATE - INTERVAL '7 days'
                    )
                """
                params_bday = []

                if not requesting_user.get("is_admin"):
                    # Add scope filters
                    scope_filter = ""
                    if requesting_user.get("commands_department_id"):
                        scope_filter = " AND (department_id = %s OR department_id_direct = %s)"  # Pseudocode, adjust to actual column names
                        # Actually let's reuse earlier join logic or keep it simple if IDs are direct
                        pass

                # Re-using the robust query structure
                # Let's use a simpler approach: fetch potential candidates and filter in python for complex holiday logic?
                # Or just use the simple SQL logic: Birthday was recently, message wasn't sent.
                # The user asked specifically about Shabbat/Holydays.
                # A general "Recent Missed Birthday" alert covers this.

                # Let's refine the query to join structure for scoping
                query_bday = """
                    SELECT e.id, e.first_name, e.last_name, e.birth_date, e.phone_number
                    FROM employees e
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    WHERE e.is_active = TRUE
                    AND e.birth_date IS NOT NULL
                    AND (
                       -- Birthday within last 3 days
                       to_char(e.birth_date, 'MM-DD') IN (
                           to_char(CURRENT_DATE - INTERVAL '1 day', 'MM-DD'),
                           to_char(CURRENT_DATE - INTERVAL '2 days', 'MM-DD'),
                           to_char(CURRENT_DATE - INTERVAL '3 days', 'MM-DD')
                       )
                    )
                    AND (
                        e.last_birthday_message_sent IS NULL 
                        OR e.last_birthday_message_sent < CURRENT_DATE - INTERVAL '30 days' -- Message not sent this year/month
                    )
                    AND e.id != %s
                """
                params_bday = [requesting_user["id"]]

                if not requesting_user.get("is_admin"):
                    if requesting_user.get("commands_department_id"):
                        query_bday += " AND d.id = %s"
                        params_bday.append(requesting_user["commands_department_id"])
                    elif requesting_user.get("commands_section_id"):
                        query_bday += " AND s.id = %s"
                        params_bday.append(requesting_user["commands_section_id"])
                    elif requesting_user.get("commands_team_id"):
                        query_bday += " AND t.id = %s"
                        params_bday.append(requesting_user["commands_team_id"])

                cur.execute(query_bday, params_bday)
                missed_bdays = cur.fetchall()

                if missed_bdays:
                    count = len(missed_bdays)
                    desc = f"ישנם {count} שוטרים עם ימי הולדת מהימים האחרונים שטרם קיבלו ברכה"
                    if count == 1:
                        desc = f"השוטר/ת {missed_bdays[0]['first_name']} {missed_bdays[0]['last_name']} חגג/ה יום הולדת לאחרונה"

                    alerts.append(
                        {
                            "id": "missed-birthdays",
                            "type": "info",
                            "title": "🎁 ימי הולדת שפוספסו",
                            "description": desc,
                            "link": "/",  # Opens dashboard where birthdays card is
                            "data": {
                                "missed_birthdays": [
                                    dict(row) for row in missed_bdays
                                ]  # Pass data for frontend processing if needed
                            },
                        }
                    )
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
