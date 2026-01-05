# Feature: Projekt Bootstrapping & Grundstruktur

Initialisierung der technischen Grundstruktur für die Food-Delivery-Plattform mit Backend (Node.js + Express + SQLite) und zwei separaten Angular-Frontends (User-App und Restaurant-App). Das Feature legt die Ordnerstruktur, Konfigurationen, Build-Scripts und die grundlegende Infrastruktur an, sodass nachfolgende Features implementiert werden können.

## Acceptance Criteria:
- Backend-Projekt ist initialisiert mit Node.js v24, Express, TypeScript und SQLite
- Zwei separate Angular v21 Projekte sind initialisiert (User-App und Restaurant-App)
- Ordnerstruktur entspricht exakt den Copilot-Instructions (Repository Pattern, Business Logic Layer)
- Environments für dev/stage/prod sind für beide Angular-Apps angelegt
- Backend-Konfiguration unterstützt CORS (konfigurierbar)
- JWT-Authentication-Basis ist angelegt (Middleware, Config für Secrets)
- PowerShell-Script unterstützt Development-Modus (alle 3 Apps gleichzeitig starten)
- PowerShell-Script unterstützt Deployment-Modus (Production Build + Deployment-Struktur)
- Alle REST-Endpoints sind mit `/api` Prefix konfiguriert
- Backend kann beide Angular-Apps als statische Files ausliefern (User-App unter `/`, Restaurant-App unter `/restaurant`)
- Password-Hashing mit Argon2id ist konfiguriert
- SQLite-Datenbank-Setup mit Migrations-Support ist vorhanden
- Angular Material ist in beiden Frontends integriert
- HTTP-Interceptor für JWT-Token ist in beiden Frontends angelegt
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

## User Story: User-Frontend initialisieren

Als Entwickler möchte ich die User-Angular-App vollständig konfiguriert haben, damit ich Features für Kunden implementieren kann.

### Acceptance Criteria:
- Angular v21 Projekt ist in `frontend/user/` initialisiert
- Angular Material ist installiert und konfiguriert
- Ordnerstruktur ist angelegt:
  ```
  frontend/user/
  ├─ src/
  │  ├─ app/
  │  │  ├─ core/
  │  │  │  ├─ services/      (API Services, Auth Service)
  │  │  │  ├─ guards/        (Auth Guards)
  │  │  │  ├─ interceptors/  (HTTP Interceptors)
  │  │  │  └─ models/        (TypeScript Interfaces)
  │  │  ├─ shared/
  │  │  │  ├─ components/    (Wiederverwendbare UI-Komponenten)
  │  │  │  └─ pipes/         (Custom Pipes)
  │  │  └─ components/       (Feature-Komponenten)
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
  - `appName: 'User App'`
- `angular.json` ist konfiguriert mit:
  - Build-Konfigurationen für dev, stage, prod
  - OutputPath: `../../deploy/backend/public/user` für Production
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
  - `isAuthenticated(): boolean`
  - Token-Storage (localStorage oder sessionStorage)
- `src/app/core/guards/auth.guard.ts` ist angelegt (Grundgerüst)
- `src/app/app.routes.ts` ist angelegt (leeres Routes-Array)
- NPM-Scripts in `package.json`:
  - `start`: Startet Dev-Server auf Port 4200
  - `build`: Production Build
  - `build:dev`: Development Build
  - `build:stage`: Stage Build
  - `test`: Unit Tests
  - `lint`: Linting

---

## User Story: Restaurant-Frontend initialisieren

Als Entwickler möchte ich die Restaurant-Angular-App vollständig konfiguriert haben, damit ich Features für Restaurantbesitzer implementieren kann.

### Acceptance Criteria:
- Angular v21 Projekt ist in `frontend/restaurant/` initialisiert
- Angular Material ist installiert und konfiguriert
- Ordnerstruktur ist identisch zu User-App:
  ```
  frontend/restaurant/
  ├─ src/
  │  ├─ app/
  │  │  ├─ core/
  │  │  │  ├─ services/
  │  │  │  ├─ guards/
  │  │  │  ├─ interceptors/
  │  │  │  └─ models/
  │  │  ├─ shared/
  │  │  │  ├─ components/
  │  │  │  └─ pipes/
  │  │  └─ components/
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
  - `appName: 'Restaurant App'`
- `angular.json` ist konfiguriert mit:
  - Build-Konfigurationen für dev, stage, prod
  - OutputPath: `../../deploy/backend/public/restaurant` für Production
  - File Replacements für Environments
  - BaseHref: `/restaurant/` für alle Builds
