# Food Delivery Platform - Datenbankmodell

## Übersicht

Dieses Dokument beschreibt das vollständige Datenbankschema der Food-Delivery-Plattform.

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    %% ============================================================================
    %% USERS AND AUTHENTICATION
    %% ============================================================================
    
    customers ||--o{ orders : "places"
    customers ||--o{ restaurant_reviews : "writes"
    customers ||--o{ dish_reviews : "writes"
    
    restaurant_owners ||--o{ restaurants : "owns"
    
    %% ============================================================================
    %% RESTAURANTS
    %% ============================================================================
    
    restaurants ||--o{ restaurant_categories : "has"
    restaurants ||--o{ opening_hours : "has"
    restaurants ||--o{ categories : "manages"
    restaurants ||--o{ dishes : "offers"
    restaurants ||--o{ orders : "receives"
    restaurants ||--o{ restaurant_reviews : "receives"
    restaurants ||--o| vouchers : "creates"
    
    %% ============================================================================
    %% MENU MANAGEMENT
    %% ============================================================================
    
    categories ||--o{ dishes : "contains"
    dishes ||--o{ dish_reviews : "receives"
    dishes ||--o{ order_items : "is ordered in"
    
    %% ============================================================================
    %% ORDERS
    %% ============================================================================
    
    orders ||--o{ order_items : "contains"
    orders ||--o{ order_status_history : "has history"
    orders ||--o| restaurant_reviews : "can be reviewed via"
    orders ||--o{ dish_reviews : "can review dishes via"
    orders }o--|| vouchers : "uses"
    
    %% ============================================================================
    %% ENTITÄTEN
    %% ============================================================================
    
    customers {
        TEXT id PK "UUID"
        TEXT first_name "NOT NULL, 1-30 Zeichen"
        TEXT last_name "NOT NULL, 1-30 Zeichen"
        TEXT birth_date "NOT NULL, ISO 8601, mind. 16 Jahre"
        TEXT email "NOT NULL, UNIQUE, als Username"
        TEXT password_hash "NOT NULL, gehasht"
        TEXT delivery_street "NOT NULL"
        TEXT delivery_house_number "NOT NULL"
        TEXT delivery_staircase "NULL"
        TEXT delivery_door "NULL"
        TEXT delivery_postal_code "NOT NULL"
        TEXT delivery_city "NOT NULL"
        DATETIME created_at "DEFAULT CURRENT_TIMESTAMP"
        DATETIME updated_at "DEFAULT CURRENT_TIMESTAMP"
    }
    
    restaurant_owners {
        TEXT id PK "UUID"
        TEXT first_name "NOT NULL, 1-30 Zeichen"
        TEXT last_name "NOT NULL, 1-30 Zeichen"
        TEXT birth_date "NOT NULL, ISO 8601, mind. 18 Jahre"
        TEXT email "NOT NULL, UNIQUE, als Username"
        TEXT password_hash "NOT NULL, gehasht"
        DATETIME created_at "DEFAULT CURRENT_TIMESTAMP"
        DATETIME updated_at "DEFAULT CURRENT_TIMESTAMP"
    }
    
    restaurants {
        TEXT id PK "UUID"
        TEXT owner_id FK "NOT NULL"
        TEXT name "NOT NULL, eindeutig pro Stadt"
        TEXT street "NOT NULL"
        TEXT house_number "NOT NULL"
        TEXT staircase "NULL"
        TEXT door "NULL"
        TEXT postal_code "NOT NULL"
        TEXT city "NOT NULL"
        TEXT contact_phone "NOT NULL"
        TEXT contact_email "NULL"
        DATETIME created_at "DEFAULT CURRENT_TIMESTAMP"
        DATETIME updated_at "DEFAULT CURRENT_TIMESTAMP"
    }
    
    restaurant_categories {
        TEXT restaurant_id FK "NOT NULL"
        TEXT category "NOT NULL, aus Config-File"
    }
    
    opening_hours {
        INTEGER id PK "AUTOINCREMENT"
        TEXT restaurant_id FK "NOT NULL"
        INTEGER day_of_week "NOT NULL, 0=Sonntag...6=Samstag"
        TEXT open_time "HH:MM (24h)"
        TEXT close_time "HH:MM (24h)"
        BOOLEAN is_closed "DEFAULT 0"
    }
    
    categories {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER restaurant_id FK "NOT NULL"
        TEXT name "NOT NULL, eindeutig pro Restaurant"
        INTEGER display_order "NOT NULL, DEFAULT 0"
        TEXT created_at "DEFAULT now()"
        TEXT updated_at "DEFAULT now()"
    }
    
    dishes {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER restaurant_id FK "NOT NULL"
        INTEGER category_id FK "NULL"
        TEXT name "NOT NULL"
        TEXT description "NULL"
        REAL price "NOT NULL, >= 0"
        INTEGER display_order "DEFAULT 0, Priorität in Kategorie"
        TEXT photo_url "NULL, optionales Foto"
        INTEGER cooking_time_minutes "DEFAULT 15, für Lieferzeit"
        TEXT created_at "DEFAULT now()"
        TEXT updated_at "DEFAULT now()"
    }
    
    orders {
        TEXT id PK "UUID"
        INTEGER customer_id FK "NOT NULL"
        INTEGER restaurant_id FK "NOT NULL"
        TEXT order_status "NOT NULL, DEFAULT pending"
        REAL subtotal "NOT NULL, >= 0"
        REAL discount_amount "DEFAULT 0, >= 0"
        REAL final_price "NOT NULL, >= 0"
        INTEGER voucher_id FK "NULL"
        TEXT voucher_code "NULL"
        TEXT delivery_street "NOT NULL, Snapshot"
        TEXT delivery_postal_code "NOT NULL, Snapshot"
        TEXT delivery_city "NOT NULL, Snapshot"
        INTEGER estimated_delivery_minutes "NULL"
        TEXT customer_notes "NULL"
        TEXT restaurant_notes "NULL"
        DATETIME created_at "NOT NULL"
        DATETIME updated_at "NOT NULL"
        DATETIME accepted_at "NULL"
        DATETIME rejected_at "NULL"
        DATETIME preparing_started_at "NULL"
        DATETIME ready_at "NULL"
        DATETIME delivering_started_at "NULL"
        DATETIME delivered_at "NULL"
    }
    
    order_items {
        INTEGER id PK "AUTOINCREMENT"
        TEXT order_id FK "NOT NULL"
        INTEGER dish_id FK "NULL"
        TEXT dish_name "NOT NULL, Snapshot"
        REAL dish_price "NOT NULL, Snapshot"
        INTEGER quantity "NOT NULL, > 0, 1-X"
        REAL subtotal "NOT NULL, >= 0"
        DATETIME created_at "NOT NULL"
    }
    
    order_status_history {
        INTEGER id PK "AUTOINCREMENT"
        TEXT order_id FK "NOT NULL"
        TEXT status "NOT NULL"
        DATETIME changed_at "NOT NULL"
        TEXT notes "NULL"
    }
    
    vouchers {
        INTEGER id PK "AUTOINCREMENT"
        TEXT code "NOT NULL, UNIQUE"
        TEXT discount_type "percentage oder fixed_amount"
        REAL discount_value "NOT NULL, > 0"
        INTEGER is_active "DEFAULT 1"
        DATETIME valid_from "NOT NULL"
        DATETIME valid_until "NOT NULL"
        INTEGER usage_limit "NULL = unbegrenzt"
        INTEGER usage_count "DEFAULT 0"
        INTEGER restaurant_id FK "NULL = global"
        TEXT description "NULL"
        DATETIME created_at "NOT NULL"
        DATETIME updated_at "NOT NULL"
    }
    
    restaurant_reviews {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER restaurant_id FK "NOT NULL"
        INTEGER customer_id FK "NOT NULL"
        INTEGER order_id FK "NULL"
        INTEGER rating "NOT NULL, 1-5 Sterne"
        TEXT comment "NULL, optionaler Text"
        DATETIME created_at "NOT NULL"
        DATETIME updated_at "NOT NULL"
    }
    
    dish_reviews {
        INTEGER id PK "AUTOINCREMENT"
        INTEGER dish_id FK "NOT NULL"
        INTEGER customer_id FK "NOT NULL"
        INTEGER order_id FK "NULL"
        INTEGER rating "NOT NULL, 1-5 Sterne"
        TEXT comment "NULL, optionaler Text"
        DATETIME created_at "NOT NULL"
        DATETIME updated_at "NOT NULL"
    }
```

## Datenbanktyp

**SQLite** - Eingebettete relationale Datenbank

## Detaillierte Tabellen-Erklärungen

### 🔐 Authentifizierung und Benutzerverwaltung

#### `customers` - Kundentabelle
**Zweck**: Speichert alle registrierten Kunden der Plattform.

**Warum diese Felder?**
- `id` (UUID): Eindeutiger Identifier, UUID verhindert Kollisionen und ist nicht erraten-bar
- `first_name`, `last_name`: Pflichtfelder für Identifikation und Anrede
- `birth_date`: Mindestalter 16 Jahre muss validiert werden (Geschäftsregel)
- `email`: Dient als Benutzername für Login, UNIQUE und case-insensitive
- `password_hash`: Passwort wird NIEMALS im Klartext gespeichert, nur der Hash
- `delivery_street`, `delivery_house_number`, `delivery_staircase`, `delivery_door`, `delivery_postal_code`, `delivery_city`: Vollständige Lieferadresse - wird als Snapshot in Bestellungen kopiert, sodass Kunden ihre Adresse ändern können ohne alte Bestellungen zu beeinflussen
- `created_at`, `updated_at`: Audit-Trail für Support und Analyse

#### `restaurant_owners` - Restaurantbesitzer-Tabelle
**Zweck**: Speichert alle registrierten Restaurantbesitzer.

**Warum diese Felder?**
- `id` (UUID): Eindeutiger Identifier
- `first_name`, `last_name`: Name des Inhabers (nicht des Restaurants!)
- `birth_date`: Mindestalter 18 Jahre (höher als bei Kunden, da geschäftlich)
- `email`: Benutzername für Login, UNIQUE und case-insensitive
- `password_hash`: Gehashtes Passwort
- `created_at`, `updated_at`: Audit-Trail
- **Keine Adresse**: Restaurantbesitzer haben keine eigene Adresse, nur ihre Restaurants haben Adressen

#### `restaurants` - Restaurant-Tabelle
**Zweck**: Speichert alle Restaurants auf der Plattform.

**Warum diese Felder?**
- `id` (UUID): Eindeutiger Identifier
- `owner_id`: Verknüpfung zum Besitzer (1 Besitzer kann mehrere Restaurants haben)
- `name`: Restaurantname, muss pro Stadt eindeutig sein (kann aber in verschiedenen Städten gleich heißen)
- `street`, `house_number`, `staircase`, `door`, `postal_code`, `city`: Vollständige Restaurantadresse - wichtig für Lieferung und Kundensuche
- `contact_phone`: Pflichtfeld für Kundenservice und Bestellungen
- `contact_email`: Optional zusätzlich zum Besitzer-Email
- `created_at`, `updated_at`: Tracking von Änderungen

**Warum Unique Index auf (name + city)?**
Es kann "Pizza Mario" in Wien UND Berlin geben, aber nicht zweimal in Wien.

#### `restaurant_categories` - Restaurant-Kategorien (M:N-Relation)
**Zweck**: Ein Restaurant kann mehrere Küchenarten haben (z.B. italienisch UND pizza).

**Warum diese Struktur?**
- Many-to-Many Relationship zwischen `restaurants` und Kategorien
- `category`: Kommt aus Server-Config-File (z.B. "asiatisch", "italienisch", "burger")
- Keine separate Kategorien-Tabelle, da Kategorien statisch in Config definiert sind
- Composite Primary Key aus beiden Feldern verhindert Duplikate

#### `opening_hours` - Öffnungszeiten
**Zweck**: Flexibles Speichern der Öffnungszeiten pro Wochentag.

**Warum diese Felder?**
- `restaurant_id`: Zu welchem Restaurant gehört dieser Eintrag
- `day_of_week`: 0=Sonntag, 1=Montag ... 6=Samstag (Standard in vielen Systemen)
- `open_time`, `close_time`: HH:MM Format (24h), z.B. "11:00", "22:00"
- `is_closed`: Boolean für geschlossene Tage (z.B. Montag Ruhetag)
- Pro Restaurant können bis zu 7 Einträge existieren (ein Eintrag pro Wochentag)

**Warum nicht ein JSON-Feld?**
Separate Zeilen ermöglichen einfache Queries "Welche Restaurants haben jetzt offen?" ohne JSON-Parsing.

---

### 🍽️ Menü-Management

#### `categories` - Menü-Kategorien
**Zweck**: Strukturiert das Menü eines Restaurants in Abschnitte.

**Warum diese Felder?**
- `id`: Auto-increment ID (keine UUID, da intern)
- `restaurant_id`: Jedes Restaurant hat seine eigenen Kategorien
- `name`: z.B. "Vorspeisen", "Suppen", "Hauptgerichte", "Desserts"
- `display_order`: Definiert die Anzeigereihenfolge (Vorspeisen vor Hauptgerichten)
- `created_at`, `updated_at`: Tracking
- **Unique (restaurant_id + name)**: "Suppen" kann nur einmal pro Restaurant existieren

**Warum separate Tabelle?**
Kategorien können hinzugefügt/gelöscht werden. Wenn Kategorie gelöscht wird, bleiben Gerichte erhalten (SET NULL).

#### `dishes` - Gerichte
**Zweck**: Die eigentlichen Speisen, die Kunden bestellen können.

**Warum diese Felder?**
- `id`: Auto-increment ID
- `restaurant_id`: Zu welchem Restaurant gehört das Gericht
- `category_id`: Optional! Gerichte können auch ohne Kategorie existieren (z.B. Tagesgerichte)
- `name`: Gerichtname (z.B. "Spaghetti Carbonara")
- `description`: Optionale Beschreibung (Zutaten, Allergene, etc.)
- `price`: Preis in Euro (REAL = Dezimalzahl für 9.99)
- `display_order`: Sortierung innerhalb der Kategorie (wichtigste Gerichte zuerst)
- `photo_url`: Pfad zum optional hochgeladenen Foto
- `cooking_time_minutes`: Wie lange dauert die Zubereitung? Wichtig für Lieferzeitberechnung
- `created_at`, `updated_at`: Tracking

**Warum category_id NULL erlauben?**
- Flexibilität: Tagesgerichte, Aktionen
- Wenn Kategorie gelöscht wird, bleiben Gerichte erhalten (ON DELETE SET NULL)

---

### 📦 Bestellsystem

#### `orders` - Bestellungen
**Zweck**: Zentrale Tabelle für alle Kundenbestellungen.

**Warum diese Felder?**
- `id` (UUID): Eindeutige Bestellnummer
- `customer_id`: Wer hat bestellt?
- `restaurant_id`: Bei welchem Restaurant?
- `order_status`: Aktueller Status der Bestellung (siehe Workflow unten)
- `subtotal`: Summe aller Gerichte OHNE Rabatt
- `discount_amount`: Rabatt durch Voucher (kann 0 sein)
- `final_price`: Was der Kunde tatsächlich zahlt (subtotal - discount)
- `voucher_id`, `voucher_code`: Welcher Voucher wurde verwendet? (NULL wenn keiner)
- `delivery_street`, `delivery_postal_code`, `delivery_city`: **SNAPSHOT** der Kundenadresse zum Bestellzeitpunkt
- `estimated_delivery_minutes`: Geschätzte Lieferzeit basierend auf Kochzeit + Stoßzeiten + Lieferzeit
- `customer_notes`: Optionale Hinweise vom Kunden (z.B. "Klingel kaputt")
- `restaurant_notes`: Interne Notizen des Restaurants
- `created_at`: Wann wurde bestellt?
- `accepted_at`, `rejected_at`, `preparing_started_at`, `ready_at`, `delivering_started_at`, `delivered_at`: Timestamps für jeden Status-Übergang

**Warum so viele Timestamps?**
- Ermöglicht präzise Lieferzeitanalyse
- Restaurant kann sehen: Wie lange dauert durchschnittlich die Zubereitung?
- Kunde kann sehen: Wann wurde meine Bestellung angenommen?

**Warum Adress-Snapshot?**
Wenn Kunde nach Bestellung seine Adresse ändert, darf die alte Bestellung nicht plötzlich eine neue Adresse haben!

#### `order_items` - Bestellpositionen
**Zweck**: Was wurde konkret bestellt? (M:N zwischen orders und dishes)

**Warum diese Felder?**
- `id`: Auto-increment ID
- `order_id`: Zu welcher Bestellung gehört dieser Artikel?
- `dish_id`: Welches Gericht wurde bestellt? (NULL erlaubt falls Gericht später gelöscht wird)
- `dish_name`, `dish_price`: **SNAPSHOT** des Gerichts zum Bestellzeitpunkt
- `quantity`: Wie viele wurden bestellt? (1-X, muss > 0 sein)
- `subtotal`: quantity * dish_price (redundant aber cached für Performance)

**Warum Dish-Snapshot?**
Wenn Restaurant den Preis von "Pizza Margherita" von 8€ auf 10€ erhöht, müssen alte Bestellungen noch 8€ zeigen!

#### `order_status_history` - Status-Historie
**Zweck**: Protokolliert jeden Status-Wechsel einer Bestellung.

**Warum separate Tabelle?**
- Vollständige Audit-Trail: Wann wurde was geändert?
- Restaurant kann nachvollziehen: Wie lange war Bestellung in welchem Status?
- Support kann Probleme debuggen
- Analytics: Durchschnittliche Zubereitungszeit etc.

**Felder:**
- `order_id`: Zu welcher Bestellung?
- `status`: Neuer Status
- `changed_at`: Wann wurde gewechselt?
- `notes`: Optionale Begründung (z.B. bei rejection)

---

### 🎟️ Voucher-System

#### `vouchers` - Gutscheine/Promocodes
**Zweck**: Rabattcodes für Marketing und Kundenbindung.

**Warum diese Felder?**
- `id`: Auto-increment ID
- `code`: Der eigentliche Code (z.B. "WELCOME10"), UNIQUE und case-insensitive
- `discount_type`: Entweder "percentage" (10%) oder "fixed_amount" (5€)
- `discount_value`: Der Wert (z.B. 10 für 10% oder 5 für 5€)
- `is_active`: Kann deaktiviert werden ohne zu löschen
- `valid_from`, `valid_until`: Gültigkeitszeitraum
- `usage_limit`: Wie oft darf der Code verwendet werden? (NULL = unbegrenzt)
- `usage_count`: Wie oft wurde er bereits verwendet?
- `restaurant_id`: NULL = Global für alle Restaurants, sonst restaurant-spezifisch
- `description`: Marketing-Text (z.B. "Willkommensrabatt für Neukunden")

**Business Logic:**
- Bei Bestellung wird `usage_count` inkrementiert
- Backend prüft: is_active? noch gültig? usage_limit nicht überschritten?

---

### ⭐ Bewertungssystem

#### `restaurant_reviews` - Restaurant-Bewertungen
**Zweck**: Kunden können Restaurants bewerten.

**Warum diese Felder?**
- `id`: Auto-increment ID
- `restaurant_id`: Welches Restaurant wird bewertet?
- `customer_id`: Wer bewertet?
- `order_id`: Optional: Verknüpfung zur Bestellung (verhindert Fake-Reviews)
- `rating`: 1-5 Sterne (Integer)
- `comment`: Optionaler Freitext
- `created_at`, `updated_at`: Wann erstellt/geändert?

**Unique Constraint (restaurant_id + customer_id + order_id):**
Ein Kunde kann pro Bestellung nur EINE Restaurant-Bewertung abgeben. Verhindert Spam.

#### `dish_reviews` - Gericht-Bewertungen
**Zweck**: Kunden können einzelne Gerichte bewerten.

**Struktur identisch zu restaurant_reviews, aber für dishes:**
- Hilft Restaurant zu sehen: Welche Gerichte kommen gut an?
- Kunde sieht: "Pizza Margherita hat 4.5 Sterne"
- Unique Constraint verhindert Mehrfach-Bewertungen

**Warum separate Tabellen für Restaurant vs. Dish Reviews?**
- Verschiedene Aggregationen: Restaurant-Durchschnitt vs. Gericht-Durchschnitt
- Kunde kann Restaurant 5 Sterne geben aber ein Gericht nur 3 Sterne
- Flexibler für zukünftige Features (z.B. "Beste Gerichte des Restaurants")

---

### 🔧 System-Tabellen

#### `_migrations` - Migrations-Tracking
**Zweck**: Welche Migrations wurden bereits ausgeführt?

**Warum wichtig?**
- Verhindert doppelte Ausführung
- Bei Updates: System weiß, welche Migrations noch fehlen
- `filename`: Name der SQL-Datei
- `applied_at`: Wann wurde sie ausgeführt?

---

## Status-Workflow Erklärung

### Bestellstatus-Lifecycle
```
1. pending       → Bestellung wurde vom Kunden abgeschickt
2. accepted      → Restaurant hat Bestellung angenommen
   OR rejected   → Restaurant hat abgelehnt (ENDE)
3. preparing     → Restaurant bereitet zu
4. ready         → Essen ist fertig
5. delivering    → Fahrer unterwegs
6. delivered     → Zugestellt (ENDE)
7. cancelled     → Abgebrochen (ENDE)
```

**Warum so detailliert?**
- Kunde sieht genau wo seine Bestellung ist
- Restaurant kann Status kommunizieren ohne Anruf
- Lieferzeitberechnung kann verfeinert werden ("ready" kam früher als erwartet)

---

## Wichtige Constraints und Validierungen

### Unique Constraints
- `customers.email` - Case-insensitive unique
- `restaurant_owners.email` - Case-insensitive unique
- `restaurants.name + city` - Restaurantname muss pro Stadt eindeutig sein
- `categories.restaurant_id + name` - Kategoriename muss pro Restaurant eindeutig sein
- `vouchers.code` - Case-insensitive unique
- `restaurant_reviews.restaurant_id + customer_id + order_id` - Ein Review pro Kunde pro Bestellung pro Restaurant
- `dish_reviews.dish_id + customer_id + order_id` - Ein Review pro Kunde pro Bestellung pro Gericht

### Check Constraints
- **Altersvalidierung** (Business Logic):
  - Kunden: Mindestens 16 Jahre (konfigurierbar im Server-Config-File)
  - Restaurantbesitzer: Mindestens 18 Jahre (konfigurierbar im Server-Config-File)
- **Namensvalidierung** (Backend):
  - Vorname, Nachname: 1-30 Zeichen
  - Keine Zahlen, nur Bindestrich und Punkt als Sonderzeichen
- **Restaurantname-Validierung** (Backend):
  - Nur Punkt, Bindestrich, Schrägstrich, Zahlen und Buchstaben
- **E-Mail-Validierung** (Backend): Muss gültige E-Mail-Adresse sein
- **Preis-Constraints**:
  - `dishes.price >= 0`
  - `orders.subtotal >= 0`
  - `orders.discount_amount >= 0`
  - `orders.final_price >= 0`
  - `order_items.dish_price >= 0`
  - `order_items.subtotal >= 0`
- **Mengen-Constraints**:
  - `order_items.quantity > 0`
  - `dishes.cooking_time_minutes > 0`
  - `vouchers.usage_count >= 0`
- **Bewertungs-Constraints**:
  - `restaurant_reviews.rating BETWEEN 1 AND 5`
  - `dish_reviews.rating BETWEEN 1 AND 5`
- **Status-Constraints**:
  - `orders.order_status` IN (pending, accepted, rejected, preparing, ready, delivering, delivered, cancelled)
  - `vouchers.discount_type` IN (percentage, fixed_amount)

### Foreign Key Constraints
- Alle Fremdschlüssel mit `ON DELETE CASCADE` oder `ON DELETE SET NULL` je nach Geschäftslogik
- `restaurants.owner_id` → `restaurant_owners.id` (CASCADE)
- `restaurant_categories.restaurant_id` → `restaurants.id` (CASCADE)
- `opening_hours.restaurant_id` → `restaurants.id` (CASCADE)
- `categories.restaurant_id` → `restaurants.id` (CASCADE)
- `dishes.restaurant_id` → `restaurants.id` (CASCADE)
- `dishes.category_id` → `categories.id` (SET NULL)
- `orders.customer_id` → `customers.id` (CASCADE)
- `orders.restaurant_id` → `restaurants.id` (CASCADE)
- `orders.voucher_id` → `vouchers.id` (SET NULL)
- `order_items.order_id` → `orders.id` (CASCADE)
- `order_items.dish_id` → `dishes.id` (SET NULL)

### Indizes für Performance

#### Authentifizierung
- `idx_customers_email` - Case-insensitive Email-Suche
- `idx_restaurant_owners_email` - Case-insensitive Email-Suche

#### Restaurants
- `idx_restaurants_name_city` - Unique Index für Name+Stadt
- `idx_opening_hours_restaurant` - Öffnungszeiten-Lookup

#### Menü
- `idx_categories_restaurant_order` - Kategorien sortiert nach display_order
- `idx_dishes_category_order` - Gerichte sortiert nach display_order
- `idx_dishes_restaurant` - Gerichte pro Restaurant

#### Bestellungen
- `idx_orders_customer` - Bestellungen eines Kunden
- `idx_orders_restaurant` - Bestellungen eines Restaurants
- `idx_orders_status` - Bestellungen nach Status
- `idx_orders_created` - Bestellungen chronologisch
- `idx_orders_restaurant_created` - Kombinierter Index für Analytics
- `idx_order_items_order` - Order Items einer Bestellung
- `idx_order_items_dish` - Welche Bestellungen ein Gericht enthält
- `idx_order_status_history_order_time` - Status-Historie chronologisch

#### Bewertungen
- `idx_restaurant_reviews_restaurant` - Reviews pro Restaurant
- `idx_restaurant_reviews_customer` - Reviews eines Kunden
- `idx_dish_reviews_dish` - Reviews pro Gericht
- `idx_dish_reviews_customer` - Dish Reviews eines Kunden

#### Vouchers
- `idx_vouchers_code` - Unique case-insensitive Voucher-Code Lookup

## Datenbankfeatures

## Datenbankfeatures

### Automatische Timestamps
- Alle Haupttabellen haben `created_at` und `updated_at` Felder
- Trigger für automatisches Update von `updated_at` bei:
  - `orders`
  - `vouchers`
  - `restaurant_reviews`
  - `dish_reviews`

**Warum Triggers?**
Entwickler müssen nicht daran denken `updated_at` manuell zu setzen. Datenbank macht es automatisch bei jedem UPDATE.

### Snapshot-Daten in Bestellungen
- Lieferadresse des Kunden wird in `orders` kopiert (keine Referenz)
- Gerichtname und -preis werden in `order_items` kopiert
- Garantiert historische Korrektheit auch wenn Daten später geändert werden

**Warum Snapshots statt Foreign Keys?**
```
Beispiel OHNE Snapshot:
1. Kunde bestellt Pizza für 8€
2. Restaurant ändert Preis auf 10€
3. Alte Rechnung zeigt plötzlich 10€! ❌ FALSCH

Beispiel MIT Snapshot:
1. Kunde bestellt Pizza für 8€ → wird in order_items kopiert
2. Restaurant ändert Preis auf 10€
3. Alte Rechnung zeigt weiterhin 8€ ✅ KORREKT
```

### Soft References
- `order_items.dish_id` ist nullable (SET NULL bei Löschung)
- Ermöglicht Löschen von Gerichten ohne Bestellhistorie zu verlieren

**Warum wichtig?**
Restaurant löscht "Spaghetti Carbonara" aus dem Menü. Alte Bestellungen dürfen nicht kaputtgehen! Sie zeigen weiterhin den dish_name "Spaghetti Carbonara" aus dem Snapshot.

## Geschäftslogik-Features

### Lieferzeitberechnung
Basis für `orders.estimated_delivery_minutes`:
1. Längste `cooking_time_minutes` aller Gerichte in der Bestellung
2. +5-10 Minuten zwischen 17:00-19:00 Uhr (Stoßzeiten)
3. +10 Minuten pauschale Lieferzeit

**Beispiel:**
```
Bestellung:
- Pizza (cooking_time: 15 min)
- Pasta (cooking_time: 12 min)
- Tiramisu (cooking_time: 5 min)

Berechnung:
- Längste Kochzeit: 15 min (Pizza)
- Aktuelle Zeit: 18:30 Uhr → +7 min (Stoßzeit)
- Lieferzeit: +10 min
= 32 Minuten geschätzte Lieferzeit
```

**Warum cooking_time_minutes in dishes?**
Jedes Gericht hat unterschiedliche Zubereitungszeit. Pizza geht schneller als Braten.

### Bestellstatus-Workflow
```
pending → accepted/rejected
   ↓
accepted → preparing → ready → delivering → delivered
```

Alle Status-Änderungen werden in `order_status_history` protokolliert.

**Warum dieser Workflow?**
- `pending`: Restaurant muss erst entscheiden ob es annimmt (Kapazität, Zutaten)
- `accepted`: Restaurant sagt JA
- `preparing`: Restaurant kommuniziert "Wir arbeiten dran"
- `ready`: Essen wartet auf Fahrer
- `delivering`: Fahrer unterwegs (Kunde weiß: bald da!)
- `delivered`: Fertig

### Warenkorb-Logik
- Nur Gerichte von **einem** Restaurant gleichzeitig
- Validierung erfolgt beim Checkout im Backend
- Frontend speichert Warenkorb lokal

**Warum nur ein Restaurant?**
Logistik: Zwei Fahrer von zwei Restaurants würden zu unterschiedlichen Zeiten ankommen. Kunde will alles auf einmal.

**Warum lokaler Warenkorb?**
- Kein Server-Request bei jedem "In Warenkorb"
- Funktioniert offline
- Weniger Server-Last
- Erst beim Checkout wird alles validiert und an Backend gesendet

### Voucher-System
- **Prozentual**: z.B. 10% Rabatt
- **Fixer Betrag**: z.B. -5€ Rabatt
- Optional restaurant-spezifisch oder global
- Nutzungslimit (NULL = unbegrenzt)
- Gültigkeitszeitraum

**Beispiel-Berechnungen:**
```
Prozentual (10%):
Subtotal: 50€
Discount: 50€ * 0.10 = 5€
Final Price: 45€

Fixer Betrag (5€):
Subtotal: 50€
Discount: 5€
Final Price: 45€

Fixer Betrag bei kleiner Bestellung:
Subtotal: 3€
Discount: 5€ → wird auf 3€ begrenzt (final_price kann nicht negativ sein)
Final Price: 0€
```

**Warum restaurant_id nullable?**
- NULL = Globaler Voucher (z.B. "WELCOME10" für alle Restaurants)
- Nicht-NULL = Nur für ein spezifisches Restaurant (z.B. Restaurant-eigene Marketing-Aktion)

### Bewertungssystem
- Restaurant-Bewertungen (1-5 Sterne + optionaler Text)
- Gericht-Bewertungen (1-5 Sterne + optionaler Text)
- Ein Review pro Kunde pro Bestellung (verhindert Spam)
- Optional verknüpft mit Bestellung

**Warum order_id in Reviews?**
- Verhindert Fake-Reviews: Nur wer bestellt hat, kann bewerten
- Kunde kann mehrmals bewerten (bei verschiedenen Bestellungen)
- Aber nur EINMAL pro Bestellung

**Durchschnitts-Berechnung:**
```sql
-- Restaurant-Durchschnittsbewertung
SELECT AVG(rating) 
FROM restaurant_reviews 
WHERE restaurant_id = 'restaurant-uuid';

-- Gericht-Durchschnittsbewertung
SELECT AVG(rating) 
FROM dish_reviews 
WHERE dish_id = 123;
```

### Analytics-Unterstützung
Die Struktur ermöglicht:
- Anzahl Bestellungen täglich/wöchentlich
- Meistbestellte Gerichte in Zeitraum
- Umsatz-Analysen
- Bewertungs-Trends

**Beispiel-Queries:**
```sql
-- Anzahl Bestellungen heute
SELECT COUNT(*) 
FROM orders 
WHERE restaurant_id = 'restaurant-uuid'
  AND DATE(created_at) = DATE('now');

-- Meistbestellte Gerichte diese Woche
SELECT d.name, COUNT(*) as order_count
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN dishes d ON oi.dish_id = d.id
WHERE o.restaurant_id = 'restaurant-uuid'
  AND o.created_at >= DATE('now', '-7 days')
GROUP BY d.id
ORDER BY order_count DESC
LIMIT 10;

-- Umsatz pro Tag letzte 30 Tage
SELECT DATE(created_at) as date, SUM(final_price) as revenue
FROM orders
WHERE restaurant_id = 'restaurant-uuid'
  AND created_at >= DATE('now', '-30 days')
  AND order_status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Anforderungsabdeckung

### ✅ Authentifizierung & Registrierung
- [x] Kunden-Registrierung mit allen erforderlichen Feldern
- [x] Restaurantbesitzer-Registrierung mit allen erforderlichen Feldern
- [x] Passwort-Hashing (password_hash)
- [x] E-Mail als Benutzername (unique, case-insensitive)
- [x] Altersvalidierung (16/18 Jahre, konfigurierbar)
- [x] Namensvalidierung (1-30 Zeichen, nur Bindestrich/Punkt)
- [x] Adressfelder (Straße, Nummer, Stiege, Tür, PLZ, Ort)

### ✅ Restaurant-Verwaltung
- [x] Restaurant-Kategorien/Küchenarten (aus Config)
- [x] Eindeutiger Name pro Stadt
- [x] Öffnungszeiten pro Wochentag
- [x] Kontaktinformationen
- [x] Restaurant-Profil editierbar

### ✅ Menü-Management
- [x] Kategorien mit Reihenfolge (display_order)
- [x] Gerichte mit Name, Beschreibung, Preis
- [x] Optionales Foto (photo_url)
- [x] Optional Kategorie-Zuordnung
- [x] Display Order/Priorität pro Gericht
- [x] Kochzeit pro Gericht (für Lieferzeitberechnung)

### ✅ Bestellungen
- [x] Kunde kann bestellen
- [x] Nur ein Restaurant pro Warenkorb (Frontend-Validierung)
- [x] Mengenauswahl (1-X)
- [x] Voucher-System (prozentual/fixer Betrag)
- [x] Bestellstatus-Tracking
- [x] Status-Historie
- [x] Geschätzte Lieferzeit
- [x] Bestellung annehmen/ablehnen (Restaurant)
- [x] Status-Updates (preparing, ready, delivering, delivered)

### ✅ Bewertungen
- [x] Restaurant-Bewertungen (Sterne + Text)
- [x] Gericht-Bewertungen (Sterne + Text)
- [x] Verknüpfung mit Bestellung (optional)
- [x] Ein Review pro Kunde pro Bestellung

### ✅ Analytics
- [x] Bestellungen nach Zeitraum (created_at Index)
- [x] Meistbestellte Gerichte (order_items.dish_id)
- [x] Restaurant-spezifische Analysen (idx_orders_restaurant_created)

## Migrations-Dateien

Das Schema wird über folgende SQL-Migrations-Dateien aufgebaut:

1. **001_initial_schema.sql** - Migrations-Tracking-Tabelle
2. **002_authentication_tables.sql** - Kunden, Restaurantbesitzer, Restaurants, Kategorien, Öffnungszeiten
3. **003_menu_tables.sql** - Menü-Kategorien und Gerichte
4. **004_rename_dish_priority_to_display_order.sql** - Umbenennung für Konsistenz
5. **005_orders_and_reviews_system.sql** - Bestellungen, Vouchers, Bewertungen

Alle Migrations werden über den Migration Runner im Backend automatisch ausgeführt.

## Viewer-Kompatibilität

Diese Datei kann in folgenden Tools visualisiert werden:

- **GitHub**: Zeigt Mermaid-Diagramme nativ an
- **VS Code**: Mit "Markdown Preview Mermaid Support" Extension
- **Online**: [mermaid.live](https://mermaid.live/), [mermaid-js.github.io](https://mermaid-js.github.io/mermaid-live-editor/)
- **JetBrains IDEs**: Mit Mermaid Plugin
- **Obsidian**: Native Mermaid-Unterstützung

---

**Stand**: Januar 2026  
**Datenbankversion**: Migration 005 (Orders and Reviews System)
