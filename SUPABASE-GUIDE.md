# 🏨 Guide - Création de la base de données dans Supabase

## Projet : Groupe Djamiyah - Hôtel Maison Blanche

---

## 📋 Ce que le script crée

Le fichier **`supabase-rooms-setup.sql`** crée en une seule exécution :

### Tables
| Table | Description |
|-------|-------------|
| `rooms` | **5 chambres** de l'Hôtel Maison Blanche |
| `conference_rooms` | **4 salles** de conférence |
| `customers` | Clients fidèles |
| `reservations` | Réservations hôtel |

### Chambres insérées (`rooms`)
| Nom | Type | Prix/nuit | Capacité |
|-----|------|-----------|----------|
| Chambre Confort | standard | 1 000 GNF | 2 pers. |
| Chambre Premium | premium | 720 000 GNF | 2 pers. |
| Double Premium | premium | 870 000 GNF | 4 pers. |
| Suite Premium | suite | 1 070 000 GNF | 4 pers. |
| Suite Prestige | suite | 1 620 000 GNF | 6 pers. |

### Salles de conférence insérées (`conference_rooms`)
| Nom | Capacité | Prix/jour |
|-----|----------|-----------|
| Wonkifon | 20 places | 1 500 000 GNF |
| Somayah | 50 places | 2 000 000 GNF |
| Maneah | 75 places | 2 500 000 GNF |
| Soumbouyah | 150 places | 5 000 000 GNF |

---

## 🚀 Instructions d'exécution

### Étape 1 — Ouvrir Supabase Dashboard

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Se connecter et sélectionner le projet **Djamiyah Group**
   - URL du projet : `https://gwmdgkhhkyydzqjiqkxh.supabase.co`

### Étape 2 — Ouvrir l'éditeur SQL

1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"** (ou "+ New")

### Étape 3 — Exécuter le script

1. Ouvrir le fichier `supabase-rooms-setup.sql` dans VS Code
2. Sélectionner tout le contenu (`Cmd+A`)
3. Copier (`Cmd+C`)
4. Coller dans l'éditeur SQL de Supabase (`Cmd+V`)
5. Cliquer sur le bouton **"Run"** (ou `Ctrl+Enter`)

### Étape 4 — Vérifier le résultat

Après l'exécution, le script affiche automatiquement :
- La liste des **5 chambres** avec leurs prix
- La liste des **4 salles de conférence** avec leurs capacités

Vous devriez voir dans les résultats :

```
name              | type     | price_per_night | capacity | is_available
------------------+----------+-----------------+----------+-------------
Chambre Confort   | standard |            1000 |        2 | true
Chambre Premium   | premium  |          720000 |        2 | true
Double Premium    | premium  |          870000 |        4 | true
Suite Premium     | suite    |         1070000 |        4 | true
Suite Prestige    | suite    |         1620000 |        6 | true
```

---

## 🔒 Sécurité (RLS configurée)

| Table | Lecture publique | Écriture |
|-------|-----------------|---------|
| `rooms` | ✅ Oui (anon + authenticated) | 🔐 service_role uniquement |
| `conference_rooms` | ✅ Oui (anon + authenticated) | 🔐 service_role uniquement |
| `customers` | ❌ Non | 🔐 service_role uniquement |
| `reservations` | ❌ Non | ✅ Insert public + 🔐 service_role |

---

## ⚠️ Notes importantes

- **Idempotent** : Le script peut être rejoué sans risque. Si les chambres existent déjà, elles seront mises à jour (`ON CONFLICT DO UPDATE`).
- **Transactions** : Le schéma (tables, index, triggers, RLS) est dans une transaction `BEGIN/COMMIT`. Les insertions sont séparées.
- **Images** : Les chemins d'images pointent vers `/images/maison-blanche/` dans le dossier `public/` du projet Next.js.

---

## 🔧 Variables d'environnement (déjà configurées)

Le fichier `.env.local` contient déjà les clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://gwmdgkhhkyydzqjiqkxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

---

## 📁 Fichiers SQL du projet

| Fichier | Description |
|---------|-------------|
| `supabase-rooms-setup.sql` | ⭐ **Script complet** (schema + données) — À utiliser |
| `supabase-schema.sql` | Schema seul (sans données) |
| `insert-rooms.sql` | Insertion des chambres seule |
