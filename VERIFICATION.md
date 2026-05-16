# 🔍 VERIFICATION.md — Audit READ-ONLY du projet djamiyah-group

**Date** : 16/05/2026 02:56 (America/Toronto) **Commit HEAD** : `7fe8771` (main) **Framework** :
Next.js 16.1.6 (Turbopack)

---

## 1. Variables d'environnement — Détection des écarts

### Variables utilisées dans le code (process.env.X)

| Variable attendue par le code   | Présente dans .env.example        | Type    |
| ------------------------------- | --------------------------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅ Oui                            | public  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Oui                            | public  |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅ Oui                            | serveur |
| `NEXT_PUBLIC_SITE_URL`          | ✅ Oui                            | public  |
| `CHAPCHAP_API_KEY_TEST`         | ✅ Oui                            | serveur |
| `CHAPCHAP_API_KEY_PRODUCTION`   | ✅ Oui                            | serveur |
| `CHAPCHAP_HMAC_SECRET`          | ✅ Oui                            | serveur |
| `CHAPCHAP_BASE_URL`             | ✅ Oui                            | serveur |
| `CHAPCHAP_NOTIFY_URL`           | ✅ Oui                            | serveur |
| `CHAPCHAP_RETURN_URL`           | ✅ Oui                            | serveur |
| `CHAPCHAP_CANCEL_URL`           | ✅ Oui                            | serveur |
| `GHL_API_TOKEN`                 | ✅ Oui                            | serveur |
| `GHL_LOCATION_ID`               | ✅ Oui                            | serveur |
| `GHL_CONVERSATION_AI_AGENT_ID`  | ✅ Oui                            | serveur |
| `GHL_COMPANY_ID`                | ✅ Oui                            | serveur |
| `GHL_PRIVATE_TOKEN`             | ✅ Oui                            | serveur |
| `GHL_WEBHOOK_SECRET`            | ✅ Oui                            | serveur |
| `GHL_CLIENT_ID`                 | ✅ Oui                            | serveur |
| `GHL_CLIENT_SECRET`             | ✅ Oui                            | serveur |
| `GHL_OAUTH_REDIRECT_URI`        | ✅ Oui                            | serveur |
| `ADMIN_SECRET_KEY`              | ✅ Oui                            | serveur |
| `SALEMATOU_AVATAR_URL`          | ✅ Oui                            | serveur |
| `VERCEL_URL`                    | ❌ Non (auto-injecté par Vercel)  | serveur |
| `NODE_ENV`                      | ❌ Non (auto-injecté par Node.js) | serveur |

### Variables dans .env.example NON utilisées par le code

