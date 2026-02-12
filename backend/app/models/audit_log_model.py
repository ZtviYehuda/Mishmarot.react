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
    def get_recent_activity(limit=100, filters=None):
        # Admin view: see all activity
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                where_clauses = []
                params = []

                if filters:
                    if filters.get("user_id"):
                        where_clauses.append("al.user_id = %s")
                        params.append(filters.get("user_id"))
                    if filters.get("action_type"):
                        where_clauses.append("al.action_type = %s")
                        params.append(filters.get("action_type"))

                where_str = (
                    " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
                )

                query = f"""
                    SELECT al.*, 
                           e.first_name || ' ' || e.last_name as user_name,
                           t.first_name || ' ' || t.last_name as target_name
                    FROM audit_logs al
                    LEFT JOIN employees e ON al.user_id = e.id
                    LEFT JOIN employees t ON al.target_id = t.id
                    {where_str}
                    ORDER BY al.created_at DESC
                    LIMIT %s
                """
                params.append(limit)
                cur.execute(query, tuple(params))
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def get_suspicious_activity(limit=20):
        """
        Detects anomalies:
        1. IP Hopping (same user across multiple IPs in short time)
        2. Brute Force (multiple FAILED_LOGIN)
        3. Unusual Times (e.g. 1 AM - 5 AM)
        4. High Frequency actions
        """
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. IP Hopping (Same user, different IPs within 1 hour)
                cur.execute(
                    """
                    SELECT al1.user_id, al1.ip_address as ip1, al2.ip_address as ip2, 
                           al2.created_at, e.first_name || ' ' || e.last_name as user_name,
                           'החלפת IP מהירה (IP Hopping)' as reason
                    FROM audit_logs al1
                    JOIN audit_logs al2 ON al1.user_id = al2.user_id 
                         AND al1.ip_address != al2.ip_address
                         AND al2.created_at > al1.created_at 
                         AND al2.created_at < al1.created_at + interval '1 hour'
                    JOIN employees e ON al1.user_id = e.id
                    ORDER BY al2.created_at DESC
                    LIMIT %s
                """,
                    (limit,),
                )
                ip_hopping = cur.fetchall()
                for r in ip_hopping:
                    r["description"] = (
                        f"משתמש עבר מ-IP {r['ip1']} ל-{r['ip2']} תוך פחות משעה"
                    )

                # 2. Brute Force (Failed logins)
                cur.execute(
                    """
                    SELECT user_id, COUNT(*) as fail_count, MAX(created_at) as created_at, ip_address,
                           'ריבוי ניסיונות התחברות כושלים' as reason
                    FROM audit_logs
                    WHERE action_type = 'FAILED_LOGIN'
                      AND created_at > NOW() - interval '24 hours'
                    GROUP BY user_id, ip_address
                    HAVING COUNT(*) >= 5
                    ORDER BY created_at DESC
                """
                )
                brute_force = cur.fetchall()
                for r in brute_force:
                    r["description"] = (
                        f"זוהו {r['fail_count']} ניסיונות כושלים מ-IP {r['ip_address']}"
                    )

                # 3. Unusual Hours (1 AM - 5 AM)
                cur.execute(
                    """
                    SELECT al.*, e.first_name || ' ' || e.last_name as user_name,
                           t.first_name || ' ' || t.last_name as target_name,
                           'פעילות בשעה חריגה (1-5 לפנות בוקר)' as reason
                    FROM audit_logs al
                    JOIN employees e ON al.user_id = e.id
                    LEFT JOIN employees t ON al.target_id = t.id
                    WHERE EXTRACT(HOUR FROM al.created_at) BETWEEN 1 AND 5
                      AND al.action_type IN ('LOGIN', 'PASSWORD_CHANGE', 'REPORT_STATUS', 'EMPLOYEE_UPDATE')
                    ORDER BY al.created_at DESC
                    LIMIT %s
                """,
                    (limit,),
                )
                unusual_hours = cur.fetchall()
                for r in unusual_hours:
                    r["description"] = (
                        f"ביצוע {r['action_type']} בשעה חריגה ({r['created_at'].strftime('%H:%M')})"
                    )

                # Combine and return
                all_suspicious = ip_hopping + brute_force + unusual_hours
                # Sort by time
                all_suspicious.sort(
                    key=lambda x: x.get("created_at") or "", reverse=True
                )
                return all_suspicious
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
