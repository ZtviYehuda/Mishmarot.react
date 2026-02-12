from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.audit_log_model import AuditLogModel
import json

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("/my-activity", methods=["GET"])
@jwt_required()
def get_my_activity():
    """
    Get recent activity for the current logged-in user.
    """
    try:
        identity_raw = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_raw)
                if isinstance(identity_raw, str)
                else identity_raw
            )
        except (json.JSONDecodeError, TypeError):
            identity = identity_raw

        user_id = identity["id"] if isinstance(identity, dict) else identity

        logs = AuditLogModel.get_user_activity(user_id, limit=20)
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@audit_bp.route("/all-activity", methods=["GET"])
@jwt_required()
def get_all_activity():
    """
    Get recent system-wide activity (Admin/Commander only).
    """
    try:
        identity_raw = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_raw)
                if isinstance(identity_raw, str)
                else identity_raw
            )
        except (json.JSONDecodeError, TypeError):
            identity = identity_raw

        is_admin = (
            identity.get("is_admin", False) if isinstance(identity, dict) else False
        )
        is_commander = (
            identity.get("is_commander", False) if isinstance(identity, dict) else False
        )

        if not (is_admin or is_commander):
            return jsonify({"error": "Unauthorized"}), 403

        from flask import request

        filters = {
            "user_id": request.args.get("user_id"),
            "action_type": request.args.get("action_type"),
        }

        limit = request.args.get("limit", 100, type=int)

        logs = AuditLogModel.get_recent_activity(limit=limit, filters=filters)
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@audit_bp.route("/suspicious", methods=["GET"])
@jwt_required()
def get_suspicious_activity():
    """
    Get detected anomalies for admin review.
    """
    try:
        identity_raw = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_raw)
                if isinstance(identity_raw, str)
                else identity_raw
            )
        except (json.JSONDecodeError, TypeError):
            identity = identity_raw

        if not identity.get("is_admin", False):
            return jsonify({"error": "Unauthorized: Admins only"}), 403

        suspicious = AuditLogModel.get_suspicious_activity()
        return jsonify(suspicious)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
