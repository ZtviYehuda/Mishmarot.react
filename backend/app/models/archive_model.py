from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

class ArchiveModel:
    @staticmethod
    def create_restore_request(requester_id, start_date, end_date, reason):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO data_restore_requests (requester_id, start_date, end_date, reason, status)
                VALUES (%s, %s, %s, %s, 'pending')
                RETURNING id
            """, (requester_id, start_date, end_date, reason))
            new_id = cur.fetchone()[0]
            conn.commit()
            return new_id
        except Exception as e:
            conn.rollback()
            print(f"Error creating restore request: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def get_pending_requests(user):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Admins see all. Department commanders see their subordinates' requests.
            if user.get("is_admin"):
                cur.execute("""
                    SELECT r.*, 
                           (e.first_name || ' ' || e.last_name) as requester_name,
                           (e.username) as requester_pn
                    FROM data_restore_requests r
                    JOIN employees e ON r.requester_id = e.id
                    WHERE r.status = 'pending'
                    ORDER BY r.created_at DESC
                """)
            else:
                # Find subordinates
                cmd_dept = user.get("commands_department_id")
                cmd_sect = user.get("commands_section_id")
                cmd_team = user.get("commands_team_id")
                
                query = """
                    SELECT r.*, 
                           (e.first_name || ' ' || e.last_name) as requester_name,
                           (e.username) as requester_pn
                    FROM data_restore_requests r
                    JOIN employees e ON r.requester_id = e.id
                    WHERE r.status = 'pending'
                """
                params = []
                if cmd_dept:
                    query += " AND e.department_id = %s"
                    params.append(cmd_dept)
                elif cmd_sect:
                    query += " AND e.section_id = %s"
                    params.append(cmd_sect)
                elif cmd_team:
                    query += " AND e.team_id = %s"
                    params.append(cmd_team)
                else:
                    return [] # No subordinates
                
                query += " ORDER BY r.created_at DESC"
                cur.execute(query, tuple(params))
                
            return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def resolve_request(request_id, approver_id, status, rejection_reason=None):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            
            expires_at = None
            if status == 'approved':
                # Grant access for 24 hours
                expires_at = datetime.now() + timedelta(hours=24)
            
            cur.execute("""
                UPDATE data_restore_requests
                SET status = %s, approver_id = %s, resolved_at = NOW(), expires_at = %s
                WHERE id = %s
            """, (status, approver_id, expires_at, request_id))
            
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error resolving restore request: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def check_access(user_id, target_date):
        """
        Checks if a user has an approved and non-expired request for a specific date.
        """
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id FROM data_restore_requests
                WHERE requester_id = %s 
                AND status = 'approved'
                AND expires_at > NOW()
                AND %s BETWEEN start_date AND end_date
                LIMIT 1
            """, (user_id, target_date))
            return cur.fetchone() is not None
        finally:
            conn.close()

    @staticmethod
    def get_requests_history(user_id=None):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT r.*, 
                       (e.first_name || ' ' || e.last_name) as requester_name,
                       (app.first_name || ' ' || app.last_name) as approver_name
                FROM data_restore_requests r
                JOIN employees e ON r.requester_id = e.id
                LEFT JOIN employees app ON r.approver_id = app.id
            """
            params = []
            if user_id:
                query += " WHERE r.requester_id = %s"
                params.append(user_id)
            
            query += " ORDER BY r.created_at DESC LIMIT 50"
            cur.execute(query, tuple(params))
            return cur.fetchall()
        finally:
            conn.close()
