# CLAUDE.md — djamiyah-group

> Fichier de contexte projet pour Claude Code. Toujours lire en début de session.

---

## 🏢 Projet

**Nom :** djamiyah-group
**Type :** Application web Next.js — plateforme de réservation / gestion de salles
**Client :** Djamiyah Group
**Repo :** origin/main (GitHub)
**Déploiement :** Vercel (voir VERCEL-ENV-GUIDE.md)
**Base de données :** Supabase (voir SUPABASE-GUIDE.md + supabase-schema.sql)

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + tailwind-merge + CVA |
| UI Components | lucide-react, framer-motion |
| Forms | react-hook-form + zod |
| Auth / DB | Supabase SSR (@supabase/ssr) |
| i18n | next-intl |
| Dates | date-fns |
| Linter | ESLint (eslint.config.mjs) |
| Package manager | npm |

---

## 📁 Structure des dossiers

```
src/
├── app/               # Routes Next.js App Router
│   ├── [locale]/      # Routes localisées (next-intl)
│   └── api/           # Route Handlers
├── components/        # Composants réutilisables
│   ├── ui/            # Composants UI génériques (shadcn-style)
│   └── [feature]/     # Composants par fonctionnalité
├── lib/               # Utilitaires, helpers, clients
│   ├── supabase/      # Clients Supabase (server/client)
│   └── utils.ts       # cn(), helpers généraux
├── data/              # Données statiques / seed
└── types/             # Types TypeScript globaux
```

---

## 🏷️ Conventions de nommage

- **Fichiers composants :** PascalCase → `ReservationCard.tsx`
- **Fichiers utilitaires :** camelCase → `formatDate.ts`
- **Dossiers :** kebab-case → `room-booking/`
- **Variables :** camelCase → `const isLoading = false`
- **Types/Interfaces :** PascalCase avec préfixe I optionnel → `type Room = {...}`
- **Constantes globales :** UPPER_SNAKE_CASE → `const MAX_CAPACITY = 50`
- **Server Actions :** verbe + entité → `createReservation()`, `updateRoom()`
- **API routes :** REST conventionnel → `/api/rooms`, `/api/reservations/[id]`

---

## 📐 Règles de code

### TypeScript
- Toujours typer explicitement les props des composants
- Préférer `type` à `interface` sauf pour extension
- Zod pour toute validation de formulaire et d'API
- Pas de `any` — utiliser `unknown` si nécessaire

### Next.js
- App Router uniquement (pas de Pages Router)
- Server Components par défaut — `"use client"` uniquement si nécessaire
- Server Actions pour mutations (pas de route handler inutile)
- Metadata statique ou dynamique sur chaque page

### Supabase
- Toujours utiliser `createServerClient` côté serveur
- Row Level Security (RLS) activée — ne jamais bypasser
- Transactions SQL dans supabase-rooms-setup.sql pour les seeds
- Variables d'env : voir VERCEL-ENV-GUIDE.md (jamais en dur dans le code)

### Tailwind CSS
- Utiliser `cn()` de lib/utils.ts pour classes conditionnelles
- CVA (class-variance-authority) pour variantes de composants
- Pas de `style={}` inline sauf cas exceptionnel justifié

### Formulaires
- react-hook-form + zodResolver systématiquement
- Schema Zod défini dans le même fichier ou `lib/validations/`

---

## 🔒 Sécurité & environnement

- Variables d'env dans `.env.local` (jamais commitées)
- `.env.example` maintenu à jour à chaque nouvelle variable
- RLS Supabase toujours activée
- Jamais de clés secrètes dans le code client

---

## 🚀 Commandes fréquentes

```bash
npm run dev          # Serveur local
npm run build        # Build production
npm run lint         # ESLint
npx supabase gen types  # Régénérer types Supabase
```

---

## 🤖 Instructions Claude Code

- Toujours utiliser le contexte `context7` pour la doc Next.js/Supabase
- Server Components par défaut sauf instruction contraire
- Générer les types Supabase si schema modifié
- Ne jamais modifier directement `node_modules`
- Vérifier `.env.example` à jour après ajout de variable
- Chaque nouvelle feature = composant + type + validation Zod
