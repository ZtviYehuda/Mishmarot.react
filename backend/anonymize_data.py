
import psycopg2
from app.config import Config

def anonymize_employees():
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASS,
            port=Config.DB_PORT
        )
        cur = conn.cursor()

        # Update names
        cur.execute("UPDATE employees SET first_name = 'User', last_name = id::text, username = 'user_' || id::text WHERE username != 'admin'")
        print("Updated names and usernames.")
        
        # Clear sensitive info if columns exist
        try:
            cur.execute("UPDATE employees SET phone = NULL, email = NULL WHERE username != 'admin'")
            print("Cleared phone/email.")
        except:
            conn.rollback()
            cur = conn.cursor()
        
        # Clear attendance
        cur.execute("DELETE FROM attendance_logs")
        print("Cleared attendance_logs.")

        # Clear notifications and messages to be sure
        cur.execute("DELETE FROM user_messages")
        cur.execute("DELETE FROM feedbacks")
        print("Cleared messages and feedbacks.")

        conn.commit()
        conn.close()
        print("PROCESS COMPLETED SUCCESSFULLY")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    anonymize_employees()
