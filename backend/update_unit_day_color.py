import os
import sys

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection

def update_color():
    conn = get_db_connection()
    cur = conn.cursor()
    # Change "יום יחידה" to a distinct teal/indigo
    new_color = "#0d9488" 
    cur.execute("UPDATE status_types SET color = %s WHERE name = 'יום יחידה'", (new_color,))
    rows = cur.rowcount
    conn.commit()
    conn.close()
    print(f"Updated {rows} status types.")

if __name__ == "__main__":
    update_color()
