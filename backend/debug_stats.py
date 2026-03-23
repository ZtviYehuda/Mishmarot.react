from app.models.employee_model import EmployeeModel
from app.models.attendance_model import AttendanceModel

def test_stats():
    requester = EmployeeModel.get_employee_by_id(1)
    # Test for Dep 2
    res_dept2 = AttendanceModel.get_dashboard_stats(requesting_user=requester, filters={'department_id': 2})
    print(f"Total for Dept 2: {res_dept2['total_employees']}")
    
    # Test for All
    res_all = AttendanceModel.get_dashboard_stats(requesting_user=requester, filters={})
    print(f"Total for ALL: {res_all['total_employees']}")
    print("-" * 20)
    
    # Check if filters are being passed and applied
    # By manually calculating from EmployeeModel
    from app.utils.db import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM employees WHERE is_active=TRUE AND username!='admin'")
    db_all = cur.fetchone()[0]
    print(f"DB total (active, no admin): {db_all}")
    
    cur.execute("SELECT COUNT(*) FROM employees e LEFT JOIN teams t ON e.team_id = t.id LEFT JOIN sections s ON (t.section_id = s.id OR e.section_id = s.id) LEFT JOIN departments d ON (s.department_id = d.id OR e.department_id = d.id) WHERE e.is_active=TRUE AND e.username!='admin' AND d.id=2")
    db_dept2 = cur.fetchone()[0]
    print(f"DB total for Dept 2: {db_dept2}")
    conn.close()

if __name__ == "__main__":
    test_stats()
