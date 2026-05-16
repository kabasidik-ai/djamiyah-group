# AUDIT READ-ONLY — Djamiyah Group

**Date :** 2026-05-14  
**Auteur :** Audit automatisé Cline  
**Périmètre :** ChapChapPay, Chatbot Salematou, Galerie, Variables Vercel, Build, Routes

---

## 1. ChapChapPay

### 1.1 Composant client : `src/components/payment/ChapChapPay.tsx`

- **390 lignes** — composant `"use client"`
- Le composant **ne lit aucune variable d'environnement directement** (aucun `process.env` dans le
  `.tsx`)
- Il `fetch('/api/payment/chapchap', { method: 'POST' })` côté client (ligne 154)
- Timeout client de 30 s via `AbortController` (ligne 151-152)
- Validation Zod locale avant envoi (`paymentSchema`, lignes 53-73)
- Méthodes de paiement supportées : `orange_money`, `mtn_momo`, `wave`, `card`, `paycard`, `cc` +
  `bank_transfer` (hors ChapChap)
- Pour `bank_transfer`, aucun appel API — simple confirmation locale avec coordonnées bancaires
  Société Générale Guinée
- **Gestion d'erreurs** : ✅ Correcte — messages traduits FR, erreur réseau, timeout, réponse
  non-ok, URL de redirection manquante

### 1.2 Route API : `POST /api/payment/chapchap` (`src/app/api/payment/chapchap/route.ts`)

**Variables d'environnement utilisées :**

| Variable                      | Obligatoire         | Fallback                             |
| ----------------------------- | ------------------- | ------------------------------------ |
| `CHAPCHAP_API_KEY_TEST`       | Oui (ou PRODUCTION) | —                                    |
| `CHAPCHAP_API_KEY_PRODUCTION` | Oui (ou TEST)       | —                                    |
| `CHAPCHAP_BASE_URL`           | Non                 | `https://chapchappay.com/api`        |
| `CHAPCHAP_NOTIFY_URL`         | Non                 | `{SITE_URL}/api/payment/webhook`     |
| `CHAPCHAP_RETURN_URL`         | Non                 | `{SITE_URL}/reservation/success`     |
| `CHAPCHAP_CANCEL_URL`         | Non                 | `{SITE_URL}/reservation`             |
| `NEXT_PUBLIC_SITE_URL`        | Non                 | `https://djamiyahgroup.com`          |
| `VERCEL_URL`                  | Non                 | (détecté automatiquement par Vercel) |

- **Mode :** Sandbox en priorité — `getApiKey()` retourne
  `CHAPCHAP_API_KEY_TEST || CHAPCHAP_API_KEY_PRODUCTION` → **TEST en premier**
- **Endpoint ChapChap :** `{CHAPCHAP_BASE_URL}/ecommerce/create`
- **Header d'authentification :** `CCP-Api-Key: {apiKey}`
- Sécurité : rate limiting (100 req/h par IP), vérification same-origin, headers CSP complets
- Met à jour la réservation Supabase en `payment_status: 'pending'` avant appel ChapChap si
  `reservationId` fourni

### 1.3 Webhook notify : `POST /api/chapchap/notify` (`src/app/api/chapchap/notify/route.ts`)

**Variables d'environnement :**

| Variable               | Obligatoire                                |
| ---------------------- | ------------------------------------------ |
| `CHAPCHAP_HMAC_SECRET` | ✅ Oui                                     |
| `NEXT_PUBLIC_SITE_URL` | Non (fallback `https://djamiyahgroup.com`) |

- ✅ Vérifie HMAC SHA-256 via `verifyChapchapHmac()` (headers : `X-CCP-Signature`, `CCP-Signature`,
  `X-Signature`)
- ✅ Rate limiting : 60 req/min par IP
- Met à jour `reservations.payment_status` + `chapchap_transaction_id` dans Supabase
- Mapping : `SUCCESS → paid`, `FAILED → failed`, `PENDING → pending`, `CANCELLED → failed`

### 1.4 Webhook payment : `POST /api/payment/webhook` (`src/app/api/payment/webhook/route.ts`)

- **⚠️ DOUBLON** — fait la même chose que `/api/chapchap/notify` mais avec un format de payload
  différent (plus flexible, supporte `metadata.reservation_id`)
- Variables : `CHAPCHAP_HMAC_SECRET`, `NEXT_PUBLIC_SITE_URL`
- ✅ HMAC vérifié, rate limited

### 1.5 Imports et variables — Problèmes détectés