| Variable dans .env.example | Utilisée par le code | Commentaire                                       |
| -------------------------- | -------------------- | ------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN`    | ❌ Non               | Déclarée pour MCP/CLI uniquement — OK             |
| `GHL_REDIRECT_URI`         | ❌ Non               | Doublon de `GHL_OAUTH_REDIRECT_URI` — à supprimer |

### 🚨 ALERTE : Noms suspects (traductions automatiques)

**Aucun nom suspect détecté.** Tous les noms de variables sont en anglais standard, cohérents avec
les conventions du projet.

### ⚠️ ALERTE SÉCURITÉ : IDs GHL en dur dans le code client

```
src/components/GHLWidget.tsx:6:  const GHL_LOCATION_ID = 'a5wcdv6hapHNnLA9xnl4'
src/components/GHLWidget.tsx:7:  const GHL_BUSINESS_ID = 'ORWCLXIGJ8k42yscyNzt'
src/components/GHLWidget.tsx:8:  const GHL_SNAPSHOT_ID = '67ebbd1e30e269d99774a4a0'
src/components/GHLWidget.tsx:9:  const GHL_USER_NICHE_ID = 'PY4tPIs4Efs5ox3Z7dGZ'
```

Ce sont des IDs publics GHL (pas des secrets), mais ils sont hardcodés dans un composant client. À
surveiller.

---

## 2. ChapChapPay — État du fix P0

### Présence de "wave", "orange_money", "mtn" dans les composants critiques

| Vérification                       | Résultat                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| Type `ChapChapPaymentMethod`       | ✅ `'orange_money' \| 'mtn_momo' \| 'wave' \| 'card' \| 'paycard' \| 'cc'`        |
| Schema Zod `z.enum(...)`           | ✅ `['orange_money', 'mtn_momo', 'wave', 'card', 'paycard', 'cc']`                |
| `mapPaymentMethod()`               | ✅ orange_money → 'orange_money', mtn_momo → 'mtn_momo', wave → 'card' (mappé DB) |
| Validation téléphone (wave requis) | ✅ `body.paymentMethod === 'wave'` inclus dans le check `!sanitizedPhone`         |

### Test mental — "carte_bleue" en entrée

✅ **Rejeté** : `z.enum(['orange_money', 'mtn_momo', 'wave', 'card', 'paycard', 'cc'])` retournera
`safeParse.success === false` → HTTP 400 "Données de paiement invalides."

### Route dupliquée supprimée

| Fichier                                | Existe ?                                               |
| -------------------------------------- | ------------------------------------------------------ |
| `src/app/api/chapchap/notify/route.ts` | ✅ **SUPPRIMÉ** (confirmé `No such file or directory`) |
| `src/app/api/payment/webhook/route.ts` | ✅ **EXISTE** et opérationnel                          |

### ⚠️ ATTENTION : Worktrees .claude contiennent encore l'ancienne route

```
.claude/worktrees/competent-chaplygin/src/app/api/chapchap/notify/route.ts
.claude/worktrees/priceless-bassi/src/app/api/chapchap/notify/route.ts
```

Ces worktrees sont des vestiges de branches de travail. Non déployés mais à nettoyer.

### Fichiers contenant "chapchap" (projet principal uniquement)

1. `src/app/api/payment/chapchap/route.ts`
2. `src/app/api/payment/webhook/route.ts`
3. `src/app/[locale]/reservation/page.tsx`
4. `src/components/payment/ChapChapPay.tsx`
5. `src/components/payment/PaymentWidget.tsx`
6. `src/lib/chapchap.ts`
7. `src/lib/schemas/chapchap.ts`
8. `src/lib/schemas/reservation.ts`
9. `src/types/database.ts`
10. `AUDIT.md`, `README.md`, `PROJECT_CONTEXT.md`, `VERCEL-ENV-GUIDE.md`,
    `AVATAR_IMPLEMENTATION_RESUME.md`

---

## 3. Chatbot Salematou — État du fix P1

### `/api/chat/stream/route.ts` (SSE principal)

| Paramètre             | Valeur                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `maxDuration`         | **30** secondes                                                                            |
| Keepalive SSE         | ✅ Présent — `push('status', { status: 'typing', keepalive: true })` après attempt 5 (~8s) |
| MAX_POLLS             | **12**                                                                                     |
| POLL_INTERVAL         | **1500ms**                                                                                 |
| Timeout total polling | **18s max**                                                                                |
| Cache réponses        | ✅ 5 min TTL, 200 entrées max                                                              |

### `/api/chat/route.ts` (fallback JSON)

| Paramètre             | Valeur                                         |
| --------------------- | ---------------------------------------------- |
| MAX_POLLS             | **12** (aligné ✅)                             |
| POLL_INTERVAL         | **1500ms** (aligné ✅)                         |
| Timeout total polling | **18s max** (aligné ✅)                        |
| `getDirectAIReply()`  | ✅ **Stubbed** — retourne `null` immédiatement |

### Alignement des deux routes

✅ **Les deux routes sont parfaitement alignées** :

- Même polling (12 × 1.5s = 18s max)
- Même `getDirectAIReply` stubbed (pas d'appel HTTP vers l'endpoint mort)
- Même `sanitizeReply` + `toTwoSentenceReply`

### Variables GHL\_\* utilisées et localisation

| Variable                       | Fichiers                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `GHL_API_TOKEN`                | `chat/route.ts`, `chat/stream/route.ts`                                                                                        |
| `GHL_LOCATION_ID`              | `chat/route.ts`, `chat/stream/route.ts`, `ghl/agents/route.ts`, `ghl/callback/route.ts`, `ghl/client.ts`, `ghl/token-store.ts` |
| `GHL_CONVERSATION_AI_AGENT_ID` | `chat/route.ts`, `chat/stream/route.ts`, `ghl/agents/route.ts`                                                                 |
| `GHL_COMPANY_ID`               | `ghl/client.ts`                                                                                                                |
| `GHL_PRIVATE_TOKEN`            | `ghl/token-store.ts`                                                                                                           |
| `GHL_WEBHOOK_SECRET`           | `webhook/route.ts`                                                                                                             |
| `GHL_CLIENT_ID`                | `ghl/oauth.ts`                                                                                                                 |
| `GHL_CLIENT_SECRET`            | `ghl/oauth.ts`                                                                                                                 |
| `GHL_OAUTH_REDIRECT_URI`       | `ghl/oauth.ts`                                                                                                                 |

### Appel HTTP vers `/conversations/ai-responses` (endpoint mort)

| Fichier                    | Type de référence                                                           |
| -------------------------- | --------------------------------------------------------------------------- |
| `chat/stream/route.ts:221` | ✅ **Commentaire seulement** (NOTE: ... returns 404)                        |
| `chat/route.ts:179`        | ✅ **Commentaire seulement** (NOTE: ... returns 404)                        |
| `ghl/client.ts:232`        | ⚠️ **APPEL HTTP ACTIF** dans `ghlFetch('/conversations/ai-responses', ...)` |

> **⚠️ POINT JAUNE** : `src/lib/ghl/client.ts` contient encore un appel actif vers
> `/conversations/ai-responses`. Cette fonction (`getAIResponse` dans le client GHL) n'est pas
> appelée par les routes chat (qui utilisent leur propre implémentation), mais elle existe et
> pourrait être invoquée par du code futur.

### ConciergeWidget.tsx

| Fonctionnalité                           | Présent                                                 |
| ---------------------------------------- | ------------------------------------------------------- |
| Loading state (isTyping / bouncing dots) | ✅ Oui — 3 dots animés + `isStreaming`                  |
| Typewriter effect                        | ✅ Oui — chunks SSE streamés mot par mot                |
| Fallback WhatsApp                        | ❌ Non — fallback vers `/api/chat` (JSON), pas WhatsApp |
| Fallback téléphone                       | ✅ Oui — message d'erreur affiche `+224 610 75 90 90`   |

---

## 4. Images — Inventaire et doublons

### Inventaire complet : 38 fichiers dans public/images/

| Fichier                                    | Taille (KB) | MD5      |
| ------------------------------------------ | ----------- | -------- |
| conference-maneah.webp                     | 33          | 6ad7fc06 |
| conference-soumbouya.webp                  | 45          | fc1aca04 |
| corporate/.DS_Store                        | 6           | 194577a7 |
| corporate/Chambre-confort2.jpeg            | 93          | 812f42f4 |
| corporate/Maneah.webp                      | 33          | 6ad7fc06 |
| corporate/chambres-double-premium.jpeg     | 160         | b891c292 |
| corporate/favicon-djamiyah-192.png         | 33          | 73320da6 |
| corporate/favicon-djamiyah-50.png          | 5           | 8b676ac5 |
| corporate/favicon-djamiyah.png             | 188         | 8e00a768 |
| corporate/gastroaccueil.jpeg               | 141         | f719cbd4 |
| corporate/gastronimque-accueil.webp        | 90          | d3fa9594 |
| corporate/hero-fallback.jpg                | 3092        | 00913e83 |
| corporate/hero-video.mp4                   | 7096        | 5d020216 |
| corporate/hotel-maison-blanche-aerien.webp | 83          | c65e21af |
| corporate/hotel-ramakissidougou.webp       | 67          | 3c0586ea |
| corporate/receptionniste-avatar.webp       | 61          | 21be0559 |
| corporate/restaurant-service.webp          | 85          | 9a7e4bb5 |
| corporate/salon-suite-premium.jpeg         | 35          | 89294a8b |
| corporate/salon-suite-prestige.jpg         | 35          | 8a48f2de |
| corporate/soumbouya.webp                   | 45          | fc1aca04 |
| corporate/suite-premium.jpg                | 392         | a8321077 |
| corporate/toilette-confort.jpeg            | 250         | a637aecf |
| corporate/toilette-double-premiun.jpeg     | 165         | 8b434822 |
| corporate/toilletespremium1.png            | 1103        | 5862a245 |
| heroevent.png                              | 720         | 176bb65c |
| hotel-rama-kissidougou.webp                | 67          | 3c0586ea |
| logo-djamiyah-white.svg                    | 82          | 523ff04b |
| logo-djamiyah.svg                          | 82          | 5e86e995 |
| logo-footer-green.svg                      | 496         | 48696ee7 |
| logos/logo-favicon.svg                     | 0.006       | e989a8e2 |
| logos/logo-footer.svg                      | 163         | 983f4c11 |
| maison-blanche/chambre-confort.jpg         | 40          | cc635102 |
| maison-blanche/chambre-premium.jpg         | 60          | 182ba998 |
| maison-blanche/double-premium.jpg          | 40          | 56e76804 |
| maison-blanche/suite-premium.jpg           | 392         | a8321077 |
| maison-blanche/suite-prestige.jpg          | 50          | 116b3323 |
| receptionniste-avatar.webp                 | 61          | 21be0559 |
| restaurant-service.webp                    | 85          | 9a7e4bb5 |

### Doublons détectés (même hash MD5)

| Hash     | Fichier 1                              | Fichier 2                          | Taille (KB) |
| -------- | -------------------------------------- | ---------------------------------- | ----------- |
| 21be0559 | `corporate/receptionniste-avatar.webp` | `receptionniste-avatar.webp`       | 61          |
| 3c0586ea | `corporate/hotel-ramakissidougou.webp` | `hotel-rama-kissidougou.webp`      | 67          |
| 6ad7fc06 | `corporate/Maneah.webp`                | `conference-maneah.webp`           | 33          |
| 9a7e4bb5 | `corporate/restaurant-service.webp`    | `restaurant-service.webp`          | 85          |
| a8321077 | `corporate/suite-premium.jpg`          | `maison-blanche/suite-premium.jpg` | 392         |
| fc1aca04 | `corporate/soumbouya.webp`             | `conference-soumbouya.webp`        | 45          |

### Résumé images

| Métrique              | Valeur                                |
| --------------------- | ------------------------------------- |
| **Total fichiers**    | 38 (dont 1 .DS_Store, 1 .mp4)         |
| **Doublons**          | 6 paires (12 fichiers concernés)      |
| **Espace gaspillé**   | ~683 KB                               |
| **Composant Gallery** | ❌ Non — aucun fichier Gallery trouvé |

---

## 5. Build et qualité

### `npm run build` — SUCCÈS ✅

```
▲ Next.js 16.1.6 (Turbopack)
- Environments: .env.local

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

