from app.utils.db import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

cur.execute("SELECT id FROM status_types WHERE code = 'UNIT_DAY'")
if not cur.fetchone():
    cur.execute(
        """
        INSERT INTO status_types (code, name, color, is_presence, is_persistent)
        VALUES ('UNIT_DAY', 'יום יחידה', '#A855F7', FALSE, FALSE)
    """
    )
    print("✅ Status type 'UNIT_DAY' added")
else:
    print("ℹ️ Status type 'UNIT_DAY' already exists")

conn.commit()
conn.close()
