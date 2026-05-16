# 🐛 DEBUG_CHAT.md — Rapport d'audit du chatbot Salematou

> **Audit READ-ONLY** — Aucune modification de code effectuée.  
> Date : 16 mai 2026 · Auteur : Cline

---

## 1. Occurrences exactes de "Service en cours de configuration"

| #   | Fichier                            | Ligne   | Texte exact                                                              | Fonction contenante          |
| --- | ---------------------------------- | ------- | ------------------------------------------------------------------------ | ---------------------------- |
| 1   | `src/app/api/chat/stream/route.ts` | **299** | `'Service en cours de configuration. Réessayez dans quelques instants.'` | `POST()` — handler principal |
| 2   | `src/app/api/chat/route.ts`        | **237** | `'Service en cours de configuration. Réessayez dans quelques instants.'` | `POST()` — handler principal |
| 3   | `src/app/api/chat/route.ts`        | **244** | `'Service en cours de configuration. Réessayez dans quelques instants.'` | `POST()` — handler principal |

**Total : 3 occurrences dans 2 fichiers.**

---

## 2. Conditions qui déclenchent chaque occurrence

### Occurrence 1 — `stream/route.ts:299` (SSE endpoint)

```typescript
// Ligne 292-310
if (
  !process.env.GHL_API_TOKEN ||
  !process.env.GHL_LOCATION_ID ||
  !process.env.GHL_CONVERSATION_AI_AGENT_ID
) {
  return new Response(
    sseEvent('error', {
      message: 'Service en cours de configuration. Réessayez dans quelques instants.',
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  )
}
```

**Condition** : Guard `null-check` au tout début du handler POST.  
**Déclencheur** : UNE des 3 variables d'environnement GHL est `undefined` ou `""`.  
**Type** : Retour immédiat (pas de try/catch, pas de timeout).

### Occurrence 2 — `chat/route.ts:237` (fallback JSON)

```typescript
// Ligne 234-240
if (!process.env.GHL_API_TOKEN) {
  console.error('[Chat API] FATAL: GHL_API_TOKEN manquant')
  return NextResponse.json(
    { reply: 'Service en cours de configuration. Réessayez dans quelques instants.' },
    { status: 200 }
  )
}
```

**Condition** : Guard `null-check` sur `GHL_API_TOKEN` uniquement.  
**Déclencheur** : `GHL_API_TOKEN` est `undefined` ou `""`.

### Occurrence 3 — `chat/route.ts:244` (fallback JSON)

```typescript
// Ligne 241-247
if (!process.env.GHL_LOCATION_ID || !process.env.GHL_CONVERSATION_AI_AGENT_ID) {
  console.error('[Chat API] FATAL: GHL_LOCATION_ID ou AGENT_ID manquant')
  return NextResponse.json(
    { reply: 'Service en cours de configuration. Réessayez dans quelques instants.' },
    { status: 200 }
  )
}
```

**Condition** : Guard `null-check` sur `GHL_LOCATION_ID` OU `GHL_CONVERSATION_AI_AGENT_ID`.  
**Déclencheur** : L'une des 2 variables est `undefined` ou `""`.

---

## 3. Tracé complet de la requête `/api/chat/stream`

### Flux client → serveur

