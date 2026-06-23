import json
import os
from dotenv import load_dotenv
load_dotenv('.env')

from run import app
from app.utils.db import get_db_connection

with app.app_context():
    client = app.test_client()
    
    from flask_jwt_extended import create_access_token
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT username, is_commander, is_admin FROM employees WHERE id = 208")
    row = cur.fetchone()
    username, is_commander, is_admin = row
    conn.close()
    
    identity = json.dumps({"id": 208, "username": username, "role": "commander"})
    token = create_access_token(identity=identity)
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = client.get('/api/employees/chat-contacts', headers=headers)
    print("STATUS:", response.status_code)
    print("DATA:")
    contacts = response.json
    for c in contacts:
         # print representation of unicode values safely
         fn_repr = "".join(chr(ord(ch)) for ch in c.get('first_name'))
         ln_repr = "".join(chr(ord(ch)) for ch in c.get('last_name'))
         print(c.get('id'), f"first_name: {fn_repr!r}", f"last_name: {ln_repr!r}", "is_admin:", c.get('is_admin'), "is_commander:", c.get('is_commander'))
