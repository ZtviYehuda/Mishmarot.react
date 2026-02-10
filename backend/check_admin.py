from app import create_app
from app.utils.db import get_db_connection

app = create_app()
with app.app_context():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        exit(1)
    
    cur = conn.cursor()
    # Check for admin user
    cur.execute("SELECT personal_number, first_name, last_name, is_admin FROM employees WHERE is_admin=True")
    admins = cur.fetchall()
    print("Admins found:", admins)
