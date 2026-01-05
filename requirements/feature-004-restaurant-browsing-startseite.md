# Feature: Restaurant-Browsing auf der Startseite
Die Startseite der Food-Delivery-Plattform ermöglicht es Kunden (auch nicht angemeldeten Besuchern), alle verfügbaren Restaurants zu durchsuchen, nach verschiedenen Kriterien zu filtern und auf Restaurantdetails zuzugreifen. Die Seite bietet außerdem Navigationsmöglichkeiten zur Login- und Registrierungsseite.

## Acceptance Criteria:
- Die Startseite zeigt alle Restaurants an, die im System registriert sind
- Nur aktuell geöffnete Restaurants werden standardmäßig angezeigt (basierend auf Öffnungszeiten)
- Besucher können Restaurants nach Küche, Bewertung und Lieferzeit filtern
- Klick auf ein Restaurant führt zur Detailansicht des Restaurants
- Navigation zu Login und Registrierung ist von der Startseite aus zugänglich
- Die Seite ist für nicht angemeldete Besucher zugänglich
- Die Seite ist responsive und funktioniert auf Desktop und mobilen Geräten

---

## User Story: Restaurant-Liste anzeigen
Als **Besucher oder Kunde** möchte ich auf der Startseite alle verfügbaren Restaurants sehen, damit ich eine Übersicht über meine Bestellmöglichkeiten erhalte.

### Acceptance Criteria:
- Die Startseite zeigt standardmäßig alle Restaurants an, die aktuell geöffnet sind
- Für jedes Restaurant werden folgende Informationen in der Vorschau angezeigt:
  - Restaurantname
  - Küchenkategorien (z.B. "asiatisch, italienisch")
  - Durchschnittliche Bewertung (als Sterneanzeige)
  - Geschätzte Lieferzeit (z.B. "30-40 Min.")
  - Restaurantadresse (mindestens Ort)
  - Optional: Restaurant-Logo oder Placeholder-Bild
- Restaurants sind als Kacheln/Karten dargestellt (Grid-Layout)
- Die Liste ist scrollbar, wenn mehr Restaurants vorhanden sind als auf dem Bildschirm passen
- Wenn keine Restaurants verfügbar sind, wird eine entsprechende Meldung angezeigt ("Keine Restaurants verfügbar")
- Die Öffnungszeiten werden serverseitig geprüft, um zu bestimmen, ob ein Restaurant aktuell geöffnet ist
- Geschlossene Restaurants werden ausgegraut oder mit einem "Geschlossen"-Badge markiert (aber trotzdem angezeigt)

### Technische Details:
- **Backend-Endpoint**: `GET /api/restaurants`
  - Query-Parameter: keine (für die Basis-Liste)
  - Response: Array von Restaurant-Objekten mit:
    - `id` (number)
    - `name` (string)
    - `categories` (string[])
    - `address` (object mit: street, postalCode, city)
    - `averageRating` (number, 0-5)
    - `estimatedDeliveryTime` (number in Minuten)
    - `isOpen` (boolean)
    - `logoUrl` (string, optional)
- **Frontend-Service**: `RestaurantService.getRestaurants()`
- **Frontend-Component**: `RestaurantListComponent`
- Die Berechnung der geschätzten Lieferzeit erfolgt serverseitig (Basis: 10 Minuten pauschal für diese Iteration)
- Die Durchschnittsbewertung wird aus allen Restaurant-Bewertungen berechnet (wenn keine Bewertungen vorhanden sind: keine Anzeige oder "Neu")

---

## User Story: Nach Küchenkategorie filtern
Als **Besucher oder Kunde** möchte ich Restaurants nach Küchenart filtern können, damit ich gezielt nach meinen bevorzugten Küchen suchen kann.

