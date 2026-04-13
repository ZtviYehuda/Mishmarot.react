"""
Automatic Audit Log Rotation
=============================
Moves audit_logs older than RETENTION_DAYS from the database into
compressed JSON files under  backend/audit_archives/.
Runs automatically on app startup (at most once per day).
"""

import os
import json
import datetime
import gzip
from app.utils.db import get_db_connection
from psycopg2.extras import RealDictCursor

RETENTION_DAYS = 7  # Keep only the last 7 days in DB
ARCHIVE_DIR = os.path.join(os.getcwd(), "archives", "audit")
LAST_RUN_FILE = os.path.join(ARCHIVE_DIR, ".last_rotation")


def _ensure_dir():
    os.makedirs(ARCHIVE_DIR, exist_ok=True)


def _already_ran_today() -> bool:
    """Return True if rotation already ran today (prevent duplicate work)."""
    if not os.path.exists(LAST_RUN_FILE):
        return False
    try:
        with open(LAST_RUN_FILE, "r") as f:
            last = f.read().strip()
        return last == datetime.date.today().isoformat()
    except Exception:
        return False


def _mark_completed():
    with open(LAST_RUN_FILE, "w") as f:
        f.write(datetime.date.today().isoformat())


def _datetime_handler(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def rotate_audit_logs():
    """
    Main rotation function.
    1. SELECT all logs older than RETENTION_DAYS
    2. Write them to a gzipped JSON file
    3. DELETE them from the database
    """
    if _already_ran_today():
        return

    _ensure_dir()

    conn = get_db_connection()
    if not conn:
        return

    cutoff = datetime.datetime.now() - datetime.timedelta(days=RETENTION_DAYS)

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Fetch old logs
            cur.execute(
                """
                SELECT al.*,
                       e.first_name || ' ' || e.last_name as user_name
                FROM audit_logs al
                LEFT JOIN employees e ON al.user_id = e.id
                WHERE al.created_at < %s
                ORDER BY al.created_at ASC
                """,
                (cutoff,),
            )
            old_logs = cur.fetchall()

            if not old_logs:
                print(f"✅ Audit rotation: No logs older than {RETENTION_DAYS} days. Nothing to archive.")
                _mark_completed()
                return

            # 2. Write to compressed file
            date_str = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
            archive_file = os.path.join(ARCHIVE_DIR, f"audit_{date_str}.json.gz")

            json_bytes = json.dumps(
                old_logs, default=_datetime_handler, ensure_ascii=False, indent=2
            ).encode("utf-8")

            with gzip.open(archive_file, "wb") as gz:
                gz.write(json_bytes)

            # 3. Delete from DB
            ids = [log["id"] for log in old_logs]
            cur.execute("DELETE FROM audit_logs WHERE id = ANY(%s)", (ids,))
            conn.commit()

            file_size_kb = os.path.getsize(archive_file) / 1024
            print(
                f"✅ Audit rotation: Archived {len(old_logs)} logs → {os.path.basename(archive_file)} "
                f"({file_size_kb:.1f} KB). DB cleaned."
            )

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Audit rotation error: {e}")
        return {"error": str(e)}
    finally:
        if conn:
            conn.close()
        _mark_completed()


def get_archive_summary():
    """Return a list of archive files with metadata for the admin UI."""
    _ensure_dir()
    archives = []
    for fname in sorted(os.listdir(ARCHIVE_DIR), reverse=True):
        if not fname.endswith(".json.gz"):
            continue
        fpath = os.path.join(ARCHIVE_DIR, fname)
        stat = os.stat(fpath)
        archives.append({
            "filename": fname,
            "size_kb": round(stat.st_size / 1024, 1),
            "created_at": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        })
    return archives


def read_archive_file(filename: str):
    """Read and decompress an archive file, return the JSON content."""
    fpath = os.path.join(ARCHIVE_DIR, filename)
    if not os.path.exists(fpath):
        return None
    with gzip.open(fpath, "rb") as gz:
        return json.loads(gz.read().decode("utf-8"))
