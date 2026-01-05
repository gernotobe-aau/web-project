# Ziel des Systems

Ziel ist die Entwicklung einer Food-Delivery-Plattform, die funktional mit bestehenden Anbietern wie Lieferando oder Foodora vergleichbar ist.  
Die Plattform ermöglicht es Kunden, bei Restaurants Essen zu bestellen, und Restaurantbesitzern, ihre Angebote und Bestellungen zu verwalten.

## Rollen und Benutzerkonten

Das System unterstützt zwei Benutzerrollen. Ein Benutzer kann nur eine Rolle haben.

- Kunde:  
    Ein Kunde kann sich registrieren und einloggen.  

    Erforderliche Registrierungsdaten:
   - Vorname  
   - Nachname  
   - Geburtsdatum, Mindestalter ist 16 Jahre (soll statisch in den Server-Config-Files konfigurierbar sein)  
   - Lieferadresse  
   - E-Mail-Adresse, diese wird als Benutzername verwendet  
   - Passwort  

- Restaurantbesitzer:  
    Ein Restaurantbesitzer kann sich registrieren und einloggen.  

    Erforderliche Registrierungsdaten:
   - Vorname (Inhaber)  
   - Nachname (Inhaber)  
   - Geburtsdatum, Mindestalter ist 18 Jahre (soll statisch in den Server-Config-Files konfigurierbar sein)  
   - Restaurantname, muss im selben Ort eindeutig sein. Darf nur aus Punkt, Bindestrich, Schrägstrich, Zahlen und Buchstaben bestehen  
   - Restaurantadresse  
   - Kategorien / Küchenarten (z. B. asiatisch, italienisch, …)  
   - Kontaktinformationen  
   - E-Mail-Adresse, diese wird als Benutzername verwendet  
   - Öffnungszeiten  
   - Passwort  

Passwörter werden gehasht bzw. verschlüsselt in der Datenbank gespeichert.  
Es ist kein spezielles Benutzerverwaltungssystem erforderlich.

Notwendige Validierungen auf die obigen Eingabefelder:
 - Vorname, Nachname: min. 1, max. 30 Zeichen. Keine Zahlen, Sonderzeichen nur Bindestrich und Punkt  
 - Lieferadresse, Restaurantadresse: bestehend aus separaten Feldern für Straße + Nummer / Stiege / Tür, Postleitzahl, Ort  
 - Kategorie: statische Information, hinterlegt im Server-Config-File. Keine Editierung in der Applikation möglich  
 - E-Mail-Adresse: Validierung auf eine gültige E-Mail-Adresse ist ein Muss-Kriterium  

Eingeloggte Kunden können ihre Adresse, E-Mail und ihr Passwort ändern.  
Eingeloggte Restaurantbesitzer können ihre Kontaktinformationen ändern.

## Kunde

### Restaurant Browsing
Kunden sehen auf der Startseite alle offenen Restaurants und können diese nach Küche, Bewertung und Lieferzeit filtern.  
Wenn man auf eine Restaurantvorschau klickt, wird das Restaurant geöffnet und man sieht alle Details zum Restaurant, Bewertungen sowie alle Gerichte.  
Gerichte können in den Warenkorb gelegt bzw. wieder entfernt werden.  
Gerichte können in Mengen von 1–X bestellt werden.  
Es können nur Gerichte von **einem** Restaurant gleichzeitig im Warenkorb sein.  
Der Warenkorb des Kunden ist lokal gespeichert und wird erst beim Absenden der fertigen Bestellung – inklusive Gutschein-Code – an den Server übertragen.

### Cart & Checkout
Wenn der Kunde alle Gerichte ausgewählt hat, gelangt er auf eine weitere Seite mit einer Bestellübersicht.  
Dort können Voucher / Promotion-Codes eingegeben werden. Diese können entweder prozentual (% der Bestellsumme) oder als fixer Betrag (z. B. −5 €) gelten.  
Wenn der Kunde einverstanden ist, kann er die Bestellung abschicken.

### Order Tracking
Nach dem Absenden wird eine Anfrage an den Restaurantbesitzer übermittelt.  
Der Kunde sieht den aktuellen Status:
- Bestellung abgegeben  
- Bestellung angenommen (wenn der Restaurantbesitzer zustimmt)  
- Bestellung abgelehnt (falls nicht angenommen)  

Der Restaurantbesitzer kann dem Kunden per Status-Buttons mitteilen, dass:
- die Bestellung in Bearbeitung ist  
- die Bestellung fertig ist  
- die Bestellung gerade geliefert wird  

Zusätzlich wird eine geschätzte Zeit angezeigt. Diese berechnet sich wie folgt:
- jedes Gericht hat eine Kochzeit, es wird die längste Kochzeit der Bestellung herangezogen  
- zwischen 17:00 und 19:00 Uhr werden zusätzlich 5–10 Minuten hinzugefügt (Stoßzeiten)  
- zu Beginn wird pauschal mit 10 Minuten Lieferzeit gerechnet  

### Feedback
Der Kunde kann einzelne Gerichte sowie auch Restaurants bewerten.  
Die Bewertung erfolgt über Sterne und optionalen Text.

## Restaurantbesitzer

### Menu Management
Restaurantbesitzer können Gerichte erstellen, ändern und löschen.  
Es können Kategorien erstellt werden, z. B. Suppen, Vorspeisen, Hauptgerichte.  
Gerichte können diesen Kategorien zugeordnet werden.
Die Kategorien haben eine Reihenfolge, damit dann später die Kategorieren in der richtigen Reihenfolge angezeigt werden.
Gerichte haben optional eine Priorität, damit sie in den Kategorieren richtig sortiert werden können.

Gerichte besitzen:
- Name  
- Beschreibung  
- Preis  
- optionales Foto  

### Order Reception
Restaurantbesitzer haben eine Ansicht, in der eingehende Bestellungen in Echtzeit angezeigt werden.  
Sie können Bestellungen annehmen oder ablehnen.  
Zusätzlich können sie den Status der Bestellung aktualisieren, damit der Kunde jederzeit den aktuellen Stand sieht.

### Restaurant Profil
- Änderung von Restaurantname und Kontaktinformationen  
- Anpassung der Öffnungszeiten  

### Analytics
- Anzahl der Bestellungen täglich / wöchentlich  
- Auswertung, welche Gerichte wie oft in einem bestimmten Zeitraum bestellt wurden  
