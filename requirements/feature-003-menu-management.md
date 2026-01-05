# Feature: Menu Management für Restaurantbesitzer

Als Restaurantbesitzer möchte ich meine Speisekarte digital verwalten können, damit ich mein Angebot flexibel pflegen und meinen Kunden präsentieren kann.

Dieses Feature ermöglicht es Restaurantbesitzern, ihre Gerichte und Menükategorien vollständig zu verwalten. Die Verwaltung umfasst das Erstellen, Bearbeiten, Löschen und Sortieren von Kategorien und Gerichten.

## Acceptance Criteria:
- Restaurantbesitzer können sich einloggen und zur Menu Management Seite navigieren
- Kategorien können erstellt, bearbeitet, gelöscht und in ihrer Reihenfolge angepasst werden
- Gerichte können erstellt, bearbeitet und gelöscht werden
- Gerichte können Kategorien zugeordnet werden
- Gerichte können innerhalb ihrer Kategorie priorisiert/sortiert werden
- Alle Änderungen werden persistent in der Datenbank gespeichert
- Die Validierung erfolgt vollständig auf dem Backend (422 bei Validierungsfehlern)
- Alle Daten werden über REST API unter `/api/menu/*` verwaltet
- Die Benutzeroberfläche nutzt Angular Material Komponenten

---

## User Story 1: Menükategorien anzeigen
Als Restaurantbesitzer möchte ich alle meine Menükategorien sehen können, damit ich einen Überblick über die Struktur meiner Speisekarte habe.

### Acceptance Criteria:
- Nach dem Login kann der Restaurantbesitzer zur "Menu Management" Seite navigieren
- Die Seite zeigt alle Kategorien des Restaurants in der konfigurierten Reihenfolge an
- Jede Kategorie zeigt an, wie viele Gerichte sie enthält
- Bei leerem Menü wird eine hilfreiche Nachricht angezeigt ("Noch keine Kategorien vorhanden")
- Die Kategorien werden über `GET /api/menu/categories` abgerufen
- Backend validiert, dass nur Kategorien des eingeloggten Restaurantbesitzers zurückgegeben werden

### Technische Details:
**Backend:**
- Endpoint: `GET /api/menu/categories`
- Authentifizierung: JWT Bearer Token erforderlich
- Response: Array von Kategorie-Objekten mit: `id`, `name`, `displayOrder`, `dishCount`
- Business Logic prüft Zugehörigkeit zum Restaurant des eingeloggten Users

**Frontend:**
- Angular Service: `MenuService.getCategories()`
- Component: `MenuManagementComponent` in `frontend/src/app/features/restaurant/menu-management/`
- Darstellung mit Angular Material Cards oder List

---

## User Story 2: Menükategorie erstellen
Als Restaurantbesitzer möchte ich neue Kategorien für meine Speisekarte erstellen können, damit ich mein Angebot strukturiert präsentieren kann.

### Acceptance Criteria:
- Ein Button "Neue Kategorie" öffnet einen Dialog
- Der Dialog enthält ein Formularfeld für den Kategorienamen (Pflichtfeld)
- Der Kategoriename muss mindestens 2 und maximal 50 Zeichen lang sein
- Nach dem Speichern wird die neue Kategorie in der Liste angezeigt
- Die neue Kategorie wird automatisch am Ende der Reihenfolge eingefügt
- Bei Validierungsfehlern werden diese benutzerfreundlich angezeigt
- Backend sendet `422 Unprocessable Entity` bei Validierungsfehlern

### Validierungsregeln (Backend):
- **name**: Pflichtfeld, 2-50 Zeichen, keine führenden/nachfolgenden Leerzeichen
- Kategoriename muss für das Restaurant eindeutig sein
- `displayOrder` wird automatisch gesetzt (max + 1)

### Technische Details:
**Backend:**
- Endpoint: `POST /api/menu/categories`
- Request Body: `{ "name": string }`
- Response 201: `{ "id": number, "name": string, "displayOrder": number }`
- Response 422: `{ "errors": [{ "field": string, "message": string }] }`
- Repository-Pattern für Datenbankzugriff
- Business Logic in `CategoryManagementService`

**Frontend:**
- Dialog-Component: `CreateCategoryDialogComponent`
- Angular Reactive Forms mit Frontend-Validierung (UX only)
- Backend-Fehler werden im Dialog angezeigt

---