### Acceptance Criteria:
- Oberhalb der Restaurant-Liste gibt es einen Filter-Bereich
- Der Küchen-Filter zeigt alle verfügbaren Kategorien als auswählbare Optionen (z.B. Dropdown, Chips oder Checkboxen)
- Verfügbare Kategorien werden aus der Server-Konfiguration geladen (siehe `Anforderung.md`: "Kategorie: statische Information, hinterlegt im Server-Config-File")
- Mehrere Kategorien können gleichzeitig ausgewählt werden (OR-Verknüpfung: Restaurant muss mindestens eine der gewählten Kategorien haben)
- Nach Auswahl einer oder mehrerer Kategorien werden nur Restaurants angezeigt, die diese Kategorien anbieten
- Die Filterung erfolgt clientseitig basierend auf den geladenen Daten (für bessere Performance)
- Ein "Filter zurücksetzen" oder "X"-Button ermöglicht das Entfernen aller Filter
- Die Anzahl der gefilterten Restaurants wird angezeigt (z.B. "42 Restaurants gefunden")
- Wenn keine Restaurants die Filterkriterien erfüllen, wird eine Meldung angezeigt ("Keine Restaurants gefunden. Bitte Filter anpassen.")

### Technische Details:
- **Backend-Endpoint für Kategorien**: `GET /api/categories`
  - Response: Array von Strings (z.B. `["italienisch", "asiatisch", "indisch", "amerikanisch", "vegetarisch"]`)
  - Diese Kategorien stammen aus der Server-Konfiguration und sind nicht editierbar
- **Frontend-Service**: `CategoryService.getCategories()`
- **Frontend-Component**: `RestaurantFilterComponent`
- Filter-State wird im Frontend-Service oder Component-State gehalten
- Angular Material Components für UI (z.B. `mat-chip-listbox` oder `mat-select` mit `multiple`)

---

## User Story: Nach Bewertung filtern
Als **Besucher oder Kunde** möchte ich Restaurants nach ihrer Bewertung filtern können, damit ich nur gut bewertete Restaurants sehe.

### Acceptance Criteria:
- Im Filter-Bereich gibt es eine Option zur Filterung nach Mindestbewertung
- Die Bewertungsfilter-Optionen sind:
  - Mindestens 4 Sterne
  - Mindestens 3 Sterne
  - Mindestens 2 Sterne
  - Alle anzeigen (Standard)
- Nur eine Bewertungsoption kann gleichzeitig aktiv sein
- Nach Auswahl werden nur Restaurants angezeigt, deren Durchschnittsbewertung >= der gewählten Mindestbewertung ist
- Restaurants ohne Bewertungen werden nicht angezeigt, wenn ein Bewertungsfilter aktiv ist
- Die Filterung erfolgt clientseitig
- Der Bewertungsfilter kann mit dem Küchenfilter kombiniert werden (AND-Verknüpfung)

### Technische Details:
- **Frontend-Component**: `RestaurantFilterComponent` (erweitert)
- UI: Angular Material Radio Buttons oder Chip-Selection
- Filter-Logik: `averageRating >= selectedMinRating`
- Restaurants mit `averageRating === null` oder `averageRating === 0` werden bei aktivem Bewertungsfilter ausgeblendet

---

## User Story: Nach Lieferzeit filtern
Als **Besucher oder Kunde** möchte ich Restaurants nach geschätzter Lieferzeit filtern können, damit ich schnell beliefert werde.

### Acceptance Criteria:
- Im Filter-Bereich gibt es eine Option zur Filterung nach maximaler Lieferzeit
- Die Lieferzeit-Filter-Optionen sind:
  - Bis 30 Minuten
  - Bis 45 Minuten
  - Bis 60 Minuten
  - Alle anzeigen (Standard)
- Nur eine Lieferzeit-Option kann gleichzeitig aktiv sein
- Nach Auswahl werden nur Restaurants angezeigt, deren geschätzte Lieferzeit <= der gewählten Maximalzeit ist
- Die Filterung erfolgt clientseitig
- Der Lieferzeit-Filter kann mit den anderen Filtern kombiniert werden (AND-Verknüpfung)

