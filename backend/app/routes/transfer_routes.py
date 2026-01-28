from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.transfer_model import TransferModel
import json

transfer_bp = Blueprint("transfers", __name__)


@transfer_bp.route("/", methods=["OPTIONS"])
def options_root():
    return {}, 200


@transfer_bp.route("/pending", methods=["OPTIONS"])
def options_pending():
    return {}, 200


@transfer_bp.route("/", methods=["POST"])
@jwt_required()
def create_transfer():
    data = request.get_json()
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw
    user_id = identity["id"] if isinstance(identity, dict) else identity

    required = ["employee_id", "target_type", "target_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    try:
        new_id = TransferModel.create_request(data, user_id)
        return jsonify({"success": True, "id": new_id, "message": "הבקשה נשלחה"}), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 409
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@transfer_bp.route("/pending", methods=["GET"])
@jwt_required()
def get_pending():
    requests = TransferModel.get_pending_requests()
    return jsonify(requests)


@transfer_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    history = TransferModel.get_history()
    return jsonify(history)


@transfer_bp.route("/<int:req_id>/approve", methods=["POST"])
@jwt_required()
def approve(req_id):
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw
    user_id = identity["id"] if isinstance(identity, dict) else identity

    if TransferModel.approve_request(req_id, user_id):
        return jsonify({"success": True, "message": "הבקשה אושרה"})
    return jsonify({"success": False, "error": "Failed to approve"}), 500


@transfer_bp.route("/<int:req_id>/reject", methods=["POST"])
@jwt_required()
def reject(req_id):
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw
    user_id = identity["id"] if isinstance(identity, dict) else identity

    data = request.get_json() or {}
    reason = data.get("reason", "")

    if TransferModel.reject_request(req_id, user_id, reason):
        return jsonify({"success": True, "message": "הבקשה נדחתה"})
    return jsonify({"success": False, "error": "Failed to reject"}), 500


@transfer_bp.route("/<int:req_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_transfer(req_id):
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    is_admin = identity.get("is_admin", False) if isinstance(identity, dict) else False

    if TransferModel.cancel_request(req_id, user_id, is_admin):
        return jsonify({"success": True, "message": "Cancelled"})
    return jsonify({"success": False, "error": "Failed or Unauthorized"}), 400
