import psycopg2
import sys

try:
    print("Attempting to connect...")
    conn = psycopg2.connect(
        host='127.0.0.1',
        user='postgres',
        password='8245',
        dbname='postgres'
    )
    print("SUCCESS: Connected to database!")
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")