### Technische Details:
- **Frontend-Component**: `RestaurantFilterComponent` (erweitert)
- UI: Angular Material Radio Buttons oder Dropdown
- Filter-Logik: `estimatedDeliveryTime <= selectedMaxDeliveryTime`
- Die Lieferzeit wird vom Backend in Minuten geliefert

---

## User Story: Zur Restaurantdetailseite navigieren
Als **Besucher oder Kunde** möchte ich auf ein Restaurant klicken können, um dessen Detailseite mit vollständigem Menü anzuzeigen.

### Acceptance Criteria:
- Jede Restaurantkarte in der Liste ist klickbar
- Ein Klick auf eine Restaurantkarte navigiert zur Detailseite des Restaurants
- Die URL der Detailseite ist: `/restaurant/{restaurantId}` (z.B. `/restaurant/42`)
- Die Navigation funktioniert sowohl auf Desktop als auch mobil
- Hover-Effekt auf der Karte signalisiert, dass sie klickbar ist (Desktop)
- Die Restaurantdetailseite wird in einer späteren Iteration implementiert (Feature 005), für diese Iteration reicht die Navigation und eine Placeholder-Seite

### Technische Details:
- **Angular Routing**: Route `/restaurant/:id` wird definiert
- **Frontend-Component**: `RestaurantListComponent` verwendet `routerLink` oder `router.navigate()`
- Für diese Iteration: Placeholder-Component `RestaurantDetailComponent` erstellen, die nur die Restaurant-ID anzeigt
- Cursor: pointer auf Restaurantkarten

---

## User Story: Zur Login-Seite navigieren
Als **Besucher** möchte ich von der Startseite zur Login-Seite navigieren können, damit ich mich anmelden kann.

### Acceptance Criteria:
- In der Hauptnavigation (Header) gibt es einen "Anmelden" oder "Login"-Button
- Ein Klick auf den Button navigiert zur Login-Seite
- Die URL der Login-Seite ist: `/login`
- Der Button ist deutlich sichtbar (z.B. rechts oben im Header)
- Wenn ein Benutzer bereits eingeloggt ist, wird stattdessen ein Benutzermenü oder Profil-Icon angezeigt

### Technische Details:
- **Angular Routing**: Route `/login` existiert bereits
- **Frontend-Component**: `HeaderComponent` oder `NavigationComponent`
- Der Login-Status wird über `AuthService.isAuthenticated()` geprüft
- Angular Material Button im Header

---

## User Story: Zur Registrierungsseite navigieren
Als **Besucher** möchte ich von der Startseite zur Registrierungsseite navigieren können, damit ich ein Konto erstellen kann.

### Acceptance Criteria:
- In der Hauptnavigation (Header) gibt es einen "Registrieren"-Button (neben oder in der Nähe des Login-Buttons)
- Ein Klick auf den Button öffnet ein Auswahlmenü mit zwei Optionen:
  - "Als Kunde registrieren"
  - "Als Restaurantbesitzer registrieren"
- Die Auswahl "Als Kunde registrieren" navigiert zu `/register/customer`
- Die Auswahl "Als Restaurantbesitzer registrieren" navigiert zu `/register/restaurant-owner`
- Die Buttons sind deutlich sichtbar
- Wenn ein Benutzer bereits eingeloggt ist, werden die Registrierungs-Buttons nicht angezeigt

### Technische Details:
- **Angular Routing**: Routes `/register/customer` und `/register/restaurant-owner` existieren bereits
- **Frontend-Component**: `HeaderComponent` oder `NavigationComponent`
- UI: Angular Material Menu (`mat-menu`) für die Rollenauswahl
- Der Login-Status wird über `AuthService.isAuthenticated()` geprüft

---

## User Story: Responsive Darstellung der Startseite
Als **Besucher oder Kunde** möchte ich die Startseite auf verschiedenen Geräten nutzen können, damit ich auch mobil Restaurants durchsuchen kann.

