from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.notification_model import NotificationModel
from app.models.employee_model import EmployeeModel
import json

notif_bp = Blueprint("notifications", __name__)


@notif_bp.route("/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
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

        # Get full user to get their notification settings and command scope
        user = EmployeeModel.get_employee_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        alerts = NotificationModel.get_alerts(user)
        return jsonify(alerts)
    except Exception as e:
        print(f"❌ Error in /notifications/alerts: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
