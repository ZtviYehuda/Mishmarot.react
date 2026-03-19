from app.utils.db import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

# 1. Add 'יום יחידה/הווי' status type if not exists
cur.execute("SELECT id FROM status_types WHERE name = 'יום יחידה/הווי'")
if not cur.fetchone():
    cur.execute("""
        INSERT INTO status_types (name, color, is_presence, is_persistent)
        VALUES ('יום יחידה/הווי', '#A855F7', FALSE, FALSE)
    """)
    print("✅ Status type 'יום יחידה/הווי' added")
else:
    print("ℹ️ Status type 'יום יחידה/הווי' already exists")

conn.commit()
conn.close()
