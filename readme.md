# 🚀 Team Management Backend System

<p align="center">
  <b>Role-Based Access Control (RBAC) Backend for Teams, Projects & Tasks</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" />
  <img src="https://img.shields.io/badge/Express.js-Backend-lightgrey" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748" />
  <img src="https://img.shields.io/badge/Auth-JWT-orange" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-yellow" />
</p>

---

## 📌 Overview

A scalable backend system designed to manage users, teams, projects, and tasks with secure **Role-Based Access Control (RBAC)**.

The system models enterprise-style team collaboration, where permissions vary based on roles such as Admin, Manager, User, and Guest.

This project focuses on:

- Clean & modular backend architecture
- Secure authentication and authorization
- Relational database design
- Scalable CRUD operations
- Practical backend development patterns

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Cookie-based session handling
- Role-Based Access Control (ADMIN / MANAGER / USER / GUEST)
- Protected routes via middleware
- Forgot password & reset password flow
- Admin-initiated forced password reset

---

### 👥 User Management
- User registration & login
- First registered user automatically becomes ADMIN
- Assign/remove users from teams (Admin only)
- Admin-only role assignment (max 3 Admins enforced)
- Role-filtered user listing

---

### 🏢 Team Management
- Create, update, delete teams (Admin only)
- Unique team codes for joining
- Search teams by name/code/description
- View team members
- Automatic member `teamId` cleanup on team deletion (`onDelete: SetNull`)

---

### 📁 Project Management
- Projects linked to teams
- Created-by tracking
- Unique project names per team
- Status support: `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`
- Admin can create projects for any team via team code; Manager can create for their own team

---

### ✅ Task Management
- Create tasks within projects (Manager / Admin)
- Assign tasks to team members
- Track task creator
- Validation ensures assignee belongs to the project's team

---

## 🧱 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Postman / Frontend)            │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP Requests (JSON + Cookies)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Express.js Server                         │
│                        (src/index.ts)                           │
│                                                                 │
│  Middleware:  express.json()  │  cookie-parser                  │
└──────┬──────────────┬─────────────────────────────┬────────────┘
       │              │                             │
       ▼              ▼                             ▼
┌────────────┐ ┌────────────┐              ┌──────────────────┐
│ auth.route │ │ user.route │  ...etc...   │  health.route    │
└─────┬──────┘ └─────┬──────┘              └──────────────────┘
      │              │
      ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Controllers Layer                         │
│  auth.controller  │  user.controller  │  team.controller        │
│  project.controller  │  task.controller  │  health.controller   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          lib/ Utilities                          │
│   auth.ts  (JWT, bcrypt, permission check, CheckUserAuth)        │
│   db.ts    (Prisma client singleton)                             │
│   cookie.config.ts  (cookie options)                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Prisma ORM (type-safe queries)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│   users │ teams │ projects │ tasks │ comments                   │
└─────────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── index.ts                  ← Express app entry point & route mounting
├── controllers/
│   ├── auth.controller.ts    ← Register, Login, Logout, Change/Reset Password
│   ├── user.controller.ts    ← Get users, Assign team/role, Remove from team
│   ├── team.controller.ts    ← Create, Update, Delete, List teams & members
│   ├── project.controller.ts ← Create & list projects
│   ├── task.controller.ts    ← Create tasks
│   └── health.controller.ts  ← Health check endpoint
├── routes/
│   ├── auth.route.ts
│   ├── user.route.ts
│   ├── team.route.ts
│   ├── project.route.ts
│   ├── task.route.ts
│   └── health.route.ts
├── lib/
│   ├── auth.ts               ← JWT utils, bcrypt helpers, permission checker
│   ├── db.ts                 ← Prisma client singleton
│   └── cookie.config.ts      ← Shared cookie options
├── prisma/
│   ├── schema.prisma         ← Database schema & relations
│   └── migrations/           ← Auto-generated migration files
├── types/
│   └── index.ts              ← Shared TypeScript types & enums
└── generated/
    └── prisma/               ← Auto-generated Prisma client
```

---

## 🗄️ Database Schema (ER Diagram)

```
┌──────────────────────────────────────────────────────────────────────┐
│  users                                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  id (PK, cuid)  │  email (unique)  │  name  │  password             │
│  role (ADMIN|MANAGER|USER|GUEST)   │  teamId (FK → teams, nullable) │
│  mustChangePassword  │  resetToken  │  resetTokenExpiry              │
│  passwordChangedAt  │  createdAt  │  updatedAt                      │
└───────────┬──────────────────────────────────────────────────────────┘
            │ N:1                              1:N
            ▼                                  │
