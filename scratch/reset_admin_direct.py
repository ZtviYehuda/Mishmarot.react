import os
import psycopg2
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Explicitly load from backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(workspace_dir, 'backend', '.env')
load_dotenv(dotenv_path)

def reset_admin():
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_pass = os.getenv('DB_PASS')
    db_port = os.getenv('DB_PORT', 5432)
    
    print(f"Connecting to: {db_host}:{db_port}/{db_name} as {db_user}...")
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_pass,
            port=db_port
        )
        cur = conn.cursor()
        
        pw_hash = generate_password_hash("123456")
        
        # Check if admin exists
        cur.execute("SELECT id, first_name, is_active FROM employees WHERE username = 'admin';")
        admin = cur.fetchone()
        
        if admin:
            print(f"Found admin user: {admin[1]} (ID: {admin[0]}). Updating password and ensuring user is active...")
            cur.execute("UPDATE employees SET password_hash = %s, is_active = TRUE WHERE username = 'admin';", (pw_hash,))
            print("SUCCESS: Admin password updated to: 123456")
        else:
            print("Admin user not found. Creating a new admin user...")
            cur.execute("""
                INSERT INTO employees (username, first_name, last_name, is_admin, is_commander, password_hash, is_active)
                VALUES ('admin', 'Admin', 'System', TRUE, TRUE, %s, TRUE);
            """, (pw_hash,))
            print("SUCCESS: New admin user created with password: 123456")
            
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print("Error resetting admin:", e)

if __name__ == "__main__":
    reset_admin()
