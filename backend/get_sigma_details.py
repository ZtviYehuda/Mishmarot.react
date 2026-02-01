from app.utils.db import get_db_connection


def get_sigma_commander():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect.")
        return

    cur = conn.cursor()
    # Find Section
    cur.execute(
        "SELECT id, name, commander_id FROM sections WHERE name = 'מדור סיגמ\"ה'"
    )
    section = cur.fetchone()

    if not section:
        print("Section 'מדור סיגמ\"ה' not found.")
        return

    print(f"Section Found: {section}")

    commander_id = section[2]
    if commander_id:
        cur.execute(
            "SELECT personal_number, first_name, last_name, password_hash FROM employees WHERE id = %s",
            (commander_id,),
        )
        commander = cur.fetchone()
        print(
            f"Commander Details: Personal Number: {commander[0]}, Name: {commander[1]} {commander[2]}"
        )
        # Note: Password is hashed, but we know from generation it's 123456
    else:
        print("No commander assigned to this section.")

    conn.close()


if __name__ == "__main__":
    get_sigma_commander()
