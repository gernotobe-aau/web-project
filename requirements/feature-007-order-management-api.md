# Feature 007: Order Management API - Bestellsystem Backend

## Übersicht
Dieses Feature implementiert die vollständige REST-API für das Bestellsystem der Food-Delivery-Plattform. Es ermöglicht Kunden, Bestellungen aufzugeben, und Restaurantbesitzern, eingehende Bestellungen zu verwalten. Die API ist testbar mit Postman und erfüllt alle Anforderungen aus `Anforderung.md` bezüglich Bestellabwicklung, Status-Tracking und Lieferzeitberechnung.

Die gesamte Business-Logik wird gemäß Repository Pattern implementiert. Alle Validierungen erfolgen ausschließlich im Backend (422 Unprocessable Entity bei Validierungsfehlern).

## Feature Goals
- Kunden können Bestellungen mit mehreren Gerichten aufgeben
- Voucher/Promotion-Codes werden validiert und angewendet
- Restaurantbesitzer können Bestellungen annehmen/ablehnen
- Status-Updates ermöglichen Echtzeit-Tracking für Kunden
- Geschätzte Lieferzeit wird automatisch berechnet
- Vollständige Audit-Trail durch Status-Historie
- API ist vollständig mit Postman testbar (inkl. Testdaten-Skripten)

## Acceptance Criteria
- ✅ Alle REST-Endpunkte sind unter `/api` prefixed
- ✅ Vollständige Backend-Validierung mit 422-Fehlerresponses
- ✅ Business-Logik ausschließlich in Service-Klassen
- ✅ Repository Pattern für alle Datenbankzugriffe
- ✅ JWT-basierte Authentifizierung für geschützte Endpunkte
- ✅ Rollenbasierte Autorisierung (Customer vs. RestaurantOwner)
- ✅ Testdaten-Skript zum Anlegen von Restaurants, Gerichten und Usern
- ✅ Postman Collection mit allen API-Calls und Testszenarien
- ✅ Dokumentation: Wie man jeden Use Case aus `Anforderung.md` testen kann

---

## User Story 1: Bestellung aufgeben (Customer)

**Als** eingeloggter Kunde  
**möchte ich** eine Bestellung mit mehreren Gerichten von einem Restaurant aufgeben können  
**damit** ich mein Essen geliefert bekomme.

### Acceptance Criteria
- ✅ POST `/api/orders` Endpunkt erstellen
- ✅ JWT-Token wird validiert (requireAuth Middleware)
- ✅ Rolle muss "customer" sein
- ✅ Request Body enthält:
  - `restaurantId` (UUID des Restaurants)
  - `items` (Array von {dishId, quantity})
  - `voucherCode` (optional, String)
  - `customerNotes` (optional, String)
- ✅ Backend-Validierungen:
  - Restaurant existiert und ist geöffnet (check opening_hours)
  - Alle Gerichte existieren und gehören zum selben Restaurant
  - Alle Gerichte sind verfügbar (nicht gelöscht)
  - Quantities sind > 0 und <= 99
  - Mindestens 1 Gericht im Warenkorb
  - Voucher-Code (falls angegeben) ist gültig und anwendbar
- ✅ Lieferadresse aus Customer-Profil als Snapshot in Order kopieren
- ✅ Preisberechnung:
  - Subtotal = Summe (dish.price * quantity)
  - Discount anwenden falls Voucher valid
  - Final Price = Subtotal - Discount
- ✅ Geschätzte Lieferzeit berechnen:
  - Längste cooking_time der bestellten Gerichte
  - +5-10 Minuten falls zwischen 17:00-19:00 Uhr (Stoßzeit)
  - +10 Minuten pauschale Lieferzeit
- ✅ Order Status auf "pending" setzen
- ✅ Order Items mit Dish-Snapshots (name, price) anlegen
- ✅ Order Status History Eintrag erstellen (status=pending)
- ✅ Falls Voucher verwendet: usage_count inkrementieren, usage_limit prüfen
- ✅ Response:
  - 201 Created
  - Order-Objekt mit ID, Status, estimated_delivery_minutes, final_price
- ✅ Error Responses:
  - 401 Unauthorized (kein/ungültiger Token)
  - 403 Forbidden (User ist kein Customer)
  - 404 Not Found (Restaurant oder Gerichte nicht gefunden)
  - 422 Unprocessable Entity (Validierungsfehler mit Details)
  - 409 Conflict (Restaurant geschlossen, Voucher nicht mehr gültig)

### Backend Architektur
- **Controller**: `OrderController.createOrder()`
  - Request validieren
  - Order Service aufrufen
  - Response mappen
- **Business Logic**: `OrderService.createOrder()`
  - Restaurant Validierung (existiert, geöffnet)
  - Gerichte validieren (existieren, gehören zu Restaurant)
  - Voucher validieren und Rabatt berechnen
  - Lieferzeit berechnen (Stoßzeitenlogik)
  - Order erstellen
  - OrderItems erstellen mit Snapshots
  - StatusHistory erstellen
  - Voucher usage_count updaten
- **Repository**: `OrderRepository`, `DishRepository`, `RestaurantRepository`, `VoucherRepository`

