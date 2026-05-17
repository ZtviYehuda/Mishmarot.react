from app import create_app
from app.models.attendance_model import AttendanceModel

app = create_app()
with app.app_context():
    conn = AttendanceModel._get_conn()
    cur = conn.cursor()
    cur.execute("SELECT EXTRACT(DOY FROM '2026-03-30'::DATE)")
    print(cur.fetchone())
    conn.close()
