# Feature: Restaurant Profile Management

Als Restaurantbesitzer möchte ich mein Restaurant-Profil verwalten können, damit ich meine Geschäftsinformationen aktuell halten und meinen Kunden korrekte Informationen bereitstellen kann.

Dieses Feature ermöglicht es Restaurantbesitzern, ihre Restaurant-Stammdaten (Name, Kontaktinformationen, Öffnungszeiten) auf einer dedizierten Profilseite zu bearbeiten. Die Seite ist nur für eingeloggte Benutzer mit der Rolle "Restaurantbesitzer" zugänglich.

## Acceptance Criteria:
- Nur eingeloggte Restaurantbesitzer können auf die Restaurant-Profil-Seite zugreifen
- Restaurantbesitzer sehen ihre aktuellen Restaurant-Daten beim Laden der Seite
- Restaurantname kann geändert werden (unter Einhaltung der Validierungsregeln)
- Kontaktinformationen können geändert werden
- Öffnungszeiten können angepasst werden
- Restaurantadresse wird angezeigt, kann aber in dieser Iteration nicht geändert werden
- Kategorien/Küchenarten werden angezeigt, können aber in dieser Iteration nicht geändert werden (statische Konfiguration)
- Alle Änderungen werden vollständig auf dem Backend validiert
- Bei erfolgreicher Speicherung erhält der Benutzer eine Bestätigungsmeldung
- Bei Validierungsfehlern werden klare Fehlermeldungen (HTTP 422) angezeigt
- Änderungen werden sofort in der Datenbank persistiert

---

## User Story: Restaurant-Profil-Seite aufrufen

**Als** Restaurantbesitzer  
**möchte ich** auf eine dedizierte Seite zur Verwaltung meines Restaurant-Profils zugreifen können  
**damit** ich meine Geschäftsinformationen zentral einsehen und bearbeiten kann.

### Acceptance Criteria:
- Es existiert eine Route `/restaurant/profile` (oder ähnlich) im Restaurant-Frontend
- Die Route ist nur für eingeloggte Benutzer mit Rolle "Restaurantbesitzer" zugänglich
- Nicht authentifizierte Benutzer werden zur Login-Seite weitergeleitet
- Benutzer mit Rolle "Kunde" erhalten eine Fehlermeldung oder werden abgewiesen
- Die Seite lädt automatisch die aktuellen Restaurant-Daten vom Backend
- Während des Ladens wird ein Lade-Indikator angezeigt
- Bei Ladefehlern wird eine aussagekräftige Fehlermeldung angezeigt
- Die Navigation zur Profilseite ist aus dem Restaurant-Dashboard heraus klar erkennbar (z.B. im Menü/Header)

### Backend-Anforderungen:
- Endpunkt: `GET /api/restaurants/profile` oder `GET /api/restaurants/:id`
- JWT-basierte Authentifizierung erforderlich
- Nur Restaurantbesitzer dürfen auf ihre eigenen Profildaten zugreifen
- Response enthält alle relevanten Restaurant-Daten:
  - id
  - name
  - address (Straße, Hausnummer, PLZ, Ort - jeweils separate Felder)
  - categories (Array von Kategorie-IDs oder -Namen)
  - contactInfo (E-Mail, Telefon)
  - openingHours (strukturiertes Format)
  - restaurantOwnerId (zur Verknüpfung)

### Frontend-Anforderungen:
- Angular-Komponente: `RestaurantProfileComponent`
- Angular-Service: `RestaurantProfileService` für API-Aufrufe
- Route Guard prüft Authentifizierung und Rolle
- Formular-basierte Anzeige der Daten (zunächst schreibgeschützt, siehe folgende Stories)
- Verwendung von Angular Material Komponenten für konsistentes UI

---

## User Story: Restaurantname ändern

**Als** Restaurantbesitzer  
**möchte ich** den Namen meines Restaurants ändern können  
**damit** ich bei Umbenennung oder Rebranding meine Informationen aktuell halten kann.

