from app import create_app
import json
import traceback

try:
    print("Initializing app for test...")
    app = create_app()
    client = app.test_client()

    print("\n--- Testing Login with admin/123456 ---")
    response = client.post('/api/auth/login', json={
        "personal_number": "admin",
        "password": "123456"
    })

    print(f"Status Code: {response.status_code}")
    print(f"Response Payload: {response.get_json()}")

    if response.status_code == 500:
        print("\n❌ 500 Error Detected. Check the server logs above for the traceback.")

except Exception:
    print("\n❌ Test Script Crashed:")
    traceback.print_exc()
