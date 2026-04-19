# 🏫 SchoolSaaS — Enterprise School Management Platform

A production-ready, multi-tenant SaaS platform for schools and educational institutes to manage students, fees, attendance, admissions, and communication.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, ShadCN UI |
| **State** | Redux Toolkit + RTK Query |
| **Backend** | Fastify (modular plugin architecture) |
| **Database** | MongoDB Atlas (multi-tenant) |
| **Queue** | Redis + BullMQ |
| **Realtime** | Socket.IO |
| **Email** | Nodemailer |
| **Auth** | JWT + RBAC |
| **Deploy** | Docker + Nginx + GitHub Actions |

---

## 📁 Project Structure

```
school-saas/
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/
│       │   ├── auth/login/    # Login page
│       │   └── dashboard/     # All dashboard pages
│       ├── components/
│       │   └── layout/        # Sidebar, Header, AuthGuard, SocketProvider
│       ├── store/
│       │   ├── api/           # RTK Query endpoints (all modules)
│       │   └── slices/        # auth, ui, notification slices
│       ├── hooks/             # Typed Redux hooks
│       └── lib/utils.ts       # Utility functions
│
├── backend/                   # Fastify API
│   └── src/
│       ├── modules/           # auth, students, teachers, classes,
│       │   │                  # fees, attendance, admissions,
│       │   │                  # communication, notifications, tenants, dashboard
│       ├── models/            # Mongoose models (7 models)
│       ├── queues/workers/    # BullMQ workers (email, WhatsApp, reminders)
│       ├── services/          # email.service, whatsapp.service, socket.service
│       ├── middleware/        # auth.middleware (JWT + RBAC)
│       ├── config/            # database.ts, redis.ts
│       └── utils/             # logger, errors, helpers
│
├── docker/
│   └── nginx.conf
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 🧩 Modules

| Module | Features |
|--------|----------|
| **Auth** | Login, JWT, refresh token, RBAC, multi-tenant |
| **Students** | CRUD, profiles, parent info, lifecycle, docs |
| **Teachers** | Profiles, subject allocation, leaves |
| **Classes** | Class/section/subject management, timetable |
| **Fees** | Fee structures, invoices, payments, defaulters, analytics |
| **Attendance** | Daily marking, bulk, reports, absentee alerts |
| **Admissions** | Lead CRM, follow-ups, status pipeline, automation |
| **Communication** | Email/WhatsApp/SMS broadcast, templates, scheduling |
| **Notifications** | Real-time WebSocket, in-app notification center |
| **Dashboard** | Stats, revenue charts, enrollment trends, alerts |

---

## 👥 Roles & Permissions (RBAC)

| Role | Access |
|------|--------|
| `super_admin` | All tenants, full access |
| `school_admin` | Full access within their school |
| `teacher` | Attendance marking, own profile |
| `accountant` | Fee management, reports |
| `student` / `parent` | Read-only (future) |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB Atlas account
- Redis (local or cloud)

### 1. Clone & Configure

```bash
git clone <repo>
cd school-saas
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, SMTP credentials, etc.
```

### 2. Run with Docker

```bash
docker-compose up -d
```

App will be available at `http://localhost` (via Nginx)

### 3. Run in Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

Backend: `http://localhost:8000`  
Frontend: `http://localhost:3000`

---

## 🔌 API Overview

All API routes are prefixed with `/api/v1`

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/dashboard/stats
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/fees/invoices
POST   /api/v1/fees/invoices/:id/payment
POST   /api/v1/attendance/mark
POST   /api/v1/communication/broadcast
GET    /api/v1/admissions
POST   /api/v1/admissions/:id/followup
```

---

## 🔔 Real-Time Events (WebSocket)

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:tenant` | Client → Server | Join school room |
| `fee:reminder-sent` | Server → Client | Fee reminder dispatched |
| `attendance:alert` | Server → Client | Absentee alert sent |
| `admission:followup` | Server → Client | Follow-up message sent |
| `notification:new` | Server → Client | New in-app notification |

---

## 📬 Queue Jobs (BullMQ)

| Queue | Jobs |
|-------|------|
| `email-queue` | `send-email` |
| `whatsapp-queue` | `send-whatsapp` |
| `reminders-queue` | `fee-reminder`, `attendance-alert`, `admission-followup` |

---

## 🏗️ Multi-Tenant Architecture

- Each school is a **tenant** with a unique `slug`
- All data is isolated by `tenantId` index on every collection
- JWT payload carries `tenantId` for automatic scoping
- Cross-tenant access is blocked at middleware level
- Subscription plans: Basic / Pro / Enterprise

---

## 🚢 Deployment (CI/CD)

GitHub Actions pipeline (`.github/workflows/ci.yml`):
1. **Lint & Build** — validates both frontend and backend
2. **Docker Build & Push** — builds images to GitHub Container Registry on `main` branch

---

## 📈 Future Roadmap

- [ ] Parent mobile app (React Native)
- [ ] Online classes (Zoom/Meet API)
- [ ] AI-based insights (dropout prediction)
- [ ] GST-ready invoicing
- [ ] Multi-language support
- [ ] Exam & grade management
- [ ] Document management system
- [ ] Biometric attendance integration

---

## 📄 License

MIT © SchoolSaaS
