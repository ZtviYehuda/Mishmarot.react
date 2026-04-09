from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import os
import base64
import json
import secrets
from datetime import datetime

webauthn_bp = Blueprint('webauthn', __name__)

# In-memory biometric data store (in production, use database)
BIOMETRIC_STORE = {}
CHALLENGE_STORE = {}

@webauthn_bp.route('/api/auth/biometric-challenge', methods=['POST'])
@cross_origin()
def biometric_challenge():
    """Generate a challenge for biometric registration/authentication"""
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    
    # Generate a random challenge
    challenge = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    
    # Store challenge temporarily
    CHALLENGE_STORE[user_id] = {
        'challenge': challenge,
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify({
        'challenge': challenge,
        'rp_id': 'localhost',
        'rp_name': 'ShiftGuard',
        'user_id': user_id,
        'user_name': user_id
    }), 200


@webauthn_bp.route('/api/auth/biometric-register', methods=['POST'])
@cross_origin()
def biometric_register():
    """Register biometric credentials for a user"""
    data = request.get_json()
    user_id = data.get('user_id')
    credential_id = data.get('credential_id')
    public_key = data.get('public_key')
    
    if not user_id or not credential_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Store biometric credential
    if user_id not in BIOMETRIC_STORE:
        BIOMETRIC_STORE[user_id] = []
    
    BIOMETRIC_STORE[user_id].append({
        'credential_id': credential_id,
        'public_key': public_key,
        'registered_at': datetime.now().isoformat(),
        'type': 'biometric'
    })
    
    return jsonify({
        'ok': True,
        'message': 'Biometric credential registered successfully'
    }), 200


@webauthn_bp.route('/api/auth/biometric-login', methods=['POST'])
@cross_origin()
def biometric_login():
    """Authenticate using biometric credentials"""
    data = request.get_json()
    user_id = data.get('user_id')
    credential_id = data.get('credential_id')
    
    if not user_id or not credential_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user has registered this credential
    if user_id not in BIOMETRIC_STORE:
        return jsonify({'error': 'No biometric credentials registered'}), 404
    
    credentials = BIOMETRIC_STORE[user_id]
    credential = next((c for c in credentials if c['credential_id'] == credential_id), None)
    
    if not credential:
        return jsonify({'error': 'Credential not found'}), 404
    
    # In production, verify the cryptographic proof here
    # For now, we just confirm the credential exists
    return jsonify({
        'ok': True,
        'message': 'Biometric authentication successful',
        'user_id': user_id
    }), 200


@webauthn_bp.route('/api/auth/biometric-verify', methods=['POST'])
@cross_origin()
def biometric_verify():
    """Verify biometric assertion"""
    data = request.get_json()
    user_id = data.get('user_id')
    assertion = data.get('assertion')
    
    if not user_id or not assertion:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify challenge
    challenge_data = CHALLENGE_STORE.get(user_id)
    if not challenge_data:
        return jsonify({'error': 'Invalid challenge'}), 400
    
    # In production, verify the cryptographic signature here
    # For demo purposes, we accept if credential exists
    if user_id in BIOMETRIC_STORE and len(BIOMETRIC_STORE[user_id]) > 0:
        return jsonify({
            'ok': True,
            'message': 'Biometric verification successful'
        }), 200
    
    return jsonify({'error': 'Biometric verification failed'}), 401
