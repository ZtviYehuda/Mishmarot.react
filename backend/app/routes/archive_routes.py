from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.archive_model import ArchiveModel
from app.models.employee_model import EmployeeModel

import json

archive_bp = Blueprint('archive', __name__)

@archive_bp.route('/restore-request', methods=['POST'])
@jwt_required()
def create_restore_request():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    data = request.get_json()
    
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason')
    
    if not all([start_date, end_date, reason]):
        return jsonify({"error": "Missing required fields"}), 400
        
    request_id = ArchiveModel.create_restore_request(user_id, start_date, end_date, reason)
    if request_id:
        return jsonify({"message": "Request created successfully", "id": request_id}), 201
    return jsonify({"error": "Failed to create request"}), 500

@archive_bp.route('/requests/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    user = EmployeeModel.get_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    requests = ArchiveModel.get_pending_requests(user)
    return jsonify(requests), 200

@archive_bp.route('/requests/resolve/<int:request_id>', methods=['POST'])
@jwt_required()
def resolve_request(request_id):
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    data = request.get_json()
    
    status = data.get('status') # approved, rejected
    rejection_reason = data.get('rejection_reason')
    
    if status not in ['approved', 'rejected']:
        return jsonify({"error": "Invalid status"}), 400
        
    success = ArchiveModel.resolve_request(request_id, user_id, status, rejection_reason)
    if success:
        return jsonify({"message": f"Request {status} successfully"}), 200
    return jsonify({"error": "Failed to resolve request"}), 500

@archive_bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    requests = ArchiveModel.get_requests_history(user_id)
    return jsonify(requests), 200

@archive_bp.route('/all-requests', methods=['GET'])
@jwt_required()
def get_all_requests():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    user = EmployeeModel.get_by_id(user_id)
    if not user or not user.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403
        
    requests = ArchiveModel.get_requests_history()
    return jsonify(requests), 200
