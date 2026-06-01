## Status

Bereits vorhanden:
- Tabellen `patrol_points`, `patrol_routes`, `patrol_scans`
- Mitarbeiter-Scanner (`PatrolScanner.tsx`) mit NFC + QR
- Admin-Seite mit Punkten, Routen-Anlage (ohne Punkte-Zuordnung) und Live-Scan-Liste

Fehlt: Sessions (Start/Ende), Routen-Punkte-Zuordnung, GPS-Validierung, signierte QR-Codes, Offline-Queue, Filter im Admin.

## Geplante Änderungen

### 1) Datenbank-Migration

- Neue Tabelle `patrol_route_points` (route_id, point_id, order_index, UNIQUE) — verknüpft Punkte mit Routen
- Neue Tabelle `patrol_sessions` (user_id, route_id, started_at, ended_at, start_lat/lng, end_lat/lng, status: active/completed/incomplete)
- `patrol_scans`: Spalten `session_id`, `route_id`, `distance_m`, `valid` ergänzen
- `patrol_points`: Spalte `qr_secret` (zufällig) für signierte QR-Payload
- RLS-Policies + GRANTs für neue Tabellen analog bestehender Patrol-Policies
- RPC `start_patrol_session(_route_id, _lat, _lng)` und `end_patrol_session(_session_id, _lat, _lng)` (SECURITY DEFINER) — prüft Vollständigkeit und setzt Status

### 2) Admin (`PatrolPage.tsx`)

- Rundgang-Dialog: Auswahl mehrerer Punkte mit Reihenfolge (drag oder ↑/↓), speichert `patrol_route_points`
- Scans-Tab: Filter Mitarbeiter / Datumsbereich / Scan-Typ / Status (gültig/ungültig)
- QR-Druck nutzt signierte Payload `code.qr_secret` (Base64)

### 3) Mitarbeiter (`PatrolScanner.tsx`)

- Button „Rundgang starten" → Auswahl Route → ruft `start_patrol_session` (GPS); zentraler Scan-Screen während Session
- NFC primär, QR als Fallback; verifiziert signierten QR-Payload
- Pro Scan: GPS-Position vergleichen mit Punkt (>50 m → Warnung, `valid=false`)
- Fortschrittsanzeige: x/y Punkte gescannt
- „Beenden" → `end_patrol_session`; zeigt ✅ vollständig oder ❌ unvollständig
- Offline: ausstehende Scans in `localStorage` zwischenspeichern, Re-Sync bei `online`-Event

### 4) Technische Details

- `qrcode` und `html5-qrcode` sind bereits installiert
- GPS-Distanz: Haversine-Helper in `src/lib/geo.ts`
- QR-Payload-Format: `LDN1.<point_id>.<hmac8>` — HMAC mit `qr_secret`, serverseitig per RPC `verify_patrol_qr` geprüft
- Offline-Sync-Hook `useOfflineScanQueue.ts`

## Out of Scope (kurz)

- Echte E2E-Verschlüsselung der NFC-Tags (NFC-ID-Vergleich bleibt wie heute)
- Push-Benachrichtigungen an Admin bei ungültigem Scan