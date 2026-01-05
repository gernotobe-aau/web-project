# Food Delivery Platform

A modern full-stack food delivery platform built with Node.js, Express, SQLite, and Angular. This application allows customers to browse restaurants, place orders, and track deliveries, while restaurant owners can manage their menus, handle orders, and view analytics.

## 📋 Project Overview

This platform provides functionality comparable to existing food delivery services like Lieferando or Foodora. It supports two user roles (Customers and Restaurant Owners) with role-based access control and a comprehensive set of features for managing the entire food delivery workflow.

## 🚀 Technology Stack

### Backend
- **Node.js** v24
- **Express** - REST API framework
- **SQLite** (better-sqlite3) - Lightweight database
- **TypeScript** - Type-safe development
- **Argon2id** - Secure password hashing
- **JWT** - Authentication tokens
- **CORS** - Cross-origin resource sharing

### Frontend
- **Angular** v21
- **Angular Material** - UI component library
- **RxJS** - Reactive programming
- **TypeScript** - Type-safe development

### Authentication
- Custom JWT-based authentication (no OpenID Connect)
- Role-based access control (Customer, Restaurant Owner)
- Token-based authorization with HTTP interceptors

## 📁 Project Structure

```
web-project-1/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/          # Express routes
│   │   │   └── controllers/     # Request handlers
│   │   ├── business/            # Business logic layer
│   │   ├── repositories/        # Database access layer
│   │   ├── db/
│   │   │   ├── migrations/      # SQL migrations
│   │   │   ├── init.ts         # Database initialization
│   │   │   └── migration-runner.ts
│   │   ├── middleware/          # Express middleware
│   │   ├── config/             # Configuration management
│   │   ├── types/              # TypeScript types
│   │   └── app.ts              # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/      # API services
│   │   │   │   ├── guards/        # Route guards
│   │   │   │   ├── interceptors/  # HTTP interceptors
│   │   │   │   └── models/        # TypeScript interfaces
│   │   │   ├── shared/
│   │   │   │   ├── components/    # Reusable components
│   │   │   │   └── pipes/         # Custom pipes
│   │   │   ├── features/
│   │   │   │   ├── public/        # Public pages
│   │   │   │   ├── customer/      # Customer features
│   │   │   │   └── restaurant/    # Restaurant features
│   │   │   └── layout/            # Layout components
│   │   └── environments/          # Environment configs
│   ├── angular.json
│   └── package.json
│
├── scripts/
│   └── build-and-run.ps1         # Build & deployment script
│
├── requirements/                  # Feature documentation
└── README.md
```

## 🛠️ Prerequisites

- **Node.js** v24 or higher
- **npm** (comes with Node.js)
- **PowerShell** (for build scripts on Windows)

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd web-project-1
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 4. Configure Backend Environment

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and configure required variables:

```env
# REQUIRED: Change this to a secure random string in production
JWT_SECRET=your-secure-random-secret-key

# Optional: Adjust as needed
PORT=3000
CORS_ORIGIN=http://localhost:4200
DB_PATH=./database.sqlite
JWT_EXPIRATION=1h
MIN_AGE_CUSTOMER=16
MIN_AGE_RESTAURANT_OWNER=18
CUISINE_CATEGORIES=Italienisch,Asiatisch,Deutsch,Türkisch,Pizza,Burger,Vegetarisch,Vegan,Indisch,Mexikanisch
```

## 🚦 Development

### Quick Start (Recommended)

Use the PowerShell script to start both backend and frontend:

```powershell
.\scripts\build-and-run.ps1 -Mode Development
```

This will:
- Check and install dependencies if needed
- Create `.env` file if missing
- Start backend on `http://localhost:3000`
- Start frontend on `http://localhost:4200`
- Open both in separate terminal windows

### Manual Start

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

### Available URLs

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

## 🏗️ Building for Production

### Build Both Applications

```powershell
.\scripts\build-and-run.ps1 -Mode Deployment
```

This creates a `deploy/` folder with:
```
deploy/backend/
├── server/              # Compiled backend
│   ├── app.js
│   ├── package.json
│   └── .env.example
├── public/              # Built frontend
│   ├── index.html
│   └── assets/
├── start-server.ps1     # Production start script
└── README.md            # Deployment instructions
```

### Deploy to Production

1. Copy the `deploy/backend/` folder to your server
2. Configure `server/.env` with production values
3. Run `.\start-server.ps1`

The backend serves both:
- Frontend at `/` (root)
- API at `/api/*`

## 🏛️ Architecture Principles

### Repository Pattern
- Database access ONLY through repository classes
- Repositories return domain objects, not raw SQL results

### Business Logic Layer
- ALL business logic belongs in `business/` layer
- Controllers only handle:
  - Request validation
  - Calling business logic
  - Response mapping
- NO business logic in routes, controllers, or middleware

### Validation Strategy
- **Backend validation is MANDATORY** before any persistence
- Frontend validation is UX-only and never trusted
- All frontend validations must be repeated on backend
- Validation errors return **HTTP 422** with details

### Security
- Passwords hashed with **Argon2id** (never plaintext or reversible encryption)
- JWT tokens for authentication
- Role-based authorization in business layer
- Secrets configured via environment variables (never committed)

## 🔌 API Conventions

### Endpoint Structure
All REST endpoints use `/api` prefix:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- (Future endpoints will follow `/api/<resource>` pattern)

### Authentication
JWT token sent via header:
```
Authorization: Bearer <token>
```

### HTTP Status Codes
- `200` - Success
- `401` - Unauthorized (invalid/missing token)
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate email)
- `422` - Validation error (with error details)
- `500` - Server error

### Error Response Format
```json
{
  "error": "Error message",
  "errors": [/* validation details */]
}
```

## 🛣️ Frontend Routing

### Public Routes (No Authentication)
- `/` - Landing page
- `/login` - User login
- `/register` - User registration

### Customer Routes (Role: customer)
- `/customer` - Customer dashboard
- `/customer/...` - Customer features (browsing, cart, orders)

### Restaurant Routes (Role: restaurantOwner)
- `/restaurant` - Restaurant dashboard
- `/restaurant/...` - Restaurant features (menu, orders, analytics)

### Route Guards
- **AuthGuard** - Checks if user is authenticated
- **RoleGuard** - Verifies user has required role
- After login, users are redirected based on their role

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📚 Further Documentation

- **Requirements:** See `requirements/` folder for feature specifications
- **Copilot Instructions:** `.github/copilot-instructions.md` for development guidelines
- **Deployment:** `deploy/backend/README.md` (after building)

## 🔧 Database Migrations

### Run Migrations
```bash
cd backend
npm run migrate
```

Migrations are automatically run when the server starts. Manual execution is useful for:
- Pre-deployment migration checks
- Development database updates
- Troubleshooting

### Create New Migration
1. Create file: `backend/src/db/migrations/00X_description.sql`
2. Use sequential numbering (001, 002, 003...)
3. Write SQL DDL statements
4. Never modify existing migrations
5. Run `npm run migrate` to apply

## 🤝 Contributing

When implementing new features:
1. Follow the architecture principles above
2. Place business logic in `business/` layer
3. Validate ALL inputs on backend
4. Return appropriate HTTP status codes
5. Test both backend and frontend
6. Update documentation

## 📝 License

This project is developed as part of the Web Technologies course 2025.

---

**Happy coding! 🚀** 