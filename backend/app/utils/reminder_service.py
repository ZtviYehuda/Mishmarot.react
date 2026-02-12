from datetime import datetime, timedelta
from app.models.employee_model import EmployeeModel
from app.utils.db import get_db_connection

from psycopg2.extras import RealDictCursor


def check_and_send_morning_reminders(force_now=False, force_time=None):
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

            # Allow simulation of a specific time
            if force_time:
                # force_time should be "HH:MM" string
                h, m = map(int, force_time.split(":"))
                now = now.replace(hour=h, minute=m, second=0, microsecond=0)

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

        now = datetime.now()
        is_sunday = now.weekday() == 6  # 6 is Sunday in Python

        # --- PREVENTION OF MULTIPLE RUNS PER DAY ---
        today_str = now.strftime("%Y-%m-%d")
        if not force_now:
            cur.execute(
                "SELECT value FROM system_settings WHERE key = 'last_morning_reminder_run'"
            )
            last_run_row = cur.fetchone()
            if last_run_row and last_run_row["value"] == today_str:
                print(
                    f"[SCHEDULER] Reminders already sent today ({today_str}). Skipping."
                )
                return
        # -------------------------------------------

        # 1. Fetch ONLY commanders and admins with emails
        cur.execute(
            """
            SELECT e.id, e.first_name, e.last_name, e.email, e.notif_morning_report,
                   t.id as commands_team_id, t.name as team_name
            FROM employees e
            LEFT JOIN teams t ON t.commander_id = e.id
            WHERE e.is_active = TRUE 
              AND e.email IS NOT NULL 
              AND (e.is_commander = TRUE OR e.is_admin = TRUE)
        """
        )
        all_employees = cur.fetchall()

        # 1.1 If Sunday, get all upcoming birthdays for the week
        upcoming_birthdays = []
        if (
            is_sunday or force_now
        ):  # For testing, we might want to see birthdays regardless
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
            all_bday_emps = cur.fetchall()
            today_date = now.date()
            for b in all_bday_emps:
                bdate = b["birth_date"]
                try:
                    this_year = bdate.replace(year=today_date.year)
                except ValueError:  # Feb 29
                    this_year = bdate.replace(year=today_date.year, month=2, day=28)

                dist = (this_year - today_date).days
                if 0 <= dist < 7:
                    b["celebrate_date"] = this_year
                    upcoming_birthdays.append(b)

        reminders_sent = 0
        sent_emails_set = set()

        print(f"DEBUG: Checking {len(all_employees)} employees for morning reports.")

        for emp in all_employees:
            email = emp["email"].lower().strip()
            if not emp.get("notif_morning_report", True) or email in sent_emails_set:
                continue

            # 2. Check if the employee reported THEMSELVES today
            cur.execute(
                """
                SELECT 1 FROM attendance_logs al
                WHERE al.employee_id = %s
                AND (
                    (DATE(al.start_datetime) = CURRENT_DATE)
                    OR (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                    AND al.status_type_id IN (2, 4, 5, 6) -- Long term statuses
                )
                ORDER BY al.start_datetime DESC LIMIT 1
            """,
                (emp["id"],),
            )
            self_reported = cur.fetchone() is not None

            team_id = emp["commands_team_id"]
            if team_id:
                # --- TEAM LEAD LOGIC ---
                cur.execute(
                    """
                    SELECT COUNT(e.id) as count
                    FROM employees e
                    WHERE e.team_id = %s 
                      AND e.is_active = TRUE 
                      AND e.id != %s
                      AND NOT EXISTS (
                          SELECT 1 FROM attendance_logs al
                          WHERE al.employee_id = e.id
                          AND (
                              (DATE(al.start_datetime) = CURRENT_DATE)
                              OR (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                              AND al.status_type_id IN (2, 4, 5, 6)
                          )
                      )
                """,
                    (team_id, emp["id"]),
                )
                missing_sub_count = cur.fetchone()["count"]

                # --- BIRTHDAY SECTION (Only Sunday or Force) ---
                bday_html = ""
                relevant_bdays = []
                if is_sunday or force_now:
                    for b in upcoming_birthdays:
                        # Scope check for team lead
                        if b["team_id"] == team_id:
                            relevant_bdays.append(b)

                    if relevant_bdays:
                        relevant_bdays.sort(key=lambda x: x["celebrate_date"])
                        bday_rows = ""
                        days_map = {
                            0: "שני",
                            1: "שלישי",
                            2: "רביעי",
                            3: "חמישי",
                            4: "שישי",
                            5: "שבת",
                            6: "ראשון",
                        }
                        for rb in relevant_bdays:
                            d = rb["celebrate_date"]
                            wd = days_map[d.weekday()]
                            bday_rows += f"""
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px; text-align: right;">{rb['first_name']} {rb['last_name']}</td>
                                    <td style="padding: 8px; text-align: right;">{wd} ({d.strftime('%d/%m')})</td>
                                </tr>
                            """
                        bday_html = f"""
                        <div style="margin-top: 24px; padding: 20px; background-color: #f5f3ff; border-radius: 12px; border: 1px solid #ddd6fe;">
                            <h3 style="color: #6d28d9; margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center;">
                                🎂 ימי הולדת השבוע בחוליה
                            </h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                {bday_rows}
                            </table>
                        </div>
                        """

                # --- BUILD REPORTING STATUS HTML ---
                self_report_html = ""
                if not self_reported:
                    self_report_html = f"""
                    <div style="margin-bottom: 12px; padding: 16px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fee2e2;">
                        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px;">⚠️ סטטוס אישי: טרם דווח</h4>
                        <p style="margin: 0; color: #b91c1c; font-size: 14px;">נא להיכנס למערכת ולעדכן את הסטטוס שלך להיום.</p>
                    </div>
                    """
                else:
                    self_report_html = f"""
                    <div style="margin-bottom: 12px; padding: 16px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
                        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 16px;">✅ סטטוס אישי: דווח בהצלחה</h4>
                        <p style="margin: 0; color: #15803d; font-size: 14px;">הדיווח שלך התקבל במערכת.</p>
                    </div>
                    """

                team_report_html = ""
                if missing_sub_count > 0:
                    team_report_html = f"""
                    <div style="margin-bottom: 20px; padding: 16px; background-color: #fff7ed; border-radius: 12px; border: 1px solid #ffedd5;">
                        <h4 style="margin: 0 0 8px 0; color: #9a3412; font-size: 16px;">📋 סטטוס חוליה: {emp['team_name']}</h4>
                        <p style="margin: 0; color: #c2410c; font-size: 14px;">
                            ישנם <strong>{missing_sub_count}</strong> שוטרים בחולייה שטרם הוזן להם סטטוס.
                        </p>
                    </div>
                    """
                elif team_id:
                    team_report_html = f"""
                    <div style="margin-bottom: 20px; padding: 16px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
                        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 16px;">✅ סטטוס חוליה: הושלם</h4>
                        <p style="margin: 0; color: #15803d; font-size: 14px;">כל שוטרי החולייה מדווחים להיום. עבודה מצוינת!</p>
                    </div>
                    """

                if not self_reported or missing_sub_count > 0 or bday_html:
                    subject = "תזכורת בוקר ועדכונים שבועיים"
                    if not bday_html:
                        subject = "תזכורת: דיווח נוכחות לחוליה"

                    body = f"""
                    <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">שלום, {emp['first_name']}! 👋</h1>
                            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">תזכורת בוקר וסטטוס יומי - מערכת משמרות</p>
                        </div>

                        <!-- Content Area -->
                        <div style="padding: 24px; line-height: 1.6;">
                            
                            <!-- Reporting Section -->
                            <div style="margin-bottom: 24px;">
                                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">📊 דיווחי נוכחות להיום</h3>
                                {self_report_html}
                                {team_report_html}
                            </div>

                            <!-- Birthday Section -->
                            {bday_html}

                            <!-- Deadline & Info -->
                            <div style="margin-top: 32px; padding: 20px; background-color: #f8fafc; border-radius: 12px; border-right: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #475569; font-size: 14px;"> 🕒 <strong>יעד לדיווח:</strong> {deadline_str}</p>
                            </div>

                            <!-- Action Button -->
                            <div style="margin-top: 32px; text-align: center;">
                                <a href="http://localhost:5173" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">כניסה למערכת ועדכון</a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 24px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b;">
                            נשלח באופן אוטומטי על ידי מערכת "משמרות" &copy; {datetime.now().year}
                        </div>
                    </div>
                    """
                    from app.utils.email_service import send_email

                    if send_email(email, subject, body):
                        reminders_sent += 1
                        sent_emails_set.add(email)
            else:
                # --- EVERYONE ELSE (Self-report only) ---
                if not self_reported:
                    subject = "תזכורת: דיווח נוכחות יומי"
                    body = f"""
                    <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 32px 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">שלום, {emp['first_name']}! 👋</h1>
                            <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">דיווח נוכחות יומי - מערכת משמרות</p>
                        </div>

                        <!-- Content -->
                        <div style="padding: 32px 24px; text-align: center;">
                            <div style="margin-bottom: 24px; padding: 24px; background-color: #fff1f2; border-radius: 12px; border: 1px solid #ffe4e6;">
                                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                                <h2 style="color: #9f1239; margin: 0 0 8px 0;">טרם הזנת דיווח היום</h2>
                                <p style="color: #be123c; margin: 0; font-size: 15px;">נא להיכנס למערכת ולעדכן את הסטטוס שלך (משרד, חופשה, מחלה וכו') עד השעה {deadline_str}.</p>
                            </div>

                            <a href="http://localhost:5173" style="display: inline-block; background-color: #475569; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">עדכון נוכחות עכשיו</a>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 24px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                            נשלח באופן אוטומטי על ידי מערכת "משמרות" &copy; {datetime.now().year}
                        </div>
                    </div>
                    """
                    from app.utils.email_service import send_email

                    if send_email(email, subject, body):
                        reminders_sent += 1
                        sent_emails_set.add(email)

        # Update last run date in settings
        if not force_now:
            cur.execute(
                """
                INSERT INTO system_settings (key, value) 
                VALUES ('last_morning_reminder_run', %s)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            """,
                (today_str,),
            )
            conn.commit()

        print(f"[SCHEDULER] Done. Sent {reminders_sent} reminders.")

    except Exception as e:
        print(f"[SCHEDULER] Error: {e}")
    finally:
        conn.close()


# Note: check_and_send_weekly_birthday_report has been merged into check_and_send_morning_reminders
