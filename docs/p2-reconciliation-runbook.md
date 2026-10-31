# Runbook — Réconciliation paiements P2 (local prep, non activé prod)

## Principes immuables

- Interdiction de confirmation automatique si identité provider non vérifiable.
- **Aucun webhook non vérifiable ne doit confirmer automatiquement un paiement.**
- Toute décision financière doit être traçable (qui, quand, pourquoi, preuves).
- Aucun secret (API key, HMAC secret, token claim complet) dans les logs.
- Prévenir le second paiement avant toute action corrective.

## Cas 1 — `unknown`

- Détection:
  - tentative `payment_attempts.status='unknown'`
  - ou sortie applicative `blocked_unknown`
- Références à vérifier:
  - `attempt_id`, `order_id`, `reservation_id`, `provider_operation_id`, `provider_request_id`
- Preuves:
  - traces webhook (horodatage, statut, identifiants)
  - état dashboard marchand (opération trouvée/non trouvée)
- Autorisation correction:
  - support paiement niveau 2 + validation responsable finance
- Action interdite automatiquement:
  - créer une nouvelle opération provider tant que `unknown` actif
- Prévention second paiement:
  - garder verrou actif (`unknown`) jusqu’à qualification terminale
- Traçabilité décision:
  - journal décision: motif, opérateur, ticket, preuves, UTC

## Cas 2 — `manual_reconciliation_required`

- Détection:
  - résultat module webhook: `manual_reconciliation_required`
- Références:
  - comparer payload webhook vs tentative (`attempt_id/order_id/op_id/req_id`)
- Preuves:
  - payload redacted + signature validée + capture dashboard
- Autorisation:
  - opérateur habilité “payment_reconciliation”
- Interdit auto:
  - aucune transition `paid` sans recoupement identité
- Anti double paiement:
  - si doute, maintenir `pending` réservation + tentative inchangée
- Journal:
  - décision explicite « confirmée/rejetée/en attente » + motif

## Cas 3 — webhook sans identifiant fiable

- Détection:
  - absence de `attempt_id` et `order_id`, ou absence op/request utilisable
- Vérifications:
  - recherche dashboard via métadonnées / heure / montant
- Preuves:
  - export dashboard + hash payload webhook
- Autorisation:
  - double validation (support + finance)
- Interdit auto:
  - interdiction de sélectionner arbitrairement “la dernière tentative de la réservation”
- Anti double paiement:
  - garder l’état inchangé tant que non corrélé
- Journal:
  - consigner « non corrélable » + action manuelle choisie

## Cas 4 — webhook arrivé avant réponse prestataire

- Détection:
  - webhook success reçu pendant tentative `created/unknown` sans identité liée
- Vérifications:
  - présence ultérieure op/request côté dashboard
- Preuves:
  - timeline horodatée (dispatch, webhook, réponse provider)
- Autorisation:
  - support paiement + validation technique
- Interdit auto:
  - ne pas forcer `paid` sans identité vérifiée
- Anti double paiement:
  - conserver blocage `unknown` si ambigu
- Journal:
  - marquer “out-of-order event”

## Cas 5 — tentative `paid` mais réservation `pending`

- Détection:
  - incohérence `payment_attempts.status='paid'` et `reservations.payment_status='pending'`
- Vérifications:
  - identité provider déjà liée + webhook recoupé
- Preuves:
  - snapshot avant/après + IDs provider
- Autorisation:
  - correction auto **uniquement** si identité vérifiée (logique SQL guard)
- Interdit auto:
  - correction si identité absente/contradictoire
- Anti double paiement:
  - interdiction de nouvelle tentative tant qu’incohérence non résolue
- Journal:
  - source de réparation (auto idempotente ou manuelle)

## Cas 6 — opération absente du tableau de bord marchand

- Détection:
  - aucun `operation_id/request_id/order_id` trouvé
- Vérifications:
  - fenêtre temporelle ±15 min, canal, montant, devise
- Preuves:
  - capture recherche vide
- Autorisation:
  - finance décide annulation/reprise paiement
- Interdit auto:
  - ne jamais confirmer paid en absence d’opération prouvée
- Anti double paiement:
  - marquer tentative comme réconciliée terminale (failed/expired) avant relance
- Journal:
  - motif “provider operation missing”

## Cas 7 — notification remboursement non vérifiée

- Détection:
  - webhook type refund sans identité forte
- Vérifications:
  - transaction remboursée visible dashboard + trace comptable
- Preuves:
  - reçu remboursement / extrait opération
- Autorisation:
  - validation finance obligatoire
- Interdit auto:
  - pas de bascule automatique en `refunded`
- Anti double paiement:
  - verrouiller tout remboursement secondaire automatique
- Journal:
  - identité de l’approbateur et justification

---

## Stockage durable proposé (non activé en production)

### Table `payment_event_journal` (append-only)

- `id uuid`
- `received_at timestamptz`
- `source text` (`webhook`, `operator`, `system`)
- `attempt_id uuid null`
- `reservation_id uuid null`
- `order_id text null`
- `provider_operation_id text null`
- `provider_request_id text null`
- `status_raw text null`
- `signature_valid boolean null`
- `payload_redacted jsonb` (sans secret, sans token claim complet)
- `payload_sha256 text`

### Table `payment_reconciliation_decisions`

- `id uuid`
- `event_id uuid`
- `decision text` (`confirm_paid`, `mark_failed`, `mark_expired`, `keep_pending`, `manual_followup`)
- `reason text`
- `actor_id text`
- `approved_by text null`
- `ticket_ref text`
- `evidence_refs jsonb`
- `created_at timestamptz`

### Règles

- append-only pour les événements.
- corrections par événements compensatoires, pas de suppression.

## Journalisation durable avant acquittement HTTP (politique cible)

Objectif: éviter toute perte d’événement webhook et empêcher une confirmation `paid` non auditée.

1. **Persist-before-ack**
   - Tenter d’écrire l’événement reçu dans `payment_event_journal` (append-only) **avant** de
     répondre HTTP 200.
   - Inclure `payload_sha256`, `received_at`, `signature_valid`, identifiants corrélables (si
     présents), source.

2. **Déduplication événement**
   - Calculer une clé de dédup (ex: `provider_operation_id`/`provider_request_id` + `status_raw` +
     `payload_sha256`).
   - Si doublon exact déjà journalisé, traiter en idempotent et ne pas dupliquer les effets métiers.

3. **Erreur de stockage du journal**
   - Si écriture journal indisponible ou ambiguë, **ne pas confirmer le paiement automatiquement**.
   - Répondre avec code non-200 (ou stratégie d’échec sûre) pour forcer retry provider.
   - Ouvrir incident opérationnel + trace locale d’erreur sans secret.

4. **Décisions humaines**
   - Toute correction manuelle doit écrire une entrée `payment_reconciliation_decisions` avec:
     - opérateur,
     - approbateur (si requis),
     - motif,
     - preuves,
     - ticket de suivi,
     - horodatage UTC.

5. **Interdictions automatiques**
   - Pas de transition automatique vers `paid` si identité non vérifiée.
   - Pas de suppression/écrasement d’événements (append-only).
   - Pas d’exposition de secrets dans journaux/erreurs.

- politique de rétention + export hors-ligne des preuves.
