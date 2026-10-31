# P2 — Préparation d’intégration locale (staging prep)

Base technique: `cba25fe` sur `feat/p2-staging-prep-local`.

## 1) Cartographie actuelle (sans modification des routes actives)

### Routes actives (P1)

- `POST /api/payment/chapchap` → `initiateChapChapPayment` (P1)
- `POST /api/payment/webhook` → mise à jour directe de `reservations` / `conference_reservations`

### Moteur P2 prêt mais non câblé

- `src/lib/paymentAttempts.ts`
- `src/lib/paymentAttemptWebhook.ts`
- `src/lib/supabaseAttemptStore.ts`
- migrations additives `20261030` à `20261104`

### Contrat front actuel à préserver

- Réponse création paiement: `{ success, order_id, payment_url }`
- Erreurs route paiement: `400/403/404/429/500/502/504` avec `{ message }`
- Jeton possession réservation: `X-Reservation-Claim` (obligatoire)
- Page succès lit `reservation_id` (query param) et interroge API status avec claim token

## 2) Parcours cible P2 (proposé, non branché)

```text
Client (claim token)
  -> POST /api/payment/chapchap
      -> checkReservationClaim
      -> initiatePaymentWithAttempt()
           1) fetch réservation + éligibilité
           2) insert tentative (barrière unique active)
           3) beginProviderDispatch atomique
           4) appel provider /ecommerce/create (hors transaction SQL)
           5) settle: awaiting_pay | failed | unknown
      -> réponse HTTP compatible front

ChapChap webhook signé HMAC
  -> POST /api/payment/webhook
      -> verifyChapchapHmac
      -> map status + target
      -> applyAttemptEvent() [P2]
           - corrélation stricte attempt/order + identité provider
           - mismatch => rejet / réconciliation manuelle
           - success vérifié => confirmPaid() atomique
               payment_attempts.status=paid + reservations.payment_status=paid
```

## 3) Compatibilité HTTP/UI à maintenir lors du raccordement

1. **Compatibilité réponse client**
   - conserver `payment_url` pour redirection web existante.
   - conserver `order_id` pour affichage référence sur success page.

2. **Compatibilité statuts UI**
   - `paid/pending/failed/refunded/unknown` restent les états affichables.
   - `unknown` doit rester non destructif et orienté vérification.

3. **Possession réservation**
   - aucune suppression de la garde `X-Reservation-Claim`.
   - ne jamais accepter un statut via UUID seul.

4. **Idempotence webhook**
   - appliquer les règles P2 de corrélation stricte.
   - rejeter toute confirmation paid non vérifiable.

## 4) Validation locale demandée

- Banc local PostgreSQL/PostgREST: `node scripts/local-tests/run.mjs`
- Tests provider fictif local: `tests/payment/p2StagingPrep.simulation.test.mjs`
- Corrélation OP-A/OP-B + replay: tests P2 webhook/attempts existants + simulation locale
- Type/lint/build: scripts standards npm

## 5) Portée de la simulation (ce qui est validé / non validé)

### Validé au niveau module (local)

- appel provider simulé localement (pas d’appel réseau externe),
- capture des champs provider (`operation_id`, `request_id`),
- vérification HMAC (logique de signature) sur payload webhook simulé,
- corrélation stricte identité provider (`OP-A` / `OP-B`),
- idempotence et anti double-dispatch en concurrence,
- gestion timeout -> `unknown` -> blocage.

### Non validé au niveau routes HTTP actives

- la route active `POST /api/payment/chapchap` reste câblée P1,
- la route active `POST /api/payment/webhook` n’appelle pas encore `applyAttemptEvent` P2,
- la compatibilité en bout-en-bout HTTP P2 (request/response réelles route active) reste à tester
  après PR d’intégration dédiée.
