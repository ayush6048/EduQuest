import json
import mysql.connector
from mysql.connector import Error
import os
import sys

# Configuration matching app.py
DB_CONFIG = {
    'host': 'localhost',
    'database': 'eduquest',
    'user': 'root',
    'password': 'root'
}

DB_FILE = 'db.json'

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"No {DB_FILE} found. Skipping migration.")
        return

    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            print("Connected to MySQL database")
            cursor = conn.cursor()

            with open(DB_FILE, 'r') as f:
                data = json.load(f)

            for table_name, items in data.items():
                print(f"Migrating table: {table_name}...")
                
                # Check if table has data already
                # (Optional: handle case where table doesn't exist yet?)
                # schema.sql should be run first.
                # Check if table has data already -> Removed skipping logic to ensure missing data is added.
                # try:
                #     cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                #     count = cursor.fetchone()[0]
                #     if count > 0:
                #         print(f"Table {table_name} is not empty. Checking for missing records...")
                #         # continue # Don't continue, let it try to insert individual records
                # except Error as err:
                #      print(f"Table {table_name} does not exist or error: {err}")
                #      continue

                for item in items:
                    columns = list(item.keys())
                    values = list(item.values())
                    placeholders = ", ".join(["%s"] * len(columns))
                    col_str = ", ".join(columns)
                    
                    # Construct INSERT statement
                    sql = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders})"
                    
                    try:
                        cursor.execute(sql, values)
                    except Error as e:
                        print(f"Failed to insert item {item.get('id', '?')} into {table_name}: {e}")

            conn.commit()
            print("Migration completed successfully!")

    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        sys.exit(1)
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    migrate()
