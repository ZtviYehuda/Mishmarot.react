import os
from app import create_app

app = create_app()


@app.route("/favicon.ico")
def favicon():
    return "", 204


if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        print("Starting Backup Worker (safe)...")
        # start_backup_worker()

    app.run(debug=True)