✓ Compiled successfully in 1637.9ms
✓ Finished TypeScript in 1587.5ms
✓ Collecting page data using 9 workers in 271.9ms
✓ Generating static pages using 9 workers (42/42) in 828.8ms
✓ Finalizing page optimization in 12.9ms
```

| Métrique           | Valeur                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages générées     | **42** (13 pages localisées × 2 locales + API + static)                                                                                             |
| Erreurs TypeScript | **0**                                                                                                                                               |
| Routes API         | 11 (chat, chat/stream, config/avatar, contact, ghl/agents, ghl/locations, payment/chapchap, payment/webhook, promo/validate, reservations, webhook) |
| Routes statiques   | 3 (\_not-found, api/config/avatar, icon.png)                                                                                                        |
| Warning build      | 1 — `middleware` convention deprecated (Next.js 16)                                                                                                 |

### `npm run lint` — 93 problèmes (23 erreurs, 70 warnings)

| Type                     | Compte | Détail significatif                                                             |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| Erreurs ESLint           | 23     | Principalement `@typescript-eslint/no-unused-vars`, `@next/next/no-img-element` |
| Warnings                 | 70     | `react-hooks/exhaustive-deps`, `no-img-element`, unused vars                    |
| ⚠️ Middleware deprecated | 1      | `middleware.ts` → devrait migrer vers `proxy` (Next.js 16)                      |

---

## 6. Sécurité — Vérifications rapides

### .gitignore — Exclusions vérifiées

| Pattern       | Exclu ?                                               |
| ------------- | ----------------------------------------------------- |
| `.swarm/`     | ✅ Oui                                                |
| `ruvector.db` | ✅ Oui                                                |
| `*.db`        | ✅ Oui                                                |
| `*.db-shm`    | ✅ Oui                                                |
| `*.db-wal`    | ✅ Oui                                                |
| `.env*.local` | ✅ Oui (doublement protégé : `.env*` + `.env*.local`) |
| `.env*`       | ✅ Oui (avec exception `!.env.example`)               |

### Secrets en dur dans le code

| Pattern recherché          | Résultat                                                               |
| -------------------------- | ---------------------------------------------------------------------- |
| `sk_` (Stripe-like keys)   | ❌ Aucun trouvé                                                        |
| `pit-` (GHL token prefix)  | ❌ Aucun trouvé dans le code                                           |
| `Bearer ` hardcodé         | ✅ OK — tous utilisent `${getEnvOrThrow(...)}` ou `${token}` dynamique |
| API keys en string literal | ❌ Aucun trouvé                                                        |

### ⚠️ IDs GHL publics hardcodés (non-secrets mais à surveiller)

```typescript
// src/components/GHLWidget.tsx — composant CLIENT ('use client')
const GHL_LOCATION_ID = 'a5wcdv6hapHNnLA9xnl4'
const GHL_BUSINESS_ID = 'ORWCLXIGJ8k42yscyNzt'
const GHL_SNAPSHOT_ID = '67ebbd1e30e269d99774a4a0'
const GHL_USER_NICHE_ID = 'PY4tPIs4Efs5ox3Z7dGZ'
```

Ce sont des IDs publics pour le widget GHL embed (pas des secrets API), mais idéalement ils
devraient être dans des `NEXT_PUBLIC_*` env vars.

---

## 7. Cohérence métier

### Hôtels

| Vérification             | Résultat                                              |
| ------------------------ | ----------------------------------------------------- |
| "Maison Blanche" présent | ✅ Oui — layout, contact, reservation, hotels, etc.   |
| "Rama" présent           | ✅ Oui — contact/page.tsx (carte Kissidougou), images |

### 5 catégories de chambres dans `src/data/content.ts`

| Catégorie       | Présent      |
| --------------- | ------------ |
| Chambre Confort | ✅ ligne 54  |
| Chambre Premium | ✅ ligne 65  |
| Double Premium  | ✅ ligne 76  |
| Suite Premium   | ✅ ligne 87  |
| Suite Prestige  | ✅ ligne 105 |

### Salles de conférence

| Salle     | Présent                                  |
| --------- | ---------------------------------------- |
| Soumbouya | ✅ conferences/page.tsx:88,93 + images   |
| Manéah    | ✅ conferences/page.tsx:102,107 + images |

### Police Montserrat

✅ **NON IMPORTÉE** — grep retourne 0 résultat. Police interdite respectée.

### Couleurs corporate

| Couleur   | Utilisée                                                                |
| --------- | ----------------------------------------------------------------------- |
| `#0D3B3E` | ✅ Oui — contact, hotels, reservation, page d'accueil (30+ occurrences) |
| `#F9A03F` | ✅ Oui — contact, page d'accueil, icônes (30+ occurrences)              |

