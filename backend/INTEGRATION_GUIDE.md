# 🔌 How to Connect React Frontend with FastAPI Backend

This guide explains how to integrate your React frontend with the new Python backend.

---

## 📋 Step-by-Step Integration Guide

### Step 1: Install Backend Dependencies

Open a terminal and navigate to the backend folder:

```bash
cd c:\Users\gyana\OneDrive\Desktop\Phishing_Website\backend
pip install -r requirements.txt
```

### Step 2: Start the Backend Server

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
```

### Step 3: Verify Backend is Working

Open your browser and visit:
- **Health Check**: http://localhost:8000/
- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)

You should see:
```json
{
  "status": "success",
  "message": "APGS Authentication API is running",
  "docs": "Visit http://localhost:8000/docs for API documentation"
}
```

### Step 4: Test the API

Run the test script to verify everything works:

```bash
cd backend
python test_api.py
```

---

## 🔗 Connect React Frontend

### Option 1: Using fetch() (Simple)

Create a new file in your React project: `src/lib/api-backend.js`

```javascript
/**
 * API Configuration
 * Backend runs on port 8000
 * Frontend runs on port 5173 (Vite)
 */
const API_BASE_URL = 'http://localhost:8000/api/auth';

/**
 * User Signup
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Response from backend
 */
export const signup = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Signup successful:', data.data);
      return { success: true, message: data.message, user: data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};

/**
 * User Login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Response from backend
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Login successful:', data.data);
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.data));
      return { success: true, message: data.message, user: data.data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};
```

### Option 2: Using in Your Login Component

Update your `src/pages/Login.tsx` to use the new backend:

```typescript
import { signup, login } from '@/lib/api-backend';

// In your handleSignup function:
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!signupEmail || !signupPassword || !signupConfirmPassword) {
    toast.error("Please fill in all fields");
    return;
  }

  if (signupPassword !== signupConfirmPassword) {
    toast.error("Passwords do not match");
    return;
  }

  setLoading(true);
  
  try {
    // Call backend API
    const result = await signup(signupEmail, signupPassword);
    
    if (result.success) {
      toast.success(result.message);
      // Switch to login view after successful signup
      switchView('login');
    } else {
      toast.error(result.message);
    }
  } catch (err: any) {
    toast.error("An error occurred during signup");
  } finally {
    setLoading(false);
  }
};

// In your handleLogin function:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!loginEmail || !loginPassword) {
    toast.error("Please fill in all fields");
    return;
  }

  setLoading(true);
  
  try {
    // Call backend API
    const result = await login(loginEmail, loginPassword);
    
    if (result.success) {
      toast.success(result.message);
      // Redirect to home page
      navigate("/");
    } else {
      toast.error(result.message);
    }
  } catch (err: any) {
    toast.error("An error occurred during login");
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Testing the Integration

### Test 1: Health Check from Browser

Open browser console (F12) and run:

```javascript
fetch('http://localhost:8000/')
  .then(res => res.json())
  .then(data => console.log(data));
```

Expected output:
```javascript
{
  status: "success",
  message: "APGS Authentication API is running",
  docs: "Visit http://localhost:8000/docs for API documentation"
}
```

### Test 2: Signup from Browser Console

```javascript
fetch('http://localhost:8000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Test 3: Login from Browser Console

```javascript
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "test@example.com",
    password: "password123"
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 📁 Project Structure

```
Phishing_Website/
├── backend/                    # ← NEW Python Backend
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   ├── apgs.db               # SQLite database (auto-created)
│   ├── database/
│   │   └── db.py             # Database connection
│   ├── models/
│   │   └── user_model.py     # User model
│   ├── schemas/
│   │   └── auth_schema.py    # Request/Response schemas
│   ├── routes/
│   │   └── auth.py           # Auth endpoints
│   ├── utils/
│   │   └── security.py       # Password hashing
│   └── test_api.py           # Test script
│
├── src/                       # ← React Frontend
│   ├── lib/
│   │   └── api-backend.js    # ← NEW API functions
│   └── pages/
│       ├── Login.tsx         # ← Updated to use backend
│       └── Signup.tsx        # ← Updated to use backend
│
└── ...
```

---

## 🔒 Security Notes

### What's Secure:
✅ Passwords are hashed with bcrypt before storing  
✅ SQL injection protection (SQLAlchemy ORM)  
✅ Email validation  
✅ CORS configured for your frontend only  
✅ No plain-text passwords in database  

### Future Improvements:
- Add JWT token authentication for session management
- Add rate limiting to prevent brute force attacks
- Add email verification
- Add password strength requirements
- Use HTTPS in production

---

## 🐛 Common Issues & Solutions

### Issue 1: "CORS Error"
**Solution**: Make sure backend is running and CORS is configured in `main.py`

### Issue 2: "Connection Refused"
**Solution**: Start the backend server with `uvicorn main:app --reload --port 8000`

### Issue 3: "Module not found"
**Solution**: Install dependencies: `pip install -r requirements.txt`

### Issue 4: "Database error"
**Solution**: Delete `apgs.db` file and restart the server (it will recreate)

---

## 📊 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |

---

## 🎯 Next Steps

1. ✅ Backend is running on port 8000
2. ✅ Frontend runs on port 5173 (Vite)
3. ✅ Create `src/lib/api-backend.js` with API functions
4. ✅ Update Login/Signup components to call backend
5. ✅ Test the integration
6. 🔄 (Optional) Add JWT tokens for persistent sessions
7. 🔄 (Optional) Add password reset functionality

---

## 💡 Quick Commands

```bash
# Start Backend
cd backend
uvicorn main:app --reload --port 8000

# Start Frontend
cd ..
npm run dev

# Test Backend
cd backend
python test_api.py

# View API Docs
# Open browser: http://localhost:8000/docs
```
