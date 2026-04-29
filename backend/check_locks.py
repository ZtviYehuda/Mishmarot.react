import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check_db():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        cur = conn.cursor()
        print("Checking active queries...")
        cur.execute("""
            SELECT pid, now() - xact_start AS duration, state, query 
            FROM pg_stat_activity 
            WHERE state != 'idle' 
            ORDER BY duration DESC;
        """)
        rows = cur.fetchall()
        for row in rows:
            print(f"PID: {row[0]}, Duration: {row[1]}, State: {row[2]}, Query: {row[3]}")
        
        print("\nChecking locks...")
        cur.execute("""
            SELECT blocked_locks.pid AS blocked_pid,
                   blocked_activity.query AS blocked_query,
                   blocking_locks.pid AS blocking_pid,
                   blocking_activity.query AS blocking_query
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
            JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
                 AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
                 AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                 AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                 AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                 AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                 AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                 AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                 AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                 AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                 AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
            WHERE NOT blocked_locks.granted;
        """)
        locks = cur.fetchall()
        for lock in locks:
            print(f"Blocked PID: {lock[0]}, Blocking PID: {lock[2]}")
            print(f"  Blocked Query: {lock[1]}")
            print(f"  Blocking Query: {lock[3]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

def kill_pid(pid):
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        cur = conn.cursor()
        print(f"Killing PID {pid}...")
        cur.execute("SELECT pg_terminate_backend(%s);", (pid,))
        print("Done.")
        conn.close()
    except Exception as e:
        print(f"Error killing PID: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        kill_pid(int(sys.argv[1]))
    else:
        check_db()
