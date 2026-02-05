from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.reminder_service import check_and_send_morning_reminders
import atexit

def start_scheduler():
    """
    Initializes and starts the background scheduler.
    """
    scheduler = BackgroundScheduler()
    
    # Schedule the reminder task
    # Runs Sunday (6) to Thursday (3) at 08:45
    # Note: APScheduler days: mon=0, tue=1, ..., sun=6
    # But cron style usually uses 0-6 where 0=Sunday or 6=Sunday depending on impl.
    # APScheduler: 0 = Mon, 6 = Sun.
    # User requested: "חוץ משישי ושבת". So Sunday(6) + Mon(0)-Thu(3).
    
    # Let's use 'sun,mon,tue,wed,thu' explicit string
    
    scheduler.add_job(
        func=check_and_send_morning_reminders,
        trigger="cron",
        day_of_week="sun,mon,tue,wed,thu",
        hour=8,
        minute=45,
        id="morning_reminder_job",
        replace_existing=True
    )
    
    scheduler.start()
    print("✅ [SCHEDULER] Background scheduler started. Tasks scheduled.")
    
    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())
