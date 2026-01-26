import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS')
    )
    cur = conn.cursor()
    
    # Check employees
    cur.execute('SELECT COUNT(*) FROM employees')
    count = cur.fetchone()[0]
    print(f'✅ Total employees: {count}')
    
    if count > 0:
        cur.execute('SELECT id, first_name, last_name, personal_number FROM employees LIMIT 5')
        rows = cur.fetchall()
        print('\n📋 Sample employees:')
        for row in rows:
            print(f'  - ID:{row[0]}, {row[1]} {row[2]} (#{row[3]})')
    
    cur.close()
    conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
