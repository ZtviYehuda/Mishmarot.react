#!/usr/bin/env python3
"""
קובץ בדיקה לחיבור למסד הנתונים
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2

# טעינת משתני סביבה
load_dotenv()

def test_db_connection():
    """בדיקת חיבור למסד הנתונים"""
    try:
        print("🔍 בודק חיבור למסד הנתונים...")
        
        # קריאת משתני סביבה
        db_host = os.getenv('DB_HOST')
        db_name = os.getenv('DB_NAME') 
        db_user = os.getenv('DB_USER')
        db_pass = os.getenv('DB_PASS')
        db_port = os.getenv('DB_PORT', 5432)
        
        print(f"📊 מתחבר ל: {db_host}:{db_port}/{db_name}")
        
        # ניסיון חיבור
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_pass,
            port=db_port
        )
        
        # בדיקת החיבור
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print(f"✅ חיבור הצליח!")
        print(f"📋 גרסת PostgreSQL: {version[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ שגיאה בחיבור למסד הנתונים:")
        print(f"   {str(e)}")
        return False

if __name__ == "__main__":
    success = test_db_connection()
    sys.exit(0 if success else 1)