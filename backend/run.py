import os
from dotenv import load_dotenv

# Force load .env from current directory
# Force load .env from current directory
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from app import create_app

app = create_app()


@app.route("/favicon.ico")
def favicon():
    return "", 204


# Start Scheduler in production (WSGI server import) or in the main Werkzeug dev process
if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or __name__ != '__main__':
    try:
        from app.utils.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        print(f"Error starting scheduler: {e}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Trigger reload (Updated Scheduler)
