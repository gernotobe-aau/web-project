# Feature: Restaurant Analytics für Restaurantbesitzer

Restaurantbesitzer benötigen detaillierte Einblicke in ihre Geschäftsdaten, um fundierte Entscheidungen treffen zu können. Dieses Feature ermöglicht es Restaurantbesitzern, grundlegende Statistiken zu ihren Bestellungen und Gerichten einzusehen. Die Analyse umfasst die Anzahl der Bestellungen auf Tagesbasis und Wochenbasis sowie eine Übersicht der am häufigsten bestellten Gerichte in einem bestimmten Zeitraum.

## Acceptance Criteria:
- Restaurantbesitzer können nach erfolgreichem Login auf eine Analytics/Statistik-Seite zugreifen
- Die Statistik-Seite zeigt die Anzahl der Bestellungen für den aktuellen Tag
- Die Statistik-Seite zeigt die Anzahl der Bestellungen für die aktuelle Woche (Montag bis Sonntag)
- Die Statistik-Seite zeigt eine Liste der meist bestellten Gerichte
- Die Daten werden in Echtzeit aus der Datenbank abgerufen und angezeigt
- Die API-Endpunkte validieren, dass nur authentifizierte Restaurantbesitzer auf ihre eigenen Statistiken zugreifen können
- Alle Validierungen erfolgen vollständig im Backend

## User Story: Tägliche Bestellübersicht anzeigen
Als Restaurantbesitzer möchte ich die Anzahl der Bestellungen für den aktuellen Tag sehen, damit ich einen Überblick über das aktuelle Geschäftsvolumen habe und entsprechend Personal und Ressourcen planen kann.

### Acceptance Criteria:
- Es gibt eine neue Seite "Analytics" bzw. "Statistiken" im Restaurant-Dashboard
- Auf dieser Seite wird prominent die Anzahl der Bestellungen für den heutigen Tag angezeigt (00:00:00 bis 23:59:59 Uhr)
- Es werden nur Bestellungen gezählt, die mindestens den Status "angenommen" haben (abgelehnte Bestellungen werden nicht gezählt)
- Die Anzeige aktualisiert sich automatisch, wenn neue Bestellungen eingehen
- Die Zahl wird klar und übersichtlich dargestellt (z.B. als Card mit Überschrift "Bestellungen heute: X")
- Der Backend-Endpunkt validiert die JWT-Authentifizierung und stellt sicher, dass nur Bestellungen des eigenen Restaurants gezählt werden

### Technische Details (Backend):
- **Endpunkt:** `GET /api/analytics/orders/daily`
- **Authentifizierung:** JWT Bearer Token (Restaurantbesitzer)
- **Response Body:**
```json
{
  "date": "2026-01-28",
  "orderCount": 42
}
```
- **Validierung:** Backend muss prüfen, dass der Benutzer ein Restaurantbesitzer ist und nur Daten seines eigenen Restaurants abruft
- **Business Logic:** Die Zählung erfolgt in der Business Logic Schicht, nicht im Controller
- **Fehlerbehandlung:**
  - `401` bei fehlender oder ungültiger Authentifizierung
  - `403` bei fehlenden Berechtigungen
  - `500` bei unerwarteten Fehlern

### Technische Details (Frontend):
- Neue Komponente `analytics` im Restaurant-Dashboard erstellen
- Service-Klasse `AnalyticsService` für API-Aufrufe erstellen
- Verwendung von Angular Material Cards für die Darstellung
- Die Komponente wird nur für eingeloggte Restaurantbesitzer zugänglich sein (Guard überprüfen)
- Automatisches Polling alle 30 Sekunden oder WebSocket für Echtzeit-Updates (optional für diese Iteration)

## User Story: Wöchentliche Bestellübersicht anzeigen
Als Restaurantbesitzer möchte ich die Anzahl der Bestellungen für die aktuelle Woche sehen, damit ich Trends erkennen und meine Wochenplanung optimieren kann.

