import sys
import os
from app import create_app
from app.utils.db import get_db_connection

app = create_app()

with app.app_context():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        sys.exit(1)

    cur = conn.cursor()
    try:
        print("Adding temp_password_hash column to delegations...")
        cur.execute(
            "ALTER TABLE delegations ADD COLUMN IF NOT EXISTS temp_password_hash VARCHAR(255);"
        )
        conn.commit()
        print("Column added successfully")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()
