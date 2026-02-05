from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor


class SupportModel:
    @staticmethod
    def create_ticket(data):
        conn = get_db_connection()
        if not conn:
            return None
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                INSERT INTO support_tickets (full_name, personal_number, subject, message)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """
            cur.execute(
                query,
                (
                    data.get("full_name"),
                    data.get("personal_number"),
                    data.get("subject"),
                    data.get("message"),
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
    def get_all_tickets():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM support_tickets ORDER BY created_at DESC"
            cur.execute(query)
            tickets = cur.fetchall()
            # Convert dates to ISO format
            for ticket in tickets:
                if ticket.get("created_at"):
                    ticket["created_at"] = ticket["created_at"].isoformat()
            return tickets
        finally:
            conn.close()
