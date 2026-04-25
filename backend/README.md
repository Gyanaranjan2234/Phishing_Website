# ⚙️ APGS Backend - FastAPI Service

Technical documentation for the **Authentication Protocol Gateway Secure (APGS)** backend. This service handles user authentication, security scan history, and threat intelligence aggregation.

---

## 🛠️ Technology Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database**: SQLite (Local file `apgs.db`)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Security**: 
  - `Bcrypt` for password hashing
  - `Jose/PyJWT` for JWT token management
  - `OAuth2` for Google Integration

---

## 🚀 Getting Started

### 1. Environment Setup
Create a virtual environment and install the required dependencies.

```bash
# Create venv
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration
Create a `.env` file in the `backend/` directory with the following variables:

```env
# JWT Security
JWT_SECRET_KEY=your_super_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Gmail SMTP (For Contact Form & Password Reset)
GMAIL_SENDER_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
GMAIL_RECEIVER_EMAIL=support@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Frontend Integration
FRONTEND_URL=http://localhost:5173
```

### 3. Run the Server
Start the FastAPI server with auto-reload enabled for development.

```bash
uvicorn main:app --reload
```
- **API Base URL**: `http://localhost:8000`
- **Interactive Docs (Swagger)**: `http://localhost:8000/docs`

---

## 🛣️ API Routes

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user account |
| `POST` | `/login` | Authenticate user & return session data |
| `POST` | `/forgot-password` | Generate & email password reset link |
| `POST` | `/reset-password` | Update password using secure token |
| `GET` | `/google` | Initiate Google OAuth 2.0 flow |
| `GET` | `/google/callback` | Google OAuth redirect handler |
| `POST` | `/contact/send` | Save contact message & notify admin |

### 🔍 Security Scans (`/api/scans`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/save` | Save a scan result (URL, Email, Pass, File) |
| `GET` | `/history` | Retrieve scan history for a specific user |
| `GET` | `/stats` | Get user-specific scan safe/threat counts |
| `GET` | `/dashboard` | Comprehensive profile dashboard data |
| `DELETE` | `/{scan_id}` | Remove a specific scan record |
| `DELETE` | `/clear-history/{u_id}` | Wipe all scan history for a user |

### 📊 Platform Stats
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Global platform metrics (Total Users/Scans) |

---

## 🔐 Authentication Flow

### 1. Traditional Auth
- **Signup**: Passwords are hashed using `Bcrypt` before storage.
- **Login**: Verifies credentials and returns user metadata. Client stores `user_id` in `localStorage`.

### 2. Google OAuth
- User is redirected to Google Consent Screen.
- Google returns an `authorization_code` to `/api/auth/google/callback`.
- Backend exchanges code for `access_token`, fetches user profile, and creates/updates the user in SQLite.
- A JWT is generated and the user is redirected back to the frontend.

### 3. JWT Strategy
- Tokens contain `user_id`, `email`, and `username`.
- Expiration is set to 24 hours by default.
- Used for cross-domain authentication between the backend and frontend.

---

## 📁 Directory Structure

```text
backend/
├── main.py              # Application entry point & CORS
├── apgs.db              # SQLite Database (Auto-generated)
├── database/            # SQLAlchemy session & engine config
├── models/              # Database Table Schemas (SQLAlchemy)
├── schemas/             # Request/Response Data Models (Pydantic)
├── routes/              # API Endpoints (Auth, Scans)
├── utils/               # Hashing & Security helpers
└── requirements.txt     # Dependency manifest
```

---

## 📌 Development Notes

- **Data Isolation**: All scan operations are strictly filtered by `user_id` to ensure users only see their own data.
- **Rate Limiting**: The `/save` endpoint includes an in-memory rate limiter (20 requests/min) to prevent API abuse.
- **Auto-migrations**: Database tables are automatically created on startup via `Base.metadata.create_all()`.