- ✅ Aucun import cassé détecté dans ChapChapPay.tsx
- ✅ Aucune variable non définie
- ⚠️ `wave` est accepté côté client (`ChapChapPay.tsx`) mais **pas dans le type
  `ChapChapPaymentMethod` de la route API** (`route.ts` ligne 15 :
  `'orange_money' | 'mtn_momo' | 'card' | 'paycard' | 'cc'`) → **Un paiement Wave sera rejeté par
  Zod côté serveur** (400)
- ⚠️ Le `notify_url` par défaut pointe sur `/api/payment/webhook` mais il existe aussi
  `/api/chapchap/notify` — **deux endpoints webhook coexistent**

---

## 2. Chatbot Salematou

### 2.1 Widget : `src/components/ConciergeWidget.tsx`

- **569 lignes** — composant `"use client"`
- **Flux en 3 étapes** : `closed` → `lead-form` (capture nom + email) → `chat`
- Appelle `POST /api/chat` avec `{ message, contactId, visitorName, visitorEmail }`
- **Réponses bloquantes** (pas de streaming) — `await res.json()` (ligne 213)
- ❌ **Pas de ReadableStream** — réponse complète attendue avant affichage
- Animation "typing" (3 dots) affichée pendant le fetch
- Réponses tronquées à 2 phrases max via `toConciseReply()`
- CTA "Réserver ma chambre" affiché si le message contient des mots-clés réservation
- Promo FLASH (10%) suggérée automatiquement après 2.3s si mots-clés booking détectés
- Avatar : `/images/receptionniste-avatar.webp` avec fallback
  `/images/corporate/receptionniste-avatar.webp`
- **Aucune variable d'environnement côté client** (`process.env` absent du .tsx)

### 2.2 Route API : `POST /api/chat` (`src/app/api/chat/route.ts`)

**Variables d'environnement GHL utilisées :**

| Variable                       | Obligatoire | Valeur connue (.env.example) |
| ------------------------------ | ----------- | ---------------------------- |
| `GHL_API_TOKEN`                | ✅ Oui      | `pit-xxxxxxxx-...`           |
| `GHL_LOCATION_ID`              | ✅ Oui      | `a5wcdv6hapHNnLA9xnl4`       |
| `GHL_CONVERSATION_AI_AGENT_ID` | ✅ Oui      | `ryIJEDRGuVTfu5x6uHVE`       |

**Mécanisme de communication avec GHL :**

1. **Crée/retrouve un contact GHL** via `GET /contacts/search/duplicate` → `POST /contacts/`
2. **Crée/retrouve une conversation** Live Chat via `GET /conversations/search` →
   `POST /conversations/`
3. **Envoie le message utilisateur en inbound** via `POST /conversations/messages/inbound`
4. **MÉTHODE 1 (prioritaire) : Appel DIRECT Conversation AI** — `POST /conversations/ai-responses`
   avec `agentId`
5. **MÉTHODE 2 (fallback) : Polling Auto-Pilot** — 10 tentatives × 1.5s = max 15s d'attente, cherche
   un message `direction: 'outbound'`
6. **Dernier fallback** : message statique "Je traite votre demande..."

→ **fetch direct GHL + polling fallback** (pas de webhook pour la réponse)

### 2.3 Webhook GHL : `POST /api/webhook` (`src/app/api/webhook/route.ts`)

- Réçoit les webhooks GHL (`InboundMessage`, `OutboundMessage`, `ContactCreate`,
  `ConversationUnread`)
- **Log uniquement** — ne renvoie rien au widget chat
- Variable : `GHL_WEBHOOK_SECRET` (optionnelle, vérification HMAC si présente)

---

## 3. Galerie photos

### 3.1 Fichiers dans `public/images/` avec tailles

