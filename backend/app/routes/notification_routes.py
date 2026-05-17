from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.notification_model import NotificationModel
from app.models.employee_model import EmployeeModel
import json
from datetime import datetime

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
        print(f"DEBUG: get_alerts called for user_id: {user_id}")

        # Get full user to get their notification settings and command scope
        user = EmployeeModel.get_employee_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Get all alerts
        all_alerts = NotificationModel.get_alerts(user) or []

        # Get notifications this user has already read
        read_notifications = NotificationModel.get_read_notifications(user_id) or []

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
        print(f"[ERROR] Error in /notifications/alerts: {e}")
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
        print(f"[ERROR] Error fetching notification history: {e}")
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
        print(f"[ERROR] Error marking notification as read: {e}")
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
        print(f"[ERROR] Error marking all notifications as read: {e}")
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
        print(f"[ERROR] Error marking notification as unread: {e}")
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
        recipient_ids = data.get("recipient_ids")
        title = data.get("title")
        description = data.get("description", "")

        if not recipient_ids and recipient_id:
            recipient_ids = [recipient_id]

        if not recipient_ids or not title:
            return jsonify({"error": "Missing recipients or title"}), 400

        success = True
        for r_id in recipient_ids:
            if not NotificationModel.send_message(sender_id, r_id, title, description):
                success = False

        if success:
            return jsonify({"success": True, "message": "Message(s) sent successfully"})
        else:
            return jsonify({"success": False, "error": "Failed to send some or all messages"}), 500

    except Exception as e:
        print(f"[ERROR] Error sending message: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@notif_bp.route("/messages", methods=["GET"])
@jwt_required()
def get_user_messages():
    """Get all sent and received internal messages for the current user"""
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

        from app.utils.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500
            
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Get received messages
            cur.execute("""
                SELECT um.id, um.title, um.description, um.created_at, 
                       s.first_name as other_first, s.last_name as other_last,
                       um.sender_id as other_id, 'received' as direction
                FROM user_messages um
                LEFT JOIN employees s ON um.sender_id = s.id
                WHERE um.recipient_id = %s
                ORDER BY um.created_at DESC
            """, (user_id,))
            received = cur.fetchall()
            
            # Get sent messages
            cur.execute("""
                SELECT um.id, um.title, um.description, um.created_at, 
                       r.first_name as other_first, r.last_name as other_last,
                       um.recipient_id as other_id, 'sent' as direction
                FROM user_messages um
                LEFT JOIN employees r ON um.recipient_id = r.id
                WHERE um.sender_id = %s
                ORDER BY um.created_at DESC
            """, (user_id,))
            sent = cur.fetchall()
            
            messages = []
            for m in list(received) + list(sent):
                m_dict = dict(m)
                if m_dict['created_at']:
                    m_dict['created_at'] = m_dict['created_at'].isoformat()
                messages.append(m_dict)
                
            # Sort all messages by date
            messages.sort(key=lambda x: x['created_at'], reverse=True)
            
            return jsonify(messages)
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error getting messages: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@notif_bp.route("/messages/conversation/<int:other_id>", methods=["GET"])
@jwt_required()
def get_conversation(other_id):
    """Get full conversation between current user and another user"""
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

        from app.utils.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500
            
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT um.id, um.title, um.description, um.created_at, 
                       s.first_name as sender_first, s.last_name as sender_last,
                       um.sender_id, um.recipient_id
                FROM user_messages um
                LEFT JOIN employees s ON um.sender_id = s.id
                WHERE ((um.sender_id = %s AND um.recipient_id = %s AND um.is_deleted_by_sender = FALSE)
                   OR (um.sender_id = %s AND um.recipient_id = %s AND um.is_deleted_by_recipient = FALSE))
                ORDER BY um.created_at ASC
            """, (user_id, other_id, other_id, user_id))
            messages = cur.fetchall()
            
            result = []
            for m in messages:
                m_dict = dict(m)
                if m_dict['created_at']:
                    m_dict['created_at'] = m_dict['created_at'].isoformat()
                result.append(m_dict)
                
            return jsonify(result)
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error getting conversation: {e}")
        return jsonify({"error": str(e)}), 500

@notif_bp.route("/messages/conversation/<int:other_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(other_id):
    """Delete all messages between current user and another user"""
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

        from app.utils.db import get_db_connection
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500
            
        try:
            cur = conn.cursor()
            # Mark messages sent by user to other as deleted by sender
            cur.execute("""
                UPDATE user_messages 
                SET is_deleted_by_sender = TRUE
                WHERE sender_id = %s AND recipient_id = %s
            """, (user_id, other_id))
            
            # Mark messages received by user from other as deleted by recipient
            cur.execute("""
                UPDATE user_messages 
                SET is_deleted_by_recipient = TRUE
                WHERE sender_id = %s AND recipient_id = %s
            """, (other_id, user_id))
            
            conn.commit()
            return jsonify({"success": True, "message": "Conversation cleared (soft delete)"})
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error deleting conversation: {e}")
        return jsonify({"error": str(e)}), 500

@notif_bp.route("/messages/conversation/<int:user1_id>/<int:user2_id>/export", methods=["GET"])
@jwt_required()
def export_conversation(user1_id, user2_id):
    """Export all messages between two users (Admin only backup)"""
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

        # Check if admin
        if not identity.get("is_admin"):
            return jsonify({"error": "Admin access required"}), 403

        from app.utils.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500
            
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT um.*, 
                       s.first_name as sender_first, s.last_name as sender_last,
                       r.first_name as recipient_first, r.last_name as recipient_last
                FROM user_messages um
                LEFT JOIN employees s ON um.sender_id = s.id
                LEFT JOIN employees r ON um.recipient_id = r.id
                WHERE (um.sender_id = %s AND um.recipient_id = %s)
                   OR (um.sender_id = %s AND um.recipient_id = %s)
                ORDER BY um.created_at ASC
            """, (user1_id, user2_id, user2_id, user1_id))
            messages = cur.fetchall()
            
            result = []
            for m in messages:
                m_dict = dict(m)
                if m_dict['created_at']:
                    m_dict['created_at'] = m_dict['created_at'].isoformat()
                result.append(m_dict)
                
            return jsonify({
                "user1_id": user1_id,
                "user2_id": user2_id,
                "exported_at": datetime.now().isoformat(),
                "messages": result
            })
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error exporting conversation: {e}")
        return jsonify({"error": str(e)}), 500