### Testbarkeit (Postman)
```
1. Setup: Testdaten-Skript ausführen
   - Restaurant "Pizza Mario" anlegen (owner1)
   - Gerichte: Margherita (8€, 15min), Salami (10€, 15min)
   - Voucher: "WELCOME10" (10% Rabatt, global)
   - Customer: max.mustermann@test.com

2. Test: Login als Customer
   POST /api/auth/login
   Body: {"email": "max.mustermann@test.com", "password": "Test1234!"}
   → Token speichern

3. Test: Bestellung ohne Voucher (Happy Path)
   POST /api/orders
   Headers: Authorization: Bearer <token>
   Body: {
     "restaurantId": "<restaurant-uuid>",
     "items": [
       {"dishId": 1, "quantity": 2},
       {"dishId": 2, "quantity": 1}
     ],
     "customerNotes": "Bitte klingeln"
   }
   → Erwartung: 201 Created
   → Prüfe: subtotal = 26€, discount = 0, final_price = 26€
   → Prüfe: estimated_delivery_minutes = 35 (15 cooking + 10 delivery + evtl. Stoßzeit)

4. Test: Bestellung mit Voucher
   POST /api/orders
   Body: { ..., "voucherCode": "WELCOME10" }
   → Erwartung: discount = 2.60€, final_price = 23.40€

5. Test: Geschlossenes Restaurant (409 Conflict)
   (Restaurant auf "closed" setzen via Update-Skript)
   POST /api/orders → Erwartung: 409 mit Message "Restaurant is closed"

6. Test: Ungültige Quantity (422 Validation Error)
   Body: { ..., "items": [{"dishId": 1, "quantity": 0}] }
   → Erwartung: 422 mit Fehlerdetails

7. Test: Gerichte von verschiedenen Restaurants (422)
   Body: { ..., "items": [{"dishId": 1}, {"dishId": 999}] }
   → Erwartung: 422 "All dishes must belong to the same restaurant"

8. Test: Als RestaurantOwner versuchen zu bestellen (403)
   Login als RestaurantOwner → POST /api/orders
   → Erwartung: 403 Forbidden
```

---

## User Story 2: Eigene Bestellungen abrufen (Customer)

**Als** eingeloggter Kunde  
**möchte ich** meine Bestellungen mit aktuellem Status sehen können  
**damit** ich den Fortschritt verfolgen kann.

### Acceptance Criteria
- ✅ GET `/api/orders` Endpunkt (listet eigene Bestellungen)
- ✅ GET `/api/orders/:id` Endpunkt (Details zu einer Bestellung)
- ✅ JWT-Token validieren, Rolle "customer"
- ✅ Query Parameters für GET `/api/orders`:
  - `status` (optional): Filter nach Status (z.B. "pending", "delivered")
  - `limit` (optional, default 50): Max. Anzahl Ergebnisse
  - `offset` (optional, default 0): Pagination
- ✅ Response enthält:
  - Order-Daten mit Restaurant-Info (Name, Adresse)
  - Order Items mit Dish-Snapshots
  - Aktueller Status
  - Alle Timestamps (created_at, accepted_at, delivered_at, etc.)
  - Estimated delivery time
- ✅ GET `/api/orders/:id`:
  - Prüfe, ob Order dem eingeloggten Customer gehört
  - Inkl. vollständige Status-History
- ✅ Error Responses:
  - 401 Unauthorized
  - 403 Forbidden (nicht eigene Bestellung)
  - 404 Not Found

### Backend Architektur
- **Controller**: `OrderController.getMyOrders()`, `OrderController.getOrderById()`
- **Business Logic**: `OrderService.getCustomerOrders()`, `OrderService.getOrderDetails()`
- **Repository**: `OrderRepository.findByCustomerId()`, `OrderRepository.findById()`

### Testbarkeit (Postman)
```
1. Test: Alle eigenen Bestellungen abrufen
   GET /api/orders
   Headers: Authorization: Bearer <customer-token>
   → Erwartung: 200 OK, Array von Orders

2. Test: Filter nach Status
   GET /api/orders?status=delivered
   → Erwartung: Nur Bestellungen mit Status "delivered"

3. Test: Pagination
   GET /api/orders?limit=10&offset=0

4. Test: Bestelldetails abrufen
   GET /api/orders/<order-id>
   → Erwartung: Vollständige Order mit Items und History

5. Test: Fremde Bestellung abrufen (403)
   (Als customer2 einloggen, Order von customer1 abrufen)
   → Erwartung: 403 Forbidden
```

---

## User Story 3: Eingehende Bestellungen abrufen (RestaurantOwner)

**Als** eingeloggter Restaurantbesitzer  
**möchte ich** alle Bestellungen für meine Restaurants sehen  
**damit** ich sie verwalten kann.

### Acceptance Criteria
- ✅ GET `/api/restaurants/:restaurantId/orders` Endpunkt
- ✅ JWT-Token validieren, Rolle "restaurant_owner"
- ✅ Autorisierung: User muss Owner des Restaurants sein
- ✅ Query Parameters:
  - `status` (optional): Filter nach Status
  - `date` (optional): Filter nach Bestelldatum (YYYY-MM-DD)
  - `limit`, `offset`: Pagination
- ✅ Response:
  - Array von Orders mit Customer-Info (Name, Lieferadresse)
  - Order Items
  - Status
  - Timestamps
- ✅ Error Responses:
  - 401 Unauthorized
  - 403 Forbidden (nicht Owner des Restaurants)
  - 404 Not Found

### Backend Architektur
- **Controller**: `RestaurantController.getRestaurantOrders()`
- **Business Logic**: `OrderService.getRestaurantOrders()`
  - Prüfe: User ist Owner des Restaurants
