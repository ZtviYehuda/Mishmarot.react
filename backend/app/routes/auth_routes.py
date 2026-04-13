from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.employee_model import EmployeeModel
from app.models.audit_log_model import AuditLogModel
import json
import secrets
import hashlib
import logging
import base64
from datetime import datetime, timedelta
from psycopg2.extras import RealDictCursor
from app.utils.db import get_db_connection
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    RegistrationCredential,
    AuthenticationCredential,
)
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/refresh-token", methods=["POST"])
def refresh_token():
    """
    Issue or refresh a token pair for biometric/quick login.
    
    Two flows:
    1. Initial registration: { username, password } → returns { refreshToken, accessToken }
    2. Token refresh: { refresh_token } → returns { refreshToken, accessToken }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    supplied_refresh = data.get("refresh_token")
    username = data.get("username")
    password = data.get("password")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            user = None

            if username and password:
                # Flow 1: Initial registration — validate credentials
                user_basic = EmployeeModel.login_check(username, password)
                if not user_basic or (isinstance(user_basic, dict) and "error" in user_basic):
                    return jsonify({"success": False, "error": "שם משתמש או סיסמה שגויים"}), 401

                user = EmployeeModel.get_employee_by_id(user_basic["id"])
                if not user:
                    return jsonify({"success": False, "error": "User not found"}), 404

            elif supplied_refresh:
                # Flow 2: Token refresh — validate the refresh token
                token_hash = hashlib.sha256(supplied_refresh.encode()).hexdigest()
                cur.execute(
                    """
                    SELECT e.* FROM employees e
                    JOIN employee_refresh_tokens rt ON e.id = rt.employee_id
                    WHERE rt.token_hash = %s AND rt.expires_at > NOW() AND e.is_active = TRUE
                    """,
                    (token_hash,),
                )
                user = cur.fetchone()
                if not user:
                    return jsonify({"success": False, "error": "Refresh token expired or invalid"}), 401

                # Delete the used token (rotation)
                cur.execute("DELETE FROM employee_refresh_tokens WHERE token_hash = %s", (token_hash,))
            else:
                return jsonify({"error": "Missing credentials or refresh_token"}), 400

            # Check access level
            if not user.get("is_admin") and not user.get("is_commander"):
                return jsonify({"success": False, "error": "גישה למערכת מורשית למפקדים ומנהלים בלבד"}), 403

            # Generate new refresh token
            new_refresh_token = secrets.token_urlsafe(48)
            new_token_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()

            # Ensure table exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS employee_refresh_tokens (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                    token_hash TEXT NOT NULL UNIQUE,
                    device_name TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    expires_at TIMESTAMP NOT NULL
                )
            """)

            # Clean up old tokens for this user (max 5 devices)
            cur.execute(
                "DELETE FROM employee_refresh_tokens WHERE employee_id = %s AND expires_at < NOW()",
                (user["id"],),
            )

            # Insert new token (30-day expiry)
            cur.execute(
                """
                INSERT INTO employee_refresh_tokens (employee_id, token_hash, device_name, expires_at)
                VALUES (%s, %s, %s, NOW() + INTERVAL '30 days')
                """,
                (user["id"], new_token_hash, request.headers.get("User-Agent", "unknown")[:200]),
            )
            conn.commit()

            # Generate access token
            access_token = create_access_token(
                identity=json.dumps({
                    "id": user["id"],
                    "is_admin": user.get("is_admin", False),
                    "is_commander": user.get("is_commander", False),
                })
            )

            return jsonify({
                "success": True,
                "accessToken": access_token,
                "refreshToken": new_refresh_token,
                "user": {
                    "id": user["id"],
                    "first_name": user.get("first_name"),
                    "last_name": user.get("last_name"),
                    "username": user.get("username"),
                },
            })

    except Exception as e:
        conn.rollback()
        import traceback
        print(f"❌ Refresh token error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


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

        p_num = data.get("username")
        password = data.get("password")

        user_agent = request.headers.get("User-Agent")
        forwarded = request.headers.get("X-Forwarded-For")
        real_ip = forwarded.split(',')[0].strip() if forwarded else request.remote_addr

        meta = {
            "username_attempt": p_num,
            "browser": user_agent,
            "forwarded_for": forwarded,
            "real_ip": real_ip
        }

        print(f"DEBUG LOGIN: Checking credentials for {p_num}")
        user_basic = EmployeeModel.login_check(p_num, password)

        if isinstance(user_basic, dict) and "error" in user_basic:
            error_code = user_basic["error"]
            error_msg = user_basic.get("message", "שגיאת התחברות")
            AuditLogModel.log_action(
                user_id=user_basic.get("id"),
                action_type=f"BLOCKED_LOGIN_{error_code}",
                description=f"Login blocked: {error_msg} for username: {p_num}",
                ip_address=real_ip,
                metadata=meta,
            )
            return jsonify({"success": False, "error": error_msg}), 403

        if not user_basic:
            print("DEBUG LOGIN: login_check failed")
            temp_conn = get_db_connection()
            if temp_conn:
                with temp_conn.cursor() as cur:
                    cur.execute(
                        "SELECT id FROM employees WHERE username = %s", (p_num,)
                    )
                    row = cur.fetchone()
                    target_uid = row[0] if row else None
                    AuditLogModel.log_action(
                        user_id=target_uid,
                        action_type="FAILED_LOGIN",
                        description=f"Failed login attempt for username: {p_num}",
                        ip_address=real_ip,
                        metadata=meta,
                    )
                temp_conn.close()

            return (
                jsonify({"success": False, "error": "שם משתמש או סיסמא שגויים"}),
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

        meta["success"] = True
        AuditLogModel.log_action(
            user_id=user["id"],
            action_type="LOGIN",
            description=f"Successful login for {user['first_name']} {user['last_name']}",
            ip_address=real_ip,
            metadata=meta,
        )

        return jsonify(
            {
                "success": True,
                "token": token,
                "user": {
                    "id": user["id"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "username": user["username"],
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
                    "service_type_name": user.get("service_type_name"),
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
                "username": user["username"],
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
                "service_type_name": user.get("service_type_name"),
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

    success, error = EmployeeModel.reset_password_to_default(user_id)

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
            {"success": True, "message": "הסיסמא אופסה בהצלחה (סיסמא ברירת מחדל: 123456)"}
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
    Step 1: Request Password Reset - Receives email only
    """
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"success": False, "error": "נא להזין כתובת אימייל"}), 400

    from app.utils.db import get_db_connection

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Verify User has this email
        cur.execute(
            "SELECT id, email FROM employees WHERE email = %s AND is_active = TRUE",
            (email,),
        )
        user = cur.fetchone()

        if not user or not user.get("email"):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "כתובת האימייל לא נמצאה במערכת",
                    }
                ),
                400,
            )

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

        if send_verification_email(email, code):
            return jsonify(
                {"success": True, "message": "קוד אימות נשלח בהצלחה לתיבת המייל שלך"}
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "נכשלה שליחת המייל. אנא פנה למנהל המערכת או נסה שנית מאוחר יותר.",
                    }
                ),
                500,
            )

    except Exception as e:
        print(f"Error in forgot-password: {e}")
        return jsonify({"success": False, "error": "שגיאת שרת פנימית"}), 500
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
            return (
                jsonify({"success": False, "error": "קוד אימות שגוי או פג תוקף"}),
                400,
            )

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
        return jsonify({"success": False, "error": "חסרים נתונים לביצוע האיפוס"}), 400

    if len(new_password) < 6:
        return (
            jsonify({"success": False, "error": "הסיסמה קצרה מדי (מינימום 6 תווים)"}),
            400,
        )

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
                jsonify({"success": False, "error": "בקשת האיפוס פגה או אינה תקפה"}),
                400,
            )

        # Update Password - Ensuring email matches the user
        from werkzeug.security import generate_password_hash

        new_hash = generate_password_hash(new_password)

        cur.execute(
            """
            UPDATE employees 
            SET password_hash = %s, must_change_password = FALSE, last_password_change = NOW() 
            WHERE email = %s
            """,
            (new_hash, email),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return (
                jsonify(
                    {"success": False, "error": "לא נמצא משתמש תואם לפרטים שהוזנו"}
                ),
                404,
            )

        # Mark code as used only after success
        cur.execute(
            "UPDATE verification_codes SET is_used = TRUE WHERE id = %s",
            (record["id"],),
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
                    "username": target_user.get("username"),
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

@auth_bp.route("/profile/activity", methods=["GET"])
@jwt_required()
def get_my_activity():
    """
    Returns the recent activity logs for the currently logged-in user.
    """
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw

    user_id = identity["id"] if isinstance(identity, dict) else identity
    
    limit = request.args.get("limit", 20, type=int)
    logs = AuditLogModel.get_user_activity(user_id, limit=limit)
    
    # Process logs to match frontend expectations (ensure metadata is readable)
    return jsonify({
        "success": True,
        "logs": logs
    })


# --- WEBAUTHN (PASSKEYS) ROUTES ---

def get_rp_id():
    # Extract RP ID from Host header (e.g., localhost or domain.trycloudflare.com)
    host = request.headers.get("Host", "localhost")
    return host.split(":")[0]

def get_origin():
    # Detect origin (http for localhost, https for tunnel)
    host = request.headers.get("Host", "localhost")
    scheme = "https" if "trycloudflare" in host or request.is_secure else "http"
    return f"{scheme}://{host}"

@auth_bp.route("/webauthn/register/options", methods=["GET"])
@jwt_required()
def webauthn_register_options():
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        user_id = identity["id"]
    except:
        return jsonify({"error": "Invalid token"}), 401

    user = EmployeeModel.get_employee_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get existing credentials to exclude
    conn = get_db_connection()
    exclude_credentials = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT credential_id FROM webauthn_credentials WHERE user_id = %s", (user_id,))
            for row in cur.fetchall():
                exclude_credentials.append(RegistrationCredential(id=row["credential_id"]))
    finally:
        conn.close()

    options = generate_registration_options(
        rp_id=get_rp_id(),
        rp_name="Mishmarot Dashboard",
        user_id=str(user_id).encode(),
        user_name=user["username"],
        user_display_name=f"{user['first_name']} {user['last_name']}",
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
            resident_key=None,
        ),
        exclude_credentials=exclude_credentials,
    )

    # Store challenge in DB
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO webauthn_challenges (challenge, user_id, expires_at) VALUES (%s, %s, %s)",
                (options.challenge.decode() if isinstance(options.challenge, bytes) else options.challenge, user_id, datetime.now() + timedelta(minutes=5))
            )
            conn.commit()
    finally:
        conn.close()

    return options_to_json(options)

@auth_bp.route("/webauthn/register/verify", methods=["POST"])
@jwt_required()
def webauthn_register_verify():
    identity_raw = get_jwt_identity()
    try:
        identity = json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        user_id = identity["id"]
    except:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    
    # Retrieve challenge from DB
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Look for challenge and ensure it belongs to this user
            # Challenge comes in as base64 in the response usually or we extract from client side
            # But the 'webauthn' lib verify needs the original challenge bytes.
            
            # The client sends the full credential object
            cur.execute(
                "SELECT challenge FROM webauthn_challenges WHERE user_id = %s AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Challenge expired or not found"}), 400
            
            expected_challenge = row["challenge"].encode()

            try:
                verification = verify_registration_response(
                    credential=data,
                    expected_challenge=expected_challenge,
                    expected_origin=get_origin(),
                    expected_rp_id=get_rp_id(),
                )
            except Exception as e:
                return jsonify({"error": f"Verification failed: {str(e)}"}), 400

            # Store new credential
            cur.execute(
                """
                INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count, transports)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    verification.credential_id,
                    verification.public_key,
                    verification.sign_count,
                    None # transports could be saved if present in data
                )
            )
            
            # Clean up challenge
            cur.execute("DELETE FROM webauthn_challenges WHERE challenge = %s", (row["challenge"],))
            conn.commit()
            
            AuditLogModel.log_action(
                user_id=user_id,
                action_type="WEBAUTHN_REGISTER",
                description="User registered a new biometric passkey",
                ip_address=request.remote_addr
            )
            
            return jsonify({"success": True})
    finally:
        conn.close()

@auth_bp.route("/webauthn/login/options", methods=["POST"])
def webauthn_login_options():
    data = request.get_json()
    username = data.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM employees WHERE username = %s AND is_active = TRUE", (username,))
            user = cur.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            user_id = user["id"]
            
            cur.execute("SELECT credential_id FROM webauthn_credentials WHERE user_id = %s", (user_id,))
            credentials = cur.fetchall()
            if not credentials:
                return jsonify({"error": "No biometric credentials registered"}), 404

            allow_credentials = [AuthenticationCredential(id=row["credential_id"]) for row in credentials]
            
            options = generate_authentication_options(
                rp_id=get_rp_id(),
                allow_credentials=allow_credentials,
                user_verification=UserVerificationRequirement.PREFERRED,
            )

            # Store challenge
            cur.execute(
                "INSERT INTO webauthn_challenges (challenge, user_id, expires_at) VALUES (%s, %s, %s)",
                (options.challenge.decode() if isinstance(options.challenge, bytes) else options.challenge, user_id, datetime.now() + timedelta(minutes=5))
            )
            conn.commit()
            
            return options_to_json(options)
    finally:
        conn.close()

@auth_bp.route("/webauthn/login/verify", methods=["POST"])
def webauthn_login_verify():
    data = request.get_json()
    # verify needs original challenge.
    # We can get the user_id from the challenge table if we find the matching challenge.
    # But often the client sends the credential which has an ID.
    
    # Extract credential ID from response to find the user
    raw_id = data.get("id")
    if not raw_id:
        return jsonify({"error": "Credential ID missing"}), 400
    
    cred_id_bytes = base64url_to_bytes(raw_id)
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Find the credential and user
            cur.execute(
                "SELECT c.*, e.username, e.is_admin, e.is_commander FROM webauthn_credentials c JOIN employees e ON c.user_id = e.id WHERE c.credential_id = %s",
                (cred_id_bytes,)
            )
            cred = cur.fetchone()
            if not cred:
                return jsonify({"error": "Credential not found"}), 401
            
            user_id = cred["user_id"]
            
            # Find matching active challenge for this user
            cur.execute(
                "SELECT challenge FROM webauthn_challenges WHERE user_id = %s AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Challenge expired or not found"}), 400
            
            expected_challenge = row["challenge"].encode()

            try:
                verification = verify_authentication_response(
                    credential=data,
                    expected_challenge=expected_challenge,
                    expected_origin=get_origin(),
                    expected_rp_id=get_rp_id(),
                    credential_public_key=cred["public_key"],
                    credential_current_sign_count=cred["sign_count"],
                )
            except Exception as e:
                return jsonify({"error": f"Verification failed: {str(e)}"}), 401

            # Update sign count
            cur.execute(
                "UPDATE webauthn_credentials SET sign_count = %s WHERE id = %s",
                (verification.new_sign_count, cred["id"])
            )
            
            # Clean up challenge
            cur.execute("DELETE FROM webauthn_challenges WHERE challenge = %s", (row["challenge"],))
            conn.commit()
            
            # Issue JWT
            token = create_access_token(
                identity=json.dumps({
                    "id": user_id,
                    "is_admin": cred["is_admin"],
                    "is_commander": cred["is_commander"],
                })
            )
            
            AuditLogModel.log_action(
                user_id=user_id,
                action_type="WEBAUTHN_LOGIN",
                description="Successful biometric login",
                ip_address=request.remote_addr
            )
            
            # Fetch full user profile for consistency with regular login
            user_full = EmployeeModel.get_employee_by_id(user_id)
            
            return jsonify({
                "success": True,
                "token": token,
                "user": user_full
            })
    finally:
        conn.close()
