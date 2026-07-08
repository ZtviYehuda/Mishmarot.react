import os
import json
import datetime
import threading
import time

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
            "max_backups": 15,   # number of backups to retain (-1 = never delete)
            "locked_backups": [], # filenames of backups that are protected from auto-pruning
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

    def toggle_lock_backup(self, filename):
        """Add or remove a backup from the locked list"""
        clean_name = os.path.basename(filename)
        locked_list = self.config.get("locked_backups", [])
        if clean_name in locked_list:
            locked_list.remove(clean_name)
            action = "unlocked"
        else:
            locked_list.append(clean_name)
            action = "locked"
        self.save_config({"locked_backups": locked_list})
        return True, action

    def list_backups(self):
        """List all SQL backup files in the backup directory with their details"""
        if not os.path.exists(BACKUP_DIR):
            return []
        
        locked_list = self.config.get("locked_backups", [])
        backups = []
        for file in os.listdir(BACKUP_DIR):
            if file.endswith('.sql'):
                filepath = os.path.join(BACKUP_DIR, file)
                stat = os.stat(filepath)
                created_time = datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
                size_kb = round(stat.st_size / 1024, 2)
                backups.append({
                    "filename": file,
                    "created_at": created_time,
                    "size_kb": size_kb,
                    "is_locked": file in locked_list
                })
        # Sort by creation time descending
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return backups

    def get_backup_filepath(self, filename):
        """Retrieve path to a specific backup file safely"""
        # Security check: prevent directory traversal
        clean_name = os.path.basename(filename)
        filepath = os.path.join(BACKUP_DIR, clean_name)
        if os.path.exists(filepath) and clean_name.endswith('.sql'):
            return filepath
        return None

    def delete_backup(self, filename):
        """Delete a specific backup file safely"""
        clean_name = os.path.basename(filename)
        filepath = os.path.join(BACKUP_DIR, clean_name)
        if os.path.exists(filepath) and clean_name.endswith('.sql'):
            os.remove(filepath)
            return True
        return False

    def _run_archive(self):
        """Run data retention archive cycle before backup"""
        try:
            from app.utils.archive_service import run_archive_cycle
            result = run_archive_cycle()
            print(f"[BACKUP] Archive cycle completed: {result}")
        except Exception as e:
            print(f"[BACKUP] Archive cycle failed (non-fatal): {e}")

    def prune_old_backups(self):
        """Removes the oldest SQL backup files if the total count exceeds max_backups configuration, skipping locked files"""
        max_backups = self.config.get("max_backups", 15)
        if max_backups == -1:
            return  # "Never delete" selected

        backups = self.list_backups()
        
        # Only count and prune backups that are NOT locked
        unlocked_backups = [b for b in backups if not b.get("is_locked")]
        
        if len(unlocked_backups) <= max_backups:
            return

        # Prune oldest unlocked backups
        files_to_delete = unlocked_backups[max_backups:]
        for backup in files_to_delete:
            try:
                self.delete_backup(backup["filename"])
                print(f"[BACKUP] Pruned old backup file: {backup['filename']}")
            except Exception as pe:
                print(f"[BACKUP] Failed to prune {backup['filename']}: {pe}")

    def perform_backup(self):
        try:
            # 1. Run archive cycle first (move old data out of active logs)
            self._run_archive()

            timestamp = datetime.datetime.now().strftime('%d_%m_%Y__%H_%M')
            filename = f"auto_backup_{timestamp}.sql"
            filepath = os.path.join(BACKUP_DIR, filename)

            # Gather environment variables for pg_dump
            db_host = os.environ.get("DB_HOST", "localhost")
            db_name = os.environ.get("DB_NAME", "postgres")
            db_user = os.environ.get("DB_USER", "postgres")
            db_pass = os.environ.get("DB_PASS", "8245")
            db_port = os.environ.get("DB_PORT", "5432")

            # Resolve executable path for pg_dump
            pg_dump_path = "pg_dump"
            if os.name == "nt":
                possible_paths = [
                    r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
                    r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
                    r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
                    r"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
                    r"C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\pg_dump.exe"
                ]
                for p in possible_paths:
                    if os.path.exists(p):
                        pg_dump_path = p
                        break

            # Run pg_dump using subprocess
            import subprocess
            env = os.environ.copy()
            env["PGPASSWORD"] = db_pass

            # Exporting data-only with SQL inserts and cleanup commands to match target schema
            cmd = [
                pg_dump_path,
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "--clean",          # Clean (drop) database objects before recreating
                "--if-exists",      # Use IF EXISTS when dropping objects
                "-f", filepath
            ]

            process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()

            if process.returncode != 0:
                raise Exception(f"pg_dump failed: {stderr.decode('utf-8')}")

            self.config["last_backup"] = datetime.datetime.now().isoformat()
            self.save_config({})

            print(f"[BACKUP] SQL Backup saved: {filename}")
            
            # Prune old backups based on max_backups limit
            self.prune_old_backups()
            
            return True, filepath
        except Exception as e:
            print(f"[BACKUP] SQL Backup failed: {e}")
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
