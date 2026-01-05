# Feature 002: User Authentication and Registration

Implementierung eines vollständigen Login- und Registrierungssystems für Kunden und Restaurantbesitzer mit differenzierter Weiterleitung nach erfolgreichem Login.

## Acceptance Criteria:
- Kunden können sich mit allen erforderlichen Daten registrieren (Vorname, Nachname, Geburtsdatum, Lieferadresse, E-Mail, Passwort)
- Restaurantbesitzer können sich mit allen erforderlichen Daten registrieren (Vorname, Nachname, Geburtsdatum, Restaurantname, Restaurantadresse, Kategorien, Kontaktinformationen, E-Mail, Öffnungszeiten, Passwort)
- Alle Validierungen werden sowohl auf Frontend (UX) als auch auf Backend (authorativ) durchgeführt
- Passwörter werden mit Argon2id gehasht und gesalzen in der Datenbank gespeichert
- Nach Login wird ein JWT Token generiert und zurückgegeben
- Kunden werden nach Login zur Restaurant-Browsing-Ansicht weitergeleitet (ähnlich Landing Page, aber eingeloggt)
- Restaurantbesitzer werden nach Login zum Restaurant-Dashboard weitergeleitet
- Fehlermeldungen bei fehlgeschlagener Registrierung oder Login werden benutzerfreundlich angezeigt
- E-Mail-Adressen sind systemweit eindeutig (ein User-Account pro E-Mail)
- HTTP 422 wird für Validierungsfehler zurückgegeben

---

## User Story 1: Kunden-Registrierung - Backend API

Als **Backend-Entwickler** möchte ich einen REST-Endpunkt für die Kunden-Registrierung implementieren, sodass neue Kunden sich im System registrieren können.

### Acceptance Criteria:

#### Endpunkt
- `POST /api/auth/register/customer`
- Content-Type: `application/json`

#### Request Body
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "email": "string",
  "password": "string",
  "deliveryAddress": {
    "street": "string",
    "houseNumber": "string",
    "staircase": "string (optional)",
    "door": "string (optional)",
    "postalCode": "string",
    "city": "string"
  }
}
```

#### Backend-Validierung (MANDATORY)
Alle Validierungen müssen im Backend durchgeführt werden:

**Vorname & Nachname:**
- Required
- Min. 1, max. 30 Zeichen
- Nur Buchstaben, Bindestrich (-), Punkt (.)
- Keine Zahlen oder andere Sonderzeichen

**Geburtsdatum:**
- Required
- Muss gültiges Datum sein (YYYY-MM-DD Format)
- Berechnung des Alters: mindestens 16 Jahre alt
- Mindestalter muss aus `config.ts` geladen werden (konfigurierbar: `CUSTOMER_MIN_AGE`)

**E-Mail:**
- Required
- Muss gültiges E-Mail-Format haben (Regex-Validierung)
- Muss systemweit eindeutig sein (check gegen Datenbank)
- Case-insensitive Prüfung
- Max. 255 Zeichen

**Passwort:**
- Required
- Min. 8 Zeichen
- Muss mit Argon2id gehasht werden (PasswordService verwenden)
- Salt muss automatisch und eindeutig pro Passwort generiert werden

**Lieferadresse:**
- Alle Felder required außer `staircase` und `door`
- `street`: max. 100 Zeichen
- `houseNumber`: max. 10 Zeichen
- `staircase`: max. 10 Zeichen (optional)
- `door`: max. 10 Zeichen (optional)
- `postalCode`: genau 4 Zeichen, nur Zahlen
- `city`: max. 100 Zeichen

#### Response bei Erfolg (201 Created)
```json
{
  "message": "Customer registered successfully",
  "userId": "uuid",
  "accessToken": "jwt-token"
}
```

#### Response bei Validierungsfehlern (422 Unprocessable Entity)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email address is already in use"
    },
    {
      "field": "dateOfBirth",
      "message": "Customer must be at least 16 years old"
    }
  ]
}
```

#### Response bei anderen Fehlern
- `400 Bad Request`: Malformed JSON oder fehlende erforderliche Felder
- `500 Internal Server Error`: Unerwarteter Fehler

#### Technische Implementierung
- **Controller** (`CustomerAuthController`):
  - Validiert Request-Format
  - Ruft Business Logic auf
  - Mappt Responses
  
- **Business Logic** (`CustomerRegistrationService`):
  - Führt alle Validierungen durch
  - Prüft E-Mail-Eindeutigkeit via CustomerRepository
  - Hasht Passwort via PasswordService
  - Erstellt Customer via CustomerRepository
  - Generiert JWT Token via AuthService
  - Keine Persistierung bei Fehler in der Validierung

- **Repository** (`CustomerRepository`):
  - `create(customer)`: Erstellt neuen Customer
  - `findByEmail(email)`: Prüft E-Mail-Existenz (case-insensitive)
  
- **Database Migration** (`002_authentication_tables.sql`):
  - Tabelle `customers` mit allen Feldern
  - Constraint: `email` unique
  - Index auf `email` (case-insensitive)

#### Config-Erweiterung
In `config/config.ts` hinzufügen:
```typescript
CUSTOMER_MIN_AGE: parseInt(process.env.CUSTOMER_MIN_AGE || '16', 10)
```

