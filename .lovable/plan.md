## Ziel

Vier neue Features für das Schicht- & Standortsystem:

1. **Geofence pro Objekt** — Admin zeichnet auf der Karte einen Radius/Polygon um jedes Objekt
2. **Adresse in Schicht** — Bei Schicht-Einteilung wird auch die Adresse des Objekts mitgeteilt
3. **Start- & End-Standort** — Beim Akzeptieren Start-Position speichern, beim Schicht-Ende automatisch End-Position speichern (live-Tracking bleibt wie bisher)
4. **SOS-Notruf** — Mitarbeiter löst Notruf aus → Admin + alle Kollegen mit aktiver Schicht im 1 km Radius werden alarmiert

---

## 1. Datenbank-Änderungen (Migration)

**`global_locations` erweitern:**
- `address` text — Adresse des Objekts
- `lat`, `lng` double precision — Koordinaten (für Geofence-Mittelpunkt)
- `geofence_radius_m` integer default 200 — Radius in Metern (0 = kein Geofence)

**`shifts` erweitern:**
- `address` text — Adresse-Snapshot beim Erstellen
- `lat`, `lng` double precision — Objekt-Koordinaten (für Geofence-Check & SOS-Radius)
- `geofence_radius_m` integer — Geofence-Snapshot
- `start_location_lat/lng` + `start_location_at` — Erster Standort beim Akzeptieren
- `end_location_lat/lng` + `end_location_at` — Letzter Standort nach Schichtende

**Neue Tabelle `sos_alerts`:**
- `user_id`, `shift_id` (nullable), `lat`, `lng`, `message` text, `resolved_at`, `created_at`
- RLS: Mitarbeiter inserten eigene; Admins sehen alle; Mitarbeiter sehen Alerts im 1 km Radius über RPC

**Neue RPC-Funktion `get_nearby_active_sos(user_lat, user_lng)`:**
- Liefert aktive (nicht resolved) SOS-Alarme innerhalb 1 km für eingeloggte Mitarbeiter mit aktiver Schicht.

---

## 2. UI-Änderungen

**`CatalogPage` (Objekte verwalten):**
- Neue Felder im Formular: Adresse, Koordinaten (mit „Adresse geocoden"-Button via Google Maps Connector), Geofence-Radius-Slider
- Mini-Karte mit Marker + Kreis zum Visualisieren / Anpassen per Klick

**`ShiftsPage`:**
- Beim Auswählen eines Objekts aus dem Katalog werden Adresse + Koordinaten + Radius automatisch in die Schicht übernommen
- Anzeige der Adresse in der Schichtliste

**`MyShifts` (Mitarbeiter):**
- Adresse wird angezeigt + „Route in Maps öffnen"-Link
- Bei Akzeptieren: erste Position wird zusätzlich als `start_location_*` gespeichert
- SOS-Button (groß, rot) — sichtbar während aktiver Schicht
- Beim Schicht-Ende (Hook erkennt Übergang): letzter bekannter Standort wird als `end_location_*` gespeichert

**`LiveMap` (Admin):**
- Geofence-Kreise um jedes Objekt mit aktiver Schicht
- Marker für Start-/End-Positionen pro Schicht
- SOS-Alarme als pulsierender roter Marker mit Popup + „Erledigt"-Button

**Neuer SOS-Banner global (Mitarbeiter):**
- Wenn `get_nearby_active_sos` einen Alarm in 1 km liefert → Vollbild-Alert mit Position, Name, „Anrufen"/„Route"-Buttons

---

## 3. Technische Details

- **Geocoding**: Google Maps Platform Connector über Gateway (Geocoding API) — Admin gibt Adresse ein → Koordinaten werden ermittelt
- **Distanzberechnung**: Haversine direkt in SQL (RPC) für SOS-Radius
- **SOS-Trigger**: Edge Function `trigger-sos` — fügt Alert ein, könnte später Push/E-Mail an Admin senden
- **End-Standort**: Im `useLiveLocationDuringShift` Hook erkennen wenn `activeShiftIdRef` von ID zu null wechselt → letzten `lastPosRef` als End-Position speichern
- **Real-time SOS**: Supabase Realtime auf `sos_alerts` für sofortige Benachrichtigung

---

## Reihenfolge der Umsetzung

1. Migration (Schema + RPC + RLS)
2. Google Maps Connector aktivieren (falls noch nicht)
3. CatalogPage mit Geofence-Editor
4. ShiftsPage mit Adress-Übernahme
5. MyShifts mit Adresse, Start-Standort, SOS-Button
6. End-Standort-Speicherung im Hook
7. LiveMap mit Geofence-Kreisen + SOS-Anzeige
8. Globaler SOS-Banner für Mitarbeiter im Umkreis
