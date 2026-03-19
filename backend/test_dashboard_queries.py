import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from datetime import date, datetime, timedelta

def test_query():
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
        
        base_date = date.today().strftime("%Y-%m-%d")
        
        # Test Single Day Comparison Query (Admin level)
        target_date = base_date
        query = f"""
            SELECT 
                d.id as unit_id,
                COALESCE(d.name, 'ללא שיוך') as unit_name,
                COUNT(e.id) as total_count,
                COUNT(CASE WHEN st.is_presence = TRUE THEN 1 END) as present_count,
                COUNT(CASE WHEN st.is_presence = FALSE THEN 1 END) as absent_count,
                COUNT(CASE WHEN al.status_type_id IS NULL THEN 1 END) as unknown_count
            FROM employees e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
            LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
            LEFT JOIN service_types srv ON e.service_type_id = srv.id
            LEFT JOIN LATERAL (
                SELECT al.status_type_id, al.id,
                       (CASE WHEN al.status_type_id IS NOT NULL
                                   AND (
                                     (al.end_datetime IS NOT NULL AND DATE(al.end_datetime) >= %s)
                                     OR
                                     (al.end_datetime IS NULL AND (sti.is_persistent = TRUE OR DATE(al.start_datetime) = %s))
                                   )
                             THEN TRUE
                             ELSE FALSE
                       END) as is_active_for_date
                FROM (SELECT * FROM attendance_logs UNION ALL SELECT * FROM attendance_logs_archive) al
                JOIN status_types sti ON al.status_type_id = sti.id
                WHERE al.employee_id = e.id AND DATE(al.start_datetime) <= %s
                ORDER BY al.start_datetime DESC, al.id DESC LIMIT 1
            ) al ON al.is_active_for_date = TRUE
            LEFT JOIN status_types st ON al.status_type_id = st.id
            WHERE e.is_active = TRUE 
            AND e.username != 'admin' 
            AND e.id NOT IN (
                SELECT commander_id FROM departments WHERE commander_id IS NOT NULL
                UNION 
                SELECT commander_id FROM sections WHERE commander_id IS NOT NULL
            )
            GROUP BY d.id, d.name
            HAVING d.id IS NOT NULL
            ORDER BY d.name
        """
        
        print(f"Running Comparison Query for date={target_date}...")
        cur.execute(query, (target_date, target_date, target_date))
        results = cur.fetchall()
        print(f"Found {len(results)} units.")
        for r in results:
            print(f"  {r['unit_name']}: total={r['total_count']}, present={r['present_count']}, unknown={r['unknown_count']}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_query()