---

## 8. Synthèse — Verdict

### 🟢 Points VERTS (tout est OK)

1. ✅ **Build réussi** — 0 erreur TypeScript, 42 pages générées
2. ✅ **Variables d'environnement alignées** — toutes les vars utilisées sont dans .env.example
3. ✅ **ChapChapPay fix P0 complet** — wave/orange/mtn supportés, Zod valide, route dupliquée
   supprimée
4. ✅ **Chatbot routes alignées** — stream et fallback identiques (12 polls, 18s, ai-responses
   stubbed)
5. ✅ **Aucun secret en dur** — tous via process.env
6. ✅ **.gitignore complet** — .swarm, .db, .env protégés
7. ✅ **Montserrat absente** — police interdite non importée
8. ✅ **Couleurs corporate respectées** — #0D3B3E et #F9A03F utilisées partout
9. ✅ **5 catégories de chambres** dans content.ts
10. ✅ **2 hôtels** (Maison Blanche + Rama) et **2 salles** (Soumbouya + Manéah)

### 🟡 Points JAUNES (à surveiller)

1. ⚠️ **`src/lib/ghl/client.ts:232`** — contient encore un appel actif vers
   `/conversations/ai-responses` (endpoint mort GHL). Non appelé actuellement par les routes chat,
   mais risque de confusion future.
