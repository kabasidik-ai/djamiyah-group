/**
 * P1 — Contrat ChapChapPay documenté à partir du guide officiel.
 *
 * Sources :
 *  - Guide officiel : https://www.chapchappay.com/guide/ (consultation 31/10/2026)
 *  - Référence API : derrière connexion — payloads exacts À CONFIRMER sur compte marchand.
 *
 * Faits confirmés par le guide (use-case E-Commerce) :
 *  - Authentification : en-tête `CCP-Api-Key: <hex 64>` (clés Test / Production distinctes).
 *  - URL de base : https://chapchappay.com/api
 *  - Le champ de callback webhook s'appelle `callback_url` (et non `notify_url`).
 *  - Le webhook reçoit un POST signé (HMAC-SHA256 à vérifier) ; identifier chaque
 *    opération via `operation_id` OU `request_id` — traiter de façon idempotente.
 *  - Statuts vus dans le guide : success / failed / canceled / expired / error.
 *  - Politique de livraison :
 *      * L'endpoint doit répondre HTTP 200 sous 20 secondes.
 *      * Les réponses 4xx/5xx NE déclenchent PAS de retry automatique.
 *      * Erreurs réseau / timeouts : retry auto E-Commerce/QR (jusqu'à 5, 5-60 s).
 *      * Bouton manuel « Renvoyer le webhook » dans le tableau de bord (tous).
 *
 * Inconnues à confirmer auprès du prestataire (référence API / compte marchand) :
 *  - Le contrat historique `ecommerce/create` fonctionne-t-il encore en TEST ?
 *  - Champs de réponse du create (payment_url ? operation_id ? request_id ?).
 *  - Nom exact de l'en-tête HMAC du webhook et l'algorithme/secret exacts.
 *  - Écho ou non de `order_id` / `amount` / `currency` / `metadata` dans le payload.
 */
export const CHAPCHAP_BASE_URL_DEFAULT = 'https://chapchappay.com/api'

/**
 * Contrat actuel documenté. Le contrat historique est testé exclusivement en Preview.
 */
export const CHAPCHAP_ECOMMERCE_PATH = 'ecommerce/operation'

/** Champ du corps de la requête create portant l'URL de callback (guide officiel). */
export const CHAPCHAP_CALLBACK_FIELD = 'callback_url'

/** Champ historique du mode TEST Preview. */
export const CHAPCHAP_LEGACY_NOTIFY_FIELD = 'notify_url'

/** Contrat historique réservé aux déploiements Preview avec clé TEST. */
export function resolveChapchapContract(environment: 'production' | 'preview' | 'development') {
  return environment === 'preview'
    ? { path: 'ecommerce/create', callbackField: CHAPCHAP_LEGACY_NOTIFY_FIELD }
    : { path: CHAPCHAP_ECOMMERCE_PATH, callbackField: CHAPCHAP_CALLBACK_FIELD }
}

/** Allow est non fiable : ne conserver que les méthodes HTTP connues. */
export function safeAllowHeader(value: string | null): string | null {
  if (!value) return null
  const allowed = new Set([
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'TRACE',
    'CONNECT',
  ])
  const methods = value.split(',').map((method) => method.trim().toUpperCase())
  return methods.length > 0 && methods.every((method) => allowed.has(method))
    ? methods.join(', ')
    : null
}

/** Le guide impose une réponse HTTP 200 sous 20 s (notre fetch en exige 30 s max). */
export const CHAPCHAP_WEBHOOK_RESPONSE_TIMEOUT_MS = 20_000

/** Statuts documentés publiquement par ChapChapPay. */
export const CHAPCHAP_DOCUMENTED_STATUSES = [
  'success',
  'failed',
  'canceled',
  'expired',
  'error',
] as const

/** Champs permettant d'identifier l'opération (guide : operation_id OU request_id). */
export const CHAPCHAP_OPERATION_ID_FIELDS = ['operation_id', 'operationId'] as const
export const CHAPCHAP_REQUEST_ID_FIELDS = ['request_id', 'requestId'] as const
export const CHAPCHAP_ORDER_ID_FIELDS = ['order_id', 'orderId'] as const
export const CHAPCHAP_PAYMENT_REFERENCE_FIELDS = ['payment_reference', 'paymentReference'] as const
export const CHAPCHAP_TRANSACTION_ID_FIELDS = ['transaction_id', 'transactionId'] as const

/**
 * Journalisation sécurisée d'une URL de redirection : STATUT + DOMAINE + CHEMIN
 * uniquement. Les paramètres d'URL (query), fragments, jetons ou secrets sont
 * TOUJOURS retirés — jamais journalisés.
 * `fallbackOrigin` permet de résoudre une Location relative (ex. "/login").
 */
export function sanitizeProviderUrl(
  value: string | null | undefined,
  fallbackOrigin: string
): string | null {
  if (!value) return null
  try {
    const url = new URL(value, fallbackOrigin)
    return `${url.hostname}${url.pathname}`
  } catch {
    return null
  }
}
