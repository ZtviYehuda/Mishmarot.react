from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.employee_model import EmployeeModel
from app.models.audit_log_model import AuditLogModel
import logging
import json
from psycopg2.extras import RealDictCursor
from app.utils.db import get_db_connection

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
        print(f"DEBUG LOGIN: Checking credentials for {p_num}")
        user_basic = EmployeeModel.login_check(p_num, password)
        if not user_basic:
            print("DEBUG LOGIN: login_check failed")
            # Log Failed Attempt
            # Try to get user_id for logging if the personal_number exists
            temp_conn = get_db_connection()
            if temp_conn:
                with temp_conn.cursor() as cur:
                    cur.execute(
                        "SELECT id FROM employees WHERE personal_number = %s", (p_num,)
                    )
                    row = cur.fetchone()
                    target_uid = row[0] if row else None
                    AuditLogModel.log_action(
                        user_id=target_uid,
                        action_type="FAILED_LOGIN",
                        description=f"Failed login attempt for P-Num: {p_num}",
                        ip_address=request.remote_addr,
                    )
                temp_conn.close()

            return (
                jsonify({"success": False, "error": "מספר אישי או סיסמה שגויים"}),
                401,
            )

        # שלב 2: קבלת פרופיל מלא ובדיקת הרשאות
        print(
            f"DEBUG LOGIN: Credentials OK for ID {user_basic['id']}. Fetching full profile..."
        )
        user = EmployeeModel.get_employee_by_id(user_basic["id"])

        if not user:
            print("DEBUG LOGIN: Full profile fetch failed (User is None)")
            return (
                jsonify(
                    {"success": False, "error": "User profile not found after login"}
                ),
                500,
            )

        print(
            f"DEBUG LOGIN: Profile fetched. Admin={user.get('is_admin')}, Commander={user.get('is_commander')}"
        )

        # הערה: אם תרצה לאפשר לכל המשתמשים להתחבר, הסר את התנאי הבא
        if not user.get("is_admin") and not user.get("is_commander"):
            print("DEBUG LOGIN: Access denied (Not admin/commander)")
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "גישה למערכת מורשית למפקדים ומנהלים בלבד",
                    }
                ),
                403,
            )

        # שלב 3: יצירת טוקן
        print("DEBUG LOGIN: Generating Token...")
        token = create_access_token(
            identity=json.dumps(
                {
                    "id": user["id"],
                    "is_admin": user["is_admin"],
                    "is_commander": user["is_commander"],
                }
            )
        )
        print("DEBUG LOGIN: Token generated successfully.")

        # Log Login
        AuditLogModel.log_action(
            user_id=user["id"],
            action_type="LOGIN",
            description=f"Successful login for {user['first_name']} {user['last_name']}",
            ip_address=request.remote_addr,
            metadata={"browser": request.headers.get("User-Agent")},
        )

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
                    "email": user.get("email"),
                    "last_password_change": user.get("last_password_change"),
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
                    "notif_morning_report": user.get("notif_morning_report", True),
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
                    "theme": user.get("theme"),
                    "accent_color": user.get("accent_color"),
                    "font_size": user.get("font_size"),
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
                "email": user.get("email"),
                "phone_number": user.get("phone_number"),
                "email": user.get("email"),
                "last_password_change": user.get("last_password_change"),
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
                "notif_morning_report": user.get("notif_morning_report", True),
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
                "is_temp_commander": user.get("is_temp_commander", False),
                "active_delegate_id": user.get("active_delegate_id"),
                "theme": user.get("theme"),
                "accent_color": user.get("accent_color"),
                "font_size": user.get("font_size"),
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
    old_pass = data.get("old_password")

    user = EmployeeModel.get_employee_by_id(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    must_change = user.get("must_change_password", False)

    if not new_pass or len(new_pass) < 6:
        return jsonify({"success": False, "error": "Password too short"}), 400

    if not must_change and not old_pass:
        return jsonify({"success": False, "error": "Missing old password"}), 400

    success, msg = EmployeeModel.update_password(
        user_id, new_pass, old_password=old_pass
    )

    if success:
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="PASSWORD_CHANGE",
            description="User changed own password",
            ip_address=request.remote_addr,
            metadata={"browser": request.headers.get("User-Agent")},
        )
        return jsonify({"success": True, "message": "הסיסמה עודכנה בהצלחה"})
    return jsonify({"success": False, "error": msg or "שגיאה בעדכון הסיסמה"}), 400


