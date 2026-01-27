# Feature 008: Bestellübersicht für Restaurant Owner (Frontend)

## Übersicht
Dieses Feature implementiert die Bestellübersicht im Frontend für Restaurant Owner. Die Übersicht zeigt alle Bestellungen des Restaurants in einer priorisierten Liste an und ermöglicht es dem Restaurant Owner, Bestellungen anzunehmen, abzulehnen und deren Status zu aktualisieren. Die Darstellung priorisiert neue, unbearbeitete Bestellungen und bietet die Möglichkeit, abgeschlossene Bestellungen ein-/auszublenden.

Die gesamte Implementierung erfolgt im Angular Frontend gemäß den Projekt-Guidelines. Alle API-Calls werden über Angular Services durchgeführt, die die bereits implementierte Order Management API (Feature 007) verwenden.

## Feature Goals
- Restaurant Owner sehen alle Bestellungen ihres Restaurants in einer übersichtlichen Liste
- Neue/unbearbeitete Bestellungen werden priorisiert angezeigt (ganz oben)
- Abgeschlossene Bestellungen sind standardmäßig ausgeblendet, können aber eingeblendet werden
- Restaurant Owner können Bestellungen direkt annehmen oder ablehnen
- Restaurant Owner können den Bestellstatus aktualisieren (in Bearbeitung, fertig, wird geliefert)
- Visuelle Unterscheidung der verschiedenen Bestellzustände
- Echtzeit-ähnliches Verhalten durch regelmäßiges Polling oder manuelle Aktualisierung

## Acceptance Criteria
- ✅ Neue Angular-Komponente für die Bestellübersicht
- ✅ Angular Service für API-Calls zur Order Management API
- ✅ Priorisierte Sortierung: Neue Bestellungen (pending, accepted, in_preparation, ready, out_for_delivery) zuerst, dann abgeschlossene (delivered, cancelled, rejected)
- ✅ Toggle-Funktion zum Ein-/Ausblenden abgeschlossener Bestellungen
- ✅ Aktions-Buttons für Status-Änderungen je nach aktuellem Status
- ✅ Visuelle Kennzeichnung der verschiedenen Status (Material Design Chips/Badges)
- ✅ Fehlerbehandlung für API-Calls (422, 404, 403)
- ✅ Responsive Design mit Angular Material
- ✅ Nur für eingeloggte Restaurant Owner zugänglich (Auth Guard)

---

## User Story 1: Bestellübersicht anzeigen

**Als** eingeloggter Restaurant Owner  
**möchte ich** alle Bestellungen meines Restaurants in einer übersichtlichen Liste sehen  
**damit** ich den Überblick über alle aktuellen und vergangenen Bestellungen habe.

### Acceptance Criteria
- ✅ Neue Angular-Komponente: `OrderOverviewComponent`
- ✅ Komponente ist unter Route `/dashboard/orders` oder `/restaurant-owner/orders` erreichbar
- ✅ Route ist durch `AuthGuard` geschützt (nur für role="restaurant_owner")
- ✅ Angular Service: `OrderService` mit Methode `getRestaurantOrders(restaurantId: string): Observable<Order[]>`
- ✅ API-Call zu `GET /api/restaurants/:restaurantId/orders` (aus Feature 007)
- ✅ Anzeige aller Bestellungen in einer Material Table oder Card-Liste
- ✅ Jede Bestellung zeigt:
  - Bestellnummer (orderId oder fortlaufende Nummer)
  - Bestellzeitpunkt (createdAt, formatiert z.B. "27.01.2026, 14:30 Uhr")
  - Kundename (falls verfügbar) oder "Kunde #xyz"
  - Bestellsumme (totalAmount)
  - Aktueller Status (als Badge/Chip mit Farbe)
  - Liste der bestellten Gerichte (Name, Menge)
  - Kundennotizen (falls vorhanden)
  - Lieferadresse (falls sichtbar für Owner)
