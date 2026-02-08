from app.models.notification_model import NotificationModel
from app.models.employee_model import EmployeeModel
from app import create_app

app = create_app()
with app.app_context():
    # Assuming user ID 1 is the admin/commander running this
    user = EmployeeModel.get_employee_by_id(1)
    if user:
        alerts = NotificationModel.get_alerts(user)
        for alert in alerts:
            if alert['type'] == 'danger' and 'sick' in alert['id']:
                print(f"DEBUG ALERT: {alert['id']}")
                print(f"DATA KEYS: {alert.get('data', {}).keys()}")
                print(f"SICK EMPLOYEES: {alert.get('data', {}).get('sick_employees')}")
    else:
        print("User 1 not found")
