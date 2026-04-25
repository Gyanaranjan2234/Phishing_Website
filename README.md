# 🔐 APGS - Authentication Protocol Gateway Secure

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**APGS** is a sophisticated cybersecurity platform designed to empower users with real-time threat intelligence. From detecting malicious URLs to checking if your data has been leaked in a breach, APGS provides a centralized gateway for digital security.

---

## 🚀 Key Features

- **🔍 URL Phishing Detection**: Instant analysis of suspicious links using the VirusTotal API and security heuristics.
- **📧 Email Breach Checker**: Verify if your email address has been compromised in known historical data breaches.
- **🔑 Password Security Hub**: Evaluate password strength and check against databases of leaked credentials.
- **📂 File Integrity Scanner**: Scan files for potential threats before opening them.
- **📊 Interactive Dashboard**: Visualize your security posture with real-time analytics, trend charts, and risk scores.
- **📄 Professional Reports**: Generate and download detailed security reports in PDF format.
- **🔐 Secure Authentication**: Robust user management with JWT-based sessions and Google OAuth integration.
- **🌓 Dynamic UI**: A premium, glassmorphism-inspired design with full Dark/Light mode support.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn/UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: TanStack Query (React Query)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **Security**: Bcrypt (Hashing), Jose/JWT (Tokens)
- **API Clients**: HTTPX

### External Integrations
- VirusTotal API (Threat Intelligence)
- Have I Been Pwned (Breach Detection)
- Google Safe Browsing

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Gyanaranjan2234/Phishing-_Website.git
cd Phishing-_Website
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
The backend will be running at `http://localhost:8000`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will be running at `http://localhost:8080` (or `5173` depending on config).

## 📁 Project Structure

```text
Phishing_Website/ (Root)
├── backend/                # FastAPI Python Backend
│   ├── database/           # DB Session & Connection
│   ├── models/             # SQLAlchemy Models
│   ├── routes/             # API Endpoints
│   ├── schemas/            # Pydantic Validation
│   ├── utils/              # Hashing & Security
│   ├── main.py             # App Entry Point
│   ├── requirements.txt    # Python Deps
│   └── .env                # Backend Env Vars
├── frontend/               # React TypeScript Frontend
│   ├── src/                # Source Code
│   ├── public/             # Static Assets
│   ├── package.json        # Frontend Deps
│   ├── vite.config.ts      # Vite Config
│   └── .env                # Frontend Env Vars (VITE_...)
├── .gitignore              # Global Ignore File
└── README.md               # Main Project Docs
```

---

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables.

### `frontend/.env`
```env
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key
```

### `backend/.env`
```env
# Backend specific configurations
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📊 Usage

1. **Register/Login**: Create an account or use Google OAuth to access the dashboard.
2. **Scanning**: Navigate to the "Scanning Hub" to check URLs, Emails, or Files.
3. **Dashboard**: View your scan history and security trends on the profile page.
4. **Reports**: Click on any scan result to view details and download a PDF report.

---

## 📌 Notes & Disclaimer

- **Educational Purpose**: This project was developed as part of a cybersecurity awareness initiative.
- **Accuracy**: While we use industry-standard APIs, no tool can guarantee 100% detection of all threats. Always practice safe browsing.

---

## 👨‍💻 Developed By

- **Gyana Ranjan Behera** - *Lead Developer*

---

## ⭐ Support

If you find this project helpful, please consider giving it a ⭐ on [GitHub](https://github.com/Gyanaranjan2234/Phishing-_Website)!
