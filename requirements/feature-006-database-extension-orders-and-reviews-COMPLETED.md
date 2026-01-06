# Database Migration 005 - Implementation Summary

## ✅ Feature 006: Datenbank-Erweiterung für Bestellungen, Bewertungen und Voucher

### Implementiert am: 2026-01-06

---

## Übersicht

Die Datenbank wurde erfolgreich um alle notwendigen Tabellen für das vollständige Bestell-, Bewertungs- und Voucher-System erweitert. Die Migration ist rückwärtskompatibel und alle Tests sind erfolgreich durchgelaufen.

---

## Implementierte Tabellen

### 1. **orders** - Bestellungen
- UUID als Primary Key
- Vollständige Order-Status-Verwaltung (pending → accepted → preparing → ready → delivering → delivered)
- Lieferadresse wird zum Bestellzeitpunkt aus Kundenprofil kopiert
- Unterstützung für Voucher/Rabatte
- Geschätzte Lieferzeit
- Zeitstempel für alle Statusübergänge
- Foreign Keys: customer_id, restaurant_id, voucher_id

**Constraints:**
- ✅ final_price >= 0
- ✅ discount_amount >= 0
- ✅ order_status IN (pending, accepted, rejected, preparing, ready, delivering, delivered, cancelled)

**Indizes:**
- ✅ idx_orders_customer
- ✅ idx_orders_restaurant
- ✅ idx_orders_status
- ✅ idx_orders_created
- ✅ idx_orders_restaurant_created (composite für Analytics)

---

### 2. **order_items** - Bestellpositionen
- Jede Position speichert Gericht-Name und Preis zum Bestellzeitpunkt (Snapshot)
- Quantity und Subtotal pro Position
- Foreign Keys: order_id, dish_id (ON DELETE SET NULL für historische Daten)

**Constraints:**
- ✅ quantity > 0
- ✅ dish_price >= 0
- ✅ subtotal >= 0

**Indizes:**
- ✅ idx_order_items_order
- ✅ idx_order_items_dish

---

### 3. **order_status_history** - Bestellstatus-Historie
- Vollständige Nachverfolgung aller Statusänderungen
- Zeitstempel für jeden Statuswechsel
- Optionale Notizen

**Indizes:**
- ✅ idx_order_status_history_order_time (composite)

---

### 4. **vouchers** - Gutschein-Codes
- Unterstützung für prozentuale und Festbetrag-Rabatte
- Gültigkeitszeitraum (valid_from, valid_until)
- Usage Limits und Usage Count
- Restaurant-spezifische oder globale Vouchers
- Case-insensitive Code-Validierung

**Constraints:**
- ✅ discount_value > 0
- ✅ discount_type IN (percentage, fixed_amount)
- ✅ usage_count >= 0
- ✅ valid_until > valid_from
- ✅ UNIQUE constraint auf code (NOCASE)

**Indizes:**
- ✅ idx_vouchers_code (UNIQUE, NOCASE)

**Sample Vouchers:**
- WELCOME10: 10% Rabatt
- SAVE5: 5€ Festbetrag

---

### 5. **restaurant_reviews** - Restaurant-Bewertungen
- Rating 1-5 Sterne
- Optionaler Kommentar
- Link zu Bestellung (optional)
- Ein Kunde kann ein Restaurant nur einmal pro Bestellung bewerten

**Constraints:**
- ✅ rating BETWEEN 1 AND 5
- ✅ UNIQUE(restaurant_id, customer_id, order_id)

**Indizes:**
- ✅ idx_restaurant_reviews_restaurant
- ✅ idx_restaurant_reviews_customer

---

### 6. **dish_reviews** - Gericht-Bewertungen
- Rating 1-5 Sterne
- Optionaler Kommentar
- Link zu Bestellung (optional)
- Ein Kunde kann ein Gericht nur einmal pro Bestellung bewerten

**Constraints:**
- ✅ rating BETWEEN 1 AND 5
- ✅ UNIQUE(dish_id, customer_id, order_id)

**Indizes:**
- ✅ idx_dish_reviews_dish
- ✅ idx_dish_reviews_customer

---

### 7. **dishes** - Erweiterung
- Neues Feld: `cooking_time_minutes` (INTEGER, default 15)
- Für Berechnung der geschätzten Lieferzeit

**Constraint:**
- ✅ cooking_time_minutes > 0

---

## Triggers

Alle Tabellen mit `updated_at` Feldern haben automatische Timestamp-Updates:
- ✅ update_orders_timestamp
- ✅ update_vouchers_timestamp
- ✅ update_restaurant_reviews_timestamp
- ✅ update_dish_reviews_timestamp

---

## Getestete Queries

### 1. Bestellungen pro Tag (Analytics)
```sql
SELECT DATE(created_at) as order_date, COUNT(*) as order_count
FROM orders
WHERE restaurant_id = ?
GROUP BY order_date
ORDER BY order_date DESC;
```
**Status:** ✅ Funktioniert

---

### 2. Meistbestellte Gerichte (Analytics)
```sql
SELECT d.name, SUM(oi.quantity) as total_ordered
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
LEFT JOIN dishes d ON oi.dish_id = d.id
WHERE o.restaurant_id = ?
GROUP BY oi.dish_id, d.name
ORDER BY total_ordered DESC
LIMIT 10;
```
**Status:** ✅ Funktioniert

