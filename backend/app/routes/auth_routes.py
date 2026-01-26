from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.employee_model import EmployeeModel
import json

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["OPTIONS"])
def options_login():
    return {}, 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    p_num = data.get("personal_number")
    password = data.get("password")

    user = EmployeeModel.login_check(p_num, password)
    if user:
        # Create JWT Token - pass identity as JSON string
        identity_data = {
            "id": user["id"],
            "is_admin": user["is_admin"],
            "is_commander": user["is_commander"],
        }
        token = create_access_token(identity=json.dumps(identity_data))

        return jsonify(
            {
                "success": True,
                "token": token,
                "user": {
                    "id": user["id"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "personal_number": user["personal_number"],
                    "phone_number": user.get("phone_number"),
                    "must_change_password": user["must_change_password"],
                    "is_admin": user["is_admin"],
                    "is_commander": user["is_commander"],
                },
            }
        )
    return jsonify({"success": False, "error": "מספר אישי או סיסמה שגויים"}), 401


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    identity_str = get_jwt_identity()
    identity = json.loads(identity_str)
    user_id = identity["id"]
    
    user = EmployeeModel.get_employee_by_id(user_id)
    if user:
        return jsonify(
            {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "personal_number": user["personal_number"],
                "phone_number": user.get("phone_number"),
                "must_change_password": user["must_change_password"],
                "is_admin": user["is_admin"],
                "is_commander": user["is_commander"],
            }
        )
    return jsonify({"error": "User not found"}), 404


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    identity_str = get_jwt_identity()
    identity = json.loads(identity_str)
    user_id = identity["id"]
    
    data = request.get_json()
    new_pass = data.get("new_password")

    if not new_pass or len(new_pass) < 6:
        return jsonify({"success": False, "error": "Password too short"}), 400

    if EmployeeModel.update_password(user_id, new_pass):
        return jsonify({"success": True, "message": "הסיסמה עודכנה בהצלחה"})
    return jsonify({"success": False, "error": "שגיאה בעדכון הסיסמה"}), 500
