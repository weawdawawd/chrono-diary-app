# Plan: Standort-Pflicht für Schichten + Live-Karte

## Ziel
- Admin kann beim Erstellen einer Schicht festlegen, ob Standort erforderlich ist
- Mitarbeiter muss die Standort-Freigabe vor Schichtbeginn akzeptieren
- Bei aktiver Schicht mit Standort-Pflicht → automatische Live-Übertragung im Hintergrund
- Wenn Mitarbeiter Standort nicht freigibt bei Pflicht-Schicht → Stunden werden NICHT in der Auswertung gezählt
- Admin-Dashboard zeigt Live-Karte mit allen aktuell aktiven Mitarbeiterstandorten

## Datenbank-Änderungen

**Tabelle `shifts`:**
- Neue Spalte `requires_location boolean NOT NULL DEFAULT false`
- Neue Spalte `location_consent_at timestamptz` (wann Mitarbeiter zugestimmt hat)
- Neue Spalte `location_consent_declined boolean DEFAULT false`

**RLS-Update:**
- Mitarbeiter darf nur `location_consent_at` / `location_consent_declined` der eigenen Schichten updaten
- `shift_locations` insert-Policy bleibt: nur während aktiver Schicht
- Stunden-Berechnung: shifts mit `requires_location = true` UND `location_consent_at IS NULL` werden bei Auswertung markiert/ausgeschlossen

## UI-Änderungen

### Admin
1. **`ShiftsPage.tsx`** – Neue Schicht: Switch „Standort-Pflicht" (an/aus)
2. **`DashboardPage.tsx`** – Neue Sektion „Live-Karte":
   - Leaflet (OpenStreetMap, kostenlos, ohne API-Key)
   - Marker für jeden aktuell aktiven Mitarbeiter (letzter Ping aus `shift_locations`)
   - Auto-Refresh alle 30 s
3. Schichtliste: Badge „📍 Pflicht" / „Optional" + Status (akzeptiert / abgelehnt / ausstehend)

### Mitarbeiter
1. **`MyShifts.tsx`** – Bei Schichten mit `requires_location`:
   - Vor Schichtstart: Banner „Standort-Freigabe erforderlich" mit „Akzeptieren" / „Ablehnen"
   - Akzeptieren → `getCurrentPosition()` Permission-Prompt + `location_consent_at = now()`
   - Ablehnen → `location_consent_declined = true` + Warnung „Stunden werden nicht angerechnet"
2. **`useLiveLocationDuringShift.ts`** – Nur Pings senden wenn `location_consent_at` gesetzt UND `requires_location` true (oder freiwillig bei optional)
3. Hinweis bei aktiver Schicht: „Live-Standort wird gesendet"

## Technische Details

- **Karte:** `leaflet` + `react-leaflet` (npm), Tiles von OpenStreetMap (frei)
- **Live-Ping-Intervall:** 60 s (statt 120 s) während aktiver Pflicht-Schicht
- **Stunden-Berechnung:** Helper `isShiftCounted(shift)` → false wenn `requires_location && !location_consent_at`
- **Hintergrund-Tracking:** Browser kann nur tracken wenn Tab offen. Hinweis im UI „App geöffnet lassen" – echtes Background-Tracking benötigt Capacitor (ist bereits im Projekt → kann später Native-Plugin nutzen)

## Dateien
- Migration: shifts-Spalten + RLS-Update
- Edit: `ShiftsPage.tsx`, `DashboardPage.tsx`, `MyShifts.tsx`, `useLiveLocationDuringShift.ts`
- Neu: `src/components/admin/LiveMap.tsx`
- Neu: `src/lib/shiftHours.ts` (Helper)
- Install: `leaflet`, `react-leaflet`, `@types/leaflet`