In `.env.example` hinzufügen:
```
CUSTOMER_MIN_AGE=16
```

---

## User Story 2: Restaurantbesitzer-Registrierung - Backend API

Als **Backend-Entwickler** möchte ich einen REST-Endpunkt für die Restaurantbesitzer-Registrierung implementieren, sodass neue Restaurantbesitzer sich im System registrieren können.

### Acceptance Criteria:

#### Endpunkt
- `POST /api/auth/register/restaurant-owner`
- Content-Type: `application/json`

#### Request Body
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "email": "string",
  "password": "string",
  "restaurant": {
    "name": "string",
    "address": {
      "street": "string",
      "houseNumber": "string",
      "staircase": "string (optional)",
      "door": "string (optional)",
      "postalCode": "string",
      "city": "string"
    },
    "cuisineTypes": ["string"],
    "contactInfo": {
      "phone": "string",
      "email": "string (optional)"
    },
    "openingHours": [
      {
        "dayOfWeek": 0-6,
        "openTime": "HH:MM",
        "closeTime": "HH:MM",
        "isClosed": false
      }
    ]
  }
}
```

#### Backend-Validierung (MANDATORY)

**Vorname & Nachname:** (wie bei Kunde)
- Required
- Min. 1, max. 30 Zeichen
- Nur Buchstaben, Bindestrich (-), Punkt (.)

**Geburtsdatum:**
- Required
- Muss gültiges Datum sein
- Mindestalter: 18 Jahre (konfigurierbar via `RESTAURANT_OWNER_MIN_AGE` in config)

**E-Mail (Owner):**
- Required
- Gültiges E-Mail-Format
- Systemweit eindeutig (nicht nur für Restaurant-Owner, sondern über alle User-Typen)
- Case-insensitive
- Max. 255 Zeichen

**Passwort:** (wie bei Kunde)
- Required
- Min. 8 Zeichen
- Argon2id Hashing

**Restaurant Name:**
- Required
- Min. 2, max. 100 Zeichen
- Nur Buchstaben, Zahlen, Punkt (.), Bindestrich (-), Schrägstrich (/)
- Muss im **selben Ort** eindeutig sein (Prüfung: `restaurant.name + restaurant.address.city`)

**Restaurant Adresse:**
- Wie Lieferadresse bei Kunde
- Alle Felder required außer `staircase` und `door`

**Kategorien / Küchenarten:**
- Required, mindestens eine Kategorie
- Jede Kategorie muss aus vordefinierter Liste stammen (aus config/config.ts)
- Liste in Config: `AVAILABLE_CUISINE_TYPES: ['italienisch', 'asiatisch', 'griechisch', 'amerikanisch', 'vegetarisch', 'vegan', 'fastfood', 'burger', 'pizza', 'sushi', 'indisch', 'mexikanisch']`
- Validierung: Alle übergebenen Werte müssen in dieser Liste sein

**Kontaktinformationen:**
- `phone`: Required, Format-Validierung (z.B. +43 xxx oder 0xxx), max. 20 Zeichen
- `email`: Optional, wenn angegeben dann gültiges E-Mail-Format

**Öffnungszeiten:**
- Required (array mit 7 Einträgen, einer pro Wochentag 0=Sonntag bis 6=Samstag)
- Jeder Eintrag muss `dayOfWeek` (0-6), `openTime`, `closeTime`, `isClosed` enthalten
- `openTime` und `closeTime`: Format HH:MM (24h)
- Wenn `isClosed = true`, dann sind `openTime` und `closeTime` optional/ignoriert
- Wenn `isClosed = false`, dann müssen `openTime` und `closeTime` gültig sein und `openTime < closeTime`

#### Response bei Erfolg (201 Created)
```json
{
  "message": "Restaurant owner registered successfully",
  "userId": "uuid",
  "restaurantId": "uuid",
  "accessToken": "jwt-token"
}
```

#### Response bei Validierungsfehlern (422 Unprocessable Entity)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "restaurant.name",
      "message": "A restaurant with this name already exists in this city"
    },
    {
      "field": "dateOfBirth",
      "message": "Restaurant owner must be at least 18 years old"
    },
    {
      "field": "restaurant.cuisineTypes",
      "message": "Invalid cuisine type: fastfood2"
    }
  ]
}
```

#### Technische Implementierung
- **Controller** (`RestaurantOwnerAuthController`):
  - Validiert Request-Format
  - Ruft Business Logic auf
  
- **Business Logic** (`RestaurantOwnerRegistrationService`):
  - Führt alle Validierungen durch
  - Prüft E-Mail-Eindeutigkeit über alle User-Typen
  - Prüft Restaurant-Name-Eindeutigkeit im selben Ort
  - Hasht Passwort
  - Erstellt Owner + Restaurant in einer Transaktion
  - Generiert JWT Token
  
- **Repositories**:
  - `RestaurantOwnerRepository`: `create()`, `findByEmail()`
  - `RestaurantRepository`: `create()`, `findByNameAndCity()`
  
