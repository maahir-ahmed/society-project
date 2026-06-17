# UNSW Society Management Platform

A production-ready, self-hosted web platform for managing UNSW student society operations. Built for societies like SecSoc, CSESoc, PCSoc, and others.

## Features

- **Multi-tenant** — Multiple societies on one installation, each with their own slug URL
- **Role-based access** — Executive, Director, and Subcommittee roles with granular permissions
- **Content Request System** — Marketing request workflow with Rubric event integration
- **Room Booking System** — Arc booking requests with external guest warnings (7-day rule)
- **Treasury System** — Reimbursement workflow with configurable multi-executive approval
- **Forum Threads** — Every request gets a discussion thread with internal notes (execs only)
- **Notification System** — In-app + email notifications for all key events
- **Executive Queue** — Centralised dashboard for all items requiring exec action
- **Audit Logging** — Complete history of all actions across the platform
- **Society Customisation** — Name, logo, colours, social links per society

## Quick Start

```bash
# Install dependencies
npm install

# Start local database
docker compose -f docker-compose.dev.yml up -d

# Set up environment
cp .env.example .env
# Edit .env: set AUTH_SECRET to a random string (openssl rand -base64 32)

# Run migrations + seed demo data
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

Demo accounts (password: `password123`):
| Email | Role |
|---|---|
| `maahir@secsoc.unsw.edu.au` | Executive (President & Treasurer) |
| `alice@secsoc.unsw.edu.au` | Executive |
| `bob@secsoc.unsw.edu.au` | Director |
| `charlie@secsoc.unsw.edu.au` | Subcommittee |

## Production Deployment

```bash
cp .env.example .env.production
# Edit .env.production with production values + strong secrets

docker compose --env-file .env.production up -d --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full guide including Nginx, SSL, backups, and CI/CD.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth v5 (JWT sessions) |
| UI | TailwindCSS 4 + shadcn/ui |
| Email | Nodemailer (SMTP) |
| Deployment | Docker + Docker Compose |

## Treasury Approval Rules

| Amount | Required Approvals |
|---|---|
| Under $50 | 1 Executive |
| $50 or over | 3 Executives, including the Treasurer |

## Documentation

- [Architecture & API](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Adding a New Society

1. Register at `/register`
2. Go to `/setup` to create your society (you become its first Executive)
3. Add members from the Members page
4. Customise branding in Settings
