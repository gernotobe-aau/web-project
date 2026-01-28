# Food Delivery Platform - Scripts

Dieses Verzeichnis enthält PowerShell-Scripts zum Verwalten der Food Delivery Platform.

## Übersicht

| Script | Beschreibung |
|--------|--------------|
| `install.ps1` | Installiert alle npm-Dependencies (Backend & Frontend) |
| `reset-and-run.ps1` | Löscht DB, führt Migrationen aus, befüllt Testdaten, startet Server |
| `start.ps1` | Startet Backend- und Frontend-Entwicklungsserver |
| `build-and-run.ps1` | Build- und Deployment-Script (Development/Production) |
| `seed-test-data.ps1` | Befüllt Datenbank mit Testdaten |

## Schnellstart

### 1. Erste Einrichtung (einmalig)

```powershell
cd scripts
.\install.ps1
```

Installiert alle notwendigen npm-Pakete für Backend und Frontend.

### 2. Datenbank zurücksetzen und Testdaten laden

```powershell
.\reset-and-run.ps1
```

Dieser Befehl:
- Stoppt laufende Server
- Löscht die Datenbank
- Führt Migrationen aus
- Lädt Testdaten
- Startet Backend und Frontend

**Nur Datenbank zurücksetzen (ohne Server zu starten):**
```powershell
.\reset-and-run.ps1 -SeedOnly
```

### 3. Server starten (ohne DB-Reset)

```powershell
.\start.ps1
```

Startet Backend und Frontend in separaten PowerShell-Fenstern.

## Detaillierte Beschreibung

### install.ps1

Installiert alle Dependencies.

**Verwendung:**
```powershell
.\install.ps1
```

**Optionen:**
- `-Help` - Zeigt Hilfe an

**Was passiert:**
1. Prüft ob Node.js und npm installiert sind
2. Führt `npm install` im Backend aus
3. Führt `npm install` im Frontend aus

---

### reset-and-run.ps1

Vollständiger Reset der Datenbank mit anschließendem Start der Server.

**Verwendung:**
```powershell
.\reset-and-run.ps1           # Alles: Reset + Start
.\reset-and-run.ps1 -SeedOnly # Nur DB-Reset
```

**Optionen:**
- `-SeedOnly` - Nur DB zurücksetzen und befüllen, Server nicht starten
- `-Help` - Zeigt Hilfe an

**Was passiert:**
1. Stoppt laufende Node.js-Prozesse
2. Löscht `backend/database.sqlite`
3. Führt Migrationen aus (`src/db/migration-runner.ts`)
4. Befüllt Testdaten (`src/db/seed-test-data.ts`)
5. Startet Server (außer bei `-SeedOnly`)

**Testdaten:**
- 2 Kunden (max.mustermann@test.com, anna.schmidt@test.com)
- 2 Restaurantbesitzer mit Restaurants (Pizza Mario, Burger King)
- Kategorien und Gerichte
- Öffnungszeiten
- Voucher

---

### start.ps1

Startet die Entwicklungsserver ohne DB-Reset.

**Verwendung:**
```powershell
.\start.ps1
```

**Optionen:**
- `-Help` - Zeigt Hilfe an

**Was passiert:**
1. Prüft ob Dependencies installiert sind
2. Warnt wenn Datenbank nicht existiert
3. Startet Backend (`npm run dev`) auf Port 3000
4. Startet Frontend (`npm start`) auf Port 4200

**Server-Adressen:**
- Backend: http://localhost:3000
- Frontend: http://localhost:4200

---

### build-and-run.ps1

Build und Deployment Script (Existierendes Script, jetzt konsistent).

**Verwendung:**
```powershell
.\build-and-run.ps1 -Mode Development  # Standard
.\build-and-run.ps1 -Mode Deployment   # Production Build
```

**Development Mode:**
- Prüft Dependencies
- Startet Backend und Frontend in separaten Fenstern

**Deployment Mode:**
- Baut Backend für Production
- Baut Frontend für Production
- Erstellt Deployment-Struktur in `deploy/`

---

### seed-test-data.ps1

Befüllt die Datenbank mit Testdaten (ohne Löschen).

**Verwendung:**
```powershell
.\seed-test-data.ps1
```

Nützlich wenn die Datenbank bereits existiert und nur Daten hinzugefügt werden sollen.

## Workflows

### Tägliche Entwicklung

```powershell
# Morgens: Server starten
cd scripts
.\start.ps1

# Bei Bedarf: DB zurücksetzen
.\reset-and-run.ps1 -SeedOnly
.\start.ps1
```

### Nach Git Pull / Dependencies geändert

```powershell
.\install.ps1
.\reset-and-run.ps1
```

### Nur Backend testen (z.B. mit Postman)

```powershell
.\reset-and-run.ps1 -SeedOnly
cd ..\backend
npm run dev
```

### Production Build erstellen

```powershell
.\build-and-run.ps1 -Mode Deployment
```

Build wird erstellt in: `deploy/backend/`

## Troubleshooting

### "ng: The term 'ng' is not recognized"

**Lösung:** Verwende `npx ng` oder `npm run build` statt direktem `ng`.
Alle Scripts verwenden bereits `npx` oder `npm run`.

### "Backend dependencies not installed"

**Lösung:**
```powershell
.\install.ps1
```

### "Database does not exist"

**Lösung:**
```powershell
.\reset-and-run.ps1 -SeedOnly
```

### Port bereits belegt

**Lösung:** Stoppe laufende Prozesse:
```powershell
Get-Process -Name node | Stop-Process -Force
```

Oder verwende `reset-and-run.ps1` (stoppt automatisch).

## Server-Konfiguration

Ports werden konfiguriert in:
- Backend: `backend/src/config/config.ts` (Standard: 3000)
- Frontend: `frontend/angular.json` (Standard: 4200)

## Testbenutzer

Nach `reset-and-run.ps1` oder `seed-test-data.ps1`:

**Kunden:**
- Email: `max.mustermann@test.com`, Passwort: `Test1234!`
- Email: `anna.schmidt@test.com`, Passwort: `Test1234!`

**Restaurantbesitzer:**
- Email: `mario.rossi@pizzamario.com`, Passwort: `Test1234!` (Pizza Mario)
- Email: `john.smith@burgerking.com`, Passwort: `Test1234!` (Burger King)

## Hilfe anzeigen

Jedes Script unterstützt `-Help`:

```powershell
.\install.ps1 -Help
.\start.ps1 -Help
.\reset-and-run.ps1 -Help
.\build-and-run.ps1 -Help
```
