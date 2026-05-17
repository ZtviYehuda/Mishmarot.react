import os
import sys
import json
from datetime import date

sys.path.append(os.getcwd())
from app.models.attendance_model import AttendanceModel


def mock_request():
    target_date = "2026-02-23"
    # Mocking a requester (likely admin based on screenshot)
    requester = {"id": 1, "is_admin": True}

    # Mocking filters from frontend
    filters = {"date": target_date}

    print(f"Mocking /stats for date {target_date}...")
    stats = AttendanceModel.get_dashboard_stats(
        requesting_user=requester, filters=filters
    )

    for s in stats:
        print(f"Status: {s['status_name']} | Count: {s['count']}")

    total = sum(s["count"] for s in stats if s["status_id"] is not None)
    print(f"Total with Status: {total}")

    null_count = next((s["count"] for s in stats if s["status_id"] is None), 0)
    print(f"Total with NULL Status: {null_count}")


if __name__ == "__main__":
    mock_request()
