import requests
import json
import uuid

API_URL = "http://localhost:5000/api"
HEADERS = {"Content-Type": "application/json"}

def test_register(role, username, password, name=None, email=None):
    print(f"Registering {role}: {username} (pass: {password})...")
    payload = {
        "role": role,
        "username": username,
        "password": password
    }
    if role == 'faculty':
        payload['name'] = name
        payload['email'] = email
        
    try:
        response = requests.post(f"{API_URL}/register", json=payload, headers=HEADERS)
        if response.status_code == 200:
            print("SUCCESS:", response.json())
            return True
        else:
            print(f"FAILED ({response.status_code}):", response.json())
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_login(role, username, password):
    print(f"Login {role}: {username}...")
    try:
        response = requests.post(f"{API_URL}/login", json={
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

# Unique users to avoid conflicts
u_suffix = str(uuid.uuid4())[:4]

print("--- Test Registration ---")
admin_user = f"new_admin_{u_suffix}"
test_register("admin", admin_user, "pass123")

fac_user = f"new_fac_{u_suffix}"
test_register("faculty", fac_user, "pass123", "New Faculty", "new@test.com")

print("\n--- Test Login with New Users ---")
test_login("admin", admin_user, "pass123")
test_login("faculty", fac_user, "pass123")
