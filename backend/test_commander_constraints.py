import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import get_db_connection

def check_commander_constraints():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to DB.")
        return
    
    try:
        cur = conn.cursor()
        
        print("=" * 60)
        print("TESTING COMMANDER CONSTRAINTS")
        print("=" * 60)
        
        # Get a team
        cur.execute("SELECT id, name FROM teams LIMIT 1")
        team = cur.fetchone()
        if not team:
            print("No teams found")
            return
            
        team_id = team[0]
        team_name = team[1]
        print(f"\nTesting with Team ID: {team_id}")
        
        # Get two commanders
        cur.execute("SELECT id, first_name, last_name FROM employees WHERE is_commander = TRUE LIMIT 2")
        commanders = cur.fetchall()
        
        if len(commanders) < 2:
            print("Not enough commanders found")
            return
        
        emp1_id = commanders[0][0]
        emp2_id = commanders[1][0]
        
        print(f"\nCommander 1 ID: {emp1_id}")
        print(f"Commander 2 ID: {emp2_id}")
        
        # Step 1: Set first commander
        print(f"\n[STEP 1] Setting commander {emp1_id} for team {team_id}...")
        cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp1_id, team_id))
        conn.commit()
        
        cur.execute("SELECT commander_id FROM teams WHERE id = %s", (team_id,))
        current = cur.fetchone()[0]
        print(f"Result: commander_id = {current}")
        
        # Step 2: Set second commander (should replace the first)
        print(f"\n[STEP 2] Setting commander {emp2_id} for THE SAME team {team_id}...")
        cur.execute("UPDATE teams SET commander_id = %s WHERE id = %s", (emp2_id, team_id))
        conn.commit()
        
        cur.execute("SELECT commander_id FROM teams WHERE id = %s", (team_id,))
        current = cur.fetchone()[0]
        print(f"Result: commander_id = {current}")
        
        # Analysis
        print("\n" + "=" * 60)
        print("ANALYSIS")
        print("=" * 60)
        
        if current == emp2_id:
            print("\nSTATUS: The second commander REPLACED the first one")
            print("\nCONCLUSION: The database allows overwriting commanders")
            print("            without any constraints or warnings")
            print("\nRISK: Multiple employees can be assigned as commanders")
            print("      but only the last one will be recorded")
            print("\nRECOMMENDATIONS:")
            print("1. Add UNIQUE constraint on commander_id if only one")
            print("   commander per unit is allowed")
            print("2. Add application-level validation before updates")
            print("3. Consider many-to-many relationship if multiple")
            print("   commanders per unit are needed")
            print("4. Add triggers to prevent silent overwrites")
        
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    check_commander_constraints()
