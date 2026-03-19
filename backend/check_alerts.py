import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, datetime

def check_alerts_data():
    conn = psycopg2.connect("postgresql://postgres:8245@localhost:5432/postgres")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- Checking for Long Sick Leave ---")
    query_sick = """
        SELECT e.id, e.first_name, e.last_name, al.start_datetime
        FROM employees e
        JOIN attendance_logs al ON e.id = al.employee_id
        JOIN status_types st ON al.status_type_id = st.id
        WHERE st.name = 'מחלה' 
          AND al.end_datetime IS NULL 
          AND e.is_active = TRUE
    """
    cur.execute(query_sick)
    rows = cur.fetchall()
    for row in rows:
        days = (datetime.now() - row['start_datetime']).days + 1
        print(f"Sick: {row['first_name']} {row['last_name']} - Days: {days}")
        if days >= 4:
            print("  -> SHOULD TRIGGER ALERT")

    print("\n--- Checking for Missing Reports Today ---")
    query_missing = """
        SELECT e.id, e.first_name, e.last_name
        FROM employees e
        WHERE e.is_active = TRUE 
          AND e.username != 'admin'
          AND NOT EXISTS (
              SELECT 1 FROM attendance_logs al
              WHERE al.employee_id = e.id
              AND DATE(al.start_datetime) <= CURRENT_DATE
              AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
          )
    """
    cur.execute(query_missing)
    rows = cur.fetchall()
    print(f"Total missing: {len(rows)}")
    for row in rows[:5]:
        print(f" Missing: {row['first_name']} {row['last_name']}")

    conn.close()

if __name__ == "__main__":
    check_alerts_data()
