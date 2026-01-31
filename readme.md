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

Clean & modular backend architecture
Secure authentication and authorization
Relational database design
Scalable CRUD operations
Practical backend development patterns

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- JWT-based authentication  
- Cookie-based session handling  
- Role-Based Access Control (ADMIN / MANAGER / USER / GUEST)  
- Protected routes via middleware  

---

### 👥 User Management
- User registration & login  
- First registered user becomes ADMIN  
- Assign/remove users from teams  
- Admin-only role assignment  
- Role-filtered user listing  

---

### 🏢 Team Management
- Create, update, delete teams (Admin only)  
- Unique team codes for joining  
- Search teams by name/code  
- View team members  
- Automatic member cleanup on deletion  

---

### 📁 Project Management
- Projects linked to teams  
- Created-by tracking  
- Unique project names per team  
- Status support (Active, On Hold, Completed, Archived)  

---

### ✅ Task Management
- Create tasks within projects  
- Assign tasks to team members  
- Track task creator  
- Validation for team-based assignment  

---

## 🧱 Architecture

src/
│── controllers/
│── routes/
│── lib/



Designed for scalability and maintainability.

---

## 🛠 Tech Stack

**Backend**
- Node.js  
- Express.js  
- TypeScript  

**Database**
- PostgreSQL  
- Prisma ORM  

**Authentication**
- JWT  
- Cookie-based sessions  

**Tools**
- Postman  
- Nodemon  
- Prisma Migrate  

---

## ⚙️ Installation & Setup

###  Clone Repository

```bash
git clone https://github.com/Kuntal616/TeamManageWithRoleBasedAccess-CRUD-Backend.git
cd TeamManageWithRoleBasedAccess-CRUD-Backend
```
###  Install Dependencies
```bash
npm install
```
### Environment Variables

Create .env file:
```text
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret_key
PORT=3000
```

### Prisma Setup
```bash
npm run db:migrate
npm run db:generate
```

### Run Server
```bash
npm run dev
```

### Server runs at:
`http://localhost:3000`


---

🧪 API Testing

Test endpoints using Postman.

Example routes:

```bash
POST /api/user/register
POST /api/user/login
GET  /api/team
POST /api/project
POST /api/task
```

👨‍💻 Author

Kuntal Sadhukhan
GitHub: `https://github.com/Kuntal616`
LinkedIn: `https://www.linkedin.com/in/dev-kuntalsadhukhan/`