| Fichier                                      | Taille                             |
| -------------------------------------------- | ---------------------------------- |
| `corporate/hero-video.mp4`                   | **7.3 MB** ⚠️                      |
| `corporate/hero-fallback.jpg`                | **3.2 MB** ⚠️                      |
| `corporate/toilletespremium1.png`            | 1.1 MB ⚠️                          |
| `heroevent.png`                              | 737 KB                             |
| `logo-footer-green.svg`                      | 508 KB ⚠️ (SVG anormalement lourd) |
| `maison-blanche/suite-premium.jpg`           | 402 KB                             |
| `corporate/suite-premium.jpg`                | 402 KB (doublon)                   |
| `corporate/toilette-confort.jpeg`            | 256 KB                             |
| `corporate/favicon-djamiyah.png`             | 193 KB                             |
| `corporate/toilette-double-premiun.jpeg`     | 169 KB                             |
| `logos/logo-footer.svg`                      | 167 KB                             |
| `corporate/chambres-double-premium.jpeg`     | 164 KB                             |
| `corporate/gastroaccueil.jpeg`               | 144 KB                             |
| `corporate/Chambre-confort2.jpeg`            | 95 KB                              |
| `corporate/gastronimque-accueil.webp`        | 92 KB                              |
| `restaurant-service.webp`                    | 87 KB                              |
| `corporate/restaurant-service.webp`          | 87 KB (doublon)                    |
| `corporate/hotel-maison-blanche-aerien.webp` | 85 KB                              |
| `logo-djamiyah.svg`                          | 84 KB                              |
| `logo-djamiyah-white.svg`                    | 84 KB                              |
| `hotel-rama-kissidougou.webp`                | 69 KB                              |
| `corporate/hotel-ramakissidougou.webp`       | 69 KB (doublon)                    |
| `receptionniste-avatar.webp`                 | 63 KB                              |
| `corporate/receptionniste-avatar.webp`       | 63 KB (doublon)                    |
| `maison-blanche/chambre-premium.jpg`         | 61 KB                              |
| `maison-blanche/suite-prestige.jpg`          | 51 KB                              |
| `corporate/soumbouya.webp`                   | 46 KB                              |
| `conference-soumbouya.webp`                  | 46 KB (doublon)                    |
| `maison-blanche/chambre-confort.jpg`         | 41 KB                              |
| `maison-blanche/double-premium.jpg`          | 41 KB                              |
| `corporate/salon-suite-premium.jpeg`         | 36 KB                              |
| `corporate/salon-suite-prestige.jpg`         | 35 KB                              |
| `corporate/favicon-djamiyah-192.png`         | 34 KB                              |
| `corporate/Maneah.webp`                      | 33 KB                              |
| `conference-maneah.webp`                     | 33 KB (doublon)                    |
| `corporate/favicon-djamiyah-50.png`          | 5 KB                               |
| `logos/logo-favicon.svg`                     | 6 octets ⚠️ (quasi-vide)           |

**Total : 37 fichiers, ~14.5 MB**

### 3.2 Composant Gallery / PhotoGrid

- ❌ **Aucun composant `Gallery` ou `PhotoGrid` n'existe** dans le projet
- Aucune recherche ne retourne de résultat pour ces termes

### 3.3 Pages où une galerie devrait apparaître

| Page           | Raison                                        |
| -------------- | --------------------------------------------- |
| `/rooms`       | Présentation visuelle des 5 types de chambres |
| `/hotels`      | Vues extérieures/intérieures des 2 hôtels     |
| `/conferences` | Photos des salles Maneah et Soumbouya         |
| `/restaurant`  | Photos de la gastronomie                      |
| `/` (accueil)  | Slider/carousel des points forts              |

### 3.4 Problèmes détectés

- ⚠️ **6 doublons** identifiés entre `public/images/` racine et `public/images/corporate/`
- ⚠️ `hero-fallback.jpg` (3.2 MB) et `toilletespremium1.png` (1.1 MB) — non optimisés, devraient
  être en WebP
- ⚠️ `logo-footer-green.svg` (508 KB) — SVG anormalement lourd, probablement non optimisé
- ⚠️ `logos/logo-favicon.svg` (6 octets) — fichier quasi-vide, probablement cassé
- ⚠️ Typo dans nom de fichier : `toilette-double-premiun.jpeg` (manque un `m`)

---

## 4. Variables Vercel

### 4.1 `.env.example` — Variables déclarées

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN

# ChapChap
CHAPCHAP_API_KEY_TEST
CHAPCHAP_API_KEY_PRODUCTION
CHAPCHAP_HMAC_SECRET
CHAPCHAP_BASE_URL

# Site
NEXT_PUBLIC_SITE_URL
CHAPCHAP_NOTIFY_URL
CHAPCHAP_RETURN_URL

# GHL — Chatbot
GHL_API_TOKEN
GHL_LOCATION_ID
GHL_CONVERSATION_AI_AGENT_ID