- **Repository**: `OrderRepository.findByRestaurantId()`

### Testbarkeit (Postman)
```
1. Setup: Login als RestaurantOwner
   POST /api/auth/login
   Body: {"email": "owner@pizzamario.com", "password": "Owner1234!"}

2. Test: Alle Bestellungen des Restaurants
   GET /api/restaurants/<restaurant-id>/orders
   Headers: Authorization: Bearer <owner-token>
   → Erwartung: 200 OK, Array von Orders

3. Test: Filter nach pending
   GET /api/restaurants/<restaurant-id>/orders?status=pending
   → Erwartung: Nur neue Bestellungen

4. Test: Fremdes Restaurant (403)
   (Als owner2 einloggen, Orders von restaurant1 abrufen)
   → Erwartung: 403 Forbidden

5. Test: Filter nach Datum
   GET /api/restaurants/<restaurant-id>/orders?date=2026-01-27
```

---

## User Story 4: Bestellung annehmen/ablehnen (RestaurantOwner)

**Als** Restaurantbesitzer  
**möchte ich** eingehende Bestellungen annehmen oder ablehnen können  
**damit** ich nur die Bestellungen zubereite, die ich erfüllen kann.

### Acceptance Criteria
- ✅ POST `/api/orders/:id/accept` Endpunkt
- ✅ POST `/api/orders/:id/reject` Endpunkt
- ✅ JWT-Token validieren, Rolle "restaurant_owner"
- ✅ Autorisierung: User muss Owner des Restaurants sein (zu dem die Order gehört)
- ✅ Accept:
  - Status muss "pending" sein
  - Status auf "accepted" setzen
  - `accepted_at` Timestamp setzen
  - Status History Eintrag erstellen
- ✅ Reject:
  - Status muss "pending" sein
  - Status auf "rejected" setzen
  - `rejected_at` Timestamp setzen
  - Optional: `restaurant_notes` im Request Body (Grund für Ablehnung)
  - Status History Eintrag mit notes erstellen
- ✅ Response:
  - 200 OK mit aktualisiertem Order-Objekt
- ✅ Error Responses:
  - 401 Unauthorized
  - 403 Forbidden (nicht Owner)
  - 404 Not Found
  - 409 Conflict (Status ist nicht "pending", z.B. bereits accepted)

### Backend Architektur
- **Controller**: `OrderController.acceptOrder()`, `OrderController.rejectOrder()`
- **Business Logic**: `OrderService.acceptOrder()`, `OrderService.rejectOrder()`
  - Prüfe: User ist Owner des Restaurants
  - Prüfe: Status ist "pending"
  - Status updaten
  - Timestamps setzen
  - History erstellen
- **Repository**: `OrderRepository.updateStatus()`, `OrderStatusHistoryRepository.create()`

### Testbarkeit (Postman)
```
1. Setup: Bestellung von Customer erstellen (siehe User Story 1)

2. Test: Bestellung annehmen (Happy Path)
   POST /api/orders/<order-id>/accept
   Headers: Authorization: Bearer <owner-token>
   → Erwartung: 200 OK
   → Prüfe: status = "accepted", accepted_at gesetzt

3. Test: Bestellung ablehnen mit Begründung
   POST /api/orders/<order-id2>/reject
   Body: {"restaurantNotes": "Leider ausverkauft"}
   → Erwartung: 200 OK
   → Prüfe: status = "rejected", rejected_at gesetzt

4. Test: Bereits angenommene Bestellung nochmal annehmen (409)
   POST /api/orders/<order-id>/accept
   → Erwartung: 409 Conflict "Order is not in pending status"

5. Test: Fremde Bestellung annehmen (403)
   (Als owner2 einloggen, Order von restaurant1 annehmen)
   → Erwartung: 403 Forbidden

6. Test: Bestellung ablehnen und dann annehmen (409)
   POST /api/orders/<order-id>/reject → 200 OK
   POST /api/orders/<order-id>/accept → 409 Conflict
```

---

## User Story 5: Bestellstatus aktualisieren (RestaurantOwner)

**Als** Restaurantbesitzer  
**möchte ich** den Status einer Bestellung aktualisieren können  
**damit** der Kunde den Fortschritt sehen kann.

### Acceptance Criteria
- ✅ PATCH `/api/orders/:id/status` Endpunkt
- ✅ JWT-Token validieren, Rolle "restaurant_owner"
- ✅ Autorisierung: User muss Owner des Restaurants sein
- ✅ Request Body:
  - `status` (String, required): Neuer Status
  - `notes` (String, optional): Notizen
- ✅ Erlaubte Status-Übergänge:
  - `accepted` → `preparing`
  - `preparing` → `ready`
  - `ready` → `delivering`
  - `delivering` → `delivered`
  - Jeder Status (außer rejected/delivered) → `cancelled`
- ✅ Validierungen:
  - Status-Übergang muss erlaubt sein
  - Order darf nicht bereits in End-Status sein (rejected, delivered, cancelled)
- ✅ Bei jedem Update:
  - Entsprechenden Timestamp setzen (preparing_started_at, ready_at, etc.)
  - Status History Eintrag erstellen
- ✅ Response:
  - 200 OK mit aktualisiertem Order-Objekt
- ✅ Error Responses:
  - 401 Unauthorized
  - 403 Forbidden
  - 404 Not Found
  - 409 Conflict (ungültiger Status-Übergang)
  - 422 Unprocessable Entity (ungültiger Status)

