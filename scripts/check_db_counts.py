import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    'host': 'localhost',
    'database': 'eduquest',
    'user': 'root',
    'password': 'root'
}

def check_counts():
    print("Checking Table Counts...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        tables = ['programs', 'branches', 'courses', 'faculty', 'regulations']
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"{table}: {count}")
                
                # Print sample if 0
                if count == 0:
                    print(f"  WARNING: {table} is empty!")
            except Error as err:
                 print(f"Error reading {table}: {err}")

        cursor.close()
        conn.close()
    except Error as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_counts()
