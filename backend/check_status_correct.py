import psycopg2
from psycopg2.extras import RealDictCursor


def check():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="8245",
            port=5432,
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, name, color FROM status_types")
        rows = cur.fetchall()
        for r in rows:
            print(r)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check()
