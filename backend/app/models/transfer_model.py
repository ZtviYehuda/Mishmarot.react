from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


class TransferModel:
    @staticmethod
    def create_request(data, requester_id):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id FROM transfer_requests WHERE employee_id = %s AND status = 'pending'",
                (data["employee_id"],),
            )
            if cur.fetchone():
                raise ValueError("Employee already has a pending transfer request")

            # Get employee's current location to save as source
            cur.execute(
                """
                SELECT department_id, section_id, team_id 
                FROM employees 
                WHERE id = %s
                """,
                (data["employee_id"],),
            )
            emp_location = cur.fetchone()
            
            # Determine source_type and source_id based on current location
            if emp_location:
                dept_id, section_id, team_id = emp_location
                if team_id:
                    source_type, source_id = "team", team_id
                elif section_id:
                    source_type, source_id = "section", section_id
                elif dept_id:
                    source_type, source_id = "department", dept_id
                else:
                    source_type, source_id = None, None
            else:
                source_type, source_id = None, None

            query = """
                INSERT INTO transfer_requests (
                    employee_id, requester_id, 
                    source_type, source_id,
                    target_type, target_id, 
                    reason, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id
            """
            cur.execute(
                query,
                (
                    data["employee_id"],
                    requester_id,
                    source_type,
                    source_id,
                    data["target_type"],
                    data["target_id"],
                    data.get("reason"),
                ),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            
            # --- NOTIFICATION ---
            try:
                TransferModel._notify_transfer_event(new_id, 'created')
            except Exception as e:
                print(f"⚠️ Notification failed after transfer creation: {e}")
                
            return new_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def _notify_transfer_event(request_id, event_type):
        """
        Helper to send email notifications for transfer lifecycle events.
        """
        from app.utils.email_service import send_email
        conn = get_db_connection()
        if not conn: return
        
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Fetch complete request data with names
            query = """
                SELECT tr.*, 
                       (e.first_name || ' ' || e.last_name) as employee_name,
                       (req.first_name || ' ' || req.last_name) as requester_name,
                       req.email as requester_email,
                       CASE 
                           WHEN tr.target_type = 'department' THEN d.name
                           WHEN tr.target_type = 'section' THEN d_target_s.name || ' / ' || s.name
                           WHEN tr.target_type = 'team' THEN d_target_t.name || ' / ' || s_target_t.name || ' / ' || t.name
                       END as target_name,
                       CASE 
                           WHEN tr.target_type = 'department' THEN dept_cmdr.email
                           WHEN tr.target_type = 'section' THEN sec_cmdr.email
                           WHEN tr.target_type = 'team' THEN team_cmdr.email
                       END as target_commander_email,
                        CASE 
                           WHEN tr.target_type = 'department' THEN dept_cmdr.first_name
                           WHEN tr.target_type = 'section' THEN sec_cmdr.first_name
                           WHEN tr.target_type = 'team' THEN team_cmdr.first_name
                       END as target_commander_name
                FROM transfer_requests tr
                JOIN employees e ON tr.employee_id = e.id
                JOIN employees req ON tr.requester_id = req.id
                
                -- Target Unit Name Joins
                LEFT JOIN departments d ON (tr.target_type = 'department' AND tr.target_id = d.id)
                LEFT JOIN sections s ON (tr.target_type = 'section' AND tr.target_id = s.id)
                LEFT JOIN teams t ON (tr.target_type = 'team' AND tr.target_id = t.id)
                LEFT JOIN departments d_target_s ON (tr.target_type = 'section' AND s.department_id = d_target_s.id)
                LEFT JOIN sections s_target_t ON (tr.target_type = 'team' AND t.section_id = s_target_t.id)
                LEFT JOIN departments d_target_t ON (tr.target_type = 'team' AND s_target_t.department_id = d_target_t.id)
                
                -- Target Commander Joins
                LEFT JOIN employees dept_cmdr ON (tr.target_type = 'department' AND d.commander_id = dept_cmdr.id)
                LEFT JOIN employees sec_cmdr ON (tr.target_type = 'section' AND s.commander_id = sec_cmdr.id)
                LEFT JOIN employees team_cmdr ON (tr.target_type = 'team' AND t.commander_id = team_cmdr.id)
                
                WHERE tr.id = %s
            """
            cur.execute(query, (request_id,))
            req = cur.fetchone()
            if not req: return

            if event_type == 'created':
                # Notify Target Commander
                if req['target_commander_email']:
                    subject = f"בקשת ניוד חדשה: {req['employee_name']} ליחידתך"
                    body = f"""
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום {req['target_commander_name']},</h2>
                        <p>הוגשה בקשת ניוד חדשה עבור <strong>{req['employee_name']}</strong> ליחידתך (<strong>{req['target_name']}</strong>).</p>
                        <p><strong>הוגש ע"י:</strong> {req['requester_name']}</p>
                        <p><strong>נימוק:</strong> {req['reason'] or 'לא צוין'}</p>
                        <br>
                        <a href="http://localhost:5173/transfers" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">לצפייה בבקשה ואישור</a>
                    </div>
                    """
                    send_email(req['target_commander_email'], subject, body)
                    
            elif event_type in ['approved', 'rejected']:
                # Notify Requester
                if req['requester_email']:
                    status_text = "אושרה" if event_type == 'approved' else "נדחתה"
                    color = "#16a34a" if event_type == 'approved' else "#dc2626"
                    
                    rejection_html = f"<p><strong>סיבת דחייה:</strong> {req['rejection_reason']}</p>" if event_type == 'rejected' else ""
                    
                    subject = f"עדכון בקשת ניוד: {req['employee_name']} - {status_text}"
                    body = f"""
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום {req['requester_name']},</h2>
                        <p>בקשת הניוד שהגשת עבור <strong>{req['employee_name']}</strong> ליחידת <strong>{req['target_name']}</strong> <span style="color: {color}; font-weight: bold;">{status_text}</span>.</p>
                        {rejection_html}
                        <br>
                        <a href="http://localhost:5173/transfers" style="background-color: #475569; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">לצפייה בהיסטוריית בקשות</a>
                    </div>
                    """
                    send_email(req['requester_email'], subject, body)
                    
        finally:
            conn.close()

    @staticmethod
    def get_pending_requests(requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT tr.*, 
                       (e.first_name || ' ' || e.last_name) as employee_name,
                       e.personal_number,
                       (req.first_name || ' ' || req.last_name) as requester_name,
                       CASE 
                           WHEN req.team_id IS NOT NULL THEN 'מפקד חוליית ' || req_t.name
                           WHEN req.section_id IS NOT NULL THEN 'מפקד מדור ' || req_s.name
                           WHEN req.department_id IS NOT NULL THEN 'מפקד מחלקת ' || req_d.name
                           ELSE 'מטה'
                       END as requester_unit,
                       -- Source path (current location)
                       CASE 
                           WHEN e.team_id IS NOT NULL THEN d_src.name || ' / ' || s_src.name || ' / ' || t_src.name
                           WHEN e.section_id IS NOT NULL THEN d_src.name || ' / ' || s_src.name
                           WHEN e.department_id IS NOT NULL THEN d_src.name
                           ELSE 'מטה'
                       END as source_name,
                       -- Target path (destination)
                       CASE 
                           WHEN tr.target_type = 'department' THEN d.name
                           WHEN tr.target_type = 'section' THEN d_target_s.name || ' / ' || s.name
                           WHEN tr.target_type = 'team' THEN d_target_t.name || ' / ' || s_target_t.name || ' / ' || t.name
                       END as target_name
                FROM transfer_requests tr
                JOIN employees e ON tr.employee_id = e.id
                JOIN employees req ON tr.requester_id = req.id
                -- Requester unit joins
                LEFT JOIN teams req_t ON req.team_id = req_t.id
                LEFT JOIN sections req_s ON req.section_id = req_s.id
                LEFT JOIN departments req_d ON req.department_id = req_d.id
                
                -- Target joins
                LEFT JOIN departments d ON tr.target_type = 'department' AND tr.target_id = d.id
                LEFT JOIN sections s ON tr.target_type = 'section' AND tr.target_id = s.id
                LEFT JOIN teams t ON tr.target_type = 'team' AND tr.target_id = t.id
                
                -- Target hierarchy for sections
                LEFT JOIN departments d_target_s ON tr.target_type = 'section' AND s.department_id = d_target_s.id
                
                -- Target hierarchy for teams
                LEFT JOIN sections s_target_t ON tr.target_type = 'team' AND t.section_id = s_target_t.id
                LEFT JOIN departments d_target_t ON tr.target_type = 'team' AND s_target_t.department_id = d_target_t.id
                
                -- Source labels (for current location)
                LEFT JOIN teams t_src ON e.team_id = t_src.id
                LEFT JOIN sections s_src ON e.section_id = s_src.id
                LEFT JOIN departments d_src ON e.department_id = d_src.id
                WHERE tr.status = 'pending'
            """
            params = []
            
            # Visibility Scoping
            if requesting_user and not requesting_user.get("is_admin"):
                # Commanders see requests where they are either:
                # 1. The target commander (to approve)
                # 2. The requester (to monitor their own request)
                scoping = """
                    AND (
                        (tr.target_type = 'department' AND tr.target_id = %s) OR
                        (tr.target_type = 'section' AND tr.target_id = %s) OR
                        (tr.target_type = 'team' AND tr.target_id = %s) OR
                        (tr.requester_id = %s)
                    )
                """
                query += scoping
                params.extend([
                    requesting_user.get("commands_department_id"),
                    requesting_user.get("commands_section_id"),
                    requesting_user.get("commands_team_id"),
                    requesting_user.get("id")
                ])
                
            query += " ORDER BY tr.created_at DESC"
            cur.execute(query, tuple(params))
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def approve_request(request_id, approver_user):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT * FROM transfer_requests WHERE id = %s AND status = 'pending'",
                (request_id,),
            )
            req = cur.fetchone()
            if not req:
                return False

            # Permission Check: Admin or Target Commander
            is_authorized = False
            if approver_user.get("is_admin"):
                is_authorized = True
            else:
                if req["target_type"] == "department" and req["target_id"] == approver_user.get("commands_department_id"):
                    is_authorized = True
                elif req["target_type"] == "section" and req["target_id"] == approver_user.get("commands_section_id"):
                    is_authorized = True
                elif req["target_type"] == "team" and req["target_id"] == approver_user.get("commands_team_id"):
                    is_authorized = True

            if not is_authorized:
                print(f"[AUTH ERROR] User {approver_user['id']} tried to approve request {request_id} for unit {req['target_id']} ({req['target_type']})")
                return False

            if req["target_type"] == "department":
                cur.execute(
                    "UPDATE employees SET department_id = %s, section_id = NULL, team_id = NULL WHERE id = %s",
                    (req["target_id"], req["employee_id"]),
                )
            elif req["target_type"] == "section":
                # Find department for this section
                cur.execute(
                    "SELECT department_id FROM sections WHERE id = %s",
                    (req["target_id"],),
                )
                dept_res = cur.fetchone()
                dept_id = dept_res["department_id"] if dept_res else None

                cur.execute(
                    "UPDATE employees SET department_id = %s, section_id = %s, team_id = NULL WHERE id = %s",
                    (dept_id, req["target_id"], req["employee_id"]),
                )
            elif req["target_type"] == "team":
                # Find section and department for this team
                cur.execute(
                    """
                    SELECT s.id as section_id, s.department_id 
                    FROM teams t 
                    JOIN sections s ON t.section_id = s.id 
                    WHERE t.id = %s
                """,
                    (req["target_id"],),
                )
                hierarchy = cur.fetchone()

                if hierarchy:
                    cur.execute(
                        "UPDATE employees SET department_id = %s, section_id = %s, team_id = %s WHERE id = %s",
                        (
                            hierarchy["department_id"],
                            hierarchy["section_id"],
                            req["target_id"],
                            req["employee_id"],
                        ),
                    )
                else:
                    cur.execute(
                        "UPDATE employees SET team_id = %s WHERE id = %s",
                        (req["target_id"], req["employee_id"]),
                    )

            cur.execute(
                """
                UPDATE transfer_requests 
                SET status = 'approved', resolved_at = CURRENT_TIMESTAMP, resolved_by = %s 
                WHERE id = %s
            """,
                (approver_user["id"], request_id),
            )
            conn.commit()

            # --- NOTIFICATION ---
            try:
                TransferModel._notify_transfer_event(request_id, 'approved')
            except Exception as e:
                print(f"⚠️ Notification failed after transfer approval: {e}")

            return True
        except Exception as e:
            conn.rollback()
            print(f"Error in approve_request: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def reject_request(request_id, approver_user, reason):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT * FROM transfer_requests WHERE id = %s AND status = 'pending'",
                (request_id,),
            )
            req = cur.fetchone()
            if not req:
                return False

            # Permission Check
            is_authorized = False
            if approver_user.get("is_admin"):
                is_authorized = True
            else:
                if req["target_type"] == "department" and req["target_id"] == approver_user.get("commands_department_id"):
                    is_authorized = True
                elif req["target_type"] == "section" and req["target_id"] == approver_user.get("commands_section_id"):
                    is_authorized = True
                elif req["target_type"] == "team" and req["target_id"] == approver_user.get("commands_team_id"):
                    is_authorized = True

            if not is_authorized:
                return False

            cur.execute(
                """
                UPDATE transfer_requests 
                SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP, 
                    resolved_by = %s, rejection_reason = %s
                WHERE id = %s
            """,
                (approver_user["id"], reason, request_id),
            )
            conn.commit()

            # --- NOTIFICATION ---
            try:
                TransferModel._notify_transfer_event(request_id, 'rejected')
            except Exception as e:
                print(f"⚠️ Notification failed after transfer rejection: {e}")

            return True
        except Exception:
            conn.rollback()
            return False
        finally:
            conn.close()

    @staticmethod
    def cancel_request(request_id, user_id, is_admin=False):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            check_q = "SELECT requester_id FROM transfer_requests WHERE id = %s AND status = 'pending'"
            cur.execute(check_q, (request_id,))
            res = cur.fetchone()

            if not res:
                return False
            if not is_admin and res[0] != user_id:
                return False

            cur.execute(
                "UPDATE transfer_requests SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP WHERE id = %s",
                (request_id,),
            )
            conn.commit()
            return True
        finally:
            conn.close()

    @staticmethod
    def get_history(limit=50, requesting_user=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT tr.*, 
                       (e.first_name || ' ' || e.last_name) as employee_name,
                       e.personal_number,
                       (res_by.first_name || ' ' || res_by.last_name) as resolver_name,
                       CASE 
                           WHEN res_by.team_id IS NOT NULL THEN 'מפקד חוליית ' || res_t.name
                           WHEN res_by.section_id IS NOT NULL THEN 'מפקד מדור ' || res_s.name
                           WHEN res_by.department_id IS NOT NULL THEN 'מפקד מחלקת ' || res_d.name
                           ELSE 'מטה'
                       END as resolver_unit,
                       (req.first_name || ' ' || req.last_name) as requester_name,
                       CASE 
                           WHEN req.team_id IS NOT NULL THEN 'מפקד חוליית ' || req_t.name
                           WHEN req.section_id IS NOT NULL THEN 'מפקד מדור ' || req_s.name
                           WHEN req.department_id IS NOT NULL THEN 'מפקד מחלקת ' || req_d.name
                           ELSE 'מטה'
                       END as requester_unit,
                       
                       -- Source path (Previous Path - from snapshot in transfer_requests)
                       CASE 
                           WHEN tr.source_type = 'team' THEN src_t_d.name || ' / ' || src_t_s.name || ' / ' || src_t.name
                           WHEN tr.source_type = 'section' THEN src_s_d.name || ' / ' || src_s.name
                           WHEN tr.source_type = 'department' THEN src_d.name
                           ELSE 'מטה'
                       END as source_name,

                       -- Target path (destination)
                       CASE 
                           WHEN tr.target_type = 'department' THEN d.name
                           WHEN tr.target_type = 'section' THEN d_target_s.name || ' / ' || s.name
                           WHEN tr.target_type = 'team' THEN d_target_t.name || ' / ' || s_target_t.name || ' / ' || t.name
                       END as target_name
                FROM transfer_requests tr
                JOIN employees e ON tr.employee_id = e.id
                JOIN employees req ON tr.requester_id = req.id
                LEFT JOIN employees res_by ON tr.resolved_by = res_by.id
                
                -- Requester unit joins
                LEFT JOIN teams req_t ON req.team_id = req_t.id
                LEFT JOIN sections req_s ON req.section_id = req_s.id
                LEFT JOIN departments req_d ON req.department_id = req_d.id

                -- Resolver unit joins
                LEFT JOIN teams res_t ON res_by.team_id = res_t.id
                LEFT JOIN sections res_s ON res_by.section_id = res_s.id
                LEFT JOIN departments res_d ON res_by.department_id = res_d.id
                
                -- Source Joins (Snapshot)
                LEFT JOIN teams src_t ON tr.source_type = 'team' AND tr.source_id = src_t.id
                LEFT JOIN sections src_s ON tr.source_type = 'section' AND tr.source_id = src_s.id
                LEFT JOIN departments src_d ON tr.source_type = 'department' AND tr.source_id = src_d.id
                
                -- Source Hierarchy
                LEFT JOIN sections src_t_s ON src_t.section_id = src_t_s.id
                LEFT JOIN departments src_t_d ON src_t_s.department_id = src_t_d.id
                LEFT JOIN departments src_s_d ON src_s.department_id = src_s_d.id
                
                -- Target joins
                LEFT JOIN departments d ON tr.target_type = 'department' AND tr.target_id = d.id
                LEFT JOIN sections s ON tr.target_type = 'section' AND tr.target_id = s.id
                LEFT JOIN teams t ON tr.target_type = 'team' AND tr.target_id = t.id
                
                -- Target hierarchy for sections
                LEFT JOIN departments d_target_s ON tr.target_type = 'section' AND s.department_id = d_target_s.id
                
                -- Target hierarchy for teams
                LEFT JOIN sections s_target_t ON tr.target_type = 'team' AND t.section_id = s_target_t.id
                LEFT JOIN departments d_target_t ON tr.target_type = 'team' AND s_target_t.department_id = d_target_t.id
                
                WHERE tr.status IN ('approved', 'rejected', 'cancelled')
            """
            params = []
            if requesting_user and not requesting_user.get("is_admin"):
                scoping = """
                    AND (
                        (tr.target_type = 'department' AND tr.target_id = %s) OR
                        (tr.target_type = 'section' AND tr.target_id = %s) OR
                        (tr.target_type = 'team' AND tr.target_id = %s) OR
                        (tr.requester_id = %s)
                    )
                """
                query += scoping
                params.extend([
                    requesting_user.get("commands_department_id"),
                    requesting_user.get("commands_section_id"),
                    requesting_user.get("commands_team_id"),
                    requesting_user.get("id")
                ])
                
            query += " ORDER BY tr.resolved_at DESC LIMIT %s"
            params.append(limit)
            
            cur.execute(query, tuple(params))
            return cur.fetchall()
        finally:
            conn.close()
