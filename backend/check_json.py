import os
import sys
import json
from datetime import date

sys.path.append(os.getcwd())
try:
    from app.models.attendance_model import AttendanceModel
    from app.models.employee_model import EmployeeModel
except ImportError:
    pass


def check_raw_json():
    # We'll just call the model methods directly and see what they return as DICTS
    target_date = "2026-02-23"
    requester = EmployeeModel.get_employee_by_id(1)  # Admin
    filters = {"date": target_date}

    stats = AttendanceModel.get_dashboard_stats(
        requesting_user=requester, filters=filters
    )
    print("Dashboard Stats Sample:")
    print(json.dumps(stats[:3], indent=2, ensure_ascii=False))

    # Check one employee record
    emps = EmployeeModel.get_all_employees(filters=filters, requesting_user=requester)
    print("\nEmployee Sample (status details):")
    if emps:
        e = next((emp for emp in emps if emp["status_id"]), emps[0])
        subset = {
            k: e[k]
            for k in [
                "first_name",
                "last_name",
                "status_name",
                "status_is_persistent",
                "status_id",
            ]
        }
        print(json.dumps(subset, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    check_raw_json()
