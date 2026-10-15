# Winex.ro

Sito web di **Winex** — fabbrica di tâmplărie PVC, aluminiu e lemn (Roman, România). Sviluppato da CORE829 SRL.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Lenis · Convex · Resend · Zod · npm

## Avvio

```bash
npm install
cp .env.example .env.local   # compila i valori
npm run dev                  # http://localhost:3000
npm run lint && npm run typecheck && npm run build
```

## Struttura

| Percorso | Contenuto |
|---|---|
| `src/app` | Pagine: `/`, `/despre-noi`, `/fabrica`, `/configurator`, `/contact`, pagine legali, API `/api/contact` e `/api/newsletter` |
| `src/components/home` | Hero (spatial UI 3D in vetro), Materiali, Energia, Processo, CTA |
| `src/components/visual/EnergyFlow.tsx` | Sfondo canvas "flusso di energia" (pausa se tab nascosta, statico con reduced-motion) |
| `src/lib/site.ts` | **Dati aziendali centrali** (campi `TODO` da sostituire) |
| `convex/` | Schema + mutation (`leads`, `subscribers`) protette da segreto condiviso |

## Configurazione servizi

1. **Convex**: `npx convex dev` (crea il progetto), poi `npx convex env set INGEST_SECRET <segreto>`; imposta `NEXT_PUBLIC_CONVEX_URL` e lo stesso segreto in `CONVEX_INGEST_SECRET`.
2. **Resend**: verifica il dominio `winex.ro`, imposta `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO_EMAIL` (+ `RESEND_AUDIENCE_ID` per la newsletter).
3. **OneSpec**: imposta `NEXT_PUBLIC_ONESPEC_URL` (https) → la pagina `/configurator` mostra l'iframe. La CSP in `next.config.ts` ammette `onespec.eu`.
4. **Foto**: copia in `public/photos/` e passa `src` ai componenti `PhotoSlot`.

## Sicurezza

CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy; validazione Zod, honeypot, rate-limit in memoria, controllo Origin sulle API; scritture Convex autenticate con segreto. Per traffico ostile aggiungere rate-limit a livello edge (Vercel Firewall/Upstash).

## Da completare (contenuti)

Dati societari, testi About, foto fabbrica, logo ufficiale, revisione legale delle pagine legali.

## Performance (mobile-first)

- `backdrop-filter` (glass) attivo solo su desktop con puntatore reale; su touch/schermi piccoli superfici opache equivalenti.
- Sfondo canvas con profilo leggero su mobile (24 fps, 4 nastri), in pausa durante lo scroll e auto-spegnimento su dispositivi lenti.
- Animazioni infinite e 3D dell'hero solo su desktop e solo quando visibili; nessun `filter: blur` in animazione.
- Lenis solo su desktop (su touch scroll nativo). Menu mobile animato solo con `transform`/`opacity`.
- `content-visibility: auto` sulle sezioni sotto la piega.
- Misura di riferimento (Chromium, emulazione iPhone, CPU 4× più lenta): 24 → 60 fps; latenza tap 168–312 ms → 40–72 ms.
