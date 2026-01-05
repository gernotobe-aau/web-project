# Copilot Instructions

These instructions are **mandatory** for all AI-generated code in this repository.
They are optimized for **GitHub Copilot using Claude Sonnet 4.5**.
Wenn du nach user stories und featues gefragt wirst generiere diese ausnahmslos in md files in den ordner `/requirements` basierend auf dem template in der datei `/requirements/feature-template.md`
Ignoriere die Datei `/requirements/prompts.md` komplett.
---

## Backend

### Technology
- Node.js **v24**
- Express for REST APIs

### API Rules
- Follow RESTful principles
- **All REST endpoints must be prefixed with `/api`**
- Required routing layout in production:
  - `my.app.com/api/*` → REST API
  - `my.app.com/*` → **User Angular app** (root app)
  - `my.app.com/restaurant/*` → **Restaurant Angular app**

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

### Security & Validation (Mandatory)
- **All validations must be performed completely on the backend before any persistence happens.**
- Anything implemented in Angular (forms, validators, UI checks) is **UX only** and must **never** be trusted.
- Every input check done in the frontend must be **explicitly repeated** on the backend.
- Backend must validate at minimum:
  - required fields / null checks
  - type/format constraints (e.g., dates, emails, enums)
  - length and range constraints
  - range constraints
  - cross-field rules (business constraints)
  - authorization-related rules (in business layer)
- Never persist or mutate database state until backend validation succeeds.

#### Validation Error Responses (MANDATORY)
- **All validation errors must be returned as `422 Unprocessable Entity`** to the Angular apps.
- The response must contain enough detail for Angular to show user-friendly messages.
- Angular must present validation errors clearly to the user (UX responsibility), but the backend remains the source of truth.

#### Other REST Errors
- `404` for missing resources
- `409` for conflicts (e.g., unique constraints)
- `500` for unexpected failures (do not leak secrets)

### Authentication (JWT-based, Simple, No OpenID Connect)
- Authentication is **JWT-based** with a **simple custom implementation**
- **No OpenID Connect**, **no OAuth flows**, **no external identity providers**
- **Do NOT implement**: Authorization Code, PKCE, Discovery, JWKS, OIDC libraries, etc.
- JWT is sent via: `Authorization: Bearer <token>`
- Token signing/verifying uses configurable secrets/keys (no hardcoding)
- Token expiration and related settings must be configurable via config/env

#### Password Storage (MANDATORY)
- Account passwords must be stored using **state-of-the-art hashing and salting**.
- Never store plaintext passwords.
- Never store reversible/encrypted passwords.
- Use a modern, adaptive password hashing algorithm (e.g., Argon2id, scrypt, or bcrypt with appropriate cost).
- Salts must be unique per password hash (do not reuse a global salt).

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

### Production (Serving Two Angular Apps)
- The backend server hosts **both Angular applications** as static files:
  - **User app** is served at `/` (root)
  - **Restaurant app** is served at `/restaurant`
- The backend must ensure:
  - `/api/*` is always handled by Express API routes (never by Angular)
  - Angular SPA routing works (fallback to each app’s `index.html`):
    - Requests to `/...` (non-API) fall back to **user** `index.html`
    - Requests to `/restaurant/...` (non-API) fall back to **restaurant** `index.html`

---

## Frontend

### Technology
- Angular **v21**
- Angular Material for UI components

### Multi-App Setup (MANDATORY)
- Under the `frontend/` folder, there are **two separate Angular applications**:
  - `frontend/user/` → User Angular app (served at `/`)
  - `frontend/restaurant/` → Restaurant Angular app (served at `/restaurant`)
- Each app has its own:
  - `src/`
  - `angular.json` (or workspace configuration as applicable)
  - `package.json` (as applicable)
  - `environments/`

### API Access
- All REST API calls must go through **Angular service classes**
- Components must NEVER call APIs directly

### Handling Backend Validation Errors (MANDATORY)
- Angular must handle backend validation errors returned with **HTTP 422**.
- Angular must present these errors clearly to the user (e.g., field-level messages, dialogs, banners).
- Frontend validation remains UX-only; backend validation is authoritative.

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

### Environments (Per App)
- Use **TypeScript environment files**
- Separate environment files for:
  - `dev`
  - `stage`
  - `prod`
- **Server base URLs must exist ONLY in environment files**
- **NO hardcoded server URLs**
- **NO fallback URLs outside environment files**
- Each Angular app (`user` and `restaurant`) must maintain its own environment files under its own `src/environments/`

---

## Scripts & Deployment

### PowerShell Script
- Must support a **`-Help`** argument explaining usage
- Must support a **Development mode**
  - Starts Angular **user** frontend
  - Starts Angular **restaurant** frontend
  - Starts Node.js backend
- Must support a **Deployment mode**
  - Builds Angular **user** app for production
  - Builds Angular **restaurant** app for production
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
│  ├─ user/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ core/
│  │  │  │  ├─ shared/
│  │  │  │  └─ components/
│  │  │  │     └─ example-component/
│  │  │  │        ├─ example.component.ts
│  │  │  │        ├─ example.component.html
│  │  │  │        └─ example.component.css
│  │  │  └─ environments/
│  │  │     ├─ environment.dev.ts
│  │  │     ├─ environment.stage.ts
│  │  │     └─ environment.prod.ts
│  │  ├─ angular.json
│  │  └─ package.json
│  │
│  ├─ restaurant/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ core/
│  │  │  │  ├─ shared/
│  │  │  │  └─ components/
│  │  │  │     └─ example-component/
│  │  │  │        ├─ example.component.ts
│  │  │  │        ├─ example.component.html
│  │  │  │        └─ example.component.css
│  │  │  └─ environments/
│  │  │     ├─ environment.dev.ts
│  │  │     ├─ environment.stage.ts
│  │  │     └─ environment.prod.ts
│  │  ├─ angular.json
│  │  └─ package.json
│
├─ scripts/
│  └─ build-and-run.ps1
│
├─ deploy/
│  ├─ backend/
│  │  ├─ server/
│  │  ├─ public/
│  │  │  ├─ user/
│  │  │  └─ restaurant/
│  │  └─ start-server.ps1
│
└─ README.md
