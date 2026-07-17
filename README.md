# HDFC Life — Insurance Policy Management System (IPMS)

## Objective

The objective of this project is to design and develop a web-based Insurance Policy Management System that simulates a real-world insurance onboarding and policy issuance workflow. The application provides separate functionalities for Admin and Agent users, ensuring secure access and role-based operations. The system enables Agents to manage the complete customer lifecycle, including customer registration, policy issuance, and policy management, while Admins are responsible for managing Agent accounts and monitoring the overall system. The application focuses on implementing clean architecture, secure authentication, data validation, and proper access control.

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
│   │   ├── app.js                  
│   │   ├── server.js               
│   │   ├── config/
│   │   │   └── database.js         
│   │   ├── models/
│   │   │   ├── user.model.js      
│   │   │   ├── customer.model.js   
│   │   │   └── policy.model.js     
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
│   │   │   ├── auth.middleware.js  
│   │   │   ├── validate.middleware.js  
│   │   │   └── error.middleware.js     
│   │   ├── utils/
│   │   │   ├── jwt.util.js         
│   │   │   ├── piiMasker.js        
│   │   │   └── seeder.js           
│   │   └── tests/
│   │       ├── setup.js            
│   │       ├── piiMasker.test.js   
│   │       ├── auth.test.js       
│   │       ├── admin.test.js       
│   │       └── customer.policy.test.js  
│   ├── .env.example
│   ├── .env                       
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.tsx                 
    │   ├── main.tsx
    │   ├── index.css               
    │   ├── context/
    │   │   └── AuthContext.tsx     
    │   ├── lib/
    │   │   └── api.ts             
    │   ├── types/
    │   │   └── index.ts           
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx  
    │   │   └── DashboardLayout.tsx 
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── admin/
    │       │   ├── AdminDashboard.tsx
    │       │   ├── AgentListPage.tsx   
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

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` automatically.



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

