from datetime import datetime, timedelta
from app.models.employee_model import EmployeeModel
from app.utils.db import get_db_connection

from psycopg2.extras import RealDictCursor


def check_and_send_morning_reminders(force_now=False):
    """
    Checks which commanders haven't updated attendance today and sends them a reminder email.
    """
    print("\n[SCHEDULER] Running Morning Reminder Check...")

    conn = get_db_connection()
    if not conn:
        print("[SCHEDULER] DB Connection failed.")
        return

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 0. Dynamic Time Check
        if not force_now:
            # Fetch deadline from settings (default 09:00)
            cur.execute(
                "SELECT value FROM system_settings WHERE key = 'morning_report_deadline'"
            )
            row = cur.fetchone()
            deadline_str = row["value"] if row and row["value"] else "09:00"

            now = datetime.now()
            try:
                d_time = datetime.strptime(deadline_str, "%H:%M").time()
                deadline_dt = datetime.combine(now.date(), d_time)
                trigger_dt = deadline_dt - timedelta(minutes=15)

                # Check if NOW is the trigger time (minute precision)
                if now.hour != trigger_dt.hour or now.minute != trigger_dt.minute:
                    # Not the right time
                    return

                print(
                    f"[SCHEDULER] Trigger matched: {trigger_dt.strftime('%H:%M')} (Deadline: {deadline_str}). checking status..."
                )

            except ValueError:
                print(
                    f"[SCHEDULER] Invalid deadline format in settings: {deadline_str}"
                )
                return
        else:
            print("[SCHEDULER] Forcing execution regardless of time.")
            deadline_str = "09:00"  # Default for forced run

        # 1. Get all Commanders (and Admins) who are active
        # Note: commands_*_id are not on employees table, we must join.
        cur.execute(
            """
            SELECT e.id, e.first_name, e.last_name, e.email, e.is_admin,
                   t.id as commands_team_id,
                   s.id as commands_section_id,
                   d.id as commands_department_id
            FROM employees e
            LEFT JOIN teams t ON t.commander_id = e.id
            LEFT JOIN sections s ON s.commander_id = e.id
            LEFT JOIN departments d ON d.commander_id = e.id
            WHERE (e.is_commander = TRUE OR e.is_admin = TRUE) AND e.is_active = TRUE
        """
        )
        commanders = cur.fetchall()

        reminders_sent = 0

        print(f"DEBUG: Found {len(commanders)} potential active commanders/admins.")

        for cmdr in commanders:
            email = cmdr["email"]

            if not email:
                continue  # Skip if no email

            has_command = (
                cmdr["commands_team_id"]
                or cmdr["commands_section_id"]
                or cmdr["commands_department_id"]
            )

            if not has_command and not cmdr["is_admin"]:
                continue

            # Query for missing subordinates
            missing_query = """
                SELECT COUNT(e.id) as count
                FROM employees e
                LEFT JOIN teams t ON e.team_id = t.id
                LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id)
                LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id)
                WHERE e.is_active = TRUE 
                  AND e.personal_number != 'admin'
                  AND e.id != %s  -- Exclude commander
                  AND NOT EXISTS (
                      SELECT 1 FROM attendance_logs al
                      WHERE al.employee_id = e.id
                      AND DATE(al.start_datetime) <= CURRENT_DATE
                      AND (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                      AND (
                          DATE(al.start_datetime) = CURRENT_DATE
                          OR al.status_type_id IN (2, 4, 5, 6)
                      )
                  )
            """

            params = [cmdr["id"]]

            if cmdr["is_admin"] and not has_command:
                pass
            else:
                missing_query += """
                  AND (
                      (d.id = %s) OR
                      (s.id = %s) OR
                      (t.id = %s)
                  )
                """
                params.extend(
                    [
                        cmdr["commands_department_id"],
                        cmdr["commands_section_id"],
                        cmdr["commands_team_id"],
                    ]
                )

            cur.execute(missing_query, params)
            res = cur.fetchone()
            missing_count = res["count"] if res else 0

            if missing_count > 0:
                # 3. Send Reminder
                print(
                    f"   [WARNING] {missing_count} missing reports for commander {cmdr['first_name']} {cmdr['last_name']}. Sending email..."
                )

                subject = f"תזכורת: דיווח חסר ל-{missing_count} שוטרים"
                body = f"""
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
                    <h2 style="color: #c2410c;">בוקר טוב {cmdr['first_name']}!</h2>
                    <p>נמצא כי טרם הוזן סטטוס עבור <strong>{missing_count}</strong> שוטרים תחת פיקודך היום.</p>
                    <p style="background-color: #fff7ed; padding: 15px; border-radius: 8px; border-right: 4px solid #ea580c; color: #9a3412;">
                        <strong>שים לב:</strong> שעת היעד לדיווח היא {deadline_str}.
                    </p>
                    <p>אנא היכנס למערכת להשלמת הדיווח.</p>
                    <br>
                    <a href="http://localhost:5173" style="background-color: #c2410c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">כניסה למערכת</a>
                    <br><br>
                </div>
                """

                try:
                    from app.utils.email_service import send_email

                    send_email(email, subject, body)
                    reminders_sent += 1
                except Exception as e:
                    print(f"   [ERROR] Failed to send email to {email}: {e}")
            else:
                if force_now:
                    print(f"   [OK] All good for {cmdr['first_name']} (0 missing)")

        print(f"[SCHEDULER] Done. Sent {reminders_sent} reminders.")

    except Exception as e:
        print(f"[SCHEDULER] Error: {e}")
    finally:
        conn.close()


