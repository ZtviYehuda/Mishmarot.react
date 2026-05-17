import psycopg2
import os
from dotenv import load_dotenv

# Try to find .env file
env_path = os.path.join(os.getcwd(), 'backend', '.env')
load_dotenv(env_path)

def migrate():
    db_url = os.getenv('DATABASE_URL', f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASS', '8245')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'postgres')}")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("Adding soft delete columns to user_messages...")
        cur.execute("ALTER TABLE user_messages ADD COLUMN IF NOT EXISTS is_deleted_by_sender BOOLEAN DEFAULT FALSE;")
        cur.execute("ALTER TABLE user_messages ADD COLUMN IF NOT EXISTS is_deleted_by_recipient BOOLEAN DEFAULT FALSE;")
        
        conn.commit()
        print("Migration successful.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
