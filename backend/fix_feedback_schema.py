import psycopg2
from app.utils.db import get_db_connection

def check_table():
    conn = get_db_connection()
    if not conn:
        print("ERROR: Could not connect to DB")
        return
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedbacks');")
        exists = cur.fetchone()[0]
        print(f"Table 'feedbacks' exists: {exists}")
        
        if not exists:
            print("Creating 'feedbacks' table...")
            cur.execute("""
                CREATE TABLE feedbacks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    category VARCHAR(50) DEFAULT 'improvement',
                    description TEXT NOT NULL,
                    screenshot_url TEXT,
                    context_page VARCHAR(255),
                    user_agent TEXT,
                    status VARCHAR(20) DEFAULT 'open',
                    admin_reply TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            print("Table 'feedbacks' created successfully!")
        else:
            # Check for column status and admin_reply
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'feedbacks';")
            columns = [row[0] for row in cur.fetchall()]
            print(f"Current columns: {columns}")
            
            if 'status' not in columns:
                print("Adding 'status' column...")
                cur.execute("ALTER TABLE feedbacks ADD COLUMN status VARCHAR(20) DEFAULT 'open';")
            if 'admin_reply' not in columns:
                print("Adding 'admin_reply' column...")
                cur.execute("ALTER TABLE feedbacks ADD COLUMN admin_reply TEXT;")
            
            conn.commit()
            print("Schema check complete.")
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_table()