### Acceptance Criteria:
- Auf der Analytics-Seite wird die Anzahl der Bestellungen für die aktuelle Woche angezeigt
- Die Woche beginnt am Montag um 00:00:00 Uhr und endet am Sonntag um 23:59:59 Uhr
- Es werden nur Bestellungen gezählt, die mindestens den Status "angenommen" haben
- Die Anzeige erfolgt als separate Card/Kachel neben der täglichen Statistik
- Optional: Anzeige des Datumsbereichs (z.B. "KW 4: 27.01.2026 - 02.02.2026")
- Der Backend-Endpunkt validiert, dass nur Bestellungen des eigenen Restaurants gezählt werden

### Technische Details (Backend):
- **Endpunkt:** `GET /api/analytics/orders/weekly`
- **Authentifizierung:** JWT Bearer Token (Restaurantbesitzer)
- **Response Body:**
```json
{
  "weekStart": "2026-01-27",
  "weekEnd": "2026-02-02",
  "weekNumber": 4,
  "orderCount": 187
}
```
- **Validierung:** Siehe tägliche Übersicht (identische Validierungsregeln)
- **Business Logic:** Wochenberechnung muss Montag als ersten Wochentag berücksichtigen

### Technische Details (Frontend):
- Erweiterung der `analytics`-Komponente
- Paralleler Aufruf der beiden Endpunkte (daily und weekly) beim Laden der Komponente
- Responsive Darstellung: Cards nebeneinander auf Desktop, untereinander auf Mobile

## User Story: Meist bestellte Gerichte anzeigen
Als Restaurantbesitzer möchte ich sehen, welche Gerichte am häufigsten bestellt werden, damit ich beliebte Gerichte identifizieren, mein Angebot optimieren und Einkauf sowie Vorbereitung besser planen kann.

### Acceptance Criteria:
- Auf der Analytics-Seite wird eine Liste der Top 10 meist bestellten Gerichte angezeigt
- Die Liste basiert auf allen Bestellungen seit dem ersten Tag des aktuellen Monats (z.B. 01.01.2026 - 31.01.2026)
- Jedes Gericht zeigt: Name, Anzahl der Bestellungen (wie oft wurde das Gericht insgesamt bestellt, nicht wie viele Portionen)
- Die Liste ist absteigend sortiert (meistbestelltes Gericht zuerst)
- Es werden nur Gerichte aus Bestellungen gezählt, die mindestens den Status "angenommen" haben
- Falls ein Gericht aus der Speisekarte gelöscht wurde, wird es trotzdem in der Statistik angezeigt (historische Daten bleiben erhalten)
- Optional: Anzeige der Gesamtmenge (quantity) zusätzlich zur Anzahl der Bestellungen
- Der Backend-Endpunkt stellt sicher, dass nur Gerichte des eigenen Restaurants ausgewertet werden

### Acceptance Criteria (Erweiterung):
- Falls keine Bestellungen im aktuellen Monat vorhanden sind, wird eine entsprechende Meldung angezeigt (z.B. "Noch keine Daten für diesen Zeitraum verfügbar")
- Die Liste ist scrollbar, falls mehr als 10 Gerichte vorhanden sind (aber es werden nur Top 10 zurückgegeben)

### Technische Details (Backend):
- **Endpunkt:** `GET /api/analytics/dishes/top`
- **Authentifizierung:** JWT Bearer Token (Restaurantbesitzer)
- **Query Parameter (optional für spätere Iterationen):**
  - `period` (Enum: "month", "week", "all-time") - Standard: "month"
  - `limit` (Integer: 1-50) - Standard: 10
- **Response Body:**
```json
{
  "period": "month",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "dishes": [
    {
      "dishId": 42,
      "dishName": "Pizza Margherita",
      "orderCount": 87,
      "totalQuantity": 102
    },
    {
      "dishId": 15,
      "dishName": "Spaghetti Carbonara",
      "orderCount": 65,
      "totalQuantity": 78
    },
    {
      "dishId": 23,
      "dishName": "Tiramisu",
      "orderCount": 54,
      "totalQuantity": 61
    }
  ]
}
```
- **Validierung:** Identische Validierungsregeln wie bei den anderen Analytics-Endpunkten
- **Business Logic:** 
  - Aggregation erfolgt über die OrderItems-Tabelle
  - JOIN mit Dishes und Orders Tabellen
  - Filterung nach Restaurant-ID und Status
  - GROUP BY dishId, ORDER BY orderCount DESC, LIMIT 10

