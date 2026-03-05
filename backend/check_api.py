import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.models.employee_model import EmployeeModel


def check_employees_api():
    print("Checking Employee API data for today...")
    requester = {"id": 1, "is_admin": True}
    target_date = "2026-02-23"

    filters = {"date": target_date}
    employees = EmployeeModel.get_all_employees(
        filters=filters, requesting_user=requester
    )

    print(f"Total employees returned: {len(employees)}")

    # Check status of first few
    for e in employees[:10]:
        print(
            f"Employee: {e['first_name']} {e['last_name']} | Status: {e['status_name']} | Persistent: {e['status_is_persistent']}"
        )

    reported = [e for e in employees if e["status_id"] is not None]
    print(f"Total with Status ID: {len(reported)}")

    # Simulate frontend isReportedOnDate
    sim_reported = [
        e for e in employees if e["status_id"] is not None and e["status_is_persistent"]
    ]
    print(f"Simulated Reported (Persistent): {len(sim_reported)}")


if __name__ == "__main__":
    check_employees_api()
