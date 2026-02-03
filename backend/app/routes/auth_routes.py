from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.employee_model import EmployeeModel
import logging
import json

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    מטפל בבקשת התחברות של משתמש.
    מאמת פרטים מול המודל, בודק הרשאות ניהול, ומחזיר JWT.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        p_num = data.get("personal_number")
        password = data.get("password")

        # שלב 1: אימות פרטים בסיסי
        user_basic = EmployeeModel.login_check(p_num, password)
        if not user_basic:
            return (
                jsonify({"success": False, "error": "מספר אישי או סיסמה שגויים"}),
                401,
            )

        # שלב 2: קבלת פרופיל מלא ובדיקת הרשאות
        # (מומלץ לאחד את זה עם login_check בעתיד לשיפור ביצועים)
        user = EmployeeModel.get_employee_by_id(user_basic["id"])
        if not user:
            # מקרה קצה נדיר, אבל חשוב לטפל בו
            return (
                jsonify(
                    {"success": False, "error": "User profile not found after login"}
                ),
                500,
            )

        # הערה: אם תרצה לאפשר לכל המשתמשים להתחבר, הסר את התנאי הבא
        if not user.get("is_admin") and not user.get("is_commander"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "גישה למערכת מורשית למפקדים ומנהלים בלבד",
                    }
                ),
                403,
            )

        # שלב 3: יצירת טוקן עם זהות כמחרוזת (string) למניעת שגיאת "Subject must be a string"
        token = create_access_token(
            identity=json.dumps(
                {
                    "id": user["id"],
                    "is_admin": user["is_admin"],
                    "is_commander": user["is_commander"],
                }
            )
        )

        return jsonify(
            {
                "success": True,
                "token": token,
                "user": {
                    "id": user.get("id"),
                    "first_name": user.get("first_name"),
                    "last_name": user.get("last_name"),
                    "personal_number": user.get("personal_number"),
                    "phone_number": user.get("phone_number"),
                    "must_change_password": user.get("must_change_password", False),
                    "is_admin": user.get("is_admin", False),
                    "is_commander": user.get("is_commander", False),
                    "department_id": user.get("department_id"),
                    "section_id": user.get("section_id"),
                    "team_id": user.get("team_id"),
                    "assigned_department_id": user.get("assigned_department_id"),
                    "assigned_section_id": user.get("assigned_section_id"),
                    "commands_department_id": user.get("commands_department_id"),
                    "commands_section_id": user.get("commands_section_id"),
                    "commands_team_id": user.get("commands_team_id"),
                    "notif_sick_leave": user.get("notif_sick_leave", True),
                    "notif_transfers": user.get("notif_transfers", True),
                    "city": user.get("city"),
                    "birth_date": user.get("birth_date"),
                    "emergency_contact": user.get("emergency_contact"),
                    "department_name": user.get("department_name"),
                    "section_name": user.get("section_name"),
                    "team_name": user.get("team_name"),
                    "role_name": user.get("role_name"),
                    "service_type_name": user.get("service_type_name"),
                    "national_id": user.get("national_id"),
                    "enlistment_date": user.get("enlistment_date"),
                    "discharge_date": user.get("discharge_date"),
                    "assignment_date": user.get("assignment_date"),
                    "police_license": user.get("police_license"),
                    "security_clearance": user.get("security_clearance"),
                },
            }
        )

    except Exception as e:
        import traceback

        print("\n❌ CRITICAL ERROR DURING LOGIN:")
        print(traceback.format_exc())
        logging.error("Error during login process:", exc_info=True)
        return (
            jsonify({"success": False, "error": f"Internal server error: {str(e)}"}),
            500,
        )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    מחזיר את פרטי המשתמש המחובר הנוכחי על סמך הטוקן.
    """
    # get_jwt_identity יחזיר את המילון שהגדרנו ב-login
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity

    if not user_id:
        return jsonify({"error": "Invalid token identity"}), 400

    is_impersonated = (
        identity.get("is_impersonation", False) if isinstance(identity, dict) else False
    )

    user = EmployeeModel.get_employee_by_id(user_id)
    if user:
        return jsonify(
            {
                "id": user["id"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "personal_number": user["personal_number"],
                "phone_number": user.get("phone_number"),
                "must_change_password": (
                    False if is_impersonated else user["must_change_password"]
                ),
                "is_impersonated": is_impersonated,
                "is_admin": user["is_admin"],
                "is_commander": user["is_commander"],
                "department_id": user.get("department_id"),
                "section_id": user.get("section_id"),
                "team_id": user.get("team_id"),
                "assigned_department_id": user.get("assigned_department_id"),
                "assigned_section_id": user.get("assigned_section_id"),
                "commands_department_id": user.get("commands_department_id"),
                "commands_section_id": user.get("commands_section_id"),
                "commands_team_id": user.get("commands_team_id"),
                "notif_sick_leave": user.get("notif_sick_leave", True),
                "notif_transfers": user.get("notif_transfers", True),
                "city": user.get("city"),
                "birth_date": user.get("birth_date"),
                "emergency_contact": user.get("emergency_contact"),
                "department_name": user.get("department_name"),
                "section_name": user.get("section_name"),
                "team_name": user.get("team_name"),
                "role_name": user.get("role_name"),
                "service_type_name": user.get("service_type_name"),
                "national_id": user.get("national_id"),
                "enlistment_date": user.get("enlistment_date"),
                "discharge_date": user.get("discharge_date"),
                "assignment_date": user.get("assignment_date"),
                "police_license": user.get("police_license"),
                "security_clearance": user.get("security_clearance"),
            }
        )
    return jsonify({"error": "User not found"}), 404


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """
    מאפשר למשתמש מחובר לשנות את הסיסמה שלו.
    """
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity

    data = request.get_json()
    new_pass = data.get("new_password")

    if not new_pass or len(new_pass) < 6:
        return jsonify({"success": False, "error": "Password too short"}), 400

    if EmployeeModel.update_password(user_id, new_pass):
        return jsonify({"success": True, "message": "הסיסמה עודכנה בהצלחה"})
    return jsonify({"success": False, "error": "שגיאה בעדכון הסיסמה"}), 500


@auth_bp.route("/reset-impersonated-password", methods=["POST"])
@jwt_required()
def reset_impersonated_password():
    """
    Allows an admin (who is impersonating another user) to reset the password
    of the IMPERSONATED user to their national ID (ת.ז).
    """
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    # Check if this is an impersonation session
    if not isinstance(identity, dict) or not identity.get("is_impersonation"):
        return (
            jsonify({"success": False, "error": "פעולה זו מותרת רק במצב התחזות מנהל"}),
            403,
        )

    user_id = identity["id"]  # The ID of the user being impersonated

    success, error = EmployeeModel.reset_password_to_national_id(user_id)

    if success:
        return jsonify(
            {"success": True, "message": "הסיסמה אופסה בהצלחה לתעודת הזהות של המשתמש"}
        )
    else:
        return (
            jsonify({"success": False, "error": error or "Failed to reset password"}),
            500,
        )


@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    מאפשר למשתמש לעדכן את פרטי הפרופיל שלו (מורחב).
    """
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

    # שדות מורחבים לעדכון עצמי
    allowed_data = {
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name"),
        "phone_number": data.get("phone_number"),
        "notif_sick_leave": data.get("notif_sick_leave"),
        "notif_transfers": data.get("notif_transfers"),
        "city": data.get("city"),
        "birth_date": data.get("birth_date"),
        "emergency_contact": data.get("emergency_contact"),
        "national_id": data.get("national_id"),
        "enlistment_date": data.get("enlistment_date"),
        "discharge_date": data.get("discharge_date"),
        "assignment_date": data.get("assignment_date"),
        "police_license": data.get("police_license"),
        "security_clearance": data.get("security_clearance"),
    }

    # הסרת ערכים שהם None (כדי לא לדרוס נתונים קיימים אם לא נשלחו)
    allowed_data = {k: v for k, v in allowed_data.items() if v is not None}

    if not allowed_data:
        return jsonify({"success": True, "message": "No changes to update"})

    if EmployeeModel.update_employee(user_id, allowed_data):
        return jsonify({"success": True, "message": "הפרופיל עודכן בהצלחה"})
    return jsonify({"success": False, "error": "שגיאה בעדכון הפרופיל"}), 500