### Acceptance Criteria:
- Der Restaurantname wird in einem editierbaren Textfeld angezeigt
- Der Name kann direkt im Formular geändert werden
- Frontend-Validierung (UX):
  - Pflichtfeld (mindestens 1 Zeichen)
  - Maximal 100 Zeichen
  - Nur erlaubte Zeichen: Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich, Leerzeichen
  - Sofortiges visuelles Feedback bei ungültiger Eingabe
- Backend-Validierung (authoritative):
  - Pflichtfeld
  - Mindestens 1 Zeichen, maximal 100 Zeichen
  - Nur erlaubte Zeichen: Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich, Leerzeichen
  - Name muss im selben Ort eindeutig sein (Prüfung gegen bestehende Restaurants mit gleicher Postleitzahl/Ort)
  - Bei Verletzung der Eindeutigkeit: HTTP 422 mit Fehlermeldung "Restaurantname existiert bereits in diesem Ort"
- Bei erfolgreicher Änderung wird eine Bestätigungsmeldung angezeigt
- Bei Backend-Validierungsfehler (422) wird die Fehlermeldung benutzerfreundlich angezeigt
- Speichern erfolgt über einen "Speichern"-Button (nicht automatisch bei jedem Tastendruck)

### Backend-Anforderungen:
- Endpunkt: `PATCH /api/restaurants/profile` oder `PUT /api/restaurants/:id`
- JWT-Authentifizierung erforderlich
- Nur der Eigentümer des Restaurants darf den Namen ändern
- Validierung:
  - Required, min 1 Zeichen, max 100 Zeichen
  - Regex für erlaubte Zeichen: `^[a-zA-Z0-9\.\-\/\s]+$`
  - Eindeutigkeit prüfen: SELECT count(*) FROM restaurants WHERE name = ? AND city = ? AND id != ?
- Bei Validierungsfehler: HTTP 422 mit detaillierter Fehlermeldung
- Bei Erfolg: HTTP 200 mit aktualisiertem Restaurant-Objekt
- Business Logic gehört in `RestaurantProfileService` oder ähnliche Business-Klasse
- Repository-Pattern für Datenbankzugriff

### Frontend-Anforderungen:
- Angular Reactive Forms für Formular-Validierung
- Validators: required, maxLength(100), pattern für erlaubte Zeichen
- Visuelles Feedback durch Angular Material (mat-error)
- Service-Methode: `updateRestaurantName(restaurantId, newName)`
- HTTP Interceptor fügt JWT automatisch hinzu
- 422-Fehler werden abgefangen und benutzerfreundlich angezeigt

---

## User Story: Kontaktinformationen ändern

**Als** Restaurantbesitzer  
**möchte ich** die Kontaktinformationen meines Restaurants ändern können  
**damit** Kunden und die Plattform mich über aktuelle Kommunikationswege erreichen können.

### Acceptance Criteria:
- Kontaktinformationen umfassen:
  - Telefonnummer (optional)
  - Kontakt-E-Mail-Adresse (Pflichtfeld, kann von der Login-E-Mail des Besitzers abweichen)
- Beide Felder sind editierbar
- Frontend-Validierung (UX):
  - E-Mail: Pflichtfeld, gültige E-Mail-Format-Validierung
  - Telefon: Optional, wenn angegeben dann Format-Validierung (z.B. nur Zahlen, +, -, Leerzeichen, Klammern)
  - Maximal 50 Zeichen für E-Mail
  - Maximal 20 Zeichen für Telefon
- Backend-Validierung (authoritative):
  - E-Mail: Required, gültiges E-Mail-Format, max 50 Zeichen
  - Telefon: Optional, wenn vorhanden max 20 Zeichen, erlaubte Zeichen: Zahlen, +, -, Leerzeichen, Klammern
- Änderungen werden über den "Speichern"-Button persistiert
- Bei erfolgreicher Änderung wird eine Bestätigungsmeldung angezeigt
- Bei Validierungsfehler werden Fehlermeldungen pro Feld angezeigt

