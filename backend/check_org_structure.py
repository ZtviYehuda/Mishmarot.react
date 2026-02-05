from app.utils.db import get_db_connection

conn = get_db_connection()
if not conn:
    print("Failed to connect")
    exit(1)

try:
    cur = conn.cursor()
    
    # Check structure
    cur.execute('SELECT COUNT(*) FROM departments')
    print(f'Departments: {cur.fetchone()[0]}')
    
    cur.execute('SELECT COUNT(*) FROM sections')
    print(f'Sections: {cur.fetchone()[0]}')
    
    cur.execute('SELECT COUNT(*) FROM teams')
    print(f'Teams: {cur.fetchone()[0]}')
    
    cur.execute('SELECT COUNT(*) FROM employees')
    print(f'Employees: {cur.fetchone()[0]}')
    
    # Check employee assignments
    cur.execute('SELECT COUNT(*) FROM employees WHERE team_id IS NOT NULL')
    print(f'Employees with team: {cur.fetchone()[0]}')
    
    cur.execute('SELECT COUNT(*) FROM employees WHERE section_id IS NOT NULL')
    print(f'Employees with section: {cur.fetchone()[0]}')
    
    cur.execute('SELECT COUNT(*) FROM employees WHERE department_id IS NOT NULL')
    print(f'Employees with department: {cur.fetchone()[0]}')
    
    print('\nSample employees:')
    cur.execute('SELECT id, first_name, last_name, department_id, section_id, team_id FROM employees LIMIT 5')
    for row in cur.fetchall():
        print(f'  {row[0]}: {row[1]} {row[2]} - Dept:{row[3]} Sect:{row[4]} Team:{row[5]}')
    
finally:
    conn.close()
