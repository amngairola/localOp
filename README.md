# LifeOps

An AI-powered personal life management platform that helps you stay on top of reminders, bills, subscriptions, expenses, tasks, and documents — all through a natural-language AI assistant.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL via Supabase |
| Cache | Upstash Redis |
| AI | Groq (LLaMA) + Google Gemini |
| Auth | Supabase Auth |
| Queue | BullMQ |
| Storage | Supabase Storage |

## Repository Structure

```
lifeOp/
├── frontend/   # Next.js 15 App Router application
├── backend/    # Express + Prisma API server
├── README.md   # This file
└── .gitignore
```

## Setup

- See [frontend/README.md](./frontend/README.md) for frontend setup instructions.
- See [backend/README.md](./backend/README.md) for backend setup instructions.

## Features

- 🔔 Smart reminders with recurrence and notifications
- 💳 Bill tracking with due-date alerts
- 📦 Subscription management
- 💰 Expense logging and categorisation
- ✅ Task management
- 📄 Document upload with AI extraction
- 🤖 Natural-language AI assistant (Groq + Gemini)
- 🔒 Supabase Auth with Row-Level Security

# localOp
