import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, datetime

def check_current_state():
    conn = psycopg2.connect("postgresql://postgres:8245@localhost:5432/postgres")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # 1. Who are the active users?
    cur.execute("SELECT id, username, is_admin, notif_sick_leave, notif_morning_report FROM employees WHERE is_active=TRUE")
    users = cur.fetchall()
    print("--- Active Users ---")
    for u in users:
        print(u)
    
    # 2. Check sick leave data
    cur.execute("""
        SELECT e.id, st.name, al.start_datetime 
        FROM attendance_logs al 
        JOIN status_types st ON al.status_type_id = st.id 
        JOIN employees e ON al.employee_id = e.id 
        WHERE st.name = 'חולה' AND al.end_datetime IS NULL
    """)
    sick = cur.fetchall()
    print("\n--- Current Sick Employees ---")
    for s in sick:
        print(s)
        
    # 3. Check messages
    cur.execute("SELECT * FROM user_messages")
    msgs = cur.fetchall()
    print("\n--- Messages ---")
    for m in msgs:
        print(m)

    conn.close()

if __name__ == "__main__":
    check_current_state()
