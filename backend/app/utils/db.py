import psycopg2
from psycopg2.extras import RealDictCursor
from flask import current_app, g

def get_db_connection():
    """יצירת חיבור למסד הנתונים"""
    try:
        conn = psycopg2.connect(
            host=current_app.config['DB_HOST'],
            database=current_app.config['DB_NAME'],
            user=current_app.config['DB_USER'],
            password=current_app.config['DB_PASS']
        )
        return conn
    except Exception as e:
        print(f"ERROR: Database connection failed: {e}")
        return None

def get_db():
    """חיבור לשימוש בתוך בקשה (Request context)"""
    if 'db' not in g:
        g.db = get_db_connection()
    return g.db

def close_db(e=None):
    """סגירת החיבור בסיום הבקשה"""
    db = g.pop('db', None)
    if db is not None:
        db.close()