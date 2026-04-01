# Variables d'environnement — Vercel
# Groupe Djamiyah — djamiyah-group

---

## Comment configurer sur Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet **djamiyah-group**
3. Aller dans **Settings → Environment Variables**
4. Ajouter chaque variable ci-dessous pour les environnements : **Production**, **Preview**, **Development**
5. Après ajout : **Deployments → ⋯ → Redeploy** pour appliquer

---

## Variables à configurer

### Site URL

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://djamiyah-group.vercel.app` |

---

### Supabase

| Variable | Description | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique du projet | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Clé secrète service role | Supabase Dashboard → Settings → API |

> `SUPABASE_SERVICE_ROLE_KEY` est **strictement serveur**. Ne jamais l'exposer côté client.

---

### ChapChap Pay

| Variable | Valeur / Description |
|---|---|
| `CHAPCHAP_API_KEY_TEST` | Clé API mode test (dashboard ChapChap) |
| `CHAPCHAP_API_KEY_PRODUCTION` | Clé API mode production (dashboard ChapChap) |
| `CHAPCHAP_HMAC_SECRET` | Secret HMAC pour vérification webhooks |
| `CHAPCHAP_BASE_URL` | `https://chapchappay.com/api` |
| `CHAPCHAP_NOTIFY_URL` | `https://djamiyah-group.vercel.app/api/payment/webhook` |
| `CHAPCHAP_RETURN_URL` | `https://djamiyah-group.vercel.app/reservation/success` |
| `CHAPCHAP_CANCEL_URL` | `https://djamiyah-group.vercel.app/reservation` |

> Les URLs ChapChap **doivent utiliser HTTPS**. ChapChap rejette les URLs HTTP.
>
> Le webhook de réception est `/api/payment/webhook` — c'est la route active en production.

---

## Variables locales (.env.local)

Pour le développement local, copier `.env.example` → `.env.local` et utiliser :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CHAPCHAP_BASE_URL=https://chapchappay.com/api
CHAPCHAP_NOTIFY_URL=http://localhost:3000/api/payment/webhook
CHAPCHAP_RETURN_URL=http://localhost:3000/reservation/success
CHAPCHAP_CANCEL_URL=http://localhost:3000/reservation
```

---

## Tester le webhook en production

```bash
# Simuler un paiement réussi (nécessite le HMAC_SECRET pour une vraie signature)
curl -s -X POST https://djamiyah-group.vercel.app/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "ccp-hmac-signature: <hmac-sha256-de-ton-payload>" \
  -d '{
    "status": "SUCCESS",
    "transaction_id": "TXN-TEST-001",
    "reservation_id": "<uuid-reservation-existante>"
  }'
```

**Réponse attendue :**
```json
{ "success": true }
```
