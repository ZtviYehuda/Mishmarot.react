from app.utils.db import get_db_connection
from app import create_app

def fix_db():
    app = create_app()
    with app.app_context():
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            print("Creating 'delegations' table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS delegations (
                    id SERIAL PRIMARY KEY,
                    commander_id INTEGER REFERENCES employees(id),
                    delegate_id INTEGER REFERENCES employees(id),
                    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    end_date TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            print("✅ Table 'delegations' created successfully.")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    fix_db()