- ✅ Responsive Design: Mobile, Tablet, Desktop
- ✅ Loading-Spinner während API-Call
- ✅ Fehlerbehandlung: Wenn API-Call fehlschlägt, Fehlermeldung anzeigen

### Technische Details
```typescript
// order.model.ts
export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  voucher?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  };
  estimatedDeliveryTime: string; // ISO timestamp
  customerNotes?: string;
  items: OrderItem[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface OrderItem {
  dishId: string;
  dishName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export enum OrderStatus {
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

```typescript
// order.service.ts
@Injectable({ providedIn: 'root' })
export class OrderService {
  private apiUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/restaurants/${restaurantId}/orders`);
  }
  
  // weitere Methoden siehe User Story 2-4
}
```

### UI/UX Details
- Material Table oder Material Card für jede Bestellung
- Status-Badge mit farblicher Kodierung:
  - `pending`: Orange/Gelb (Warnung - Aktion erforderlich!)
  - `accepted`: Blau (Information)
  - `in_preparation`: Lila (in Arbeit)
  - `ready`: Grün (bereit)
  - `out_for_delivery`: Cyan (unterwegs)
  - `delivered`: Dunkelgrün (erfolgreich abgeschlossen)
  - `rejected`: Rot (abgelehnt)
  - `cancelled`: Grau (storniert)

---

## User Story 2: Priorisierte Sortierung - Neue Bestellungen zuerst

**Als** Restaurant Owner  
**möchte ich** neue und unbearbeitete Bestellungen ganz oben in der Liste sehen  
**damit** ich diese schnell bearbeiten und zeitnah reagieren kann.

### Acceptance Criteria
- ✅ Bestellungen werden nach Priorität und dann nach Zeit sortiert
- ✅ Sortierreihenfolge:
  1. **Pending-Bestellungen** (status = 'pending') → nach createdAt aufsteigend (älteste zuerst!)
  2. **Aktive Bestellungen** (status = 'accepted', 'in_preparation', 'ready', 'out_for_delivery') → nach updatedAt absteigend (neueste zuerst)
  3. **Abgeschlossene Bestellungen** (status = 'delivered', 'cancelled', 'rejected') → nur wenn eingeblendet, nach updatedAt absteigend
- ✅ Die älteste pending-Bestellung steht ganz oben und hat visuelle Hervorhebung (z.B. Schatten, dickerer Rand)
- ✅ Sortierung erfolgt im Frontend nach Abruf der Daten
- ✅ Bei Statusänderung wird Liste neu sortiert

### Technische Details
```typescript
// order-overview.component.ts
sortOrders(orders: Order[]): Order[] {
  const pending = orders.filter(o => o.status === OrderStatus.PENDING)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // älteste zuerst
  
  const active = orders.filter(o => 
    ['accepted', 'in_preparation', 'ready', 'out_for_delivery'].includes(o.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // neueste zuerst
  
  const completed = orders.filter(o => 
    ['delivered', 'cancelled', 'rejected'].includes(o.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // pending zuerst, dann active, dann completed (wenn eingeblendet)
  return [...pending, ...active, ...(this.showCompleted ? completed : [])];
}
```

### UI/UX Details
- Die oberste pending-Bestellung hat eine visuelle Hervorhebung:
  - Erhöhter Box-Shadow
  - Dickerer Rahmen (z.B. 2px solid orange)
  - Optional: Pulsierender Effekt oder Icon "Neu!"
- Visuelle Trennung zwischen pending, active und completed Bestellungen (z.B. dünne Trennlinie oder Gruppierung)

---

## User Story 3: Abgeschlossene Bestellungen ein-/ausblenden

**Als** Restaurant Owner  
**möchte ich** abgeschlossene Bestellungen standardmäßig ausblenden, aber bei Bedarf einblenden können  
**damit** ich mich auf aktuelle Bestellungen konzentrieren kann, aber trotzdem Zugriff auf die Historie habe.

### Acceptance Criteria
- ✅ Abgeschlossene Bestellungen (status = 'delivered', 'cancelled', 'rejected') sind standardmäßig **nicht sichtbar**
- ✅ Toggle-Button oder Checkbox: "Abgeschlossene Bestellungen anzeigen"
- ✅ Status des Toggles wird im Component State gespeichert (`showCompleted: boolean`)
- ✅ Beim Einblenden werden abgeschlossene Bestellungen am Ende der Liste angezeigt
- ✅ Anzahl der ausgeblendeten Bestellungen wird angezeigt (z.B. "12 abgeschlossene Bestellungen ausgeblendet")
- ✅ Toggle-Status bleibt erhalten während der Session (LocalStorage optional)

### Technische Details
```typescript
// order-overview.component.ts
export class OrderOverviewComponent implements OnInit {
  orders: Order[] = [];
  showCompleted: boolean = false;
  completedCount: number = 0;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getRestaurantOrders(this.restaurantId).subscribe(
      orders => {
        this.orders = orders;
        this.completedCount = orders.filter(o => 
          ['delivered', 'cancelled', 'rejected'].includes(o.status)).length;
      }
    );
  }

  toggleCompleted() {
    this.showCompleted = !this.showCompleted;
    // Optional: localStorage.setItem('showCompleted', String(this.showCompleted));
  }

  getDisplayedOrders(): Order[] {
    return this.sortOrders(this.orders);
  }
}
```

### UI/UX Details
- Toggle als Material Slide Toggle oder Checkbox oberhalb der Liste
- Label: "Abgeschlossene Bestellungen anzeigen (12)" → Anzahl dynamisch
- Position: Rechts oben oder links neben dem Seitentitel
- Beim Einblenden: Smooth-Scroll-Animation (optional)

---

## User Story 4: Bestellung annehmen

**Als** Restaurant Owner  
**möchte ich** eine neue Bestellung (status = 'pending') annehmen können  
**damit** der Kunde informiert wird und ich mit der Zubereitung beginnen kann.

### Acceptance Criteria
- ✅ Button "Annehmen" erscheint nur bei Bestellungen mit status = 'pending'
- ✅ Klick auf "Annehmen" ruft `OrderService.acceptOrder(orderId)` auf
- ✅ API-Call zu `POST /api/orders/:orderId/accept` (aus Feature 007)
- ✅ Bei Erfolg (200/204):
  - Status der Bestellung wird lokal auf 'accepted' gesetzt
  - Liste wird neu sortiert (Bestellung rutscht nach unten zu "Aktive Bestellungen")
  - Success-Snackbar: "Bestellung #123 angenommen"
- ✅ Bei Fehler (422, 404, 403):
  - Fehler-Snackbar mit Meldung (z.B. "Bestellung wurde bereits bearbeitet")
  - Liste wird neu geladen (Refresh)
- ✅ Während API-Call: Button ist disabled, Loading-Spinner im Button

### Technische Details
```typescript
// order.service.ts
acceptOrder(orderId: string): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/orders/${orderId}/accept`, {});
}

