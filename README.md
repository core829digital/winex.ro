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

## Area admin (`/admin`)

Pannello riservato (non indicizzato) per: **statistiche in tempo reale** (visitatori attivi, pagine, click, sorgenti, dispositivi, paesi), **messaggi** dal modulo contatti con notifiche istantanee, **newsletter** (iscritti, export CSV), **campagne e-mail** (editor, anteprima, test, invio/programmazione, statistiche aperture/click), **blog** (predisposto, non pubblico), **contenuti** (dati societari modificabili) e **sicurezza** (admin autorizzati, audit log).

### Primo avvio
1. `npx convex dev` — collega/crea il progetto Convex, rigenera `convex/_generated/*` (committare il risultato) e fa il typecheck del backend.
2. `npx @convex-dev/auth` — imposta `SITE_URL`, `JWT_PRIVATE_KEY` e `JWKS` su Convex.
3. Variabili Convex (`npx convex env set …`): `ADMIN_EMAILS`, `INGEST_SECRET`, `AUTH_RESEND_KEY`, `RESEND_API_KEY`, `RESEND_FROM` (vedi `.env.example`).
4. Variabili Vercel: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_INGEST_SECRET`, Resend, VAPID (vedi `.env.example`).
5. Resend: verifica il dominio, attiva *open/click tracking*, crea un webhook verso `https://www.winex.ro/api/webhooks/resend` (eventi `email.delivered`, `opened`, `clicked`, `bounced`, `complained`) e copia il segreto in `RESEND_WEBHOOK_SECRET`.
6. Produzione Convex: `npx convex deploy`.
7. Apri `/admin/login`, inserisci un'email presente in `ADMIN_EMAILS` e il codice a 8 cifre ricevuto.

### Sicurezza dell'admin
Accesso con codice monouso via e-mail (10 min), solo per le e-mail autorizzate; ogni funzione Convex ricontrolla sessione e lista admin; sessione max 7 giorni / 12 h di inattività; scritture dal sito protette da segreto condiviso; webhook con firma Svix + anti-replay; analytics senza cookie (ID anonimo giornaliero, rispetta DNT/GPC, eventi grezzi cancellati dopo 3 giorni).

### Newsletter con doppia conferma (double opt-in)
Chi si iscrive dal sito resta **«în așteptare»** finché non clicca il link nell'e-mail di conferma (pagina `/confirma-abonare`, con click esplicito: i filtri antispam non confermano da soli). Solo dopo la conferma diventa **attivo**, riceve l'e-mail di benvenuto e può ricevere campagne. Dettagli: link valido 7 giorni e monouso; massimo 1 e-mail di conferma ogni 10 minuti per indirizzo; la risposta del form è sempre la stessa (nessuno può scoprire chi è già iscritto); le richieste non confermate si cancellano dopo 30 giorni; la data di conferma resta come prova del consenso. Richiede Convex **e** Resend configurati, altrimenti il form risponde «servizio non disponibile» (e non salva nulla).

### Notifiche push
`/admin/notificari` → «Activează». Su iPhone serve aggiungere il sito alla schermata Home (PWA) e aprirlo da lì.

### Test
`npm test` — 41 test (Convex in-process con `convex-test`: permessi, newsletter, analytics, campagne con Resend simulato, blog, impostazioni, push; firma webhook; validazioni).

## Da completare (contenuti)

Dati societari, testi About, foto fabbrica, logo ufficiale, revisione legale delle pagine legali.

## Performance (mobile-first)

- `backdrop-filter` (glass) attivo solo su desktop con puntatore reale; su touch/schermi piccoli superfici opache equivalenti.
- Sfondo canvas con profilo leggero su mobile (24 fps, 4 nastri), in pausa durante lo scroll e auto-spegnimento su dispositivi lenti.
- Animazioni infinite e 3D dell'hero solo su desktop e solo quando visibili; nessun `filter: blur` in animazione.
- Lenis solo su desktop (su touch scroll nativo). Menu mobile animato solo con `transform`/`opacity`.
- `content-visibility: auto` sulle sezioni sotto la piega.
- Misura di riferimento (Chromium, emulazione iPhone, CPU 4× più lenta): 24 → 60 fps; latenza tap 168–312 ms → 40–72 ms.
