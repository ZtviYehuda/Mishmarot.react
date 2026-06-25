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
    
    # 3. Fetch /auth/me
    me_res = requests.get("http://127.0.0.1:5000/auth/me", headers={"Authorization": f"Bearer {dani_token}"})
    
    print("STATUS:", me_res.status_code)
    try:
        data = me_res.json()
        print("is_admin:", data.get("is_admin"))
        print("is_impersonated:", data.get("is_impersonated"))
        print("commands_team_id:", data.get("commands_team_id"))
    except Exception as e:
        print("Error", e)

if __name__ == "__main__":
    run()
