import os
from dotenv import load_dotenv

# Force load .env from current directory
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

print("Environment loaded.")
print(f"SMTP_EMAIL present: {'SMTP_EMAIL' in os.environ}")
print(f"SMTP_PASSWORD present: {'SMTP_PASSWORD' in os.environ}")

from app.utils.reminder_service import check_and_send_morning_reminders

print("\n--- Testing Combined Morning Reminder (Report + Birthdays) ---")
check_and_send_morning_reminders(force_now=True)
