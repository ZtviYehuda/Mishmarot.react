#!/usr/bin/env python3
"""
יצירת משתמש מנהל לבדיקה
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# טעינת משתני סביבה
load_dotenv()

def create_test_admin():
    """יצירת משתמש מנהל לבדיקה"""
    try:
        conn = psycopg2.connect(
 