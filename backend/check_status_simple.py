import psycopg2
from psycopg2.extras import RealDictCursor


def check():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mishmarot",
            user="postgres",
            password="password",
            port=5432,
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, name, color FROM status_types WHERE name = 'אחר'")
        row = cur.fetchone()
        print(row)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check()
