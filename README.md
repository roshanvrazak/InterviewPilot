# VoiceAI — AI Mock Interviewer

An AI-powered mock interview platform with real-time voice interaction, instant feedback, and detailed scorecards.

## Features

- Voice-based interview sessions with AI interviewer
- Mic check and audio setup flow
- Real-time transcription and response
- Post-interview scorecard with detailed feedback
- Dark-themed, responsive UI

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Infrastructure:** Docker Compose

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up
```
