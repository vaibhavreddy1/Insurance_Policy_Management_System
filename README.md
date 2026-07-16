# HDFC Life — Insurance Policy Management System (IPMS)

> **Production-grade MERN Stack application** built for the HDFC Life assignment. Implements full role-based access control, PII masking, all 10 backend business rules, and a premium enterprise FinTech UI.

## Objective

The objective of this project is to design and develop a web-based Insurance Policy Management System that simulates a real-world insurance onboarding and policy issuance workflow. The application provides separate functionalities for Admin and Agent users, ensuring secure access and role-based operations. The system enables Agents to manage the complete customer lifecycle, including customer registration, policy issuance, and policy management, while Admins are responsible for managing Agent accounts and monitoring the overall system. The application focuses on implementing clean architecture, secure authentication, data validation, and proper access control.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local Setup — Backend](#local-setup--backend)
6. [Local Setup — Frontend](#local-setup--frontend)
7. [Environment Variables](#environment-variables)
8. [API Documentation](#api-documentation)
9. [Business Rules Implemented](#business-rules-implemented)
10. [PII Masking](#pii-masking)
11. [Running Tests](#running-tests)
12. [Deployment Guide](#deployment-guide)
13. [Security Features](#security-features)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                       │
│  (TypeScript + Tailwind CSS v4 + React Router v6)        │
│  Route Guards · Role Navigation · PII-masked Tables      │
└──────────────────────────┬──────────────────────────────┘
                           │ HttpOnly Cookie (JWT)
                           │ Axios + /api proxy
┌──────────────────────────▼──────────────────────────────┐
│                   EXPRESS.JS BACKEND                     │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Routes  │→│ Controllers  │→│      Services        │ │
│  └──────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware: Auth · Validate · ErrorHandler      │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼──────────────────────────────┐
│                      MONGODB                             │
│   Collections: users · customers · policies              │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Custom CSS Design System |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (15-min expiry) + HttpOnly Cookies |
| Validation | express-validator (field-level errors) |
| Testing | Jest + Supertest + mongodb-memory-server |
| Security | Helmet · CORS · Rate Limiting · bcryptjs |

## Project Structure

```
hdfc-assig/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app factory
│   │   ├── server.js               # Entry point
│   │   ├── config/
│   │   │   └── database.js         # MongoDB connection
│   │   ├── models/
│   │   │   ├── user.model.js       # Admin + Agent schema
│   │   │   ├── customer.model.js   # Customer + PII schema
│   │   │   └── policy.model.js     # Policy schema (immutable agentId)
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── customer.controller.js
│   │   │   └── policy.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── customer.routes.js
│   │   │   └── policy.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # protect + authorize()
│   │   │   ├── validate.middleware.js  # express-validator chains
│   │   │   └── error.middleware.js     # AppError + errorHandler
│   │   ├── utils/
│   │   │   ├── jwt.util.js         # signToken + cookie helpers
│   │   │   ├── piiMasker.js        # Aadhaar, PAN, Mobile masking
│   │   │   └── seeder.js           # Admin seed script
│   │   └── tests/
│   │       ├── setup.js            # In-memory MongoDB setup
│   │       ├── piiMasker.test.js   # PII unit tests
│   │       ├── auth.test.js        # Auth API tests
│   │       ├── admin.test.js       # Admin API tests
│   │       └── customer.policy.test.js  # Business rules tests
│   ├── .env.example
│   ├── .env                        # (git-ignored)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx                 # Router + protected routes
    │   ├── main.tsx
    │   ├── index.css               # Design system tokens + components
    │   ├── context/
    │   │   └── AuthContext.tsx     # Auth state + session check
    │   ├── lib/
    │   │   └── api.ts              # Axios instance + interceptors
    │   ├── types/
    │   │   └── index.ts            # TypeScript interfaces
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx  # Role-based route guard
    │   │   └── DashboardLayout.tsx # Sidebar + topbar shell
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── admin/
    │       │   ├── AdminDashboard.tsx
    │       │   ├── AgentListPage.tsx   # Paginated + filterable
    │       │   └── CreateAgentPage.tsx
    │       └── agent/
    │           ├── AgentDashboard.tsx
    │           ├── CustomerListPage.tsx
    │           ├── CreateCustomerPage.tsx
    │           ├── CustomerSearchPage.tsx
    │           ├── IssuePolicyPage.tsx
    │           └── PolicyListPage.tsx
    └── package.json
```

---

## Prerequisites

- **Node.js** v18.0.0 or higher (`node -v`)
- **npm** v8+ (`npm -v`)
- **MongoDB** v6+ running locally OR a MongoDB Atlas connection string

---

## Local Setup — Backend

### Step 1: Install dependencies

```bash
cd backend
npm install
```

### Step 2: Configure environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
# Most importantly, set MONGO_URI
```

Minimum required `.env` for local development:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/hdfc_ipms
JWT_SECRET=your_secret_here_min_32_chars
JWT_EXPIRES_IN=15m
COOKIE_NAME=hdfc_ipms_token
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
CLIENT_URL=http://localhost:5173
```

### Step 3: Seed the Admin account

```bash
npm run seed
```

This creates the first Admin account. Credentials from `.env`:
- **Email**: `admin@hdfclife.com`
- **Password**: `Admin@123456`

### Step 4: Start the development server

```bash
npm run dev
```

Backend runs at: **http://localhost:5000**

Health check: `GET http://localhost:5000/api/health`

---

## Local Setup — Frontend

### Step 1: Install dependencies

```bash
cd frontend
npm install
```

### Step 2: Start the development server

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

> The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` automatically.

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for the full list with descriptions.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Backend server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32-char random secret for signing JWTs |
| `JWT_EXPIRES_IN` | Yes | Session duration — **must be `15m`** |
| `COOKIE_NAME` | Yes | Name of the HttpOnly cookie |
| `COOKIE_SECURE` | Yes | `true` in production (HTTPS), `false` in dev |
| `COOKIE_SAMESITE` | Yes | `strict` in production, `lax` in dev |
| `CLIENT_URL` | Yes | Frontend URL for CORS allowlist |
| `ADMIN_EMAIL` | Seed only | Initial admin email |
| `ADMIN_PASSWORD` | Seed only | Initial admin password |

---

## API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns HttpOnly cookie |
| POST | `/api/auth/logout` | Any | Clears session cookie |
| GET | `/api/auth/me` | Any | Get current user profile |

### Admin Endpoints (Role: `admin` only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/agents` | Create a new agent |
| GET | `/api/admin/agents` | List all agents (paginated, filterable) |
| GET | `/api/admin/agents/:id` | Get agent profile |
| DELETE | `/api/admin/agents/:id` | Soft-delete (deactivate) an agent |

**Query params for GET /agents**: `page`, `limit`, `status` (active/inactive), `search`

### Agent Endpoints (Role: `agent` only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/customers` | Create customer (agent owns it) |
| GET | `/api/customers` | List my customers (paginated) |
| GET | `/api/customers/search?q=` | Search my customers |
| GET | `/api/customers/:id` | Get customer (ownership enforced) |
| PUT | `/api/customers/:id` | Update customer (ownership enforced) |
| POST | `/api/policies/issue` | Issue policy for my customer |
| GET | `/api/policies` | List my policies |
| GET | `/api/policies/customer/:customerId` | Get policies for a customer |

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed. Please check the highlighted fields.",
  "errors": {
    "mobile": "Mobile must be exactly 10 digits and start with 6, 7, 8, or 9",
    "aadhaar": "Aadhaar must be exactly 12 digits"
  }
}
```

---

## Business Rules Implemented

All 10 business rules from Section 6 are enforced **server-side** in controllers, with field-level error responses:

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | Customer age between 18–65 years | `customer.controller.js` |
| 2 | PAN mandatory if premium > ₹50,000 | `policy.controller.js` |
| 3 | Nominee mandatory & cannot be policyholder | `customer.controller.js` |
| 4 | Mobile: 10 digits, starts with 6–9 | `validate.middleware.js` |
| 5 | Aadhaar: exactly 12 digits | `validate.middleware.js` |
| 6 | Policy term: 10/15/20/25/30 years only | `validate.middleware.js` + Model |
| 7 | Premium frequency: Monthly/Quarterly/Half-Yearly/Yearly | `validate.middleware.js` + Model |
| 8 | Minimum premium: ₹5,000 | `validate.middleware.js` + Model |
| 9 | Policy start date cannot be in the past | `policy.controller.js` |
| 10 | PAN & Aadhaar unique across all customers | `customer.controller.js` |
| 11 | Agent cannot be changed after policy issuance | `immutable: true` in Policy Model |

---

## PII Masking

All list, search, and detail API endpoints return **masked** sensitive fields:

| Field | Raw Value | Masked Value |
|-------|-----------|-------------|
| Aadhaar | `123456789012` | `XXXX-XXXX-9012` |
| PAN | `ABCDE1234F` | `ABCXX12XXF` |
| Mobile | `9876543210` | `98XXXXXX10` |

Implemented in: `backend/src/utils/piiMasker.js`

---

## Running Tests

### Run all tests

```bash
cd backend
npm test
```

### Run with coverage report

```bash
npm run test:coverage
```

### Run a specific test file

```bash
# PII masking unit tests
npx jest src/tests/piiMasker.test.js

# Auth API tests
npx jest src/tests/auth.test.js

# Admin API tests
npx jest src/tests/admin.test.js

# Customer & Policy business rule tests
npx jest src/tests/customer.policy.test.js
```

### Test Architecture

- Uses **`mongodb-memory-server`** — no external MongoDB connection needed for tests
- Tests are fully isolated with `clearDatabase()` between each test
- Uses **supertest** for HTTP-level integration testing
- Covers: Auth, RBAC, all 10 business rules, ownership isolation, PII masking, pagination

---

## Deployment Guide

### Deploy Backend to Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Set the root directory to `backend/`
4. **Build Command**: `npm install`
5. **Start Command**: `node src/server.js`
6. Add all environment variables from `.env.example`
7. Set `NODE_ENV=production`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=strict`
8. Use your MongoDB Atlas `MONGO_URI`
9. After deploy, run the seed: visit the Render shell and run `npm run seed`

### Deploy Frontend to Vercel

1. Create a project on [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `frontend/`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add environment variable: `VITE_API_URL` = your Render backend URL
7. Update your backend's `CLIENT_URL` to the Vercel URL

> **Note:** Update the Vite proxy config for production — in production, the frontend calls the backend via absolute URL, not the local proxy.

### MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Add a database user with `readWrite` permission
3. Whitelist `0.0.0.0/0` (all IPs) or your specific server IP
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/hdfc_ipms`
5. Set this as `MONGO_URI` in your production environment

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs with salt rounds = 12 |
| Session Management | HttpOnly, Secure, SameSite cookie |
| Session Expiry | Absolute 15-minute JWT TTL |
| Input Validation | express-validator on all endpoints |
| Rate Limiting | 100 req/15min per IP via express-rate-limit |
| HTTP Headers | Helmet.js security headers |
| CORS | Strict origin allowlist |
| Ownership Isolation | agentId filter on all queries |
| Soft Delete | isActive flag, never hard-delete data |
| Role Enforcement | Server-side `authorize()` middleware |

---

*Built for HDFC Life Assignment — Insurance Policy Management System*