┌───────────────────────────┐        ┌─────────▼──────────────────────┐
│  teams                    │        │  tasks                         │
│  ─────────────────────    │        │  ──────────────────────────    │
│  id (PK, cuid)            │        │  id (PK, cuid)                 │
│  name (unique)            │        │  title  │  description         │
│  description              │        │  status (PENDING|IN_PROGRESS   │
│  code (unique)            │        │          |COMPLETED|ON_HOLD)   │
│  createdAt  │  updatedAt  │        │  priority (LOW|NORMAL|HIGH     │
└─────┬───────┘             │        │            |URGENT)            │
      │ 1:N                 │        │  dueTime                       │
      ▼                     │        │  projectId (FK → projects)     │
┌─────────────────────────────────┐  │  assigneeId (FK → users, null) │
│  projects                       │  │  createdById (FK → users)      │
│  ──────────────────────────     │  │  createdAt  │  updatedAt       │
│  id (PK, cuid)                  │  └─────────────────┬──────────────┘
│  name                           │                    │ 1:N
│  description                    │                    ▼
│  status (ACTIVE|ON_HOLD         │        ┌───────────────────────────┐
│          |COMPLETED|ARCHIVED)   │        │  comments                 │
│  teamId (FK → teams, Cascade)   │        │  ──────────────────────── │
│  createdById (FK → users)       │        │  id (PK, cuid)            │
│  createdAt  │  updatedAt        │        │  content                  │
└─────────────────────────────────┘        │  taskId (FK → tasks)      │
                                           │  authorId (FK → users)    │
                                           │  createdAt  │  updatedAt  │
                                           └───────────────────────────┘
```

**Key Cascade Rules:**
| Relation | On Delete Behaviour |
|---|---|
| User → Team | `SetNull` (user's `teamId` becomes null) |
| Project → Team | `Cascade` (projects deleted with team) |
| Task → Project | `Cascade` (tasks deleted with project) |
| Comment → Task | `Cascade` (comments deleted with task) |
| Task assignee → User | `SetNull` (task becomes unassigned) |
| Comment author → User | `SetNull` (comment kept, author nulled) |

---

## 🔐 Authentication Flow

```
Register / Login
      │
      ▼
POST /api/auth/register  or  POST /api/auth/login
      │
      ├─► Validate input fields
      │
      ├─► [Register] Hash password (bcrypt, 12 rounds)
      │   Determine role: first user → ADMIN, others → USER
      │   Optional: join team via teamCode
      │
      ├─► [Login] Verify password hash
      │   Check mustChangePassword flag → 403 if set
      │
      ├─► Generate JWT (7-day expiry, signed with JWT_SECRET)
      │
      └─► Set HttpOnly cookie "access_token"
          Return user data + token in response body

─────────────────────────────────────────────

Authenticated Request Flow
      │
      ▼
Every protected controller calls:  CheckUserAuth(req)
      │
      ├─► Read "access_token" from cookie
      ├─► Verify JWT → decode userId
      ├─► Fetch user from DB
      └─► Return User object (without password)
             │
             └─► checkUserPermission(user, requiredRole)
                   Role hierarchy:  GUEST(0) < USER(1) < MANAGER(2) < ADMIN(3)

─────────────────────────────────────────────

Password Reset Flow
      │
      ├─► POST /api/auth/forgot-password  { email }
      │       → Generate SHA-256 hashed token, store in DB (15-min expiry)
      │       → Token URL logged to console (email service TBD)
      │
      ├─► POST /api/auth/reset-password?token=<raw_token>  { newPassword }
      │       → Hash incoming token, match against DB
      │       → Update password, clear reset fields
      │
      ├─► PATCH /api/auth/change-password  { currentPassword, newPassword }
      │       → Requires valid session cookie
      │
      ├─► PATCH /api/user/:userId/reset-password  (Admin only)
      │       → Generates random temp password, sets mustChangePassword = true
      │
      └─► POST /api/auth/force-change-password  { email, password, newPassword }
              → Used by user on first login after admin reset
              → Clears mustChangePassword flag, issues new JWT
