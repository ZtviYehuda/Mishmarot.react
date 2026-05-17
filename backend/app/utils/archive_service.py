from datetime import datetime, timedelta
from app.utils.db import get_db_connection
from app.utils.audit_rotation import rotate_audit_logs

def run_archive_cycle():
    """
    Moves logs older than 1 month (attendance) and 1 week (audit) to archive.
    """
    conn = get_db_connection()
    if not conn:
        return
    
    results = {}
    
    try:
        cur = conn.cursor()
        
        # --- 1. ATTENDANCE LOGS (Monthly) ---
        today = datetime.now().date()
        first_day_this_month = today.replace(day=1)
        last_month_end = first_day_this_month - timedelta(days=1)
        cutoff_date_attendance = last_month_end.replace(day=1)
        
        print(f"[ARCHIVE] Starting attendance archive. Cutoff: {cutoff_date_attendance}")
        
        cur.execute("""
            INSERT INTO attendance_logs_archive (
                id, employee_id, status_type_id, start_datetime, end_datetime, 
                note, reported_by, is_verified, verified_at, created_at
            )
            SELECT 
                id, employee_id, status_type_id, start_datetime, end_datetime, 
                note, reported_by, is_verified, verified_at, created_at
            FROM attendance_logs
            WHERE start_datetime < %s
            ON CONFLICT (id) DO NOTHING
        """, (cutoff_date_attendance,))
        copied_att = cur.rowcount
        
        cur.execute("DELETE FROM attendance_logs WHERE start_datetime < %s", (cutoff_date_attendance,))
        deleted_att = cur.rowcount
        
        results["attendance"] = {"archived": copied_att, "deleted": deleted_att}

        # --- 2. AUDIT LOGS (Weekly, to FILE) ---
        # Using unified service
        audit_res = rotate_audit_logs()
        results["audit"] = audit_res or {"status": "no activity"}

        conn.commit()
        return results
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[ARCHIVE] Error: {e}")
        return {"error": str(e)}
    finally:
        if conn:
            conn.close()
