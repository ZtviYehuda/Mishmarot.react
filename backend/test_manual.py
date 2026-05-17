import urllib.request
import json


def test_manual():
    url = "http://localhost:5000/api/auth/forgot-password"
    data = {"personal_number": "admin", "email": "naftaly749@gmail.com"}

    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"))
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            print(f"Status: {response.getcode()}")
            print(f"Body: {res_body}")
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, "read"):
            print(f"Error Body: {e.read().decode('utf-8')}")


if __name__ == "__main__":
    test_manual()