### Technische Details (Frontend):
- Erweiterung der `analytics`-Komponente
- Verwendung von Angular Material Table oder List für die Darstellung
- Spalten: Rang (1-10), Gerichtname, Anzahl Bestellungen, Gesamtmenge
- Optional: Visuelle Hervorhebung der Top 3 (z.B. Medaillen-Icons oder unterschiedliche Farben)
- Loading-Indikator während des Datenabrufs
- Error-Handling mit benutzerfreundlichen Fehlermeldungen

## User Story: Navigations-Zugang zur Analytics-Seite
Als Restaurantbesitzer möchte ich von meinem Dashboard aus einfach zur Analytics-Seite navigieren können, damit ich schnell auf meine Geschäftsdaten zugreifen kann.

### Acceptance Criteria:
- Im Restaurant-Dashboard-Menü gibt es einen neuen Navigationspunkt "Statistiken" oder "Analytics"
- Der Menüpunkt ist nur für eingeloggte Restaurantbesitzer sichtbar (nicht für Kunden)
- Beim Klick auf den Menüpunkt wird die Analytics-Seite geladen
- Die Analytics-Seite ist durch einen Auth-Guard geschützt und nur für Restaurantbesitzer zugänglich
- Falls ein nicht-authentifizierter Benutzer versucht, direkt auf die URL zuzugreifen, wird er zur Login-Seite umgeleitet

### Technische Details (Frontend):
- Route hinzufügen: `/restaurant/analytics` oder `/dashboard/analytics` (je nach bestehender Struktur)
- Auth-Guard muss Rolle "restaurant_owner" prüfen
- Menüeintrag im Restaurant-Dashboard hinzufügen (z.B. mit Material Icon "bar_chart" oder "analytics")

## Technische Architektur-Übersicht

### Backend-Struktur:
```
backend/src/
├── api/
│   ├── controllers/
│   │   └── analytics.controller.ts       # Neue Controller-Klasse
│   └── routes/
│       └── analytics.routes.ts           # Neue Route-Definition
├── business/
│   └── analytics.service.ts              # Neue Business Logic Klasse
└── repositories/
    └── analytics.repository.ts           # Neue Repository-Klasse (optional, kann auch bestehende Repos nutzen)
```

### Controller-Verantwortlichkeiten:
- Request-Validierung (JWT-Token vorhanden, User ist Restaurantbesitzer)
- Aufruf der Business Logic
- Response-Mapping
- **KEINE Business Logic im Controller!**

### Business Logic Service-Verantwortlichkeiten:
- Validierung der Geschäftsregeln (z.B. User darf nur seine eigenen Restaurant-Daten abrufen)
- Berechnung der Zeiträume (heute, aktuelle Woche, aktueller Monat)
- Filterung nach Bestellstatus (nur "angenommen" oder höher)
- Aggregation und Sortierung der Daten
- Aufruf der Repository-Methoden

### Repository-Verantwortlichkeiten:
- Datenbankabfragen
- SQL-Queries für Aggregationen
- Keine Business Logic!

### Frontend-Struktur:
```
frontend/src/app/
├── restaurant/
│   └── analytics/
│       ├── analytics.component.ts
│       ├── analytics.component.html
│       └── analytics.component.css
└── core/
    └── services/
        └── analytics.service.ts           # Neue Service-Klasse für API-Calls
```

## Datenbank-Anforderungen

Die bestehende Datenbank sollte bereits alle notwendigen Informationen enthalten:
- `orders` Tabelle: `id`, `restaurant_id`, `customer_id`, `status`, `created_at`, `total_amount`
- `order_items` Tabelle: `id`, `order_id`, `dish_id`, `quantity`, `price`
- `dishes` Tabelle: `id`, `restaurant_id`, `name`, `description`, `price`
- `restaurant_owners` Tabelle: `id`, `user_id`, `restaurant_id`