### Backend Architektur
- **Controller**: `OrderController.updateOrderStatus()`
- **Business Logic**: `OrderService.updateOrderStatus()`
  - Prüfe: Owner-Autorisierung
  - Validiere Status-Übergang (State Machine)
  - Update Status und Timestamp
  - History erstellen
- **Repository**: `OrderRepository.updateStatus()`

### Testbarkeit (Postman)
```
1. Setup: Bestellung erstellen und annehmen (siehe vorherige Stories)

2. Test: Status-Übergang accepted → preparing
   PATCH /api/orders/<order-id>/status
   Headers: Authorization: Bearer <owner-token>
   Body: {"status": "preparing"}
   → Erwartung: 200 OK, status = "preparing", preparing_started_at gesetzt

3. Test: Status-Übergang preparing → ready
   PATCH /api/orders/<order-id>/status
   Body: {"status": "ready", "notes": "Essen ist fertig!"}
   → Erwartung: 200 OK, ready_at gesetzt

4. Test: Status-Übergang ready → delivering
   PATCH /api/orders/<order-id>/status
   Body: {"status": "delivering"}
   → Erwartung: 200 OK, delivering_started_at gesetzt

5. Test: Status-Übergang delivering → delivered
   PATCH /api/orders/<order-id>/status
   Body: {"status": "delivered"}
   → Erwartung: 200 OK, delivered_at gesetzt

6. Test: Ungültiger Status-Übergang (409)
   PATCH /api/orders/<order-id>/status
   Body: {"status": "preparing"} (von delivered zurück)
   → Erwartung: 409 Conflict "Invalid status transition"

7. Test: Bestellung stornieren
   PATCH /api/orders/<order-id2>/status
   Body: {"status": "cancelled", "notes": "Kunde hat storniert"}
   → Erwartung: 200 OK

8. Test: Bereits gelieferte Bestellung updaten (409)
   PATCH /api/orders/<delivered-order-id>/status
   → Erwartung: 409 "Order is already in final status"
```

---

## User Story 6: Voucher validieren (API-Utility)

**Als** System  
**möchte ich** einen Endpunkt zum Validieren von Voucher-Codes bereitstellen  
**damit** Frontends bereits vor der Bestellung Feedback geben können.

### Acceptance Criteria
- ✅ POST `/api/vouchers/validate` Endpunkt
- ✅ Kein Auth erforderlich (öffentlicher Endpunkt)
- ✅ Request Body:
  - `code` (String): Voucher-Code
  - `restaurantId` (UUID, optional): Für restaurant-spezifische Voucher
  - `orderAmount` (Number, optional): Bestellwert für Preview
- ✅ Validierungen:
  - Code existiert (case-insensitive)
  - is_active = true
  - Aktuelles Datum liegt zwischen valid_from und valid_until
  - usage_limit nicht überschritten (falls gesetzt)
  - Falls restaurant_id angegeben: Voucher muss global ODER für dieses Restaurant sein
- ✅ Response:
  - 200 OK mit:
    - `valid: true/false`
    - `discount_type`, `discount_value` (falls valid)
    - `calculated_discount` (falls orderAmount angegeben)
    - `message` (z.B. "Voucher expired", "Usage limit reached")
- ✅ Error Responses:
  - 404 Not Found (Code existiert nicht)
  - 422 Unprocessable Entity (ungültiger Request)

### Backend Architektur
- **Controller**: `VoucherController.validateVoucher()`
- **Business Logic**: `VoucherService.validateVoucher()`
  - Alle Validierungen
  - Rabatt-Preview berechnen
- **Repository**: `VoucherRepository.findByCode()`

### Testbarkeit (Postman)
```
1. Test: Gültiger globaler Voucher
   POST /api/vouchers/validate
   Body: {"code": "WELCOME10", "orderAmount": 30}
   → Erwartung: 200 OK
   → Response: {
       "valid": true,
       "discount_type": "percentage",
       "discount_value": 10,
       "calculated_discount": 3,
       "message": "Voucher is valid"
     }

2. Test: Abgelaufener Voucher
   POST /api/vouchers/validate
   Body: {"code": "EXPIRED2025"}
   → Erwartung: 200 OK
   → Response: {"valid": false, "message": "Voucher has expired"}

3. Test: Usage Limit erreicht
   (Voucher mit limit=1 bereits 1x verwendet)
   → Response: {"valid": false, "message": "Usage limit reached"}

4. Test: Restaurant-spezifischer Voucher
   POST /api/vouchers/validate
   Body: {"code": "MARIO20", "restaurantId": "<pizza-mario-id>"}
   → Erwartung: valid = true

5. Test: Falsches Restaurant
   Body: {"code": "MARIO20", "restaurantId": "<other-restaurant-id>"}
   → Erwartung: valid = false, "Voucher not valid for this restaurant"

6. Test: Nicht existierender Code
   POST /api/vouchers/validate
   Body: {"code": "FAKE123"}
   → Erwartung: 404 Not Found
```
## User Story 8: Testdaten-Setup-Skript

**Als** Entwickler  
**möchte ich** ein Skript zum Erstellen von Testdaten haben  
**damit** ich die API schnell mit Postman testen kann.

