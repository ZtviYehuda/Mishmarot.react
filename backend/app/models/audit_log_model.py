from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor
import datetime


class AuditLogModel:
    @staticmethod
    def init_table():
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES employees(id),
                        action_type VARCHAR(50) NOT NULL,
                        description TEXT,
                        target_id INTEGER,
                        ip_address VARCHAR(45),
                        metadata JSONB,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
                    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
                """
                )
                conn.commit()
        finally:
            conn.close()

    @staticmethod
    def log_action(
        user_id,
        action_type,
        description,
        target_id=None,
        ip_address=None,
        metadata=None,
    ):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO audit_logs (user_id, action_type, description, target_id, ip_address, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """,
                    (
                        user_id,
                        action_type,
                        description,
                        target_id,
                        ip_address,
                        metadata,
                    ),
                )
                conn.commit()
        except Exception as e:
            print(f"Error logging action: {e}")
        finally:
            conn.close()

    @staticmethod
    def get_recent_activity(limit=50):
        # Admin view: see all activity
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT al.*, 
                           e.first_name || ' ' || e.last_name as user_name,
                           t.first_name || ' ' || t.last_name as target_name
                    FROM audit_logs al
                    LEFT JOIN employees e ON al.user_id = e.id
                    LEFT JOIN employees t ON al.target_id = t.id
                    ORDER BY al.created_at DESC
                    LIMIT %s
                """,
                    (limit,),
                )
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_user_activity(user_id, limit=20):
        # User view: see own activity
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT al.*,
                           t.first_name || ' ' || t.last_name as target_name
                    FROM audit_logs al
                    LEFT JOIN employees t ON al.target_id = t.id
                    WHERE al.user_id = %s
                    ORDER BY al.created_at DESC
                    LIMIT %s
                """,
                    (user_id, limit),
                )
                return cur.fetchall()
        finally:
            conn.close()
