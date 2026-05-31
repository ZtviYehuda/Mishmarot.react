import os
import psycopg2
from dotenv import load_dotenv

# Explicitly load from backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(workspace_dir, 'backend', '.env')
load_dotenv(dotenv_path)

def check_locks():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT', 5432)
        )
        cur = conn.cursor()
        
        # Query to find locks and blocking queries
        query = """
        SELECT
            coalesce(blockingl.relation::regclass::text, blockingl.locktype) as locked_item,
            blockeda.pid as blocked_pid,
            blockeda.query as blocked_query,
            blockinga.pid as blocking_pid,
            blockinga.query as blocking_query
        FROM pg_catalog.pg_locks blockedl
        JOIN pg_catalog.pg_stat_activity blockeda ON blockeda.pid = blockedl.pid
        JOIN pg_catalog.pg_locks blockingl 
            ON blockingl.pid != blockedl.pid
            AND (blockingl.relation = blockedl.relation OR (blockingl.relation IS NULL AND blockedl.relation IS NULL))
        JOIN pg_catalog.pg_stat_activity blockinga ON blockinga.pid = blockingl.pid
        WHERE NOT blockedl.granted;
        """
        cur.execute(query)
        locks = cur.fetchall()
        print("--- BLOCKED QUERIES ---")
        if not locks:
            print("No blocked queries found.")
        for lock in locks:
            print(f"Locked Item: {lock[0]}")
            print(f"Blocked PID: {lock[1]} | Query: {lock[2]}")
            print(f"Blocking PID: {lock[3]} | Query: {lock[4]}")
            print("-" * 40)
            
        print("\n--- ACTIVE CONNECTIONS ---")
        cur.execute("SELECT pid, query, state, age(clock_timestamp(), query_start), backend_type FROM pg_stat_activity WHERE state != 'idle';")
        active = cur.fetchall()
        for act in active:
            print(f"PID: {act[0]} | State: {act[2]} | Age: {act[3]} | Type: {act[4]}")
            print(f"Query: {act[1]}")
            print("-" * 40)
            
        cur.close()
        conn.close()
    except Exception as e:
        print("Error checking locks:", e)

if __name__ == "__main__":
    check_locks()
