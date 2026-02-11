from app.utils.db import get_db_connection
from werkzeug.security import generate_password_hash


def setup_database():
    """הרצת סקריפט הקמת הטבלאות והנתונים הראשוניים"""
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB for setup.")
        return

    try:
        cur = conn.cursor()

        # 1. יצירת טבלאות תשתית (ללא מפתחות זרים עדיין למניעת מעגליות)
        tables = [
            """CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                commander_id INTEGER
            );""",
            """CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                department_id INTEGER,
                name VARCHAR(100) NOT NULL,
                commander_id INTEGER
            );""",
            """CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                section_id INTEGER,
                name VARCHAR(100) NOT NULL,
                commander_id INTEGER
            );""",
            """CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT
            );""",
            """CREATE TABLE IF NOT EXISTS service_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL
            );""",
            """CREATE TABLE IF NOT EXISTS status_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                code VARCHAR(50),
                color VARCHAR(20),
                is_presence BOOLEAN DEFAULT FALSE
            );""",
            """CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                personal_number VARCHAR(20) UNIQUE NOT NULL,
                national_id VARCHAR(9) UNIQUE,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                phone_number VARCHAR(20),
                password_hash VARCHAR(255),
                must_change_password BOOLEAN DEFAULT TRUE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_commander BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                
                team_id INTEGER,
                section_id INTEGER,
                department_id INTEGER,
                role_id INTEGER,
                service_type_id INTEGER,
                
                birth_date DATE,
                enlistment_date DATE,
                discharge_date DATE,
                assignment_date DATE,
                city VARCHAR(100),
                security_clearance INTEGER DEFAULT 0,
                police_license BOOLEAN DEFAULT FALSE,
                emergency_contact VARCHAR(100),
                notif_sick_leave BOOLEAN DEFAULT TRUE,
                notif_transfers BOOLEAN DEFAULT TRUE,
                notif_morning_report BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS attendance_logs (
                id BIGSERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(id),
                status_type_id INTEGER REFERENCES status_types(id),
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP,
                note TEXT,
                reported_by INTEGER REFERENCES employees(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS transfer_requests (
                id SERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(id),
                requester_id INTEGER REFERENCES employees(id),
                source_type VARCHAR(20),
                source_id INTEGER,
                target_type VARCHAR(20) NOT NULL, 
                target_id INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                reason TEXT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolved_by INTEGER REFERENCES employees(id)
            );""",
            """CREATE TABLE IF NOT EXISTS notification_reads (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                notification_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(20),
                link VARCHAR(255),
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, notification_id)
            );""",
            """CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(50) PRIMARY KEY,
                value TEXT,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS support_tickets (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                personal_number VARCHAR(20) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );""",
        ]

        for table in tables:
            cur.execute(table)

        # Insert default system settings
        cur.execute(
            """
            INSERT INTO system_settings (key, value, description)
            VALUES ('alerts_weekend_enabled', 'false', 'האם לאפשר שליחת התראות דיווח בימי שישי ושבת')
            ON CONFLICT (key) DO NOTHING;
        """
        )

        # --- Migration: Add missing columns if table already existed ---
        try:
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS section_id INTEGER;"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS national_id VARCHAR(9) UNIQUE;"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS notif_sick_leave BOOLEAN DEFAULT TRUE;"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS notif_transfers BOOLEAN DEFAULT TRUE;"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS notif_morning_report BOOLEAN DEFAULT TRUE;"
            )
            cur.execute(
                "ALTER TABLE status_types ADD COLUMN IF NOT EXISTS code VARCHAR(50);"
            )

            # Transfer Requests Migrations
            cur.execute(
                "ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS source_type VARCHAR(20);"
            )
            cur.execute(
                "ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS source_id INTEGER;"
            )
            cur.execute(
                "ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS reason TEXT;"
            )

            # --- Email & Verification Migrations ---
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);"
            )
            cur.execute(
                "ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS verification_codes (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    code VARCHAR(10) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE
                );
            """
            )
        except Exception as e:
            print(f"ℹ️ Migration info: {e}")
            conn.rollback()
            cur = conn.cursor()

        # 2. הזרקת נתוני בסיס (Roles, Statuses)
        cur.execute("SELECT COUNT(*) FROM roles")
        if cur.fetchone()[0] == 0:
            cur.execute(
                "INSERT INTO roles (name) VALUES ('מנהל מערכת'), ('מפקד'), ('חייל')"
            )

        cur.execute("SELECT COUNT(*) FROM status_types")
        if cur.fetchone()[0] == 0:
            cur.execute(
                """
                INSERT INTO status_types (name, color, is_presence) VALUES 
                ('משרד', '#22c55e', TRUE),
                ('חופשה', '#3b82f6', FALSE),
                ('מחלה', '#ef4444', FALSE),
                ('קורס', '#8b5cf6', TRUE),
                ('תגבור', '#f59e0b', TRUE),
                ('חו"ל', '#0ea5e9', FALSE)
            """
            )

        # 3. יצירת Admin דיפולטיבי (אם לא קיים)
        # 3. יצירת/תיקון Admin דיפולטיבי
        cur.execute(
            "SELECT id, password_hash FROM employees WHERE personal_number = 'admin'"
        )
        admin_row = cur.fetchone()

        admin_pw_hash = generate_password_hash("123456")

        if not admin_row:
            cur.execute(
                """
                INSERT INTO employees 
                (first_name, last_name, personal_number, national_id, password_hash, is_admin, is_commander, must_change_password)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    "Admin",
                    "System",
                    "admin",
                    "000000000",
                    admin_pw_hash,
                    True,
                    True,
                    False,
                ),
            )
            print("✅ Default Admin created: User: admin, Pass: 123456")
        else:
            # בדיקה האם המשתמש קיים אך עם נתונים שגויים (למשל hash לא תקין)
            current_hash = admin_row[1]
            if not current_hash or not str(current_hash).startswith("scrypt"):
                print("⚠️  Admin user found with invalid data. Resetting admin...")
                cur.execute(
                    """
                    UPDATE employees 
                    SET password_hash = %s,
                        first_name = 'Admin',
                        last_name = 'System',
                        national_id = '000000000',
                        is_admin = TRUE,
                        is_commander = TRUE,
                        must_change_password = FALSE,
                        phone_number = NULL, -- Reset potentially corrupt fields
                        role_id = NULL -- Ensure no random role
                    WHERE id = %s
                    """,
                    (admin_pw_hash, admin_row[0]),
                )
                print("✅ Default Admin reset: User: admin, Pass: 123456")

        # 2b. הזרקת נתוני Service Types
        # 2b. הזרקת נתוני Service Types
        cur.execute("SELECT COUNT(*) FROM service_types")
        if cur.fetchone()[0] == 0:
            service_types = [
                "קבע - קצין",
                "קבע - נגד",
                'שמ"ז',
                "שירות לאומי",
                'שח"מ',
                'שח"מ חרדי',
                "שירות אזרחי ביטחוני",
                "מתנדב",
            ]

            for st in service_types:
                cur.execute(
                    """
                    INSERT INTO service_types (name)
                    VALUES (%s)
                """,
                    (st,),
                )

            print("✅ Service Types inserted successfully.")

        conn.commit()
        print("✅ Database setup completed successfully.")

    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        conn.rollback()
    finally:
        conn.close()
