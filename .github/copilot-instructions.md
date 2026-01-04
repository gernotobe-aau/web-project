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
- Controllers are limited to:
  - request validation
  - calling business logic
  - mapping responses

### Database
- **SQLite**

### Authentication
- Will be added later
- **Do NOT implement authentication**
- **Do NOT assume authenticated users**

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
```

---

## Mandatory Rules

- No business logic outside the business layer
- No direct HTTP calls in Angular components
- No hardcoded server URLs anywhere
- Folder structure must not be changed
- All REST APIs must remain under `/api`

---

## AI Behavior Rules

- Always follow this file strictly
- If a request violates these rules:
  - explain why
  - propose a compliant alternative
- Do NOT invent additional architecture, folders, or patterns

---
