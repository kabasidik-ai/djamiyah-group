# 🔧 Variables d'environnement — Vercel

## Comment configurer sur Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet **djamiyah-group**
3. Aller dans **Settings → Environment Variables**
4. Ajouter chaque variable ci-dessous

---

## Variables à configurer

### 🌐 Site URL
| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://djamiyah-group.vercel.app` |

### 💳 ChapChap Pay
| Variable | Description |
|----------|-------------|
| `CHAPCHAP_API_KEY_TEST` | Clé API test (voir dashboard ChapChap) |
| `CHAPCHAP_API_KEY_PRODUCTION` | Clé API production (voir dashboard ChapChap) |
| `CHAPCHAP_HMAC_SECRET` | Secret HMAC (voir dashboard ChapChap) |
| `CHAPCHAP_BASE_URL` | `https://chapchappay.com/api` |
| `CHAPCHAP_NOTIFY_URL` | `https://djamiyah-group.vercel.app/api/payment/webhook` |
| `CHAPCHAP_RETURN_URL` | `https://djamiyah-group.vercel.app/reservation/success` |

### 🗄️ Supabase
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase (voir Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anon (voir Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role **secrète** (voir Settings → API) |

> ⚠️ **Ne jamais mettre les vraies clés dans ce fichier** — utiliser le fichier `.env.local` en local et le dashboard Vercel en production.

---

## ⚠️ Important

- Toutes les variables doivent être configurées pour les environnements : **Production**, **Preview**, **Development**
- `CHAPCHAP_NOTIFY_URL` et `CHAPCHAP_RETURN_URL` **doivent utiliser HTTPS** — ChapChap rejette les URLs HTTP
- `NEXT_PUBLIC_SITE_URL` doit correspondre exactement à l'URL de votre site Vercel

---

## 🔄 Après avoir ajouté les variables

1. Aller dans **Deployments**
2. Cliquer sur les **3 points** du dernier déploiement
3. Cliquer **Redeploy** pour appliquer les nouvelles variables

---

## 🧪 Tester le paiement en production

```bash
curl -s -X POST https://djamiyah-group.vercel.app/api/payment/chapchap \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 720000,
    "currency": "GNF",
    "paymentMethod": "orange_money",
    "phoneNumber": "+224610759090",
    "customerName": "Test Client",
    "customerEmail": "test@djamiyah.com",
    "bookingReference": "MB-TEST001"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "order_id": "MB-TEST001",
  "payment_url": "https://chapchappay.com/pay/..."
}
```