- `src/app/core/interceptors/auth.interceptor.ts` ist angelegt (identisch zu User-App)
- `src/app/core/interceptors/error.interceptor.ts` ist angelegt (identisch zu User-App)
- `src/app/core/services/auth.service.ts` ist angelegt (Grundgerüst, identisch zu User-App)
- `src/app/core/guards/auth.guard.ts` ist angelegt (Grundgerüst)
- `src/app/app.routes.ts` ist angelegt (leeres Routes-Array)
- NPM-Scripts in `package.json`:
  - `start`: Startet Dev-Server auf Port 4201
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
  - Startet User-Frontend auf Port 4200 (npm start)
  - Startet Restaurant-Frontend auf Port 4201 (npm start)
  - Alle drei Prozesse laufen parallel in separaten Konsolen/Tabs
  - Script wartet auf Benutzer-Abbruch (Ctrl+C)
- **Deployment-Modus** (`-Mode Deployment`):
  - Erstellt/leert `deploy/` Ordner
  - Baut User-Frontend (npm run build) → Output nach `deploy/backend/public/user/`
  - Baut Restaurant-Frontend (npm run build) → Output nach `deploy/backend/public/restaurant/`
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

Als Entwickler möchte ich, dass der Backend-Server beide Angular-Apps in Production ausliefern kann, damit nur ein Server deployed werden muss.

### Acceptance Criteria:
- `src/app.ts` enthält Static File Serving-Logik:
  ```typescript
  // User-App (root)
  app.use(express.static(path.join(__dirname, '../public/user')));
  
  // Restaurant-App (unter /restaurant)
  app.use('/restaurant', express.static(path.join(__dirname, '../public/restaurant')));
  
  // API-Routes (vor Fallbacks!)
  app.use('/api', apiRoutes);
  
  // SPA-Fallbacks (nach API-Routes!)
  app.get('/restaurant/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/restaurant/index.html'));
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/user/index.html'));
  });
  ```
- Reihenfolge ist kritisch: API-Routes MÜSSEN vor SPA-Fallbacks registriert werden
- `/api/*` wird NIE zu Angular weitergeleitet
- Alle anderen Routes werden zu entsprechender Angular-App weitergeleitet

---

## User Story: Projekt-Dokumentation erstellen

Als Entwickler möchte ich eine vollständige README haben, damit ich das Projekt schnell aufsetzen und verstehen kann.

### Acceptance Criteria:
- `README.md` im Root-Verzeichnis ist angelegt mit folgenden Abschnitten:
  1. **Projektübersicht**: Kurze Beschreibung der Food-Delivery-Plattform
  2. **Technologie-Stack**:
     - Backend: Node.js v24, Express, SQLite, TypeScript
     - Frontend User: Angular v21, Angular Material
     - Frontend Restaurant: Angular v21, Angular Material
     - Authentication: JWT (Custom Implementation)
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
     
     # User Frontend
     cd frontend/user
     npm install
     
     # Restaurant Frontend
     cd frontend/restaurant
     npm install
     ```
  6. **Konfiguration**:
     - `.env` Datei im Backend-Ordner anlegen (basierend auf `.env.example`)
     - Erforderliche Variablen dokumentieren
  7. **Development**:
     ```powershell
     .\scripts\build-and-run.ps1 -Mode Development
     ```
     - User-App: http://localhost:4200
     - Restaurant-App: http://localhost:4201
     - Backend API: http://localhost:3000/api
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
  11. **Weitere Dokumentation**: Verweis auf `/requirements/` Ordner

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

### Dependencies (Frontend - beide Apps):
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
CORS_ORIGIN=http://localhost:4200,http://localhost:4201

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
- Backend erlaubt Requests von `http://localhost:4200` und `http://localhost:4201`
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
   ├─ public/
   │  ├─ user/            (User Angular App)
   │  │  ├─ index.html
   │  │  └─ ...
   │  └─ restaurant/      (Restaurant Angular App)
   │     ├─ index.html
   │     └─ ...
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
7. **BaseHref für Restaurant-App:** Immer `/restaurant/` verwenden
8. **HTTP-Statuscodes beachten:** 422 für Validation, 401 für Auth, 404 für Not Found

---

## Definition of Done:
- [ ] Alle drei Projekte (Backend, User-Frontend, Restaurant-Frontend) sind initialisiert
- [ ] Alle Dependencies sind installiert und funktionieren
- [ ] PowerShell-Script startet erfolgreich im Development-Modus
- [ ] PowerShell-Script erstellt erfolgreich Deployment-Struktur
- [ ] Backend startet und läuft auf Port 3000
- [ ] User-Frontend startet und läuft auf Port 4200
- [ ] Restaurant-Frontend startet und läuft auf Port 4201
- [ ] Backend liefert "API is running" bei `GET /api/health`
- [ ] JWT-Middleware validiert Tokens korrekt (Unit-Test)
- [ ] Password-Hashing funktioniert mit Argon2id (Unit-Test)
- [ ] Datenbank wird initialisiert und Migrationen laufen
- [ ] CORS ist konfiguriert und funktioniert
- [ ] HTTP-Interceptors sind in Angular registriert
- [ ] Static File Serving funktioniert in Production-Build
- [ ] README.md ist vollständig und Anweisungen funktionieren
- [ ] Code-Review durch zweiten Entwickler erfolgt
- [ ] Keine Secrets im Git-Repository committed
