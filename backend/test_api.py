import requests
import json


def test_forgot_password():
    url = "http://localhost:5000/api/auth/forgot-password"
    data = {"personal_number": "admin", "email": "naftaly749@gmail.com"}
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_forgot_password()
