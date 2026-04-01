# Groupe Djamiyah — Site web officiel

Plateforme de réservation hôtelière pour le **Groupe Djamiyah** (Hôtel Maison Blanche, Coyah — Hôtel Rama, Guinée).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript strict |
| Styling | Tailwind CSS v4 + CVA + tailwind-merge |
| UI | lucide-react, framer-motion |
| Formulaires | react-hook-form + zod |
| Auth / DB | Supabase SSR (`@supabase/ssr`) |
| i18n | next-intl (fr / en) |
| Paiement | ChapChap (Orange Money, MTN MoMo, carte, cash) |
| Déploiement | Vercel |

---

## Démarrage local

### 1. Cloner et installer

```bash
git clone https://github.com/kabasidik-ai/djamiyah-group
cd djamiyah-group
npm install
```

### 2. Variables d'environnement

Copier le fichier exemple et remplir les valeurs :

```bash
cp .env.example .env.local
```

Variables obligatoires :

```
NEXT_PUBLIC_SUPABASE_URL=       # URL publique du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Clé anon publique Supabase
SUPABASE_SERVICE_ROLE_KEY=      # Clé service role (serveur uniquement)
CHAPCHAP_API_KEY_TEST=          # Clé API ChapChap (mode test)
CHAPCHAP_HMAC_SECRET=           # Secret HMAC pour vérification webhooks
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

```bash
npm run dev           # Serveur local (http://localhost:3000)
npm run build         # Build production
npm run start         # Démarrer en mode production
npm run lint          # ESLint
npm run type-check    # TypeScript strict (tsc --noEmit)
npm run format        # Prettier (écriture)
npm run format:check  # Prettier (vérification)
npm run db:types      # Régénérer les types Supabase depuis la DB locale
npm run db:reset      # Reset + seed de la base Supabase locale
npm run analyze       # Analyser le bundle (ANALYZE=true)
```

---

## Structure du projet

```
djamiyah-group/
├── middleware.ts                  # Routing i18n next-intl
├── next.config.ts                 # Config Next.js (CSP, i18n)
├── src/
│   ├── app/
│   │   ├── [locale]/              # Routes localisées (fr/en)
│   │   │   ├── page.tsx           # Page d'accueil
│   │   │   ├── rooms/             # Chambres
│   │   │   ├── reservation/       # Formulaire de réservation
│   │   │   ├── conferences/       # Salles de conférence
│   │   │   ├── restaurant/        # Restaurant
│   │   │   ├── hotels/            # Nos hôtels
│   │   │   ├── contact/           # Contact
│   │   │   └── ...
│   │   └── api/
│   │       ├── reservations/      # POST /api/reservations
│   │       └── chapchap/notify/   # Webhook paiement ChapChap
│   ├── components/
│   │   ├── ui/                    # Composants réutilisables (Button, Card…)
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── VideoHero.tsx
│   ├── data/
│   │   └── content.ts             # Données métier (prix GNF, textes, navigation)
│   ├── i18n/
│   │   └── routing.ts             # Config locales next-intl
│   ├── lib/
│   │   ├── supabase.ts            # Clients Supabase (browser/server/service-role)
│   │   ├── chapchap.ts            # Paiement ChapChap (HMAC, rate limit)
│   │   └── utils.ts               # cn(), helpers
│   └── types/
│       └── database.ts            # Types générés automatiquement par Supabase
└── public/
    └── images/                    # Assets images (logos, hôtels, chambres)
```

---

## Supabase

### Tables

| Table | Description |
|---|---|
| `rooms` | Chambres disponibles avec prix (GNF) |
| `conference_rooms` | Salles de conférence avec capacité |
| `reservations` | Réservations clients |
| `customers` | Profils clients |

### Types TypeScript

Les types sont générés automatiquement depuis la base de données :

```bash
npm run db:types
```

Import dans le code :

```typescript
import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase'

type Reservation = TableRow<'reservations'>
type NewReservation = TableInsert<'reservations'>
```

---

## Paiement ChapChap

ChapChap est le gateway de paiement africain intégré (Orange Money, MTN MoMo, carte, cash).

- **Mode test** : utiliser `CHAPCHAP_API_KEY_TEST`
- **Mode production** : utiliser `CHAPCHAP_API_KEY_PRODUCTION`
- **Webhooks** : vérification HMAC obligatoire via `verifyChapchapHmac()` dans `lib/chapchap.ts`
- **URL notify** : `CHAPCHAP_NOTIFY_URL` doit pointer sur `/api/chapchap/notify`

---

## Internationalisation

Le site supporte le français (défaut) et l'anglais.

- Route française : `/rooms`, `/reservation`, etc.
- Route anglaise : `/en/rooms`, `/en/reservation`, etc.

Les textes sont dans `src/messages/` (fichiers `fr.json`, `en.json`).

---

## Déploiement Vercel

Le projet se déploie automatiquement depuis la branche `main`.

Variables à renseigner dans Vercel (Dashboard → Settings → Environment Variables) :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CHAPCHAP_API_KEY_PRODUCTION
CHAPCHAP_HMAC_SECRET
CHAPCHAP_BASE_URL=https://api.chapchappay.com
CHAPCHAP_NOTIFY_URL=https://djamiyah-group.vercel.app/api/chapchap/notify
CHAPCHAP_RETURN_URL=https://djamiyah-group.vercel.app/reservation/success
NEXT_PUBLIC_SITE_URL=https://djamiyah-group.vercel.app
```

---

## Sécurité

- `.env.local` jamais commité (couvert par `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur — jamais exposé au client
- RLS (Row Level Security) activée sur toutes les tables Supabase
- Webhooks ChapChap vérifiés par signature HMAC SHA-256
- CSP (Content Security Policy) configurée dans `next.config.ts`

---

## Données métier (prix en GNF)

| Chambre | Prix / nuit |
|---|---|
| Chambre Confort | 520 000 GNF |
| Chambre Premium | 720 000 GNF |
| Double Premium | 870 000 GNF |
| Suite Premium | 1 070 000 GNF |
| Suite Prestige | 1 620 000 GNF |

| Salle de conférence | Prix / jour |
|---|---|
| Wonkifon (20 places) | 1 500 000 GNF |
| Somayah (50 places) | 2 000 000 GNF |
| Maneah (75 places) | 2 500 000 GNF |
| Soumbouyah (150 places) | 5 000 000 GNF |

---

## Contact

- **Site** : [djamiyah-group.vercel.app](https://djamiyah-group.vercel.app)
- **Email** : contact@djamiyah.com
- **Téléphone** : +224 610 75 90 90
- **Adresse** : Coyah, Guinée
