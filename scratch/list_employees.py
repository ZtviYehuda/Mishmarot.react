import os
import psycopg2
import json
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(workspace_dir, 'backend', '.env')
load_dotenv(dotenv_path)

def list_employees():
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_pass = os.getenv('DB_PASS')
    db_port = os.getenv('DB_PORT', 5432)
    
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_pass,
            port=db_port
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT id, username, first_name, last_name, is_commander, is_admin, is_active 
            FROM employees;
        """)
        rows = cur.fetchall()
        employees = []
        for r in rows:
            employees.append({
                "id": r[0],
                "username": r[1],
                "first_name": r[2],
                "last_name": r[3],
                "is_commander": r[4],
                "is_admin": r[5],
                "is_active": r[6]
            })
        with open(os.path.join(current_dir, "employees.json"), "w", encoding="utf-8") as f:
            json.dump(employees, f, indent=2, ensure_ascii=False)
        print("Wrote to employees.json successfully")
        cur.close()
        conn.close()
    except Exception as e:
        print("Error listing employees:", e)

if __name__ == "__main__":
    list_employees()
