from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.db import get_db_connection
from app.services.backup_service import backup_service
from app.models.audit_log_model import AuditLogModel
import json
import datetime
import io
import os

admin_bp = Blueprint("admin", __name__)


def _get_user_id_from_jwt():
    identity_raw = get_jwt_identity()
    try:
        identity = (
            json.loads(identity_raw) if isinstance(identity_raw, str) else identity_raw
        )
    except (json.JSONDecodeError, TypeError):
        identity = identity_raw
    return identity["id"] if isinstance(identity, dict) else identity


@admin_bp.route("/backup/config", methods=["GET"])
@jwt_required()
def get_backup_config():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify(backup_service.get_config())


@admin_bp.route("/backup/config", methods=["POST"])
@jwt_required()
def update_backup_config():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    new_config = {
        "enabled": data.get("enabled"),
        "interval_hours": data.get("interval_hours"),
    }
    backup_service.save_config(new_config)
    return jsonify({"success": True, "config": backup_service.get_config()})


@admin_bp.route("/backup/now", methods=["POST"])
@jwt_required()
def trigger_backup_now():
    """Manually trigger a system backup immediately"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    success, result = backup_service.perform_backup()
    if success:
        return jsonify(
            {
                "success": True,
                "message": "Backup created successfully",
                "file": result,
                "last_backup": backup_service.get_config().get("last_backup"),
            }
        )
    else:
        return jsonify({"success": False, "error": result}), 500


@admin_bp.route("/settings", methods=["GET"])
@jwt_required()
def get_system_settings():
    """Get all system settings"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT key, value, description FROM system_settings")
        rows = cur.fetchall()

        settings = {}
        for row in rows:
            # Try to parse boolean values
            val = row[1]
            if val.lower() == "true":
                val = True
            elif val.lower() == "false":
                val = False
            settings[row[0]] = val

        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@admin_bp.route("/settings", methods=["POST"])
