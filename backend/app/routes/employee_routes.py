from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.employee_model import EmployeeModel
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
            identity = json.loads(identity_str) if isinstance(identity_str, str) else identity_str
            user_id = identity.get("id") if isinstance(identity, dict) else identity
        except (json.JSONDecodeError, AttributeError):
            user_id = identity_str
        
        requester = EmployeeModel.get_employee_by_id(user_id)
        
        filters = {
            "search": request.args.get("search"),
            "dept_id": request.args.get("dept_id"),
            "include_inactive": request.args.get("include_inactive") == "true",
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
    identity_str = get_jwt_identity()
    identity = json.loads(identity_str)
    user_id = identity["id"]
    claims = identity
    
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
    for key in ["phone_number", "city", "birth_date", "enlistment_date", "discharge_date", "team_id", "role_id"]:
        if key in data and data[key] == "":
            data[key] = None
    
    try:
        new_id = EmployeeModel.create_employee(data)
        return (
            jsonify({"success": True, "id": new_id, "message": "העובד נוצר בהצלחה"}),
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
    identity_str = get_jwt_identity()
    identity = json.loads(identity_str)
    user_id = identity["id"]
    claims = identity
    
    current_user = EmployeeModel.get_employee_by_id(user_id)
    if not current_user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    is_admin = claims.get("is_admin", False)
    is_commander = claims.get("is_commander", False)
    if not (is_admin or is_commander):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    data = request.get_json()
    
    # Convert empty strings to None for optional fields to avoid DB errors (e.g. invalid date syntax)
    for key in ["phone_number", "city", "birth_date", "enlistment_date", "discharge_date", "assignment_date", "team_id", "section_id", "department_id", "role_id", "service_type_id", "emergency_contact"]:
        if key in data and data[key] == "":
            data[key] = None

    if EmployeeModel.update_employee(emp_id, data):
        return jsonify({"success": True, "message": "User updated"})
    return jsonify({"success": False, "error": "Update failed"}), 500


@emp_bp.route("/<int:emp_id>", methods=["DELETE"])
@jwt_required()
def delete_employee(emp_id):
    identity_str = get_jwt_identity()
    identity = json.loads(identity_str)
    user_id = identity["id"]
    claims = identity
    
    current_user = EmployeeModel.get_employee_by_id(user_id)
    if not current_user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    is_admin = claims.get("is_admin", False)
    if not is_admin:
        return jsonify({"success": False, "error": "Admins only"}), 403

    if EmployeeModel.delete_employee(emp_id):
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
    employees = EmployeeModel.get_all_employees(request.args)
    df = pd.DataFrame(employees)

    columns = {
        "first_name": "שם פרטי",
        "last_name": "שם משפחה",
        "personal_number": "מספר אישי",
        "status_name": "סטטוס",
        "team_name": "צוות",
        "section_name": "מדור",
        "department_name": "מחלקה",
    }

    # Keep only relevant columns if they exist in DB response
    valid_cols = [c for c in columns.keys() if c in df.columns]
    df = df[valid_cols].rename(columns=columns)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Employees")

    output.seek(0)
    return send_file(
        output,
        download_name="report.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


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
