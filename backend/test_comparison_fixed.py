import os
import sys
from datetime import date

sys.path.append(os.getcwd())
from app.models.attendance_model import AttendanceModel


def test_comparison_fixed():
    print("Testing Unit Comparison Stats (Fixed)...")
    requester = {"id": 1, "is_admin": True}
    target_date = "2026-02-23"

    # filters can contain date
    filters = {"date": target_date}

    stats = AttendanceModel.get_unit_comparison_stats(
        requesting_user=requester, date=target_date, days=1, filters=filters
    )

    print(
        f"{'Unit':<30} | {'Total':<5} | {'Present':<5} | {'Absent':<5} | {'Unknown':<5}"
    )
    print("-" * 65)
    for s in stats:
        print(
            f"{s['unit_name']:<30} | {s['total_count']:<5} | {s['present_count']:<5} | {s['absent_count']:<5} | {s['unknown_count']:<5}"
        )


if __name__ == "__main__":
    test_comparison_fixed()
