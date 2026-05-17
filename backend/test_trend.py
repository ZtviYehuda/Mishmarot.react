import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.models.attendance_model import AttendanceModel


def test_trend():
    print("Testing Attendance Trend Stats...")
    # Mock a requester (admin)
    requester = {"id": 1, "is_admin": True}

    trend = AttendanceModel.get_attendance_trend(days=7, requesting_user=requester)
    print(f"{'Date':<10} | {'Total':<5} | {'Present':<5}")
    print("-" * 30)
    for t in trend:
        print(
            f"{t['date_str']:<10} | {t['total_employees']:<5} | {t['present_count']:<5}"
        )


if __name__ == "__main__":
    test_trend()
