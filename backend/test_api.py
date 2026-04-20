"""
Test Script - Backend API Testing
==================================
This script tests the signup and login endpoints.
Run this AFTER starting the backend server.

Usage:
    python test_api.py
"""

import requests
import json

# Backend server URL
BASE_URL = "http://localhost:8000"

def test_signup():
    """Test user signup endpoint"""
    print("\n" + "="*50)
    print("TESTING: User Signup")
    print("="*50)
    
    # Test data
    signup_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    # Send POST request
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    
    # Print response
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()


def test_login(email, password):
    """Test user login endpoint"""
    print("\n" + "="*50)
    print("TESTING: User Login")
    print("="*50)
    
    # Test data
    login_data = {
        "email": email,
        "password": password
    }
    
    # Send POST request
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    # Print response
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()


def test_duplicate_signup():
    """Test signup with duplicate email"""
    print("\n" + "="*50)
    print("TESTING: Duplicate Email Signup")
    print("="*50)
    
    # Try to signup with same email
    signup_data = {
        "email": "test@example.com",
        "password": "anotherpassword"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()


def test_wrong_password():
    """Test login with wrong password"""
    print("\n" + "="*50)
    print("TESTING: Wrong Password Login")
    print("="*50)
    
    login_data = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()


if __name__ == "__main__":
    print("\n" + "="*50)
    print("APGS Backend API Test Suite")
    print("="*50)
    
    try:
        # Check if backend is running
        health_check = requests.get(f"{BASE_URL}/")
        print(f"\n✓ Backend is running: {health_check.json()['message']}")
        
        # Run tests
        test_signup()
        test_login("test@example.com", "testpassword123")
        test_duplicate_signup()
        test_wrong_password()
        
        print("\n" + "="*50)
        print("✓ All tests completed!")
        print("="*50 + "\n")
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Backend is not running!")
        print("Please start the backend server first:")
        print("  cd backend")
        print("  uvicorn main:app --reload --port 8000\n")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}\n")