@auth_bp.route("/confirm-password", methods=["POST"])
@jwt_required()
def confirm_password():
    """
    Allows user to confirm they want to keep their current password, resetting the timer.
    """
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity

    success, msg = EmployeeModel.confirm_current_password(user_id)

    if success:
        # Log Success
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="PASSWORD_CONFIRM",  # Changed action_type to reflect confirmation
            description="Password confirmation successful, timer reset",
            ip_address=request.remote_addr,
            metadata={"browser": request.headers.get("User-Agent")},
        )
        return jsonify({"success": True, "message": "תוקף הסיסמה הוארך"})
    return jsonify({"success": False, "error": msg}), 400


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
        real_admin_id = identity.get("real_admin_id")
        AuditLogModel.log_action(
            user_id=real_admin_id,
            action_type="PASSWORD_RESET_IMPERSONATED",
            description=f"Admin reset password for user {user_id}",
            target_id=user_id,
            ip_address=request.remote_addr,
        )
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
    target_fields = [
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "notif_sick_leave",
        "notif_transfers",
        "notif_morning_report",
        "city",
        "birth_date",
        "emergency_contact",
        "national_id",
        "enlistment_date",
        "discharge_date",
        "assignment_date",
        "police_license",
        "security_clearance",
    ]

    allowed_data = {}
    for field in target_fields:
        if field in data:
            val = data[field]
            # Convert empty strings to None (common in frontend forms for dates/optional text)
            if isinstance(val, str) and not val.strip():
                val = None
            allowed_data[field] = val

    if not allowed_data:
        return jsonify({"success": True, "message": "No changes to update"})

    if EmployeeModel.update_employee(user_id, allowed_data):
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="PROFILE_UPDATE",
            description="User updated profile details",
            metadata=allowed_data,
            ip_address=request.remote_addr,
        )
        return jsonify({"success": True, "message": "הפרופיל עודכן בהצלחה"})
    return jsonify({"success": False, "error": "שגיאה בעדכון הפרופיל"}), 500


import random
import string
from datetime import datetime, timedelta


def generate_code(length=6):
    return "".join(random.choices(string.digits, k=length))


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """
    Step 1: Request Password Reset
    - Receives personal_number + email
    - Checks if they match
    - Generates 6-digit code
    - Saves to verification_codes
    - Sends email (Simulation or SMTP)
    """
    data = request.get_json()
    personal_number = data.get("personal_number")
    email = data.get("email")

    if not personal_number or not email:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    from app.utils.db import get_db_connection

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Verify User
        # We assume users might NOT have email set in DB yet, so we trust the input email
        # IF the user exists. (In a strict system, we would match DB email).
        # For this prototype: Update the user's email if it's missing?
        # Better: Check if user exists.
        cur.execute(
            "SELECT id, first_name, last_name, email FROM employees WHERE personal_number = %s",
            (personal_number,),
        )
        user = cur.fetchone()

        if not user:
            # Security: Fake success
            return jsonify({"success": True, "message": "Code sent"})

        # If user has email in DB, verify it matches?
        # For now, we'll ALLOW updating email if it is null (First time setup)
        # BUT if it exists and doesn't match, we block.
        db_email = user.get("email")
        if db_email and db_email.lower().strip() != email.lower().strip():
            return (
                jsonify(
                    {"success": False, "error": "Email does not match our records"}
                ),
                400,
            )

        # If DB email is empty, we set it now (Lazy registration)
        if not db_email:
            cur.execute(
                "UPDATE employees SET email = %s WHERE id = %s", (email, user["id"])
            )
            conn.commit()

        # 2. Generate Code
        code = generate_code()
        expires = datetime.now() + timedelta(minutes=10)

        # 3. Save Code
        cur.execute(
            "INSERT INTO verification_codes (email, code, expires_at) VALUES (%s, %s, %s)",
            (email, code, expires),
        )
        conn.commit()

        # 4. Send Email
        from app.utils.email_service import send_verification_email

        send_verification_email(email, code)

        return jsonify({"success": True, "message": "Code sent successfully"})

    except Exception as e:
        print(f"Error in forgot-password: {e}")
        return jsonify({"success": False, "error": "Server error"}), 500
    finally:
        if conn:
            conn.close()


