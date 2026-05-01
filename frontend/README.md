# 💻 APGS Frontend - Advanced Phishing Guard System

The frontend application for the **Advanced Phishing Guard System (APGS)**. A modern, responsive dashboard built with React and TypeScript, providing a seamless interface for security scanning and threat intelligence.

APGS Frontend empowers users with intuitive tools to detect malicious links, files, and data breaches. It features a premium design with glassmorphism aesthetics and real-time data visualization.

---

## 🚀 Key Features

- **🔍 URL Scanning Hub**: Instant phishing detection for suspicious URLs.
- **📂 File Integrity Checker**: Upload and scan files for potential security threats.
- **📧 Breach Detection**: Check if emails or passwords have been leaked in historical data breaches.
- **📊 Security Dashboard**: Interactive charts and analytics to track your security posture.
- **📄 Professional PDF Reports**: Detailed, downloadable reports for every security scan.
- **🌓 Adaptive Theme**: Full support for Dark and Light modes with a premium glassmorphism UI.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router](https://reactrouter.com/)

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install
```

### 3. Configuration
Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
# VirusTotal API Key (Required for URL/File scans)
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Backend API URL (Optional if running locally on default port)
VITE_API_URL=http://localhost:8000
```

### 4. Run Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:8080` (default port may vary based on configuration).

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/     # Reusable UI components (Dashboard, Scanners, UI)
│   ├── hooks/          # Custom React hooks for logic and state
│   ├── lib/            # API clients, utility functions, and constants
│   ├── pages/          # Full-page components and routing entry points
│   ├── App.tsx         # Main application component & routes
│   └── main.tsx        # Application entry point
├── public/             # Static assets (images, fonts, favicon)
├── index.html          # HTML template
├── tailwind.config.ts  # Tailwind CSS configuration
└── vite.config.ts      # Vite build configuration
```

---

## 👨‍💻 Developed By

- **Gyana Ranjan Behera** - *Lead Developer*
