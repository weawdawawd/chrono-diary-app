## Ziel

Die gesamte App (Mitarbeiter- + Admin-Bereich) in alle 8 Sprachen übersetzen: DE, EN, AR, FA, SQ, ES, FR, TR. RTL-Layout für AR/FA bereits vorhanden, wird beibehalten.

## Vorgehen

### Wörterbuch-Refactor (einmalig, vor Phase 1)

Das aktuelle `dict` in `src/lib/i18n.tsx` wird unübersichtlich, wenn hunderte Strings reinkommen. Daher:

- `src/lib/i18n/` als Ordner anlegen
- `src/lib/i18n/keys.ts` — alle Übersetzungs-Keys + DE-Quelle
- `src/lib/i18n/locales/{en,ar,fa,sq,es,fr,tr}.ts` — eine Datei pro Sprache
- `src/lib/i18n.tsx` lädt diese und exportiert `useT()` weiter (kein API-Bruch)
- Fallback bleibt: fehlender Key → DE-Quelle anzeigen

### Phase 1 — Mitarbeiter-Bereich (diese Iteration)

Komponenten, die normale Mitarbeiter sehen, vollständig verdrahten:

- `src/pages/Auth.tsx`, `AcceptInvite.tsx`, `ResetPassword.tsx`, `Unsubscribe.tsx`
- `src/pages/Index.tsx`
- `src/components/`: `WorkEntryForm`, `WorkEntryList`, `WorkStats`, `WeeklyChart`, `MonthlyComparisonChart`, `MonthFilter`, `MyShifts` (Ausbau), `MyShiftsCalendar`, `MyLogbook`, `GuardLog`, `ShiftClock`, `SosBanner`, `SosButton` (Ausbau), `DailyReminder`, `ExportDialog`, `SettingsDialog`, `HeaderMenu` (Ausbau), `AvatarUpload`, `PhoneSetting`, `WorkCalendar`, `ShiftMiniCalendar`, `DuplicateButton`, `NavLink`, `PatrolScanner`
- Alle `toast.success/error/info` in diesen Dateien

### Phase 2 — Admin-Bereich (nächste Iteration)

- `src/pages/admin/`: `AdminLayout`, `DashboardPage`, `EmployeesPage`, `InvitationsPage`, `LogbookPage`, `PatrolPage`, `ShiftsPage`, `SessionsPage`, `CatalogPage`
- `src/components/admin/`: `AdminSidebar`, `AdminUserMenu`, `AccountSettingsDialog`, `LiveMap`
- `src/components/AdminPanel.tsx`

### Phase 3 — Polish

- E-Mail-Templates (`supabase/functions/_shared/...`) — entweder beibehalten (DE) oder pro Empfänger-Sprache, klärungsbedürftig
- Restliche kleine Komponenten + Toasts, die in Phase 1/2 übersehen wurden
- Manuelle Durchsicht aller 8 Sprachen auf Tippfehler

## Technische Details

- Keys = englische Slugs (z. B. `auth.login.title`), nicht mehr deutsche Originalstrings — sauberer und kollisionsfrei.
- Jede `.ts`-Locale-Datei exportiert ein `Record<string, string>`; TypeScript erzwingt nichts (Lücken erlaubt, Fallback greift).
- Wo Strings dynamische Werte enthalten (`${count} Stunden`), bekommt `t()` Parameter: `t("stats.hours", { count })`.
- RTL: `document.documentElement.dir` wird bereits gesetzt, keine Änderung.
- Date/Number-Formate werden via `Intl` an `lang` gekoppelt (kurzer Helper `formatDate(date, lang)`).

## Liefer-Reihenfolge in dieser Antwort

Nur Phase 1 wird jetzt umgesetzt. Phase 2 + 3 folgen, sobald du Phase 1 abgenommen hast — sonst wird die Änderungsmenge zu groß für eine saubere Review.
