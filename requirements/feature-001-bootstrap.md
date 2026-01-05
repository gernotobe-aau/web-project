# Feature: Projekt Bootstrapping & Grundstruktur

Initialisierung der technischen Grundstruktur für die Food-Delivery-Plattform mit Backend (Node.js + Express + SQLite) und einem Angular-Frontend mit rollenbasiertem Routing. Das Feature legt die Ordnerstruktur, Konfigurationen, Build-Scripts und die grundlegende Infrastruktur an, sodass nachfolgende Features implementiert werden können.

## Acceptance Criteria:
- Backend-Projekt ist initialisiert mit Node.js v24, Express, TypeScript und SQLite
- Ein Angular v21 Projekt ist initialisiert mit rollenbasiertem Routing
- Ordnerstruktur entspricht exakt den Copilot-Instructions (Repository Pattern, Business Logic Layer)
- Environments für dev/stage/prod sind angelegt
- Backend-Konfiguration unterstützt CORS (konfigurierbar)
- JWT-Authentication-Basis ist angelegt (Middleware, Config für Secrets)
- PowerShell-Script unterstützt Development-Modus (Backend + Frontend gleichzeitig starten)
- PowerShell-Script unterstützt Deployment-Modus (Production Build + Deployment-Struktur)
- Alle REST-Endpoints sind mit `/api` Prefix konfiguriert
- Backend kann Angular-App als statische Files ausliefern (unter `/`)
- Routing-Guards für rollenbasierte Zugriffskontrolle sind angelegt
- Password-Hashing mit Argon2id ist konfiguriert
- SQLite-Datenbank-Setup mit Migrations-Support ist vorhanden
- Angular Material ist integriert
- HTTP-Interceptor für JWT-Token ist angelegt
- README.md dokumentiert Setup, Development und Deployment

---

## User Story: Backend-Projekt initialisieren

Als Entwickler möchte ich ein vollständig konfiguriertes Backend-Projekt haben, damit ich ohne weitere Setup-Arbeiten mit der Implementierung von Features beginnen kann.