# GHL — OAuth (optionnel)
GHL_CLIENT_ID
GHL_CLIENT_SECRET
GHL_REDIRECT_URI
```

### 4.2 `.env.local`

- ❌ **Fichier non trouvé** sur la machine (ou non lisible — `grep` a retourné `NO_ENV_LOCAL`)
- ⚠️ Le build Next.js indique pourtant `Environments: .env.local` — il se peut que le fichier existe
  mais soit vide ou inaccessible

### 4.3 Variables utilisées dans le code mais ABSENTES de `.env.example`

| Variable                 | Utilisée dans                   | Manquante dans .env.example   |
| ------------------------ | ------------------------------- | ----------------------------- |
| `CHAPCHAP_CANCEL_URL`    | `api/payment/chapchap/route.ts` | ⚠️ Oui                        |
| `VERCEL_URL`             | `lib/chapchap.ts`               | ⚠️ (auto Vercel, OK)          |
| `NODE_ENV`               | Plusieurs fichiers              | (auto Node.js, OK)            |
| `GHL_WEBHOOK_SECRET`     | `api/webhook/route.ts`          | ⚠️ Oui                        |
| `GHL_COMPANY_ID`         | `lib/ghl/client.ts`             | ⚠️ Oui                        |
| `GHL_PRIVATE_TOKEN`      | `lib/ghl/token-store.ts`        | ⚠️ Oui                        |
| `GHL_OAUTH_REDIRECT_URI` | `lib/ghl/oauth.ts`              | ⚠️ Oui (≠ `GHL_REDIRECT_URI`) |
| `SALEMATOU_AVATAR_URL`   | `api/config/avatar/route.ts`    | ⚠️ Oui                        |
| `ADMIN_SECRET_KEY`       | `api/admin/avatar/route.ts`     | ⚠️ Oui                        |

### 4.4 Ce qui DEVRAIT être sur Vercel (production)

**Obligatoires :**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (= `https://djamiyahgroup.com`)
- `CHAPCHAP_API_KEY_PRODUCTION` (ou `CHAPCHAP_API_KEY_TEST` pour sandbox)
- `CHAPCHAP_HMAC_SECRET`
- `GHL_API_TOKEN`
- `GHL_LOCATION_ID`
- `GHL_CONVERSATION_AI_AGENT_ID`

**Recommandées :**

- `CHAPCHAP_BASE_URL`
- `CHAPCHAP_NOTIFY_URL` (= `https://djamiyahgroup.com/api/payment/webhook`)
- `CHAPCHAP_RETURN_URL` (= `https://djamiyahgroup.com/reservation/success`)
- `CHAPCHAP_CANCEL_URL`
- `GHL_WEBHOOK_SECRET`
- `ADMIN_SECRET_KEY`

---

## 5. Erreurs build

### 5.1 Sortie complète `npm run build`

