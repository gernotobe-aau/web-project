# Feature: Datenbank-Erweiterung für Bestellungen, Bewertungen und Voucher

Dieses Feature erweitert die bestehende Datenbankstruktur um alle notwendigen Tabellen und Beziehungen, die für das vollständige Bestell-, Bewertungs- und Voucher-System erforderlich sind. Die Erweiterung bildet die technische Grundlage für alle zukünftigen Features im Bereich Order Management, Feedback und Promotions.

## Ziel

Die Datenbank muss erweitert werden, um folgende Funktionalitäten zu unterstützen:
- **Bestellungen**: Kunden können Bestellungen mit mehreren Gerichten aufgeben
- **Bestellstatus-Tracking**: Vom Absenden bis zur Lieferung mit Zeitstempel
- **Voucher/Promotion-Codes**: Prozentuale und Festbetrag-Rabatte
- **Bewertungen**: Kunden können Restaurants und einzelne Gerichte bewerten
- **Kochzeiten**: Für die Berechnung der geschätzten Lieferzeit

Das Team teilt sich nach diesem Feature auf, daher muss die Datenbankstruktur vollständig und konsistent sein, sodass verschiedene Teams parallel an Order Management, Feedback und anderen Features arbeiten können.

## Acceptance Criteria:

- ✅ Alle Tabellen für Bestellungen, Bestellpositionen, Status-Historie sind definiert
- ✅ Voucher-Tabelle mit Unterstützung für prozentuale und Festbetrag-Rabatte ist implementiert
- ✅ Bewertungstabellen für Restaurants und Gerichte sind angelegt
- ✅ Kochzeit-Feld bei Gerichten ist vorhanden
- ✅ Alle Foreign Keys und Constraints sind korrekt definiert
- ✅ Indizes für Performance-kritische Queries sind angelegt
- ✅ Die Migration ist rückwärtskompatibel zur bestehenden Datenbank
- ✅ Datenbankschema dokumentiert die Beziehungen zwischen allen Tabellen
- ✅ Validierungsregeln sind auf Datenbankebene implementiert wo möglich

---

## User Story 1: Bestellungen erfassen

**Als Entwickler** möchte ich eine Tabelle für Bestellungen (orders) haben, **sodass** ich Kundenbestellungen mit allen relevanten Informationen speichern kann und das Order Management Team parallel daran arbeiten kann.

### Acceptance Criteria:

- ✅ `orders` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (UUID, Primary Key)
  - `customer_id` (UUID, Foreign Key zu customers)
  - `restaurant_id` (UUID, Foreign Key zu restaurants)
  - `order_status` (ENUM/TEXT: 'pending', 'accepted', 'rejected', 'preparing', 'ready', 'delivering', 'delivered')
  - `total_price` (DECIMAL/REAL, Gesamtpreis vor Rabatt)
  - `discount_amount` (DECIMAL/REAL, Rabattbetrag, default 0)
  - `final_price` (DECIMAL/REAL, Endpreis nach Rabatt)
  - `voucher_code` (TEXT, nullable, Foreign Key zu vouchers)
  - `estimated_delivery_time` (INTEGER, in Minuten)
  - `delivery_street` (TEXT, vom Kunden-Profil kopiert zum Zeitpunkt der Bestellung)
  - `delivery_house_number` (TEXT)
  - `delivery_staircase` (TEXT, nullable)
  - `delivery_door` (TEXT, nullable)
  - `delivery_postal_code` (TEXT)
  - `delivery_city` (TEXT)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)
  - `accepted_at` (DATETIME, nullable)
  - `rejected_at` (DATETIME, nullable)
  - `delivered_at` (DATETIME, nullable)