### Acceptance Criteria:
- Die Startseite passt sich automatisch an verschiedene Bildschirmgrößen an (responsive Design)
- Auf Desktop: Restaurant-Liste als Grid mit 3-4 Spalten
- Auf Tablet: Restaurant-Liste als Grid mit 2 Spalten
- Auf Smartphone: Restaurant-Liste als einzelne Spalte
- Filter-Bereich ist auf mobilen Geräten einklappbar oder als Bottom Sheet darstellbar
- Navigation (Header) ist auf mobilen Geräten als Hamburger-Menü verfügbar
- Alle interaktiven Elemente sind auf Touchscreens gut bedienbar (ausreichende Größe)
- Schriftgrößen und Abstände sind auf allen Geräten lesbar

### Technische Details:
- **CSS Framework**: Angular Material mit Flex Layout oder CSS Grid
- **Breakpoints**:
  - Desktop: >= 1024px
  - Tablet: 768px - 1023px
  - Mobile: < 768px
- **Frontend-Component**: `RestaurantListComponent` mit responsive CSS
- Angular Material Sidenav für mobile Navigation

---

## User Story: Fehlerbehandlung bei Laden der Restaurants
Als **Besucher oder Kunde** möchte ich eine verständliche Fehlermeldung sehen, wenn Restaurants nicht geladen werden können, damit ich weiß, was los ist.

### Acceptance Criteria:
- Wenn der API-Call zum Laden der Restaurants fehlschlägt, wird eine benutzerfreundliche Fehlermeldung angezeigt
- Die Fehlermeldung enthält: "Restaurants konnten nicht geladen werden. Bitte versuchen Sie es später erneut."
- Ein "Erneut versuchen"-Button ermöglicht das Neuladen der Daten
- Während des Ladens wird ein Loading-Spinner angezeigt
- Die Fehlermeldung wird in einem Angular Material Snackbar oder als Inline-Nachricht angezeigt
- Bei Netzwerkfehlern wird zusätzlich der Hinweis "Bitte prüfen Sie Ihre Internetverbindung" angezeigt

### Technische Details:
- **Frontend-Service**: `RestaurantService.getRestaurants()` verwendet RxJS catchError
- **Frontend-Component**: `RestaurantListComponent` behandelt Error-States
- Angular Material Snackbar für Fehlermeldungen
- Loading-State wird über eine boolean Variable im Component gesteuert
- Error-State wird über eine Variable gespeichert und im Template ausgewertet

---

## Technische Randbedingungen für die gesamte Feature:

### Backend-Anforderungen:
- **Repository Pattern**: `RestaurantRepository` mit Methoden:
  - `getAllRestaurants()`: Lädt alle Restaurants mit aggregierten Bewertungen und berechneter Lieferzeit
- **Business Logic**: `RestaurantBrowsingService` mit:
  - `getAvailableRestaurants()`: Berechnet Öffnungsstatus basierend auf Öffnungszeiten und aktueller Uhrzeit
  - `calculateDeliveryTime(restaurantId)`: Berechnet geschätzte Lieferzeit (zunächst pauschal 10 Min., später erweitert um Gerichte-Kochzeit und Stoßzeiten)
- **Controller**: `RestaurantController` mit:
  - `GET /api/restaurants`: Gibt alle Restaurants zurück
  - `GET /api/categories`: Gibt verfügbare Küchenkategorien zurück
- **Validierung**: Backend validiert alle Anfragen (auch wenn in dieser Iteration nur GET-Requests)
- **Konfiguration**: Kategorien werden aus `config.ts` geladen

### Frontend-Anforderungen:
- **Service Layer**:
  - `RestaurantService` für Restaurant-API-Calls
  - `CategoryService` für Kategorie-API-Calls
  - `AuthService` für Login-Status (bereits vorhanden)