- **Database Migration** (`002_authentication_tables.sql`):
  - Tabelle `restaurant_owners` mit allen Feldern
  - Tabelle `restaurants` mit allen Feldern und Relation zu owner
  - Tabelle `restaurant_opening_hours` (1:n zu restaurant)
  - Tabelle `restaurant_cuisine_types` (m:n zu restaurant)
  - Constraints: unique auf `email` bei owners, unique index auf `(name, city)` bei restaurants

#### Config-Erweiterung
In `config/config.ts`:
```typescript
RESTAURANT_OWNER_MIN_AGE: parseInt(process.env.RESTAURANT_OWNER_MIN_AGE || '18', 10),
AVAILABLE_CUISINE_TYPES: [
  'italienisch',
  'asiatisch', 
  'griechisch',
  'amerikanisch',
  'vegetarisch',
  'vegan',
  'fastfood',
  'burger',
  'pizza',
  'sushi',
  'indisch',
  'mexikanisch'
]
```

---

## User Story 3: Login - Backend API

Als **Backend-Entwickler** möchte ich einen gemeinsamen Login-Endpunkt für Kunden und Restaurantbesitzer implementieren, sodass beide Benutzertypen sich authentifizieren können.

### Acceptance Criteria:

#### Endpunkt
- `POST /api/auth/login`
- Content-Type: `application/json`

#### Request Body
```json
{
  "email": "string",
  "password": "string"
}
```

#### Backend-Logik
- System sucht in beiden Tabellen (`customers` und `restaurant_owners`) nach der E-Mail
- E-Mail-Suche ist case-insensitive
- Passwort wird mit Argon2id verifiziert (PasswordService)
- Bei erfolgreicher Authentifizierung wird JWT Token mit folgenden Claims generiert:
  - `sub`: userId (UUID)
  - `email`: E-Mail des Users
  - `role`: "customer" oder "restaurant_owner"
  - `restaurantId`: nur bei restaurant_owner (UUID des zugehörigen Restaurants)
  - `iat`: Issued At timestamp
  - `exp`: Expiration timestamp (konfigurierbar, default 24h)

#### Response bei Erfolg (200 OK)
```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "firstName": "Max",
    "lastName": "Mustermann"
  }
}
```

Für Restaurant Owner:
```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "restaurant_owner",
    "firstName": "Maria",
    "lastName": "Muster",
    "restaurantId": "uuid",
    "restaurantName": "Bella Italia"
  }
}
```

#### Response bei Fehlern
- `400 Bad Request`: Fehlende Felder (`email` oder `password`)
- `401 Unauthorized`: Falsche E-Mail oder Passwort
  ```json
  {
    "error": "Invalid credentials"
  }
  ```
- `500 Internal Server Error`: Unerwarteter Fehler

#### Technische Implementierung
- **Controller** (`AuthController`):
  - Validiert Request-Format
  - Ruft Business Logic auf
  
- **Business Logic** (`LoginService`):
  - Sucht User in beiden Repositories
  - Verifiziert Passwort via PasswordService
  - Generiert JWT Token via AuthService mit korrekter Rolle
  - Niemals Informationen preisgeben, welcher Teil fehlschlug (E-Mail oder Passwort)
  
- **Repositories**:
  - `CustomerRepository`: `findByEmailWithPassword(email)` → returned Customer mit gehashtem Passwort
  - `RestaurantOwnerRepository`: `findByEmailWithPassword(email)` → returned Owner mit Restaurant-Info und gehashtem Passwort

#### Security
- Rate Limiting: Max. 5 Login-Versuche pro E-Mail in 15 Minuten (implementiert als Middleware)
- Bei mehrfachen fehlgeschlagenen Versuchen: 429 Too Many Requests
- Keine Unterscheidung in Fehlermeldung ob E-Mail existiert oder Passwort falsch ist

---

## User Story 4: Kunden-Registrierung - Frontend UI

Als **Frontend-Entwickler** möchte ich ein benutzerfreundliches Registrierungsformular für Kunden erstellen, sodass neue Kunden sich einfach registrieren können.

### Acceptance Criteria:

#### Komponente
- Location: `frontend/src/app/features/public/register/`
- Files: `register.component.ts`, `register.component.html`, `register.component.css`
- Route: `/register`

#### UI-Struktur (Angular Material)
Das Formular nutzt Angular Material Components:
- `mat-card` für Container
- `mat-form-field` + `mat-input` für Texteingaben
- `mat-datepicker` für Geburtsdatum
- `mat-radio-group` zur Auswahl: "Ich bin Kunde" vs "Ich bin Restaurantbesitzer"
- `mat-button` für Submit

#### Formular-Felder für Kunde
1. **Benutzertyp-Auswahl** (Radio Buttons):
   - "Ich bin Kunde"
   - "Ich bin Restaurantbesitzer"
   - Default: "Ich bin Kunde"

2. **Persönliche Daten**:
   - Vorname (Text Input)
   - Nachname (Text Input)
   - Geburtsdatum (Datepicker)
   - E-Mail (Text Input, type="email")
   - Passwort (Text Input, type="password")
   - Passwort bestätigen (Text Input, type="password")

