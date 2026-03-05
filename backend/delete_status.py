import os
import psycopg2

os.environ["PYTHONIOENCODING"] = "utf-8"

import sys

sys.path.insert(0, os.path.abspath("backend"))
from app import create_app
from app.utils.db import get_db, close_db

app = create_app()
with app.app_context():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM status_types WHERE name = 'כוננות'")
    conn.commit()
    print("Deleted כוננות OK")
    cur.close()
