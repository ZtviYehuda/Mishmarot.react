
import psycopg2
from app.config import Config

def clear_all_data():
    try:
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASS,
            port=Config.DB_PORT
        )
        cur = conn.cursor()

        print("Starting deep clean of the database...")

        # 1. Delete all related data first (Foreign Key dependencies)
        tables_to_clear = [
            "attendance_logs_archive",
            "attendance_logs",
            "user_messages",
            "feedbacks",
            "support_tickets",
            "transfer_requests",
            "notification_reads",
            "audit_logs",
            "request_approvals",
            "webauthn_credentials",
            "verification_codes",
            "delegations",
            "data_restore_requests",
            "shift_swaps",
            "shift_swap_requests",
            "morning_reports"
        ]

        for table in tables_to_clear:
            try:
                cur.execute(f"DELETE FROM {table}")
                conn.commit()
                print(f"Cleared table: {table}")
            except Exception as e:
                conn.rollback()
                print(f"Skipping table {table} (might not exist or already empty)")

        # 2. Delete all employees except admin
        cur.execute("DELETE FROM employees WHERE username != 'admin'")
        print(f"Deleted {cur.rowcount} employee records.")

        conn.commit()
        conn.close()
        print("DATABASE CLEARED SUCCESSFULLY. ONLY ADMIN AND STRUCTURE REMAIN.")
    except Exception as e:
        print(f"Error during clearing: {str(e)}")

if __name__ == "__main__":
    clear_all_data()
