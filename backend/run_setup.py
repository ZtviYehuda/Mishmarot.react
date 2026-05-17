from app import create_app
from app.utils.setup import setup_database

app = create_app()
with app.app_context():
    print("Running database setup...")
    setup_database()
    print("Database setup finished.")
