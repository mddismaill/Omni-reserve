# OmniReserve Booking Superapp

A React + Vite + TypeScript luxury booking superapp integrating Tabletop dining, Bookly services, OmniStay hotels, an AI concierge, and the Invest & Back crowdfunding module.

## Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Lucide icons
- **Backend:** Express server with Vite dev middleware (`server.ts`)
- **AI:** Google Gemini (requires `GEMINI_API_KEY`)
- **Auth/Data:** Supabase (optional), Firebase, Stripe, Google Maps

## Run locally

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5000` by default (configured via `--port 5000` in the Replit workflow).

## Build

```bash
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in required values:

```env
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
GEMINI_API_KEY=
```

- `GEMINI_API_KEY` is required for AI concierge features. The app starts without it, but AI chat endpoints will fail.
- Supabase credentials are only needed if you want to use the live Supabase backend.

## Replit workflow

The `Start application` workflow runs `npm run dev -- --port 5000` so the app is visible in the Replit preview pane.