3. **Lieferadresse** (nur wenn "Kunde" ausgewählt):
   - Straße (Text Input)
   - Hausnummer (Text Input)
   - Stiege (Text Input, optional)
   - Tür (Text Input, optional)
   - Postleitzahl (Text Input)
   - Ort (Text Input)

4. **Submit Button**: "Registrieren"
5. **Link zu Login**: "Bereits registriert? Zum Login"

#### Frontend-Validierung (UX-only)
Alle Validierungen mit Angular Reactive Forms und Validators:

- Vorname/Nachname:
  - Required
  - Pattern: `/^[a-zA-ZäöüÄÖÜß.\-]+$/`
  - minLength: 1, maxLength: 30

- Geburtsdatum:
  - Required
  - Muss in der Vergangenheit liegen
  - Mindestalter-Prüfung (berechnet im Component)

- E-Mail:
  - Required
  - Validators.email

- Passwort:
  - Required
  - minLength: 8
  
- Passwort bestätigen:
  - Required
  - Custom Validator: Muss mit Passwort übereinstimmen

- Lieferadresse:
  - Straße, Hausnummer, PLZ, Ort: Required
  - PLZ: Pattern `/^[0-9]{4}$/`

**Wichtig**: Felder zeigen Fehlermeldungen nur an, wenn touched/dirty

#### API-Integration
- Bei Submit: Call `AuthService.registerCustomer(customerData)`
- AuthService ruft `POST /api/auth/register/customer` auf
- Bei Erfolg (201):
  - Token im LocalStorage speichern
  - Navigiere zu `/customer/dashboard` via Router
- Bei Fehler (422):
  - Parse `details[]` array
  - Zeige Fehlermeldungen an entsprechenden Feldern an
  - Verwende `setErrors()` auf FormControls
- Bei anderen Fehlern:
  - Zeige generische Fehlermeldung (z.B. mat-snackbar)

#### Responsive Design
- Mobile-first approach
- Formular nimmt auf Mobile 100% Breite, auf Desktop max. 600px zentriert
- Felder stapeln sich vertikal auf Mobile
- Adress-Felder (Straße, Hausnummer) nebeneinander auf Desktop

#### Accessibility
- Alle Inputs haben Labels
- Error-Messages sind mit aria-describedby verknüpft
- Formular ist keyboard-navigierbar
- Submit-Button ist disabled wenn Formular invalid oder am Submitting

---

## User Story 5: Restaurantbesitzer-Registrierung - Frontend UI

Als **Frontend-Entwickler** möchte ich das Registrierungsformular um Restaurantbesitzer-spezifische Felder erweitern, sodass Restaurantbesitzer sich registrieren können.

### Acceptance Criteria:

#### UI-Erweiterung
Wenn "Ich bin Restaurantbesitzer" ausgewählt ist, werden zusätzliche Felder angezeigt:

**Restaurant-Informationen**:
1. **Restaurantname** (Text Input, required)
2. **Restaurantadresse**:
   - Straße (Text Input, required)
   - Hausnummer (Text Input, required)
   - Stiege (Text Input, optional)
   - Tür (Text Input, optional)
   - Postleitzahl (Text Input, required, 4 Zahlen)
   - Ort (Text Input, required)

3. **Kategorien / Küchenarten** (Multi-Select):
   - `mat-select` mit `multiple` attribute
   - Options laden aus Environment oder statischer Konstante im Service
   - Options: italienisch, asiatisch, griechisch, amerikanisch, vegetarisch, vegan, fastfood, burger, pizza, sushi, indisch, mexikanisch
   - Mindestens eine Auswahl required

4. **Kontaktinformationen**:
   - Telefon (Text Input, required)
   - Kontakt-E-Mail (Text Input, optional)

5. **Öffnungszeiten** (7 Zeilen für jeden Wochentag):
   - Jede Zeile zeigt: "Montag", "Dienstag", etc.
   - Checkbox "Geschlossen"
   - Wenn nicht geschlossen: "Von" (Time Input) und "Bis" (Time Input)
   - Default: Alle Tage von 11:00 bis 22:00, Sonntag geschlossen

#### Frontend-Validierung (Restaurantbesitzer)
- Restaurantname:
  - Required
  - Pattern: `/^[a-zA-Z0-9äöüÄÖÜß.\-/\s]+$/`
  - minLength: 2, maxLength: 100

- Kategorien:
  - Required
  - Min. eine Auswahl

- Telefon:
  - Required
  - Pattern: `/^[+]?[0-9\s\-()]+$/`
  - maxLength: 20

- Kontakt-E-Mail (wenn ausgefüllt):
  - Validators.email

- Öffnungszeiten:
  - Wenn "Geschlossen" nicht gewählt: "Von" und "Bis" sind required
  - "Von" muss zeitlich vor "Bis" sein (Custom Validator)

#### API-Integration
- Bei Submit: Call `AuthService.registerRestaurantOwner(ownerData)`
- AuthService ruft `POST /api/auth/register/restaurant-owner` auf
- Bei Erfolg (201):
  - Token im LocalStorage speichern
  - Navigiere zu `/restaurant/dashboard`
- Bei Fehler (422):
  - Parse `details[]` und zeige Fehler an
  - Besonders Restaurant-spezifische Fehler (z.B. "Name schon vergeben in diesem Ort")

