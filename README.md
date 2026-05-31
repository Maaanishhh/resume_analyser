# 🎯 AI Resume Analyser

> An intelligent, full-stack AI-powered resume analysis platform built as a Final Year Project.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/Backend-Python%20FastAPI-green)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📌 About the Project

The **AI Resume Analyser** is a web application that helps job seekers improve their resumes using artificial intelligence. It analyses resumes, gives ATS scores, suggests improvements, matches resumes to job descriptions, and even finds real job listings — all in one place.

This project was built as a **Final Year Project** to demonstrate full-stack development skills combined with AI integration.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Resume Scoring** | Overall score out of 100 with detailed breakdown |
| 🤖 **ATS Analysis** | Checks if your resume passes Applicant Tracking Systems |
| 🔍 **Keyword Analysis** | Shows found and missing keywords |
| ✍️ **AI Rewrites** | Rewrites weak bullet points to be more impactful |
| 💼 **Real Job Listings** | Fetches live jobs from LinkedIn & Indeed via JSearch API |
| 🔄 **Resume Comparison** | Compare two resumes side by side |
| 🏗️ **Resume Builder** | Build a professional resume from scratch with AI |
| 📥 **PDF Download** | Download your built resume as a PDF |

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Recharts (data visualization)
- React Dropzone (PDF upload)
- Axios (API calls)
- CSS (custom styling)

### Backend
- Python 3.14
- FastAPI (REST API framework)
- Uvicorn (ASGI server)
- pdfplumber (PDF text extraction)
- ReportLab (PDF generation)

### AI & APIs
- **Groq API** — LLaMA 3.3 70B model for AI analysis
- **JSearch API (RapidAPI)** — Real job listings from LinkedIn, Indeed, Glassdoor

---

## 📁 Project Structure

resume_analyser/
├── backend/
│   ├── main.py              # FastAPI backend
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API keys (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.css          # Styling
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))
- RapidAPI key (free at [rapidapi.com](https://rapidapi.com))

### 1. Clone the repository
```bash
git clone https://github.com/Maaanishhh/resume_analyser.git
cd resume_analyser
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in the backend folder:
Start the backend:
```bash
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🚀 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | Coming soon |
| Backend | Render | Coming soon |

---

## 📸 Screenshots

Coming soon!

---

## 🔑 Environment Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `GROQ_API_KEY` | Groq AI API key | [console.groq.com](https://console.groq.com) |
| `RAPIDAPI_KEY` | RapidAPI key for job listings | [rapidapi.com](https://rapidapi.com) |

---

## 👨‍💻 Author

**Maaanishhh**
- GitHub: [@Maaanishhh](https://github.com/Maaanishhh)

---

## 📄 License

This project is licensed under the MIT License.

---

> ⭐ If you found this project helpful, please give it a star on GitHub!