import os
import sys
sys.path.append(os.getcwd())
from app.models.employee_model import EmployeeModel
from app.models.attendance_model import AttendanceModel

def run():
    dani = EmployeeModel.get_employee_by_id(208)
    
    # No filters
    res = AttendanceModel.get_unit_comparison_stats(requesting_user=dani, date='2026-06-24', filters=None)
    print("Result with NO filter:")
    for r in res:
        print(r['unit_name'])

if __name__ == "__main__":
    run()