---

### 3. Durchschnittsbewertung Restaurant
```sql
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM restaurant_reviews
WHERE restaurant_id = ?;
```
**Status:** ✅ Funktioniert

---

### 4. Bestellstatus-Historie
```sql
SELECT status, changed_at
FROM order_status_history
WHERE order_id = ?
ORDER BY changed_at ASC;
```
**Status:** ✅ Funktioniert

---

### 5. Voucher-Validierung
```sql
SELECT * FROM vouchers
WHERE code = ? COLLATE NOCASE
  AND is_active = 1
  AND datetime('now') BETWEEN valid_from AND valid_until
  AND (usage_limit IS NULL OR usage_count < usage_limit);
```
**Status:** ✅ Funktioniert

---

## Datenintegrität

### Foreign Key Strategien
- **CASCADE**: orders → customer_id, restaurant_id (wenn Parent gelöscht, auch Children)
- **SET NULL**: order_items → dish_id (historische Daten bleiben erhalten)
- **SET NULL**: reviews → order_id (Reviews bleiben auch ohne Order)

### CHECK Constraints
Alle getestet und funktionieren:
- ✅ Negative Preise werden abgelehnt
- ✅ Ungültige Order-Status werden abgelehnt
- ✅ Ratings außerhalb 1-5 werden abgelehnt
- ✅ Quantity <= 0 wird abgelehnt
- ✅ Ungültige Discount-Types werden abgelehnt

### UNIQUE Constraints
- ✅ Voucher-Codes sind eindeutig (case-insensitive)
- ✅ Ein Kunde kann ein Restaurant nur einmal pro Bestellung bewerten
- ✅ Ein Kunde kann ein Gericht nur einmal pro Bestellung bewerten

---

## Performance

### Indizes
Insgesamt **13 Indizes** für optimale Query-Performance:
- Single-column indexes für Foreign Keys
- Composite indexes für Analytics (restaurant_id + created_at)
- Unique indexes für Voucher-Codes

### Geschätzte Kapazität
- SQLite sollte für MVP ausreichend sein (bis ~100.000 Bestellungen)
- Bei Produktionseinsatz ggf. PostgreSQL erwägen
- Alle Queries mit Index-Support für schnelle Abfragen

---

## Lieferzeitberechnung

Gemäß Anforderung:
1. **Längste Kochzeit** aller Gerichte in der Bestellung
2. **+5-10 Minuten** zwischen 17:00 und 19:00 Uhr (Stoßzeiten)
3. **+10 Minuten** pauschale Lieferzeit

Beispiel:
- Gericht A: 15 Minuten
- Gericht B: 20 Minuten
- Bestellung um 18:30 Uhr
- **Gesamt: 20 + 7.5 + 10 = 37.5 Minuten** (aufgerundet auf 40)

Diese Logik wird in der Business Layer implementiert.

---

## Nächste Schritte

Die Datenbankstruktur ist nun vollständig für folgende zukünftige Features:

1. **Order Management** (Team 1)
   - Repositories: order.repository.ts
   - Business Logic: order.service.ts
   - Controllers: order.controller.ts
   - Routes: order.routes.ts

2. **Review System** (Team 2)
   - Repositories: review.repository.ts
   - Business Logic: review.service.ts
   - Controllers: review.controller.ts
   - Routes: review.routes.ts

3. **Voucher System** (Team 3)
   - Repositories: voucher.repository.ts
   - Business Logic: voucher.service.ts
   - Controllers: voucher.controller.ts
   - Routes: voucher.routes.ts

4. **Analytics Dashboard** (Team 4)
   - Business Logic: analytics.service.ts
   - Controllers: analytics.controller.ts
   - Routes: analytics.routes.ts

---

## Test-Scripts

Erstellt zur Validierung:
- ✅ `backend/check-tables.js` - Überprüft Tabellen und Struktur
- ✅ `backend/check-constraints.js` - Testet alle Constraints
- ✅ `backend/check-analytics.js` - Testet Analytics-Queries

---

## Migration-File

**Datei:** `backend/src/db/migrations/005_orders_and_reviews_system.sql`

**Status:** ✅ Erfolgreich ausgeführt und im `_migrations` Tracking registriert

---

## Definition of Done - Status

✅ Alle Tabellen für Bestellungen, Bestellpositionen, Status-Historie sind definiert  
✅ Voucher-Tabelle mit Unterstützung für prozentuale und Festbetrag-Rabatte ist implementiert  
✅ Bewertungstabellen für Restaurants und Gerichte sind angelegt  
✅ Kochzeit-Feld bei Gerichten ist vorhanden  
✅ Alle Foreign Keys und Constraints sind korrekt definiert  
✅ Indizes für Performance-kritische Queries sind angelegt  
✅ Die Migration ist rückwärtskompatibel zur bestehenden Datenbank  
✅ Datenbankschema dokumentiert die Beziehungen zwischen allen Tabellen  
✅ Validierungsregeln sind auf Datenbankebene implementiert wo möglich  

---

## Fazit

Feature 006 wurde vollständig und erfolgreich implementiert. Die Datenbank ist nun bereit für die Implementierung aller Order Management, Review und Voucher Features. Das Team kann sich jetzt aufteilen und parallel arbeiten.

**Status:** ✅ **COMPLETED**
