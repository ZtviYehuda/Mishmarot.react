from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.employee_model import EmployeeModel
from app.models.audit_log_model import AuditLogModel
import pandas as pd
import io
import json

emp_bp = Blueprint("employees", __name__)


@emp_bp.route("/", methods=["OPTIONS"])
def options_root():
    return {}, 200


@emp_bp.route("/<int:emp_id>", methods=["OPTIONS"])
def options_emp_id(emp_id):
    return {}, 200


@emp_bp.route("/", methods=["GET"])
@jwt_required()
def get_employees():
    try:
        identity_str = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_str)
                if isinstance(identity_str, str)
                else identity_str
            )
            user_id = identity.get("id") if isinstance(identity, dict) else identity
        except (json.JSONDecodeError, AttributeError):
            user_id = identity_str

        requester = EmployeeModel.get_employee_by_id(user_id)

        filters = {
            "search": request.args.get("search"),
            "dept_id": request.args.get("dept_id"),
            "status_id": request.args.get("status_id"),
            "include_inactive": request.args.get("include_inactive") == "true",
            "date": request.args.get("date"),
        }

        employees = EmployeeModel.get_all_employees(filters, requesting_user=requester)
        return jsonify(employees)
    except Exception as e:
        print(f"❌ Error in GET /employees: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@emp_bp.route("/<int:emp_id>", methods=["GET"])
@jwt_required()
def get_employee(emp_id):
    employee = EmployeeModel.get_employee_by_id(emp_id)
    if employee:
        return jsonify(employee)
    return jsonify({"error": "Not found"}), 404


@emp_bp.route("/", methods=["POST"])
@jwt_required()
def create_employee():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    claims = identity if isinstance(identity, dict) else {}

    current_user = EmployeeModel.get_employee_by_id(user_id)
    if not current_user:
        return jsonify({"success": False, "error": "User not found"}), 404

    is_admin = claims.get("is_admin", False)
    is_commander = claims.get("is_commander", False)
    if not (is_admin or is_commander):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    # Convert empty strings to None for optional fields
    for key in [
        "phone_number",
        "city",
        "birth_date",
        "enlistment_date",
        "discharge_date",
        "team_id",
        "role_id",
    ]:
        if key in data and data[key] == "":
            data[key] = None

    try:
        new_id = EmployeeModel.create_employee(data)

        # Log Creation
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="EMPLOYEE_CREATE",
            description=f"Created new employee: {data.get('first_name')} {data.get('last_name')} (P-Num: {data.get('personal_number')})",
            target_id=new_id,
            ip_address=request.remote_addr,
            metadata=data,
        )

        return (
            jsonify({"success": True, "id": new_id, "message": "השוטר נוצר בהצלחה"}),
            201,
        )
    except Exception as e:
        import traceback

        print(f"Error creating employee: {e}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500


@emp_bp.route("/<int:emp_id>", methods=["PUT"])
@jwt_required()
def update_employee(emp_id):
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
        claims = identity if isinstance(identity, dict) else {}

        current_user = EmployeeModel.get_employee_by_id(user_id)
        if not current_user:
            return jsonify({"success": False, "error": "User not found"}), 404

        is_admin = claims.get("is_admin", False)
        is_commander = claims.get("is_commander", False)
        if not (is_admin or is_commander):
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data received"}), 400

        # Safe print for debugging to avoid encoding issues
        try:
            print(f"DEBUG: update_employee id={emp_id} data keys: {list(data.keys())}")
        except:
            print(f"DEBUG: update_employee id={emp_id} (could not print data keys)")

        # Convert empty strings to None for optional fields to avoid DB errors (e.g. invalid date syntax)
        for key in [
            "phone_number",
            "city",
            "birth_date",
            "enlistment_date",
            "discharge_date",
            "assignment_date",
            "team_id",
            "section_id",
            "department_id",
            "role_id",
            "service_type_id",
            "emergency_contact",
        ]:
            if key in data and data[key] == "":
                data[key] = None

        if EmployeeModel.update_employee(emp_id, data):
            # Log Update
            try:
                AuditLogModel.log_action(
                    user_id=user_id,
                    action_type="EMPLOYEE_UPDATE",
                    description=f"Updated employee details for ID {emp_id}",
                    target_id=emp_id,
                    ip_address=request.remote_addr,
                    metadata=data,
                )
            except Exception as log_err:
                print(f"⚠️ Audit logging failed: {log_err}")

            return jsonify({"success": True, "message": "User updated"})
        return jsonify({"success": False, "error": "Update failed in database"}), 500

    except Exception as e:
        import traceback

        print(f"❌ CRITICAL ERROR in update_employee: {e}")
        traceback.print_exc()
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Internal Server Error",
                    "detail": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


@emp_bp.route("/<int:emp_id>", methods=["DELETE"])
@jwt_required()
def delete_employee(emp_id):
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    claims = identity if isinstance(identity, dict) else {}

    current_user = EmployeeModel.get_employee_by_id(user_id)
    if not current_user:
        return jsonify({"success": False, "error": "User not found"}), 404

    is_admin = claims.get("is_admin", False)
    if not is_admin:
        return jsonify({"success": False, "error": "Admins only"}), 403

    if EmployeeModel.delete_employee(emp_id):
        # Log Deletion
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="EMPLOYEE_DELETE",
            description=f"Deleted employee with ID {emp_id}",
            target_id=emp_id,
            ip_address=request.remote_addr,
        )
        return jsonify({"success": True, "message": "User deleted"})
    return jsonify({"success": False, "error": "Delete failed"}), 500


