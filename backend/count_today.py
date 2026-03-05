import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.utils.db import get_db_connection


def count_today():
    conn = get_db_connection()
    cur = conn.cursor()
    target_date = "2026-02-23"
    cur.execute(
        "SELECT COUNT(*) FROM attendance_logs WHERE DATE(start_datetime) = %s",
        (target_date,),
    )
    print(f"Logs starting on {target_date}: {cur.fetchone()[0]}")

    cur.execute(
        "SELECT COUNT(*) FROM attendance_logs WHERE DATE(start_datetime) <= %s AND (end_datetime IS NULL OR DATE(end_datetime) >= %s)",
        (target_date, target_date),
    )
    print(f"Logs covering {target_date}: {cur.fetchone()[0]}")

    conn.close()


if __name__ == "__main__":
    count_today()