- **Components**:
  - `LandingComponent` oder `HomeComponent`: Haupt-Container für die Startseite
  - `RestaurantListComponent`: Zeigt Restaurant-Grid an
  - `RestaurantCardComponent`: Einzelne Restaurant-Karte (wiederverwendbar)
  - `RestaurantFilterComponent`: Filter-Bereich
  - `HeaderComponent` oder `NavigationComponent`: Navigation mit Login/Registrierung-Buttons
  - `RestaurantDetailComponent`: Placeholder für Restaurantdetails
- **Routing**:
  - `/` → `LandingComponent` (Startseite)
  - `/login` → `LoginComponent` (bereits vorhanden)
  - `/register/customer` → `CustomerRegistrationComponent` (bereits vorhanden)
  - `/register/restaurant-owner` → `RestaurantOwnerRegistrationComponent` (bereits vorhanden)
  - `/restaurant/:id` → `RestaurantDetailComponent` (neu, Placeholder)
- **Angular Material Components**:
  - `mat-card` für Restaurant-Karten
  - `mat-chip-listbox` oder `mat-select` für Filter
  - `mat-button` für Buttons
  - `mat-icon` für Icons
  - `mat-spinner` für Loading-State
  - `mat-snackbar` für Fehlermeldungen
  - `mat-menu` für Registrierungs-Dropdown
  - `mat-toolbar` für Header
- **Environments**: API Base-URL aus Environment-Files verwenden

### Datenbank:
- Die Tabellen `restaurants`, `restaurant_owners`, `categories` existieren bereits (aus Migration 001, 002)
- Die `categories`-Tabelle oder eine Config-Struktur muss die verfügbaren Küchenkategorien enthalten
- Die Öffnungszeiten werden in der `restaurants`-Tabelle gespeichert (siehe Migration 001)

### Sicherheit:
- Die Startseite ist öffentlich zugänglich (keine Authentifizierung erforderlich)
- CORS muss konfiguriert sein, damit Frontend auf Backend zugreifen kann

### Performance:
- Das Laden aller Restaurants sollte performant sein (< 500ms bei 100+ Restaurants)
- Filter-Operationen erfolgen clientseitig für bessere UX
- Lazy Loading von Restaurant-Bildern implementieren (wenn vorhanden)

---

## Out of Scope für diese Iteration:
- Detaillierte Restaurantansicht mit Gerichten (Feature 005)
- Warenkorb-Funktionalität (Feature 006)
- Bestellprozess (Feature 007)
- Bewertungen anzeigen (Feature 008)
- Sortierung der Restaurant-Liste (z.B. nach Beliebtheit)
- Suchfunktion nach Restaurantname
- Favoriten-Funktion
- Restaurant-Bilder hochladen und anzeigen (Placeholder-Bilder reichen)
- Erweiterte Lieferzeitberechnung (Kochzeit, Stoßzeiten)
- Pagination der Restaurant-Liste

---

## Abhängigkeiten:
- Feature 002 (Authentication and Registration) muss abgeschlossen sein, da Login/Registrierung-Navigation benötigt wird
- Datenbank-Migrationen 001, 002, 003 müssen ausgeführt sein
- Backend-Konfiguration mit verfügbaren Kategorien muss vorhanden sein

---

## Definition of Done:
- [ ] Alle User Stories sind implementiert und erfüllen die Acceptance Criteria
- [ ] Backend-Endpoints sind implementiert und getestet
- [ ] Frontend-Components sind implementiert
- [ ] Responsive Design funktioniert auf Desktop, Tablet und Smartphone
- [ ] Fehlerbehandlung ist implementiert
- [ ] Code-Review wurde durchgeführt
- [ ] Keine Linting-Fehler oder Warnungen
- [ ] Backend-Validierungen sind vorhanden (wo anwendbar)
- [ ] Die Anwendung läuft im Development-Modus ohne Fehler
- [ ] Feature wurde manuell getestet (Happy Path + Error Cases)
