import psycopg2
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

def reset_roles():
    try:
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST"),
            database=os.environ.get("DB_NAME"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASS"),
            port=os.environ.get("DB_PORT")
        )
        cur = conn.cursor()
        
        print("Resetting roles...")
        cur.execute("TRUNCATE TABLE roles CASCADE")
        cur.execute("INSERT INTO roles (id, name) VALUES (1, 'Admin'), (2, 'Commander'), (3, 'Soldier')")
        conn.commit()
        print("Roles reset successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_roles()
