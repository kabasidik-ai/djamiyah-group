# GHL OAuth 2.0 — Guide de déploiement complet
## Groupe Djamiyah · Concierge IA Salematou

---

## Vue d'ensemble

| Composant | Description |
|-----------|-------------|
| `ConciergeWidget` | Widget chat flottant (bouton bas-droit) |
| `/api/chat` | Bridge Conversation AI → widget |
| `/api/auth/ghl/*` | Flux OAuth 2.0 GHL |
| `/api/ghl/locations` | Liste des locations GHL |
| `/api/ghl/agents` | Liste des bots Conversation AI |
| `/api/config/avatar` | Lecture avatar Salematou (public) |
| `/api/admin/avatar` | Mise à jour avatar (protégé) |

---

## Étape 1 — Créer l'app GHL Developer Marketplace

1. Connectez-vous sur [marketplace.gohighlevel.com](https://marketplace.gohighlevel.com)
2. Allez dans **My Apps → Create App**
3. Configurez :
   - **App Name** : `Djamiyah Concierge IA`
   - **Distribution Type** : `Sub-Account` (accès location-level)
   - **Redirect URI** : `https://djamiyah-group.vercel.app/api/auth/ghl/callback`
4. **Scopes requis** (cochez tous) :
   - `conversations.readonly` · `conversations.write`
   - `conversations/message.readonly` · `conversations/message.write`
   - `contacts.readonly` · `contacts.write`
   - `locations.readonly`
   - `oauth.readonly` · `oauth.write`
   - `bots.readonly`
5. Copiez **Client ID** et **Client Secret**

---

## Étape 2 — Configurer Vercel

Dans [vercel.com/dashboard](https://vercel.com) → votre projet → **Settings → Environment Variables** :

```
GHL_CLIENT_ID          = <votre Client ID>
GHL_CLIENT_SECRET      = <votre Client Secret>
GHL_OAUTH_REDIRECT_URI = https://djamiyah-group.vercel.app/api/auth/ghl/callback
ADMIN_SECRET_KEY       = <openssl rand -hex 32>
SALEMATOU_AVATAR_URL   = <URL HTTPS de la photo> (optionnel)
```

> `GHL_PRIVATE_TOKEN` reste en place pendant la migration. Il sera le fallback automatique
> tant que OAuth n'est pas activé.

---

## Étape 3 — Exécuter la migration Supabase

```sql
-- Dans Supabase → SQL Editor, collez le contenu de :
-- supabase/migrations/002_ghl_oauth.sql
```

Ou via Supabase CLI :
```bash
supabase db push
```

---

## Étape 4 — Autoriser l'application GHL (OAuth)

1. Ouvrez dans le navigateur (connecté à GHL) :
   ```
   https://djamiyah-group.vercel.app/api/auth/ghl/authorize
   ```
2. GHL affiche la page de sélection de location → sélectionnez votre location
3. Autorisez l'application
4. Vous êtes redirigé vers `/admin?oauth_success=1&location_id=XXXX`
5. Copiez le `location_id` → ajoutez dans Vercel :
   ```
   GHL_LOCATION_ID = <votre location_id>
   ```

---

## Étape 5 — Récupérer l'ID de votre bot Conversation AI

```bash
curl https://djamiyah-group.vercel.app/api/ghl/agents
```

Réponse :
```json
{
  "success": true,
  "agents": [
    { "id": "bot_abc123", "name": "Concierge IA - Groupe Djamiyah", "status": "active" }
  ],
  "hint": "Copiez l'ID du bot souhaité → ajoutez GHL_CONVERSATION_AI_AGENT_ID dans Vercel"
}
```

Ajoutez dans Vercel :
```
GHL_CONVERSATION_AI_AGENT_ID = bot_abc123
```

> **Si aucun bot n'apparaît** : créez-en un dans GHL → Settings → Conversation AI → New Bot

---

## Étape 6 — Configurer la photo de Salematou

### Option A — Variable d'environnement (Vercel)
```
SALEMATOU_AVATAR_URL = https://votre-cdn.com/salematou.jpg
```
Redéployer le projet après modification.

### Option B — API Admin (sans redéploiement) ✅ Recommandé
```bash
curl -X PUT https://djamiyah-group.vercel.app/api/admin/avatar \
  -H "Content-Type: application/json" \
  -H "x-admin-key: VOTRE_ADMIN_SECRET_KEY" \
  -d '{"url": "https://votre-cdn.com/salematou.jpg"}'
```
Le widget se met à jour immédiatement (revalidation cache 1h).

---

## Architecture du flux de chat

```
Visiteur
  │
  ▼
ConciergeWidget (bouton flottant bas-droit)
  │ POST /api/chat
  ▼
chat/route.ts
  ├─► findOrCreateContact (GHL Contacts API)
  ├─► findOrCreateConversation (GHL Conversations API)
  │
  ├─► [si GHL_CONVERSATION_AI_AGENT_ID défini]
  │     POST /conversations/ai-responses  ◄── Conversation AI Public API
  │     Réponse directe < 2s ✓
  │
  └─► [fallback polling]
        sendMessage → waitForBotReply (8s max)
        Le bot GHL répond via son workflow configuré
```

---

## Endpoints de diagnostic

| URL | Auth | Description |
|-----|------|-------------|
| `GET /api/ghl/locations` | aucune | Liste les locations |
| `GET /api/ghl/agents` | aucune | Liste les bots Conversation AI |
| `GET /api/config/avatar` | aucune | Config avatar Salematou |
| `PUT /api/admin/avatar` | `x-admin-key` | Met à jour l'avatar |
| `GET /api/auth/ghl/authorize` | aucune | Lance le flux OAuth |

---

## Vérification rapide

```bash
# 1. Token OAuth actif ?
curl https://djamiyah-group.vercel.app/api/ghl/locations

# 2. Bot configuré ?
curl https://djamiyah-group.vercel.app/api/ghl/agents

# 3. Avatar actuel ?
curl https://djamiyah-group.vercel.app/api/config/avatar

# 4. Test du chat
curl -X POST https://djamiyah-group.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour, quels sont vos tarifs ?", "channel": "live_chat"}'
```