@auth_bp.route("/verify-token", methods=["GET"])
@jwt_required()
def verify_token():
    """
    נתיב פשוט שבודק אם הטוקן שנשלח בכותרת הוא תקף.
    אם הטוקן לא תקף, @jwt_required יחזיר שגיאה 401 אוטומטית.
    """
    # אם הגענו לכאן, הטוקן תקף.
    return jsonify({"success": True, "message": "Token is valid"})


@auth_bp.route("/impersonate", methods=["POST"])
@jwt_required()
def impersonate_user():
    """
    Admin only: Generate a login token for another user to view the system as them.
    """
    try:
        # 1. Verify Admin Status
        identity_raw = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_raw)
                if isinstance(identity_raw, str)
                else identity_raw
            )
        except (json.JSONDecodeError, TypeError):
            identity = identity_raw

        requesting_id = identity["id"] if isinstance(identity, dict) else identity

        # Check against DB to be sure
        admin_user = EmployeeModel.get_employee_by_id(requesting_id)
        if not admin_user or not admin_user.get("is_admin"):
            return (
                jsonify({"success": False, "error": "Unauthorized: Admins only"}),
                403,
            )

        # 2. Get Target User
        data = request.get_json()
        target_id = data.get("target_id")

        target_user = EmployeeModel.get_employee_by_id(target_id)
        if not target_user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # 3. Generate Token for Target
        token = create_access_token(
            identity=json.dumps(
                {
                    "id": target_user["id"],
                    "is_admin": target_user["is_admin"],
                    "is_commander": target_user["is_commander"],
                    "is_impersonation": True,
                    "real_admin_id": requesting_id,
                }
            )
        )

        # 4. Return as if logged in
        return jsonify(
            {
                "success": True,
                "token": token,
                "user": {
                    "id": target_user.get("id"),
                    "first_name": target_user.get("first_name"),
                    "last_name": target_user.get("last_name"),
                    "personal_number": target_user.get("personal_number"),
                    "phone_number": target_user.get("phone_number"),
                    "must_change_password": False,  # Admin impersonation does not require password change
                    "is_admin": target_user.get("is_admin", False),
                    "is_commander": target_user.get("is_commander", False),
                    "assigned_department_id": target_user.get("assigned_department_id"),
                    "assigned_section_id": target_user.get("assigned_section_id"),
                    "commands_department_id": target_user.get("commands_department_id"),
                    "commands_section_id": target_user.get("commands_section_id"),
                    "commands_team_id": target_user.get("commands_team_id"),
                    "notif_sick_leave": target_user.get("notif_sick_leave", True),
                    "notif_transfers": target_user.get("notif_transfers", True),
                    "city": target_user.get("city"),
                    "birth_date": target_user.get("birth_date"),
                    "emergency_contact": target_user.get("emergency_contact"),
                    "department_name": target_user.get("department_name"),
                    "section_name": target_user.get("section_name"),
                    "team_name": target_user.get("team_name"),
                    "role_name": target_user.get("role_name"),
                    "service_type_name": target_user.get("service_type_name"),
                },
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
