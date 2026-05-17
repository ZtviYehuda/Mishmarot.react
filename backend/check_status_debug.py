import psycopg2
from psycopg2.extras import RealDictCursor
import json


def check():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="8245",
            port=5432,
        )
        # Use simple cursor and print manually
        cur = conn.cursor()
        cur.execute("SELECT id, name, color FROM status_types")
        rows = cur.fetchall()
        for r in rows:
            print(
                f"ID: {r[0]}, Name (hex): {r[1].encode('utf-16').hex()}, Color: {r[2]}"
            )
        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check()
