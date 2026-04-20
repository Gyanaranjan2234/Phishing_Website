# 🆕 Username Feature - Update Guide

## ✅ What Was Updated

Your backend now supports **username** field in addition to email and password!

### Changes Made:

1. **Database** (`models/user_model.py`)
   - ✅ Added `username` column to User model
   - ✅ Email remains unique
   - ✅ Existing data preserved

2. **Migration** (`migrate_add_username.py`)
   - ✅ Safely added username column to existing database
   - ✅ All existing users preserved
   - ✅ Default value set for old records

3. **Schemas** (`schemas/auth_schema.py`)
   - ✅ `UserSignup` now requires: `email`, `username`, `password`
   - ✅ `UserResponse` now includes: `id`, `email`, `username`
   - ✅ Login response now includes username

4. **Routes** (`routes/auth.py`)
   - ✅ Signup accepts and validates username
   - ✅ Login returns username in response
   - ✅ Username validation (cannot be empty)

---

## 🧪 How to Test the Updated API

### Method 1: Using Interactive API Docs (Easiest)

1. **Open browser**: http://localhost:8000/docs

2. **Test Signup**:
   - Click on `POST /api/auth/signup`
   - Click "Try it out"
   - Enter test data:
   ```json
   {
     "email": "newuser@example.com",
     "username": "johndoe",
     "password": "password123"
   }
   ```
   - Click "Execute"
   - Expected response:
   ```json
   {
     "status": "success",
     "message": "User registered successfully",
     "data": {
       "id": 2,
       "email": "newuser@example.com",
       "username": "johndoe"
     }
   }
   ```

3. **Test Login**:
   - Click on `POST /api/auth/login`
   - Click "Try it out"
   - Enter credentials:
   ```json
   {
     "email": "newuser@example.com",
     "password": "password123"
   }
   ```
   - Click "Execute"
   - Expected response:
   ```json
   {
     "status": "success",
     "message": "Login successful",
     "data": {
       "id": 2,
       "email": "newuser@example.com",
       "username": "johndoe"
     }
   }
   ```

---

### Method 2: Using curl Commands

#### Test Signup:
```bash
curl -X POST http://localhost:8000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test2@example.com\",\"username\":\"testuser\",\"password\":\"password123\"}"
```

#### Test Login:
```bash
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test2@example.com\",\"password\":\"password123\"}"
```

---

### Method 3: Using Python Test Script

```python
import requests

# Test Signup
signup_response = requests.post(
    'http://localhost:8000/api/auth/signup',
    json={
        'email': 'test3@example.com',
        'username': 'pythonuser',
        'password': 'password123'
    }
)
print("Signup Response:", signup_response.json())

# Test Login
login_response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={
        'email': 'test3@example.com',
        'password': 'password123'
    }
)
print("Login Response:", login_response.json())
```

---

## 📊 View Database with Username

Run the database viewer to see usernames:

```bash
python view_database.py
```

Choose option 1, and you'll see:
```
id                   : 1
email                : gyanaranjna.root09@gmail.com
username             : user  (default value for old record)
hashed_password      : ****(hashed)****
```

---

## 🔍 API Request/Response Format

### **Signup Endpoint**

**Request:**
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Error Responses:**
```json
// Email already exists
{
  "status": "error",
  "message": "Email already registered"
}

// Empty username
{
  "status": "error",
  "message": "Username cannot be empty"
}
```

---

### **Login Endpoint**

**Request:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

---

## 🔐 Security Features Maintained

✅ Passwords still hashed with bcrypt  
✅ Email remains unique  
✅ Username validation (no empty values)  
✅ No plain-text passwords stored  
✅ SQL injection protection (SQLAlchemy ORM)  

---

## 📝 Frontend Integration Example

### React/JavaScript:

```javascript
// Signup with username
const signup = async (email, username, password) => {
  const response = await fetch('http://localhost:8000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Welcome,', data.data.username);
    localStorage.setItem('user', JSON.stringify(data.data));
  }
};

// Login (returns username)
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Welcome back,', data.data.username);
    localStorage.setItem('user', JSON.stringify(data.data));
  }
};
```

---

## ⚠️ Important Notes

1. **Migration Already Run**: The username column has been added to your existing database
2. **Old Users**: Existing users have default username "user" - they can update it later
3. **New Users**: Must provide username during signup
4. **Backward Compatible**: Login still works with just email and password
5. **Server Running**: Backend is running on http://localhost:8000

---

## 🚀 Quick Test Checklist

- [ ] Server is running: http://localhost:8000
- [ ] API docs accessible: http://localhost:8000/docs
- [ ] Test signup with username
- [ ] Test login and verify username in response
- [ ] Check database with `python view_database.py`
- [ ] Verify old users have default username

---

## 🎯 What's Next?

1. ✅ Backend supports username
2. ✅ Database migrated successfully
3. ✅ API tested and working
4. 🔄 Update your React frontend to include username field in signup form
5. 🔄 Display username in UI after login
6. 🔄 (Optional) Add feature to update username

---

**Your backend now fully supports username!** 🎉

Test it now at: http://localhost:8000/docs
