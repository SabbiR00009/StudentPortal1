# 🎓 Bengal International University (BIU)

A full-stack **university website + management system**. It combines a public,
marketing-grade university website with a secure, role-based portal for
**Students**, **Faculty**, and **Admins** — covering advising, enrollment, grades,
financials, messaging, and administration.

Built with **React + Vite** (frontend) and **Express.js + MySQL** (backend), and
packaged as a single deployable Docker service.

---

## ✨ What's inside

### 🌐 Public website
Home · About · Academics (6 schools, 38 programs) · Admissions (steps, tuition,
scholarships) · Research · Campus Life · News & Events · Contact (working inquiry
form) — responsive, dark/light themed, and fully rebranded to BIU.

### 🧑‍🎓 Student Portal
Home dashboard, course advising with real-time schedule-conflict detection, weekly
schedule, grades + GPA (PDF export), financials, semester-drop requests, messaging,
and profile.

### 👨‍🏫 Faculty Portal
Assigned courses, enrolled-student lists, advisee management, grade submission, and
profile.

### 🛡️ Admin Panel
Full CRUD for students, faculty, and courses; advising slots; grade management;
financials; drop-request and password-reset review; announcements; messaging; and
system settings including automated semester transitions.

---

## 🛠️ Tech stack

**Frontend:** React 19 · Vite 7 · React Router 7 · SCSS Modules · jsPDF
**Backend:** Express 5 · MySQL (mysql2) · JWT (httpOnly cookies) · bcryptjs ·
Helmet · express-rate-limit · compression · node-cron
**Deploy:** Docker (multi-stage) · docker-compose · Render blueprint

---

## 🚀 Quick start (local)

### Prerequisites
- Node.js 18+ and MySQL 8+ (or just Docker — see below)

### 1. Install dependencies
```bash
npm run install:all      # installs backend + frontend
npm install              # root (concurrently)
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env      # then edit DB credentials + JWT_SECRET
```

### 3. Create & seed the database
```bash
npm run init-db           # creates the DB, all tables, and demo data
```

### 4. Run everything
```bash
npm run dev               # backend on :3000, frontend on :5173
```
Open **http://localhost:5173**. In dev, Vite proxies `/api` to the backend.

### 🐳 …or run the whole stack with Docker
```bash
docker compose up --build
docker compose exec app npm run init-db   # first run only
# open http://localhost:3000
```

---

## 🔑 Default logins (demo seed)

| Role | ID / Email | Password |
|---|---|---|
| **Admin** | `admin@biu.edu.bd` | `admin123` |
| **Admin** | `registrar@biu.edu.bd` | `123456` |
| **Faculty** | `F001` … `F006` | `123456` |
| **Student** | `2022-3-60-001` (CSE) | `123456` |
| **Student** | `2022-3-50-001` (EEE) | `123456` |

> Accounts using the default password are forced to change it on first login.
> **Change the admin password immediately after deploying.**

---

## 🔐 Security (commercial hardening)

- Passwords **bcrypt-hashed at rest**; JWTs in **httpOnly** cookies.
- `JWT_SECRET` **required in production** — the app refuses to boot without it.
- **Helmet** security headers, **rate limiting** (stricter on auth), request-size
  limits, and centralized error handling that hides internals in production.
- Environment-driven CORS and cookie (`SameSite`/`Secure`) settings.

---

## 📁 Structure

```
StudentPortal1/
├── Dockerfile · docker-compose.yml · render.yaml   # deployment
├── DEPLOYMENT.md                                   # full deploy guide
├── backend/
│   ├── server.js              # hardened Express entry (API + serves frontend)
│   ├── config/env.js          # centralized, validated configuration
│   ├── db.js                  # MySQL pool
│   ├── scripts/initDb.js      # consolidated schema + seed (replaces old migrations)
│   ├── controllers/ routes/ middleware/ helpers/
└── frontend/
    └── src/
        ├── brand.js           # university identity (single source of truth)
        ├── pages/public/      # the public university website
        ├── pages/{Student,Faculty,Admin}Dashboard/
        └── styles/            # theme tokens (BIU emerald + gold)
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** to put it online.

---

## 📄 License
Educational / portfolio use.

## 👤 Authors
- **Sabbir Hossain**
- **Nura Alam Naim**
