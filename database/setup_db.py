import mysql.connector
from mysql.connector import Error

# Config to connect to MySQL Server (no specific DB yet)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root'
}

def setup_database():
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Read schema.sql
        print("Reading schema.sql...")
        with open('schema.sql', 'r') as f:
            schema = f.read()
            
        # Execute statements manually
        print("Executing schema...")
        commands = schema.split(';')
        
        for command in commands:
            if command.strip():
                try:
                    cursor.execute(command)
                except Error as err:
                    print(f"Command skipped: {err}. \nCommand: {command[:50]}...")
        
        conn.commit()
        print("Schema applied successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Error as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    setup_database()
