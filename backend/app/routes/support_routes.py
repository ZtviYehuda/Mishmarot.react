from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.support_model import SupportModel
import hashlib
from datetime import datetime

support_bp = Blueprint('support', __name__)

@support_bp.route('/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    is_admin = user_identity.get('is_admin', False) if isinstance(user_identity, dict) else False
    
    data = request.get_json()
    if not data or not data.get('message'):
        return jsonify({"error": "Message is required"}), 400
        
    target_user_id = data.get('user_id') if (is_admin and data.get('user_id')) else user_id
        
    ticket_data = {
        "user_id": target_user_id,
        "full_name": data.get('full_name', 'System User'),
        "subject": data.get('subject', 'Chat Support'),
        "message": data.get('message'),
        "status": data.get('status', 'pending'),
        "context_page": data.get('context_page')
    }
    
    ticket_id = SupportModel.create_ticket(ticket_data)
    if ticket_id:
        return jsonify({"message": "Ticket created successfully", "id": ticket_id}), 201
    return jsonify({"error": "Failed to create ticket"}), 500

@support_bp.route('/tickets', methods=['GET'])
@jwt_required()
def get_all_tickets():
    # Only admins should see all tickets
    tickets = SupportModel.get_all_tickets()
    return jsonify(tickets), 200

@support_bp.route('/tickets/my', methods=['GET'])
@jwt_required()
def get_my_tickets():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    tickets = SupportModel.get_user_tickets(user_id)
    return jsonify(tickets), 200

@support_bp.route('/tickets/<int:ticket_id>/reply', methods=['PUT'])
@jwt_required()
def reply_to_ticket(ticket_id):
    data = request.get_json()
    admin_reply = data.get('admin_reply')
    status = data.get('status', 'closed') # Default to closed if not specified
    
    success = SupportModel.update_ticket_status(ticket_id, status, admin_reply)
    if success:
        return jsonify({"message": "Ticket updated successfully"}), 200
    return jsonify({"error": "Failed to update ticket"}), 500

@support_bp.route('/tickets/pending-count', methods=['GET'])
@jwt_required()
def get_pending_count():
    count = SupportModel.get_pending_count()
    return jsonify({"count": count}), 200

@support_bp.route('/tickets/<int:ticket_id>/approve', methods=['POST'])
@jwt_required()
def add_ticket_approval(ticket_id):
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    
    data = request.get_json()
    status = data.get('status', 'approved')
    comment = data.get('comment', '')
    approver_rank_level = data.get('approver_rank_level', 'commander')
    ip_address = request.remote_addr
    
    # Generate Digital Signature Hash
    signature_string = f"{ticket_id}-{user_id}-{status}-{datetime.utcnow().isoformat()}"
    digital_signature = hashlib.sha256(signature_string.encode()).hexdigest()
    
    # Save the approval
    success = SupportModel.add_approval(
        request_type='support_ticket',
        request_id=ticket_id,
        approver_id=user_id,
        approver_rank_level=approver_rank_level,
        status=status,
        comment=comment,
        ip_address=ip_address,
        digital_signature=digital_signature
    )
    
    if success:
        # Automatically update ticket status
        SupportModel.update_ticket_status(ticket_id, status)
        return jsonify({"message": "Approval signed successfully", "signature": digital_signature}), 200
    return jsonify({"error": "Failed to sign approval"}), 500

@support_bp.route('/tickets/read', methods=['POST'])
@jwt_required()
def mark_tickets_read():
    import json
    identity_raw = get_jwt_identity()
    try:
        user_identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
    except (json.JSONDecodeError, TypeError):
        user_identity = identity_raw

    user_id = user_identity.get('id') if isinstance(user_identity, dict) else user_identity
    SupportModel.mark_as_read(user_id)
    return jsonify({"message": "Marked as read"}), 200
