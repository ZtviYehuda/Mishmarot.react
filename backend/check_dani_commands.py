import os
import sys
import json
sys.path.append(os.getcwd())
from app.models.employee_model import EmployeeModel

def run():
    # Dani Wasserman ID is 208 based on previous check
    emp = EmployeeModel.get_employee_by_id(208)
    print(json.dumps({
        "commands_department_id": emp.get("commands_department_id"),
        "commands_section_id": emp.get("commands_section_id"),
        "commands_team_id": emp.get("commands_team_id"),
        "is_admin": emp.get("is_admin")
    }, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    run()
