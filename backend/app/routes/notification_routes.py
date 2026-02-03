from flask import Blueprint, jsonify, request
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

        # Get all alerts
        all_alerts = NotificationModel.get_alerts(user)

        # Get notifications this user has already read
        read_notifications = NotificationModel.get_read_notifications(user_id)

        print(
            f"DEBUG: User {user_id} - All Alerts IDs: {[a['id'] for a in all_alerts]}"
        )
        print(f"DEBUG: User {user_id} - Read IDs: {read_notifications}")

        # Filter out read notifications (ensure string comparison)
        unread_alerts = [
            alert for alert in all_alerts if str(alert["id"]) not in read_notifications
        ]

        return jsonify(unread_alerts)
    except Exception as e:
        print(f"❌ Error in /notifications/alerts: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/alerts/history", methods=["GET"])
@jwt_required()
def get_alerts_history():
    """Get all notifications the user has read (history)"""
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

        history = NotificationModel.get_read_history(user_id)
        return jsonify(history)

    except Exception as e:
        print(f"❌ Error fetching notification history: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/alerts/<notification_id>/read", methods=["POST"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a specific notification as read for the current user"""
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

        # Get notification details from request body (snapshot)
        data = request.json or {}
        title = data.get("title", "התראה")
        description = data.get("description", "")
        alert_type = data.get("type", "info")
        link = data.get("link", "")

        success = NotificationModel.mark_as_read(
            user_id,
            notification_id,
            title=title,
            description=description,
            type=alert_type,
            link=link,
        )

        if success:
            return jsonify({"success": True, "message": "Notification marked as read"})
        else:
            return jsonify({"success": False, "error": "Failed to mark as read"}), 500

    except Exception as e:
        print(f"❌ Error marking notification as read: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/alerts/read-all", methods=["POST"])
@jwt_required()
def mark_all_notifications_read():
    """Mark all provided notifications as read for the current user"""
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

        notifications = request.json or []
        if not notifications:
            return jsonify({"success": True, "message": "No notifications to mark"})

        success = NotificationModel.mark_all_as_read(user_id, notifications)

        if success:
            return jsonify(
                {"success": True, "message": "All notifications marked as read"}
            )
        else:
            return (
                jsonify(
                    {"success": False, "error": "Failed to mark notifications as read"}
                ),
                500,
            )

    except Exception as e:
        print(f"❌ Error marking all notifications as read: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/alerts/<notification_id>/read", methods=["DELETE"])
@jwt_required()
def mark_notification_unread(notification_id):
    """Mark a specific notification as unread (remove from history) for the current user"""
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

        success = NotificationModel.mark_as_unread(user_id, notification_id)

        if success:
            return jsonify(
                {"success": True, "message": "Notification marked as unread"}
            )
        else:
            return jsonify({"success": False, "error": "Failed to mark as unread"}), 500

    except Exception as e:
        print(f"❌ Error marking notification as unread: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/send", methods=["POST"])
@jwt_required()
def send_internal_message():
    """Send an internal message to another user"""
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

        sender_id = identity["id"] if isinstance(identity, dict) else identity

        data = request.json or {}
        recipient_id = data.get("recipient_id")
        title = data.get("title")
        description = data.get("description", "")

        if not recipient_id or not title:
            return jsonify({"error": "Missing recipient_id or title"}), 400

        success = NotificationModel.send_message(
            sender_id, recipient_id, title, description
        )

        if success:
            return jsonify({"success": True, "message": "Message sent successfully"})
        else:
            return jsonify({"success": False, "error": "Failed to send message"}), 500

    except Exception as e:
        print(f"❌ Error sending message: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