```

---

## 👥 User & Team Assignment Flow

```
Admin assigns user to team
      │
      ▼
PATCH /api/user/:userId/team  { teamCode }
      │
      ├─► Auth check: must be ADMIN
      ├─► Validate team code → resolve team
      ├─► Ensure target user is not ADMIN
      ├─► Ensure target user has no existing team
      └─► Connect user to team in DB

─────────────────────────────────────────────

Admin removes user from team
      │
      ▼
DELETE /api/user/:userId/team
      │
      ├─► Auth check: must be ADMIN
      ├─► Ensure target user is not ADMIN
      ├─► Ensure target user belongs to a team
      └─► Disconnect user from team (teamId → null)

─────────────────────────────────────────────

Admin assigns role to user
      │
      ▼
PATCH /api/user/:userId/role  { role }
      │
      ├─► Auth check: must be ADMIN; cannot change own role
      ├─► Validate role value (ADMIN / MANAGER / USER / GUEST)
      ├─► [DB Transaction]
      │     If new role = ADMIN → check adminCount < 3 (MAX_ADMINS)
      │     If demoting ADMIN  → check adminCount > 1 (keep ≥1 admin)
      │     If new role = ADMIN → disconnect user from any team
      └─► Update role in DB
```

---

## 📁 Project & Task Creation Flow

```
Create Project
      │
      ▼
POST /api/project/create  { name, description, teamCode? }
      │
      ├─► Auth check: must be MANAGER or ADMIN
      ├─► MANAGER → uses own teamId (no teamCode needed)
      │   ADMIN   → requires teamCode in body
      ├─► Resolve team from DB
      ├─► Check project name uniqueness within team
      └─► Create project record linked to team + creator

─────────────────────────────────────────────

Create Task
      │
      ▼
POST /api/task/create  { title, description, projectId, assigneeId? }
      │
      ├─► Auth check: must be MANAGER or ADMIN
      ├─► Validate projectId → resolve project
      ├─► MANAGER → project must belong to their own team
      ├─► If assigneeId provided:
      │     Resolve assignee from DB
      │     Non-admin assignee must belong to the project's team
      └─► Create task linked to project + creator + assignee
```

---

## 🛡️ RBAC Permissions Matrix

| Action | GUEST | USER | MANAGER | ADMIN |
|--------|:-----:|:----:|:-------:|:-----:|
| Register / Login / Logout | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ |
| View own profile (`/me`) | ✅ | ✅ | ✅ | ✅ |
| List users (own team only, non-admin) | ❌ | ✅ | ✅ | ✅ |
| List all users | ❌ | ❌ | ❌ | ✅ |
| Assign user to team | ❌ | ❌ | ❌ | ✅ |
| Remove user from team | ❌ | ❌ | ❌ | ✅ |
| Assign role to user | ❌ | ❌ | ❌ | ✅ |
| Admin-reset user password | ❌ | ❌ | ❌ | ✅ |
| Create team | ❌ | ❌ | ❌ | ✅ |
| Update team | ❌ | ❌ | ❌ | ✅ |
| Delete team | ❌ | ❌ | ❌ | ✅ |
| List all teams | ❌ | ❌ | ❌ | ✅ |
| View own team members | ❌ | ✅ | ✅ | ✅ |
| View any team's members | ❌ | ❌ | ❌ | ✅ |
| Create project (own team) | ❌ | ❌ | ✅ | ✅ |
| Create project (any team) | ❌ | ❌ | ❌ | ✅ |
| View projects (own team) | ❌ | ✅ | ✅ | ✅ |
| View all projects | ❌ | ❌ | ❌ | ✅ |
| Create task (own team) | ❌ | ❌ | ✅ | ✅ |
| Create task (any team) | ❌ | ❌ | ❌ | ✅ |

> **Role hierarchy:** `GUEST (0) < USER (1) < MANAGER (2) < ADMIN (3)`  
> Max 3 Admin accounts are permitted at any time (enforced via `MAX_ADMINS` constant in `src/lib/auth.ts`, checked inside a DB transaction in `src/controllers/user.controller.ts`).

---

## 📡 API Endpoint Reference

### 🔑 Auth  `base: /api/auth`

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login and receive JWT cookie |
| `POST` | `/logout` | ❌ | Clear auth cookie |
| `PATCH` | `/change-password` | ✅ Cookie | Change own password |
| `POST` | `/forgot-password` | ❌ | Request password reset token |
| `POST` | `/reset-password?token=<token>` | ❌ | Reset password with token |
| `POST` | `/force-change-password` | ❌ | Complete forced password change |

---

### 👤 User  `base: /api/user`

| Method | Path | Min Role | Description |
|--------|------|:--------:|-------------|
| `GET` | `/me` | Any | Get current authenticated user |
| `GET` | `/` | USER | List users (filtered by role) |
| `PATCH` | `/:userId/team` | ADMIN | Assign user to a team |
| `DELETE` | `/:userId/team` | ADMIN | Remove user from team |
| `PATCH` | `/:userId/role` | ADMIN | Change user's role |
| `PATCH` | `/:userId/reset-password` | ADMIN | Force-reset a user's password |

---

### 🏢 Team  `base: /api/team`

| Method | Path | Min Role | Description |
|--------|------|:--------:|-------------|
| `POST` | `/create` | ADMIN | Create a new team |
| `PATCH` | `/:teamId` | ADMIN | Update team name/code/description |
| `DELETE` | `/:teamId` | ADMIN | Delete a team |
| `GET` | `/` | ADMIN | List all teams (supports `?search=`) |
| `GET` | `/:teamId/members` | USER | List members of a team |

---

### 📁 Project  `base: /api/project`

| Method | Path | Min Role | Description |
|--------|------|:--------:|-------------|
| `POST` | `/create` | MANAGER | Create a project |
| `GET` | `/` | USER | List projects (supports `?status=` `?search=`) |

---

### ✅ Task  `base: /api/task`

| Method | Path | Min Role | Description |
|--------|------|:--------:|-------------|
| `POST` | `/create` | MANAGER | Create a task within a project |

---

### ❤️ Health  `base: /api/health`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/` | ❌ | Server health check |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict) |
| Framework | Express.js v5 |
| ORM | Prisma v7 |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Session | HTTP-only cookie (`cookie-parser`) |
| Dev Tools | `tsx`, `nodemon`, `Prisma Migrate`, Postman |

