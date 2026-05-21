# Umsetzungsplan – 6 Features

## 1. Neue Rolle "Objektleiter"

**Datenbank-Migration:**
- `app_role` Enum um `'objektleiter'` erweitern
- RLS-Policies anpassen, damit Objektleiter Schichten erstellen darf (INSERT/UPDATE/SELECT/DELETE auf `shifts`), aber **keinen** Zugriff auf `work_entries` anderer hat
- Bestehende Admin-Policies bleiben unverändert
- Neue Helper-Funktion `is_planner(_user_id)` = `is_admin OR has_role(objektleiter)` für Schicht-Policies

**Admin-UI (`EmployeesPage`):**
- Pro Mitarbeiter Dropdown: Security / Objektleiter / Admin
- Speichert Rolle in `user_roles`

## 2. Objektleiter-Ansicht

- Objektleiter loggt sich ein wie normaler Mitarbeiter
- In `Index.tsx`: wenn `role === 'objektleiter'` → zusätzlicher Tab/Bereich "Schicht-Einteilung" sichtbar
- Wiederverwendung der bestehenden `ShiftsPage`-Logik in einer neuen Komponente `PlannerView`, **ohne** Zugriff auf Mitarbeiter-Stunden/Statistik
- Mitarbeiter-Bereich (eigene Stunden, eigene Schichten) bleibt erhalten

## 3. SOS-Weiterleitung an Kollegen im 1 km

- `useUserRole` Hook nutzen, um `SosBanner` in `Index.tsx` für **alle** eingeloggten Mitarbeiter zu rendern (aktuell evtl. nur an einer Stelle)
- Realtime-Channel sicherstellen (`postgres_changes` auf `sos_alerts` für `authenticated` Role)
- RLS auf `sos_alerts` ergänzen: SELECT auf nicht-resolved Alerts, damit Realtime-Events Mitarbeiter erreichen — Inhalt wird ohnehin via `get_nearby_active_sos` gefiltert
- Geolocation-Permission beim ersten Schicht-Start anfordern, damit `getCurrentPosition` zuverlässig funktioniert

## 4. Objekt-Dropdown in Schicht-Einteilung

- In `ShiftsPage` beim Feld "Objekt": `<Select>` mit allen Einträgen aus `global_locations` statt freier Text
- Auswahl übernimmt automatisch `address`, `lat`, `lng`, `geofence_radius_m` in die neue Schicht

## 5. Ledion-Logo im PDF

- `src/lib/exportPDF.ts`: Logo (`@/assets/ledion-logo.png`) als Base64 einbetten via `addImage()` oben links, Titel daneben

## 6. Schichten als Zeitraum (Von–Bis)

- `ShiftsPage` Formular: zusätzlich Datumsbereich (Von/Bis) + Wochentage-Auswahl (optional alle)
- Beim Speichern: Schleife über jeden Tag im Bereich → eine Schicht pro Tag mit gleicher Zeit/Objekt/Mitarbeiter

---

## Reihenfolge

1. Migration (Rolle + Helper + Policies)
2. EmployeesPage: Rollen-Dropdown
3. ShiftsPage: Objekt-Dropdown + Zeitraum
4. PlannerView für Objektleiter + Routing in Index
5. PDF-Logo
6. SOS-Banner global einbinden + Realtime prüfen
