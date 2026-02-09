from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.reminder_service import (
    check_and_send_morning_reminders,
    check_and_send_weekly_birthday_report,
)
import atexit


def start_scheduler():
    """
    Initializes and starts the background scheduler.
    """
    scheduler = BackgroundScheduler()

    # 1. Morning Reminder Task
    # Runs Sunday (6) to Thursday (3).
    # The function itself checks if the time is (Deadline - 15min).
    # We trigger it every minute during relevant hours or just * to be safe as the function has strict time check.
    scheduler.add_job(
        func=check_and_send_morning_reminders,
        trigger="cron",
        day_of_week="sun,mon,tue,wed,thu",
        hour="7-10",  # Optimization: Only run between 07:00 and 10:00 to save resources
        minute="*",
        id="morning_reminder_job",
        replace_existing=True,
    )

    # 2. Weekly Birthday Report
    # Runs every Sunday at 08:00 AM
    scheduler.add_job(
        func=check_and_send_weekly_birthday_report,
        trigger="cron",
        day_of_week="sun",
        hour=8,
        minute=0,
        id="weekly_birthday_report",
        replace_existing=True,
    )

    scheduler.start()
    print("✅ [SCHEDULER] Background scheduler started. Tasks scheduled.")

    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())
