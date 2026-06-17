# Society Platform — Architecture

## Overview

The Society Platform is a multi-tenant, self-hosted web application for managing UNSW student society operations. It provides a centralised dashboard for executives, directors, and subcommittee members to handle content requests, room bookings, treasury reimbursements, and team communication.

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Full-stack React, SSR, file-based routing |
| Language | TypeScript | Type safety across the full stack |
| Styling | TailwindCSS 4 + shadcn/ui | Rapid, consistent UI development |
| ORM | Prisma 6 | Type-safe DB access, migrations |
| Database | PostgreSQL 16 | Relational, reliable, ACID-compliant |
| Auth | NextAuth v5 (Auth.js) | Credentials + future OAuth support |
| Email | Nodemailer | Self-hosted email, zero vendor lock-in |
| Deployment | Docker + Docker Compose | Reproducible, self-hosted |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App Router  (RSC + Client Components)       │  │
│  │  ├── /[society]/dashboard                            │  │
│  │  ├── /[society]/requests/content                    │  │
│  │  ├── /[society]/requests/room-booking               │  │
│  │  ├── /[society]/requests/treasury                   │  │
│  │  ├── /[society]/executive/queue                     │  │
│  │  ├── /[society]/members                             │  │
│  │  └── /[society]/settings                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────────┐
│                  Next.js API Routes                         │
│  /api/auth/[...nextauth]       — Authentication             │
│  /api/societies/[slug]/...     — Society-scoped CRUD        │
│  /api/notifications/...        — Notification management    │
│  /api/upload                   — File upload handler        │
└─────────────────────┬───────────────────────────────────────┘
                      │ Prisma
┌─────────────────────▼───────────────────────────────────────┐
│               PostgreSQL Database                           │
│  Multi-tenant: all data scoped by societyId                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Model

Each society has a unique `slug` (URL identifier) and all records are scoped to a `societyId`. A user can be a member of multiple societies with different roles in each.

URL structure: `/{society-slug}/dashboard`

Example: `/secsoc/dashboard`, `/csesoc/dashboard`

---

## Database Schema (Entity Relationships)

```
Society ──< SocietyMembership >── User
   │
   ├──< ContentRequest
   │        └── Thread ──< Comment
   │
   ├──< RoomBooking
   │        └── Thread ──< Comment
   │
   ├──< TreasuryRequest
   │        ├── TreasuryApproval >── User
   │        ├── TreasuryAttachment
   │        └── Thread ──< Comment
   │
   └──< Announcement
```

---

## User Roles & Permissions

| Permission | Subcommittee | Director | Executive |
|---|:---:|:---:|:---:|
| Submit content request | ✓ | ✓ | ✓ |
| Submit room booking | ✓ | ✓ | ✓ |
| Submit treasury claim | ✓ | ✓ | ✓ |
| View own requests | ✓ | ✓ | ✓ |
| View all requests | ✗ | ✓ | ✓ |
| Assign requests | ✗ | ✓ | ✓ |
| Update request status | ✗ | ✓ | ✓ |
| Approve treasury claims | ✗ | ✗ | ✓ |
| Access executive queue | ✗ | ✗ | ✓ |
| Attach Rubric events | ✗ | ✗ | ✓ |
| Manage members | ✗ | ✗ | ✓ |
| Change society settings | ✗ | ✗ | ✓ |

---

## Treasury Approval Rules

| Amount | Approvals Required | Notes |
|---|---|---|
| < $50 | 1 Executive | Any executive |
| ≥ $50 | 3 Executives | Must include the Treasurer |

Approval revocation: Any executive can revoke their own approval. If the request was already approved, it reverts to `AWAITING_APPROVAL`.

If the amount is edited after approval, all approvals are automatically revoked.

---

## Request Workflows

### Content Request
```
DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → COMPLETED
                              → AWAITING_INFORMATION
                              → AWAITING_EXECUTIVE_ACTION (Rubric)
                  → CANCELLED
```

### Room Booking
```
SUBMITTED → UNDER_REVIEW → SUBMITTED_TO_ARC → APPROVED → COMPLETED
                         → WAITING_ON_INFORMATION
          → REJECTED
```

### Treasury
```
DRAFT → SUBMITTED → AWAITING_APPROVAL → APPROVED → REIMBURSEMENT_PENDING → REIMBURSED
                                      → REJECTED
```