@emp_bp.route("/structure", methods=["GET"])
@jwt_required()
def get_structure():
    tree = EmployeeModel.get_structure_tree()
    return jsonify(tree)


@emp_bp.route("/export", methods=["GET"])
@jwt_required()
def export_excel():
    from app.models.attendance_model import AttendanceModel
    from datetime import datetime, timedelta

    identity_str = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_str) if isinstance(identity_str, str) else identity_str
        )
        user_id = identity.get("id") if isinstance(identity, dict) else identity
    except (json.JSONDecodeError, AttributeError):
        user_id = identity_str

    requester = EmployeeModel.get_employee_by_id(user_id)

    # Check if this is a range request
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    if start_date_str and end_date_str:
        # --- RANGE MATRIX REPORT ---

        # 1. Get List of Employees (Row Headers)
        # We clean args to avoid 'start_date'/'end_date' messing up standard filtering if not supported
        # But get_all_employees is safe as we fixed it.
        params = dict(request.args)
        employees = EmployeeModel.get_all_employees(params, requesting_user=requester)

        if not employees:
            return jsonify({"error": "No employees found"}), 404

        emp_map = {
            e["id"]: f"{e['first_name']} {e['last_name']} ({e['personal_number']})"
            for e in employees
        }
        emp_ids = list(emp_map.keys())

        # 2. Get Logs for these employees in range
        logs = AttendanceModel.get_logs_for_employees(
            emp_ids, start_date_str, end_date_str
        )

        # 3. Build Matrix
        # Create Date Range
        start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        delta = (end - start).days + 1
        date_list = [start + timedelta(days=i) for i in range(delta)]
        date_strs = [d.strftime("%Y-%m-%d") for d in date_list]
        date_headers = [d.strftime("%d/%m") for d in date_list]

        # Initialize data structure: { emp_id: { date_str: status } }
        matrix_data = {eid: {d: "-" for d in date_strs} for eid in emp_ids}

        # Populate with logs
        # This approach assumes one status per day (the latest one active on that day)
        # Since logs are intervals, we check overlap for each day.
        # Optimization: Logs are ordered by start_time.
        # For each log, mark the days it covers.
        for log in logs:
            eid = log["employee_id"]
            if eid not in matrix_data:
                continue

            s_name = log["status_name"]
            l_start = log["start_datetime"].date()
            l_end = (
                log["end_datetime"].date() if log["end_datetime"] else end
            )  # If active, goes till end of report

            # Clip to report range
            overlap_start = max(start, l_start)
            overlap_end = min(end, l_end)

            if overlap_start <= overlap_end:
                curr = overlap_start
                while curr <= overlap_end:
                    d_str = curr.strftime("%Y-%m-%d")
                    matrix_data[eid][d_str] = s_name
                    curr += timedelta(days=1)

        # 4. Convert to DataFrame
        # Rows: Employees
        # Cols: Dates
        rows = []
        for emp in employees:
            eid = emp["id"]
            row = {
                "שם מלא (פרטי ומשפחה)": f"{emp['first_name']} {emp['last_name']}",
                "מספר אישי": emp["personal_number"],
                "מחלקה": emp["department_name"] or "-",
                "מדור": emp["section_name"] or "-",
                "חולייה": emp["team_name"] or "-",
            }
            # Add dates
            for i, d_str in enumerate(date_strs):
                row[date_headers[i]] = matrix_data[eid][d_str]
            rows.append(row)

        df = pd.DataFrame(rows)

        report_title = f"דו\"ח ריכוז נוכחות - {start.strftime('%d/%m/%Y')} עד {end.strftime('%d/%m/%Y')}"

    else:
        # --- STANDARD SNAPSHOT REPORT ---
        filters = dict(request.args)
        employees = EmployeeModel.get_all_employees(filters, requesting_user=requester)
        df = pd.DataFrame(employees)

        columns = {
            "first_name": "שם פרטי",
            "last_name": "שם משפחה",
            "personal_number": "מספר אישי",
            "status_name": "סטטוס",
            "team_name": "חוליה",
            "section_name": "מדור",
            "department_name": "מחלקה",
        }

        # Keep only relevant columns if they exist in DB response
        valid_cols = [c for c in columns.keys() if c in df.columns]
        df = df[valid_cols].rename(columns=columns)

        # Determine Report Title
        report_title = 'דו"ח מצבת כוח אדם'
        if request.args.get("date"):
            report_title += f" - נכון ליום {request.args.get('date')}"
        else:
            report_title += " - נכון להיום"

    # Export to Excel (Shared Logic)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        workbook = writer.book
        worksheet = workbook.create_sheet("Report")
        writer.sheets["Report"] = worksheet

        # Add Title Cell
        worksheet.merge_cells("A1:G1")
        cell = worksheet["A1"]
        cell.value = report_title

        # Set RTL Direction
        worksheet.sheet_view.rightToLeft = True

        # Write DataFrame
        df.to_excel(writer, index=False, sheet_name="Report", startrow=2)

    output.seek(0)
    return send_file(
        output,
        download_name="report.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@emp_bp.route("/roles", methods=["GET"])
@jwt_required()
def get_roles():
    """Get all roles for dropdown"""
    try:
        roles = EmployeeModel.get_roles()
        return jsonify(roles)
    except Exception as e:
        print(f"Error fetching roles: {e}")
        return jsonify({"error": str(e)}), 500


@emp_bp.route("/service-types", methods=["GET"])
@jwt_required()
def get_service_types():
    """Get all service types for dropdown"""
    try:
        from app.utils.db import get_db_connection
        from psycopg2.extras import RealDictCursor

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, name FROM service_types ORDER BY name")
            service_types = cur.fetchall()
            return jsonify(service_types)
        finally:
            conn.close()
    except Exception as e:
        print(f"Error fetching service types: {e}")
        return jsonify({"error": str(e)}), 500


@emp_bp.route("/<int:emp_id>/birthday-sent", methods=["POST"])
@jwt_required()
def mark_birthday_sent_route(emp_id):
    """Mark that a birthday message was sent to this employee"""
    try:
        # Check permissions? Any commander can send?
        # A simple check: if the user can send, they must be authorized (frontend hides button).
        # We rely on JWT required.
        if EmployeeModel.mark_birthday_message_sent(emp_id):
            return jsonify({"success": True})
        return jsonify({"success": False, "error": "Database update failed"}), 500
    except Exception as e:
        print(f"Error marking birthday sent: {e}")
        return jsonify({"error": str(e)}), 500


@emp_bp.route("/delegation-candidates", methods=["GET"])
@jwt_required()
def get_delegation_candidates():
    """Get candidate employees for delegation (team members of current commander)"""
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity

    candidates = EmployeeModel.get_team_members_for_commander(user_id)
    return jsonify(candidates)


@emp_bp.route("/delegation/cancel", methods=["POST"])
@jwt_required()
def cancel_delegation():
    """Cancel a delegation (either by specific ID or current commander's active one)"""
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    is_admin = identity.get("is_admin", False) if isinstance(identity, dict) else False

    data = request.get_json() or {}
    delegation_id = data.get("delegation_id")

    # If they passed a specific delegation_id, check if they are admin OR the commander of that delegation
    # For now, we'll let the model handle the logic or just assume current user's delegation if none provided
    success, msg = EmployeeModel.cancel_delegation(
        commander_id=user_id if not is_admin else None, delegation_id=delegation_id
    )

    if success:
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="DELEGATION_CANCEL",
            description=f"Cancelled delegation (ID: {delegation_id or 'active current'})",
            ip_address=request.remote_addr,
            metadata={"delegation_id": delegation_id},
        )
        return jsonify({"success": True, "message": "הפיקוד הזמני הוסר בהצלחה"})
    return jsonify({"success": False, "error": msg}), 500


@emp_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    theme = data.get("theme")
    accent_color = data.get("accent_color")
    font_size = data.get("font_size")

    if EmployeeModel.update_preferences(user_id, theme, accent_color, font_size):
        return jsonify({"success": True, "message": "Preferences updated"})
    return jsonify({"success": False, "error": "Update failed"}), 500
