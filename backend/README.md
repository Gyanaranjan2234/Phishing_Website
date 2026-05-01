# ⚙️ APGS Backend - Advanced Phishing Guard System

Technical documentation for the **Advanced Phishing Guard System (APGS)** backend. This service handles user authentication, security scan history, and threat intelligence aggregation.

APGS is a comprehensive cybersecurity backend designed to provide real-time threat detection and secure data management. It serves as the core logic engine for processing security scans and managing user-specific security data.

---

## 🚀 Key Features

- **🔍 Unified Security Scans**: Centralized processing for URL, File, Password, and Email breach detections.
- **🔐 Robust Authentication**: JWT-based secure sessions and Google OAuth 2.0 integration.
- **📊 Scan History & Analytics**: Efficient storage and retrieval of user scan history with safe/threat statistics.
- **📄 PDF Report Support**: Data aggregation for generating professional security reports.
- **🛡️ Rate Limiting & Security**: Built-in protection against API abuse and secure password hashing.

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

## ⚙️ Setup & Installation

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

# VirusTotal API
VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Frontend Integration
FRONTEND_URL=http://localhost:8080
```

### 3. Run the Server
Start the FastAPI server with auto-reload enabled for development.

```bash
uvicorn main:app --reload
```
- **API Base URL**: `http://localhost:8000`
- **Interactive Docs (Swagger)**: `http://localhost:8000/docs`

---

## 📁 Project Structure

```text
backend/
├── main.py              # Application entry point & CORS
├── phishing_model.py    # AI/ML Prediction Logic & Core Scanning
├── apgs.db              # SQLite Database (Auto-generated)
├── database/            # SQLAlchemy session & engine config
├── models/              # Database Table Schemas (SQLAlchemy)
├── schemas/             # Request/Response Data Models (Pydantic)
├── routes/              # API Endpoints (Auth, Scans, Contacts)
├── services/            # Business Logic & External API Integrations
├── utils/               # Hashing, JWT & Security helpers
└── requirements.txt     # Dependency manifest
```

---

## 📌 Development Notes

- **Data Isolation**: All scan operations are strictly filtered by `user_id` to ensure users only see their own data.
- **Rate Limiting**: The `/save` endpoint includes an in-memory rate limiter to prevent API abuse.
- **Auto-migrations**: Database tables are automatically created on startup.

