from app.models.employee_model import EmployeeModel
from app.models.attendance_model import AttendanceModel

print("Fetching employees...")
employees = EmployeeModel.get_all_employees(filters={}, requesting_user={"id": 1, "is_admin": True})
print(f"Employees fetched: {len(employees)}")

emp_ids = [e["id"] for e in employees[:5]] # Just check the first 5
print(f"Fetching logs for 5 employees: {emp_ids}...")
try:
    logs = AttendanceModel.get_logs_for_employees(emp_ids, "2026-05-03", "2026-05-09", 1)
    print(f"Logs fetched: {len(logs)}")
except Exception as e:
    import traceback
    traceback.print_exc()