## User Story 3: Menükategorie bearbeiten
Als Restaurantbesitzer möchte ich bestehende Kategorien umbenennen können, damit ich meine Speisekarte aktuell halten kann.

### Acceptance Criteria:
- Jede Kategorie hat einen "Bearbeiten" Button
- Ein Dialog öffnet sich mit dem aktuellen Namen vorausgefüllt
- Nach dem Speichern wird der aktualisierte Name angezeigt
- Validierungsregeln sind identisch zum Erstellen
- Bei Fehlern bleibt der Dialog offen und zeigt die Fehler an

### Validierungsregeln (Backend):
- Identisch zu User Story 2
- Kategoriename muss für das Restaurant eindeutig sein (außer die Kategorie selbst)

### Technische Details:
**Backend:**
- Endpoint: `PUT /api/menu/categories/:categoryId`
- Request Body: `{ "name": string }`
- Response 200: `{ "id": number, "name": string, "displayOrder": number }`
- Response 404: Wenn Kategorie nicht existiert oder nicht zum Restaurant gehört
- Response 422: Bei Validierungsfehlern

**Frontend:**
- Dialog-Component: `EditCategoryDialogComponent` (kann mit Create-Dialog kombiniert werden)
- Bestehende Daten werden geladen und angezeigt

---

## User Story 4: Menükategorie löschen
Als Restaurantbesitzer möchte ich Kategorien löschen können, damit ich meine Speisekarte aufgeräumt halte.

### Acceptance Criteria:
- Jede Kategorie hat einen "Löschen" Button
- Vor dem Löschen erscheint ein Bestätigungsdialog
- Kategorien mit Gerichten zeigen eine Warnung ("Diese Kategorie enthält X Gerichte. Gerichte werden ebenfalls gelöscht.")
- Nach erfolgreicher Löschung verschwindet die Kategorie aus der Liste
- Die Reihenfolge der verbleibenden Kategorien bleibt erhalten

### Technische Details:
**Backend:**
- Endpoint: `DELETE /api/menu/categories/:categoryId`
- Response 204: Erfolgreich gelöscht
- Response 404: Kategorie nicht gefunden oder gehört nicht zum Restaurant
- Business Logic löscht zugehörige Gerichte (CASCADE) oder verhindert Löschung bei vorhandenen Gerichten (konfigurierbar)

**Frontend:**
- Confirmation Dialog mit Angular Material
- Bei Gerichten in Kategorie: Warnung anzeigen

---

## User Story 5: Kategorien sortieren/neu anordnen
Als Restaurantbesitzer möchte ich die Reihenfolge meiner Kategorien ändern können, damit sie in der gewünschten Reihenfolge angezeigt werden.

### Acceptance Criteria:
- Kategorien können per Drag & Drop neu angeordnet werden
- Nach dem Loslassen wird die neue Reihenfolge gespeichert
- Die Reihenfolge wird sofort in der Ansicht aktualisiert
- Bei Fehler wird die ursprüngliche Reihenfolge wiederhergestellt und eine Fehlermeldung angezeigt

### Technische Details:
**Backend:**
- Endpoint: `PUT /api/menu/categories/reorder`
- Request Body: `{ "categoryIds": number[] }` - Array mit IDs in neuer Reihenfolge
- Response 200: `{ "success": true }`
- Response 422: Wenn nicht alle Kategorien des Restaurants enthalten sind
- Business Logic aktualisiert `displayOrder` für alle Kategorien

**Frontend:**
- Angular CDK Drag & Drop
- Optimistische UI-Aktualisierung mit Rollback bei Fehler

---

## User Story 6: Gericht erstellen
Als Restaurantbesitzer möchte ich neue Gerichte zu meiner Speisekarte hinzufügen können, damit Kunden diese bestellen können.

### Acceptance Criteria:
- Ein Button "Neues Gericht" öffnet einen Dialog oder eine neue Seite
- Formular enthält Felder für: Name, Beschreibung, Preis, Kategorie, Priorität (optional), Foto (optional)
- Alle Pflichtfelder müssen ausgefüllt sein
- Nach dem Speichern wird das Gericht in der Kategorie angezeigt
- Das Foto kann hochgeladen werden (max. 5 MB, Formate: JPG, PNG, WebP)
- Bei Validierungsfehlern werden diese benutzerfreundlich angezeigt

