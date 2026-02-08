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


def check_and_send_weekly_birthday_report():
    """
    Checks for upcoming birthdays in the next 7 days and sends a report to all commanders.
    Runs once a week (Sunday morning).
    """
    print("\n🎂 [SCHEDULER] Running Weekly Birthday Report...")
    conn = get_db_connection()
    if not conn:
        print("❌ [SCHEDULER] DB Connection failed.")
        return

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Get all active employees with birthdays
        cur.execute("""
            SELECT first_name, last_name, birth_date, t.name as team_name
            FROM employees e
            LEFT JOIN teams t ON e.team_id = t.id
            WHERE e.is_active = TRUE AND e.birth_date IS NOT NULL
        """)
        employees = cur.fetchall()
        
        today = datetime.now().date()
        
        upcoming_birthdays = []
        
        for emp in employees:
            bdate = emp['birth_date']
            # Calculate next occurrence
            try:
                this_year_bdate = bdate.replace(year=today.year)
            except ValueError:
                this_year_bdate = bdate.replace(year=today.year, month=2, day=28) 

            dist = (this_year_bdate - today).days
            if 0 <= dist < 7:
                emp['celebrate_date'] = this_year_bdate
                upcoming_birthdays.append(emp)
                continue

            # Check next year (for year wrap)
            try:
                next_year_bdate = bdate.replace(year=today.year + 1)
            except ValueError:
                 next_year_bdate = bdate.replace(year=today.year + 1, month=2, day=28)
            
            dist_next = (next_year_bdate - today).days
            if 0 <= dist_next < 7:
                 emp['celebrate_date'] = next_year_bdate
                 upcoming_birthdays.append(emp)

        if not upcoming_birthdays:
            print("   ℹ️ No birthdays this week.")
            return

        # Sort by date
        upcoming_birthdays.sort(key=lambda x: x['celebrate_date'])

        # 2. Get all Commanders email
        cur.execute("""
            SELECT email, first_name FROM employees 
            WHERE (is_commander = TRUE OR is_admin = TRUE) AND is_active = TRUE AND email IS NOT NULL
        """)
        commanders = cur.fetchall()

        # 3. Send Email
        print(f"   🎉 Found {len(upcoming_birthdays)} birthdays. Sending report to {len(commanders)} commanders.")
        
        from app.utils.email_service import send_email
        
        # Build HTML content
        items_html = ""
        days_map = {0: "שני", 1: "שלישי", 2: "רביעי", 3: "חמישי", 4: "שישי", 5: "שבת", 6: "ראשון"} 
        
        for b in upcoming_birthdays:
            d = b['celebrate_date']
            wd = days_map[d.weekday()]
            date_str = d.strftime("%d/%m")
            team = b['team_name'] or "ללא צוות"
            age = d.year - b['birth_date'].year
            
            items_html += f"""
                <tr style="background-color: white; border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; text-align: right;">{b['first_name']} {b['last_name']}</td>
                    <td style="padding: 10px; text-align: right;">{team}</td>
                    <td style="padding: 10px; text-align: right;">{wd} ({date_str})</td>
                    <td style="padding: 10px; text-align: right;">{age}</td>
                </tr>
            """
            
        body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
            <div style="background-color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid #8b5cf6;">
                <h2 style="color: #7c3aed; margin-top: 0;">📅 דוח ימי הולדת שבועי</h2>
                <p style="color: #4b5563;">כיף לפתוח את השבוע עם חגיגות! להלן רשימת ימי ההולדת החלים בשבוע הקרוב:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; border-radius: 8px; overflow: hidden; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6; color: #374151;">
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">שם</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">יחידה</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">מועד</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">גיל</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; padding: 10px; background-color: #ede9fe; border-radius: 8px; color: #5b21b6; font-size: 13px;">
                    <strong>💡 טיפ:</strong> מומלץ לשלוח הודעת מזל טוב בוואטסאפ דרך דף "ניהול שוטרים".
                </div>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 15px;">נשלח אוטומטית ע"י מערכת משמרות | אין להשיב למייל זה</p>
        </div>
        """
        
        for cmdr in commanders:
            try:
                send_email(cmdr['email'], f"🎉 ימי הולדת השבוע ({len(upcoming_birthdays)})", body)
            except Exception as e:
                print(f"❌ Failed to send to {cmdr['email']}: {e}")
                
    except Exception as e:
        print(f"❌ [SCHEDULER] Birthday Error: {e}")
    finally:
        conn.close()
