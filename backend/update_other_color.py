import psycopg2
import os


def update():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="8245",
            port=5432,
        )
        cur = conn.cursor()
        # Update name = 'אחר' to Pink #ec4899 or Teal #14b8a6
        new_color = "#14b8a6"  # Teal
        cur.execute(
            "UPDATE status_types SET color = %s WHERE name = 'אחר'", (new_color,)
        )
        print(f"Updated {cur.rowcount} rows.")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    update()
