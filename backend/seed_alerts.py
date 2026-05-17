import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def seed_alerts():
    conn = psycopg2.connect("postgresql://postgres:8245@localhost:5432/postgres")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Ensure admin (ID 1) has notifications enabled
        cur.execute("""
            UPDATE employees 
            SET notif_sick_leave = TRUE, 
                notif_morning_report = TRUE, 
                notif_transfers = TRUE,
                is_admin = TRUE
            WHERE id = 1
        """)
        
        # 2. Add a Long Sick Leave (ID 1 should see it)
        # Find another active employee
        cur.execute("SELECT id, first_name, last_name FROM employees WHERE id != 1 AND is_active = TRUE LIMIT 1")
        sick_emp = cur.fetchone()
        if sick_emp:
            # Delete old logs for today/recent to avoid conflicts
            cur.execute("DELETE FROM attendance_logs WHERE employee_id = %s", (sick_emp['id'],))
            
            # Insert 6 day sick leave
            start_date = datetime.now() - timedelta(days=6)
            cur.execute("""
                INSERT INTO attendance_logs (employee_id, status_type_id, start_datetime, reported_by, note)
                VALUES (%s, (SELECT id FROM status_types WHERE name = 'חולה' LIMIT 1), %s, 1, 'שפעת חריפה')
            """, (sick_emp['id'], start_date))
            print(f"✅ Added sick leave for {sick_emp['first_name']} {sick_emp['last_name']}")

        # 3. Send a test internal message to ID 1
        cur.execute("DELETE FROM user_messages WHERE recipient_id = 1") # Clean up
        cur.execute("""
            INSERT INTO user_messages (sender_id, recipient_id, title, description)
            VALUES (%s, 1, %s, %s)
        """, (sick_emp['id'] if sick_emp else 2, 'תזכורת פגישת קצינים', 'יש פגישה ב-14:00 בחדר הדיונים'))
        print("✅ Added test message to Admin")

        # 4. Add a Transfer Request visibility (optional but good)
        # Check if table exists
        cur.execute("SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_requests'")
        if cur.fetchone():
            # Create a pending transfer if none exist
            cur.execute("SELECT id FROM transfer_requests WHERE status = 'pending' LIMIT 1")
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO transfer_requests (employee_id, target_type, target_id, requested_by, status, reason)
                    VALUES (%s, 'department', 1, 1, 'pending', 'מעבר לצוות טכני')
                """, (sick_emp['id'] if sick_emp else 2,))
                print("✅ Added pending transfer request")

        conn.commit()
        print("\n--- Seeding complete! ---")
        print("Please refresh the system and check the bell icon in the header.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error seeding: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_alerts()
