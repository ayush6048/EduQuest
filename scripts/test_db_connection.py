import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    'host': 'localhost',
    'database': 'eduquest',
    'user': 'root',
    'password': 'root' 
}

def test_connection():
    print(f"Attempting to connect to MySQL with: {DB_CONFIG}")
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("SUCCESS: Connected to MySQL database")
            
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            record = cursor.fetchone()
            print("You're connected to database: ", record)
            
            cursor.execute("SELECT count(*) FROM faculty")
            count = cursor.fetchone()
            print(f"Number of faculty records: {count[0]}")
            
            cursor.close()
            connection.close()
            return True
    except Error as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_connection()
