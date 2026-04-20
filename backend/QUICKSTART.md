# ⚡ Quick Start - Get Backend Running in 2 Minutes

## Step 1: Open Terminal

Open PowerShell or Command Prompt and navigate to backend folder:

```bash
cd c:\Users\gyana\OneDrive\Desktop\Phishing_Website\backend
```

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

Wait for installation to complete (takes ~30 seconds).

## Step 3: Start the Server

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

## Step 4: Test in Browser

Open browser and visit: **http://localhost:8000/docs**

You'll see interactive API documentation!

## Step 5: Test Signup/Login

Click on `/api/auth/signup` → Try it out → Enter test data → Execute

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

## ✅ Done! Backend is Running!

Now connect your React frontend using:
- Signup: `http://localhost:8000/api/auth/signup`
- Login: `http://localhost:8000/api/auth/login`

---

## 🚨 Troubleshooting

**Error: "pip: command not found"**
- Install Python from https://python.org/downloads

**Error: "module not found"**
- Run: `pip install -r requirements.txt` again

**Error: "port already in use"**
- Change port: `uvicorn main:app --reload --port 8001`

**Want to stop server?**
- Press `Ctrl + C` in terminal

---

## 📝 Quick Commands Reference

```bash
# Start backend
cd backend
uvicorn main:app --reload --port 8000

# Start frontend (in another terminal)
cd ..
npm run dev

# Test backend
python test_api.py

# View API docs
# Browser: http://localhost:8000/docs
```

---

## 🎯 What Happens When You Run the Server?

1. ✅ Creates `apgs.db` SQLite database file
2. ✅ Creates `users` table
3. ✅ Starts web server on port 8000
4. ✅ Enables CORS for your React frontend
5. ✅ Auto-reloads when you change code

That's it! Your backend is ready to accept signup and login requests! 🎉
