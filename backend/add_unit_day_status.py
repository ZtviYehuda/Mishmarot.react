from app.utils.db import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

# 1. Add 'יום יחידה' status type if not exists
cur.execute("SELECT id FROM status_types WHERE name = 'יום יחידה'")
if not cur.fetchone():
    cur.execute(
        """
        INSERT INTO status_types (name, color, is_presence, is_persistent)
        VALUES ('יום יחידה', '#A855F7', FALSE, FALSE)
    """
    )
    print("✅ Status type 'יום יחידה' added")
else:
    print("ℹ️ Status type 'יום יחידה' already exists")

conn.commit()
conn.close()
