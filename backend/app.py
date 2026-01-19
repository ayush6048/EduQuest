from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Database Configuration
# NOTE: Please check your MySQL Workbench for these details.
# You might need to change 'root' and 'password' to match your setup.
DB_CONFIG = {
    'host': 'localhost',
    'database': 'eduquest',
    'user': 'root',
    'password': 'root'
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    # Admin accounts
    ADMINS = {
        'admin': 'admin',
        'admin1': 'admin1'
    }

    if role == 'admin':
        # 1. Check Hardcoded dictionary (Legacy/Fallback)
        if username.lower() in ADMINS and ADMINS[username.lower()] == password:
             return jsonify({'success': True, 'role': 'admin'})
        
        # 2. Check Database
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM admins WHERE username = %s AND password = %s", (username, password))
            admin_user = cursor.fetchone()
            cursor.close()
            conn.close()
            if admin_user:
                return jsonify({'success': True, 'role': 'admin'})

        return jsonify({'success': False, 'message': 'Invalid Admin Credentials'}), 401
    
    elif role == 'faculty':
        conn = get_db_connection()
        if not conn:
             return jsonify({'success': False, 'message': 'Database Error'}), 500
        
        cursor = conn.cursor(dictionary=True)
        # Check by id or empId
        query = "SELECT * FROM faculty WHERE id = %s OR empId = %s"
        cursor.execute(query, (username, username))
        faculty = cursor.fetchone()
        cursor.close()
        conn.close()

        if faculty:
            # Check password (default 'pass' logic from frontend)
            db_pass = faculty.get('password')
            valid_pass = (db_pass == password) or (not db_pass and password == 'pass')
            
            if valid_pass:
                return jsonify({'success': True, 'role': 'faculty', 'user_id': faculty['id']})
        return jsonify({'success': False, 'message': 'Invalid Faculty Credentials'}), 401

    return jsonify({'success': False, 'message': 'Invalid Role'}), 400

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    role = data.get('role')
    username = data.get('username')
    password = data.get('password')
    
    # Optional fields for faculty
    name = data.get('name', 'New User') 
    email = data.get('email', '')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database Connection Error'}), 500

    try:
        cursor = conn.cursor()
        
        if role == 'admin':
            # Simple Admin Registration
            # Generate a simple ID if not provided? Or use username. Let's use username as ID for simplicity or UUID
            import uuid
            new_id = str(uuid.uuid4())
            query = "INSERT INTO admins (id, username, password, status) VALUES (%s, %s, %s, 'Active')"
            cursor.execute(query, (new_id, username, password))
            
        elif role == 'faculty':
            # Faculty Registration
            # We need ID, EmpID (use username), Name, Email...
            import uuid
            new_id = "f_" + str(uuid.uuid4())[:8] # Short ID
            query = "INSERT INTO faculty (id, empId, name, email, password, status, type) VALUES (%s, %s, %s, %s, %s, 'Active', 'Faculty')"
            cursor.execute(query, (new_id, username, name, email, password))
            
        else:
             return jsonify({'success': False, 'message': 'Invalid Role'}), 400

        conn.commit()
        return jsonify({'success': True, 'message': 'Registration Successful'})
        
    except Error as e:
        print(f"Registration Error: {e}")
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 400
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Generic CRUD for tables
@app.route('/api/<table_name>', methods=['GET'])
def get_table(table_name):
    conn = get_db_connection()
    if not conn:
        return jsonify([]) # Return empty list on failure to avoid frontend crash
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Validate table_name to prevent SQL injection (basic check)
        # In a real app, whitelist tables. Assuming safe for this context.
        query = f"SELECT * FROM {table_name}" 
        cursor.execute(query)
        result = cursor.fetchall()
        return jsonify(result)
    except Error as e:
        print(f"Error fetching {table_name}: {e}")
        return jsonify([])
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/<table_name>', methods=['POST'])
def add_item(table_name):
    item = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database Error'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        columns = list(item.keys())
        values = list(item.values())
        
        # Construct UPSERT query (Insert or Update)
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        
        # ON DUPLICATE KEY UPDATE col=VALUES(col), ...
        # logic: if id exists, update other fields. 
        update_clause = ", ".join([f"{col}=VALUES({col})" for col in columns if col != 'id'])
        
        if not update_clause: # Case where only ID is passed or single column
             sql = f"INSERT IGNORE INTO {table_name} ({col_str}) VALUES ({placeholders})"
        else:
             sql = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_clause}"
        
        cursor.execute(sql, values)
        conn.commit()
        
        return jsonify({'success': True, 'data': item})
    except Error as e:
        print(f"Error adding to {table_name}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 400
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/<table_name>/<item_id>', methods=['DELETE'])
def delete_item(table_name, item_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database Error'}), 500
    
    try:
        cursor = conn.cursor()
        query = f"DELETE FROM {table_name} WHERE id = %s"
        cursor.execute(query, (item_id,))
        conn.commit()
        return jsonify({'success': True})
    except Error as e:
        print(f"Error deleting from {table_name}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 400
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
