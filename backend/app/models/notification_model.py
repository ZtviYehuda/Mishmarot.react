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
                # We need to scope this to the commander's unit
                # For now, let's get all pending if admin, or relevant if commander
                query = "SELECT COUNT(*) as count FROM transfer_requests WHERE status = 'pending'"
                params = []

                if not requesting_user.get("is_admin"):
                    # To be strict, only transfers involving their unit.
                    # But the current TransferModel might not have deep scoping.
                    # Let's just check if there are ANY pending for now as a simple alert.
                    pass

                cur.execute(query, params)
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
                    SELECT e.id, e.first_name, e.last_name, al.start_datetime,
                           EXTRACT(DAY FROM (CURRENT_TIMESTAMP - al.start_datetime)) as days_sick
                    FROM employees e
                    JOIN attendance_logs al ON e.id = al.employee_id
                    JOIN status_types st ON al.status_type_id = st.id
                    -- Security Scoping
                    LEFT JOIN teams t ON e.team_id = t.id
                    LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                    LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                    WHERE st.name = 'מחלה' 
                      AND al.end_datetime IS NULL 
                      AND al.start_datetime < (CURRENT_TIMESTAMP - INTERVAL '4 days')
                      AND e.is_active = TRUE
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
                        query += " AND e.id = %s"
                        params.append(requesting_user["id"])

                cur.execute(query, params)
                sick_leave = cur.fetchall()
                for emp in sick_leave:
                    alerts.append(
                        {
                            "id": f"sick-{emp['id']}",
                            "type": "danger",
                            "title": "מחלה ממושכת",
                            "description": f"השוטר {emp['first_name']} {emp['last_name']} נמצא במחלה כבר {int(emp['days_sick'])} ימים",
                            "link": f"/employees/{emp['id']}",
                        }
                    )

            return alerts
        finally:
            conn.close()