@auth_bp.route("/verify-code", methods=["POST"])
def verify_reset_code():
    """
    Step 2: Verify the code entered by user
    """
    data = request.get_json()
    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    from app.utils.db import get_db_connection

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            SELECT id FROM verification_codes 
            WHERE email = %s AND code = %s AND is_used = FALSE AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        """,
            (email, code),
        )

        valid = cur.fetchone()

        if valid:
            return jsonify({"success": True, "message": "Code is valid"})
        else:
            return jsonify({"success": False, "error": "Invalid or expired code"}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@auth_bp.route("/reset-password-with-code", methods=["POST"])
def reset_password_with_code():
    """
    Step 3: Reset Password using valid code
    """
    data = request.get_json()
    email = data.get("email")
    code = data.get("code")
    new_password = data.get("new_password")

    if not email or not code or not new_password:
        return jsonify({"success": False, "error": "Missing fields"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "Password too short"}), 400

    from app.utils.db import get_db_connection

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Verify code again atomically
        cur.execute(
            """
            SELECT id FROM verification_codes 
            WHERE email = %s AND code = %s AND is_used = FALSE AND expires_at > NOW()
            FOR UPDATE
        """,
            (email, code),
        )
        record = cur.fetchone()

        if not record:
            return (
                jsonify({"success": False, "error": "Invalid or expired session"}),
                400,
            )

        # Mark code as used
        cur.execute(
            "UPDATE verification_codes SET is_used = TRUE WHERE id = %s",
            (record["id"],),
        )

        # Update Password
        from werkzeug.security import generate_password_hash

        new_hash = generate_password_hash(new_password)

        # We need to find the user by email
        # Note: If multiple users have same email (shouldn't happen), this resets all??
        # Better: We trusted personal_number earlier. Ideally we pass personal_number here too.
        # But assuming unique email per user:
        cur.execute(
            "UPDATE employees SET password_hash = %s, must_change_password = FALSE, last_password_change = NOW() WHERE email = %s",
            (new_hash, email),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return (
                jsonify(
                    {"success": False, "error": "User not found associated with email"}
                ),
                404,
            )

        conn.commit()
        return jsonify({"success": True, "message": "Password updated successfully"})

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if conn:
            conn.close()


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
    Admin or Commander: Generate a login token for another user to view the system as them.
    - Admins can impersonate anyone
    - Commanders can impersonate members of their commanded unit
    """
    try:
        # 1. Get requesting user
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

        # Check against DB
        requesting_user = EmployeeModel.get_employee_by_id(requesting_id)
        if not requesting_user:
            return (
                jsonify({"success": False, "error": "User not found"}),
                404,
            )

        is_admin = requesting_user.get("is_admin", False)
        is_commander = requesting_user.get("is_commander", False)

        # Must be admin or commander
        if not is_admin and not is_commander:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Unauthorized: Admins or Commanders only",
                    }
                ),
                403,
            )

        # 2. Get Target User
        data = request.get_json()
        target_id = data.get("target_id")

        target_user = EmployeeModel.get_employee_by_id(target_id)
        if not target_user:
            return jsonify({"success": False, "error": "User not found"}), 404

        # 3. Authorization check for commanders
        # Commanders can only impersonate members of their commanded unit
        if is_commander and not is_admin:
            target_dept = target_user.get("department_id")
            target_section = target_user.get("section_id")
            target_team = target_user.get("team_id")

            commander_dept = requesting_user.get("commands_department_id")
            commander_section = requesting_user.get("commands_section_id")
            commander_team = requesting_user.get("commands_team_id")

            # Check if target is within commander's scope
            is_in_scope = False

            if commander_dept and target_dept == commander_dept:
                is_in_scope = True
            elif commander_section and target_section == commander_section:
                is_in_scope = True
            elif commander_team and target_team == commander_team:
                is_in_scope = True

            if not is_in_scope:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Unauthorized: Commanders can only impersonate members of their commanded unit",
                        }
                    ),
                    403,
                )

        # 4. Generate Token for Target
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

        # Log Impersonation
        AuditLogModel.log_action(
            user_id=requesting_id,
            action_type="IMPERSONATION_START",
            description=f"User started impersonating employee {target_id}",
            target_id=target_id,
            ip_address=request.remote_addr,
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
                    "email": target_user.get("email"),
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
                    "notif_morning_report": target_user.get(
                        "notif_morning_report", True
                    ),
                    "city": target_user.get("city"),
                    "birth_date": target_user.get("birth_date"),
                    "emergency_contact": target_user.get("emergency_contact"),
                    "department_name": target_user.get("department_name"),
                    "section_name": target_user.get("section_name"),
                    "team_name": target_user.get("team_name"),
                    "role_name": target_user.get("role_name"),
                    "service_type_name": target_user.get("service_type_name"),
                    "theme": target_user.get("theme"),
                    "accent_color": target_user.get("accent_color"),
                    "font_size": target_user.get("font_size"),
                },
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