#### UX
- Wenn User zwischen "Kunde" und "Restaurantbesitzer" wechselt:
  - Formular wird resetted (außer gemeinsame Felder wie Name, E-Mail)
  - Spezifische Felder werden ein-/ausgeblendet mit Animationen
  
- Öffnungszeiten haben einen "Alle übernehmen" Button:
  - Kopiert die Öffnungszeiten von Montag auf alle anderen Tage (außer Sonntag bleibt geschlossen)

---

## User Story 6: Login - Frontend UI

Als **Frontend-Entwickler** möchte ich eine Login-Seite erstellen, sodass Benutzer sich einloggen können.

### Acceptance Criteria:

#### Komponente
- Location: `frontend/src/app/features/public/login/`
- Files: `login.component.ts`, `login.component.html`, `login.component.css`
- Route: `/login`

#### UI-Struktur
Login-Formular mit Angular Material:
- `mat-card` Container
- Titel: "Login"
- E-Mail Input (`mat-form-field`, type="email")
- Passwort Input (`mat-form-field`, type="password")
- "Passwort anzeigen" Toggle (mat-icon-button mit eye icon)
- Submit Button: "Anmelden"
- Link: "Noch kein Konto? Jetzt registrieren" → navigiert zu `/register`

#### Frontend-Validierung (UX-only)
- E-Mail: required, Validators.email
- Passwort: required

#### API-Integration
- Bei Submit: Call `AuthService.login(email, password)`
- AuthService ruft `POST /api/auth/login` auf
- Bei Erfolg (200):
  - Token im LocalStorage speichern
  - Parse `user.role` aus Response
  - **Routing basierend auf Rolle**:
    - Wenn `role === 'customer'`: Navigiere zu `/customer/browse` (neue Route!)
    - Wenn `role === 'restaurant_owner'`: Navigiere zu `/restaurant/dashboard`
- Bei Fehler (401):
  - Zeige Fehlermeldung: "E-Mail oder Passwort falsch"
  - Rot unterstreiche beide Felder
- Bei Fehler (429):
  - Zeige: "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut."

#### UX
- Submit-Button disabled während API-Call (zeige mat-spinner)
- Fehlermeldung wird oberhalb des Formulars angezeigt (mat-error oder mat-card mit error-Styling)
- Nach 3 Sekunden Fehlermeldung ausblenden

---

## User Story 7: Restaurant Browse View für eingeloggte Kunden

Als **Frontend-Entwickler** möchte ich eine Restaurant-Browsing-Ansicht für eingeloggte Kunden erstellen, die der Landing Page ähnelt, aber Zusatzfunktionen für eingeloggte User bietet.

### Acceptance Criteria:

#### Komponente
- Location: `frontend/src/app/features/customer/browse/`
- Files: `browse.component.ts`, `browse.component.html`, `browse.component.css`
- Route: `/customer/browse`
- **Wichtig**: Diese Route ist geschützt via AuthGuard + RoleGuard (nur für role="customer")

#### UI-Struktur
Die Ansicht ist **sehr ähnlich zur Landing Page**, aber mit folgenden Unterschieden:

1. **Navigation/Header**:
   - Zeigt eingeloggten User-Namen: "Hallo, Max!"
   - Logout-Button (Material icon-button mit logout icon)
   - Link zu "Mein Profil" (wird später implementiert)

2. **Restaurant-Liste**:
   - Alle offenen Restaurants werden angezeigt (API-Call zu `/api/restaurants` - wird in späterem Feature implementiert)
   - Jedes Restaurant als `mat-card`:
     - Restaurant-Name
     - Kategorien (als Chips)
     - Vorschaubild (placeholder falls nicht vorhanden)
     - Bewertung (Sterne) - Placeholder: "Noch keine Bewertungen"
     - Geschätzte Lieferzeit - Placeholder: "30-40 Min"
     - Click auf Card öffnet Restaurant-Details (wird später implementiert)

3. **Filter-Leiste** (Placeholder für später):
   - Suche nach Restaurant-Name
   - Filter nach Kategorie
   - Sortierung (Bewertung, Lieferzeit)
   - **Implementierung in späterer Iteration**

#### API-Integration (Placeholder)
- Component lädt beim `ngOnInit()` Restaurants via `RestaurantService.getAllOpenRestaurants()`
- **Für diese Iteration**: Falls API noch nicht existiert, nutze Mock-Daten im Service:
  ```typescript
  // Placeholder Mock Data
  {
    id: '1',
    name: 'Bella Italia',
    cuisineTypes: ['italienisch', 'pizza'],
    averageRating: null,
    estimatedDeliveryTime: 35,
    isOpen: true,
    imageUrl: null
  }
  ```
- Zeige Loading-Spinner während Daten laden
- Zeige "Keine Restaurants gefunden" wenn Liste leer

#### Unterschied zur Landing Page (public)
- **Landing Page** (`/`): Für nicht-eingeloggte User, zeigt Restaurants, aber Click führt zu Login-Aufforderung
- **Browse View** (`/customer/browse`): Für eingeloggte Kunden, ermöglicht Interaktion mit Restaurants (in späteren Features)

