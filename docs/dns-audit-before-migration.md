# DNS Audit — Avant Migration djamiyahgroup.com → Vercel

Date : 2025-01-24

## Enregistrements à CONSERVER absolument (emails Hostinger)

| Type  | Nom              | Valeur                                  | Action            |
| ----- | ---------------- | --------------------------------------- | ----------------- |
| MX    | @                | mx1.hostinger.com (priorité 10)         | 🔴 NE PAS TOUCHER |
| MX    | @                | mx2.hostinger.com (priorité 20)         | 🔴 NE PAS TOUCHER |
| TXT   | @                | v=spf1 include:\_spf.hostinger.com ~all | 🔴 NE PAS TOUCHER |
| TXT   | smtp.\_domainkey | [valeur DKIM Hostinger]                 | 🔴 NE PAS TOUCHER |
| TXT   | \_dmarc          | v=DMARC1; p=none                        | 🔴 NE PAS TOUCHER |
| CNAME | mail             | [webmail Hostinger]                     | 🔴 NE PAS TOUCHER |

## Enregistrements à REMPLACER (site web uniquement)

| Type  | Nom | Ancienne valeur         | Nouvelle valeur      |
| ----- | --- | ----------------------- | -------------------- |
| A     | @   | [ancienne IP Hostinger] | 76.76.21.21          |
| CNAME | www | [ancienne valeur]       | cname.vercel-dns.com |

## Variables d'environnement Vercel confirmées ✅

- GHL_API_TOKEN
- GHL_LOCATION_ID
- GHL_CONVERSATION_AI_AGENT_ID
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Checklist pré-migration

- [ ] Screenshot DNS Hostinger effectué
- [ ] Domaine ajouté sur Vercel Dashboard
- [ ] Variables Vercel vérifiées
- [ ] .env.local.test mis à jour
