from app.utils.db import get_db_connection

def check_schema():
    conn = get_db_connection()
    if not conn:
        print("Could not connect to DB")
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'support_tickets'
        """)
        columns = cur.fetchall()
        for col in columns:
            print(col)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
