import psycopg2
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS')
    )
    cur = conn.cursor()
    
    # Set admin password to "admin"
    password_hash = generate_password_hash("admin")
    cur.execute(
        'UPDATE employees SET password_hash = %s, must_change_password = FALSE WHERE id = %s',
        (password_hash, 5)
    )
    conn.commit()
    
    # Check the user
    cur.execute('SELECT id, first_name, last_name, personal_number, is_admin FROM employees WHERE id = 5')
    user = cur.fetchone()
    if user:
        print(f'✅ Admin user updated:')
        print(f'   ID: {user[0]}')
        print(f'   Name: {user[1]} {user[2]}')
        print(f'   Personal#: {user[3]}')
        print(f'   Is Admin: {user[4]}')
        print(f'\n📝 You can now login with:')
        print(f'   Personal Number: {user[3]}')
        print(f'   Password: admin')
    
    cur.close()
    conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
