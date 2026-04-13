
from app.utils.db import get_db_connection
import sys

def init_webauthn_tables():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB")
        sys.exit(1)
    
    try:
        with conn.cursor() as cur:
            # Table for stored credentials
            print("Creating webauthn_credentials table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS webauthn_credentials (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                    credential_id BYTEA NOT NULL UNIQUE,
                    public_key BYTEA NOT NULL,
                    sign_count INTEGER DEFAULT 0,
                    transports TEXT[],
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);
            """)

            # Table for short-lived challenges
            print("Creating webauthn_challenges table...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS webauthn_challenges (
                    challenge TEXT PRIMARY KEY,
                    user_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
            """)
            
            conn.commit()
            print("WebAuthn tables initialized successfully.")
    except Exception as e:
        print(f"Error initializing tables: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    init_webauthn_tables()
