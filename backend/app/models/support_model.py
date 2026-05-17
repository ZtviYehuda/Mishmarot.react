from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


class SupportModel:
    @staticmethod
    def _attach_approvals(tickets):
        if not tickets:
            return tickets
        
        ticket_ids = [t['id'] for t in tickets]
        conn = get_db_connection()
        if not conn:
            return tickets
            
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                SELECT ra.*, e.first_name, e.last_name, e.profile_picture 
                FROM request_approvals ra
                LEFT JOIN employees e ON ra.approver_id = e.id
                WHERE ra.request_type = 'support_ticket' AND ra.request_id = ANY(%s)
                ORDER BY ra.created_at ASC
            """
            cur.execute(query, (ticket_ids,))
            approvals = cur.fetchall()
            
            approvals_map = {}
            for app in approvals:
                if app.get("created_at"):
                    app["created_at"] = app["created_at"].isoformat()
                req_id = app['request_id']
                if req_id not in approvals_map:
                    approvals_map[req_id] = []
                approvals_map[req_id].append(app)
                
            for ticket in tickets:
                ticket['approvals'] = approvals_map.get(ticket['id'], [])
                
            return tickets
        finally:
            conn.close()

    @staticmethod
    def create_ticket(data):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                INSERT INTO support_tickets (user_id, full_name, subject, message, status, context_page)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cur.execute(
                query,
                (
                    data.get("user_id"),
                    data.get("full_name"),
                    data.get("subject"),
                    data.get("message"),
                    data.get("status", "pending"),
                    data.get("context_page")
                ),
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            return new_id
        except Exception as e:
            conn.rollback()
            print(f"Error creating support ticket: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def get_user_tickets(user_id):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM support_tickets WHERE user_id = %s ORDER BY created_at ASC"
            cur.execute(query, (user_id,))
            tickets = cur.fetchall()
            for ticket in tickets:
                if ticket.get("created_at"):
                    ticket["created_at"] = ticket["created_at"].isoformat()
            return SupportModel._attach_approvals(tickets)
        finally:
            conn.close()

    @staticmethod
    def get_all_tickets():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM support_tickets ORDER BY created_at DESC"
            cur.execute(query)
            tickets = cur.fetchall()
            for ticket in tickets:
                if ticket.get("created_at"):
                    ticket["created_at"] = ticket["created_at"].isoformat()
            return SupportModel._attach_approvals(tickets)
        finally:
            conn.close()

    @staticmethod
    def update_ticket_status(ticket_id, status, admin_reply=None):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            if admin_reply:
                query = "UPDATE support_tickets SET admin_reply = %s, status = %s, is_read_by_user = FALSE WHERE id = %s"
                cur.execute(query, (admin_reply, status, ticket_id))
            else:
                query = "UPDATE support_tickets SET status = %s, is_read_by_user = FALSE WHERE id = %s"
                cur.execute(query, (status, ticket_id))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error updating support ticket: {e}")
            return False
        finally:
            conn.close()

    @staticmethod
    def get_pending_count():
        conn = get_db_connection()
        if not conn:
            return 0
        try:
            cur = conn.cursor()
            query = "SELECT COUNT(*) FROM support_tickets WHERE status = 'pending' OR status = 'open'"
            cur.execute(query)
            count = cur.fetchone()[0]
            return count
        except Exception as e:
            print(f"Error getting pending count: {e}")
            return 0
        finally:
            conn.close()

    @staticmethod
    def mark_as_read(user_id):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            query = "UPDATE support_tickets SET is_read_by_user = TRUE WHERE user_id = %s"
            cur.execute(query, (user_id,))
            conn.commit()
            return True
        finally:
            conn.close()

    @staticmethod
    def add_approval(request_type, request_id, approver_id, approver_rank_level, status, comment, ip_address, digital_signature):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            query = """
                INSERT INTO request_approvals 
                (request_type, request_id, approver_id, approver_rank_level, status, comment, ip_address, digital_signature)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(query, (request_type, request_id, approver_id, approver_rank_level, status, comment, ip_address, digital_signature))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error adding approval: {e}")
            return False
        finally:
            conn.close()
