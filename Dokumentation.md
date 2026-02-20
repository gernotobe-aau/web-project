# Dokumentation - Food Delivery Platform

## 1. Projektübersicht

Die Food Delivery Platform ist ein vollständig funktionierendes System für die Verwaltung von Restaurantbestellungen. Das Projekt wurde unter Verwendung von Angular für das Frontend, Node.js mit Express für das Backend und SQLite als Datenbank implementiert.

Die Plattform unterstützt zwei Hauptakteure:
- **Restaurant Owner**: Verwaltet Menüs, akzeptiert Bestellungen, verfolgt deren Status und analysiert Verkaufsdaten
- **Customer (Kunde)**: Durchsucht Restaurants, erstellt Bestellungen, verfolgt Lieferstatus und hinterlässt Bewertungen

## 2. Systemarchitektur

### 2.1 Frontend-Architektur (Angular v21)

Die Angular-Anwendung folgt einer modularen Architektur:

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Zentrale Services, Guards, Interceptors
│   │   │   ├── services/            # API-Aufrufe (auth, restaurant, customer)
│   │   │   ├── guards/              # Route Protection (AuthGuard, RoleGuard)
│   │   │   └── interceptors/        # HTTP Interceptor für JWT
│   │   ├── shared/                  # Wiederverwendbare Komponenten
│   │   │   ├── components/          # Navigation, Error Dialogs
│   │   │   └── pipes/               # Custom Pipes
│   │   ├── features/                # Feature Module pro Rolle
│   │   │   ├── public/              # Login, Register, Landing Page
│   │   │   ├── customer/            # Customer Features
│   │   │   │   ├── restaurant-browsing/
│   │   │   │   ├── menu-view/
│   │   │   │   ├── cart-checkout/
│   │   │   │   ├── order-tracking/
│   │   │   │   ├── profile/
│   │   │   │   └── restaurant-reviews/
│   │   │   └── restaurant/          # Restaurant Owner Features
│   │   │       ├── menu-management/
│   │   │       ├── order-overview/
│   │   │       ├── profile-management/
│   │   │       └── analytics/
│   │   └── layout/                  # Main Layout Components
│   └── environments/                # Umgebungsvariablen
└── angular.json
```

### 2.2 Backend-Architektur (Node.js + Express)

Das Backend folgt dem Repository Pattern mit klarer Trennung der Geschäftslogik:

```
backend/src/
├── api/
│   ├── routes/                      # Express Route Definitionen
│   └── controllers/                 # Request Handler (Validierung)
├── business/                        # Geschäftslogik Layer
│   ├── auth.service.ts
│   ├── restaurant-profile.service.ts
│   ├── menu-management.service.ts
│   ├── order.service.ts
│   ├── analytics.service.ts
│   ├── customer-registration.service.ts
│   ├── restaurant-browsing.service.ts
│   └── ... weitere Services
├── repositories/                    # Datenbankzugriff
│   ├── restaurant.repository.ts
│   ├── order.repository.ts
│   ├── dish.repository.ts
│   └── ... weitere Repositories
├── db/
│   ├── migrations/                  # SQL Migrations (versioniert)
│   ├── init.ts                      # Datenbank Initialisierung
│   └── migration-runner.ts
├── middleware/                      # Express Middleware
│   ├── auth.middleware.ts           # JWT Verifizierung
│   └── error.middleware.ts          # Error Handling
├── config/
│   └── config.ts                    # Umgebungskonfiguration
├── types/
│   └── auth.types.ts               # TypeScript Interfaces
└── app.ts                           # Express App Einstiegspunkt
```

### 2.3 Datenbankschema

Die Datenbank wurde mit folgenden Haupttabellen implementiert:

- **users**: Speichert Authentifizierungsdaten für Kunden und Restaurant Owner
- **restaurants**: Restaurant Informationen, Kontakdaten, Öffnungszeiten
- **restaurant_profiles**: Detaillierte Restaurant-Profile (Beschreibung, Zonen, Kategorien)
- **categories**: Menü-Kategorien (Pasta, Pizza, Salate, etc.)
- **dishes**: Einzelne Gerichte mit Preisen und Beschreibungen
- **orders**: Bestellungen mit Status-Tracking
- **order_items**: Artikel in einer Bestellung (viele-zu-eins Beziehung)
- **reviews**: Kundenbewertungen für Restaurants und Gerichte
- **vouchers**: Promotionscodes mit Rabatt-Prozentsätzen

Alle Datenbankmigrations-Skripte sind versioniert in `backend/src/db/migrations/` und werden beim Start automatisch ausgeführt.

## 3. Entwicklungsverlauf und Modulverantwortlichkeiten

### Übersicht der Teamrollen

- **Gemeinsame Infrastruktur**: Beide Entwickler
- **Restaurant Owner Modul**: **Gernot Oberrauner**
- **Customer (User) Modul**: **Viktor**

### 3.1 Phase 1: Grundinfrastruktur (gemeinsam entwickelt)

**Zeitraum**: November - Dezember 2025

Die grundlegende Infrastruktur wurde als Team von beiden Entwicklern gemeinsam implementiert. Dies bildet die Basis, auf der beide Rollen aufbauen:

1. **Projektstruktur und initiales Setup**
   - Angular v21 und Node.js v24 Projektstruktur angelegt
   - TypeScript Konfigurationen für Frontend und Backend eingerichtet
   - Build- und Deployment-Skripte (PowerShell) erstellt
   - Git Repository und CI/CD-Grundlagen etabliert

2. **Authentication & Authorization System**
   - Password-Hashing mit Argon2id implementiert (sichere Speicherung)
   - JWT-basierte Authentication ohne OpenID Connect eingerichtet
   - Login und Registration Endpoints entwickelt
   - Auth Guard und HTTP Interceptor für Angular implementiert
   - Validierung mit 422 Unprocessable Entity Responses für Frontend-Fehlerbehandlung
   - Role-based Access Control (RBAC) für beide Rollen

3. **Datenbank-Infrastruktur und Schema**
   - SQLite Datenbank mit vollständigem Schema designt
   - Tabellen für Users, Restaurants, Dishes, Orders, Reviews, Vouchers
   - Migration System mit versionierten SQL-Files implementiert
   - Seed-Daten für Entwicklung und Testing hinzugefügt
   - Repository Pattern etabliert für alle Datenbankzugriffe

### 3.2 Phase 2: Restaurant Owner Modul

**Verantwortlicher**: Gernot Oberrauner
**Zeitraum**: Dezember 2025 - Januar 2026

Nachdem die gemeinsame Infrastruktur etabliert war, wurde das Restaurant Owner Modul vollständig von Gernot implementiert. Dieses Modul ermöglicht Restaurantbetreibern, ihre Geschäfte auf der Plattform zu verwalten.

1. **Menu Management System**
   - Kategorien erstellen, bearbeiten und löschen
   - Einzelne Gerichte hinzufügen mit Preis, Beschreibung und Bild-Referenzen
   - Validierung auf Backend-Seite durchsetzen
   - Angular Material UI für übersichtliche Menü-Verwaltung
   - Backend Services für CRUD-Operationen

2. **Restaurant Profil Management**
   - Restaurant-Name, Kontaktinformationen und Adresse bearbeiten
   - Öffnungszeiten konfigurieren und speichern
   - Verfügbare Kategorien auswählen und verwalten
   - Validierung mit sauberen Error Responses
   - REST Endpoints zum Abrufen und Aktualisieren von Restaurant-Details

3. **Order Reception & Management**
   - Dashboard mit Übersicht aller eingehenden Bestellungen
   - Bestellungen in Echtzeit anzeigen
   - Bestellungen akzeptieren oder ablehnen mit Validierung
   - Order-Status durch verschiedene Phasen verwalten (eingegangen → vorbereitung → fertig → versandt)
   - Backend-Endpunkte für Status-Updates mit entsprechender Fehlerbehandlung

4. **Analytics Dashboard**
   - Täglich und wöchentlich aggregierte Bestellungsstatistiken anzeigen
   - Meistbestellte Gerichte identifizieren und visualisieren
   - Umsatzdaten und Auftragsvolumen im Zeitverlauf
   - Hilfreiche Insights für Geschäftsentscheidungen

### 3.3 Phase 3: Customer (User) Modul

**Verantwortlicher**: Viktor
**Zeitraum**: Januar 2026

Das Customer-Modul wurde von Viktor entwickelt und ermöglicht Endkunden, Restaurants zu durchsuchen, Bestellungen zu platzieren und Feedback zu hinterlassen.

1. **Customer Profile Management**
   - Kundenprofil anzeigen und bearbeiten
   - Persönliche Daten wie Name und Adresse aktualisieren
   - Passwort ändern und Sicherheit verwalten
   - Lieferadresse speichern und verwalten

2. **Restaurant Browsing & Discovery**
   - Restaurant-Übersichtsseite mit Filtration nach Kategorien
   - Restaurant-Details mit Öffnungszeiten und Kontaktinformationen
   - Dynamisches Laden von Restaurant-Daten
   - Benutzerfreundliche Navigation durch verfügbare Restaurants

3. **Menu View & Kategorisierung**
   - Vollständiges Menü eines Restaurants anzeigen
   - Gerichte nach Kategorien gruppieren (Pasta, Pizza, etc.)
   - Gerichte mit Beschreibungen, Preisen und Bildern präsentieren
   - Intuitive Menü-Navigation

4. **Shopping Cart & Checkout Process**
   - Gerichte zum Warenkorb hinzufügen und verwalten
   - Mengen anpassen und Artikel entfernen
   - Bestellung mit vollständiger Validierung aufgeben
   - Voucher und Rabattcodes anwenden
   - Letzter Überblick vor Bestellungsbestätigung

5. **Order Placement & Confirmation**
   - REST API für sichere Order-Erstellung
   - Bestellungsbestätigung mit Details an Kunde
   - Persistierung aller Bestellungs- und Artikel-Daten
   - Fehlerbehandlung und Validierung

6. **Restaurant & Dish Reviews**
   - Restaurants und Gerichte bewerten (Sternesystem)
   - Textuelle Bewertungen und Kommentare hinterlassen
   - Bewertungen speichern und durch andere Kunden sichtbar machen
   - Feedback-System für kontinuierliche Verbesserung

### 3.4 Stabilisierung und Bug Fixes

Im Laufe des Projekts wurden verschiedene Stabilitätsverbesserungen durchgeführt:

- **Token- und Session-Management**: Token Expiration Handling in der App-Komponente mit Prüfung beim Start
- **Login-Fehlerbehandlung**: Fixes für Login-Fehler, um mehrfache Login-Versuche zu ermöglichen
- **UI-Konsistenz**: Kategorie-Normalisierung für einheitliche Darstellung
- **Seed-Daten**: Verbesserte Test-Daten für realistische Szenarien
- **Deployment-Optimierungen**: Verbesserungen an Build- und Reset-Skripten


## 4. Team-Beiträge und Aufgabenvergabe

### Gemeinsame Komponenten (Beide Entwickler)
- Projekt-Setup und Architektur des gesamten Systems
- Authentication & Authorization System mit JWT
- Datenbank-Design, Schema und Migrations-System
- Validierungs-Framework (sowohl Backend als auch Frontend)
- Error Handling und richtige HTTP Status Codes
- Shared UI Components (Navigation Bar, Error Dialogs, Modals)
- HTTP Interceptor für JWT-Token
- Route Guards für Rollen-basierte Kontrolle
- TypeScript Konfiguration und Build-Prozess
- Seed-Daten und Test-Infrastruktur

### Restaurant Owner Modul (Gernot Oberrauner)
- **Menu Management System** - Komplettes CRUD für Kategorien und Gerichte
- **Restaurant Profil Management** - Profildaten, Öffnungszeiten, Kategorien
- **Order Reception & Management** - Bestellungs-Dashboard, Status-Updates
- **Analytics Dashboard** - Statistiken, Meistverkaufte Gerichte, Umsatz
- Alle Backend-Endpunkte und Business-Logic für Restaurant Owner Features
- Alle Angular-Komponenten und UI für Restaurant Owner Bereich
- Order Status Management und Validierungslogik

### Customer (User) Modul (Viktor)
- **Restaurant Browsing & Discovery** - Übersicht, Filter, Details
- **Menu View mit Kategorisierung** - Anzeige aller Menü-Items organisiertiert
- **Shopping Cart & Checkout** - Warenkorb-Verwaltung, Bestellung aufgeben
- **Order Tracking** - Bestellungs-Übersicht und Status
- **Customer Profile Management** - Profil-Bearbeitung, Adressen
- **Reviews & Feedback System** - Bewertungen für Restaurants und Gerichte
- Alle Backend-Endpunkte und Business-Logic für Customer Features
- Alle Angular-Komponenten und UI für Customer Bereich

## 5. Implementierte Kernfeatures und Anforderungsabdeckung

### Verwendete Technologien gemäß Anforderungen
- Angular v21 für Frontend
- Node.js v24 mit Express für REST API Backend
- SQLite für Datenpersistierung
- JWT-basierte Authentication ohne OpenID Connect
- Argon2id für sichere Passwort-Speicherung
- Repository Pattern für Datenbankzugriff
- Role-Based Access Control (RBAC)

### Hinweis zu Locationbasiertem Liefergebiet

**Wichtiger Hinweis**: Das einzige Feature, das von der Anforderung nicht implementiert wurde, ist die Standort-/Radius-basierte Liefergebiets-Verwaltung. 

Laut Anforderung sollte eine der folgenden Methoden umgesetzt werden:
- Grid-basierte Koordinaten mit Manhattan-Distance
- Area/Zone Labels (z.B. A1, B2)
- Benannte Delivery Zones (Nord, Süd, Central)
- Radius-basierte Simulation mit Distance

Diese Funktionalität wurde nicht implementiert. Dies bedeutet:
- Restaurants können keine Lieferzonen definieren
- Die automatische Lieferzeitberechnung basiert nicht auf Distanz
- Es gibt keine geografische Filterung von Restaurants basierend auf Kundenlocation

Alle anderen Anforderungen für die beiden Rollen (Restaurant Owner und Customer) wurden vollständig erfüllt.

### Common Features (Alle Rollen)
- Authentifizierung mit Email und Passwort
- Passwort-Hashing mit Argon2id
- JWT-basierte Sessions
- Responsive UI für Desktop, Tablet und Smartphone
- Input-Validierung (Frontend als UX, Backend als Sicherheit)
- Fehlerbehandlung mit korrekten HTTP Status Codes
- Database mit SQLite und Migrations-System

### Restaurant Owner Features
- Menü mit Kategorien und Gerichten verwalten
- Restaurantprofil mit Öffnungszeiten und Kontakten
- Bestellungs-Eingangsverwaltung in Echtzeit
- Order Status Management (akzeptieren → ablehnen → vorbereitung → fertig → versandt)
- Daily/Weekly Analytics Dashboard
- Meistbestellte Gerichte Tracking

### Customer Features
- Restaurants durchsuchen und filtern
- Detaillierte Restaurant- und Menü-Übersicht
- Warenkorb mit Änderungsmöglichkeit
- Bestellungen mit Voucher-Anwendung
- Bestellungs-Tracking
- Bewertungssystem für Restaurants und Gerichte
- Profil-Management

## 6. Implementierte Kernfeatures

### Security & Validation
- Backend validiert ALLE Eingaben vor Persistierung (nicht Frontend-abhängig)
- Passwörter mit state-of-the-art Hashing (Argon2id)
- JWT Token Handling mit konfigurierbarem Secret und Expiration
- CORS richtig konfiguriert für separate Frontend/Backend Deployment
- Keine sensiblen Daten in Error Messages

### API Design
- RESTful Principles konsequent umgesetzt
- Alle Endpoints mit `/api` Prefix
- Proper HTTP Status Codes (200, 401, 404, 409, 422, 500)
- Konsistente Error Response Format
- Business Logic nur in Service-Layer, nicht in Routes/Controllers

### Datenbank
- Versionierte Migrations-System
- Seed-Daten für Testing
- Proper Foreign Keys und Relationships
- SQLite für einfache Deployment

## 7. Build- und Deployment-Scripts

Das Projekt enthält mehrere PowerShell-Scripts zur Automatisierung von häufigen Aufgaben:

### build-and-run.ps1 - Hauptskript für Entwicklung und Deployment

Das zentrale Skript für die gesamte Anwendungsverwaltung:

```powershell
.\scripts\build-and-run.ps1 -Mode Development
.\scripts\build-and-run.ps1 -Mode Deployment
```

**Development Mode**:
- Installiert oder aktualisiert npm Dependencies für Backend und Frontend
- Erstellt `.env` Datei wenn nicht vorhanden
- Initialisiert die SQLite Datenbank mit Migrations
- Lädt Seed-Daten ein
- Startet Backend Server auf Port 3000 (Express)
- Startet Frontend Development Server auf Port 4200 (Angular)
- Öffnet beide Anwendungen automatisch im Browser

**Deployment Mode**:
- Kompiliert Node.js Backend zu JavaScript
- Erzeugt Angular Production Build mit AOT Compilation
- Optimiert alle JavaScript Bundles (Minification, Tree Shaking)
- Erstellt `deploy/backend/` Verzeichnis
- Kopiert kompiliertes Backend und Frontend Assets
- Generiert `start-server.ps1` für Production Startup

### seed-test-data.ps1 - Datenbefüllung für Entwicklung

Dieses Script behebt und füllt die Datenbank mit realistischen Test-Daten:

```bash
cd backend
npm run seed
```

**Was das Seeding macht**:

1. **Benutzer hinzufügen**:
   - Test Customer Accounts mit verschiedenen Adressen
   - Test Restaurant Owner Accounts
   - Vordefinierte Credentials für manuelles Testing

2. **Restaurants anlegen** mit:
   - Name, Telefon, Email, Adresse
   - Öffnungszeiten (Mo-So, unterschiedliche Zeiten)
   - Beschreibungen und Kategorien
   - Restaurantprofile mit Details

3. **Menü erstellen**:
   - Kategorien (Pasta, Pizza, Salate, Desserts, etc.)
   - Gerichte mit Preisen (€10-€25 Bereich)
   - Beschreibungen und Bilder-Referenzen
   - Realistische Kombinationen

4. **Beispiel-Bestellungen**:
   - Order Items von Customers
   - Verschiedene Order Status (eingegangen, vorbereitung, fertig, versandt)
   - Order Timestamps für Analytics
   - Rabattcodes und Voucher

5. **Bewertungen**:
   - Customer Reviews für Restaurants (1-5 Sterne)
   - Dish Reviews mit Kommentaren
   - Zeitstempel für Authentizität

6. **Voucher/Codes**:
   - Beispiel Discount-Codes (z.B. "SUMMER2026", "WELCOME10")
   - Verschiedene Discount-Prozentsätze
   - Gültigkeitsdaten

**Idempotenz**: Das Script ist sicher mehrfach ausführbar und erstellt keine Duplikate bei mehrmaliger Ausführung.

### reset-and-run.ps1 - Kompletter Database Reset

Löscht die komplette Datenbank und startet von vorne:

```powershell
.\scripts\reset-and-run.ps1
```

Dies ist nützlich für:
- Bereinigung nach Tests
- Verlust von Testdaten
- Rückkehr zu sauberer Basis
- Entwicklung mit frischen Daten

Das Script:
1. Löscht `backend/database.sqlite` falls vorhanden
2. Führt alle Migrations aus
3. Lädt Seed-Daten
4. Startet Backend und Frontend

### install.ps1 - Dependency Installation

Installiert alle npm Dependencies:

```powershell
.\scripts\install.ps1
```

Führt aus:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### start.ps1 - Schneller Start

Startet Backend und Frontend ohne Neuinstallation:

```powershell
.\scripts\start.ps1
```

Nützlich wenn alle Dependencies bereits installiert sind.

## 8. Setup und Ausführung

### Installation
```bash
# Backend Dependencies
cd backend
npm install