```
> djamiyah-group@0.1.0 build
> next build

▲ Next.js 16.1.6 (Turbopack)
- Environments: .env.local

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy

  Creating an optimized production build ...
✓ Compiled successfully in 1554.4ms
✓ Finished TypeScript in 1585.2ms
✓ Collecting page data using 9 workers in 249.8ms
✓ Generating static pages using 9 workers (42/42) in 1277.9ms
✓ Finalizing page optimization in 13.7ms

Route (app)                        Revalidate  Expire
┌ ○ /_not-found
├ ƒ /[locale]
├ ƒ /[locale]/about
├ ƒ /[locale]/careers
├ ƒ /[locale]/conferences
├ ƒ /[locale]/contact
├ ƒ /[locale]/hotels
├ ƒ /[locale]/privacy
├ ƒ /[locale]/reservation
├ ƒ /[locale]/reservation/success
├ ƒ /[locale]/restaurant
├ ƒ /[locale]/rooms
├ ƒ /[locale]/terms
├ ƒ /api/admin/avatar
├ ƒ /api/auth/ghl/authorize
├ ƒ /api/auth/ghl/callback
├ ƒ /api/chapchap/notify
├ ƒ /api/chat
├ ○ /api/config/avatar                     1h      1y
├ ƒ /api/contact
├ ƒ /api/ghl/agents
├ ƒ /api/ghl/locations
├ ƒ /api/payment/chapchap
├ ƒ /api/payment/webhook
├ ƒ /api/promo/validate
├ ƒ /api/reservations
├ ƒ /api/webhook
└ ○ /icon.png

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### 5.2 Résultat

- ✅ **Build réussi** — aucune erreur TypeScript, aucun import non résolu
- ⚠️ **1 warning** : `The "middleware" file convention is deprecated. Please use "proxy" instead.` —
  Next.js 16 déprécie le fichier `middleware.ts` au profit du nouveau système `proxy`
- ✅ 0 erreur TypeScript (tsc passé en 1585ms)
- ✅ 42/42 pages statiques générées

---

## 6. Routes manquantes

### 6.1 Routes définies (`src/app/**/page.tsx`)

| Route                           | Fichier                                         |
| ------------------------------- | ----------------------------------------------- |
| `/[locale]`                     | `src/app/[locale]/page.tsx`                     |
| `/[locale]/about`               | `src/app/[locale]/about/page.tsx`               |
| `/[locale]/careers`             | `src/app/[locale]/careers/page.tsx`             |
| `/[locale]/conferences`         | `src/app/[locale]/conferences/page.tsx`         |
| `/[locale]/contact`             | `src/app/[locale]/contact/page.tsx`             |
| `/[locale]/hotels`              | `src/app/[locale]/hotels/page.tsx`              |
| `/[locale]/privacy`             | `src/app/[locale]/privacy/page.tsx`             |
| `/[locale]/reservation`         | `src/app/[locale]/reservation/page.tsx`         |
| `/[locale]/reservation/success` | `src/app/[locale]/reservation/success/page.tsx` |
| `/[locale]/restaurant`          | `src/app/[locale]/restaurant/page.tsx`          |
| `/[locale]/rooms`               | `src/app/[locale]/rooms/page.tsx`               |
| `/[locale]/terms`               | `src/app/[locale]/terms/page.tsx`               |

### 6.2 Liens utilisés dans la navigation

**Navigation principale** (`src/data/content.ts → navigation.main`) :

| Lien           | Route existante ? |
| -------------- | ----------------- |
| `/`            | ✅ (`/[locale]`)  |
| `/hotels`      | ✅                |
| `/rooms`       | ✅                |
| `/restaurant`  | ✅                |
| `/conferences` | ✅                |
| `/reservation` | ✅                |
| `/contact`     | ✅                |

**Footer quickLinks** (`footerContent.quickLinks`) :

| Lien       | Route existante ? |
| ---------- | ----------------- |
| `/about`   | ✅                |
| `/privacy` | ✅                |
| `/terms`   | ✅                |
| `/careers` | ✅                |

**Boutons CTA dans Navigation.tsx et Footer.tsx :**

| Lien           | Route existante ? |
| -------------- | ----------------- |
| `/reservation` | ✅                |

### 6.3 Problèmes détectés

- ⚠️ **Liens sans préfixe `[locale]`** — Navigation.tsx et Footer.tsx utilisent des liens comme
  `/reservation`, `/rooms`, `/hotels` **sans préfixe de locale** (`/fr/reservation`,
  `/en/reservation`). Cela dépend du middleware `next-intl` pour la redirection. Si le middleware
  est déprécié (warning Next.js 16), ces liens pourraient casser.
- ⚠️ **`/reservation/success`** — Route existante mais aucun lien direct dans la navigation.
  Utilisée comme `CHAPCHAP_RETURN_URL` callback. Le fallback dans le code est
  `{SITE_URL}/reservation/success` (sans locale) — peut poser problème avec le routing i18n.
- ✅ **Aucune route manquante** — toutes les routes référencées dans la navigation existent.

---

## Résumé des problèmes critiques

| #   | Sévérité     | Problème                                                                                                 |
| --- | ------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | 🔴 Critique  | `wave` accepté côté client mais rejeté côté serveur (type manquant dans la route API)                    |
| 2   | 🟡 Important | 9 variables d'env utilisées dans le code mais absentes de `.env.example`                                 |
| 3   | 🟡 Important | Deux webhooks ChapChap coexistent (`/api/chapchap/notify` + `/api/payment/webhook`) — confusion possible |
| 4   | 🟡 Important | Warning Next.js 16 : `middleware.ts` déprécié → liens sans locale risquent de casser                     |
| 5   | 🟡 Important | Chatbot non streamé — réponse bloquante, polling GHL jusqu'à 15s max                                     |
| 6   | 🟠 Moyen     | Images non optimisées : `hero-fallback.jpg` (3.2 MB), `toilletespremium1.png` (1.1 MB)                   |
| 7   | 🟠 Moyen     | 6 doublons dans `public/images/` (~700 KB gaspillés)                                                     |
| 8   | 🟠 Moyen     | `logos/logo-favicon.svg` quasi-vide (6 octets)                                                           |
| 9   | 🟠 Moyen     | `logo-footer-green.svg` anormalement lourd (508 KB)                                                      |
| 10  | 🔵 Mineur    | Aucun composant Gallery/PhotoGrid — galerie absente                                                      |
| 11  | 🔵 Mineur    | Typo fichier : `toilette-double-premiun.jpeg`                                                            |
| 12  | 🔵 Mineur    | `.env.local` non trouvé/vide sur cette machine                                                           |

---

_AUDIT TERMINÉ_
