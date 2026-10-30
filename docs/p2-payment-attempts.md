# P2 — Tentatives de paiement : plan d'architecture (lecture seule, non appliqué)

Base : `fbde8e7` (PR #12). Le présent document décrit le PLAN ; aucun élément n'est copié vers
Supabase, ni vers le webhook de production, ni vers la route de paiement.

## 1. État du système actuel (P1)

- `POST /api/reservations` → RPC `reserve_room` atomique (disponibilité + prix) →
  `reservations.status='confirmed'`.
- `POST /api/payment/chapchap` → `initiateChapChapPayment` (P1) : consultation + éligibilité +
  `payment_status='pending'` + appel `/ecommerce/create` → retour `payment_url`.
- Webhook `/api/payment/webhook` : HMAC + `STATUS_RANK` idempotent sur
  `reservations.payment_status`.

**Faille P2** : aucune garantie qu'une seule opération ChapChap soit créée. Les fichiers préparés
ici (`paymentAttempts.ts`, `paymentAttemptWebhook.ts`, tests, migration SQL) **ne remplacent rien**
: le câblage est bloqué (§6, §7).

## 2. Table `payment_attempts` (migration additive préparée)

Fichier : `supabase/migrations/20261030_payment_attempts.sql` — NON EXÉCUTÉ.

| Colonne                                                                          | Rôle                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------- |
| `id uuid PK`                                                                     | identifiant de tentative (UUID)                   |
| `reservation_id uuid FK`                                                         | réservation                                       |
| `reference text`                                                                 | référence commerciale MB-/RA- (canonique serveur) |
| `order_id text UNIQUE`                                                           | order_id ChapChap, neuf PAR tentative             |
| `amount int > 0`, `currency`                                                     | montant/device serveur (snapshot)                 |
| `status` CHECK `created \| awaiting_pay \| paid \| failed \| expired \| unknown` | état explicite                                    |
| `payment_url`                                                                    | lien de caisse mémorisé                           |
| `provider_operation_id`, `provider_request_id`                                   | identifiants prestataire                          |
| `claim_token uuid`, `claimed_at`                                                 | jeton/réclamation du pilote unique                |
| `created_at`, `updated_at`                                                       | timestamps (trigger `set_updated_at`)             |

**Index partiel unique (barrière atomique)** :
`uq_payment_attempts_single_active (reservation_id) WHERE status IN ('created','awaiting_pay','unknown')`
→ au plus UNE tentative active par réservation ; `paid/failed/expired` libèrent la place (nouvelle
tentative légitime). RLS service_role uniquement (convention des tables existantes).

## 3. Mécanisme atomique (implémenté, testé en mémoire)

- `acquireAttempt` (src/lib/paymentAttempts.ts) : INSERT seule ligne → la violation d'index partiel
  EST le verrou ; conflit → relecture de la tentative active → `reused` (lien frais), `busy`, ou
  `blocked_unknown`.
- `claim` conditionnel (jeton propriétaire OU expiration) : UN SEUL pilote par tentative ; pas de
  transaction SQL ouverte pendant l'HTTP (autocommit).
- `initiatePaymentWithAttempt` : éligibilité (montant serveur) → acquisition → appel ChapChap (hors
  transaction) → règlement.
- `settleAttempt` : ok → `awaiting_pay` ; refus 4xx → `failed` ; **timeout, erreur réseau, ≥500, 2xx
  sans URL, lien périmé, tentative orpheline → `unknown`**.

## 4. Timeouts et états inconnus

RÈGLES (tests couverts) :

- résultat incertain ⇒ `status='unknown'` et BLOCAGE de toute nouvelle tentative (`blocked_unknown`)
  — **jamais** de nouvelle opération automatique ;
- tentative `created` au claim expiré (crash) ⇒ requalifiée `unknown` (impossible de prouver
  qu'aucun appel n'a eu lieu) ;
- lien réutilisé seulement dans sa fenêtre démontrée (30 min) ; au-delà ⇒ révoqué en `unknown` ;
- réconciliation = dashboard ChapChap + action admin (à définir), qui requalifie en
  `paid`/`failed`/`expired` et débloque une nouvelle tentative.

## 5. Événements webhook — logique prête, NON branchée

`src/lib/paymentAttemptWebhook.ts` + tests : mapping des statuts documentés
(success/failed/canceled/expired/error), `paid` terminal, `expired/failed` surclassables par `paid`
(retry doc), rejeu idempotent, hors-ordre ignoré, statut non documenté ignoré. La vérification HMAC
n'est PAS touchée.

## 6. Blocage câblage route de paiement

Le branchement de `initiatePaymentWithAttempt` dans la route nécessite : (a) décision sur le mapping
des nouveaux résultats (`busy`/`blocked_unknown`) vers le client (et poll
`GET /api/payment/status`), (b) la stratégie `payment_status='pending'` (déplacée après succès
provider). À faire dans une étape séparée, après GO.

## 7. Route GET de statut — bloquée (autorisation non définie)

Une future `GET /api/payment/status?attempt_id=` exposerait un ÉTAT FINANCIER. Aucun mécanisme de
possession n'existe (la connaissance de l'UUID ne suffit pas) : **la route n'est PAS exposée tant
que le « claim code » (dérivé HMAC d'un secret serveur, retourné à la création de la réservation)
n'est pas implémenté** — un jeton d'accès signé par tentative (cookie `HttpOnly` ou paramètre signé)
sera exigé. Blocage documenté, non contourné.

## 8. Plan migration & retour arrière (non destructif)

1. Préprod : appliquer `20261030_payment_attempts.sql` (SQL Editor), vérifier l'index partiel,
   exécuter la suite de tests contre la vraie base.
2. Prod : même migration puis activation du câblage (étapes §6-§7).
3. Retour arrière : **aucune suppression automatique de `payment_attempts`** (traces financières —
   archive/retention à définir, jamais de `DROP` en aveugle) ; rollback applicatif = revert du code
   seul ; la table coexiste sans effet tant que la route ne l'écrit pas.

## 9. Hors périmètre (signalés séparément)

- **Possession** : connaissance de l'UUID suffit (test diagnostic) → claim code (§7). Non résolu.
- **Validation humaine** : chambres auto-`confirmed` ; salles payables avant validation admin —
  décision produit requise hors P2.
- **Inconnues ChapChap** : doublons `order_id`, clé d'idempotence, GET d'opération, nom exact du
  header HMAC — à confirmer avant câblage.