---

## ⚙️ Installation & Setup

### Clone Repository

```bash
git clone https://github.com/Kuntal616/TeamManageWithRoleBasedAccess-CRUD-Backend.git
cd TeamManageWithRoleBasedAccess-CRUD-Backend
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=your_postgres_connection_url
JWT_SECRET=your_secret_key
PORT=3000
```

### Prisma Setup

```bash
npm run db:migrate    # Apply migrations to the database
npm run db:generate   # Generate Prisma client
```

### Run Server

```bash
npm run dev           # Development (hot-reload with nodemon + tsx)
npm run start         # Production (compile TypeScript then run)
```

Server runs at: `http://localhost:3000`

---

## 🧪 API Testing

Test all endpoints using **Postman**.

### Quick Start Examples

```bash
# 1. Register first user (auto-assigned ADMIN role)
POST http://localhost:3000/api/auth/register
Body: { "name": "Alice", "email": "alice@example.com", "password": "secret123" }

# 2. Login
POST http://localhost:3000/api/auth/login
Body: { "email": "alice@example.com", "password": "secret123" }

# 3. Create a team (ADMIN)
POST http://localhost:3000/api/team/create
Body: { "name": "Engineering", "code": "ENG01", "description": "Core engineering team" }

# 4. Register another user and join team
POST http://localhost:3000/api/auth/register
Body: { "name": "Bob", "email": "bob@example.com", "password": "secret123", "teamCode": "ENG01" }

# 5. Promote Bob to MANAGER (as ADMIN)
PATCH http://localhost:3000/api/user/<bob_id>/role
Body: { "role": "MANAGER" }

# 6. Create a project (MANAGER or ADMIN)
POST http://localhost:3000/api/project/create
Body: { "name": "Website Redesign", "description": "Q3 initiative" }

# 7. Create a task (MANAGER or ADMIN)
POST http://localhost:3000/api/task/create
Body: { "title": "Design mockups", "projectId": "<project_id>", "assigneeId": "<user_id>" }
```

---

## 👨‍💻 Author

**Kuntal Sadhukhan**
- GitHub: [https://github.com/Kuntal616](https://github.com/Kuntal616)
- LinkedIn: [https://www.linkedin.com/in/dev-kuntalsadhukhan/](https://www.linkedin.com/in/dev-kuntalsadhukhan/)
