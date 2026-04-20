# 🏗️ APGS Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                         │
│                                                         │
│  React Frontend (Port 5173)                            │
│  ┌──────────────────────────────────────────┐          │
│  │  Login.tsx / Signup.tsx                  │          │
│  │         ↓                                 │          │
│  │  api-backend.js (fetch calls)            │          │
│  └──────────────────────────────────────────┘          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP POST requests
                     │ (JSON data)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              FASTAPI BACKEND (Port 8000)                │
│                                                         │
│  main.py                                                 │
│  ┌──────────────────────────────────────────┐          │
│  │  CORS Middleware (allows localhost:5173) │          │
│  │         ↓                                 │          │
│  │  Routes (routes/auth.py)                 │          │
│  │  ├─ POST /api/auth/signup                │          │
│  │  └─ POST /api/auth/login                 │          │
│  │         ↓                                 │          │
│  │  Security (utils/security.py)            │          │
│  │  ├─ hash_password() (bcrypt)             │          │
│  │  └─ verify_password()                    │          │
│  │         ↓                                 │          │
│  │  Database (database/db.py)               │          │
│  │  ┌──────────────────────────────┐        │          │
│  │  │  SQLite (apgs.db)            │        │          │
│  │  │  Table: users                │        │          │
│  │  │  - id (INT, PRIMARY KEY)     │        │          │
│  │  │  - email (STRING, UNIQUE)    │        │          │
│  │  │  - hashed_password (STRING)  │        │          │
│  │  └──────────────────────────────┘        │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## Request Flow: User Signup

```
1. User fills signup form in React
   ↓
2. React calls: signup(email, password)
   ↓
3. fetch() sends POST to http://localhost:8000/api/auth/signup
   Body: { "email": "user@example.com", "password": "secret123" }
   ↓
4. FastAPI receives request in routes/auth.py
   ↓
5. Validates email format using Pydantic schema
   ↓
6. Checks if email already exists in database
   ↓
7. If exists → Return error response
   ↓
8. If new → Hash password with bcrypt
   ↓
9. Save user to SQLite database
   ↓
10. Return success response to React
    {
      "status": "success",
      "message": "User registered successfully",
      "data": { "id": 1, "email": "user@example.com" }
    }
```

## Request Flow: User Login

```
1. User fills login form in React
   ↓
2. React calls: login(email, password)
   ↓
3. fetch() sends POST to http://localhost:8000/api/auth/login
   Body: { "email": "user@example.com", "password": "secret123" }
   ↓
4. FastAPI receives request in routes/auth.py
   ↓
5. Finds user by email in database
   ↓
6. Verifies password using bcrypt
   ↓
7. If invalid → Return error response
   ↓
8. If valid → Return success response
    {
      "status": "success",
      "message": "Login successful",
      "data": { "id": 1, "email": "user@example.com" }
    }
   ↓
9. React stores user data in localStorage
   ↓
10. Redirect user to dashboard
```

## File Structure

```
backend/
│
├── main.py                    # ← Entry point (FastAPI app)
│   ├── Create database tables
│   ├── Configure CORS
│   └── Include routes
│
├── routes/
│   └── auth.py               # ← API endpoints
│       ├── POST /api/auth/signup
│       └── POST /api/auth/login
│
├── models/
│   └── user_model.py         # ← Database schema
│       └── User (id, email, hashed_password)
│
├── schemas/
│   └── auth_schema.py        # ← Request/Response validation
│       ├── UserSignup (email, password)
│       ├── UserLogin (email, password)
│       └── AuthResponse (status, message, data)
│
├── database/
│   └── db.py                 # ← Database connection
│       ├── SQLAlchemy engine
│       └── Session management
│
├── utils/
│   └── security.py           # ← Password utilities
│       ├── hash_password()
│       └─ verify_password()
│
└── apgs.db                   # ← SQLite database file (auto-created)
```

## Technologies Used

| Technology | Purpose | Why? |
|------------|---------|------|
| **FastAPI** | Web framework | Fast, modern, auto-generates docs |
| **SQLAlchemy** | Database ORM | Prevents SQL injection, easy to use |
| **SQLite** | Database | Simple, no setup needed, file-based |
| **bcrypt** | Password hashing | Industry standard, secure |
| **Pydantic** | Data validation | Type-safe, automatic validation |
| **Uvicorn** | ASGI server | Fast, supports async |
| **CORS** | Cross-origin | Allows frontend to access backend |

## Security Features

1. **Password Hashing**: All passwords hashed with bcrypt before storing
2. **SQL Injection Protection**: SQLAlchemy ORM prevents injection attacks
3. **Email Validation**: Pydantic validates email format automatically
4. **CORS Protection**: Only allows requests from your frontend
5. **No Plain-text Passwords**: Never stored or transmitted in plain text

## Response Format

All endpoints return consistent JSON:

```json
{
  "status": "success" | "error",
  "message": "Human readable message",
  "data": {} | null
}
```

## Development Workflow

```
1. Edit code in backend/
2. Server auto-reloads (--reload flag)
3. Test with http://localhost:8000/docs
4. Run test_api.py to verify
5. Connect from React frontend
```

## Production Deployment (Future)

For production, you'll need to:
1. Replace SQLite with PostgreSQL/MySQL
2. Add JWT token authentication
3. Enable HTTPS
4. Add rate limiting
5. Use environment variables for secrets
6. Deploy to cloud (AWS, Heroku, DigitalOcean)
