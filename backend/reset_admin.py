from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash
from app import create_app

app = create_app()

with app.app_context():
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Check if admin exists
    cur.execute("SELECT id, personal_number, email FROM employees WHERE personal_number = 'admin'")
    user = cur.fetchone()

    if not user:
        print("User 'admin' does not exist. Creating...")
        pw_hash = generate_password_hash("admin123")
        cur.execute("""
            INSERT INTO employees (personal_number, first_name, last_name, is_admin, is_commander, password_hash, national_id)
            VALUES ('admin', 'Admin', 'System', TRUE, TRUE, %s, '000000000')
        """, (pw_hash,))
        print("✅ User 'admin' created with password: 'admin123'")
    else:
        print(f"User found: {user}")
        # 2. Reset Password
        new_pass = "123456"
        pw_hash = generate_password_hash(new_pass)
        cur.execute("UPDATE employees SET password_hash = %s WHERE personal_number = 'admin'", (pw_hash,))
        print(f"✅ Password for 'admin' reset to: '{new_pass}'")
        
        # 3. Ensure Email is set (for testing forgot password)
        if not user[2]: # email
             test_email = "mishmarot2026@gmail.com" # Or whatever you want
             cur.execute("UPDATE employees SET email = %s WHERE personal_number = 'admin'", (test_email,))
             print(f"✅ Email for 'admin' set to: '{test_email}'")

    conn.commit()
    conn.close()
