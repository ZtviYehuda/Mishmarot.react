from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.attendance_model import AttendanceModel
import json

att_bp = Blueprint("attendance", __name__)


@att_bp.route("/", methods=["OPTIONS"])
def options_root():
    return {}, 200


@att_bp.route("/status-types", methods=["OPTIONS"])
def options_status_types():
    return {}, 200


@att_bp.route("/stats", methods=["OPTIONS"])
def options_stats():
    return {}, 200


@att_bp.route("/status-types", methods=["GET"])
@jwt_required()
def get_status_types():
    try:
        types = AttendanceModel.get_status_types()
        return jsonify(types)
    except Exception as e:
        print(f"❌ Error in /status-types: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@att_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    try:
        identity_str = get_jwt_identity()
        print(f"[DEBUG] identity_str: {identity_str}, type: {type(identity_str)}")

        # Try to parse as JSON
        try:
            identity = (
                json.loads(identity_str)
                if isinstance(identity_str, str)
                else identity_str
            )
            user_id = identity.get("id") if isinstance(identity, dict) else identity
        except (json.JSONDecodeError, AttributeError):
            # If not JSON, treat as plain ID
            user_id = identity_str

        print(f"[DEBUG] user_id: {user_id}")

        from app.models.employee_model import EmployeeModel

        requester = EmployeeModel.get_employee_by_id(user_id)

        # Parse filters for drill-down
        # Parse filters for drill-down
        filters = {}
        if request.args.get("department_id"):
            filters["department_id"] = int(request.args.get("department_id"))
        if request.args.get("section_id"):
            filters["section_id"] = int(request.args.get("section_id"))
        if request.args.get("team_id"):
            filters["team_id"] = int(request.args.get("team_id"))
        if request.args.get("status_id"):
            filters["status_id"] = int(request.args.get("status_id"))

        print(f"[DEBUG] get_stats filters: {filters}")

        stats = AttendanceModel.get_dashboard_stats(
            requesting_user=requester, filters=filters
        )
        birthdays = AttendanceModel.get_birthdays(requesting_user=requester)
        return jsonify({"stats": stats, "birthdays": birthdays})
    except Exception as e:
        print(f"❌ Error in /stats: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@att_bp.route("/log", methods=["POST"])
@jwt_required()
def log_status():
    data = request.get_json()
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    current_user_id = identity["id"] if isinstance(identity, dict) else identity

    target_id = data.get("employee_id")
    if not target_id:
        target_id = current_user_id

    status_id = data.get("status_type_id")
    note = data.get("note")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if not status_id:
        return jsonify({"error": "Missing status_type_id"}), 400

    success = AttendanceModel.log_status(
        employee_id=target_id,
        status_type_id=status_id,
        note=note,
        reported_by=current_user_id,
        start_date=start_date,
        end_date=end_date,
    )

    if success:
        return jsonify({"success": True, "message": "הסטטוס עודכן"})
    return jsonify({"success": False, "error": "Failed to log status"}), 500


@att_bp.route("/bulk-log", methods=["POST"])
@jwt_required()
def bulk_log_status():
    data = request.get_json()
    updates = data.get("updates", [])
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    current_user_id = identity["id"] if isinstance(identity, dict) else identity

    if not updates:
        return jsonify({"error": "No updates provided"}), 400

    success = AttendanceModel.log_bulk_status(updates, reported_by=current_user_id)

    if success:
        return jsonify({"success": True, "message": "כלל הסטטוסים עודכנו"})
    return jsonify({"success": False, "error": "Failed to bulk log status"}), 500


@att_bp.route("/calendar", methods=["GET"])
@jwt_required()
def get_calendar_stats():
    try:
        year = int(request.args.get("year"))
        month = int(request.args.get("month"))
        summary = AttendanceModel.get_monthly_summary(year, month)
        return jsonify(summary)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid year/month parameters"}), 400
