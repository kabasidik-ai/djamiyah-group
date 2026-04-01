# PROJECT_CONTEXT.md — Groupe Djamiyah
# Fichier de contexte pour Antigravity / assistants IA (Cline, Claude, Cursor…)
# Ne pas supprimer. Ne pas commiter de secrets dans ce fichier.

---

## IDENTITÉ DU PROJET

- **Nom du projet** : djamiyah-group
- **Client** : Groupe Djamiyah
- **Marque principale** : Groupe Djamiyah
- **Sous-marque** : Hôtel Maison Blanche — Coyah, Guinée
- **Deuxième propriété** : Hôtel Rama — Guinée (à venir)
- **Type** : Site institutionnel + plateforme de réservation hôtelière en ligne
- **Langue principale** : Français (avec version anglaise)
- **Marché cible** : Guinée, Afrique de l'Ouest, diaspora africaine
- **Tagline** : "Plus qu'un séjour, une expérience."

---

## IDENTITÉ VISUELLE

| Élément | Valeur |
|---|---|
| Couleur principale | `#0D3B3E` (teal foncé) |
| Couleur accent | `#F9A03F` (orange/ambre) |
| Typographie titres | Playfair Display (serif élégant) |
| Typographie corps | Inter (sans-serif lisible) |
| Style | Premium, hospitalité haut de gamme, moderne |
| Ambiance | Luxe accessible, chaleur africaine, sophistication internationale |

Ne jamais utiliser de couleurs en dehors de la charte sauf pour les états UI standards (gris neutres, rouge erreur, vert succès).

---

## STACK TECHNIQUE COMPLÈTE

```
Framework        Next.js 15 — App Router UNIQUEMENT (jamais Pages Router)
Langage          TypeScript strict (no any, no implicit any)
Styling          Tailwind CSS v4 + class-variance-authority (CVA) + tailwind-merge
UI Components    lucide-react (icônes) + framer-motion (animations)
Formulaires      react-hook-form + zod (validation côté client ET serveur)
Auth / DB        Supabase SSR via @supabase/ssr
i18n             next-intl v4 (locales: fr [défaut], en)
Dates            date-fns
Paiement         ChapChap (gateway africain: Orange Money, MTN MoMo, carte, cash)
Linting          ESLint 9 (eslint.config.mjs) + Prettier
Git hooks        Husky + lint-staged
Déploiement      Vercel (auto-deploy depuis main)
Node.js          ≥ 18
```

---

## ARCHITECTURE DES RÉPERTOIRES

```
src/
├── app/
│   ├── [locale]/           # Routes i18n — TOUJOURS dans ce dossier
│   │   ├── page.tsx         # Accueil
│   │   ├── rooms/           # Chambres
│   │   ├── reservation/     # Réservation
│   │   ├── conferences/     # Salles de conférence
│   │   ├── restaurant/      # Restaurant gastronomique
│   │   ├── hotels/          # Nos hôtels
│   │   ├── contact/         # Contact
│   │   ├── about/           # À propos
│   │   ├── careers/         # Emplois
│   │   ├── privacy/         # Politique de confidentialité
│   │   └── terms/           # Conditions d'utilisation
│   └── api/
│       ├── reservations/    # POST — créer une réservation
│       └── chapchap/
│           └── notify/      # POST — webhook paiement ChapChap
├── components/
│   ├── ui/                  # Composants atomiques réutilisables
│   │   ├── LogoIcon.tsx      # Logo SVG animé avec variantes (primary/white/dark)
│   │   ├── Button, Card, Input, Modal, Badge…
│   │   └── index.ts         # Barrel export
│   ├── Navigation.tsx       # Header 88px scroll-aware avec logo + CTA
│   ├── Footer.tsx           # Footer avec logo white + liens + CTA réservation
│   └── VideoHero.tsx        # Hero avec vidéo de fond
├── data/
│   ├── content.ts           # Source de vérité : siteConfig, rooms, conferences, navigation
│   ├── hotels.ts            # Données des hôtels
│   └── logos.ts             # Références logos SVG
├── i18n/
│   ├── routing.ts           # defineRouting (locales, localePrefix: as-needed)
│   ├── request.ts           # getRequestConfig pour next-intl
│   └── navigation.ts        # Link/useRouter localisés
├── lib/
│   ├── supabase.ts          # Clients Supabase + types utilitaires
│   ├── chapchap.ts          # HMAC verify, rate limit, security headers
│   └── utils.ts             # cn(), helpers généraux
└── types/
    └── database.ts          # Types auto-générés par Supabase (NE PAS éditer manuellement)
```

---

## RÈGLES ABSOLUES — LIRE AVANT DE CODER

### TypeScript
- Jamais de `any` — utiliser `unknown` puis narrow, ou `never`
- `type` plutôt qu'`interface` (sauf quand on étend)
- Zod pour TOUTE validation externe (formulaires, API routes, webhooks)
- Props toujours typées explicitement
- Types DB : toujours importer depuis `@/lib/supabase` :
  ```typescript
  import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase'
  type Reservation = TableRow<'reservations'>
  type NewRes = TableInsert<'reservations'>
  ```

### Next.js
- App Router UNIQUEMENT — jamais de `getServerSideProps`, `getStaticProps`, ni Pages Router
- Server Components par défaut — `"use client"` uniquement si hooks ou événements UI
- Server Actions pour les mutations (formulaires → `createReservation()`)
- Chaque page : `export const metadata` ou `generateMetadata()`
- Routes i18n : toujours dans `src/app/[locale]/`
- `loading.tsx` + `error.tsx` + `not-found.tsx` sur les routes importantes