### Acceptance Criteria:
- Node.js v24 Projekt mit TypeScript ist initialisiert
- `package.json` enthält alle erforderlichen Dependencies:
  - express (REST API Framework)
  - sqlite3 (Datenbank)
  - better-sqlite3 (moderne SQLite-API)
  - argon2 (Password Hashing)
  - jsonwebtoken (JWT Authentication)
  - cors (CORS-Middleware)
  - dotenv (Environment Variables)
  - express-validator (Request Validation)
  - TypeScript, @types/*, ts-node als Dev-Dependencies
- `tsconfig.json` ist konfiguriert mit:
  - target: ES2022
  - module: commonjs
  - strict: true
  - esModuleInterop: true
  - outDir: dist
  - rootDir: src
- Ordnerstruktur folgt exakt dem vorgegebenen Schema:
  ```
  backend/
  ├─ src/
  │  ├─ api/
  │  │  ├─ routes/        (Express Router)
  │  │  └─ controllers/   (Request Handling, Validation)
  │  ├─ business/         (Business Logic Layer)
  │  ├─ repositories/     (Database Access Layer)
  │  ├─ db/              (Database Init, Migrations)
  │  ├─ middleware/      (Auth, Error Handling)
  │  ├─ config/          (Configuration Management)
  │  ├─ types/           (TypeScript Interfaces/Types)
  │  └─ app.ts           (Express App Setup)
  ├─ package.json
  └─ tsconfig.json
  ```
- `src/app.ts` enthält:
  - Express-App-Initialisierung
  - CORS-Middleware (konfigurierbar via config)
  - JSON Body Parser
  - `/api` Prefix für alle API-Routes
  - Static File Serving für beide Angular-Apps
  - Fehler-Handling-Middleware
  - Fallback zu Angular `index.html` für SPA-Routing
- `src/config/config.ts` exportiert Konfiguration aus Environment-Variables:
  - `PORT` (default: 3000)
  - `JWT_SECRET` (required)
  - `JWT_EXPIRATION` (default: '1h')
  - `CORS_ORIGIN` (default: '*')
  - `DB_PATH` (default: './database.sqlite')
  - `MIN_AGE_CUSTOMER` (default: 16)
  - `MIN_AGE_RESTAURANT_OWNER` (default: 18)
  - `CUISINE_CATEGORIES` (Array, z.B.: ['Italienisch', 'Asiatisch', 'Deutsch', 'Türkisch', 'Pizza', 'Burger', 'Vegetarisch', 'Vegan'])
- `.env.example` Datei ist vorhanden mit allen Config-Keys
- `src/db/init.ts` initialisiert SQLite-Datenbank
- `src/db/migrations/` Ordner für Datenbankmigrationen ist angelegt
- `src/middleware/auth.middleware.ts` enthält `requireAuth` Middleware (JWT-Validierung, User-Context in Request)
- `src/middleware/error.middleware.ts` enthält globale Fehlerbehandlung
- NPM-Scripts in `package.json`:
  - `dev`: Startet Server mit ts-node-dev (Hot Reload)
  - `build`: Kompiliert TypeScript zu JavaScript
  - `start`: Startet kompilierten Server
  - `migrate`: Führt Datenbankmigrationen aus

---

## User Story: Frontend initialisieren

Als Entwickler möchte ich die Angular-App vollständig konfiguriert haben mit rollenbasiertem Routing, damit ich Features für beide Benutzerrollen (Kunden und Restaurantbesitzer) implementieren kann.

### Acceptance Criteria:
- Angular v21 Projekt ist in `frontend/` initialisiert
- Angular Material ist installiert und konfiguriert
- Ordnerstruktur ist angelegt:
  ```
  frontend/
  ├─ src/
  │  ├─ app/
  │  │  ├─ core/
  │  │  │  ├─ services/      (API Services, Auth Service)
  │  │  │  ├─ guards/        (Auth Guards, Role Guards)
  │  │  │  ├─ interceptors/  (HTTP Interceptors)
  │  │  │  └─ models/        (TypeScript Interfaces)
  │  │  ├─ shared/
  │  │  │  ├─ components/    (Wiederverwendbare UI-Komponenten)
  │  │  │  └─ pipes/         (Custom Pipes)
  │  │  ├─ features/
  │  │  │  ├─ public/        (Öffentliche Seiten: Landing, Login, Register)
  │  │  │  ├─ customer/      (Kundenbereiche: Browse, Cart, Orders)
  │  │  │  └─ restaurant/    (Restaurantbereiche: Menu, Orders, Analytics)
  │  │  └─ layout/           (Layout-Komponenten: Header, Footer, Navigation)
  │  ├─ environments/
  │  │  ├─ environment.dev.ts
  │  │  ├─ environment.stage.ts
  │  │  └─ environment.prod.ts
  │  ├─ assets/
  │  └─ styles.css
  ├─ angular.json
  ├─ package.json
  └─ tsconfig.json
  ```
- `src/environments/environment.*.ts` enthalten jeweils:
  - `production: boolean`
  - `apiBaseUrl: string` (dev: 'http://localhost:3000/api', stage: TBD, prod: '/api')
  - `appName: 'Food Delivery Platform'`
- `angular.json` ist konfiguriert mit:
  - Build-Konfigurationen für dev, stage, prod
  - OutputPath: `../deploy/backend/public` für Production
  - File Replacements für Environments
- `src/app/core/interceptors/auth.interceptor.ts` ist angelegt:
  - Fügt JWT-Token aus Storage zu allen API-Requests hinzu (`Authorization: Bearer <token>`)
  - Interceptor ist in `app.config.ts` registriert
- `src/app/core/interceptors/error.interceptor.ts` ist angelegt:
  - Behandelt HTTP 422 (Validation Errors)
  - Behandelt HTTP 401 (Unauthorized)
  - Behandelt HTTP 404, 409, 500
- `src/app/core/services/auth.service.ts` ist angelegt (Grundgerüst):
  - `login(email: string, password: string): Observable<LoginResponse>`
  - `logout(): void`
  - `getToken(): string | null`
  - `getUserRole(): 'customer' | 'restaurantOwner' | null`
  - `isAuthenticated(): boolean`
  - Token-Storage (localStorage oder sessionStorage)
  - Parsing der JWT-Claims für Rolle
- `src/app/core/guards/auth.guard.ts` ist angelegt:
  - Prüft ob Benutzer authentifiziert ist
  - Leitet zu Login weiter falls nicht authentifiziert
- `src/app/core/guards/role.guard.ts` ist angelegt:
  - Prüft ob Benutzer die erforderliche Rolle hat
  - Parameter: `allowedRoles: string[]`
  - Leitet zu 403-Seite bei fehlender Berechtigung
- `src/app/app.routes.ts` ist angelegt mit Grundstruktur:
  ```typescript
  // Öffentliche Routes (ohne Guard)
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Kunden-Routes (mit Auth + Role Guard)
  { path: 'customer', canActivate: [AuthGuard, RoleGuard], data: { roles: ['customer'] }, children: [...] },
  
  // Restaurant-Routes (mit Auth + Role Guard)
  { path: 'restaurant', canActivate: [AuthGuard, RoleGuard], data: { roles: ['restaurantOwner'] }, children: [...] }
  ```
- NPM-Scripts in `package.json`:
  - `start`: Startet Dev-Server auf Port 4200
  - `build`: Production Build
  - `build:dev`: Development Build
  - `build:stage`: Stage Build
  - `test`: Unit Tests
  - `lint`: Linting

---

## User Story: Build- und Deployment-Script erstellen

Als Entwickler möchte ich ein PowerShell-Script haben, das Development- und Production-Workflows automatisiert, damit ich effizient arbeiten kann.

### Acceptance Criteria:
- PowerShell-Script `scripts/build-and-run.ps1` ist angelegt
- Script unterstützt `-Help` Parameter mit vollständiger Dokumentation
- **Development-Modus** (`-Mode Development`):
  - Startet Backend auf Port 3000 (npm run dev)
  - Startet Frontend auf Port 4200 (npm start)
  - Beide Prozesse laufen parallel in separaten Konsolen/Tabs
  - Script wartet auf Benutzer-Abbruch (Ctrl+C)
- **Deployment-Modus** (`-Mode Deployment`):
  - Erstellt/leert `deploy/` Ordner
  - Baut Frontend (npm run build) → Output nach `deploy/backend/public/`
  - Baut Backend (npm run build) → Output nach `deploy/backend/server/`
  - Kopiert `package.json` nach `deploy/backend/server/`
  - Kopiert `.env.example` nach `deploy/backend/server/`
  - Erstellt `deploy/backend/start-server.ps1`:
    ```powershell
    # Prüft ob .env existiert
    # Prüft ob node_modules existiert, falls nicht: npm install --production
    # Startet Server: node server/app.js
    ```
  - Erstellt `deploy/backend/README.md` mit Deployment-Anleitung
- Script gibt klare Fortschrittsmeldungen aus
- Script behandelt Fehler (z.B. fehlende Dependencies) mit aussagekräftigen Meldungen

---

## User Story: Datenbank-Schema initialisieren

Als Entwickler möchte ich ein Datenbank-Migrations-System haben, damit Datenbankänderungen versioniert und reproduzierbar sind.

### Acceptance Criteria:
- `src/db/migration-runner.ts` ist implementiert:
  - Liest alle `.sql` Dateien aus `src/db/migrations/` in sortierter Reihenfolge
  - Führt Migrationen transaktional aus
  - Speichert angewendete Migrationen in Tabelle `_migrations`
  - Loggt jeden Migrations-Schritt
- Erste Migration `001_initial_schema.sql` ist angelegt mit:
  ```sql
  -- Tabelle für Migrationsverwaltung
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Weitere Tabellen werden in späteren Features hinzugefügt
  ```
- `src/db/init.ts` ist implementiert:
  - Erstellt Datenbankdatei falls nicht vorhanden
  - Ruft Migration-Runner auf
  - Exportiert Datenbank-Connection für Repositories
- NPM-Script `migrate` führt Migrationen aus

---

## User Story: Authentication-Grundstruktur anlegen

Als Entwickler möchte ich die JWT-Authentication-Infrastruktur vorbereitet haben, damit ich in späteren Features Login/Register implementieren kann.

### Acceptance Criteria:
- `src/middleware/auth.middleware.ts` ist implementiert:
  - `requireAuth` Middleware validiert JWT-Token aus `Authorization: Bearer <token>` Header
  - Extrahiert User-Claims (sub, role) aus Token
  - Fügt `req.user` hinzu mit: `{ userId: string, role: 'customer' | 'restaurantOwner' }`
  - Gibt 401 zurück bei fehlendem/ungültigem Token
  - Middleware enthält KEINE Authorization-Logic (nur Authentication)
- `src/business/auth.service.ts` ist als Grundgerüst angelegt:
  - `generateToken(userId: string, role: string): string` (JWT-Erstellung)
  - `verifyToken(token: string): TokenPayload | null` (JWT-Validierung)
  - Verwendet `JWT_SECRET` und `JWT_EXPIRATION` aus Config
- `src/api/routes/auth.routes.ts` ist angelegt mit:
  - `POST /api/auth/login` Route (Platzhalter, gibt 501 zurück)
  - `POST /api/auth/register` Route (Platzhalter, gibt 501 zurück)
- Routes sind in `src/app.ts` registriert
- Argon2id ist konfiguriert für Password-Hashing:
  - `src/business/password.service.ts` ist angelegt:
    - `hashPassword(password: string): Promise<string>`
    - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - Verwendet Argon2id mit sicheren Default-Parametern

---

## User Story: Static File Serving für Production konfigurieren

Als Entwickler möchte ich, dass der Backend-Server die Angular-App in Production ausliefern kann, damit nur ein Server deployed werden muss.

### Acceptance Criteria:
- `src/app.ts` enthält Static File Serving-Logik:
  ```typescript
  // API-Routes (VOR Static Files registrieren!)
  app.use('/api', apiRoutes);
  
  // Angular-App Static Files
  app.use(express.static(path.join(__dirname, '../public')));
  
  // SPA-Fallback (nach API-Routes und Static Files!)
  // Alle nicht-API Routes werden zu Angular weitergeleitet
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  ```
- Reihenfolge ist kritisch:
  1. Zuerst API-Routes (`/api/*`)
  2. Dann Static Files (CSS, JS, Assets)
  3. Zuletzt SPA-Fallback (alle anderen Routes → `index.html`)
- `/api/*` wird NIE zu Angular weitergeleitet
- Angular-Router übernimmt Client-seitiges Routing (inkl. Rollen-Guards)

---

## User Story: Projekt-Dokumentation erstellen

Als Entwickler möchte ich eine vollständige README haben, damit ich das Projekt schnell aufsetzen und verstehen kann.

### Acceptance Criteria:
- `README.md` im Root-Verzeichnis ist angelegt mit folgenden Abschnitten:
  1. **Projektübersicht**: Kurze Beschreibung der Food-Delivery-Plattform
  2. **Technologie-Stack**:
     - Backend: Node.js v24, Express, SQLite, TypeScript
     - Frontend: Angular v21, Angular Material
     - Authentication: JWT (Custom Implementation mit rollenbasiertem Routing)
  3. **Ordnerstruktur**: Übersicht mit Erklärung jedes Hauptordners
  4. **Voraussetzungen**:
     - Node.js v24
     - npm
     - PowerShell (für Scripts)
  5. **Installation**:
     ```bash
     # Backend
     cd backend
     npm install
     
     # Frontend
     cd frontend
     npm install
     ```
  6. **Konfiguration**:
     - `.env` Datei im Backend-Ordner anlegen (basierend auf `.env.example`)
     - Erforderliche Variablen dokumentieren
  7. **Development**:
     ```powershell
     .\scripts\build-and-run.ps1 -Mode Development
     ```
     - Frontend: http://localhost:4200
     - Backend API: http://localhost:3000/api
     - Nach Login wird basierend auf Rolle zu `/customer` oder `/restaurant` weitergeleitet
  8. **Deployment**:
     ```powershell
     .\scripts\build-and-run.ps1 -Mode Deployment
     ```
     - Output in `deploy/backend/`
     - Deployment-Anleitung folgt
  9. **Architektur-Prinzipien**:
     - Repository Pattern für Datenzugriff
     - Business Logic nur in Business-Layer
     - Keine Business Logic in Controllers/Routes
     - Backend-Validierung ist Pflicht (422 bei Fehlern)
     - Frontend-Validierung ist nur UX
  10. **API-Konventionen**:
      - Alle REST-Endpoints mit `/api` Prefix
      - JWT via `Authorization: Bearer <token>`
      - Validation Errors: HTTP 422
      - Authentication Errors: HTTP 401
  11. **Routing-Konzept**:
      - Öffentliche Routes: `/`, `/login`, `/register`
      - Kunden-Routes: `/customer/*` (Role Guard: customer)
      - Restaurant-Routes: `/restaurant/*` (Role Guard: restaurantOwner)
      - Nach Login automatische Weiterleitung basierend auf Rolle
  12. **Weitere Dokumentation**: Verweis auf `/requirements/` Ordner

---

## Technical Notes:

### Dependencies (Backend):
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "argon2": "^0.31.2",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.8",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.6",
    "ts-node-dev": "^2.0.0"
  }
}
```

### Dependencies (Frontend):
```json
{
  "dependencies": {
    "@angular/core": "^21.0.0",
    "@angular/common": "^21.0.0",
    "@angular/platform-browser": "^21.0.0",
    "@angular/router": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "@angular/material": "^21.0.0",
    "@angular/cdk": "^21.0.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.2",
    "zone.js": "^0.14.2"
  },
  "devDependencies": {
    "@angular/cli": "^21.0.0",
    "@angular/compiler-cli": "^21.0.0",
    "typescript": "~5.3.3"
  }
}
```

### Environment-Variablen (.env.example):
```
# Server
PORT=3000

# JWT Configuration
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_TO_SECURE_RANDOM_STRING
JWT_EXPIRATION=1h

# CORS
CORS_ORIGIN=http://localhost:4200

# Database
DB_PATH=./database.sqlite

# Business Rules
MIN_AGE_CUSTOMER=16
MIN_AGE_RESTAURANT_OWNER=18

# Cuisine Categories (comma-separated)
CUISINE_CATEGORIES=Italienisch,Asiatisch,Deutsch,Türkisch,Pizza,Burger,Vegetarisch,Vegan,Indisch,Mexikanisch
```

### Migrations-Strategie:
- Jede Migration ist eine `.sql` Datei mit Nummerierung: `001_description.sql`
- Migrationen sind transaktional
- Niemals angewendete Migrationen ändern
- Neue Änderungen = neue Migration

### CORS-Setup (Development):
- Backend erlaubt Requests von `http://localhost:4200`
- In Production ist CORS nicht erforderlich (alles von selber Domain)

### JWT-Token-Struktur:
```json
{
  "sub": "user-uuid",
  "role": "customer|restaurantOwner",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Deployment-Struktur:
```
deploy/
└─ backend/
   ├─ server/              (Kompilierter Backend-Code)
   │  ├─ app.js
   │  ├─ package.json
   │  └─ ...
   ├─ public/              (Angular App)
   │  ├─ index.html
   │  ├─ main.*.js
   │  ├─ styles.*.css
   │  └─ assets/
   ├─ start-server.ps1
   └─ README.md
```

### Hinweise für Entwickler:
1. **Niemals Business Logic in Controllers/Routes/Middleware!** Nur in Business-Layer.
2. **Backend-Validierung ist Pflicht!** Frontend-Validierung ist nur UX.
3. **Alle Passwörter mit Argon2id hashen!** Niemals Plaintext oder reversible Verschlüsselung.
4. **JWT-Secret niemals committen!** Immer aus Environment-Variable laden.
5. **Reihenfolge in app.ts beachten:** API-Routes vor SPA-Fallbacks!
6. **Environment-URLs korrekt setzen:** Dev zeigt auf localhost:3000, Prod auf `/api`
6. **Rollenbasiertes Routing:** Guards prüfen Rolle aus JWT-Token
8. **HTTP-Statuscodes beachten:** 422 für Validation, 401 für Auth, 404 für Not Found

---

## Definition of Done:
- [ ] Beide Projekte (Backend, Frontend) sind initialisiert
- [ ] Alle Dependencies sind installiert und funktionieren
- [ ] PowerShell-Script startet erfolgreich im Development-Modus
- [ ] PowerShell-Script erstellt erfolgreich Deployment-Struktur
- [ ] Backend startet und läuft auf Port 3000
- [ ] Frontend startet und läuft auf Port 4200
- [ ] Backend liefert "API is running" bei `GET /api/health`
- [ ] JWT-Middleware validiert Tokens korrekt (Unit-Test)
- [ ] Password-Hashing funktioniert mit Argon2id (Unit-Test)
- [ ] Datenbank wird initialisiert und Migrationen laufen
- [ ] CORS ist konfiguriert und funktioniert
- [ ] HTTP-Interceptors sind in Angular registriert
- [ ] Role-Guards leiten basierend auf JWT-Rolle korrekt weiter
- [ ] Static File Serving funktioniert in Production-Build
- [ ] Angular-Routing funktioniert mit Client-Side-Routing
- [ ] README.md ist vollständig und Anweisungen funktionieren
- [ ] Code-Review durch zweiten Entwickler erfolgt
- [ ] Keine Secrets im Git-Repository committed
