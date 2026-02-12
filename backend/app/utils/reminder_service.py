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

        # 1. Fetch ALL commanders and admins with their command context
        cur.execute(
            """
            SELECT e.id, e.first_name, e.last_name, e.email, e.notif_morning_report,
                   e.is_admin,
                   (SELECT id FROM departments WHERE commander_id = e.id LIMIT 1) as commands_department_id,
                   (SELECT id FROM sections WHERE commander_id = e.id LIMIT 1) as commands_section_id,
                   (SELECT id FROM teams WHERE commander_id = e.id LIMIT 1) as commands_team_id
            FROM employees e
            WHERE e.is_active = TRUE 
              AND e.email IS NOT NULL 
              AND (e.is_commander = TRUE OR e.is_admin = TRUE)
        """
        )
        all_employees = cur.fetchall()

        # 1.1 Weekly birthdays (Sunday only)
        total_upcoming_birthdays = []
        if is_sunday or force_now:
            cur.execute(
                """
                SELECT e.id, e.first_name, e.last_name, e.birth_date, 
                       e.department_id, e.section_id, e.team_id
                FROM employees e
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
                    total_upcoming_birthdays.append(b)

        reminders_sent = 0
        sent_emails_set = set()

        print(f"DEBUG: Checking {len(all_employees)} employees for morning reports.")

        for emp in all_employees:
            email = emp["email"].lower().strip()
            if not emp.get("notif_morning_report", True) or email in sent_emails_set:
                continue

            # 2. Self Report Check
            cur.execute(
                """
                SELECT 1 FROM attendance_logs al
                WHERE al.employee_id = %s
                AND (
                    (DATE(al.start_datetime) = CURRENT_DATE)
                    OR (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE)
                    AND al.status_type_id IN (2, 4, 5, 6)
                )
                ORDER BY al.start_datetime DESC LIMIT 1
            """,
                (emp["id"],),
            )
            self_reported = cur.fetchone() is not None

            # 3. Sub-unit Status Logic
            sub_status_html = ""
            sub_reports_found = []

            # If Team Leader
            if emp["commands_team_id"]:
                cur.execute(
                    """
                    SELECT e.first_name, e.last_name 
                    FROM employees e 
                    WHERE e.team_id = %s AND e.is_active = TRUE AND e.id != %s
                    AND NOT EXISTS (
                        SELECT 1 FROM attendance_logs al 
                        WHERE al.employee_id = e.id 
                        AND (DATE(al.start_datetime) = CURRENT_DATE OR (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE) AND al.status_type_id IN (2, 4, 5, 6))
                    )
                """,
                    (emp["commands_team_id"], emp["id"]),
                )
                missing = cur.fetchall()
                if missing:
                    sub_reports_found.append(
                        {"unit": "חוליה", "missing_count": len(missing)}
                    )

            # If Section/Dept Commander - Show summary of units
            if (
                emp["commands_section_id"]
                or emp["commands_department_id"]
                or emp["is_admin"]
            ):
                query = """
                    SELECT t.id, t.name as unit_name, 
                           cmd.first_name || ' ' || cmd.last_name as commander_name 
                    FROM teams t 
                    JOIN sections s ON t.section_id = s.id
                    LEFT JOIN employees cmd ON t.commander_id = cmd.id
                """
                where_clause = ""
                params = []
                if emp["commands_section_id"]:
                    where_clause = " WHERE t.section_id = %s"
                    params = [emp["commands_section_id"]]
                elif emp["commands_department_id"]:
                    where_clause = " WHERE s.department_id = %s"
                    params = [emp["commands_department_id"]]

                if where_clause:
                    cur.execute(query + where_clause, params)
                    sub_units = cur.fetchall()
                    for unit in sub_units:
                        cur.execute(
                            """
                            SELECT COUNT(*) as count 
                            FROM employees e 
                            WHERE e.team_id = %s AND e.is_active = TRUE 
                            AND NOT EXISTS (
                                SELECT 1 FROM attendance_logs al 
                                WHERE al.employee_id = e.id 
                                AND (DATE(al.start_datetime) = CURRENT_DATE 
                                     OR (al.end_datetime IS NULL OR DATE(al.end_datetime) >= CURRENT_DATE) 
                                     AND al.status_type_id IN (2, 4, 5, 6))
                            )
                            """,
                            (unit["id"],),
                        )
                        m_count = cur.fetchone()["count"]
                        if m_count > 0:
                            sub_reports_found.append(
                                {
                                    "unit": unit["unit_name"],
                                    "commander": unit["commander_name"] or "לא מונה",
                                    "missing_count": m_count,
                                }
                            )

            # 4. Birthdays relevant to scope
            bday_html = ""
            if (is_sunday or force_now) and total_upcoming_birthdays:
                relevant_bdays = []
                for b in total_upcoming_birthdays:
                    in_scope = False
                    if emp["is_admin"]:
                        in_scope = True
                    elif emp["commands_department_id"] == b["department_id"]:
                        in_scope = True
                    elif emp["commands_section_id"] == b["section_id"]:
                        in_scope = True
                    elif emp["commands_team_id"] == b["team_id"]:
                        in_scope = True
                    if in_scope:
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
                        bday_rows += f"""<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 12px 0; text-align: right; color: #334155; font-size: 14px;">{rb['first_name']} {rb['last_name']}</td><td style="padding: 12px 0; text-align: left; color: #64748b; font-size: 13px;">יום {days_map[d.weekday()]} ({d.strftime('%d/%m')})</td></tr>"""
                    bday_html = f"""<div style="margin-top: 32px; border-top: 2px solid #f1f5f9; padding-top: 24px;"><h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 16px; font-weight: 800;">🎂 ימי הולדת השבוע ביחידה</h3><table style="width: 100%; border-collapse: collapse;">{bday_rows}</table></div>"""

            # Combine Status Sections
            status_summary_html = ""
            if not self_reported:
                status_summary_html += f"""<div style="margin-bottom: 16px; padding: 16px; border-right: 4px solid #ef4444; background-color: #fafafa;"><h4 style="margin: 0 0 4px 0; color: #b91c1c; font-size: 15px; font-weight: 700;">⚠️ טרם דיווחת היום</h4><p style="margin: 0; color: #7f1d1d; font-size: 13px;">נא לעדכן את הסטטוס האישי שלך במערכת.</p></div>"""
            else:
                status_summary_html += f"""<div style="margin-bottom: 16px; padding: 16px; border-right: 4px solid #10b981; background-color: #fafafa;"><h4 style="margin: 0 0 4px 0; color: #065f46; font-size: 15px; font-weight: 700;">✅דיווח עצמי מעודכן </h4></div>"""

            for sub in sub_reports_found:
                status_summary_html += f"""
                <div style="margin-bottom: 12px; padding: 16px; border-right: 4px solid #f59e0b; background-color: #fafafa;">
                    <h4 style="margin: 0 0 4px 0; color: #92400e; font-size: 14px; font-weight: 700;">📋 חסרים דיווחים: {sub['unit']}</h4>
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                        {'מפקד: <strong>' + sub['commander'] + '</strong> | ' if sub.get('commander') else ''}
                        חסרים <strong>{sub['missing_count']}</strong> שוטרים.
                    </p>
                </div>"""

            if not self_reported or sub_reports_found or bday_html:
                subject = "תזכורת בוקר - מערכת משמרות"
                body = f"""
                <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 40px auto; background-color: #ffffff; color: #334155;">
                    <div style="padding: 0 20px;">
                        <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 800;">בוקר טוב, {emp['first_name']}</h1>
                        <p style="color: #64748b; margin: 8px 0 32px 0; font-size: 16px;">להלן סטטוס הדיווחים היומי שלך ושל פקודיך</p>
                        
                        <div style="margin-bottom: 32px;">
                            {status_summary_html}
                        </div>

                        {bday_html}

                        <div style="margin-top: 40px; text-align: center;">
                            <a href="https://mishmarot.naftaly.co.il" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">לכניסה למערכת</a>
                            <p style="margin-top: 16px; color: #94a3b8; font-size: 12px;">יעד לדיווח: {deadline_str}</p>
                        </div>
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
                "INSERT INTO system_settings (key, value) VALUES ('last_morning_reminder_run', %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                (today_str,),
            )
            conn.commit()

        print(f"[SCHEDULER] Done. Sent {reminders_sent} reminders.")

    except Exception as e:
        print(f"[SCHEDULER] Error: {e}")
    finally:
        conn.close()


# Note: check_and_send_weekly_birthday_report has been merged into check_and_send_morning_reminders