@notif_bp.route("/messages/admin/all-conversations", methods=["GET"])
@jwt_required()
def admin_get_all_conversations():
    """Get all conversation pairs with message counts (Admin only)"""
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

        if not identity.get("is_admin"):
            return jsonify({"error": "Admin access required"}), 403

        from app.utils.db import get_db_connection
        from psycopg2.extras import RealDictCursor
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500

        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT 
                    LEAST(sender_id, recipient_id) as user1_id,
                    GREATEST(sender_id, recipient_id) as user2_id,
                    COUNT(*) as total_messages,
                    MAX(created_at) as last_message_at,
                    MIN(created_at) as first_message_at
                FROM user_messages
                GROUP BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id)
                ORDER BY last_message_at DESC
            """)
            pairs = cur.fetchall()

            result = []
            for pair in pairs:
                p = dict(pair)

                # Get user names
                cur.execute(
                    "SELECT id, first_name, last_name FROM employees WHERE id IN (%s, %s)",
                    (p["user1_id"], p["user2_id"])
                )
                users = {row["id"]: row for row in cur.fetchall()}

                u1 = users.get(p["user1_id"], {})
                u2 = users.get(p["user2_id"], {})

                result.append({
                    "user1_id": p["user1_id"],
                    "user1_name": f"{u1.get('first_name','')} {u1.get('last_name','')}".strip(),
                    "user2_id": p["user2_id"],
                    "user2_name": f"{u2.get('first_name','')} {u2.get('last_name','')}".strip(),
                    "total_messages": p["total_messages"],
                    "last_message_at": p["last_message_at"].isoformat() if p["last_message_at"] else None,
                    "first_message_at": p["first_message_at"].isoformat() if p["first_message_at"] else None,
                })

            return jsonify(result)
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error getting all conversations: {e}")
        return jsonify({"error": str(e)}), 500
