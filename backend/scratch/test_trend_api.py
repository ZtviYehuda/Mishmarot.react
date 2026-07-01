import sys
from app.utils.db import get_db_connection
from app.models.attendance_model import AttendanceModel
from app.models.employee_model import EmployeeModel

try:
    # Get a real user using EmployeeModel
    # Usually admin is ID 1 or we can find the first active user
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM employees WHERE is_active=TRUE LIMIT 1")
    user_row = cur.fetchone()
    if not user_row:
        print("No users found")
        sys.exit(1)
    
    requester = EmployeeModel.get_employee_by_id(user_row[0])
    print(f"Testing with requester: {requester.get('username')}")
    
    print(f"Testing with status_id=6 (חו' חול)...")
    res = AttendanceModel.get_attendance_trend(days=7, requesting_user=requester, filters={"status_id": 6})
    print("Result:")
    print(res)
    
    print(f"\nTesting with status_id=-999 (משרד)...")
    res2 = AttendanceModel.get_attendance_trend(days=7, requesting_user=requester, filters={"status_id": -999})
    print("Result 2:")
    print(res2)
    
except Exception as e:
    import traceback
    traceback.print_exc()