### Supabase
- Côté serveur (Route Handlers, Server Actions, Server Components) : `createServerClient()`
- Côté client (Client Components avec subscriptions temps réel) : `createBrowserClient()`
- Admin/webhooks (opérations privilegiées) : `createServiceRoleClient()`
- RLS TOUJOURS activée — ne jamais bypasser sauf `serviceRoleClient` justifié
- Lire `src/types/database.ts` avant tout accès DB
- Jamais de secrets Supabase dans du code client

### ChapChap (paiement)
- Toujours appeler `verifyChapchapHmac()` sur les webhooks entrants
- Appeler `checkRateLimit()` avant tout appel sortant à l'API ChapChap
- Toujours utiliser `CHAPCHAP_API_KEY_TEST` en développement, `CHAPCHAP_API_KEY_PRODUCTION` en prod
- L'URL notify webhook : `/api/chapchap/notify`

### Styling
- Toujours `cn()` depuis `@/lib/utils` pour les classes conditionnelles
- CVA pour les composants avec variantes (taille, état, couleur)
- Jamais de `style={}` inline sans justification
- Mobile-first : `sm:` → `md:` → `lg:` → `xl:`
- Couleurs de marque : `#0D3B3E` et `#F9A03F` — utiliser `text-[#0D3B3E]` etc.

### Nommage
- Composants : `PascalCase.tsx` → `ReservationCard.tsx`
- Hooks/utils : `camelCase.ts` → `useReservation.ts`
- Dossiers : `kebab-case/` → `room-booking/`
- Constantes : `UPPER_SNAKE_CASE`
- Server Actions : verbe + entité → `createReservation()`

---

## DONNÉES MÉTIER — SOURCE DE VÉRITÉ

### Chambres (prix en GNF/nuit)

| Nom | Prix/nuit | Type DB |
|---|---|---|
| Chambre Confort | 520 000 GNF | `premium` |
| Chambre Premium | 720 000 GNF | `premium` |
| Double Premium | 870 000 GNF | `premium` |
| Suite Premium | 1 070 000 GNF | `suite` |
| Suite Prestige | 1 620 000 GNF | `suite` |

⚠️ L'enum DB `room_type_enum` = `'standard' | 'premium' | 'suite'`. Le mapping name→enum doit être explicite dans le code.

### Salles de conférence (prix en GNF/jour)

| Salle | Capacité | Prix/jour |
|---|---|---|
| Wonkifon | 20 places | 1 500 000 GNF |
| Somayah | 50 places | 2 000 000 GNF |
| Maneah | 75 places | 2 500 000 GNF |
| Soumbouyah | 150 places | 5 000 000 GNF |

### Contact officiel

- **Téléphone** : +224 610 75 90 90
- **Email** : contact@djamiyah.com
- **Adresse** : Coyah, Guinée
- **Horaires réception** : 24h/24 — 7j/7

---

## VARIABLES D'ENVIRONNEMENT REQUISES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # URL projet (publique)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Clé anon (publique)
SUPABASE_SERVICE_ROLE_KEY=        # Clé service role (SERVEUR UNIQUEMENT)

# ChapChap
CHAPCHAP_API_KEY_TEST=            # Mode test
CHAPCHAP_API_KEY_PRODUCTION=      # Mode production
CHAPCHAP_HMAC_SECRET=             # Secret HMAC webhooks
CHAPCHAP_BASE_URL=https://api.chapchappay.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # URL locale
CHAPCHAP_NOTIFY_URL=http://localhost:3000/api/chapchap/notify
CHAPCHAP_RETURN_URL=http://localhost:3000/reservation/success

# Supabase MCP (Cline/Claude access token)
SUPABASE_ACCESS_TOKEN=            # Token personnel Supabase (jamais en prod)
```

---

## SÉCURITÉ

- `.env.local` jamais commité (`.gitignore` le couvre)
- Mettre `.env.example` à jour à chaque nouvelle variable
- `SUPABASE_SERVICE_ROLE_KEY` : côté serveur uniquement, jamais dans du code client
- RLS activée sur toutes les tables — vérifier après chaque migration
- CSP configurée dans `next.config.ts` pour restreindre les sources
- Webhooks ChapChap : HMAC SHA-256 vérifié avant tout traitement

---

## FICHIERS CLÉS À LIRE AVANT DE MODIFIER

| Fichier | Quand le lire |
|---|---|
| `src/types/database.ts` | Avant tout accès Supabase |
| `src/lib/supabase.ts` | Avant d'écrire un client DB |
| `src/lib/chapchap.ts` | Avant tout code paiement |
| `src/data/content.ts` | Avant de modifier textes ou prix |
| `src/i18n/routing.ts` | Avant d'ajouter une route |
| `.clinerules` | Instructions spécifiques pour Cline |

---

## COMMANDES FRÉQUENTES

```bash
npm run dev           # Serveur local
npm run build         # Build production
npm run type-check    # TypeScript strict
npm run lint          # ESLint
npm run db:types      # Régénérer types Supabase
npm run db:reset      # Reset DB locale
```

---

## POINTS D'ATTENTION ANTIGRAVITY

- Ne jamais toucher `node_modules/`, `.next/`, `build/`, `dist/`
- Ne jamais auto-compléter de clés ou secrets dans le code
- Toujours suggérer `TableInsert<T>` plutôt que `Database["public"]["Tables"][T]["Insert"]`
- La source de vérité des prix est `src/data/content.ts` — pas `.clinerules`
- Le site est en production sur Vercel à l'URL : `https://djamiyah-group.vercel.app`
- Git hooks actifs : pre-commit (lint + format) et pre-push (tsc) — bypass avec `HUSKY=0` si besoin urgent
