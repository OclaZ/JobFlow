import requests

def test_create_offer():
    # Login
    login_data = {"username": "admin@example.com", "password": "password"}
    response = requests.post("http://localhost:8000/token", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Offer
    offer_data = {
        "offer_title": "Test Offer via Script",
        "platform": "LinkedIn",
        "status": "Pending",
        "offer_link": "http://example.com",
        "application_sent": True
    }
    
    response = requests.post("http://localhost:8000/job_offers/", json=offer_data, headers=headers)
    if response.status_code == 200:
        print("Offer created successfully")
        print(response.json())
    else:
        print(f"Failed to create offer: {response.text}")

if __name__ == "__main__":
    test_create_offer()
