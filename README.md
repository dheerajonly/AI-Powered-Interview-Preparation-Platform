# Prepwise — Prepwise — AI Interview Planner

A React + Express + MongoDB interview preparation app using Gemini for personalized plans, fresh MCQ practice tests, overall feedback, and resume PDF generation.

## Requirements
- Node.js 20 or newer
- MongoDB connection string
- Google Gemini API key

## Setup

### 1. Configure the backend
```bash
cd Backend
npm install
```
Copy `.env.example` to `.env` and fill in your own `MONGO_URI`, `JWT_SECRET`, and `GOOGLE_GENAI_API_KEY` values. Do not commit `.env`.

Start the API:
```bash
npm run dev
```
The API runs on `http://localhost:3000`; health check: `http://localhost:3000/api/health`.

### 2. Configure the frontend
In another terminal:
```bash
cd Frontend
npm install
```
Copy `.env.example` to `.env` if you need a non-default API URL, then run:
```bash
npm run dev
```
Vite prints the local frontend URL, normally `http://localhost:5173`.

## Main features
- Redesigned dashboard and authentication pages
- Job-specific interview plan and preparation roadmap
- Fresh, role-relevant 10-question MCQ assessments
- Backend-calculated scores and answer explanations
- AI-generated overall performance feedback and improvement areas
- Performance history, score trends, and per-attempt answer review
- Tailored ATS-friendly resume PDF generation

## Security and compatibility notes
- Resume upload currently supports PDF only, up to 5 MB, because the current parser extracts PDF text. DOCX is intentionally rejected rather than accepted and then failing during parsing.
- Keep `.env` and credentials private. Rotate any key that was committed to a public repository.
- Practice attempts are scoped to the authenticated user. Correct answers are not included in the question-generation or history-list responses.