def check_and_send_weekly_birthday_report():
    """
    Checks for upcoming birthdays in the next 7 days and sends a report to all commanders.
    Runs once a week (Sunday morning).
    """
    print("\n[SCHEDULER] Running Weekly Birthday Report...")
    conn = get_db_connection()
    if not conn:
        print("[SCHEDULER] DB Connection failed.")
        return

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Get all active employees with birthdays
        cur.execute(
            """
            SELECT e.id, e.first_name, e.last_name, e.birth_date, 
                   e.department_id, e.section_id, e.team_id,
                   t.name as team_name, s.name as section_name, d.name as department_name
            FROM employees e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN sections s ON e.section_id = s.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.is_active = TRUE AND e.birth_date IS NOT NULL
        """
        )
        employees = cur.fetchall()

        today = datetime.now().date()
        upcoming_birthdays = []

        for emp in employees:
            bdate = emp["birth_date"]
            # Calculate next occurrence
            try:
                this_year_bdate = bdate.replace(year=today.year)
            except ValueError:
                this_year_bdate = bdate.replace(year=today.year, month=2, day=28)

            dist = (this_year_bdate - today).days
            if 0 <= dist < 7:
                emp["celebrate_date"] = this_year_bdate
                upcoming_birthdays.append(emp)
                continue

            # Check next year (for year wrap)
            try:
                next_year_bdate = bdate.replace(year=today.year + 1)
            except ValueError:
                next_year_bdate = bdate.replace(year=today.year + 1, month=2, day=28)

            dist_next = (next_year_bdate - today).days
            if 0 <= dist_next < 7:
                emp["celebrate_date"] = next_year_bdate
                upcoming_birthdays.append(emp)

        if not upcoming_birthdays:
            print("   [INFO] No birthdays this week.")
            return

        print(f"   [INFO] Found {len(upcoming_birthdays)} total birthdays for this week.")

        # Sort by date
        upcoming_birthdays.sort(key=lambda x: x["celebrate_date"])

        # 2. Get all Commanders email and their command scope
        cur.execute(
            """
            SELECT e.id, e.first_name, e.last_name, e.email, e.is_admin,
                   t.id as commands_team_id,
                   s.id as commands_section_id,
                   d.id as commands_department_id
            FROM employees e
            LEFT JOIN teams t ON t.commander_id = e.id
            LEFT JOIN sections s ON s.commander_id = e.id
            LEFT JOIN departments d ON d.commander_id = e.id
            WHERE (e.is_commander = TRUE OR e.is_admin = TRUE) AND e.is_active = TRUE AND e.email IS NOT NULL
        """
        )
        commanders = cur.fetchall()

        # 3. Send Emails (Filtered per commander)
        emails_sent = 0
        from app.utils.email_service import send_email

        days_map = {
            0: "שני",
            1: "שלישי",
            2: "רביעי",
            3: "חמישי",
            4: "שישי",
            5: "שבת",
            6: "ראשון",
        }

        for cmdr in commanders:
            # Filter birthdays for this commander
            relevant_birthdays = []
            
            has_command = (
                cmdr["commands_team_id"]
                or cmdr["commands_section_id"]
                or cmdr["commands_department_id"]
            )

            # If Admin with no specific command -> Show All
            if cmdr["is_admin"] and not has_command:
                relevant_birthdays = upcoming_birthdays
            else:
                # Filter based on unit hierarchy
                for b in upcoming_birthdays:
                    # Skip self? (Optional, usually we want to know our own birthday?)
                    # Let's keep self.
                    
                    is_relevant = False
                    if cmdr["commands_department_id"] and b["department_id"] == cmdr["commands_department_id"]:
                         is_relevant = True
                    elif cmdr["commands_section_id"] and b["section_id"] == cmdr["commands_section_id"]:
                         is_relevant = True
                    elif cmdr["commands_team_id"] and b["team_id"] == cmdr["commands_team_id"]:
                         is_relevant = True
                    # Also include if they are simply Admin (but they have a command, so we prioritized command? 
                    # The logic in MorningReminder suggests strict filtering if has_command exists.
                    
                    if is_relevant:
                        relevant_birthdays.append(b)

            if not relevant_birthdays:
                continue

            # Build HTML content for this commander
            items_html = ""
            for b in relevant_birthdays:
                d = b["celebrate_date"]
                wd = days_map[d.weekday()]
                date_str = d.strftime("%d/%m")
                
                # Logic for Unit Display
                unit_str = b["team_name"] or b["section_name"] or b["department_name"] or "מטה"
                age = d.year - b["birth_date"].year

                items_html += f"""
                    <tr style="background-color: white; border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; text-align: right;">{b['first_name']} {b['last_name']}</td>
                        <td style="padding: 10px; text-align: right;">{unit_str}</td>
                        <td style="padding: 10px; text-align: right;">{wd} ({date_str})</td>
                        <td style="padding: 10px; text-align: right;">{age}</td>
                    </tr>
                """

            body = f"""
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
                <div style="background-color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 6px solid #8b5cf6;">
                    <h2 style="color: #7c3aed; margin-top: 0;">📅 דוח ימי הולדת שבועי</h2>
                    <p style="color: #4b5563;">שלום {cmdr['first_name']}, להלן רשימת ימי ההולדת ביחידתך לשבוע הקרוב:</p>
                    
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
                        <strong>💡 טיפ:</strong> מומלץ לשלוח הודעת מזל טוב בוואטסאפ דרך דף "ניהול שוטרים" או ישירות מהדאשבורד.
                    </div>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 15px;">נשלח אוטומטית ע"י מערכת משמרות | אין להשיב למייל זה</p>
            </div>
            """

            try:
                send_email(
                    cmdr["email"],
                    f"🎉 ימי הולדת השבוע - {len(relevant_birthdays)} חוגגים",
                    body,
                )
                emails_sent += 1
            except Exception as e:
                print(f"   [ERROR] Failed to send to {cmdr['email']}: {e}")
        
        print(f"   [INFO] Sent birthday reports to {emails_sent} commanders.")

    except Exception as e:
        print(f"[SCHEDULER] Birthday Error: {e}")
    finally:
        conn.close()