---

## API Design

All society-scoped endpoints follow the pattern:
```
/api/societies/{slug}/...
```

Authentication is required for all routes except `/api/auth/*`. Role requirements are enforced per endpoint.

### Key Endpoints

| Method | Path | Role Required | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/societies | Authenticated | Create society |
| GET | /api/societies/{slug} | Member | Get society details |
| PATCH | /api/societies/{slug} | Executive | Update society settings |
| GET | /api/societies/{slug}/content-requests | Member | List content requests |
| POST | /api/societies/{slug}/content-requests | Member | Create content request |
| PATCH | /api/societies/{slug}/content-requests/{id} | Director+ | Update status/assign |
| POST | /api/societies/{slug}/content-requests/{id}/rubric | Executive | Attach Rubric event |
| GET | /api/societies/{slug}/room-bookings | Member | List room bookings |
| POST | /api/societies/{slug}/room-bookings | Member | Create room booking |
| PATCH | /api/societies/{slug}/room-bookings/{id} | Executive | Update status/assign |
| GET | /api/societies/{slug}/treasury | Member | List treasury requests |
| POST | /api/societies/{slug}/treasury | Member | Submit reimbursement |
| PATCH | /api/societies/{slug}/treasury/{id} | Executive | Update status |
| POST | /api/societies/{slug}/treasury/{id}/approve | Executive | Approve claim |
| DELETE | /api/societies/{slug}/treasury/{id}/approve | Executive | Revoke approval |
| POST | /api/societies/{slug}/threads/{id}/comments | Member | Post comment |
| POST | /api/societies/{slug}/members | Executive | Add member |
| GET | /api/notifications | Authenticated | Get notifications |
| POST | /api/notifications/read-all | Authenticated | Mark all read |
| POST | /api/upload | Authenticated | Upload file |

---

## Security Architecture

### Authentication
- Credentials-based auth with bcrypt password hashing (cost factor 12)
- JWT sessions stored securely via NextAuth
- Session validation on every protected route via middleware

### Authorisation
- Multi-level RBAC: `SUBCOMMITTEE < DIRECTOR < EXECUTIVE`
- All API routes validate society membership before data access
- `societyId` is always server-derived, never trusted from client input

### Data Protection
- All user inputs validated with Zod schemas
- File uploads: MIME type check + size limit + UUID-randomised filenames
- Bank details should be encrypted at rest in production (see deployment guide)
- Rate limiting should be added via middleware or reverse proxy in production

### OWASP Top 10 Mitigations
- **A01 Broken Access Control**: RBAC enforced on every API route
- **A02 Cryptographic Failures**: bcrypt for passwords, HTTPS enforced via reverse proxy
- **A03 Injection**: Prisma parameterised queries prevent SQL injection
- **A04 Insecure Design**: Least-privilege role hierarchy
- **A05 Security Misconfiguration**: Docker secrets for credentials
- **A07 Auth Failures**: NextAuth handles session management securely
- **A09 Logging**: Comprehensive audit log for all actions

---

## File Structure

```
society-platform/
├── src/
│   ├── app/                     # Next.js App Router pages + API
│   │   ├── (auth)/              # Login, register pages
│   │   ├── [society]/           # Society-scoped pages (dashboard, requests, etc.)
│   │   ├── api/                 # API route handlers
│   │   └── setup/               # New society setup
│   ├── components/
│   │   ├── ui/                  # Base UI components (shadcn-compatible)
│   │   ├── layout/              # Sidebar, Header
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── requests/            # Request forms + thread view + approval panels
│   │   └── shared/              # Reusable: StatusBadge, UserAvatar, etc.
│   ├── lib/
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── db.ts                # Prisma singleton
│   │   ├── api.ts               # Auth/membership helpers for routes
│   │   ├── permissions.ts       # RBAC logic + treasury approval rules
│   │   ├── notifications.ts     # In-app + email notifications
│   │   ├── audit.ts             # Audit log writer
│   │   └── email.ts             # Nodemailer transport
│   └── types/                   # Shared TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Demo data seed
├── docs/                        # Architecture + deployment docs
├── uploads/                     # Local file storage (bind-mounted in Docker)
├── Dockerfile
├── docker-compose.yml           # Production
└── docker-compose.dev.yml       # Local DB only
```