- ✅ Foreign Key Constraint auf `customer_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `restaurant_id` mit ON DELETE CASCADE
- ✅ Index auf `customer_id` für schnelle Customer-Order-Lookups
- ✅ Index auf `restaurant_id` für schnelle Restaurant-Order-Lookups
- ✅ Index auf `order_status` für Statusfilterung
- ✅ Index auf `created_at` für zeitbasierte Queries (Analytics)
- ✅ CHECK Constraint: `final_price >= 0`
- ✅ CHECK Constraint: `discount_amount >= 0`
- ✅ Lieferadresse wird beim Erstellen der Bestellung aus dem Kundenprofil kopiert (nicht referenziert), sodass spätere Änderungen der Kundenadresse alte Bestellungen nicht beeinflussen

---

## User Story 2: Bestellpositionen speichern

**Als Entwickler** möchte ich eine Tabelle für Bestellpositionen (order_items) haben, **sodass** ich alle Gerichte einer Bestellung mit Menge und Preis zum Zeitpunkt der Bestellung speichern kann.

### Acceptance Criteria:

- ✅ `order_items` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (INTEGER, Primary Key, AUTOINCREMENT)
  - `order_id` (UUID, Foreign Key zu orders)
  - `dish_id` (UUID, Foreign Key zu dishes)
  - `dish_name` (TEXT, Name des Gerichts zum Bestellzeitpunkt)
  - `dish_price` (DECIMAL/REAL, Preis zum Bestellzeitpunkt)
  - `quantity` (INTEGER, Anzahl des Gerichts)
  - `subtotal` (DECIMAL/REAL, dish_price * quantity)
  - `created_at` (DATETIME)

- ✅ Foreign Key Constraint auf `order_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `dish_id` mit ON DELETE SET NULL (historische Daten bleiben erhalten, auch wenn Gericht gelöscht wird)
- ✅ Index auf `order_id` für schnelle Order-Items-Lookups
- ✅ CHECK Constraint: `quantity > 0`
- ✅ CHECK Constraint: `dish_price >= 0`
- ✅ CHECK Constraint: `subtotal >= 0`
- ✅ Dish-Name und Preis werden zum Zeitpunkt der Bestellung kopiert, sodass spätere Änderungen am Gericht die Bestellhistorie nicht verfälschen

---

## User Story 3: Bestellstatus-Historie verfolgen

**Als Entwickler** möchte ich eine Tabelle für Bestellstatus-Historie (order_status_history) haben, **sodass** ich jeden Statuswechsel einer Bestellung mit Zeitstempel nachvollziehen kann.

### Acceptance Criteria:

- ✅ `order_status_history` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (INTEGER, Primary Key, AUTOINCREMENT)
  - `order_id` (UUID, Foreign Key zu orders)
  - `status` (TEXT: 'pending', 'accepted', 'rejected', 'preparing', 'ready', 'delivering', 'delivered')
  - `changed_at` (DATETIME, default CURRENT_TIMESTAMP)
  - `notes` (TEXT, nullable, für optionale Notizen)

- ✅ Foreign Key Constraint auf `order_id` mit ON DELETE CASCADE
- ✅ Index auf `order_id` und `changed_at` für chronologische Statusabfragen
- ✅ Die Historie ermöglicht es, die komplette Bestellhistorie nachzuvollziehen (wann wurde akzeptiert, wann in Bearbeitung, etc.)

---

## User Story 4: Voucher/Promotion-Codes verwalten
a
**Als Entwickler** möchte ich eine Tabelle für Voucher (vouchers) haben, **sodass** Promotion-Codes mit prozentualen oder Festbetrag-Rabatten gespeichert und validiert werden können.

### Acceptance Criteria:

- ✅ `vouchers` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (INTEGER, Primary Key, AUTOINCREMENT)
  - `code` (TEXT, UNIQUE, NOT NULL, der eigentliche Voucher-Code, z.B. "SUMMER2026")
  - `discount_type` (TEXT: 'percentage' oder 'fixed_amount')
  - `discount_value` (DECIMAL/REAL, Wert des Rabatts, z.B. 10 für 10% oder 5 für 5€)
  - `min_order_value` (DECIMAL/REAL, nullable, Mindestbestellwert für Voucher-Anwendung)
  - `max_discount_amount` (DECIMAL/REAL, nullable, maximaler Rabattbetrag bei prozentualen Rabatten)
  - `valid_from` (DATETIME, Gültigkeitsbeginn)
  - `valid_until` (DATETIME, Gültigkeitsende)
  - `usage_limit` (INTEGER, nullable, maximale Anzahl von Verwendungen gesamt)
  - `usage_count` (INTEGER, default 0, aktuelle Anzahl der Verwendungen)
  - `is_active` (BOOLEAN, default 1, für manuelle Deaktivierung)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