### Acceptance Criteria
- ✅ Node.js Skript `backend/src/db/seed-order-test-data.ts`
- ✅ Erstellt:
  - 2 Customers (mit verschiedenen Adressen)
  - 2 RestaurantOwners
  - 2 Restaurants (mit Öffnungszeiten)
  - Kategorien und Gerichte (mit verschiedenen cooking_times)
  - 3 Vouchers (global, restaurant-spezifisch, abgelaufen)
- ✅ Passwörter für alle User: "Test1234!"
- ✅ Gibt Credentials und IDs in Console aus
- ✅ Idempotent: Kann mehrmals ausgeführt werden (prüft ob Daten existieren)
- ✅ Ausführbar via: `npm run seed:orders`

### Testdaten-Übersicht
```
CUSTOMERS:
- max.mustermann@test.com / Test1234!
  (Lieferadresse: Teststraße 1, 1010 Wien)
- anna.schmidt@test.com / Test1234!
  (Lieferadresse: Beispielweg 5, 1020 Wien)

RESTAURANT OWNERS:
- owner@pizzamario.com / Test1234!
- owner@burgerking.com / Test1234!

RESTAURANTS:
- Pizza Mario (Wien, italienisch)
  - Kategorie "Pizzen": Margherita (8€, 15min), Salami (10€, 15min)
  - Kategorie "Pasta": Carbonara (12€, 20min)
  - Öffnungszeiten: Mo-So 11:00-22:00
- Burger Palace (Wien, amerikanisch)
  - Kategorie "Burgers": Cheeseburger (9€, 10min)
  - Öffnungszeiten: Mo-So 12:00-23:00

VOUCHERS:
- WELCOME10 (10% Rabatt, global, unbegrenzt)
- MARIO20 (20% Rabatt, nur Pizza Mario, limit=5)
- EXPIRED2025 (5€ Rabatt, abgelaufen)
```

### Testbarkeit
```
1. Skript ausführen:
   cd backend
   npm run seed:orders

2. Console zeigt:
   ===========================
   TEST DATA CREATED
   ===========================
   Customer 1: max.mustermann@test.com / Test1234!
   Customer 2: anna.schmidt@test.com / Test1234!
   Owner 1: owner@pizzamario.com / Test1234!
   Owner 2: owner@burgerking.com / Test1234!
   
   Restaurant: Pizza Mario (ID: <uuid>)
   Restaurant: Burger Palace (ID: <uuid>)
   
   Vouchers: WELCOME10, MARIO20, EXPIRED2025

3. Daten in Datenbank prüfen:
   SELECT * FROM customers;
   SELECT * FROM restaurants;
   SELECT * FROM dishes;
   SELECT * FROM vouchers;
```

---

## User Story 9: Postman Collection mit vollständigen Testszenarien

**Als** Entwickler / QA  
**möchte ich** eine Postman Collection mit allen API-Endpunkten und Testfällen  
**damit** ich das gesamte Bestellsystem durchspielen kann.

### Acceptance Criteria
- ✅ Postman Collection JSON-Datei: `backend/postman/Order-Management-API.postman_collection.json`
- ✅ Environment-Datei: `backend/postman/Development.postman_environment.json`
- ✅ Organisiert in Folders:
  - Setup (Login Requests)
  - Customer: Place Orders
  - Customer: View Orders
  - Restaurant Owner: Manage Orders
  - Vouchers
  - Error Cases
- ✅ Jeder Request hat:
  - Beschreibung des Testfalls
  - Pre-request Scripts (z.B. Token setzen)
  - Tests (Assertions auf Status Code, Response Body)
- ✅ Collection Runner kann alle Requests nacheinander ausführen
- ✅ Dokumentation in `backend/postman/README.md`

### Postman Collection Struktur
```
Order Management API/
├── Setup/
│   ├── Login as Customer (max.mustermann)
│   ├── Login as Customer (anna.schmidt)
│   ├── Login as Owner (Pizza Mario)
│   └── Login as Owner (Burger Palace)
│
├── Customer - Place Orders/
│   ├── Create Order - Happy Path (no voucher)
│   ├── Create Order - With Voucher WELCOME10
│   ├── Create Order - Multiple Dishes
│   ├── Create Order - Restaurant Closed (Error 409)
│   ├── Create Order - Invalid Quantity (Error 422)
│   └── Create Order - Dishes from Different Restaurants (Error 422)
│
├── Customer - View Orders/
│   ├── Get My Orders (All)
│   ├── Get My Orders (Filter by Status)
│   ├── Get My Orders (Pagination)
│   ├── Get Order Details by ID
│   ├── Get Order Details - Not Own Order (Error 403)
│   └── Get Orders with Filters (Date, Price)
│
├── Restaurant Owner - Manage Orders/
│   ├── Get Restaurant Orders (All)
│   ├── Get Restaurant Orders (Filter Pending)
│   ├── Accept Order
│   ├── Reject Order (with notes)
│   ├── Update Status: preparing
│   ├── Update Status: ready
│   ├── Update Status: delivering
│   ├── Update Status: delivered
│   ├── Accept Already Accepted Order (Error 409)
│   ├── Invalid Status Transition (Error 409)
│   └── Manage Order from Other Restaurant (Error 403)
│
├── Vouchers/
│   ├── Validate Voucher - Valid Global
│   ├── Validate Voucher - Valid Restaurant-Specific
│   ├── Validate Voucher - Expired (Error)
│   ├── Validate Voucher - Usage Limit Reached
│   ├── Validate Voucher - Wrong Restaurant
│   └── Validate Voucher - Non-existent Code (Error 404)
│
└── Error Cases/
    ├── Create Order - Unauthorized (No Token)
    ├── Create Order - Forbidden (RestaurantOwner tries)
    ├── Accept Order - Unauthorized
    └── Get Orders - Invalid Token
```

