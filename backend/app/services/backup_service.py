
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
            "interval_hours": 24, # 6, 12, 24
            "last_backup": None
        }
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    return json.load(f)
            except:
                return default_config
        return default_config

    def save_config(self, new_config):
        self.config.update(new_config)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(self.config, f, indent=4)
            
    def get_config(self):
        return self.config

    def perform_backup(self):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            
            backup_data = {
                "metadata": {
                    "version": "1.0",
                    "date": datetime.datetime.now().isoformat(),
                    "type": "automatic"
                },
                "data": {}
            }
            
            tables = [
                "roles", "status_types", "service_types",
                "departments", "sections", "teams",
                "employees", "attendance_logs", "transfer_requests"
            ]
            
            for table in tables:
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
                
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"auto_backup_{timestamp}.json"
            filepath = os.path.join(BACKUP_DIR, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=4, ensure_ascii=False)
                
            self.config["last_backup"] = datetime.datetime.now().isoformat()
            self.save_config({}) # Save updated last_backup
            
            conn.close()
            return True, filepath
        except Exception as e:
            print(f"Backup failed: {e}")
            return False, str(e)

    def _backup_worker(self):
        print("Starting Backup Worker...")
        while not self.stop_event.is_set():
            try:
                if self.config["enabled"]:
                    last_backup_str = self.config.get("last_backup")
                    interval = self.config.get("interval_hours", 24)
                    
                    should_backup = False
                    if not last_backup_str:
                        should_backup = True
                    else:
                        last_backup = datetime.datetime.fromisoformat(last_backup_str)
                        diff = datetime.datetime.now() - last_backup
                        if diff.total_seconds() / 3600 >= interval:
                            should_backup = True
                    
                    if should_backup:
                        print("Performing automatic backup...")
                        self.perform_backup()
                        
                time.sleep(60) # הבדיקה רצה כל דקה
            except Exception as e:
                print(f"Error in backup worker: {e}")
                time.sleep(60)

# Global Accessor
backup_service = BackupService()
