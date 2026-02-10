import sys
import os

# Add parent dir to path (backend/)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.utils.db import get_db_connection

app = create_app()

with app.app_context():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect")
        sys.exit(1)

    cur = conn.cursor()

    print("Creating delegations table...")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS delegations (
            id SERIAL PRIMARY KEY,
            commander_id INTEGER NOT NULL REFERENCES employees(id),
            delegate_id INTEGER NOT NULL REFERENCES employees(id),
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            CONSTRAINT unique_active_delegation UNIQUE (commander_id, delegate_id, start_date)
        );
    """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_delegations_date_range ON delegations(start_date, end_date);"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_delegations_delegate_id ON delegations(delegate_id);"
    )

    conn.commit()
    conn.close()
    print("Success")