### Backend-Anforderungen:
- Endpunkt: `PATCH /api/restaurants/profile` (gleicher Endpunkt wie Restaurantname)
- Request Body enthält Felder: `contactEmail`, `contactPhone`
- Validierung:
  - contactEmail: required, E-Mail-Format (z.B. via Regex oder Validator-Library), max 50 Zeichen
  - contactPhone: optional, Regex: `^[\d\+\-\s\(\)]*$`, max 20 Zeichen
- Bei Validierungsfehler: HTTP 422 mit feldspezifischen Fehlermeldungen
- Bei Erfolg: HTTP 200 mit aktualisiertem Restaurant-Objekt
- Business Logic in Business-Klasse, nicht im Controller
- Repository-Pattern für Persistierung

### Frontend-Anforderungen:
- Reactive Forms mit Validators:
  - contactEmail: [Validators.required, Validators.email, Validators.maxLength(50)]
  - contactPhone: [Validators.pattern(/^[\d\+\-\s\(\)]*$/), Validators.maxLength(20)]
- mat-form-field mit mat-error für Fehlermeldungen
- Service-Methode: `updateContactInfo(restaurantId, contactEmail, contactPhone)`
- Backend-Fehler (422) werden abgefangen und angezeigt

---

## User Story: Öffnungszeiten anpassen

**Als** Restaurantbesitzer  
**möchte ich** die Öffnungszeiten meines Restaurants ändern können  
**damit** Kunden wissen, wann mein Restaurant geöffnet ist und Bestellungen entgegennehmen kann.

### Acceptance Criteria:
- Öffnungszeiten können für jeden Wochentag separat definiert werden
- Für jeden Tag kann angegeben werden:
  - "Geschlossen" (Restaurant ist an diesem Tag nicht geöffnet)
  - Eine oder mehrere Zeitfenster (z.B. 11:00-14:00 und 17:00-22:00 für Mittagspause)
- Zeitformat: HH:MM (24-Stunden-Format)
- Frontend-Validierung (UX):
  - Startzeit muss vor Endzeit liegen
  - Zeitfenster dürfen sich nicht überschneiden
  - Gültiges Zeitformat (HH:MM)
  - Visuelles Feedback bei ungültigen Eingaben
- Backend-Validierung (authoritative):
  - Alle Frontend-Validierungen werden auf dem Backend wiederholt
  - Zeitformat-Prüfung (HH:MM)
  - Logik-Prüfung: Start < End
  - Überschneidungs-Prüfung für denselben Tag
- UI zeigt alle 7 Wochentage (Montag bis Sonntag)
- Für jeden Tag kann ein "Geschlossen"-Toggle aktiviert werden
- Wenn "Geschlossen" aktiviert ist, sind die Zeitfelder deaktiviert/ausgeblendet
- Möglichkeit, mehrere Zeitfenster pro Tag hinzuzufügen/zu entfernen
- Änderungen werden über den "Speichern"-Button persistiert
- Bei erfolgreicher Änderung wird eine Bestätigungsmeldung angezeigt
- Bei Validierungsfehler werden Fehlermeldungen angezeigt

### Backend-Anforderungen:
- Endpunkt: `PATCH /api/restaurants/profile` (gleicher Endpunkt)
- Request Body enthält: `openingHours` als strukturiertes Objekt/Array
- Beispiel-Datenformat:
  ```json
  {
    "openingHours": [
      {
        "dayOfWeek": "monday",
        "isClosed": false,
        "timeSlots": [
          { "start": "11:00", "end": "14:00" },
          { "start": "17:00", "end": "22:00" }
        ]
      },
      {
        "dayOfWeek": "tuesday",
        "isClosed": false,
        "timeSlots": [
          { "start": "11:00", "end": "22:00" }
        ]
      },
      {
        "dayOfWeek": "sunday",
        "isClosed": true,
        "timeSlots": []
      }
      // ... weitere Tage
    ]
  }
  ```