#### UX Details
- Logout-Button:
  - Zeigt Bestätigungs-Dialog (mat-dialog): "Möchten Sie sich wirklich abmelden?"
  - Bei Bestätigung: `AuthService.logout()` → Token löschen → Navigate zu `/`

- Responsive:
  - Restaurants in Grid-Layout: 1 Spalte (Mobile), 2 Spalten (Tablet), 3 Spalten (Desktop)
  - Nutze CSS Grid oder Angular Flex Layout

---

## User Story 8: Auth Service - Token Management

Als **Frontend-Entwickler** möchte ich den AuthService um vollständige Login-, Registrierungs- und Token-Management-Funktionen erweitern.

### Acceptance Criteria:

#### File
- `frontend/src/app/core/services/auth.service.ts`

#### Methoden

**registerCustomer(customerData: CustomerRegistrationDto): Observable<AuthResponse>**
- POST zu `/api/auth/register/customer`
- Body: `customerData`
- Bei Erfolg: Token speichern + return Response
- Fehlerbehandlung via ErrorInterceptor

**registerRestaurantOwner(ownerData: RestaurantOwnerRegistrationDto): Observable<AuthResponse>**
- POST zu `/api/auth/register/restaurant-owner`
- Body: `ownerData`
- Bei Erfolg: Token speichern + return Response

**login(email: string, password: string): Observable<AuthResponse>**
- POST zu `/api/auth/login`
- Body: `{ email, password }`
- Bei Erfolg: Token speichern + return Response

**logout(): void**
- Löscht Token aus LocalStorage
- Optional: Call zu `/api/auth/logout` (wenn Refresh Tokens implementiert werden)
- Navigiert zu `/`

**getToken(): string | null**
- Liest Token aus LocalStorage

**getCurrentUser(): User | null**
- Dekodiert JWT Token und gibt User-Info zurück (id, email, role, etc.)
- Nutzt z.B. `jwt-decode` library
- Returns null wenn kein Token oder Token invalid

**isAuthenticated(): boolean**
- Prüft ob gültiger Token existiert
- Prüft ob Token noch nicht abgelaufen (via `exp` Claim)

**hasRole(role: 'customer' | 'restaurant_owner'): boolean**
- Prüft ob aktueller User die angegebene Rolle hat

#### LocalStorage
- Token wird gespeichert unter Key: `'auth_token'`
- Bei Logout wird Key gelöscht

#### TypeScript Interfaces
Erstelle/Erweitere `frontend/src/app/core/models/auth.models.ts`:

```typescript
export interface CustomerRegistrationDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  email: string;
  password: string;
  deliveryAddress: Address;
}

export interface RestaurantOwnerRegistrationDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  restaurant: RestaurantDto;
}

export interface RestaurantDto {
  name: string;
  address: Address;
  cuisineTypes: string[];
  contactInfo: ContactInfo;
  openingHours: OpeningHour[];
}

export interface Address {
  street: string;
  houseNumber: string;
  staircase?: string;
  door?: string;
  postalCode: string;
  city: string;
}

export interface ContactInfo {
  phone: string;
  email?: string;
}

export interface OpeningHour {
  dayOfWeek: number; // 0-6
  openTime?: string; // HH:MM
  closeTime?: string; // HH:MM
  isClosed: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'restaurant_owner';
  firstName: string;
  lastName: string;
  restaurantId?: string; // only for restaurant_owner
  restaurantName?: string; // only for restaurant_owner
}
```

---

## User Story 9: Route Guards - Authorization

Als **Frontend-Entwickler** möchte ich die RoleGuard erweitern, sodass sie Customer- und Restaurant-Routen korrekt schützt.

### Acceptance Criteria:

#### File
- `frontend/src/app/core/guards/role.guard.ts`

#### Implementierung
Die RoleGuard prüft:
1. User ist authentifiziert (via AuthService)
2. User hat die erforderliche Rolle für die Route

**Routing-Konfiguration** in `app.routes.ts`:
```typescript
{
  path: 'customer',
  canActivate: [AuthGuard, RoleGuard],
  data: { requiredRole: 'customer' },
  children: [
    { path: 'browse', component: BrowseComponent },
    { path: 'dashboard', redirectTo: 'browse' }
  ]
},
{
  path: 'restaurant',
  canActivate: [AuthGuard, RoleGuard],
  data: { requiredRole: 'restaurant_owner' },
  children: [
    { path: 'dashboard', component: RestaurantDashboardComponent }
  ]
}
```

**RoleGuard Logik**:
- Liest `requiredRole` aus `route.data`
- Ruft `AuthService.getCurrentUser()` auf
- Wenn User-Rolle nicht passt: Navigate zu `/forbidden`
- Wenn User nicht authentifiziert: Navigate zu `/login` (AuthGuard sollte das aber schon abfangen)

#### Forbidden Component
- Bereits vorhanden unter `frontend/src/app/features/public/forbidden/`
- Zeigt Meldung: "Zugriff verweigert. Sie haben keine Berechtigung für diese Seite."
- Button: "Zurück zur Startseite" → Navigate zu `/`

---

## User Story 10: Error Interceptor - Validation Error Handling

Als **Frontend-Entwickler** möchte ich den ErrorInterceptor erweitern, sodass 422 Validierungsfehler vom Backend korrekt behandelt werden.

