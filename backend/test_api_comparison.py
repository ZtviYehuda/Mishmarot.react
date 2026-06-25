import os
import sys
import json
import requests
sys.path.append(os.getcwd())
from app.models.employee_model import EmployeeModel

def run():
    # 1. Login as admin first
    login_res = requests.post("http://127.0.0.1:5000/auth/login", json={"username": "admin", "password": "123"})
    admin_token = login_res.json()["token"]
    
    # 2. Impersonate Dani
    imp_res = requests.post("http://127.0.0.1:5000/auth/impersonate", json={"target_id": 208}, headers={"Authorization": f"Bearer {admin_token}"})
    dani_token = imp_res.json()["token"]
    
    # 3. Request stats/comparison with Dani's token
    stats_res = requests.get("http://127.0.0.1:5000/stats/comparison", params={"department_id": 1, "days": 30}, headers={"Authorization": f"Bearer {dani_token}"})
    
    print("STATUS:", stats_res.status_code)
    try:
        print(json.dumps(stats_res.json(), ensure_ascii=False, indent=2))
    except:
        print(stats_res.text)

if __name__ == "__main__":
    run()
