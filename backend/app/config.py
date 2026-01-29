import os
from dotenv import load_dotenv
from datetime import timedelta

# טעינת משתני סביבה מקובץ .env
load_dotenv()

class Config:
    # הגדרות אבטחה
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev_secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12) # הטוקן תקף ל-12 שעות
    
    # הגדרות מסד נתונים
    DB_HOST = os.getenv('DB_HOST')
    DB_NAME = os.getenv('DB_NAME')
    DB_USER = os.getenv('DB_USER')
    DB_USER = os.getenv('DB_USER')
    DB_PASS = os.getenv('DB_PASS')
    DB_PORT = os.getenv('DB_PORT', 5432)