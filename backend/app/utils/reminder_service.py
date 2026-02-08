from datetime import datetime, timedelta
from app.models.employee_model import EmployeeModel
from app.utils.db import get_db_connection

from psycopg2.extras import RealDictCursor
import logging

def check_and_send_morning_reminders():
    """
    Checks which commanders haven't updated attendance today and sends them a reminder email.
    """
    print("\n⏰ [SCHEDULER] Running Morning Reminder Check...")
    
    conn = get_db_connection()
    if not conn:
        print("❌ [SCHEDULER] DB Connection failed.")
        return

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 0. Dynamic Time Check
        # Fetch deadline from settings (default 09:00)
        cur.execute("SELECT value FROM system_settings WHERE key = 'morning_report_deadline'")
        row = cur.fetchone()
        deadline_str = row['value'] if row and row['value'] else "09:00"
        
        now = datetime.now()
        try:
            d_time = datetime.strptime(deadline_str, "%H:%M").time()
            deadline_dt = datetime.combine(now.date(), d_time)
            trigger_dt = deadline_dt - timedelta(minutes=15)
            
            # Check if NOW is the trigger time (minute precision)
            # We allow a small window if needed, but cron runs exactly on minute usually.
            if now.hour != trigger_dt.hour or now.minute != trigger_dt.minute:
                # Not the right time
                return
                
            print(f"⏰ [SCHEDULER] Trigger matched: {trigger_dt.strftime('%H:%M')} (Deadline: {deadline_str}). checking status...")
            
        except ValueError:
            print(f"❌ [SCHEDULER] Invalid deadline format in settings: {deadline_str}")
            return
        
        # 1. Get all Commanders (and Admins) who are active
        cur.execute("""
            SELECT id, first_name, last_name, email, personal_number 
            FROM employees 
            WHERE (is_commander = TRUE OR is_admin = TRUE) AND is_active = TRUE
        """)
        commanders = cur.fetchall()
        
        today_date = datetime.now().date()
        reminders_sent = 0
        
        for cmdr in commanders:
            email = cmdr['email']
            if not email:
                continue # Skip if no email
                
            # 2. Check if they have ANY log for today (Active or Closed)
            # This logic assumes that if they created a log, they "updated attendance".
            query = """
                SELECT 1 FROM attendance_logs 
                WHERE employee_id = %s 
                AND (DATE(start_datetime) = %s OR DATE(end_datetime) = %s)
                LIMIT 1
            """
            cur.execute(query, (cmdr['id'], today_date, today_date))
            has_logs = cur.fetchone()
            
            if not has_logs:
                # 3. Send Reminder
                print(f"   ⚠️ No logs for {cmdr['first_name']} {cmdr['last_name']}. Sending email...")
                
                subject = "תזכורת: עדכון דוח בוקר 📋"
                body = f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                    <h2 style="color: #059669;">בוקר טוב {cmdr['first_name']}! ☀️</h2>
                    <p>שמנו לב שטרם עדכנת את דוח הנוכחות היומי שלך במערכת.</p>
                    <p style="background-color: #fef3c7; padding: 10px; border-radius: 8px; border-right: 4px solid #d97706;">
                        <strong>תזכורת:</strong> יש לבצע את הדיווח עד השעה {deadline_str}.
                    </p>
                    <p>אנא היכנס למערכת ובצע את הדיווח בהקדם.</p>
                    <br>
                    <a href="http://localhost:5173" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">כניסה למערכת</a>
                    <br><br>
                    <p style="color: #6b7280; font-size: 12px;">הודעה זו נשלחה באופן אוטומטי.</p>
                </div>
                """
                
                try:
                    # Use the generic email sender from email_service
                    from app.utils.email_service import send_email
                    
                    send_email(email, subject, body)
                    reminders_sent += 1
                except Exception as e:
                    print(f"❌ Failed to send email to {email}: {e}")
                    
        print(f"✅ [SCHEDULER] Done. Sent {reminders_sent} reminders.")
        
    except Exception as e:
        print(f"❌ [SCHEDULER] Error: {e}")
    finally:
        conn.close()