### Environment Variables
```json
{
  "name": "Development",
  "values": [
    {"key": "baseUrl", "value": "http://localhost:3000/api"},
    {"key": "customerToken", "value": ""},
    {"key": "ownerToken", "value": ""},
    {"key": "restaurantId", "value": ""},
    {"key": "orderId", "value": ""}
  ]
}
```

### Beispiel: Test Script für "Create Order"
```javascript
// Tests für "Create Order - Happy Path"
pm.test("Status code is 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has order ID", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.id).to.be.a('string');
    pm.environment.set("orderId", jsonData.id); // Für folgende Requests
});

pm.test("Order status is pending", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.order_status).to.eql("pending");
});

pm.test("Final price is calculated correctly", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.final_price).to.be.a('number');
    pm.expect(jsonData.final_price).to.be.above(0);
});

pm.test("Estimated delivery time is present", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.estimated_delivery_minutes).to.be.a('number');
});
```

### Dokumentation (`backend/postman/README.md`)
```markdown
# Order Management API - Postman Testing Guide

## Setup
1. Testdaten erstellen:
   cd backend
   npm run seed:orders

2. Server starten:
   npm run dev

3. Postman öffnen und Collection importieren:
   - Order-Management-API.postman_collection.json
   - Development.postman_environment.json

4. Environment "Development" auswählen

## Testing Workflow

### Schritt 1: Login
1. Führe "Setup > Login as Customer (max.mustermann)" aus
   → Token wird automatisch in Environment Variable gespeichert

### Schritt 2: Bestellung erstellen
1. "Customer - Place Orders > Create Order - Happy Path"
   → Order ID wird in Environment gespeichert

### Schritt 3: Bestellung verwalten (als RestaurantOwner)
1. Führe "Setup > Login as Owner (Pizza Mario)" aus
2. "Restaurant Owner > Get Restaurant Orders" (siehst du die neue Bestellung?)
3. "Restaurant Owner > Accept Order"
4. "Restaurant Owner > Update Status: preparing"
5. Weiter durch alle Status bis "delivered"

### Schritt 4: Bestellung als Customer ansehen
1. Wechsle zurück zu Customer Token
2. "Customer - View Orders > Get Order Details by ID"
   → Status sollte "delivered" sein

## Collection Runner
Um alle Tests automatisch durchzulaufen:
1. Klicke auf "Run collection"
2. Wähle alle Folders aus
3. Delay zwischen Requests: 500ms
4. Run Order Management API

## Bekannte Testfälle

### Happy Path (vollständiger Lifecycle)
1. Login Customer → 2. Create Order → 3. Login Owner → 4. Accept Order
→ 5. Update Status (preparing/ready/delivering/delivered) → 6. Customer views delivered order

### Error Cases
- Restaurant geschlossen: Setze `is_closed=1` für Öffnungszeit, dann Order erstellen → 409
- Ungültiger Voucher: Verwende "EXPIRED2025" → 200 OK aber valid=false
- Fremde Bestellung akzeptieren: Login als owner2, versuche Order von restaurant1 zu akzeptieren → 403
```

---

## User Story 10: API-Dokumentation mit vollständigen Beispielen

**Als** Entwickler  
**möchte ich** eine umfassende API-Dokumentation  
**damit** ich alle Endpunkte, Requests und Responses verstehe.

### Acceptance Criteria
- ✅ Markdown-Datei: `backend/docs/order-management-api.md`
- ✅ Für jeden Endpunkt:
  - HTTP Methode und URL
  - Authentifizierung (JWT, Rolle)
  - Request Body Schema (mit Typen und Constraints)
  - Response Schema (Success + Error Cases)
  - Beispiel-Request (curl)
  - Beispiel-Response (JSON)
- ✅ Status-Übergangs-Diagramm (Mermaid)
- ✅ Voucher-Validierungslogik-Flussdiagramm
- ✅ Lieferzeit-Berechnungslogik erklärt

### Dokumentations-Struktur
```markdown
# Order Management API Documentation

## Übersicht
Diese API ermöglicht das vollständige Management von Bestellungen...

## Authentifizierung
Alle geschützten Endpunkte erfordern JWT-Token...

## Endpunkte

### POST /api/orders - Bestellung erstellen
**Auth:** Required (Customer)
**Request Body:**
...
**Response:** 201 Created
...
**Errors:**
- 401 Unauthorized
- 422 Validation Error
...

### GET /api/orders - Eigene Bestellungen abrufen
...

### Status-Workflow
[Mermaid-Diagramm]
```

---

## Technische Implementierungsdetails

### Repository Pattern
```typescript
// order.repository.ts
export class OrderRepository {
  async create(orderData: CreateOrderData): Promise<Order> { ... }
  async findById(id: string): Promise<Order | null> { ... }
  async findByCustomerId(customerId: string, filters: OrderFilters): Promise<Order[]> { ... }
  async findByRestaurantId(restaurantId: string, filters: OrderFilters): Promise<Order[]> { ... }
  async updateStatus(orderId: string, status: OrderStatus, timestamp: Date): Promise<void> { ... }
  async addStatusHistory(orderId: string, status: OrderStatus, notes?: string): Promise<void> { ... }
}

// order-item.repository.ts
export class OrderItemRepository {
  async createBatch(orderId: string, items: OrderItemData[]): Promise<void> { ... }
  async findByOrderId(orderId: string): Promise<OrderItem[]> { ... }
}

// voucher.repository.ts
export class VoucherRepository {
  async findByCode(code: string): Promise<Voucher | null> { ... }
  async incrementUsageCount(voucherId: number): Promise<void> { ... }
}
```

