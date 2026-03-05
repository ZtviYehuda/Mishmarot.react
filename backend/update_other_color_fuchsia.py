import psycopg2


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
        new_color = "#d946ef"  # Fuchsia
        cur.execute(
            "UPDATE status_types SET color = %s WHERE name = 'אחר'", (new_color,)
        )
        conn.commit()
        conn.close()
        print("Updated color to Fuchsia.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    update()
