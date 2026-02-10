import requests
import json

url = "http://localhost:5000/api/auth/login"
payload = {
    "personal_number": "admin",
    "password": "123456"
}
try:
    print(f"Testing login at {url}...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    try:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except:
        print(response.text)
except Exception as e:
    print(f"Failed to connect: {e}")