- Validierung:
  - Alle 7 Wochentage müssen vorhanden sein
  - dayOfWeek muss gültiger Wert sein (monday, tuesday, wednesday, thursday, friday, saturday, sunday)
  - Zeitformat: HH:MM (Regex: `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`)
  - start < end für jedes timeSlot
  - Keine Überschneidungen von timeSlots am selben Tag
  - Wenn isClosed = true, dann timeSlots muss leer sein
- Bei Validierungsfehler: HTTP 422 mit detaillierter Fehlermeldung (welcher Tag, welches Zeitfenster)
- Bei Erfolg: HTTP 200 mit aktualisiertem Restaurant-Objekt
- Business Logic in Business-Klasse
- Öffnungszeiten werden als JSON oder in separater Tabelle gespeichert (Repository-Entscheidung)

### Frontend-Anforderungen:
- Komplexes Reactive Form mit FormArray für Wochentage und verschachtelte FormArrays für Zeitfenster
- UI-Komponente für einen Wochentag (wiederverwendbar):
  - Toggle für "Geschlossen"
  - Liste von Zeitfenstern (add/remove buttons)
  - Zeitpicker oder Input-Felder für Start/End
- Custom Validators:
  - timeFormatValidator
  - startBeforeEndValidator
  - noOverlapValidator
- Angular Material Komponenten: mat-slide-toggle, mat-form-field mit mat-input
- Service-Methode: `updateOpeningHours(restaurantId, openingHours)`
- Backend-Fehler werden abgefangen und benutzerfreundlich angezeigt (z.B. "Montag: Startzeit muss vor Endzeit liegen")

---

## User Story: Restaurantadresse anzeigen (read-only)

**Als** Restaurantbesitzer  
**möchte ich** meine Restaurantadresse auf der Profilseite sehen  
**damit** ich weiß, welche Adresse im System hinterlegt ist.

### Acceptance Criteria:
- Die vollständige Restaurantadresse wird auf der Profilseite angezeigt:
  - Straße und Hausnummer (inkl. Stiege/Tür falls vorhanden)
  - Postleitzahl
  - Ort
- Die Adresse wird in schreibgeschützten Feldern oder als reiner Text angezeigt
- Ein Hinweis informiert den Benutzer, dass die Adresse in dieser Version nicht geändert werden kann
- Die Adresse wird beim Laden der Seite zusammen mit den anderen Profildaten vom Backend abgerufen

### Backend-Anforderungen:
- Die Adresse wird im Response von `GET /api/restaurants/profile` inkludiert
- Adresse besteht aus separaten Feldern:
  - street (Straße + Hausnummer, ggf. Stiege/Tür)
  - postalCode
  - city
- Keine Endpunkte zum Ändern der Adresse in dieser Iteration

### Frontend-Anforderungen:
- Adressfelder werden als disabled Form Controls oder als reiner Text angezeigt
- Optionaler Info-Text: "Die Adresse kann derzeit nicht geändert werden. Kontaktieren Sie den Support bei Bedarf." (oder ähnlich)
- Keine Service-Methoden zum Update der Adresse

---

## User Story: Kategorien/Küchenarten anzeigen (read-only)

**Als** Restaurantbesitzer  
**möchte ich** die meinem Restaurant zugeordneten Kategorien/Küchenarten sehen  
**damit** ich weiß, unter welchen Kategorien mein Restaurant von Kunden gefunden wird.

### Acceptance Criteria:
- Die zugeordneten Kategorien/Küchenarten werden auf der Profilseite angezeigt
- Kategorien werden als Chips, Tags oder Liste dargestellt (read-only)
- Die Kategorien stammen aus der statischen Konfiguration des Backends
- Ein Hinweis informiert, dass Kategorien statisch sind und nicht in der App geändert werden können
- Kategorien werden beim Laden der Seite zusammen mit den anderen Profildaten vom Backend abgerufen

### Backend-Anforderungen:
- Kategorien werden im Response von `GET /api/restaurants/profile` inkludiert
- Kategorien sind als Array von Strings oder Objekten (mit id und name) zurückgegeben
- Kategorien stammen aus der statischen Konfiguration (Config-File)
- Keine Endpunkte zum Ändern der Kategorien in dieser Iteration

