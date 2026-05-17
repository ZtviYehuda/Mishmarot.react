from app.models.employee_model import EmployeeModel

print("Testing EmployeeModel.get_all_employees...")

employees = EmployeeModel.get_all_employees(filters={}, requesting_user={"id": 1, "is_admin": True})
print(f"Total employees fetched: {len(employees)}")
