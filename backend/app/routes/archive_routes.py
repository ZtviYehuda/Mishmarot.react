from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.archive_model import ArchiveModel
from app.models.employee_model import EmployeeModel
from app.models.notification_model import NotificationModel
from app.models.audit_log_model import AuditLogModel

import json

archive_bp = Blueprint('archive', __name__)


def _get_identity():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw
    return identity["id"] if isinstance(identity, dict) else identity


def _find_approver(requester):
    """Find the relevant commander who should approve the request."""
    # The approver is one level above the requester
    if requester.get("commands_section_id"):
        # Section commander → dept commander approves
        dept_id = requester.get("department_id") or requester.get("commands_department_id")
        if dept_id:
            conn_info = EmployeeModel.get_department_commander(dept_id)
            if conn_info:
                return conn_info
    elif requester.get("commands_team_id"):
        # Team commander → section commander approves
        sec_id = requester.get("section_id") or requester.get("commands_section_id")
        if sec_id:
            conn_info = EmployeeModel.get_section_commander(sec_id)
            if conn_info:
                return conn_info
    elif not requester.get("commands_department_id"):
        # Regular employee → team commander approves
        team_id = requester.get("team_id")
        if team_id:
            conn_info = EmployeeModel.get_team_commander(team_id)
            if conn_info:
                return conn_info
    # Fallback: admin
    return EmployeeModel.get_admin()


@archive_bp.route('/restore-request', methods=['POST'])
@jwt_required()
def create_restore_request():
    user_id = _get_identity()
    requester = EmployeeModel.get_employee_by_id(user_id)
    if not requester:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    reason = data.get('reason')

    if not all([start_date, end_date, reason]):
        return jsonify({"error": "Missing required fields"}), 400

    request_id = ArchiveModel.create_restore_request(user_id, start_date, end_date, reason)
    if not request_id:
        return jsonify({"error": "Failed to create request"}), 500

    # Find approver and send notification
    approver = _find_approver(requester)
    requester_name = f"{requester.get('first_name', '')} {requester.get('last_name', '')}".strip()

    if approver and approver.get('id') != user_id:
        NotificationModel.send_message(
            sender_id=user_id,
            recipient_id=approver['id'],
            title=f"בקשת גישה לארכיון - {requester_name}",
            description=f"התקבלה בקשת גישה לנתוני ארכיון עבור התאריכים {start_date} עד {end_date}.\n"
                        f"סיבה: {reason}\n\n"
                        f"ניתן לאשר או לדחות את הבקשה בלוח הבקרה."
        )

    # Audit log
    AuditLogModel.log_action(
        user_id=user_id,
        action_type="ARCHIVE_REQUEST_CREATED",
        description=f"הגיש בקשת גישה לארכיון: {start_date} עד {end_date}",
        ip_address=request.remote_addr,
        metadata={"request_id": request_id, "start_date": start_date, "end_date": end_date, "reason": reason}
    )

    return jsonify({"message": "הבקשה נשלחה בהצלחה ומתנה לאישור", "id": request_id}), 201


@archive_bp.route('/requests/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    user_id = _get_identity()
    user = EmployeeModel.get_employee_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    requests = ArchiveModel.get_pending_requests(user)
    # Serialize dates
    for r in requests:
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
    return jsonify(requests), 200


@archive_bp.route('/requests/resolve/<int:request_id>', methods=['POST'])
@jwt_required()
def resolve_request(request_id):
    user_id = _get_identity()
    approver = EmployeeModel.get_employee_by_id(user_id)
    if not approver:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    status = data.get('status')  # approved, rejected
    rejection_reason = data.get('rejection_reason')

    if status not in ['approved', 'rejected']:
        return jsonify({"error": "Invalid status"}), 400

    success = ArchiveModel.resolve_request(request_id, user_id, status, rejection_reason)
    if not success:
        return jsonify({"error": "Failed to resolve request"}), 500

    # Get request details to notify requester
    req_details = ArchiveModel.get_request_by_id(request_id)
    approver_name = f"{approver.get('first_name', '')} {approver.get('last_name', '')}".strip()

    if req_details:
        requester_id = req_details.get('requester_id')
        start_date = req_details.get('start_date')
        end_date = req_details.get('end_date')

        if status == 'approved':
            title = "✅ בקשת הגישה לארכיון אושרה"
            body = (f"בקשתך לגישה לנתוני ארכיון ({start_date} עד {end_date}) "
                    f"אושרה על ידי {approver_name}.\n"
                    f"הגישה תקפה ל-24 שעות.")
        else:
            title = "❌ בקשת הגישה לארכיון נדחתה"
            body = (f"בקשתך לגישה לנתוני ארכיון ({start_date} עד {end_date}) "
                    f"נדחתה על ידי {approver_name}.")
            if rejection_reason:
                body += f"\nסיבת הדחייה: {rejection_reason}"

        NotificationModel.send_message(
            sender_id=user_id,
            recipient_id=requester_id,
            title=title,
            description=body
        )

    # Audit log
    action_type = "ARCHIVE_REQUEST_APPROVED" if status == "approved" else "ARCHIVE_REQUEST_REJECTED"
    AuditLogModel.log_action(
        user_id=user_id,
        action_type=action_type,
        description=f"{'אישר' if status == 'approved' else 'דחה'} בקשת גישה לארכיון #{request_id}",
        target_id=req_details.get('requester_id') if req_details else None,
        ip_address=request.remote_addr,
        metadata={
            "request_id": request_id,
            "status": status,
            "rejection_reason": rejection_reason
        }
    )

    msg = "הבקשה אושרה והמשתמש קיבל הודעה" if status == "approved" else "הבקשה נדחתה והמשתמש קיבל הודעה"
    return jsonify({"message": msg}), 200


@archive_bp.route('/my-requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    user_id = _get_identity()
    requests = ArchiveModel.get_requests_history(user_id)
    for r in requests:
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
    return jsonify(requests), 200


@archive_bp.route('/all-requests', methods=['GET'])
@jwt_required()
def get_all_requests():
    user_id = _get_identity()
    user = EmployeeModel.get_employee_by_id(user_id)
    if not user or not user.get('is_admin'):
        return jsonify({"error": "Unauthorized"}), 403

    requests = ArchiveModel.get_requests_history()
    for r in requests:
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
    return jsonify(requests), 200


@archive_bp.route('/check-access', methods=['GET'])
@jwt_required()
def check_access():
    """Check if user has approved access for a given date range."""
    user_id = _get_identity()
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"has_access": False}), 200
    has_access = ArchiveModel.check_access(user_id, date_str)
    return jsonify({"has_access": has_access}), 200
