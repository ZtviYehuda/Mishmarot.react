import os
import psycopg2
from dotenv import load_dotenv

# Explicitly load from backend/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
workspace_dir = os.path.dirname(current_dir)
dotenv_path = os.path.join(workspace_dir, 'backend', '.env')
load_dotenv(dotenv_path)

def kill_connections():
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_pass = os.getenv('DB_PASS')
    db_port = os.getenv('DB_PORT', 5432)
    
    print(f"Connecting to: {db_host}:{db_port}/{db_name} as {db_user}...")
    try:
        conn = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_pass,
            port=db_port
        )
        # Set autocommit to True because pg_terminate_backend shouldn't run in a transaction block
        conn.autocommit = True
        cur = conn.cursor()
        
        # Terminate all other backend processes on this database
        query = """
        SELECT pid, state, age(clock_timestamp(), query_start), query
        FROM pg_stat_activity
        WHERE datname = %s
          AND pid <> pg_backend_pid()
          AND backend_type = 'client backend';
        """
        cur.execute(query, (db_name,))
        backends = cur.fetchall()
        
        print(f"Found {len(backends)} backend connections to terminate.")
        
        for pid, state, age, sql in backends:
            print(f"Terminating PID: {pid} | State: {state} | Age: {age} | Query: {sql[:100]}...")
            try:
                cur.execute("SELECT pg_terminate_backend(%s);", (pid,))
                res = cur.fetchone()[0]
                print(f"  Result: {'Terminated' if res else 'Failed'}")
            except Exception as inner_e:
                print(f"  Error terminating PID {pid}: {inner_e}")
            
        cur.close()
        conn.close()
        print("Done terminating database connections.")
    except Exception as e:
        print("Error terminating backends:", e)

if __name__ == "__main__":
    kill_connections()