- ✅ UNIQUE Constraint auf `code` (case-insensitive)
- ✅ Index auf `code` für schnelle Voucher-Lookups
- ✅ CHECK Constraint: `discount_value > 0`
- ✅ CHECK Constraint: `discount_type IN ('percentage', 'fixed_amount')`
- ✅ CHECK Constraint: Bei 'percentage': `discount_value <= 100`
- ✅ CHECK Constraint: `usage_count >= 0`
- ✅ CHECK Constraint: `valid_until > valid_from`
- ✅ Voucher können sowohl global als auch restaurant-spezifisch sein (für spätere Erweiterung)

---

## User Story 5: Restaurant-Bewertungen speichern

**Als Entwickler** möchte ich eine Tabelle für Restaurant-Bewertungen (restaurant_reviews) haben, **sodass** Kunden Restaurants mit Sternen und optionalem Text bewerten können.

### Acceptance Criteria:

- ✅ `restaurant_reviews` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (INTEGER, Primary Key, AUTOINCREMENT)
  - `restaurant_id` (UUID, Foreign Key zu restaurants)
  - `customer_id` (UUID, Foreign Key zu customers)
  - `order_id` (UUID, nullable, Foreign Key zu orders, Referenz zur Bestellung)
  - `rating` (INTEGER, Sterne-Bewertung 1-5)
  - `comment` (TEXT, nullable, optionaler Text)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

- ✅ Foreign Key Constraint auf `restaurant_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `customer_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `order_id` mit ON DELETE SET NULL
- ✅ UNIQUE Constraint auf (`restaurant_id`, `customer_id`, `order_id`) - ein Kunde kann ein Restaurant nur einmal pro Bestellung bewerten
- ✅ Index auf `restaurant_id` für schnelle Restaurant-Review-Lookups
- ✅ Index auf `customer_id` für Customer-Review-Historie
- ✅ CHECK Constraint: `rating BETWEEN 1 AND 5`
- ✅ Durchschnittsbewertung kann über Aggregation berechnet werden

---

## User Story 6: Gericht-Bewertungen speichern

**Als Entwickler** möchte ich eine Tabelle für Gericht-Bewertungen (dish_reviews) haben, **sodass** Kunden einzelne Gerichte mit Sternen und optionalem Text bewerten können.

### Acceptance Criteria:

- ✅ `dish_reviews` Tabelle ist angelegt mit folgenden Feldern:
  - `id` (INTEGER, Primary Key, AUTOINCREMENT)
  - `dish_id` (UUID, Foreign Key zu dishes)
  - `customer_id` (UUID, Foreign Key zu customers)
  - `order_id` (UUID, nullable, Foreign Key zu orders)
  - `rating` (INTEGER, Sterne-Bewertung 1-5)
  - `comment` (TEXT, nullable, optionaler Text)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

