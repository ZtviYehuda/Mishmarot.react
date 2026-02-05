import os
from dotenv import load_dotenv

# Force load .env from current directory
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    print(f"DEBUG: Loading .env from {dotenv_path}")
    load_dotenv(dotenv_path)
else:
    print("DEBUG: .env file NOT found!")

# Verify loaded variables (Debug)
db_pass = os.getenv('DB_PASS')
db_port = os.getenv('DB_PORT')
print(f"DEBUG: DB_PASS loaded? {'Yes' if db_pass else 'No'} (Value length: {len(db_pass) if db_pass else 0})")
print(f"DEBUG: DB_USER loaded? {os.getenv('DB_USER')}")
print(f"DEBUG: DB_PORT loaded? {db_port}")

from app import create_app

app = create_app()


@app.route("/favicon.ico")
def favicon():
    return "", 204


if __name__ == '__main__':
    # Start Scheduler only in the main worker process (to avoid duplicates with reloader)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        from app.utils.scheduler import start_scheduler
        start_scheduler()
        
    app.run(debug=True, host='0.0.0.0', port=5000)
