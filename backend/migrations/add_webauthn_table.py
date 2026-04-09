"""
Migration: Add WebAuthn credentials table
Run with: python migrations/add_webauthn_table.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.webauthn_credential import WebAuthnCredential

def upgrade():
    """Create webauthn_credentials table"""
    app = create_app()
    
    with app.app_context():
        print("Creating webauthn_credentials table...")
        db.create_all()
        print("✓ Table created successfully")

def downgrade():
    """Drop webauthn_credentials table"""
    app = create_app()
    
    with app.app_context():
        print("Dropping webauthn_credentials table...")
        WebAuthnCredential.__table__.drop(db.engine)
        print("✓ Table dropped successfully")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'downgrade':
        downgrade()
    else:
        upgrade()