- ✅ Foreign Key Constraint auf `dish_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `customer_id` mit ON DELETE CASCADE
- ✅ Foreign Key Constraint auf `order_id` mit ON DELETE SET NULL
- ✅ UNIQUE Constraint auf (`dish_id`, `customer_id`, `order_id`) - ein Kunde kann ein Gericht nur einmal pro Bestellung bewerten
- ✅ Index auf `dish_id` für schnelle Dish-Review-Lookups
- ✅ Index auf `customer_id` für Customer-Review-Historie
- ✅ CHECK Constraint: `rating BETWEEN 1 AND 5`
- ✅ Durchschnittsbewertung kann über Aggregation berechnet werden

---

## User Story 7: Kochzeiten für Lieferzeitberechnung

**Als Entwickler** möchte ich, dass Gerichte eine Kochzeit haben, **sodass** die geschätzte Lieferzeit gemäß der Anforderungen berechnet werden kann.

### Acceptance Criteria:

- ✅ `dishes` Tabelle wird erweitert um:
  - `cooking_time_minutes` (INTEGER, default 15, Kochzeit in Minuten)

- ✅ Migration fügt das Feld zu bestehenden Dishes mit Standardwert 15 hinzu
- ✅ CHECK Constraint: `cooking_time_minutes > 0`
- ✅ Wert ist editierbar über das Menu Management
- ✅ Die Berechnung der geschätzten Lieferzeit erfolgt gemäß Anforderung:
  - Längste Kochzeit aller Gerichte in der Bestellung
  - +5-10 Minuten zwischen 17:00 und 19:00 Uhr (Stoßzeiten)
  - +10 Minuten pauschale Lieferzeit

---

## User Story 8: Analytics-Datenbasis

**Als Entwickler** möchte ich, dass die Datenbankstruktur effiziente Analytics-Queries unterstützt, **sodass** Restaurant-Besitzer Statistiken über Bestellungen und beliebte Gerichte abrufen können.

### Acceptance Criteria:

- ✅ Indizes auf `orders.created_at` für zeitbasierte Aggregationen
- ✅ Indizes auf `order_items.dish_id` für Dish-Popularity-Queries
- ✅ Indizes auf `orders.restaurant_id` und `orders.created_at` kombiniert für Restaurant-Analytics
- ✅ Query zur Berechnung von Bestellungen pro Tag/Woche ist performant
- ✅ Query zur Berechnung der meistbestellten Gerichte ist performant
- ✅ Alle Zeitstempel sind konsistent in UTC/ISO 8601 Format gespeichert

---

## User Story 9: Datenintegrität und Konsistenz

**Als Entwickler** möchte ich, dass die Datenbank referentielle Integrität garantiert, **sodass** keine inkonsistenten Daten entstehen können.

### Acceptance Criteria:

- ✅ Alle Foreign Keys haben explizite ON DELETE Strategien:
  - CASCADE wo Child-Daten ohne Parent keinen Sinn ergeben
  - SET NULL wo historische Daten erhalten bleiben sollen
- ✅ CHECK Constraints validieren:
  - Positive Preise und Mengen
  - Gültige Rating-Werte (1-5)
  - Gültige ENUM-Werte für Status und Discount-Types
  - Prozentuale Rabatte ≤ 100%
- ✅ UNIQUE Constraints verhindern:
  - Doppelte Voucher-Codes
  - Mehrfache Bewertungen derselben Bestellung durch denselben Kunden
- ✅ NOT NULL Constraints auf allen Business-kritischen Feldern
- ✅ Default-Werte sind sinnvoll gesetzt (z.B. discount_amount = 0, usage_count = 0)

---

## User Story 10: Migration und Rückwärtskompatibilität

**Als Entwickler** möchte ich eine saubere Migration, **sodass** die bestehende Datenbank erweitert wird ohne Datenverlust und das Team sich aufteilen kann.

### Acceptance Criteria:

- ✅ Migration-Datei `005_orders_and_reviews_system.sql` ist erstellt
- ✅ Migration wird über den bestehenden Migration-Runner ausgeführt
- ✅ Bestehende Tabellen (customers, restaurant_owners, restaurants, categories, dishes) bleiben unverändert (außer Erweiterung von dishes um cooking_time_minutes)
- ✅ Migration ist idempotent (kann mehrfach ausgeführt werden ohne Fehler)
- ✅ Migration enthält `IF NOT EXISTS` für alle CREATE TABLE Statements
- ✅ Testdaten können optional eingefügt werden für Entwicklungszwecke
- ✅ Migration wird im `_migrations` Tracking registriert

---

## Technische Details und Datenbankschema-Übersicht

### Entity-Relationship-Modell

```
CUSTOMERS (1) ----< (M) ORDERS (M) >---- (1) RESTAURANTS
                        |
                        | (1)
                        |
                        v (M)
                   ORDER_ITEMS
                        |
                        | (M)
                        |
                        v (1)
                      DISHES
                        |
                        +---- (1:M) DISH_REVIEWS (M:1) ---- CUSTOMERS
                        |
                        +---- cooking_time_minutes (für Zeitberechnung)

