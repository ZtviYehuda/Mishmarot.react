from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.attendance_model import AttendanceModel
from app.models.audit_log_model import AuditLogModel
import json
import pandas as pd
import io
from datetime import datetime

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
        try:
            identity = (
                json.loads(identity_str)
                if isinstance(identity_str, str)
                else identity_str
            )
            raw_id = identity.get("id") if isinstance(identity, dict) else identity
            try:
                user_id = int(raw_id)
            except (ValueError, TypeError):
                user_id = raw_id
        except (json.JSONDecodeError, AttributeError):
            user_id = identity_str

        from app.models.employee_model import EmployeeModel

        requester = EmployeeModel.get_employee_by_id(user_id)

        # Parse filters for drill-down
        filters = {}
        if (
            request.args.get("department_id")
            and request.args.get("department_id").isdigit()
        ):
            filters["department_id"] = int(request.args.get("department_id"))
        if request.args.get("section_id") and request.args.get("section_id").isdigit():
            filters["section_id"] = int(request.args.get("section_id"))
        if request.args.get("team_id") and request.args.get("team_id").isdigit():
            filters["team_id"] = int(request.args.get("team_id"))
        if request.args.get("status_id") and request.args.get("status_id").isdigit():
            filters["status_id"] = int(request.args.get("status_id"))
        if request.args.get("date"):
            filters["date"] = request.args.get("date")
        if request.args.get("serviceTypes"):
            filters["serviceTypes"] = request.args.get("serviceTypes")

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


@att_bp.route("/stats/comparison", methods=["GET"])
@jwt_required()
def get_comparison_stats():
    try:
        identity = get_jwt_identity()
        try:
            if isinstance(identity, str):
                identity = json.loads(identity)
        except:
            pass

        user_id = identity.get("id") if isinstance(identity, dict) else identity
        from app.models.employee_model import EmployeeModel

        requester = EmployeeModel.get_employee_by_id(user_id)
        if requester.get("is_temp_commander"):
            return (
                jsonify(
                    {
                        "error": "Unauthorized: Temp commanders cannot view comparison stats"
                    }
                ),
                403,
            )

        date = request.args.get("date")
        days = int(request.args.get("days", 1))

        # Parse filters
        filters = {}
        if request.args.get("department_id"):
            filters["department_id"] = int(request.args.get("department_id"))
        if request.args.get("section_id"):
            filters["section_id"] = int(request.args.get("section_id"))
        if request.args.get("team_id"):
            filters["team_id"] = int(request.args.get("team_id"))
        if request.args.get("status_id"):
            filters["status_id"] = int(request.args.get("status_id"))
        if request.args.get("serviceTypes"):
            filters["serviceTypes"] = request.args.get("serviceTypes")

        data = AttendanceModel.get_unit_comparison_stats(
            requesting_user=requester, date=date, days=days, filters=filters
        )
        return jsonify(data)
    except Exception as e:
        print(f"❌ Error in /stats/comparison: {e}")
        return jsonify({"error": str(e)}), 500


@att_bp.route("/stats/trend", methods=["GET"])
@jwt_required()
def get_trend_stats():
    try:
        identity = get_jwt_identity()
        try:
            if isinstance(identity, str):
                identity = json.loads(identity)
        except:
            pass

        user_id = identity.get("id") if isinstance(identity, dict) else identity
        from app.models.employee_model import EmployeeModel

        requester = EmployeeModel.get_employee_by_id(user_id)
        if requester.get("is_temp_commander"):
            return (
                jsonify(
                    {"error": "Unauthorized: Temp commanders cannot view trend stats"}
                ),
                403,
            )

        days = int(request.args.get("days", 7))
        date = request.args.get("date")

        # Parse filters
        filters = {}
        if request.args.get("department_id"):
            filters["department_id"] = int(request.args.get("department_id"))
        if request.args.get("section_id"):
            filters["section_id"] = int(request.args.get("section_id"))
        if request.args.get("team_id"):
            filters["team_id"] = int(request.args.get("team_id"))
        if request.args.get("status_id"):
            filters["status_id"] = int(request.args.get("status_id"))
        if request.args.get("serviceTypes"):
            filters["serviceTypes"] = request.args.get("serviceTypes")

        data = AttendanceModel.get_attendance_trend(
            days=days, requesting_user=requester, end_date=date, filters=filters
        )
        return jsonify(data)
    except Exception as e:
        print(f"❌ Error in /stats/trend: {e}")
        return jsonify({"error": str(e)}), 500


