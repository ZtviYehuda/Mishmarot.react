from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash
from app import create_app

app = create_app()

with app.app_context():
    conn = get_db_connection()
    cur = conn.cursor()

    commanders = ['admin', 'commander1', 'commander2', 'commander3', 'commander4']
    new_pass = "123456"
    pw_hash = generate_password_hash(new_pass)

    for username in commanders:
        cur.execute("SELECT id FROM employees WHERE username = %s", (username,))
        user = cur.fetchone()
        if user:
            # Reset password, ensure must_change_password is FALSE for ease of use
            cur.execute(
                "UPDATE employees SET password_hash = %s, must_change_password = FALSE, is_active = TRUE WHERE username = %s",
                (pw_hash, username)
            )
            print(f"Reset {username} password to {new_pass}")
        else:
            print(f"User {username} not found")

    conn.commit()
    conn.close()
    print("All commander passwords have been reset successfully to 123456!")
