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


@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    מאפשר למשתמש לעדכן את פרטי הפרופיל שלו (שם וטלפון בלבד).
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

    # רק שדות מסוימים מורשים לעדכון עצמי
    allowed_data = {
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name"),
        "phone_number": data.get("phone_number"),
        "notif_sick_leave": data.get("notif_sick_leave"),
        "notif_transfers": data.get("notif_transfers"),
        "city": data.get("city"),
        "birth_date": data.get("birth_date"),
        "emergency_contact": data.get("emergency_contact"),
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