2. ⚠️ **GHL IDs hardcodés** dans `GHLWidget.tsx` — pas des secrets, mais devraient idéalement être
   en NEXT*PUBLIC*\* env vars.
3. ⚠️ **6 paires d'images dupliquées** — 683 KB gaspillés (corporate/ vs racine/maison-blanche/).
4. ⚠️ **Middleware deprecated** — Next.js 16 demande migration vers `proxy`. Non bloquant mais
   warning à chaque build.
5. ⚠️ **ESLint : 23 erreurs + 70 warnings** — principalement unused vars et `<img>` au lieu de
   `<Image>`.
6. ⚠️ **`GHL_REDIRECT_URI`** dans .env.example n'est jamais utilisée (doublon de
   `GHL_OAUTH_REDIRECT_URI`).
7. ⚠️ **Worktrees .claude/** contiennent d'anciennes routes supprimées (`chapchap/notify`).
8. ⚠️ **`.DS_Store`** dans `public/images/corporate/` — fichier macOS à supprimer.
9. ⚠️ **Pas de composant Gallery** — les images sont dispersées sans composant centralisé.
10. ⚠️ **Pas de fallback WhatsApp** dans le chatbot — uniquement fallback téléphone.

### 🔴 Points ROUGES (action requise immédiate)

**Aucun point rouge critique.** Le projet est déployable et fonctionnel.

---

### Score global de santé : **7.5 / 10**

**Justification :**

- **+3** Build propre, 0 erreur TypeScript, déploiement fonctionnel
- **+2** Sécurité solide (pas de secrets en dur, .gitignore complet, RLS mentionné)
- **+1.5** ChapChap et Chatbot fixes correctement appliqués et alignés
- **+1** Cohérence métier parfaite (hôtels, chambres, salles, couleurs, pas de Montserrat)
- **-0.5** ESLint : 23 erreurs non résolues (même si ce sont des warnings promus)
- **-0.5** Images dupliquées (~683 KB gaspillés, pas de Gallery)
- **-0.5** ghl/client.ts contient encore un appel mort vers ai-responses
- **-0.5** Middleware Next.js 16 deprecated non migré
- **-0.5** GHL IDs hardcodés côté client, .DS_Store commité, worktrees à nettoyer

---

_Audit généré automatiquement le 16/05/2026. READ-ONLY — aucun fichier modifié, aucun commit._