### Frontend-Anforderungen:
- Kategorien werden als mat-chips oder als einfache Liste angezeigt (read-only)
- Optionaler Info-Text: "Kategorien sind statisch konfiguriert und können nicht in der App geändert werden."
- Keine Interaktion möglich (keine add/remove buttons)

---

## User Story: Validierungsfehler behandeln

**Als** Restaurantbesitzer  
**möchte ich** klare und verständliche Fehlermeldungen erhalten, wenn meine Eingaben ungültig sind  
**damit** ich weiß, was ich korrigieren muss und meine Daten erfolgreich speichern kann.

### Acceptance Criteria:
- Frontend zeigt sofortige Validierungsfehler für ungültige Eingaben (UX-Feedback)
- Frontend-Fehlermeldungen sind auf Deutsch und benutzerfreundlich formuliert
- Beim Absenden werden alle Eingaben nochmals auf dem Backend validiert
- Backend-Validierungsfehler werden als HTTP 422 zurückgegeben
- HTTP 422 Response enthält strukturierte Fehlermeldungen:
  ```json
  {
    "errors": [
      {
        "field": "name",
        "message": "Restaurantname existiert bereits in diesem Ort"
      },
      {
        "field": "contactEmail",
        "message": "Ungültige E-Mail-Adresse"
      }
    ]
  }
  ```
- Frontend zeigt Backend-Validierungsfehler bei den entsprechenden Formularfeldern an
- Allgemeine Fehler (nicht feldspezifisch) werden in einer Fehler-Banner am oberen Rand der Seite angezeigt
- Speichern-Button ist disabled, solange Frontend-Validierung fehlschlägt
- Nach erfolgreicher Speicherung verschwinden alle Fehlermeldungen
- Netzwerkfehler (500, Timeout, etc.) werden mit generischer Fehlermeldung behandelt

### Backend-Anforderungen:
- Alle Validierungen aus den vorherigen User Stories müssen implementiert sein
- HTTP 422 bei Validierungsfehlern mit strukturiertem Error-Response
- Error-Response-Format sollte konsistent über die gesamte API sein
- Fehlermeldungen auf Deutsch (oder Englisch, aber konsistent)
- Keine technischen Details oder Stack Traces in Fehlermeldungen (Security)

### Frontend-Anforderungen:
- HTTP Interceptor fängt 422-Fehler ab
- Error-Handler-Service mappt Backend-Fehler auf Frontend-Formularfelder
- mat-error Komponenten zeigen sowohl Frontend- als auch Backend-Fehler an
- Generische Fehlerbehandlung für 500, 401, 403, 404, Netzwerkfehler
- Fehlermeldungen auf Deutsch
- User-friendly Formulierung (z.B. "Bitte geben Sie eine gültige E-Mail-Adresse ein" statt "Invalid email format")

---

## User Story: Änderungen speichern und Bestätigung erhalten

**Als** Restaurantbesitzer  
**möchte ich** eine klare Bestätigung erhalten, wenn meine Änderungen erfolgreich gespeichert wurden  
**damit** ich sicher sein kann, dass meine Daten aktualisiert wurden.

### Acceptance Criteria:
- Alle Änderungen (Name, Kontaktinfo, Öffnungszeiten) werden über einen zentralen "Speichern"-Button abgeschickt
- Während des Speichervorgangs wird ein Lade-Indikator angezeigt (z.B. Spinner im Button)
- Der Speichern-Button ist während des Speichervorgangs disabled
- Bei erfolgreichem Speichern:
  - Wird eine Erfolgs-Meldung angezeigt (z.B. grüner Snackbar/Toast: "Änderungen erfolgreich gespeichert")
  - Die Erfolgs-Meldung verschwindet nach 3-5 Sekunden automatisch
  - Das Formular wird mit den aktualisierten Daten vom Server neu befüllt (Bestätigung der Persistierung)