### Validierungsregeln (Backend):
- **name**: Pflichtfeld, 2-100 Zeichen
- **description**: Optional, maximal 500 Zeichen
- **price**: Pflichtfeld, Dezimalzahl, > 0, maximal 999.99
- **categoryId**: Pflichtfeld, muss existierende Kategorie des Restaurants sein
- **priority**: Optional, Ganzzahl >= 0 (Default: 0)
- **photo**: Optional, max. 5 MB, erlaubte MIME-Types: image/jpeg, image/png, image/webp

### Technische Details:
**Backend:**
- Endpoint: `POST /api/menu/dishes`
- Request: Multipart Form Data (wegen Foto-Upload)
- Fields: `name`, `description`, `price`, `categoryId`, `priority`, `photo` (file)
- Response 201: `{ "id": number, "name": string, "description": string, "price": number, "categoryId": number, "priority": number, "photoUrl": string|null }`
- Response 422: Validierungsfehler
- Foto wird im Dateisystem gespeichert (z.B. `uploads/dishes/`)
- Business Logic in `DishManagementService`

**Frontend:**
- Component: `CreateDishComponent` oder `DishFormDialogComponent`
- File Upload mit Angular Material
- Preview des hochgeladenen Fotos
- Preis-Input mit Währungsformatierung

---

## User Story 7: Gericht bearbeiten
Als Restaurantbesitzer möchte ich bestehende Gerichte aktualisieren können, damit ich Preise, Beschreibungen oder Fotos anpassen kann.

### Acceptance Criteria:
- Jedes Gericht hat einen "Bearbeiten" Button
- Der Dialog/die Seite öffnet sich mit allen bestehenden Daten vorausgefüllt
- Das bestehende Foto wird angezeigt (falls vorhanden)
- Ein neues Foto kann hochgeladen werden (ersetzt das alte)
- Das Foto kann gelöscht werden (ohne neues hochzuladen)
- Nach dem Speichern werden die Änderungen sofort sichtbar
- Validierungsregeln sind identisch zum Erstellen

### Technische Details:
**Backend:**
- Endpoint: `PUT /api/menu/dishes/:dishId`
- Request: Multipart Form Data
- Gleiche Validierung wie beim Erstellen
- Response 200: Aktualisiertes Gericht-Objekt
- Response 404: Gericht nicht gefunden oder gehört nicht zum Restaurant
- Response 422: Validierungsfehler
- Optional separater Endpoint: `DELETE /api/menu/dishes/:dishId/photo` zum Foto-Löschen

**Frontend:**
- Gleiche Component wie beim Erstellen (im Edit-Mode)
- Foto-Preview mit "Löschen" Option

---

## User Story 8: Gericht löschen
Als Restaurantbesitzer möchte ich Gerichte von meiner Speisekarte entfernen können, damit nicht mehr verfügbare Gerichte nicht angezeigt werden.

### Acceptance Criteria:
- Jedes Gericht hat einen "Löschen" Button
- Ein Bestätigungsdialog erscheint vor dem Löschen
- Nach erfolgreicher Löschung verschwindet das Gericht aus der Liste
- Das zugehörige Foto wird vom Server gelöscht (falls vorhanden)

### Technische Details:
**Backend:**
- Endpoint: `DELETE /api/menu/dishes/:dishId`
- Response 204: Erfolgreich gelöscht
- Response 404: Gericht nicht gefunden oder gehört nicht zum Restaurant
- Business Logic löscht auch das Foto vom Dateisystem

**Frontend:**
- Confirmation Dialog
- Gericht wird aus lokaler Liste entfernt nach erfolgreicher Löschung

---

## User Story 9: Gerichte einer Kategorie anzeigen
Als Restaurantbesitzer möchte ich alle Gerichte einer Kategorie sehen können, damit ich den Inhalt meiner Kategorien überblicken kann.

### Acceptance Criteria:
- Kategorien können erweitert/eingeklappt werden, um ihre Gerichte anzuzeigen
- Gerichte werden nach Priorität sortiert angezeigt (höhere Priorität zuerst)
- Bei gleicher Priorität: alphabetisch nach Name
- Jedes Gericht zeigt: Name, Beschreibung (gekürzt), Preis, Foto (Thumbnail)
- Gerichte ohne Kategorie werden in einer speziellen "Nicht zugeordnet" Sektion angezeigt

