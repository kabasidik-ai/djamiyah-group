# Contrat ChapChap — classification (source: guide public)

Source analysée: `https://www.chapchappay.com/guide/` (page marketing/guide, pas la référence API
détaillée authentifiée).

## A) Confirmé par documentation publique

1. Base API

- Extrait: `URL de base https://chapchappay.com/api`
- Statut: **Confirmé**

2. Clé API en en-tête

- Extrait: `CCP-Api-Key: ...`
- Statut: **Confirmé**

3. Webhook callback URL

- Extrait: `... via le paramètre callback_url de l'API`
- Statut: **Confirmé** (terme documenté: `callback_url`)

4. Retry policy & délai

- Extraits:
  - `Votre endpoint doit répondre HTTP 200 dans les 20 secondes.`
  - `E-Commerce et Paiement QR : ... retry automatique (jusqu'à 5 tentatives, délai 5 à 60 secondes).`
  - `Les réponses 4xx/5xx ne sont pas retentées automatiquement.`
- Statut: **Confirmé**

5. Idempotence opération

- Extrait: `Identifiez toujours l'opération via operation_id ou request_id`
- Statut: **Confirmé**

6. Statuts webhook documentés

- Extrait: `success, failed, canceled, expired, error`
- Statut: **Confirmé**

## B) À confirmer auprès du marchand / ChapChap

1. Endpoint `/ecommerce/create`

- Observé dans le code local P1/P2 (usage historique), mais non explicitement listé dans la page
  guide extraite.
- Statut: **À confirmer**

2. Endpoint `/ecommerce/operation`

- Non visible dans la page guide extraite.
- Statut: **À confirmer**

3. Mapping `notify_url` vs `callback_url`

- Le code local envoie `notify_url` à la création, la page guide mentionne `callback_url`.
- Statut: **À confirmer** (synonymes acceptés ? priorité ?)

4. Champs webhook échoés au complet

- `order_id`, `amount`, `currency`, `metadata`, forme exacte de `operation_id/request_id`.
- La page guide ne donne pas le schéma payload exhaustif.
- Statut: **À confirmer**

5. En-tête exact de signature webhook

- Le guide mentionne HMAC mais pas le nom d’en-tête explicite dans le contenu visible extrait.
- Statut: **À confirmer**

### Paramètres / champs / en-têtes non confirmés explicitement

- **Paramètres API non confirmés par la page guide analysée**:
  - `notify_url` (terme utilisé dans le code local, non explicitement visible dans la page guide)
  - `/ecommerce/create` et `/ecommerce/operation` (noms d’endpoint non explicitement listés dans la
    page guide)

- **Champs webhook non confirmés exhaustivement**:
  - présence garantie de `order_id`, `amount`, `currency`, `metadata` dans chaque notification
  - structure exacte des objets imbriqués (racine vs `data` vs `metadata`)

- **En-têtes signature webhook non confirmés explicitement**:
  - nom exact de l’en-tête HMAC (la page guide mentionne HMAC mais pas le header précis dans le
    contenu public extrait)
  - format exact du digest (`sha256=<hex>` vs `<hex>`)

## C) Incompatible démontré

- **Aucune incompatibilité démontrée de façon certaine** depuis la seule page guide publique
  extraite.
- Il existe toutefois un **écart terminologique** potentiel:
  - implémentation locale: `notify_url`
  - guide public: `callback_url`
  - classification: écart à confirmer (pas encore incompatible prouvé).

## D) Décisions de sécurité conservatoires (local)

En absence de contrat payload exhaustif:

- pas de confirmation `paid` sur base `reservationId` seul,
- corrélation stricte `attempt_id/order_id` + identité provider (`operation_id/request_id`) quand
  liée,
- événements non vérifiables -> `manual_reconciliation_required`.