@att_bp.route("/daily-log", methods=["GET"])
@jwt_required()
def get_daily_log():
    try:
        identity_str = get_jwt_identity()
        try:
            identity = (
                json.loads(identity_str)
                if isinstance(identity_str, str)
                else identity_str
            )
            # Ensure user_id is an integer if possible
            raw_id = identity.get("id") if isinstance(identity, dict) else identity
            try:
                user_id = int(raw_id)
            except (ValueError, TypeError):
                user_id = raw_id  # Fallback to original (could be PN)
        except (json.JSONDecodeError, AttributeError):
            user_id = identity_str

        from app.models.employee_model import EmployeeModel

        requester = EmployeeModel.get_employee_by_id(user_id)

        date_str = request.args.get("date")
        if not date_str:
            return jsonify({"error": "Missing date parameter"}), 400

        filters = {}
        if (
            request.args.get("department_id")
            and request.args.get("department_id").isdigit()
        ):
            filters["department_id"] = int(request.args.get("department_id"))
        if request.args.get("section_id") and request.args.get("section_id").isdigit():
            filters["section_id"] = int(request.args.get("section_id"))
        if request.args.get("team_id") and request.args.get("team_id").isdigit():
            filters["team_id"] = int(request.args.get("team_id"))
        if request.args.get("status_id") and request.args.get("status_id").isdigit():
            filters["status_id"] = int(request.args.get("status_id"))

        logs = AttendanceModel.get_daily_attendance_log(
            date_str, requesting_user=requester, filters=filters
        )
        return jsonify(logs)
    except Exception as e:
        import traceback

        with open("backend_error.log", "a") as f:
            f.write(f"\n--- ERROR in /daily-log at {datetime.now()} ---\n")
            f.write(traceback.format_exc())
            f.write("\n")
        print(f"❌ Error in /daily-log: {e}")
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
        # Handle Delegation (New Feature)
        delegation_data = data.get("delegation")
        if delegation_data and delegation_data.get("delegate_id"):
            try:
                from app.models.employee_model import EmployeeModel

                del_id = delegation_data["delegate_id"]
                # Use status dates for delegation period
                d_start = start_date or datetime.now()
                d_end = end_date

                del_success, del_res = EmployeeModel.create_delegation(
                    current_user_id, del_id, d_start, d_end
                )
                if del_success:
                    print(
                        f"[INFO] Created delegation from {current_user_id} to {del_id}"
                    )
                    # We'll attach this to the response
                    delegation_info = del_res
                else:
                    print(f"[ERROR] Failed to create delegation: {del_res}")
            except Exception as e:
                print(f"[ERROR] Exception creating delegation: {e}")

    if success:
        AuditLogModel.log_action(
            user_id=current_user_id,
            action_type="STATUS_UPDATE",
            description=f"Updated status for employee {target_id} to {status_id}",
            target_id=target_id,
            ip_address=request.remote_addr,
            metadata={
                "status_id": status_id,
                "start_date": start_date,
                "end_date": end_date,
                "note": note,
            },
        )
        resp = {"success": True, "message": "הסטטוס עודכן"}
        if "delegation_info" in locals():
            resp["delegation"] = delegation_info
        return jsonify(resp)
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
        AuditLogModel.log_action(
            user_id=current_user_id,
            action_type="BULK_STATUS_UPDATE",
            description=f"Updated status for {len(updates)} employees",
            ip_address=request.remote_addr,
            metadata={"count": len(updates)},
        )
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


@att_bp.route("/history/<int:emp_id>", methods=["GET"])
@jwt_required()
def get_employee_history(emp_id):
    try:
        history = AttendanceModel.get_employee_history(emp_id)
        return jsonify(history)
    except Exception as e:
        print(f"❌ Error in /history/{emp_id}: {e}")
        return jsonify({"error": str(e)}), 500


@att_bp.route("/history/<int:emp_id>/export", methods=["GET"])
@jwt_required()
def export_employee_history(emp_id):
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        history = AttendanceModel.get_employee_history_export(
            emp_id, start_date, end_date
        )

        if not history:
            return jsonify({"error": "No history found for specified range"}), 404

        # Convert to DataFrame
        df = pd.DataFrame(history)

        # Rename columns for Hebrew Report
        columns = {
            "status_name": "סטטוס",
            "start_datetime": "התחלה",
            "end_datetime": "סיום",
            "note": "הערה",
            "reported_by_name": 'דווח ע"י',
        }

        valid_cols = [c for c in columns.keys() if c in df.columns]
        df = df[valid_cols].rename(columns=columns)

        # Format dates
        if "התחלה" in df.columns:
            df["התחלה"] = pd.to_datetime(df["התחלה"]).dt.strftime("%d/%m/%Y %H:%M")
        if "סיום" in df.columns:
            df["סיום"] = pd.to_datetime(df["סיום"]).apply(
                lambda x: x.strftime("%d/%m/%Y %H:%M") if pd.notnull(x) else "-"
            )

        # Export to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            workbook = writer.book
            worksheet = workbook.create_sheet("History")
            writer.sheets["History"] = worksheet

            # Title
            worksheet.merge_cells("A1:E1")
            worksheet["A1"] = f"היסטוריית דיווחים - שוטר {emp_id}"
            worksheet.sheet_view.rightToLeft = True

            df.to_excel(writer, index=False, sheet_name="History", startrow=2)

        output.seek(0)
        filename = f"history_{emp_id}"
        if start_date:
            filename += f"_{start_date}"
        filename += ".xlsx"

        return send_file(
            output,
            download_name=filename,
            as_attachment=True,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    except Exception as e:
        print(f"❌ Error exporting history: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