### Technische Details:
**Backend:**
- Endpoint: `GET /api/menu/dishes?categoryId=:categoryId`
- Optional: `GET /api/menu/dishes` (alle Gerichte des Restaurants)
- Response: Array von Gericht-Objekten sortiert nach Priorität und Name
- Query Parameter: `categoryId` (optional)

**Frontend:**
- Expansion Panels (Angular Material) für Kategorien
- Lazy Loading der Gerichte beim Erweitern der Kategorie
- Grid oder List Layout für Gerichte

---

## User Story 10: Gerichte innerhalb einer Kategorie sortieren
Als Restaurantbesitzer möchte ich die Reihenfolge der Gerichte innerhalb einer Kategorie festlegen können, damit wichtige Gerichte zuerst angezeigt werden.

### Acceptance Criteria:
- Gerichte können per Drag & Drop innerhalb ihrer Kategorie neu angeordnet werden
- Die neue Reihenfolge wird als Priorität gespeichert
- Nach dem Loslassen wird die neue Reihenfolge gespeichert
- Die Reihenfolge wird sofort in der Ansicht aktualisiert
- Bei Fehler wird die ursprüngliche Reihenfolge wiederhergestellt

### Technische Details:
**Backend:**
- Endpoint: `PUT /api/menu/dishes/reorder`
- Request Body: `{ "dishIds": number[] }` - Array mit IDs in neuer Reihenfolge innerhalb einer Kategorie
- Response 200: `{ "success": true }`
- Business Logic aktualisiert Priorität für alle betroffenen Gerichte
- Alternative: `PATCH /api/menu/dishes/:dishId` mit `{ "priority": number }`

**Frontend:**
- Angular CDK Drag & Drop innerhalb der Kategorie
- Priorität wird automatisch basierend auf Position berechnet

---

## User Story 11: Gericht in andere Kategorie verschieben
Als Restaurantbesitzer möchte ich Gerichte zwischen Kategorien verschieben können, damit ich meine Speisekarte flexibel organisieren kann.

### Acceptance Criteria:
- Gerichte können per Drag & Drop zwischen Kategorien verschoben werden
- Im Edit-Dialog kann die Kategorie geändert werden
- Nach dem Verschieben erscheint das Gericht in der neuen Kategorie
- Die Priorität wird beim Verschieben zurückgesetzt (oder am Ende der Zielkategorie eingefügt)

### Technische Details:
**Backend:**
- Endpoint: `PATCH /api/menu/dishes/:dishId`
- Request Body: `{ "categoryId": number }`
- Response 200: Aktualisiertes Gericht
- Response 422: Kategorie existiert nicht oder gehört nicht zum Restaurant
- Business Logic aktualisiert `categoryId` und optional `priority`

**Frontend:**
- Drag & Drop zwischen Expansion Panels
- Oder Dropdown im Edit-Dialog

---

## User Story 12: Vollständiges Menü anzeigen (Vorschau)
Als Restaurantbesitzer möchte ich eine Vorschau meiner kompletten Speisekarte sehen können, wie sie Kunden angezeigt wird, damit ich das Gesamtergebnis prüfen kann.

### Acceptance Criteria:
- Ein "Vorschau" Button öffnet eine Ansicht der kompletten Speisekarte
- Die Ansicht zeigt alle Kategorien in korrekter Reihenfolge
- Innerhalb jeder Kategorie werden alle Gerichte in korrekter Reihenfolge angezeigt
- Die Darstellung entspricht der Kundenansicht
- Ein "Zurück zum Bearbeiten" Button kehrt zur Management-Ansicht zurück

### Technische Details:
**Backend:**
- Endpoint: `GET /api/menu/full` oder `GET /api/restaurants/:restaurantId/menu` (öffentlich)
- Response: Vollständige Menüstruktur mit Kategorien und Gerichten

**Frontend:**
- Separate Component: `MenuPreviewComponent`
- Read-only Darstellung
- Kann später für Kundenansicht wiederverwendet werden

---

## Datenmodell

### Datenbank-Tabellen

**categories**
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
restaurant_id: INTEGER NOT NULL (FK -> restaurants.id)
name: TEXT NOT NULL
display_order: INTEGER NOT NULL DEFAULT 0
created_at: TEXT NOT NULL
updated_at: TEXT NOT NULL