rejectOrder(orderId: string, reason?: string): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/orders/${orderId}/reject`, { reason });
}
```

```typescript
// order-overview.component.ts
acceptOrder(order: Order) {
  this.orderService.acceptOrder(order.id).subscribe({
    next: () => {
      order.status = OrderStatus.ACCEPTED;
      this.snackBar.open(`Bestellung #${order.id.slice(0, 8)} angenommen`, 'OK', { duration: 3000 });
    },
    error: (err) => {
      this.snackBar.open(this.getErrorMessage(err), 'OK', { duration: 5000 });
      this.loadOrders(); // Refresh
    }
  });
}

getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 422 && error.error?.message) {
    return error.error.message;
  }
  if (error.status === 404) {
    return 'Bestellung nicht gefunden';
  }
  if (error.status === 403) {
    return 'Keine Berechtigung für diese Aktion';
  }
  return 'Ein Fehler ist aufgetreten';
}
```

### UI/UX Details
- Button "Annehmen" mit grüner Farbe (Material color="primary" oder custom green)
- Button neben "Ablehnen"-Button (siehe User Story 5)
- Icon: Checkmark oder Thumbs-up
- Während API-Call: Button zeigt Material Progress Spinner

---

## User Story 5: Bestellung ablehnen

**Als** Restaurant Owner  
**möchte ich** eine neue Bestellung (status = 'pending') ablehnen können  
**damit** der Kunde informiert wird, dass die Bestellung nicht erfüllt werden kann.

### Acceptance Criteria
- ✅ Button "Ablehnen" erscheint nur bei Bestellungen mit status = 'pending'
- ✅ Klick auf "Ablehnen" öffnet Dialog mit optionalem Ablehnungsgrund
- ✅ Dialog enthält:
  - Textfeld für Grund (optional, max. 200 Zeichen)
  - Button "Abbrechen"
  - Button "Ablehnen" (rot)
- ✅ Bestätigung ruft `OrderService.rejectOrder(orderId, reason?)` auf
- ✅ API-Call zu `POST /api/orders/:orderId/reject` (aus Feature 007)
- ✅ Bei Erfolg:
  - Status der Bestellung wird lokal auf 'rejected' gesetzt
  - Bestellung verschwindet aus Liste (da abgeschlossen und standardmäßig ausgeblendet)
  - Success-Snackbar: "Bestellung #123 abgelehnt"
- ✅ Bei Fehler: Fehler-Snackbar + Refresh
- ✅ Während API-Call: Button disabled, Loading-Spinner

### Technische Details
```typescript
// order-overview.component.ts
rejectOrder(order: Order) {
  const dialogRef = this.dialog.open(RejectOrderDialogComponent, {
    width: '400px',
    data: { orderId: order.id }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.orderService.rejectOrder(order.id, result.reason).subscribe({
        next: () => {
          order.status = OrderStatus.REJECTED;
          this.snackBar.open(`Bestellung #${order.id.slice(0, 8)} abgelehnt`, 'OK', { duration: 3000 });
          // Bestellung wird automatisch ausgeblendet, wenn showCompleted = false
        },
        error: (err) => {
          this.snackBar.open(this.getErrorMessage(err), 'OK', { duration: 5000 });
          this.loadOrders();
        }
      });
    }
  });
}
```

### UI/UX Details
- Button "Ablehnen" mit roter Farbe (Material color="warn")
- Icon: Cross oder Thumbs-down
- Dialog mit Material Design
- Textfeld für Grund ist optional, aber mit Hinweis: "Optional: Grund für Ablehnung"
- Bei Ablehnung: Kurze Fade-out-Animation der Bestellung

---

## User Story 6: Bestellstatus aktualisieren

**Als** Restaurant Owner  
**möchte ich** den Status einer angenommenen Bestellung aktualisieren können (in Bearbeitung, fertig, wird geliefert)  
**damit** der Kunde jederzeit den aktuellen Stand seiner Bestellung sehen kann.

### Acceptance Criteria
- ✅ Status-Änderungs-Buttons erscheinen nur bei passenden Status-Übergängen:
  - `accepted` → Button "In Bearbeitung"
  - `in_preparation` → Button "Fertig"
  - `ready` → Button "Wird geliefert"
  - `out_for_delivery` → Button "Zugestellt" (optional, kann auch automatisch geschehen)
- ✅ Klick auf Button ruft `OrderService.updateOrderStatus(orderId, newStatus)` auf
- ✅ API-Call zu `POST /api/orders/:orderId/status` (aus Feature 007)
- ✅ Bei Erfolg:
  - Status der Bestellung wird lokal aktualisiert
  - Button wechselt zum nächsten Status
  - Kurze Success-Snackbar: "Status aktualisiert"
- ✅ Bei Fehler: Fehler-Snackbar + Refresh
- ✅ Während API-Call: Button disabled, Loading-Spinner

### Technische Details
```typescript
// order.service.ts
updateOrderStatus(orderId: string, status: OrderStatus): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/orders/${orderId}/status`, { status });
}
```

