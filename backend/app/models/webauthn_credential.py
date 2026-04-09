"""
WebAuthn Credential Model
Stores registered biometric devices/credentials
"""

from app import db
from datetime import datetime


class WebAuthnCredential(db.Model):
    """
    Represents a registered WebAuthn credential (biometric device)
    """
    __tablename__ = 'webauthn_credentials'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # WebAuthn credential data
    credential_id = db.Column(db.LargeBinary, unique=True, nullable=False, index=True)
    public_key = db.Column(db.LargeBinary, nullable=False)
    sign_count = db.Column(db.Integer, default=0)
    
    # Device information
    device_name = db.Column(db.String(100), default='מכשיר לא ידוע')
    transports = db.Column(db.JSON, default=list)  # ['usb', 'nfc', 'ble', 'internal']
    
    # Metadata
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('webauthn_credentials', lazy=True))

    def to_dict(self):
        """Convert credential to dictionary"""
        return {
            'id': self.credential_id.hex(),
            'device_name': self.device_name,
            'transports': self.transports,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'is_active': self.is_active,
        }

    def __repr__(self):
        return f'<WebAuthnCredential {self.device_name} for user {self.user_id}>'
