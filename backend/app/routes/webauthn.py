"""
WebAuthn Authentication Routes
Implements FIDO2/WebAuthn for biometric authentication
"""

from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    AuthenticatorAttachment,
    ResidentKeyRequirement,
    PublicKeyCredentialDescriptor,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from app.models.user import User
from app.models.webauthn_credential import WebAuthnCredential
from app import db
import os
import secrets

bp = Blueprint('webauthn', __name__, url_prefix='/api/webauthn')

# Configuration - will be set from environment
RP_ID = os.getenv('WEBAUTHN_RP_ID', 'localhost')
RP_NAME = os.getenv('WEBAUTHN_RP_NAME', 'ShiftGuard')
RP_ORIGIN = os.getenv('WEBAUTHN_RP_ORIGIN', 'https://localhost:5173')


@bp.route('/register/begin', methods=['POST'])
@jwt_required()
def register_begin():
    """
    Start WebAuthn registration process
    Returns options for navigator.credentials.create()
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        # Get existing credentials to exclude
        existing_credentials = WebAuthnCredential.query.filter_by(user_id=user.id).all()
        exclude_credentials = [
            PublicKeyCredentialDescriptor(id=cred.credential_id)
            for cred in existing_credentials
        ]

        # Generate registration options
        registration_options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=str(user.id).encode('utf-8'),
            user_name=user.username,
            user_display_name=f"{user.first_name} {user.last_name}",
            exclude_credentials=exclude_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                authenticator_attachment=AuthenticatorAttachment.PLATFORM,
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
            supported_pub_key_algs=[
                COSEAlgorithmIdentifier.ECDSA_SHA_256,
                COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
            ],
        )

        # Store challenge in session
        session['webauthn_challenge'] = registration_options.challenge.decode('utf-8')
        session['webauthn_user_id'] = user.id

        return jsonify(options_to_json(registration_options))

    except Exception as e:
        print(f"WebAuthn registration begin error: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/register/complete', methods=['POST'])
@jwt_required()
def register_complete():
    """
    Complete WebAuthn registration
    Verifies and stores the credential
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        # Get challenge from session
        expected_challenge = session.get('webauthn_challenge')
        if not expected_challenge:
            return jsonify({'error': 'Challenge לא נמצא'}), 400

        # Get credential from request
        credential = request.json

        # Verify registration response
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge.encode('utf-8'),
            expected_origin=RP_ORIGIN,
            expected_rp_id=RP_ID,
        )

        # Store credential in database
        new_credential = WebAuthnCredential(
            user_id=user.id,
            credential_id=verification.credential_id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            device_name=request.json.get('device_name', 'מכשיר לא ידוע'),
            transports=credential.get('response', {}).get('transports', []),
        )
        
        db.session.add(new_credential)
        db.session.commit()

        # Clear session
        session.pop('webauthn_challenge', None)
        session.pop('webauthn_user_id', None)

        return jsonify({
            'success': True,
            'message': 'כניסה ביומטרית הופעלה בהצלחה',
            'credential_id': verification.credential_id.hex(),
        })

    except Exception as e:
        print(f"WebAuthn registration complete error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/authenticate/begin', methods=['POST'])
def authenticate_begin():
    """
    Start WebAuthn authentication process
    Returns options for navigator.credentials.get()
    """
    try:
        data = request.json
        username = data.get('username')

        if not username:
            return jsonify({'error': 'שם משתמש נדרש'}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        # Get user's credentials
        credentials = WebAuthnCredential.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()

        if not credentials:
            return jsonify({'error': 'לא נמצאו מכשירים רשומים'}), 404

        # Create credential descriptors
        allow_credentials = [
            PublicKeyCredentialDescriptor(
                id=cred.credential_id,
                transports=cred.transports or []
            )
            for cred in credentials
        ]

        # Generate authentication options
        authentication_options = generate_authentication_options(
            rp_id=RP_ID,
            allow_credentials=allow_credentials,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        # Store challenge in session
        session['webauthn_challenge'] = authentication_options.challenge.decode('utf-8')
        session['webauthn_username'] = username

        return jsonify(options_to_json(authentication_options))

    except Exception as e:
        print(f"WebAuthn authentication begin error: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/authenticate/complete', methods=['POST'])
def authenticate_complete():
    """
    Complete WebAuthn authentication
    Verifies the assertion and logs in the user
    """
    try:
        # Get challenge from session
        expected_challenge = session.get('webauthn_challenge')
        username = session.get('webauthn_username')

        if not expected_challenge or not username:
            return jsonify({'error': 'Challenge או שם משתמש לא נמצאו'}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        # Get credential from request
        credential = request.json
        credential_id = bytes.fromhex(credential['id'])

        # Find the credential in database
        db_credential = WebAuthnCredential.query.filter_by(
            credential_id=credential_id,
            user_id=user.id,
            is_active=True
        ).first()

        if not db_credential:
            return jsonify({'error': 'מכשיר לא רשום'}), 404

        # Verify authentication response
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=expected_challenge.encode('utf-8'),
            expected_origin=RP_ORIGIN,
            expected_rp_id=RP_ID,
            credential_public_key=db_credential.public_key,
            credential_current_sign_count=db_credential.sign_count,
        )

        # Update sign count
        db_credential.sign_count = verification.new_sign_count
        db_credential.last_used_at = db.func.now()
        db.session.commit()

        # Clear session
        session.pop('webauthn_challenge', None)
        session.pop('webauthn_username', None)

        # Create JWT token (reuse existing login logic)
        from flask_jwt_extended import create_access_token, create_refresh_token
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'success': True,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        })

    except Exception as e:
        print(f"WebAuthn authentication complete error: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/credentials', methods=['GET'])
@jwt_required()
def get_credentials():
    """
    Get list of registered credentials for current user
    """
    try:
        user_id = get_jwt_identity()
        credentials = WebAuthnCredential.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()

        return jsonify({
            'credentials': [cred.to_dict() for cred in credentials]
        })

    except Exception as e:
        print(f"Get credentials error: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/credentials/<credential_id>', methods=['DELETE'])
@jwt_required()
def delete_credential(credential_id):
    """
    Delete a registered credential
    """
    try:
        user_id = get_jwt_identity()
        
        credential = WebAuthnCredential.query.filter_by(
            credential_id=bytes.fromhex(credential_id),
            user_id=user_id
        ).first()

        if not credential:
            return jsonify({'error': 'מכשיר לא נמצא'}), 404

        credential.is_active = False
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'המכשיר הוסר בהצלחה'
        })

    except Exception as e:
        print(f"Delete credential error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/credentials/<credential_id>/rename', methods=['PUT'])
@jwt_required()
def rename_credential(credential_id):
    """
    Rename a registered credential
    """
    try:
        user_id = get_jwt_identity()
        data = request.json
        new_name = data.get('device_name')

        if not new_name:
            return jsonify({'error': 'שם מכשיר נדרש'}), 400

        credential = WebAuthnCredential.query.filter_by(
            credential_id=bytes.fromhex(credential_id),
            user_id=user_id
        ).first()

        if not credential:
            return jsonify({'error': 'מכשיר לא נמצא'}), 404

        credential.device_name = new_name
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'שם המכשיר עודכן בהצלחה'
        })

    except Exception as e:
        print(f"Rename credential error: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
