# APGS Backend - Authentication API

FastAPI backend for the Advanced Phishing Guard System (APGS) with user authentication.

## 📁 Project Structure

```
backend/
├── main.py                 # Main application entry point
├── requirements.txt        # Python dependencies
├── database/
│   ├── __init__.py
│   └── db.py              # Database connection & session
├── models/
│   ├── __init__.py
│   └── user_model.py      # User database model
├── schemas/
│   ├── __init__.py
│   └── auth_schema.py     # Request/Response validation
├── routes/
│   ├── __init__.py
│   └── auth.py            # Authentication endpoints
└── utils/
    ├── __init__.py
    └── security.py        # Password hashing utilities
```

## 🚀 Quick Start

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Run the Backend Server

```bash
# Option 1: Using uvicorn directly (recommended for development)
uvicorn main:app --reload --port 8000

# Option 2: Run main.py directly
python main.py
```

The server will start at: **http://localhost:8000**

### Step 3: Test the API

- **API Documentation**: http://localhost:8000/docs (Interactive Swagger UI)
- **Health Check**: http://localhost:8000/

## 📡 API Endpoints

### 1. User Signup

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Email already registered"
}
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "user@example.com"
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

## 🔌 Connect Frontend (React)

### Using fetch()

```javascript
// Signup
const signup = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Signup successful:', data.data);
  } else {
    console.error('Signup failed:', data.message);
  }
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.status === 'success') {
    console.log('Login successful:', data.data);
    // Store user data or token
    localStorage.setItem('user', JSON.stringify(data.data));
  } else {
    console.error('Login failed:', data.message);
  }
};
```

## 🗄️ Database

- **Type**: SQLite (local file-based database)
- **File**: `backend/apgs.db` (auto-created on first run)
- **Tables**: `users` (id, email, hashed_password)

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ Email validation
- ✅ SQL injection protection (SQLAlchemy ORM)
- ✅ CORS configured for frontend
- ✅ No plain-text passwords stored

## 📝 Notes

- The database file `apgs.db` will be created automatically in the `backend/` folder
- All passwords are hashed before storing (never stored as plain text)
- Use `--reload` flag during development for auto-restart on code changes
- Visit `/docs` endpoint for interactive API testing