RESTAURANTS (1) ----< (M) RESTAURANT_REVIEWS (M) >---- (1) CUSTOMERS

ORDERS (M) >---- (0..1) VOUCHERS (eindeutiger Code)

ORDERS (1) ----< (M) ORDER_STATUS_HISTORY
```

### Status-Flow für Bestellungen

```
pending (Bestellung abgegeben)
   |
   +---> accepted (vom Restaurant angenommen)
   |        |
   |        +---> preparing (in Bearbeitung)
   |        |        |
   |        |        +---> ready (fertig)
   |        |        |        |
   |        |        |        +---> delivering (wird geliefert)
   |        |        |        |        |
   |        |        |        |        +---> delivered (geliefert)
   |        |        |        |
   |        |        |        +---> delivered (direkt von ready)
   |        |        |
   |        |        +---> ready -> delivered (ohne delivering bei Abholung)
   |        |
   |        +---> rejected (abgelehnt)
   |
   +---> rejected (direkt abgelehnt)
```

### Datentypen und Konventionen

- **UUIDs**: TEXT (SQLite-kompatibel, z.B. '550e8400-e29b-41d4-a716-446655440000')
- **Preise**: REAL (SQLite Floating-Point, für Produktionssysteme ggf. INTEGER in Cent erwägen)
- **Zeitstempel**: DATETIME / TEXT in ISO 8601 Format (YYYY-MM-DD HH:MM:SS)
- **Booleans**: INTEGER (0 = false, 1 = true, SQLite-Standard)
- **ENUMs**: TEXT mit CHECK Constraints

### Performance-Indizes

```sql
-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_restaurant_created ON orders(restaurant_id, created_at);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_dish ON order_items(dish_id);

-- Order Status History
CREATE INDEX idx_order_status_history_order_time ON order_status_history(order_id, changed_at);

-- Vouchers
CREATE UNIQUE INDEX idx_vouchers_code ON vouchers(code COLLATE NOCASE);

-- Restaurant Reviews
CREATE INDEX idx_restaurant_reviews_restaurant ON restaurant_reviews(restaurant_id);
CREATE INDEX idx_restaurant_reviews_customer ON restaurant_reviews(customer_id);

-- Dish Reviews
CREATE INDEX idx_dish_reviews_dish ON dish_reviews(dish_id);
CREATE INDEX idx_dish_reviews_customer ON dish_reviews(customer_id);
```

---

## Beispiel-Queries für zukünftige Features

### Bestellungen eines Kunden abrufen
```sql
SELECT o.*, r.name as restaurant_name 
FROM orders o
JOIN restaurants r ON o.restaurant_id = r.id
WHERE o.customer_id = ?
ORDER BY o.created_at DESC;
```

### Bestellpositionen einer Bestellung
```sql
SELECT oi.*, d.name, d.photo_url
FROM order_items oi
LEFT JOIN dishes d ON oi.dish_id = d.id
WHERE oi.order_id = ?;
```

### Durchschnittsbewertung eines Restaurants
```sql
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM restaurant_reviews
WHERE restaurant_id = ?;
```

### Meistbestellte Gerichte eines Restaurants (Analytics)
```sql
SELECT d.name, SUM(oi.quantity) as total_ordered
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN dishes d ON oi.dish_id = d.id
WHERE o.restaurant_id = ? 
  AND o.created_at BETWEEN ? AND ?
