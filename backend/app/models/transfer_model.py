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

            query = """
                INSERT INTO transfer_requests (employee_id, requester_id, target_type, target_id, notes, status)
                VALUES (%s, %s, %s, %s, %s, 'pending')
                RETURNING id
            """
            cur.execute(
                query,
                (
                    data["employee_id"],
                    requester_id,
                    data["target_type"],
                    data["target_id"],
                    data.get("notes"),
                ),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return new_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_pending_requests():
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
                           WHEN e.team_id IS NOT NULL THEN t_src.name
                           WHEN s_src.id IS NOT NULL THEN s_src.name
                           WHEN d_src.id IS NOT NULL THEN d_src.name
                           ELSE 'מטה'
                       END as source_name,
                       CASE 
                           WHEN tr.target_type = 'department' THEN d.name
                           WHEN tr.target_type = 'section' THEN s.name  
                           WHEN tr.target_type = 'team' THEN t.name
                       END as target_name
                FROM transfer_requests tr
                JOIN employees e ON tr.employee_id = e.id
                JOIN employees req ON tr.requester_id = req.id
                LEFT JOIN departments d ON tr.target_type = 'department' AND tr.target_id = d.id
                LEFT JOIN sections s ON tr.target_type = 'section' AND tr.target_id = s.id
                LEFT JOIN teams t ON tr.target_type = 'team' AND tr.target_id = t.id
                -- Source labels
                LEFT JOIN teams t_src ON e.team_id = t_src.id
                LEFT JOIN sections s_src ON t_src.section_id = s_src.id
                LEFT JOIN departments d_src ON s_src.department_id = d_src.id
                WHERE tr.status = 'pending'
                ORDER BY tr.created_at DESC
            """
            cur.execute(query)
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def approve_request(request_id, approver_id):
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
                (approver_id, request_id),
            )
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            return False
        finally:
            conn.close()

    @staticmethod
    def reject_request(request_id, approver_id, reason):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE transfer_requests 
                SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP, 
                    resolved_by = %s, rejection_reason = %s
                WHERE id = %s
            """,
                (approver_id, reason, request_id),
            )
            conn.commit()
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
    def get_history(limit=50):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT tr.*, 
                       (e.first_name || ' ' || e.last_name) as employee_name,
                       (res_by.first_name || ' ' || res_by.last_name) as resolver_name,
                       CASE 
                           WHEN tr.target_type = 'department' THEN d.name
                           WHEN tr.target_type = 'section' THEN s.name  
                           WHEN tr.target_type = 'team' THEN t.name
                       END as target_name
                FROM transfer_requests tr
                JOIN employees e ON tr.employee_id = e.id
                LEFT JOIN employees res_by ON tr.resolved_by = res_by.id
                LEFT JOIN departments d ON tr.target_type = 'department' AND tr.target_id = d.id
                LEFT JOIN sections s ON tr.target_type = 'section' AND tr.target_id = s.id
                LEFT JOIN teams t ON tr.target_type = 'team' AND tr.target_id = t.id
                WHERE tr.status IN ('approved', 'rejected', 'cancelled')
                ORDER BY tr.resolved_at DESC
                LIMIT %s
            """
            cur.execute(query, (limit,))
            return cur.fetchall()
        finally:
            conn.close()
