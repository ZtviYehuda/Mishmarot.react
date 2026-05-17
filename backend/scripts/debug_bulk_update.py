import sys
import os
import json
import datetime
from datetime import datetime as dt
import psycopg2
from psycopg2.extras import RealDictCursor

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.config import Config
from app.models.attendance_model import AttendanceModel


def default_serializer(obj):
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    return str(obj)


def run_debug():
    # 1. Get an active employee
    conn = psycopg2.connect(
        host=Config.DB_HOST,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASS,
        port=Config.DB_PORT,
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "SELECT id, first_name FROM employees WHERE is_active = TRUE AND personal_number != 'admin' LIMIT 1"
    )
    emp = cur.fetchone()
    if not emp:
        print("No active employee found.")
        return

    emp_id = emp["id"]
    print(f"Testing with Employee: {emp['first_name']} (ID: {emp_id})")

    # 2. Simulate Bulk Update to 'Office' (Status ID 1, assuming 1 is Office)
    # Check status types first
    cur.execute("SELECT id, name FROM status_types WHERE is_presence = TRUE LIMIT 1")
    status = cur.fetchone()
    status_id = status["id"]
    status_name = status["name"]
    print(f"Updating to Status: {status_name} (ID: {status_id})")

    updates = [
        {
            "employee_id": emp_id,
            "status_type_id": status_id,
            "start_date": dt.now().strftime("%Y-%m-%d"),
            "note": "Debug bulk update",
        }
    ]

    print("\nExecuting log_bulk_status...")
    AttendanceModel.log_bulk_status(updates)

    # 3. Check Dashboard Stats using Model
    print("\n--- Checking Dashboard Stats ---")
    mock_user = {"is_admin": True}
    mock_filters = {"date": dt.now().strftime("%Y-%m-%d")}

    stats = AttendanceModel.get_dashboard_stats(mock_user, mock_filters)
    print(json.dumps(stats, default=default_serializer, indent=2, ensure_ascii=False))

    # 4. Check Comparison Stats
    print("\n--- Checking Comparison Stats ---")
    comp_stats = AttendanceModel.get_unit_comparison_stats(
        mock_user, dt.now().strftime("%Y-%m-%d")
    )
    print(
        json.dumps(comp_stats, default=default_serializer, indent=2, ensure_ascii=False)
    )

    conn.close()


if __name__ == "__main__":
    run_debug()
