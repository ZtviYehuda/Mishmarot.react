from app.models.audit_log_model import AuditLogModel
from app.utils.db import get_db_connection

if __name__ == "__main__":
    print("Initializing audit_logs table...")
    try:
        AuditLogModel.init_table()
        print("Table 'audit_logs' created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