```
┌─────────────────────────────────────────────────────────────────┐
│  ConciergeWidget.tsx                                            │
│  L266: sendMessage()                                            │
│    ├── L307: readSSEStream('/api/chat/stream', ...)  ← SSE     │
│    │     Si SSE échoue ou streamedContent vide :                │
│    └── L358: fetchChatFallback('/api/chat', ...)     ← JSON    │
│         (Timeout: 45s via AbortController L299)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flux serveur — `/api/chat/stream` (SSE)

```
POST /api/chat/stream
│
├── [Guard L292-310] process.env.GHL_API_TOKEN manquant ?
│   └── OUI → SSE event:error "Service en cours de configuration"  ← OCCURRENCE 1
│   └── NON → continue
│
├── [L320] Parse body JSON
│   └── Échec → SSE event:error "Requête invalide"
│
├── [L331] message vide ?
│   └── OUI → SSE event:error "Message vide"
│
├── [L343] Démarrage ReadableStream SSE
│   │
│   ├── [L357] push(status: 'thinking')
│   │
│   ├── [L360-379] Cache check
│   │   └── Hit → stream mots par mots → push(done) → close
│   │
│   ├── [L382-383] getOrCreateContact() → appel GHL /contacts/search/duplicate
│   │   └── 401 (token invalide) → throw → catch L449 → "Service temporairement indisponible"
│   │   └── 200 + pas de contact → POST /contacts/ (création)
│   │       └── Échec → throw → catch L449
│   │
│   ├── [L387] getOrCreateConversation() → appel GHL /conversations/search
│   │   └── Échec → throw → catch L449
│   │
│   ├── [L391-403] Snapshot message count (non-critique, catch silencieux)
│   │
│   ├── [L406] sendInboundMessage() → POST /conversations/messages/inbound
│   │   └── Échec → throw → catch L449
│   │
│   ├── [L409] push(status: 'typing')
│   │
│   ├── [L412] getDirectAIReply() → STUB (retourne null systématiquement)
│   │   └── Note: endpoint /conversations/ai-responses retourne 404 sur GHL API v2
│   │
│   ├── [L415-421] pollForBotReply()
│   │   └── 12 polls × 1.5s = 18s max
│   │   └── Keepalive SSE après poll #5 (~8s)
│   │   └── Cherche direction === 'outbound' dans les nouveaux messages
│   │   └── null si aucune réponse après 18s
│   │
│   ├── [L424-427] Si rawReply null → fallback statique :
│   │   "Je traite votre demande. N'hésitez pas à reformuler..."
│   │
│   ├── [L429] toTwoSentenceReply() → tronque à 2 phrases
│   │
│   ├── [L437-445] Stream mot par mot (25-40ms entre chaque)
│   │
│   ├── [L447-448] push(done + status:done)
│   │
│   └── [L449-454] CATCH global →
│       "Service temporairement indisponible. Contactez-nous au +224 610 75 90 90."
│
└── [L465-480] Response SSE + cookie session (7j)
```

### Moment exact du fallback "Service en cours de configuration"

Le message **"Service en cours de configuration"** ne peut être renvoyé que dans **UN SEUL cas** :

> **Les variables `process.env.GHL_API_TOKEN`, `process.env.GHL_LOCATION_ID` ou
> `process.env.GHL_CONVERSATION_AI_AGENT_ID` sont `undefined`/`""` au moment de la requête.**

C'est un guard **synchrone** exécuté AVANT le démarrage du stream SSE (lignes 292-310).

Si les variables sont présentes mais le **token est invalide** (401), le code passe le guard mais
échoue ensuite dans `getOrCreateContact()` → le catch global (L449) renvoie un message **différent**
: _"Service temporairement indisponible"_.

---

## 4. Valeurs de `maxDuration`

| Fichier                            | Valeur                                               | Ligne |
| ---------------------------------- | ---------------------------------------------------- | ----- |
| `src/app/api/chat/stream/route.ts` | `maxDuration = 30`                                   | L18   |
| `src/app/api/chat/route.ts`        | **Non défini** (défaut Vercel = 10s hobby / 15s pro) | —     |

⚠️ **Risque sur `/api/chat`** : le polling (12 × 1.5s = 18s) peut dépasser le timeout par défaut
Vercel.

---

## 5. Variables d'environnement critiques

### `/api/chat/stream/route.ts`

| Variable                       | Utilisation                                                                 | Ligne(s)              |
| ------------------------------ | --------------------------------------------------------------------------- | --------------------- |
| `GHL_API_TOKEN`                | Guard null-check + `buildHeaders()` (Bearer token)                          | L293, L84             |
| `GHL_LOCATION_ID`              | Guard null-check + contact/conversation search/create                       | L294, L99, L154, L193 |
| `GHL_CONVERSATION_AI_AGENT_ID` | Guard null-check uniquement (utilisé nulle part ailleurs dans ce fichier !) | L295                  |

### `/api/chat/route.ts`

| Variable                       | Utilisation                                           | Ligne(s)              |
| ------------------------------ | ----------------------------------------------------- | --------------------- |
| `GHL_API_TOKEN`                | Guard null-check + `buildHeaders()` (Bearer token)    | L234, L57             |
| `GHL_LOCATION_ID`              | Guard null-check + contact/conversation search/create | L241, L72, L127, L158 |
| `GHL_CONVERSATION_AI_AGENT_ID` | Guard null-check uniquement (pas utilisé ailleurs)    | L241                  |

### Lecture des variables

Toutes sont lues via `process.env.X` directement (guard) ou via `getEnvOrThrow('X')` (helper qui
throw si vide). ✅ Correct.

---

## 6. DIAGNOSTIC : Pourquoi Sidik voyait "Service en cours de configuration"

### Cause racine : `GHL_LOCATION_ID` avec typo sur Vercel

```
Vercel (avant fix) : a5wcdv6hapHNnLA9xn14   ← chiffre "1"
Local (.env.local) : a5wcdv6hapHNnLA9xnl4   ← lettre "l"
```

### Chronologie de l'erreur

1. **L'utilisateur envoie "Salle conférence"** via le widget
2. Le client appelle `POST /api/chat/stream`
3. Le guard L292-310 **passe** (les 3 vars sont non-vides dans Vercel)
4. Le stream SSE démarre → `push('status', { status: 'thinking' })`
5. `getOrCreateContact()` appelle GHL avec le mauvais `locationId`
6. GHL retourne **HTTP 401** (Unauthorized — location ID invalide pour ce token)
7. Le contact search échoue → le code tente de créer un contact
8. La création échoue aussi avec **HTTP 401**
9. `throw new Error('Contact creation failed: HTTP 401')`
10. Le catch global (L449) renvoie : **"Service temporairement indisponible"**

### Correction appliquée (session précédente)

- `GHL_LOCATION_ID` corrigé sur Vercel : `xn14` → `xnl4`
- `GHL_API_TOKEN` rafraîchi (l'ancien était potentiellement expiré)
- Redéploiement → chatbot fonctionnel ✅

### Note importante

Le message exacte vu par Sidik n'était PAS "Service en cours de configuration" mais plutôt
**"Service en cours de configuration"** (occurrence 1, guard) OU **"Service temporairement
indisponible"** (occurrence catch L453). Les logs Vercel montrent un **401** sur contact search, ce
qui pointe vers le **catch global** (L449-453) et non le guard (L292-310).

Si les variables étaient réellement absentes sur Vercel, le guard aurait bloqué AVANT le
`status: thinking`. Or les logs montrent `thinking` → puis erreur → c'est donc le **catch global**
qui s'est déclenché.

---

## Résumé

| Question                                                    | Réponse                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| Combien d'occurrences "Service en cours de configuration" ? | **3** (1 dans stream, 2 dans chat)                                          |
| Quand ce message apparaît-il ?                              | **Uniquement si 1 des 3 vars GHL est `undefined`**                          |
| Cause du bug de Sidik ?                                     | **`GHL_LOCATION_ID` typo sur Vercel** (`1` vs `l`) → 401 GHL → catch global |
| Message réellement affiché ?                                | Probablement **"Service temporairement indisponible"** (catch L449)         |
| maxDuration stream ?                                        | **30s** ✅ suffisant                                                        |
| maxDuration chat ?                                          | **Non défini** ⚠️ risque timeout                                            |
| Variables lues correctement ?                               | **Oui** — `process.env.X` + `getEnvOrThrow()`                               |

---

**DEBUG OK**