Falls Indizes für Performance fehlen:
- Index auf `orders.restaurant_id`
- Index auf `orders.created_at`
- Index auf `order_items.dish_id`
- Composite Index auf `orders (restaurant_id, created_at, status)`

## Ausschluss für diese Iteration

Folgende Features werden NICHT in dieser Iteration implementiert:
- Grafische Visualisierung (Charts, Diagramme) der Statistiken
- Export-Funktionen (PDF, Excel, CSV)
- Benutzerdefinierte Zeitraum-Auswahl (Custom Date Range)
- Vergleich verschiedener Zeiträume (z.B. diese Woche vs. letzte Woche)
- Umsatz-Statistiken (nur Bestellanzahl, nicht Geldbeträge)
- Bewertungs-Statistiken
- Detaillierte Auswertung nach Tageszeit oder Wochentag
- Real-time Updates via WebSockets (optional, kann hinzugefügt werden wenn Zeit vorhanden)
- Filter- und Sortierfunktionen in der Gerichte-Liste
- Paginierung (nur Top 10 werden angezeigt)

## Testbarkeit

Die Implementierung muss folgende Testszenarien ermöglichen:

### Backend-Tests (mit Postman oder ähnlich):
1. **Daily Orders:**
   - GET `/api/analytics/orders/daily` mit gültigem JWT → 200 + Daten
   - GET `/api/analytics/orders/daily` ohne JWT → 401
   - GET `/api/analytics/orders/daily` mit Kunden-JWT → 403

2. **Weekly Orders:**
   - GET `/api/analytics/orders/weekly` mit gültigem JWT → 200 + Daten
   - Testen mit verschiedenen Wochentagen (Montag als Start validieren)

3. **Top Dishes:**
   - GET `/api/analytics/dishes/top` mit gültigem JWT → 200 + Liste
   - GET `/api/analytics/dishes/top` ohne Bestellungen im Monat → 200 + leere Liste

4. **Authorization:**
   - Restaurant A darf nur Daten von Restaurant A sehen
   - Restaurant B darf keine Daten von Restaurant A abrufen

### Frontend-Tests (manuell):
1. Als Restaurantbesitzer einloggen
2. Zur Analytics-Seite navigieren
3. Alle drei Statistiken werden angezeigt (daily, weekly, top dishes)
4. Neue Bestellung aufgeben und prüfen, dass sich die Zähler aktualisieren
5. Als Kunde einloggen und versuchen, auf `/restaurant/analytics` zuzugreifen → Redirect zu Login/Dashboard

## Definition of Done

- [ ] Backend: Alle drei API-Endpunkte sind implementiert und funktionsfähig
- [ ] Backend: Business Logic ist vollständig in Service-Klassen implementiert (nicht in Controllern)
- [ ] Backend: Alle Validierungen erfolgen im Backend
- [ ] Backend: JWT-Authentifizierung und Authorization sind implementiert
- [ ] Backend: Repository Pattern wird verwendet
- [ ] Backend: Fehlerbehandlung mit korrekten HTTP-Status-Codes (401, 403, 422, 500)
- [ ] Backend: Postman-Collection mit allen Testfällen ist erstellt/erweitert
- [ ] Frontend: Analytics-Komponente ist implementiert
- [ ] Frontend: AnalyticsService für API-Calls ist implementiert
- [ ] Frontend: Navigation zur Analytics-Seite ist vorhanden
- [ ] Frontend: Auth-Guard schützt die Analytics-Route
- [ ] Frontend: Benutzerfreundliche Fehlerbehandlung und Loading-States
- [ ] Frontend: Responsive Design (Desktop und Mobile)
- [ ] Code: TypeScript ohne `any` Typen (strong typing)
- [ ] Code: Keine Business Logic in Controllern oder Komponenten
- [ ] Code: Keine hardcodierten URLs (Environment-Dateien verwenden)
- [ ] Testing: Alle Postman-Tests sind erfolgreich
- [ ] Testing: Manuelle Frontend-Tests sind erfolgreich
- [ ] Documentation: API-Endpunkte sind dokumentiert (z.B. in backend/docs/)