### Acceptance Criteria:

#### File
- `frontend/src/app/core/interceptors/error.interceptor.ts`

#### Implementierung
Der ErrorInterceptor fängt HTTP-Fehler ab:

**HTTP 422 Unprocessable Entity**:
- Parse `error.details[]` array
- Return ein strukturiertes Error-Objekt:
  ```typescript
  {
    status: 422,
    validationErrors: [
      { field: 'email', message: 'Email already in use' },
      { field: 'dateOfBirth', message: 'Must be at least 16 years old' }
    ]
  }
  ```
- Component kann diese Fehler verwenden um FormControls zu markieren:
  ```typescript
  error.validationErrors.forEach(err => {
    this.form.get(err.field)?.setErrors({ backend: err.message });
  });
  ```

**HTTP 401 Unauthorized**:
- Bei Login-Fehler: Pass through (Component handled)
- Bei anderen Requests: Token könnte abgelaufen sein
  - Optional: Versuche Refresh (wenn implementiert)
  - Sonst: Logout + Redirect zu `/login`

**HTTP 403 Forbidden**:
- Zeige Snackbar: "Zugriff verweigert"
- Navigate zu `/forbidden`

**HTTP 429 Too Many Requests**:
- Zeige Snackbar: "Zu viele Anfragen. Bitte versuchen Sie es später erneut."

**HTTP 500 Internal Server Error**:
- Zeige Snackbar: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut."

**Andere Fehler**:
- Generische Fehlermeldung

#### Dependencies
- Nutze `MatSnackBar` für Benachrichtigungen
- Import in ErrorInterceptor

---

## User Story 11: Database Schema Migration

Als **Backend-Entwickler** möchte ich eine Datenbank-Migration für User- und Restaurant-Tabellen erstellen.

### Acceptance Criteria:

#### File
- `backend/src/db/migrations/002_authentication_tables.sql`

#### SQL Schema

**Tabelle: customers**
```sql
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, -- UUID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL, -- YYYY-MM-DD
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    delivery_street TEXT NOT NULL,
    delivery_house_number TEXT NOT NULL,
    delivery_staircase TEXT,
    delivery_door TEXT,
    delivery_postal_code TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_email ON customers(email COLLATE NOCASE);
```

**Tabelle: restaurant_owners**
```sql
CREATE TABLE IF NOT EXISTS restaurant_owners (
    id TEXT PRIMARY KEY, -- UUID
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_restaurant_owners_email ON restaurant_owners(email COLLATE NOCASE);
```

**Tabelle: restaurants**
```sql
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY, -- UUID
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    street TEXT NOT NULL,
    house_number TEXT NOT NULL,
    staircase TEXT,
    door TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES restaurant_owners(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_restaurants_name_city ON restaurants(name COLLATE NOCASE, city COLLATE NOCASE);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
```

