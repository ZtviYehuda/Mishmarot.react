import psycopg2
from psycopg2.extras import RealDictCursor
from flask import current_app, g, has_app_context

def get_db_connection():
    """יצירת חיבור למסד הנתונים"""
    # בדיקה אם אנחנו בתוך קונטקסט של אפליקציה
    if not has_app_context():
        # זה קורה אם מנסים להתחבר מחוץ לבקשה, כמו בסקריפט ההקמה
        # במקרה כזה, נייבא את האפליקציה ישירות כדי לקבל גישה לתצורה
        from run import app
        config = app.config
    else:
        # הדרך הרגילה והמועדפת בתוך בקשת HTTP
        config = current_app.config

    try:
        conn = psycopg2.connect(
            host=config.get('DB_HOST'),
            database=config.get('DB_NAME'),
            user=config.get('DB_USER'),
            password=config.get('DB_PASS') # שימוש ב- .get() בטוח יותר
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