# Frontend Dependencies
cd frontend
npm install
```

### Umgebung
Erstelle `backend/.env`:
```
JWT_SECRET=your-secure-random-key
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

### Entwicklung starten
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

Die Anwendung ist dann erreichbar unter:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

### Datenbank Resets
```powershell
# Mit Test-Daten neu initialisieren
.\scripts\reset-and-run.ps1
```

## 9. Technische Highlights und Design Entscheidungen

### Security & Validation
- Backend validiert ALLE Eingaben vor Persistierung (nicht Frontend-abhängig)
- Passwörter mit state-of-the-art Hashing (Argon2id)
- JWT Token Handling mit konfigurierbarem Secret und Expiration
- CORS richtig konfiguriert für separate Frontend/Backend Deployment
- Keine sensiblen Daten in Error Messages

### API Design
- RESTful Principles konsequent umgesetzt
- Alle Endpoints mit `/api` Prefix
- Proper HTTP Status Codes (200, 401, 404, 409, 422, 500)
- Konsistente Error Response Format
- Business Logic nur in Service-Layer, nicht in Routes/Controllers

### Datenbank
- Versionierte Migrations-System
- Seed-Daten für Testing
- Proper Foreign Keys und Relationships
- SQLite für einfache Deployment

## 10. Lessons Learned und Herausforderungen

