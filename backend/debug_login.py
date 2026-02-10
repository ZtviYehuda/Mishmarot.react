from app import create_app
from app.utils.db import get_db_connection
from werkzeug.security import check_password_hash, generate_password_hash

app = create_app()
with app.app_context():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        exit(1)
    
    cur = conn.cursor()
    cur.execute("SELECT id, personal_number, password_hash, first_name FROM employees WHERE personal_number='admin'")
    user = cur.fetchone()
    
    if user:
        user_id, pn, pwhash, name = user
        print(f"Found user: {name} ({pn})")
        print(f"Stored Hash: {pwhash}")
        
        test_pass = "123456"
        if check_password_hash(pwhash, test_pass):
            print(f"✅ Password '{test_pass}' is CORRECT.")
        else:
            print(f"❌ Password '{test_pass}' is INCORRECT.")
            
            # Resetting it just in case
            print("🔄 Resetting password to '123456'...")
            new_hash = generate_password_hash(test_pass)
            cur.execute("UPDATE employees SET password_hash = %s WHERE id = %s", (new_hash, user_id))
            conn.commit()
            print("✅ Password reset successfully.")
            
    else:
        print("❌ User 'admin' not found.")
    
    conn.close()
