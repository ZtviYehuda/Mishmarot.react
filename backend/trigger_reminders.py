import os
from dotenv import load_dotenv

# Force load .env from current directory
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

print("Environment loaded.")
print(f"SMTP_EMAIL present: {'SMTP_EMAIL' in os.environ}")
print(f"SMTP_PASSWORD present: {'SMTP_PASSWORD' in os.environ}")

# Make sure to set the app context if needed or just import the functions
# The functions use get_db_connection() which likely reads from env vars directly or app config.
# If they rely on Flask app context, we might need to create_app()

from app.utils.reminder_service import (
    check_and_send_morning_reminders,
    check_and_send_weekly_birthday_report,
)

print("\n--- Testing Morning Reminders (Forced) ---")
check_and_send_morning_reminders(force_now=True)

print("\n--- Testing Weekly Birthday Report ---")
check_and_send_weekly_birthday_report()