- Bei Fehler:
  - Wird eine Fehler-Meldung angezeigt (roter Snackbar/Toast oder Banner)
  - Fehlerdetails werden bei den entsprechenden Feldern angezeigt (siehe vorherige Story)
  - Der Benutzer kann Korrekturen vornehmen und erneut speichern
- Keine automatischen Speicherungen (nur explizit über Button-Klick)

### Backend-Anforderungen:
- `PATCH /api/restaurants/profile` akzeptiert alle änderbaren Felder gleichzeitig
- Bei Erfolg: HTTP 200 mit vollständigem, aktualisiertem Restaurant-Objekt
- Bei Fehler: HTTP 422 mit Fehlerdetails oder andere entsprechende Status Codes
- Transaktionale Speicherung (alles oder nichts, bei mehreren DB-Updates)

### Frontend-Anforderungen:
- Service-Methode: `updateRestaurantProfile(restaurantId, profileData)` sammelt alle Formular-Daten
- Observable-basierter Aufruf mit Loading-State-Management
- MatSnackBar für Erfolgs-/Fehlermeldungen
- Button disabled während isLoading === true
- Nach erfolgreicher Speicherung: Form wird mit Response-Daten aktualisiert (patchValue)

---

## Technical Notes:

### Datenbank-Schema:
- Tabelle: `restaurants`
- Relevante Felder für dieses Feature:
  - id (Primary Key)
  - name (VARCHAR, unique per city)
  - street (VARCHAR)
  - postalCode (VARCHAR)
  - city (VARCHAR)
  - contactEmail (VARCHAR)
  - contactPhone (VARCHAR, nullable)
  - categories (JSON oder Fremdschlüssel zu categories-Tabelle)
  - openingHours (JSON oder separate Tabelle opening_hours)
  - restaurantOwnerId (Foreign Key zu restaurant_owners)
  - updatedAt (TIMESTAMP)

### API-Endpunkte Übersicht:
- `GET /api/restaurants/profile` - Restaurant-Profil des eingeloggten Besitzers abrufen
  - Auth: JWT required, Rolle: Restaurantbesitzer
  - Response: Restaurant-Objekt mit allen Daten
  
- `PATCH /api/restaurants/profile` - Restaurant-Profil aktualisieren
  - Auth: JWT required, Rolle: Restaurantbesitzer
  - Request Body: { name?, contactEmail?, contactPhone?, openingHours? }
  - Response: Aktualisiertes Restaurant-Objekt (200) oder Validierungsfehler (422)

### Sicherheit:
- JWT-Middleware prüft Authentifizierung
- Business Logic prüft, dass Restaurantbesitzer nur sein eigenes Restaurant editieren kann
- Alle Validierungen müssen auf dem Backend durchgeführt werden (Frontend ist nur UX)
- Passwörter werden NICHT in diesem Feature behandelt (separate Feature/Story für Passwort-Änderung)

### Testing-Hinweise für Entwickler:
- Unit Tests für alle Validatoren (Frontend und Backend)
- Unit Tests für Business Logic (z.B. Eindeutigkeit des Namens, Zeitfenster-Überschneidungen)
- Integration Tests für API-Endpunkte (mit verschiedenen Validierungsszenarien)
- E2E-Test: Vollständiger Flow vom Laden bis zum Speichern
- Test mit ungültigen JWTs (Authentifizierung)
- Test mit Kunden-JWT (Authorization - sollte fehlschlagen)

### Out of Scope für diese Iteration:
- Änderung der Restaurantadresse (nur Anzeige)
- Änderung der Kategorien (statisch konfiguriert)
- Upload von Restaurant-Logo/Bildern
- Löschung des Restaurant-Accounts
- Passwort-Änderung des Restaurantbesitzers (separates Feature)
- Historie der Änderungen (Audit Log)
- Benachrichtigungen an Kunden bei Öffnungszeit-Änderungen
- Temporäre Schließungen oder Urlaubs-Modus
- Mehrere Standorte pro Restaurantbesitzer