```typescript
// order-overview.component.ts
getNextStatusButton(order: Order): { label: string, status: OrderStatus, color: string } | null {
  switch (order.status) {
    case OrderStatus.ACCEPTED:
      return { label: 'In Bearbeitung', status: OrderStatus.IN_PREPARATION, color: 'primary' };
    case OrderStatus.IN_PREPARATION:
      return { label: 'Fertig', status: OrderStatus.READY, color: 'primary' };
    case OrderStatus.READY:
      return { label: 'Wird geliefert', status: OrderStatus.OUT_FOR_DELIVERY, color: 'primary' };
    case OrderStatus.OUT_FOR_DELIVERY:
      return { label: 'Zugestellt', status: OrderStatus.DELIVERED, color: 'accent' };
    default:
      return null;
  }
}

updateStatus(order: Order, newStatus: OrderStatus) {
  this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
    next: () => {
      order.status = newStatus;
      order.updatedAt = new Date().toISOString();
      this.snackBar.open('Status aktualisiert', 'OK', { duration: 2000 });
    },
    error: (err) => {
      this.snackBar.open(this.getErrorMessage(err), 'OK', { duration: 5000 });
      this.loadOrders();
    }
  });
}
```

### UI/UX Details
- Buttons werden dynamisch generiert basierend auf aktuellem Status
- Button-Farbe variiert je nach Status (primary, accent)
- Icon je nach Aktion (z.B. "In Bearbeitung" → Icon: chef's hat, "Fertig" → Icon: done, "Wird geliefert" → Icon: delivery)
- Bei Status-Update: Kurze Highlight-Animation der Bestellung

---

## User Story 7: Bestelldetails anzeigen

**Als** Restaurant Owner  
**möchte ich** die vollständigen Details einer Bestellung sehen können  
**damit** ich alle notwendigen Informationen zur Bearbeitung habe.

### Acceptance Criteria
- ✅ Klick auf eine Bestellung (oder Button "Details") öffnet erweiterte Ansicht
- ✅ Zwei Optionen:
  - **Option A**: Expandable Row in Material Table (empfohlen für Desktop)
  - **Option B**: Separater Detail-Dialog
- ✅ Details enthalten:
  - Alle Gerichte mit Menge, Einzelpreis, Subtotal
  - Angewendeter Voucher (falls vorhanden) mit Rabatt
  - Gesamtsumme (vor und nach Rabatt)
  - Kundennotizen (prominent hervorgehoben)
  - Lieferadresse
  - Bestellzeitpunkt (createdAt)
  - Letzte Aktualisierung (updatedAt)
  - Geschätzte Lieferzeit (estimatedDeliveryTime)
  - Status-Historie (alle Statusänderungen mit Zeitstempel) - optional, wenn in API verfügbar
- ✅ Responsive Design: Auf Mobile automatisch als Dialog

### Technische Details
```html
<!-- Expandable Row in Material Table -->
<mat-table [dataSource]="displayedOrders">
  <ng-container matColumnDef="expandedDetail">
    <mat-cell *matCellDef="let order" [attr.colspan]="displayedColumns.length">
      <div class="order-detail" [@detailExpand]="order === expandedOrder ? 'expanded' : 'collapsed'">
        <!-- Details hier -->
        <h3>Bestelldetails</h3>
        <mat-list>
          <mat-list-item *ngFor="let item of order.items">
            <span matListItemTitle>{{ item.quantity }}x {{ item.dishName }}</span>
            <span matListItemLine>{{ item.pricePerUnit | currency:'EUR' }} × {{ item.quantity }} = {{ item.subtotal | currency:'EUR' }}</span>
          </mat-list-item>
        </mat-list>
        
        <div *ngIf="order.voucher">
          <h4>Gutschein</h4>
          <p>Code: {{ order.voucher.code }}</p>
          <p>Rabatt: {{ order.voucher.discountType === 'percentage' ? (order.voucher.discountValue + '%') : (order.voucher.discountValue | currency:'EUR') }}</p>
          <p>Ersparnis: {{ order.voucher.discountAmount | currency:'EUR' }}</p>
        </div>
        
        <div class="customer-notes" *ngIf="order.customerNotes">
          <mat-icon>notes</mat-icon>
          <p><strong>Kundennotizen:</strong> {{ order.customerNotes }}</p>
        </div>
        
        <p><strong>Gesamtsumme:</strong> {{ order.totalAmount | currency:'EUR' }}</p>
        <p><strong>Geschätzte Lieferzeit:</strong> {{ order.estimatedDeliveryTime | date:'short' }}</p>
      </div>
    </mat-cell>
  </ng-container>
</mat-table>
```

### UI/UX Details
- Expandable Row mit Smooth-Expand-Animation
- Kundennotizen werden mit Icon und farblicher Hervorhebung angezeigt (z.B. gelber Hintergrund)
- Geschätzte Lieferzeit wird relativ angezeigt (z.B. "in 25 Minuten")
- Status-Historie als Timeline (optional)

---

## User Story 8: Bestellliste aktualisieren

**Als** Restaurant Owner  
**möchte ich** die Bestellliste manuell aktualisieren können  
**damit** ich sicherstelle, dass ich die neuesten Bestellungen sehe.

### Acceptance Criteria
- ✅ Button "Aktualisieren" oder Icon-Button (Refresh-Symbol) oberhalb der Liste
- ✅ Klick auf Button lädt alle Bestellungen neu (`loadOrders()`)
- ✅ Während des Ladens: Button disabled, Loading-Spinner
- ✅ Optional: Automatisches Polling alle 30 Sekunden (konfigurierbar)
- ✅ Optional: Notification/Badge, wenn neue Bestellung eingeht (Anzahl ungelesener Bestellungen)

### Technische Details
```typescript
// order-overview.component.ts
export class OrderOverviewComponent implements OnInit, OnDestroy {
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 Sekunden

  ngOnInit() {
    this.loadOrders();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadOrders(true); // silent refresh
    }, this.REFRESH_INTERVAL_MS);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadOrders(silent: boolean = false) {
    if (!silent) {
      this.loading = true;
    }
    this.orderService.getRestaurantOrders(this.restaurantId).subscribe({
      next: (orders) => {
        const newOrderCount = this.getNewOrderCount(orders);
        this.orders = orders;
        this.completedCount = orders.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status)).length;
        this.loading = false;
        
        if (silent && newOrderCount > 0) {
          this.snackBar.open(`${newOrderCount} neue Bestellung(en)`, 'Anzeigen', { duration: 5000 });
        }
      },
      error: (err) => {
        this.loading = false;
        if (!silent) {
          this.snackBar.open('Fehler beim Laden der Bestellungen', 'OK', { duration: 3000 });
        }
      }
    });
  }

  getNewOrderCount(newOrders: Order[]): number {
    // Vergleiche mit aktuellen Bestellungen und zähle neue pending-Bestellungen
    const currentPendingIds = this.orders
      .filter(o => o.status === OrderStatus.PENDING)
      .map(o => o.id);
    return newOrders
      .filter(o => o.status === OrderStatus.PENDING && !currentPendingIds.includes(o.id))
      .length;
  }
}
```

### UI/UX Details
- Refresh-Button rechts oben, Icon: `refresh`
- Während Refresh: Button rotiert
- Bei neuen Bestellungen (Auto-Refresh): Snackbar mit "X neue Bestellung(en)" und Button "Anzeigen"
- Optional: Badge am Refresh-Button mit Anzahl neuer Bestellungen

---

## Technische Implementierung

### Komponenten-Struktur
```
frontend/src/app/
├── components/
│   └── restaurant-owner/
│       └── order-overview/
│           ├── order-overview.component.ts
│           ├── order-overview.component.html
│           ├── order-overview.component.css
│           └── reject-order-dialog/
│               ├── reject-order-dialog.component.ts
│               ├── reject-order-dialog.component.html
│               └── reject-order-dialog.component.css
├── core/
│   ├── services/
│   │   └── order.service.ts
│   ├── models/
│   │   └── order.model.ts
│   └── guards/
│       └── auth.guard.ts (bereits vorhanden)
```

### Routing
```typescript
// app-routing.module.ts oder restaurant-owner-routing.module.ts
{
  path: 'dashboard/orders',
  component: OrderOverviewComponent,
  canActivate: [AuthGuard],
  data: { role: 'restaurant_owner' }
}
```

### Environment Configuration
```typescript
// environment.dev.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: '' // Leer, weil Backend und Frontend auf selber Domain
};
```

---

## Bezug zu Anforderung.md

### Order Reception (aus Anforderung.md)
> Restaurantbesitzer haben eine Ansicht, in der eingehende Bestellungen in Echtzeit angezeigt werden.  
> Sie können Bestellungen annehmen oder ablehnen.  
> Zusätzlich können sie den Status der Bestellung aktualisieren, damit der Kunde jederzeit den aktuellen Stand sieht.

**Erfüllung durch dieses Feature:**
- ✅ **Ansicht**: `OrderOverviewComponent` zeigt alle Bestellungen
- ✅ **Echtzeit**: Automatisches Polling alle 30 Sekunden + manueller Refresh
- ✅ **Annehmen/Ablehnen**: User Story 4 & 5
- ✅ **Status aktualisieren**: User Story 6
- ✅ **Priorisierung**: User Story 2 stellt sicher, dass neue Bestellungen zuerst angezeigt werden
- ✅ **Übersichtlichkeit**: User Story 3 blendet abgeschlossene Bestellungen aus

### Vollständige Abdeckung der API (Feature 007)
Dieses Feature nutzt alle relevanten Endpunkte aus Feature 007:
- `GET /api/restaurants/:restaurantId/orders` → User Story 1
- `POST /api/orders/:orderId/accept` → User Story 4
- `POST /api/orders/:orderId/reject` → User Story 5
- `POST /api/orders/:orderId/status` → User Story 6

---

## Test-Szenarien

### Manueller Test mit existierenden Daten
1. Als Restaurant Owner einloggen
2. Zu `/dashboard/orders` navigieren
3. Verifizieren: Liste zeigt alle Bestellungen des Restaurants
4. Verifizieren: Pending-Bestellungen stehen ganz oben
5. Verifizieren: Abgeschlossene Bestellungen sind ausgeblendet
6. Toggle "Abgeschlossene Bestellungen anzeigen" aktivieren
7. Verifizieren: Abgeschlossene Bestellungen werden angezeigt
8. Pending-Bestellung annehmen
9. Verifizieren: Status ändert sich, Bestellung rutscht nach unten
10. Angenommene Bestellung auf "In Bearbeitung" setzen
11. Verifizieren: Status-Button wechselt zu "Fertig"
12. Alle Status-Übergänge durchgehen bis "Zugestellt"
13. Verifizieren: Bestellung verschwindet aus Liste (abgeschlossen)
14. Pending-Bestellung ablehnen mit Grund
15. Verifizieren: Dialog öffnet sich, Grund eingeben, Bestellung wird abgelehnt
16. Refresh-Button klicken
17. Verifizieren: Liste wird neu geladen

### Edge Cases
- Keine Bestellungen vorhanden → "Keine Bestellungen vorhanden" anzeigen
- API-Fehler (Backend offline) → Fehler-Snackbar + Retry-Möglichkeit
- Bestellung wird von anderem Client bearbeitet → 422 Error → Refresh
- Sehr lange Bestellliste → Pagination oder Virtual Scrolling (optional)
- Mobile Ansicht → Responsive Cards statt Tabelle

---

## Definition of Done

- ✅ Alle User Stories implementiert
- ✅ `OrderOverviewComponent` erstellt und getestet
- ✅ `OrderService` mit allen API-Methoden
- ✅ `RejectOrderDialogComponent` für Ablehnung mit Grund
- ✅ Routing und Auth Guard konfiguriert
- ✅ Material Design UI umgesetzt
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Fehlerbehandlung für alle API-Calls
- ✅ Snackbar-Notifications für Erfolg und Fehler
- ✅ Sortierung und Filterung funktioniert korrekt
- ✅ Automatisches Polling (optional) implementiert
- ✅ Code-Review durchgeführt
- ✅ Manuelle Tests auf allen Breakpoints
- ✅ Integration mit Feature 007 API verifiziert

---

## Out of Scope (für spätere Iterationen)

- **WebSocket-Integration** für Echtzeit-Updates ohne Polling
- **Benachrichtigungen** (Browser Notifications API) bei neuen Bestellungen
- **Filtern** nach Datum, Status, Kunde
- **Suchen** nach Bestellnummer oder Kundennamen
- **Exportieren** von Bestellungen (CSV, PDF)
- **Bulk-Actions** (mehrere Bestellungen gleichzeitig bearbeiten)
- **Detaillierte Status-Historie** mit allen Änderungen und Zeitstempeln
- **Schätzung** der Lieferzeit im Frontend (aktuell nur Anzeige)
- **Stornierung** durch Restaurant Owner (aktuell nur durch Kunde oder Ablehnung vor Annahme)

---

## Abhängigkeiten

- ✅ Feature 002: Authentication & Registration (Login für Restaurant Owner)
- ✅ Feature 007: Order Management API (alle benötigten Endpunkte)
- ✅ JWT-basierte Authentifizierung
- ✅ Angular Material installiert
- ✅ HttpClient und Interceptors konfiguriert

---

## Hinweise für Entwickler

### Best Practices
- **Keine Business-Logik in der Komponente**: Alle Sortierung, Filterung und Berechnungen in Hilfsmethoden auslagern
- **RxJS Operators nutzen**: `map`, `filter`, `catchError` für saubere API-Calls
- **Unsubscribe**: Alle Subscriptions in `ngOnDestroy` aufräumen (oder `async` Pipe verwenden)
- **Loading States**: Immer Loading-Spinner während API-Calls anzeigen
- **Optimistic Updates**: Status-Änderungen sofort im UI reflektieren, bei Fehler rollback
- **Error Handling**: 422-Fehler detailliert anzeigen, andere Fehler generisch

### Material Components
- `MatTable` für Bestellliste (Desktop)
- `MatCard` für Bestellliste (Mobile)
- `MatChip` für Status-Badges
- `MatButton` für Aktionen
- `MatDialog` für Ablehnungsdialog
- `MatSnackBar` für Notifications
- `MatSlideToggle` für "Abgeschlossene anzeigen"
- `MatIcon` für Icons
- `MatProgressSpinner` für Loading

### Accessibility
- Alle Buttons mit `aria-label`
- Status-Badges mit `aria-describedby`
- Keyboard-Navigation unterstützen
- Screen-Reader-freundliche Labels

---

## Zusammenfassung

Dieses Feature implementiert die vollständige Bestellübersicht für Restaurant Owner im Frontend. Es nutzt die bestehende Order Management API (Feature 007) und erfüllt alle Anforderungen aus `Anforderung.md` bezüglich Order Reception. Die Implementierung folgt strikt den Angular- und Material-Design-Guidelines und ist bereit für die Umsetzung durch das Entwicklungsteam ohne weitere Rückfragen.