UNIQUE(restaurant_id, name)
INDEX: restaurant_id, display_order
```

**dishes**
```
id: INTEGER PRIMARY KEY AUTOINCREMENT
restaurant_id: INTEGER NOT NULL (FK -> restaurants.id)
category_id: INTEGER NULL (FK -> categories.id, SET NULL on delete)
name: TEXT NOT NULL
description: TEXT NULL
price: REAL NOT NULL
priority: INTEGER NOT NULL DEFAULT 0
photo_url: TEXT NULL
created_at: TEXT NOT NULL
updated_at: TEXT NOT NULL

INDEX: category_id, priority
INDEX: restaurant_id
```

---

## API-Übersicht

### Kategorien
- `GET /api/menu/categories` - Alle Kategorien des Restaurants
- `POST /api/menu/categories` - Neue Kategorie erstellen
- `PUT /api/menu/categories/:categoryId` - Kategorie bearbeiten
- `DELETE /api/menu/categories/:categoryId` - Kategorie löschen
- `PUT /api/menu/categories/reorder` - Kategorien neu sortieren

### Gerichte
- `GET /api/menu/dishes` - Alle Gerichte (optional gefiltert nach Kategorie)
- `POST /api/menu/dishes` - Neues Gericht erstellen
- `GET /api/menu/dishes/:dishId` - Einzelnes Gericht abrufen
- `PUT /api/menu/dishes/:dishId` - Gericht bearbeiten
- `PATCH /api/menu/dishes/:dishId` - Gericht teilweise aktualisieren (z.B. Kategorie ändern)
- `DELETE /api/menu/dishes/:dishId` - Gericht löschen
- `DELETE /api/menu/dishes/:dishId/photo` - Foto eines Gerichts löschen
- `PUT /api/menu/dishes/reorder` - Gerichte neu sortieren

### Vollständiges Menü
- `GET /api/menu/full` - Komplettes Menü mit allen Kategorien und Gerichten

---

## Technische Anforderungen

### Backend
- **Repository Pattern**: `CategoryRepository`, `DishRepository`
- **Business Logic**: `CategoryManagementService`, `DishManagementService`
- **Controller**: `MenuController`
- **Routes**: `menu.routes.ts` unter `/api/menu/*`
- **Middleware**: `requireAuth` für alle Endpoints
- **File Upload**: Multer oder ähnliche Library für Foto-Upload
- **File Storage**: Organisiert nach Restaurant/Gericht (z.B. `uploads/restaurants/:restaurantId/dishes/:dishId.jpg`)
- **Validierung**: Vollständig auf Backend, 422 bei Fehlern

### Frontend
- **Module**: Menu Management unter `features/restaurant/menu-management/`
- **Components**:
  - `MenuManagementComponent` (Hauptseite)
  - `CategoryListComponent`
  - `CreateEditCategoryDialogComponent`
  - `DishListComponent`
  - `CreateEditDishDialogComponent`
  - `MenuPreviewComponent`
- **Services**: `MenuService` für alle API-Calls
- **Angular Material**: Cards, Dialogs, Forms, Expansion Panels, Drag & Drop (CDK)
- **Routing**: `/restaurant/menu-management`

### File Upload
- **Max Größe**: 5 MB
- **Erlaubte Formate**: JPEG, PNG, WebP
- **Storage**: Lokales Dateisystem (kann später auf Cloud umgestellt werden)
- **URL Format**: `/uploads/dishes/:filename` oder `/api/menu/dishes/:dishId/photo`

---

## Sicherheit & Autorisierung

- Alle Endpoints erfordern JWT-Authentifizierung
- Business Logic prüft, dass der eingeloggte User ein Restaurantbesitzer ist
- Alle Operationen (Read/Write) sind auf die Daten des eigenen Restaurants beschränkt
- Validierung von `restaurant_id` bei allen Datenbankoperationen
- File Upload-Größe ist limitiert (DoS-Schutz)
- Foto-Dateien werden mit sicheren, zufälligen Namen gespeichert (keine User-Input-Dateinamen)

---

## Offene Punkte / Spätere Iterationen

Folgende Features werden in späteren Sprints implementiert:
- Gericht-Verfügbarkeit (temporär deaktivieren ohne zu löschen)
- Allergene und Zusatzstoffe
- Varianten/Optionen (z.B. Größen, Extras)
- Menü-Zeitplanung (zeitlich begrenzte Angebote)
- Batch-Operationen (mehrere Gerichte gleichzeitig bearbeiten)
- Import/Export von Menüs
- Menü-Vorlagen
- Mehrsprachige Gerichte-Beschreibungen
