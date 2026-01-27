# Order Overview Component

## Übersicht
Diese Komponente implementiert die Bestellübersicht für Restaurant Owner gemäß Feature 008.

## Features
- ✅ Anzeige aller Bestellungen des Restaurants
- ✅ Priorisierte Sortierung (Pending → Active → Completed)
- ✅ Toggle zum Ein-/Ausblenden abgeschlossener Bestellungen
- ✅ Bestellungen annehmen/ablehnen
- ✅ Status-Updates (In Bearbeitung, Fertig, Wird geliefert, Zugestellt)
- ✅ Automatisches Polling alle 30 Sekunden
- ✅ Responsive Design für Mobile, Tablet und Desktop
- ✅ Fehlerbehandlung für alle API-Calls
- ✅ Visuelles Highlighting der ältesten Pending-Bestellung

## Komponenten

### OrderOverviewComponent
**Pfad:** `src/app/features/restaurant/order-overview/order-overview.component.ts`

**Route:** `/restaurant/orders`

**Hauptfunktionen:**
- `loadOrders()` - Lädt alle Bestellungen vom Backend
- `acceptOrder()` - Nimmt eine Bestellung an
- `rejectOrder()` - Lehnt eine Bestellung ab (öffnet Dialog)
- `updateStatus()` - Aktualisiert den Bestellstatus
- `sortOrders()` - Sortiert Bestellungen nach Priorität
- `toggleCompleted()` - Blendet abgeschlossene Bestellungen ein/aus

**Auto-Refresh:**
Die Komponente aktualisiert automatisch alle 30 Sekunden die Bestellliste im Hintergrund (silent refresh).

### RejectOrderDialogComponent
**Pfad:** `src/app/features/restaurant/order-overview/reject-order-dialog/reject-order-dialog.component.ts`

**Funktion:** Dialog zur Eingabe eines optionalen Ablehnungsgrundes (max. 200 Zeichen)

## Services

### OrderService
**Pfad:** `src/app/core/services/order.service.ts`

**Methoden:**
- `getRestaurantOrders(restaurantId: string): Observable<Order[]>`
  - GET `/api/restaurants/:restaurantId/orders`
  
- `acceptOrder(orderId: string): Observable<void>`
  - POST `/api/orders/:orderId/accept`
  
- `rejectOrder(orderId: string, reason?: string): Observable<void>`
  - POST `/api/orders/:orderId/reject`
  
- `updateOrderStatus(orderId: string, status: OrderStatus): Observable<void>`
  - POST `/api/orders/:orderId/status`

- `getErrorMessage(error: HttpErrorResponse): string`
  - Hilfsmethode für benutzerfreundliche Fehlermeldungen

## Models

### Order Interface
**Pfad:** `src/app/core/models/order.model.ts`

```typescript
interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  voucher?: Voucher;
  estimatedDeliveryTime: string;
  customerNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
```

### OrderStatus Enum
```typescript
enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PREPARATION = 'in_preparation',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
```

## Status-Workflow

```
PENDING
  ├─→ ACCEPTED → IN_PREPARATION → READY → OUT_FOR_DELIVERY → DELIVERED
  └─→ REJECTED
```

## UI/UX Features

### Status-Farben
- **PENDING**: Orange/Gelb (Warnung - Aktion erforderlich!)
- **ACCEPTED**: Blau (Information)
- **IN_PREPARATION**: Lila (in Arbeit)
- **READY**: Grün (bereit)
- **OUT_FOR_DELIVERY**: Cyan (unterwegs)
- **DELIVERED**: Dunkelgrün (erfolgreich abgeschlossen)
- **REJECTED**: Rot (abgelehnt)
- **CANCELLED**: Grau (storniert)

### Sortierung
1. **Pending-Bestellungen**: Älteste zuerst (nach `createdAt` aufsteigend)
2. **Aktive Bestellungen**: Neueste zuerst (nach `updatedAt` absteigend)
3. **Abgeschlossene Bestellungen**: Neueste zuerst (nur wenn eingeblendet)

### Highlighting
Die älteste Pending-Bestellung wird visuell hervorgehoben:
- Orange Border (2px)
- Erhöhter Box-Shadow
- CSS-Klasse: `pending-highlight`

## Responsive Design

### Desktop (> 768px)
- Card-Layout mit allen Details sichtbar
- Aktions-Buttons nebeneinander
- Expandable Details

### Mobile (< 768px)
- Kompaktere Card-Darstellung
- Aktions-Buttons untereinander (full-width)
- Optimierte Metadaten-Anzeige

## Fehlerbehandlung

### HTTP Status Codes
- **422 Unprocessable Entity**: Validierungsfehler (z.B. Bestellung bereits bearbeitet)
- **404 Not Found**: Bestellung nicht gefunden
- **403 Forbidden**: Keine Berechtigung
- **409 Conflict**: Bestellung wurde bereits bearbeitet
- **0**: Server nicht erreichbar

Alle Fehler werden als Snackbar-Notification angezeigt.

## Verwendung

### Navigation
Die Komponente ist erreichbar über:
1. Header-Navigation: "Bestellungen" (nur für Restaurant Owner sichtbar)
2. Direkter Link: `/restaurant/orders`

### Guards
Die Route ist geschützt durch:
- `authGuard` - Benutzer muss eingeloggt sein
- `roleGuard` - Benutzer muss Rolle `restaurantOwner` haben

## Testing

### Manuelle Tests
1. Als Restaurant Owner einloggen
2. Zu `/restaurant/orders` navigieren
3. Bestellliste prüfen
4. Toggle "Abgeschlossene anzeigen" testen
5. Pending-Bestellung annehmen
6. Status-Updates durchführen
7. Bestellung ablehnen (mit/ohne Grund)
8. Refresh-Button testen
9. Responsive Design auf verschiedenen Bildschirmgrößen testen

### API-Tests
Siehe: `backend/postman/Order-Management-API.postman_collection.json`

## Abhängigkeiten

### Angular Material Modules
- MatCardModule
- MatButtonModule
- MatIconModule
- MatChipsModule
- MatSlideToggleModule
- MatProgressSpinnerModule
- MatSnackBarModule
- MatDialogModule
- MatTooltipModule
- MatListModule
- MatDividerModule
- MatFormFieldModule
- MatInputModule
- TextFieldModule (CDK)

### Services
- OrderService (neu)
- AuthService (existing)

### Guards
- authGuard (existing)
- roleGuard (existing)

## Zukünftige Erweiterungen (Out of Scope)

- WebSocket-Integration für Echtzeit-Updates
- Browser-Notifications bei neuen Bestellungen
- Filter nach Datum/Status/Kunde
- Suchfunktion
- Export-Funktionen (CSV, PDF)
- Bulk-Actions
- Detaillierte Status-Historie
- Lieferzeit-Schätzung im Frontend
