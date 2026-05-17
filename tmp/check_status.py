import psycopg2
from psycopg2.extras import RealDictCursor
import os


def check():
    conn = psycopg2.connect(
        host="localhost",
        database="mishmarot",
        user="postgres",
        password="password",  # I'll assume standard for now, but usually it's in config
        port=5432,
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, name, parent_status_id FROM status_types")
    rows = cur.fetchall()
    for r in rows:
        print(r)
    conn.close()


if __name__ == "__main__":
    check()
