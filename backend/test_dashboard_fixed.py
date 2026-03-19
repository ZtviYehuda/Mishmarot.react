import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from datetime import date, datetime, timedelta

def test_query_after_fix():
    load_dotenv()
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        target_date = date.today().strftime("%Y-%m-%d")
        cols = "id, employee_id, status_type_id, start_datetime, end_datetime, note, reported_by, created_at, is_verified, verified_at"
        
        # Test Trend Query with explicit columns
        query_trend = f"""
            WITH params AS (
                SELECT %s::date - (n || ' days')::interval as date
                FROM generate_series(0, %s) n
            ),
            scoped_employees AS (
                SELECT e.id 
                FROM employees e
                WHERE e.is_active = TRUE AND e.username != 'admin' AND e.id != 1
            )
            SELECT 
                p.date,
                (SELECT COUNT(*) FROM scoped_employees) as total,
                (
                    SELECT COUNT(*)
                    FROM scoped_employees se
                    LEFT JOIN LATERAL (
                        SELECT st.is_presence, st.id
                        FROM (
                            SELECT {cols} FROM attendance_logs 
                            UNION ALL 
                            SELECT {cols} FROM attendance_logs_archive
                        ) al
                        JOIN status_types st ON al.status_type_id = st.id
                        WHERE al.employee_id = se.id
                        AND DATE(al.start_datetime) <= p.date 
                        AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= p.date)
                        AND (st.is_persistent = TRUE OR DATE(al.start_datetime) = p.date)
                        ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
                    ) st ON true
                    WHERE st.is_presence = TRUE
                ) as present
            FROM params p
            ORDER BY p.date ASC
        """
        print("\nRunning Trend Query (7 days) with explicit columns...")
        cur.execute(query_trend, (target_date, 6))
        trend_results = cur.fetchall()
        
        any_data = False
        for r in trend_results:
            print(f"  {r['date'].strftime('%Y-%m-%d')}: total={r['total']}, present={r['present']}")
            if r['total'] > 0:
                any_data = True
        
        if not any_data:
            print("\nWARNING: No employees found in scoped_employees!")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_query_after_fix()
