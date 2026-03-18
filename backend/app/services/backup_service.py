
import os
import json
import datetime
import threading
import time
from app.utils.db import get_db_connection

BACKUP_DIR = os.path.join(os.getcwd(), 'backups')
CONFIG_FILE = os.path.join(os.getcwd(), 'backup_config.json')

if not os.path.exists(BACKUP_DIR):
    os.makedirs(BACKUP_DIR)

class BackupService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(BackupService, cls).__new__(cls)
                    cls._instance._init()
        return cls._instance

    def _init(self):
        self.config = self._load_config()
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._backup_worker, daemon=True)
        self.thread.start()

    def _load_config(self):
        default_config = {
            "enabled": False,
            "interval_days": 1,  # 1=daily, 7=weekly
            "last_backup": None
        }
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    saved = json.load(f)
                    # Migrate old interval_hours to interval_days
                    if "interval_hours" in saved and "interval_days" not in saved:
                        hours = saved.pop("interval_hours", 24)
                        saved["interval_days"] = 7 if hours >= 168 else 1
                    return {**default_config, **saved}
            except:
                return default_config
        return default_config

    def save_config(self, new_config):
        self.config.update(new_config)
        # Remove legacy key if present
        self.config.pop("interval_hours", None)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(self.config, f, indent=4)
            
    def get_config(self):
        return self.config

    def _run_archive(self):
        """Run data retention archive cycle before backup"""
        try:
            from app.utils.archive_service import run_archive_cycle
            result = run_archive_cycle()
            print(f"[BACKUP] Archive cycle completed: {result}")
        except Exception as e:
            print(f"[BACKUP] Archive cycle failed (non-fatal): {e}")

    def perform_backup(self):
        try:
            # 1. Run archive cycle first (move old data out of active logs)
            self._run_archive()

            conn = get_db_connection()
            cur = conn.cursor()
            
            backup_data = {
                "metadata": {
                    "version": "2.0",
                    "date": datetime.datetime.now().isoformat(),
                    "type": "automatic"
                },
                "data": {}
            }
            
            tables = [
                "roles", "status_types", "service_types",
                "departments", "sections", "teams",
                "employees", "attendance_logs", "attendance_logs_archive",
                "transfer_requests", "system_settings"
            ]
            
            for table in tables:
                try:
                    cur.execute(f"SELECT * FROM {table}")
                    columns = [desc[0] for desc in cur.description]
                    rows = cur.fetchall()
                    
                    table_data = []
                    for row in rows:
                        item = {}
                        for i, col in enumerate(columns):
                            val = row[i]
                            if isinstance(val, (datetime.date, datetime.datetime)):
                                val = val.isoformat()
                            item[col] = val
                        table_data.append(item)
                    
                    backup_data["data"][table] = table_data
                except Exception as te:
                    print(f"[BACKUP] Skipping table {table}: {te}")
                    backup_data["data"][table] = []
                
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"auto_backup_{timestamp}.json"
            filepath = os.path.join(BACKUP_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=4, ensure_ascii=False)
                
            self.config["last_backup"] = datetime.datetime.now().isoformat()
            self.save_config({})
            
            conn.close()
            print(f"[BACKUP] Backup saved: {filename}")
            return True, filepath
        except Exception as e:
            print(f"[BACKUP] Backup failed: {e}")
            return False, str(e)

    def _backup_worker(self):
        print("Starting Backup Worker...")
        while not self.stop_event.is_set():
            try:
                if self.config.get("enabled"):
                    last_backup_str = self.config.get("last_backup")
                    interval_days = self.config.get("interval_days", 1)
                    interval_seconds = interval_days * 86400  # convert days to seconds
                    
                    should_backup = False
                    if not last_backup_str:
                        should_backup = True
                    else:
                        last_backup = datetime.datetime.fromisoformat(last_backup_str)
                        diff = datetime.datetime.now() - last_backup
                        if diff.total_seconds() >= interval_seconds:
                            should_backup = True
                    
                    if should_backup:
                        print("[BACKUP] Starting scheduled backup...")
                        self.perform_backup()
                        
                time.sleep(300)  # Check every 5 minutes
            except Exception as e:
                print(f"[BACKUP] Error in backup worker: {e}")
                time.sleep(300)

# Global Accessor
backup_service = BackupService()