### Business Logic Services
```typescript
// order.service.ts
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private orderItemRepo: OrderItemRepository,
    private dishRepo: DishRepository,
    private restaurantRepo: RestaurantRepository,
    private voucherRepo: VoucherRepository
  ) {}

  async createOrder(customerId: string, data: CreateOrderDTO): Promise<Order> {
    // 1. Validate restaurant exists and is open
    // 2. Validate all dishes exist and belong to restaurant
    // 3. Validate voucher (if provided)
    // 4. Calculate prices
    // 5. Calculate estimated delivery time
    // 6. Create order
    // 7. Create order items (with snapshots)
    // 8. Create status history entry
    // 9. Increment voucher usage count
    // 10. Return order
  }

  async acceptOrder(orderId: string, ownerId: string): Promise<Order> {
    // 1. Load order
    // 2. Verify owner authorization
    // 3. Verify status is "pending"
    // 4. Update status to "accepted"
    // 5. Set accepted_at timestamp
    // 6. Create status history entry
    // 7. Return updated order
  }

  async updateOrderStatus(orderId: string, ownerId: string, newStatus: OrderStatus, notes?: string): Promise<Order> {
    // 1. Load order
    // 2. Verify owner authorization
    // 3. Validate status transition (state machine)
    // 4. Update status
    // 5. Set corresponding timestamp
    // 6. Create status history entry
    // 7. Return updated order
  }

  private calculateEstimatedDeliveryTime(dishes: Dish[], orderTime: Date): number {
    // Longest cooking time
    const maxCookingTime = Math.max(...dishes.map(d => d.cooking_time_minutes));
    let estimatedMinutes = maxCookingTime + 10; // Base delivery time
    
    // Peak hours (17:00 - 19:00)
    const hour = orderTime.getHours();
    if (hour >= 17 && hour < 19) {
      estimatedMinutes += Math.floor(Math.random() * 6) + 5; // +5 to +10 minutes
    }
    
    return estimatedMinutes;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivering', 'cancelled'],
      delivering: ['delivered', 'cancelled'],
      rejected: [], // Final state
      delivered: [], // Final state
      cancelled: [] // Final state
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}

// voucher.service.ts
export class VoucherService {
  async validateVoucher(code: string, restaurantId?: string, orderAmount?: number): Promise<VoucherValidationResult> {
    const voucher = await this.voucherRepo.findByCode(code);
    if (!voucher) {
      return { valid: false, message: "Voucher not found" };
    }

    // Check active
    if (!voucher.is_active) {
      return { valid: false, message: "Voucher is inactive" };
    }

    // Check validity period
    const now = new Date();
    if (now < new Date(voucher.valid_from) || now > new Date(voucher.valid_until)) {
      return { valid: false, message: "Voucher has expired" };
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return { valid: false, message: "Usage limit reached" };
    }

    // Check restaurant restriction
    if (voucher.restaurant_id && restaurantId && voucher.restaurant_id !== restaurantId) {
      return { valid: false, message: "Voucher not valid for this restaurant" };
    }

    // Calculate discount
    let calculatedDiscount = 0;
    if (orderAmount) {
      if (voucher.discount_type === 'percentage') {
        calculatedDiscount = (orderAmount * voucher.discount_value) / 100;
      } else {
        calculatedDiscount = voucher.discount_value;
      }
    }

    return {
      valid: true,
      message: "Voucher is valid",
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      calculated_discount: calculatedDiscount
    };
  }
}
```

### Controllers
```typescript
// order.controller.ts
export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user already set by requireAuth middleware
      const customerId = req.user!.id;
      const orderData = req.body;

      // Basic request validation (detailed validation in service)
      if (!orderData.restaurantId || !orderData.items || orderData.items.length === 0) {
        return res.status(422).json({
          error: "Validation Error",
          details: ["restaurantId and items are required"]
        });
      }

      const order = await this.orderService.createOrder(customerId, orderData);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  async acceptOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.id;
      const orderId = req.params.id;

      const order = await this.orderService.acceptOrder(orderId, ownerId);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  // ... weitere Methoden
}
```

### Error Handling
```typescript
// Custom Error Classes
export class ValidationError extends Error {
  constructor(public details: string[]) {
    super("Validation Error");
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

// Error Middleware (error.middleware.ts)
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(422).json({
      error: "Validation Error",
      details: err.details
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: "Forbidden",
      message: err.message
    });
  }

  if (err instanceof ConflictError) {
    return res.status(409).json({
      error: "Conflict",
      message: err.message
    });
  }

  // ... weitere Error Types

  // Default: 500 Internal Server Error
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred"
  });
}
```

