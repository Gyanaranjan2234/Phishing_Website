# 🔐 APGS - Authentication Protocol Gateway Secure

## 🚀 Project Overview

APGS (Authentication Protocol Gateway Secure) is a cybersecurity web application designed to detect phishing threats and data breaches in real-time.
It helps users analyze URLs, emails, passwords, and files to ensure digital safety.

---

## ✨ Features

* 🔍 **URL Phishing Detection**
* 📧 **Email Breach Checker**
* 🔑 **Password Leak Detection**
* 📂 **File Safety Scanner (Basic)**
* 📊 **Risk Score & Detailed Analysis**
* 📄 **Downloadable Risk Report (PDF)**
* 🔐 **User Authentication System (JWT)**
* 🌙 **Dark/Light Mode UI**

---

## 🧠 Tech Stack

### 🌐 Frontend

* HTML
* CSS
* JavaScript

### ⚙️ Backend

* Python (FastAPI)

### 🤖 Machine Learning

* Scikit-learn

### 🗄️ Database

* MongoDB

### 🔐 Security & APIs

* Google Safe Browsing API
* Have I Been Pwned API

---

## 🧭 Workflow

1. User enters URL / Email / Password / File
2. Request goes to FastAPI backend
3. ML model analyzes input (phishing detection)
4. External APIs validate results
5. Risk score is generated
6. Data stored in database
7. Result displayed with report

---

## 📁 Project Structure

```
APGS/
│
├── frontend/
├── backend/
│   ├── app/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── database/
├── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```
git clone https://github.com/Gyanaranjan2234/Phishing-_Website.git
cd Phishing-_Website
```

---

### 2️⃣ Install Backend Dependencies

```
pip install -r requirements.txt
```

---

### 3️⃣ Run Backend Server

```
uvicorn app.main:app --reload
```

---

### 4️⃣ Open Frontend

Simply open `index.html` in your browser

---

## 📸 Screenshots

*(Add your UI screenshots here)*

---

## 🎯 Future Enhancements

* Advanced AI-based detection
* Browser Extension
* Real-time threat intelligence
* File malware scanning integration

---

## 👨‍💻 Team

* Gyana Ranjan Behera
* (Add your teammates)

---

## 📌 Note

This project is developed for educational and cybersecurity awareness purposes.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---
