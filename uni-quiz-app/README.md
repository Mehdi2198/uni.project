# Telegram Mini App for University Quizzes

A comprehensive university quiz platform with a **Telegram Mini App** for students and a **Web Admin Dashboard** for instructors.

## Features

- 🎓 Multi-instructor system with isolated class management
- 🔗 Deep linking for easy class enrollment via Telegram
- 🎲 Randomized question selection to prevent cheating
- 📊 Excel export for quiz results
- 🖼️ Rich media support (images in questions)
- 💡 Answer explanations after quiz completion

## Tech Stack

- **Backend:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL
- **Frontend:** React + Tailwind CSS
- **Telegram Bot:** python-telegram-bot

## Project Structure

```
uni-quiz-app/
├── backend/           # FastAPI server
├── frontend/
│   ├── admin-dashboard/   # Instructor web app
│   └── mini-app/          # Student Telegram mini app
└── docker-compose.yml
```

## Quick Start

### 1. Clone and Setup

```bash
cd uni-quiz-app

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

### 4. Start Development Servers

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Admin Dashboard
cd frontend/admin-dashboard
npm install && npm run dev

# Mini App
cd frontend/mini-app
npm install && npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT
