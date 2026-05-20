# Arbeitszeit Tracker

Eine PWA-Anwendung zur Eintragung von Arbeitszeiten, Ort und Tätigkeit.

## Technologien

- **Vite** - Build-Tool und Entwicklungsserver
- **TypeScript** - Typsichere Entwicklung
- **React** - UI-Framework
- **shadcn/ui** - UI-Komponenten
- **Tailwind CSS** - Styling
- **Supabase** - Backend und Authentifizierung
- **Capacitor** - Native Mobile-App Unterstützung

## Installation

```bash
# Repository klonen
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

Erstelle eine `.env` Datei im Projektverzeichnis mit folgenden Variablen:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Verfügbare Scripts

- `npm run dev` - Entwicklungsserver starten
- `npm run build` - Produktions-Build erstellen
- `npm run preview` - Produktions-Build lokal testen
- `npm run lint` - Code-Linting ausführen
- `npm test` - Tests ausführen

## Deployment

### Vercel (Empfohlen)

1. Verbinde dein GitHub Repository mit Vercel
2. Setze die Umgebungsvariablen in den Vercel-Projekteinstellungen
3. Vercel erkennt automatisch die Vite-Konfiguration

### Manuelle Installation

```bash
npm run build
# Der `dist` Ordner enthält die statischen Dateien
```

## Custom Domain

Um eine eigene Domain zu verbinden:

1. Deploye die App auf Vercel
2. Gehe zu Projekteinstellungen > Domains
3. Füge deine Domain hinzu und konfiguriere die DNS-Einträge
