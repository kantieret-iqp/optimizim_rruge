# DeliveryRoute — TSP/VRP me pgRouting

Sistem optimizimi rrugësh për dorëzime, ndërtuar me React + Supabase + pgRouting.

## Stack teknologjik

- **Frontend**: React 18 + TypeScript + Vite
- **Harta**: Leaflet + react-leaflet (OpenStreetMap)
- **Backend**: Supabase (PostgreSQL + PostGIS + pgRouting)
- **API**: Supabase Edge Functions (Deno)
- **Deploy**: Vercel (frontend) + Supabase (backend)

## Karakteristika

- ✅ TSP (1 shofer) dhe VRP (3 shoferë) me K-means clustering
- ✅ Dritare kohore (time windows) — dorëzo para orës X
- ✅ Realtime — rruga azhurnohet automatikisht kur ndryshojnë pikat
- ✅ Klikoni hartën për të shtuar pika dorëzimi
- ✅ Statistika: distanca, karburant, numri i pikave
- ✅ Dark mode UI profesional

---

## Instalimi lokal

```bash
git clone https://github.com/username/vrp-delivery.git
cd vrp-delivery
npm install
cp .env.example .env
# Plotëso .env me kredencialet e Supabase
npm run dev
```

---

## Deploy hap pas hapi

### 1. Supabase — Database

1. Shko te [supabase.com](https://supabase.com) → Krijo projekt të ri
2. Shko te **SQL Editor**
3. Kopjo dhe ekzekuto të gjithë skedarin: `supabase/migrations/20240101000000_init_pgrouting.sql`
4. Kontrollo te **Table Editor** — duhet të shohësh: `vehicles`, `stops`, `depot`, `routes`

### 2. Supabase — Edge Function

```bash
# Instalo Supabase CLI
npm install -g supabase

# Login
supabase login

# Lidhu me projektin tënd
supabase link --project-ref YOUR_PROJECT_REF

# Deploy funksionin
supabase functions deploy optimize-route
```

Gjej `YOUR_PROJECT_REF` te: Supabase Dashboard → Settings → General → Reference ID

### 3. Variablat e mjedisit (.env)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Gjej këto te: Supabase Dashboard → Settings → API

### 4. Vercel — Frontend

```bash
# Instalo Vercel CLI
npm install -g vercel

# Deploy
vercel

# Gjatë konfigurimit:
# - Framework: Vite
# - Build Command: npm run build
# - Output Directory: dist
```

**Ose direkt nga GitHub:**
1. Shko te [vercel.com](https://vercel.com) → New Project
2. Importo repo-n nga GitHub
3. Shto Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

---

## Struktura e projektit

```
vrp-delivery/
├── src/
│   ├── components/
│   │   ├── DeliveryMap.tsx     # Harta Leaflet
│   │   ├── StopList.tsx        # Lista e pikave
│   │   ├── StopForm.tsx        # Formulari i shtimit
│   │   ├── StatsBar.tsx        # Statistikat lart
│   │   └── Modal.tsx           # Modalja
│   ├── hooks/
│   │   ├── useRouteOptimizer.ts # Hook kryesor TSP/VRP
│   │   ├── useStops.ts          # CRUD pikat
│   │   └── useVehicles.ts       # Automjetet
│   ├── lib/
│   │   └── supabase.ts          # Klienti Supabase
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx                  # Aplikimi kryesor
│   ├── main.tsx                 # Entry point
│   └── index.css                # Stilet globale
├── supabase/
│   ├── functions/
│   │   └── optimize-route/
│   │       └── index.ts         # Edge Function
│   └── migrations/
│       └── 20240101000000_init_pgrouting.sql
├── .env.example
├── vercel.json
├── vite.config.ts
└── README.md
```

---

## Zgjerim i mundshëm

| Funksionalitet | Si ta shtosh |
|---|---|
| Autentifikim shoferësh | `supabase auth` + RLS policies |
| Trafik real | Integrim HERE Maps API në Edge Function |
| Notifications | Supabase Realtime + push notifications |
| Raporte PDF | `jspdf` në frontend |
| Mobile app | React Native + same hooks |

---

## Licenca

MIT
