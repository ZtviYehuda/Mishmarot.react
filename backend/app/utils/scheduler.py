from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.reminder_service import (
    check_and_send_morning_reminders,
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
    scheduler.add_job(
        func=check_and_send_morning_reminders,
        trigger="cron",
        day_of_week="sun,mon,tue,wed,thu",
        hour="7-10",  # Optimization: Only run between 07:00 and 10:00 to save resources
        minute="*",
        id="morning_reminder_job",
        replace_existing=True,
    )

    # 2. Data Archive Job - runs every night at 02:00
    # Moves logs older than 1 full calendar month to attendance_logs_archive
    # Example: On March 1st, January data is moved to archive
    def _safe_archive():
        try:
            from app.utils.archive_service import run_archive_cycle
            result = run_archive_cycle()
            print(f"[SCHEDULER] Archive cycle completed: {result}")
        except Exception as e:
            print(f"[SCHEDULER] Archive cycle error: {e}")

    scheduler.add_job(
        func=_safe_archive,
        trigger="cron",
        hour=2,
        minute=0,
        id="archive_job",
        replace_existing=True,
    )

    scheduler.start()
    print("[SCHEDULER] Background scheduler started. Tasks scheduled.")

    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())