@jwt_required()
def update_system_settings():
    """Update a specific system setting"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    user_id = _get_user_id_from_jwt()

    data = request.get_json()
    key = data.get("key")
    value = data.get("value")

    if not key:
        return jsonify({"error": "Missing key"}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Convert boolean to string for storage
        val_str = str(value).lower() if isinstance(value, bool) else str(value)

        cur.execute(
            """
            INSERT INTO system_settings (key, value) 
            VALUES (%s, %s)
            ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value, 
            updated_at = CURRENT_TIMESTAMP
        """,
            (key, val_str),
        )

        conn.commit()

        # Log Setting Change
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="SYSTEM_SETTING_UPDATE",
            description=f"Updated system setting: {key}",
            ip_address=request.remote_addr,
            metadata={"key": key, "value": value},
        )

        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


def is_admin():
    try:
        identity = get_jwt_identity()
        current_user_id = None

        # טיפול ב-Identity אם הוא מילון
        if isinstance(identity, dict):
            current_user_id = identity.get("id")
        # טיפול ב-Identity אם הוא מחרוזת (JSON String)
        elif isinstance(identity, str):
            try:
                # מנסים לפרסר כ-JSON אם זה נראה כמו מילון
                if identity.strip().startswith("{"):
                    import json

                    data = json.loads(identity)
                    current_user_id = data.get("id")
                else:
                    current_user_id = identity  # זה כנראה ה-ID עצמו כמחרוזת
            except:
                current_user_id = identity  # fallback
        else:
            current_user_id = identity

        if not current_user_id:
            print("DEBUG: No current_user_id found")
            return False

        conn = get_db_connection()
        cur = conn.cursor()
        print(f"DEBUG: Checking admin status for user_id: {current_user_id}")
        cur.execute("SELECT is_admin FROM employees WHERE id = %s", (current_user_id,))
        res = cur.fetchone()
        conn.close()

        is_admin_val = res and res[0]
        print(f"DEBUG: Admin status query result: {res}, is_admin: {is_admin_val}")
        return is_admin_val
    except Exception as e:
        print(f"Error in is_admin check: {e}")
        return False


@admin_bp.route("/backup", methods=["GET"])
@jwt_required()
def backup_database():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    user_id = _get_user_id_from_jwt()
    conn = get_db_connection()
    cur = conn.cursor()

    backup_data = {
        "metadata": {"version": "1.0", "date": datetime.datetime.now().isoformat()},
        "data": {},
    }

    # רשימת הטבלאות לגיבוי לפי סדר תלויות (חשוב לשחזור)
    tables = [
        "system_settings",
        "roles",
        "status_types",
        "service_types",
        "departments",
        "sections",
        "teams",
        "employees",
        "attendance_logs",
        "transfer_requests",
    ]

    try:
        for table in tables:
            cur.execute(f"SELECT * FROM {table}")
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

            # המרת נתונים לפורמט JSON-serializable
            table_data = []
            for row in rows:
                item = {}
                for i, col in enumerate(columns):
                    val = row[i]
                    if isinstance(val, (datetime.date, datetime.datetime)):
                        val = val.isoformat()
                    item[col] = val
                table_data.append(item)

            backup_data["data"][table] = table_data

        # יצירת הקובץ בזיכרון
        mem_file = io.BytesIO()
        mem_file.write(
            json.dumps(backup_data, indent=4, ensure_ascii=False).encode("utf-8")
        )
        mem_file.seek(0)

        filename = (
            f"mishmarot_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )

        # Log Backup
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="DATABASE_BACKUP",
            description="Manual database backup triggered and downloaded",
            ip_address=request.remote_addr,
            metadata={"filename": filename},
        )

        return send_file(
            mem_file,
            as_attachment=True,
            download_name=filename,
            mimetype="application/json",
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@admin_bp.route("/restore", methods=["POST"])
@jwt_required()
def restore_database():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    user_id = _get_user_id_from_jwt()
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        content = json.load(file)
        data = content.get("data", {})

        conn = get_db_connection()
        cur = conn.cursor()

        # התחלת טרנזקציה

        # סדר טבלאות הפוך למחיקה (כדי למנוע בעיות Foreign Key)
        tables_reversed = [
            "transfer_requests",
            "attendance_logs",
            "employees",
            "teams",
            "sections",
            "departments",
            "service_types",
            "status_types",
            "roles",
            "system_settings",
        ]

        # ניקוי טבלאות
        for table in tables_reversed:
            cur.execute(f"TRUNCATE TABLE {table} CASCADE")

        # סדר טבלאות רגיל להוספה
        tables = [
            "system_settings",
            "roles",
            "status_types",
            "service_types",
            "departments",
            "sections",
            "teams",
            "employees",
            "attendance_logs",
            "transfer_requests",
        ]

        for table in tables:
            if table not in data:
                continue

            rows = data[table]
            if not rows:
                continue

            columns = rows[0].keys()
            cols_str = ", ".join(columns)
            vals_str = ", ".join(["%s"] * len(columns))

            query = f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str})"

            for row in rows:
                values = [row[col] for col in columns]
                cur.execute(query, values)

            # עדכון ה-Sequence כדי למנוע שגיאות ID בעתיד
            if "id" in columns:
                cur.execute(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1) ) FROM {table}"
                )

        conn.commit()

        # Log Restore
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="DATABASE_RESTORE",
            description=f"Database restoration completed from file: {file.filename}",
            ip_address=request.remote_addr,
            metadata={"filename": file.filename},
        )
        return jsonify({"success": True, "message": "Database restored successfully"})

    except Exception as e:
        import traceback

        traceback.print_exc()
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@admin_bp.route("/reports/birthday/trigger", methods=["POST"])
@jwt_required()
def trigger_birthday_report():
    """Manually trigger the weekly birthday report"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from app.utils.reminder_service import check_and_send_weekly_birthday_report

        check_and_send_weekly_birthday_report()
        return jsonify(
            {
                "success": True,
                "message": "Birthday report manually triggered. Check server logs/simulation.",
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/reminders/morning/trigger", methods=["POST"])
@jwt_required()
def trigger_morning_reminders():
    """Manually trigger the morning attendance reminders"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from app.utils.reminder_service import check_and_send_morning_reminders

        # force_now=True to skip the 15-min-before-deadline check
        check_and_send_morning_reminders(force_now=True)
        return jsonify(
            {
                "success": True,
                "message": "Morning reminders triggered. Check server logs/simulation.",
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
