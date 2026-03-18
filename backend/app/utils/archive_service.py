from datetime import datetime, timedelta
from app.utils.db import get_db_connection

def run_archive_cycle():
    """
    Moves logs older than 1 month to archive.
    Example: If today is March 16th, anything before Feb 1st is archived.
    """
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cur = conn.cursor()
        
        # Calculate cutoff: First day of previous month
        # Logic: (Today -> Replace Day 1) -> First day of current month
        # (First day current month - 1 day) -> Last day of previous month
        # (Last day previous month -> Replace Day 1) -> First day of previous month
        today = datetime.now().date()
        first_day_this_month = today.replace(day=1)
        last_month_end = first_day_this_month - timedelta(days=1)
        cutoff_date = last_month_end.replace(day=1)
        
        print(f"[ARCHIVE] Starting archive cycle. Cutoff date: {cutoff_date}")
        
        # 1. Copy to archive
        # We use INSERT ... SELECT ... ON CONFLICT (id) DO NOTHING to be idempotent
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
        """, (cutoff_date,))
        
        copied_count = cur.rowcount
        
        # 2. Delete from active
        cur.execute("""
            DELETE FROM attendance_logs
            WHERE start_datetime < %s
        """, (cutoff_date,))
        
        deleted_count = cur.rowcount
        
        conn.commit()
        print(f"[ARCHIVE] Success. Archived {copied_count} logs, deleted {deleted_count} logs.")
        return {
            "cutoff_date": str(cutoff_date),
            "archived": copied_count,
            "deleted": deleted_count
        }
    except Exception as e:
        conn.rollback()
        print(f"[ARCHIVE] Error: {e}")
        return {"error": str(e)}
    finally:
        conn.close()