GROUP BY oi.dish_id, d.name
ORDER BY total_ordered DESC
LIMIT 10;
```

### Bestellungen pro Tag (Analytics)
```sql
SELECT DATE(created_at) as order_date, COUNT(*) as order_count
FROM orders
WHERE restaurant_id = ?
  AND created_at BETWEEN ? AND ?
GROUP BY order_date
ORDER BY order_date;
```

### Voucher validieren
```sql
SELECT * FROM vouchers
WHERE code = ? COLLATE NOCASE
  AND is_active = 1
  AND datetime('now') BETWEEN valid_from AND valid_until
  AND (usage_limit IS NULL OR usage_count < usage_limit);
```

---

## Offene Punkte für zukünftige Iterationen

Diese Aspekte werden in späteren Features implementiert:

- **Real-time Notifications**: WebSocket/Server-Sent Events für Live-Updates bei Statusänderungen
- **Payment Integration**: Zahlungsmethoden und Transaktionen
- **Delivery Tracking**: GPS-Koordinaten und Echtzeit-Tracking
- **Customer-spezifische Vouchers**: Vouchers pro Kunde statt global
- **Restaurant-spezifische Vouchers**: Vouchers die nur bei bestimmten Restaurants gelten
- **Bewertungs-Moderation**: Reporting und Moderationssystem für Reviews
- **Favoriten**: Kunden können Restaurants und Gerichte als Favoriten markieren
- **Bestellhistorie-Export**: Export von Bestellungen als PDF/CSV
- **Advanced Analytics**: Umsatz-Tracking, Gewinn-Margen, Trend-Analysen

---

## Implementierungs-Hinweise für Entwickler

### Backend (Migration)
1. Erstelle `backend/src/db/migrations/005_orders_and_reviews_system.sql`
2. Implementiere alle Tabellen gemäß den Spezifikationen oben
3. Füge CHECK Constraints, FOREIGN KEYS und INDICES hinzu
4. Teste die Migration auf einer Kopie der Entwicklungsdatenbank
5. Führe die Migration über den bestehenden Migration-Runner aus

### Backend (Repositories - Optional für diese Iteration)
Falls Repositories bereits erstellt werden sollen (nicht Teil dieser Iteration, aber zur Vorbereitung):
- `order.repository.ts`
- `voucher.repository.ts`
- `review.repository.ts`

### Testing
1. Teste Foreign Key Constraints (CASCADE und SET NULL)
2. Teste CHECK Constraints (negative Werte, ungültige Ratings, etc.)
3. Teste UNIQUE Constraints (doppelte Voucher-Codes, mehrfache Reviews)
4. Teste Performance mit Mock-Daten (1000+ Orders, 10000+ Order Items)
5. Teste alle Beispiel-Queries oben

### Datenbankgröße und Performance
- SQLite sollte für MVP ausreichend sein (bis ~100.000 Bestellungen)
- Bei Produktionseinsatz ggf. PostgreSQL erwägen
- Indizes regelmäßig mit `ANALYZE` optimieren

---

## Definition of Done

- [ ] Migration-Datei `005_orders_and_reviews_system.sql` ist erstellt
- [ ] Alle 9 Tabellen sind korrekt definiert (orders, order_items, order_status_history, vouchers, restaurant_reviews, dish_reviews, dishes mit cooking_time_minutes)
- [ ] Alle Foreign Keys, CHECK Constraints und UNIQUE Constraints sind implementiert
- [ ] Alle Performance-Indizes sind angelegt
- [ ] Migration läuft fehlerfrei auf Development-Datenbank
- [ ] Migration wird im `_migrations` Tracking registriert
- [ ] Bestehende Daten bleiben erhalten
- [ ] Alle Beispiel-Queries aus diesem Dokument funktionieren
- [ ] Dokumentation im Code (SQL-Kommentare) ist vorhanden
- [ ] Team wurde über neue Tabellen und Schema informiert
- [ ] Schema-Diagramm wurde aktualisiert (optional, falls vorhanden)

