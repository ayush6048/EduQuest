import requests

API_URL = "http://localhost:5000/api/login"
HEADERS = {"Content-Type": "application/json"}

def test_login(role, username, password):
    print(f"Testing {role} login for user: {username}...")
    try:
        response = requests.post(API_URL, json={
            "role": role,
            "username": username,
            "password": password
        }, headers=HEADERS)
        
        if response.status_code == 200:
            print("SUCCESS:", response.json())
            return True
        else:
            print(f"FAILED ({response.status_code}):", response.json())
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

print("--- Admin Login ---")
test_login("admin", "admin", "admin")
test_login("admin", "admin1", "admin1")

print("\n--- Faculty Login ---")
test_login("faculty", "f1", "pass")
test_login("faculty", "f5", "pass")
test_login("faculty", "f6", "pass")
