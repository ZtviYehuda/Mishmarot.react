from app.utils.db import get_db_connection
import sys


def migrate():
    print("🔍 Starting database migration...")
    conn = get_db_connection()
    if not conn:
        print("❌ Could not connect to database. Check your .env file.")
        return

    try:
        cur = conn.cursor()

        # List of columns to check and add
        migrations = [
            ("employees", "section_id", "INTEGER"),
            ("employees", "department_id", "INTEGER"),
            ("employees", "national_id", "VARCHAR(20)"),
            ("employees", "security_clearance", "INTEGER DEFAULT 0"),
            ("employees", "police_license", "BOOLEAN DEFAULT FALSE"),
            ("employees", "emergency_contact", "VARCHAR(100)"),
        ]

        for table, column, col_type in migrations:
            try:
                # PostgreSQL safe way to add column if not exists
                query = (
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type};"
                )
                cur.execute(query)
                print(f"✅ Checked/Added column '{column}' to table '{table}'")
            except Exception as e:
                print(f"⚠️ Warning adding {column}: {e}")
                conn.rollback()
                cur = conn.cursor()

        conn.commit()
        print("\n✨ Database migration finished successfully!")
        print("🚀 You can now run the server: python run.py")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
