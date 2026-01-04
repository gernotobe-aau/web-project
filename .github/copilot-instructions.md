# Copilot Instructions

These instructions are **mandatory** for all AI-generated code in this repository.
They are optimized for **GitHub Copilot using Claude Sonnet 4.5**.

---

## Backend

### Technology
- Node.js **v24**
- Express for REST APIs

### API Rules
- Follow RESTful principles
- **All REST endpoints must be prefixed with `/api`**

### Architecture
- Use **Repository Pattern** for database access
- **Business logic must exist ONLY in Business Logic classes**
- Do NOT place business logic in:
  - routes
  - controllers
  - middleware
- Controllers are limited to:
  - request validation
  - calling business logic
  - mapping responses

### Database
- **SQLite**

### Authentication (JWT-based, Simple, No OpenID Connect)
- Authentication is **JWT-based** with a **simple custom implementation**
- **No OpenID Connect**, **no OAuth flows**, **no external identity providers**
- **Do NOT implement**: Authorization Code, PKCE, Discovery, JWKS, OIDC libraries, etc.
- JWT is sent via: `Authorization: Bearer <token>`
- Token signing/verifying uses configurable secrets/keys (no hardcoding)
- Token expiration and related settings must be configurable via config/env

#### Auth Endpoints (REST, under /api)
- `POST /api/auth/login`  
  - Validates credentials (simple custom logic)
  - Returns an `accessToken` (JWT)
- Optional (only if requested/needed by features):
  - `POST /api/auth/refresh` → returns a new `accessToken` (if refresh tokens are used)
  - `POST /api/auth/logout` → invalidates refresh tokens (if stored server-side)

#### JWT Middleware Rules
- Use Express middleware (e.g., `requireAuth`) to:
  - verify the JWT
  - extract claims (e.g., `sub`, `roles`)
  - attach user context to the request (e.g., `req.user`)
- Middleware must NOT contain business logic or authorization decisions

#### Authorization Rules
- Authorization decisions (roles/permissions) belong **ONLY** in Business Logic classes
- Controllers must not enforce permission logic beyond validating request shape

### Configuration
- **CORS must be configurable**
- Required because frontend and backend are hosted separately during development

### Production
- The **backend server hosts the Angular frontend**
- Angular production build is served as static files by the backend

---

## Frontend

### Technology
- Angular **v21**
- Angular Material for UI components

### API Access
- All REST API calls must go through **Angular service classes**
- Components must NEVER call APIs directly

### Authentication (Frontend)
- Store the JWT (access token) using a simple approach (e.g., memory or storage) as implemented by the project
- Attach the JWT to API calls via an Angular HTTP interceptor:
  - `Authorization: Bearer <token>`
- Do NOT implement OpenID Connect client logic

### Component Structure
- One folder per component
- Each component must contain exactly:
  - one `.ts`
  - one `.html`
  - one `.css`

### Environments
- Use **TypeScript environment files**
- Separate environment files for:
  - `dev`
  - `stage`
  - `prod`
- **Server base URLs must exist ONLY in environment files**
- **NO hardcoded server URLs**
- **NO fallback URLs outside environment files**

---

## Scripts & Deployment

### PowerShell Script
- Must support a **`-Help`** argument explaining usage
- Must support a **Development mode**
  - Starts Angular frontend
  - Starts Node.js backend
- Must support a **Deployment mode**
  - Builds Angular for production
  - Builds Node.js backend for production
  - Copies a start script into the deployment directory
  - Allows direct server start

---

## Folder Structure (MANDATORY)

```text
project-root/
├─ backend/
│  ├─ src/
│  │  ├─ api/
│  │  │  ├─ routes/
│  │  │  └─ controllers/
│  │  ├─ business/
│  │  ├─ repositories/
│  │  ├─ db/
│  │  ├─ config/
│  │  └─ app.ts
│  ├─ package.json
│  └─ tsconfig.json
│
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ core/
│  │  │  ├─ shared/
│  │  │  └─ components/
│  │  │     └─ example-component/
│  │  │        ├─ example.component.ts
│  │  │        ├─ example.component.html
│  │  │        └─ example.component.css
│  │  └─ environments/
│  │     ├─ environment.dev.ts
│  │     ├─ environment.stage.ts
│  │     └─ environment.prod.ts
│  ├─ angular.json
│  └─ package.json
│
├─ scripts/
│  └─ build-and-run.ps1
│
├─ deploy/
│  ├─ backend/
│  │  ├─ server/
│  │  ├─ public/
│  │  └─ start-server.ps1
│
└─ README.md