### Routes
```typescript
// order.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController(/* inject dependencies */);

// Customer routes
router.post('/orders', requireAuth, requireRole('customer'), orderController.createOrder);
router.get('/orders', requireAuth, requireRole('customer'), orderController.getMyOrders);
router.get('/orders/:id', requireAuth, requireRole('customer'), orderController.getOrderById);

// Restaurant Owner routes
router.get('/restaurants/:restaurantId/orders', requireAuth, requireRole('restaurant_owner'), orderController.getRestaurantOrders);
router.post('/orders/:id/accept', requireAuth, requireRole('restaurant_owner'), orderController.acceptOrder);
router.post('/orders/:id/reject', requireAuth, requireRole('restaurant_owner'), orderController.rejectOrder);
router.patch('/orders/:id/status', requireAuth, requireRole('restaurant_owner'), orderController.updateOrderStatus);

export default router;
```

---

## Definition of Done

- ✅ Alle 10 User Stories sind implementiert
- ✅ Alle Endpunkte sind unter `/api` prefixed
- ✅ Business Logic vollständig in Service-Klassen
- ✅ Repository Pattern für alle DB-Zugriffe
- ✅ Vollständige Backend-Validierung mit 422-Responses
- ✅ JWT-Authentifizierung und Rollenbasierte Autorisierung
- ✅ Error Handling mit klaren HTTP Status Codes
- ✅ Testdaten-Skript funktioniert und ist dokumentiert
- ✅ Postman Collection mit allen Tests ist lauffähig
- ✅ API-Dokumentation ist vollständig
- ✅ Code folgt TypeScript Best Practices
- ✅ Alle Funktionen sind mit Postman manuell getestet
- ✅ Status-Übergangs-State-Machine ist korrekt implementiert
- ✅ Lieferzeit-Berechnung mit Stoßzeiten funktioniert
- ✅ Voucher-Validierung mit allen Edge Cases funktioniert
- ✅ Order Items werden als Snapshots gespeichert
- ✅ Timestamps werden korrekt gesetzt
- ✅ Status History wird bei jedem Übergang erstellt

---

## Abhängigkeiten

- Feature 006 (Database Extension) muss abgeschlossen sein
- Feature 002 (Authentication) muss funktionieren (JWT-Middleware)
- Feature 003 (Menu Management) muss abgeschlossen sein (Dishes existieren)

---

## Testing Checkliste

### Manuelle Tests mit Postman
- [ ] Kompletter Happy Path: Customer erstellt Order → Owner akzeptiert → Status-Updates bis delivered
- [ ] Voucher-Validierung: Alle Cases (valid, expired, limit reached, wrong restaurant)
- [ ] Preisberechnung: Mit und ohne Voucher, Prozentual und Fixed Amount
- [ ] Lieferzeit-Berechnung: Normale Zeit vs. Stoßzeiten
- [ ] Status-Übergänge: Alle erlaubten Übergänge funktionieren
- [ ] Status-Übergänge: Ungültige Übergänge werden abgelehnt (409)
- [ ] Autorisierung: Customer kann keine fremden Orders sehen
- [ ] Autorisierung: Owner kann nur eigene Restaurant-Orders verwalten
- [ ] Autorisierung: Customer kann keine Orders akzeptieren (403)
- [ ] Autorisierung: Owner kann keine Orders erstellen (403)
- [ ] Geschlossenes Restaurant: Order wird abgelehnt (409)
- [ ] Ungültige Quantities: 0, negative, > 99 werden abgelehnt (422)
- [ ] Gerichte von verschiedenen Restaurants: Wird abgelehnt (422)
- [ ] Filter und Pagination: Funktionieren korrekt
- [ ] Order Items: Snapshots werden korrekt gespeichert
- [ ] Status History: Wird bei jedem Übergang erstellt

### Edge Cases
- [ ] Order mit 0 Items → 422
- [ ] Order mit dish_id = 999999 (nicht existent) → 404
- [ ] Voucher mit usage_limit=1 zweimal verwenden → zweites Mal rejected
- [ ] Restaurant während Bestellung-Creation geschlossen → 409
- [ ] Order mit negativem Preis → sollte durch Constraints verhindert werden
- [ ] Sehr große Quantity (1000) → sollte durch Validierung abgelehnt werden

---

## Notizen für Entwickler

### Wichtige Validierungen im Backend
1. **Quantities**: min=1, max=99
2. **Restaurant Status**: Muss "open" sein (check opening_hours für aktuellen Wochentag + Zeit)
3. **Dish Ownership**: Alle Gerichte müssen zum selben Restaurant gehören
4. **Voucher Validierung**: active, valid_from <= now <= valid_until, usage_count < usage_limit
5. **Status Transitions**: Verwende State Machine Pattern
6. **Owner Authorization**: Bei allen Owner-Endpunkten prüfen, ob User Owner des Restaurants ist

### Performance-Überlegungen
- Index auf `(customer_id, created_at)` für schnelle Customer-Order-Queries
- Index auf `(restaurant_id, order_status, created_at)` für Owner-Dashboard
- Index auf `(voucher.code)` für schnelle Voucher-Lookups
- Eager Loading: Order mit Items und Restaurant-Info in einem Query laden

### Sicherheit
- Niemals sensitive Daten in Error Messages (z.B. "User X tried to access Order Y")
- Alle Preise im Backend berechnen, niemals Client-Preisen vertrauen
- Voucher usage_count atomar inkrementieren (Transaktionen)
- SQL Injection: Prepared Statements verwenden

### Zukünftige Erweiterungen (nicht in diesem Feature)
- Push Notifications bei Status-Änderungen
- Echtzeit-Updates via WebSockets
- Payment Integration
- Bewertungen abgeben (separate Story)
- Analytics Dashboard für Owner (separate Story)