### Wichtigste Erkenntnisse
1. **Separation of Concerns**: Klare Trennung der Geschäftslogik in Service-Layer ist essentiell
2. **Validation Strategy**: Backend-Validierung MUSS unabhängig von Frontend sein
3. **Error Handling**: Konsistente Fehlerbehandlung über alle Layer ist wichtig
4. **Migration System**: Versionierte DB-Migrations machen Team-Arbeit deutlich einfacher

### Technische Herausforderungen
- JWT Token Expiration und Refresh Handling erforderte mehrere Iterationen
- Order Status Management mit korrektem Validierungsfluss
- Category Normalisierung für konsistente UI-Darstellung
- Migration System für koordinierte Datenbank-Änderungen im Team

## 11. Deployment

Die Anwendung ist produktionsreif und kann mit dem Deployment-Skript gebaut werden:

```powershell
.\scripts\build-and-run.ps1 -Mode Deployment
```

Dies erstellt einen `deploy/` Ordner mit:
- Kompiliertem Backend
- Gebautem Frontend (static assets)
- Start-Skript für Production

Der Production-Server hostet automatisch beide Anwendungen:
- Frontend unter `/`
- API unter `/api`

---

**Letztes Update**: Februar 2026
**Project Status**: MVP Funktional, alle Kernfeatures implementiert. Einzige fehlende Komponente: Standort-/Radius-basierte Liefergebiet-Verwaltung (siehe Abschnitt 5 für Details).
