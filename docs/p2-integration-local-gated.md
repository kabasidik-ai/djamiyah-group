# P2 intégration locale contrôlée (gated)

## Mode serveur

- `P2_PAYMENT_ENGINE_MODE=off` (défaut): routes actives restent P1 inchangées.
- `P2_PAYMENT_ENGINE_MODE=local_mock`: raccordement P2 autorisé **uniquement** hors production.
- En `NODE_ENV=production`, le mode est forcé à `off`.

## Contraintes local_mock

- `CHAPCHAP_BASE_URL` doit être `http://127.0.0.1:*` ou `http://localhost:*`.
- `NEXT_PUBLIC_SUPABASE_URL` doit être `http://127.0.0.1:*` ou `http://localhost:*`.
- Credentials (`user:pass@`), query strings et fragments (`?x=`, `#x`) sont refusés.
- Toute destination distante est refusée (échec fermé).

## Paiement (route `/api/payment/chapchap`)

- Garde `X-Reservation-Claim` conservée.
- Contrôles same-origin / rate-limit conservés.
- En `off`: appel noyau P1 historique.
- En `local_mock`: appel moteur P2 `initiatePaymentWithAttempt`.
- Blocage des redirections HTTP (301/302/307/308) appliqué uniquement au transport P2 local_mock
  (`redirect: 'error'`), pas au chemin P1.
- Correction métier: si `settle_payment_attempt` ne retourne pas `updated`, la route ne renvoie
  jamais `ok/payment_url`.

## Webhook (route `/api/payment/webhook`)

- Vérification HMAC conservée.
- En `local_mock` (room uniquement):
  1. Authentification signature.
  2. **Persist-before-ack** dans `payment_event_journal` (append-only) via RPC.
  3. Application idempotente via `applyAttemptEvent`.
  4. Marquage `payment_event_processing`.
- Si journalisation impossible: réponse 503 (pas de perte silencieuse, investigation/retry manuel
  requis).
- Aucun fallback silencieux vers P1 pour un événement P2 non vérifiable.

## Journal durable

Migration additive: `20261105_payment_event_journal.sql`

- `payment_event_journal`: immutable append-only, clé de dédup (`dedup_key`) unique.
- `payment_event_processing`: statut de traitement séparé.
- `payment_reconciliation_decisions`: décisions humaines traçables.
- RPC:
  - `persist_payment_webhook_event(...)`
  - `mark_payment_event_processing(...)`
- Permissions: RLS + policies `service_role`, revoke public/anon/authenticated.

## Conférences

- Parcours conférence non modifié par le raccordement P2 local room-only.
- Route conférence pay conserve son flux existant.

## Reprise incident webhook (limite actuelle)

- En cas de crash **après** persistance et **avant** décision finale, l'événement reste traçable via:
  - `payment_event_journal` (payload redacted, hash, identifiants)
  - `payment_event_processing` (`processing_status='storage_failed'` ou `reconciliation_required`)
- Reprise automatique asynchrone non implémentée dans cette phase locale.
- Procédure manuelle minimale:
  1. lister les événements non traités (`received`, `storage_failed`, `reconciliation_required`),
  2. relancer le traitement contrôlé via runbook opérateur,
  3. tracer la décision humaine dans `payment_reconciliation_decisions`,
  4. marquer l'événement via `mark_payment_event_processing`.
- Cette absence d'auto-replay doit rester un **blocage avant activation hors local_mock**.

## Contrat ChapChap — points non confirmés

- `/ecommerce/create` vs `/ecommerce/operation`.
- `notify_url` vs `callback_url`.
- Nom/format exact de l’en-tête signature HMAC.
- Garantie d’écho `operation_id/request_id` et champs `order_id/amount/currency/metadata`.
- Politique de retry détaillée selon statut HTTP et produit.