**Tabelle: restaurant_cuisine_types** (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS restaurant_cuisine_types (
    restaurant_id TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    PRIMARY KEY (restaurant_id, cuisine_type),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_cuisine_types_restaurant ON restaurant_cuisine_types(restaurant_id);
```

**Tabelle: restaurant_opening_hours**
```sql
CREATE TABLE IF NOT EXISTS restaurant_opening_hours (
    id TEXT PRIMARY KEY, -- UUID
    restaurant_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0-6
    open_time TEXT, -- HH:MM
    close_time TEXT, -- HH:MM
    is_closed INTEGER NOT NULL DEFAULT 0, -- SQLite boolean: 0=false, 1=true
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_opening_hours_restaurant ON restaurant_opening_hours(restaurant_id);
```

#### Migration Runner
- Die Migration wird automatisch beim Server-Start ausgeführt via `migration-runner.ts`
- Nutzt bestehende transaktionale Migration-Logik

---

## User Story 12: Testing & Quality Assurance

Als **QA-Tester** möchte ich alle Login- und Registrierungsfunktionen testen, um sicherzustellen, dass sie korrekt funktionieren.

### Acceptance Criteria:

#### Backend API Tests (Manuell oder automatisiert)

**Customer Registration**:
- ✅ Erfolgreiche Registrierung mit gültigen Daten → 201, Token erhalten
- ✅ Doppelte E-Mail → 422 mit "Email already in use"
- ✅ Ungültiges E-Mail-Format → 422
- ✅ Kunde unter 16 Jahre → 422 mit "Must be at least 16 years old"
- ✅ Passwort < 8 Zeichen → 422
- ✅ Vorname mit Zahlen → 422 mit "Invalid characters"
- ✅ PLZ nicht 4 Zahlen → 422
- ✅ Fehlende Required-Felder → 400 Bad Request

**Restaurant Owner Registration**:
- ✅ Erfolgreiche Registrierung mit gültigen Daten → 201, Token erhalten
- ✅ Restaurant-Name bereits in gleicher Stadt → 422 mit "Restaurant name already exists in this city"
- ✅ Restaurant-Name in anderer Stadt → 201 (sollte funktionieren)
- ✅ Ungültige Küchenkategorie → 422 mit "Invalid cuisine type"
- ✅ Öffnungszeiten: "Von" nach "Bis" → 422
- ✅ Owner unter 18 Jahre → 422
- ✅ Telefon-Format ungültig → 422

**Login**:
- ✅ Customer Login mit korrekten Daten → 200, Token, role="customer"
- ✅ Restaurant Owner Login mit korrekten Daten → 200, Token, role="restaurant_owner", restaurantId
- ✅ Falsches Passwort → 401 "Invalid credentials"
- ✅ Nicht existierende E-Mail → 401 "Invalid credentials"
- ✅ 6 Login-Versuche hintereinander → 429 Too Many Requests

**Security**:
- ✅ Passwörter in DB sind gehasht (nicht Klartext)
- ✅ JWT Token enthält korrekte Claims (sub, role, email, exp)
- ✅ Token ist nach Ablauf ungültig (protected routes returnen 401)

#### Frontend Tests

**Customer Registration Form**:
- ✅ Alle Felder werden validiert (required, format)
- ✅ Formular ist disabled bis alle Felder gültig
- ✅ Passwort-Bestätigung muss übereinstimmen
- ✅ Datepicker zeigt nur vergangene Daten
- ✅ Backend-Validierungsfehler (422) werden an Feldern angezeigt
- ✅ Nach erfolgreicher Registrierung: Redirect zu `/customer/browse`

**Restaurant Owner Registration Form**:
- ✅ Wechsel zwischen "Kunde" und "Restaurantbesitzer" zeigt richtige Felder
- ✅ Multi-Select für Kategorien funktioniert
- ✅ Öffnungszeiten: "Geschlossen" deaktiviert Zeitfelder
- ✅ "Alle übernehmen" Button kopiert Zeiten korrekt
- ✅ Nach erfolgreicher Registrierung: Redirect zu `/restaurant/dashboard`

**Login Form**:
- ✅ E-Mail und Passwort Validierung
- ✅ "Passwort anzeigen" Toggle funktioniert
- ✅ Bei 401: Fehlermeldung wird angezeigt
- ✅ Customer Login → Redirect zu `/customer/browse`
- ✅ Restaurant Owner Login → Redirect zu `/restaurant/dashboard`
- ✅ Link zu Registrierung funktioniert

**Browse View (Customer)**:
- ✅ Route ist nur für eingeloggte Customers zugänglich
- ✅ Restaurant Owner kann nicht auf `/customer/browse` zugreifen → `/forbidden`
- ✅ User-Name wird im Header angezeigt
- ✅ Logout-Button: Dialog → Token löschen → Redirect zu `/`

**Authorization**:
- ✅ AuthGuard: Nicht eingeloggte User werden zu `/login` umgeleitet
- ✅ RoleGuard: Customer kann nicht auf `/restaurant/*` zugreifen
- ✅ RoleGuard: Restaurant Owner kann nicht auf `/customer/*` zugreifen

#### Cross-Browser Testing
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (wenn möglich)

#### Responsive Testing
- ✅ Mobile (320px - 480px)
- ✅ Tablet (768px - 1024px)
- ✅ Desktop (1280px+)

---

## Technical Notes

### Dependencies
**Backend**:
- Bereits vorhanden: `argon2`, `jsonwebtoken`, `express`, `sqlite3`, `dotenv`
- Evtl. benötigt: `uuid` (für ID-Generierung)
- Evtl. benötigt: `express-rate-limit` (für Login Rate Limiting)

**Frontend**:
- Bereits vorhanden: `@angular/material`, `@angular/common/http`
- Neu: `jwt-decode` (für Token-Dekodierung)
- Installieren: `npm install jwt-decode --save`

### Environment Variables
`.env.example` erweitern:
```env
# Authentication
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_TO_SECURE_RANDOM_STRING
JWT_EXPIRATION=24h
CUSTOMER_MIN_AGE=16
RESTAURANT_OWNER_MIN_AGE=18

# Rate Limiting
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=900000
```

### Database Initialization
- Migration `002_authentication_tables.sql` wird beim Start automatisch ausgeführt
- Development: Nutze SQLite file `data/development.db`
- Testing: Nutze In-Memory DB oder separate Test-DB

### Development Order (Empfehlung)
1. Backend: Migration + Repositories (DB-Schema)
2. Backend: Password Service (falls nicht vollständig)
3. Backend: Business Logic (Registration Services, Login Service)
4. Backend: Controllers + Routes
5. Backend: Rate Limiting Middleware
6. Frontend: Models/Interfaces
7. Frontend: Auth Service erweitern
8. Frontend: Registration Component (Customer)
9. Frontend: Registration Component (Restaurant Owner)
10. Frontend: Login Component
11. Frontend: Browse Component (Customer)
12. Frontend: Route Guards
13. Frontend: Error Interceptor
14. Testing

### Known Limitations (für spätere Features)
- Restaurant-Liste in Browse View ist aktuell Placeholder/Mock
- Filter und Sortierung für Restaurants werden später implementiert
- Profil-Bearbeitung wird in späterem Feature implementiert
- Passwort-Reset / Forgot Password wird später implementiert
- E-Mail-Verifikation wird nicht implementiert
- Refresh Tokens sind optional (können später hinzugefügt werden)
