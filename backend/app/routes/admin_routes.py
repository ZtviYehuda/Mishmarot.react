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
        "interval_days": data.get("interval_days"),
        "max_backups": data.get("max_backups"),
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


@admin_bp.route("/backup/list", methods=["GET"])
@jwt_required()
def list_backups():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify(backup_service.list_backups())


@admin_bp.route("/backup/download/<filename>", methods=["GET"])
@jwt_required()
def download_backup_file(filename):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    filepath = backup_service.get_backup_filepath(filename)
    if not filepath:
        return jsonify({"error": "File not found"}), 404

    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/sql"
    )


@admin_bp.route("/backup/delete/<filename>", methods=["DELETE"])
@jwt_required()
def delete_backup_file(filename):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    # Protect locked backups from direct deletion as well
    locked_list = backup_service.get_config().get("locked_backups", [])
    if filename in locked_list:
        return jsonify({"error": "Cannot delete a locked backup file"}), 400

    if backup_service.delete_backup(filename):
        return jsonify({"success": True, "message": "Backup file deleted successfully"})
    return jsonify({"error": "File not found"}), 404


@admin_bp.route("/backup/lock/<filename>", methods=["POST"])
@jwt_required()
def toggle_lock_backup_file(filename):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    success, action = backup_service.toggle_lock_backup(filename)
    if success:
        return jsonify({"success": True, "action": action, "message": f"Backup file has been {action}"})
    return jsonify({"error": "Failed to update backup lock status"}), 500


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

    # Gather environment variables for pg_dump
    db_host = os.environ.get("DB_HOST", "localhost")
    db_name = os.environ.get("DB_NAME", "postgres")
    db_user = os.environ.get("DB_USER", "postgres")
    db_pass = os.environ.get("DB_PASS", "8245")
    db_port = os.environ.get("DB_PORT", "5432")

    # Resolve executable path for pg_dump
    pg_dump_path = "pg_dump"
    if os.name == "nt":
        # Search common Windows PostgreSQL installations
        possible_paths = [
            r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\pg_dump.exe"
        ]
        for p in possible_paths:
            if os.path.exists(p):
                pg_dump_path = p
                break

    import subprocess
    env = os.environ.copy()
    env["PGPASSWORD"] = db_pass

    cmd = [
        pg_dump_path,
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "--clean",
        "--if-exists"
    ]

    try:
        process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            raise Exception(f"pg_dump failed: {stderr.decode('utf-8', errors='ignore')}")

        mem_file = io.BytesIO(stdout)
        mem_file.seek(0)

        filename = f"toren_backup_{datetime.datetime.now().strftime('%d_%m_%Y__%H_%M')}.sql"

        # Log Backup
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="DATABASE_BACKUP",
            description="Manual database backup triggered and downloaded as SQL",
            ip_address=request.remote_addr,
            metadata={"filename": filename},
        )

        return send_file(
            mem_file,
            as_attachment=True,
            download_name=filename,
            mimetype="application/sql",
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

    # Read uploaded file content
    sql_content = file.read()

    # Gather environment variables for psql
    db_host = os.environ.get("DB_HOST", "localhost")
    db_name = os.environ.get("DB_NAME", "postgres")
    db_user = os.environ.get("DB_USER", "postgres")
    db_pass = os.environ.get("DB_PASS", "8245")
    db_port = os.environ.get("DB_PORT", "5432")

    # Resolve executable path for psql
    psql_path = "psql"
    if os.name == "nt":
        # Search common Windows PostgreSQL installations
        possible_paths = [
            r"C:\Program Files\PostgreSQL\18\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\17\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\15\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe"
        ]
        for p in possible_paths:
            if os.path.exists(p):
                psql_path = p
                break

    import subprocess
    env = os.environ.copy()
    env["PGPASSWORD"] = db_pass

    cmd = [
        psql_path,
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name
    ]

    try:
        # Run psql and pass the SQL contents to its standard input
        process = subprocess.Popen(
            cmd,
            env=env,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate(input=sql_content)

        if process.returncode != 0:
            raise Exception(f"psql restore failed: {stderr.decode('utf-8')}")

        # Log Restore
        AuditLogModel.log_action(
            user_id=user_id,
            action_type="DATABASE_RESTORE",
            description=f"Database SQL restoration completed from file: {file.filename}",
            ip_address=request.remote_addr,
            metadata={"filename": file.filename},
        )
        return jsonify({"success": True, "message": "Database restored successfully from SQL dump"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/reports/birthday/trigger", methods=["POST"])
@jwt_required()
def trigger_birthday_report():
    """Manually trigger the weekly birthday report"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from app.utils.reminder_service import check_and_send_morning_reminders

        check_and_send_morning_reminders(force_now=True)
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


@admin_bp.route("/archive/trigger", methods=["POST"])
@jwt_required()
def trigger_archive_cycle():
    """Manually trigger the data retention archive cycle"""
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from app.utils.archive_service import run_archive_cycle

        result = run_archive_cycle()
        return jsonify(
            {"success": True, "message": "Archive cycle completed", "details": result}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
