import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("DB_HOST")
dbname = os.getenv("DB_NAME")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")

print(f"Testing connection to: {host} as user: {user} with pass: {password}")

try:
    conn = psycopg2.connect(host=host, database=dbname, user=user, password=password)
    print("\n✅ הצלחה! הסיסמה בקובץ .env נכונה.")
    print("עכשיו אפשר להריץ את השרת (python run.py)")
    conn.close()
except Exception as e:
    print("\n❌ כישלון! הסיסמה או המשתמש שגויים.")
    print(f"השגיאה שהתקבלה: {e}")
