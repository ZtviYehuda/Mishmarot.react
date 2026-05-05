from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor

class FeedbackModel:
    @staticmethod
    def create_feedback(data):
        conn = get_db_connection()
        if not conn:
            return None
        print(f"DEBUG: Attempting to create feedback with data: {data}", flush=True)
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = """
                INSERT INTO feedbacks (user_id, category, description, screenshot_url, context_page, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            cur.execute(query, (
                data.get('user_id'),
                data.get('category'),
                data.get('description'),
                data.get('screenshot_url'),
                data.get('context_page'),
                data.get('user_agent')
            ))
            new_id = cur.fetchone()['id']
            conn.commit()
            return new_id
        except Exception as e:
            conn.rollback()
            import sys
            print(f"CRITICAL DB ERROR in create_feedback: {str(e)}", file=sys.stderr, flush=True)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None
        finally:
            conn.close()

    @staticmethod
    def get_user_feedbacks(user_id):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT * FROM feedbacks WHERE user_id = %s ORDER BY created_at DESC"
            cur.execute(query, (user_id,))
            rows = cur.fetchall()
            for row in rows:
                if row['created_at']:
                    row['created_at'] = row['created_at'].isoformat()
            return rows
        finally:
            conn.close()

    @staticmethod
    def get_all_feedbacks():
        conn = get_db_connection()
        if not conn:
            return []
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            query = "SELECT f.*, u.first_name, u.last_name FROM feedbacks f LEFT JOIN employees u ON f.user_id = u.id ORDER BY f.created_at DESC"
            cur.execute(query)
            rows = cur.fetchall()
            for row in rows:
                if row['created_at']:
                    row['created_at'] = row['created_at'].isoformat()
            return rows
        finally:
            conn.close()

    @staticmethod
    def update_feedback_status(feedback_id, status, admin_reply=None):
        conn = get_db_connection()
        if not conn:
            return False
        try:
            cur = conn.cursor()
            query = "UPDATE feedbacks SET status = %s, admin_reply = %s WHERE id = %s"
            cur.execute(query, (status, admin_reply, feedback_id))
            conn.commit()
            return True
        except Exception as e:
            conn.rollback()
            print(f"Error updating feedback status: {e}")
            return False
        finally:
            conn.close()
