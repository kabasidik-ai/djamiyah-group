export type WebhookJournalPersistInput = {
  source: 'chapchap_webhook'
  receivedAtIso: string
  signatureValid: boolean
  payloadRedacted: Record<string, unknown>
  payloadSha256: string
  dedupKey: string
  reservationId?: string | null
  attemptId?: string | null
  orderId?: string | null
  providerOperationId?: string | null
  providerRequestId?: string | null
  statusRaw?: string | null
}

export type PersistOutcome = {
  eventId: string
  inserted: boolean
}

type RpcClient = {
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>
}

function asRpcClient(client: unknown): RpcClient {
  return client as RpcClient
}

export function createPaymentEventJournalStore(client: unknown) {
  const rpcClient = asRpcClient(client)

  return {
    async persistWebhookEvent(input: WebhookJournalPersistInput): Promise<PersistOutcome> {
      const { data, error } = await rpcClient.rpc('persist_payment_webhook_event', {
        p_source: input.source,
        p_received_at: input.receivedAtIso,
        p_signature_valid: input.signatureValid,
        p_payload_redacted: input.payloadRedacted,
        p_payload_sha256: input.payloadSha256,
        p_dedup_key: input.dedupKey,
        p_reservation_id: input.reservationId ?? null,
        p_attempt_id: input.attemptId ?? null,
        p_order_id: input.orderId ?? null,
        p_provider_operation_id: input.providerOperationId ?? null,
        p_provider_request_id: input.providerRequestId ?? null,
        p_status_raw: input.statusRaw ?? null,
      })

      if (error) throw error

      const row = Array.isArray(data) ? data[0] : data
      if (!row || typeof row !== 'object') {
        throw new Error('persist_payment_webhook_event returned invalid payload')
      }

      const eventId = String((row as Record<string, unknown>).event_id ?? '')
      const inserted = Boolean((row as Record<string, unknown>).was_inserted)

      if (!eventId) {
        throw new Error('persist_payment_webhook_event returned empty event_id')
      }

      return { eventId, inserted }
    },

    async markProcessing(
      eventId: string,
      status:
        | 'received'
        | 'processed'
        | 'ignored'
        | 'reconciliation_required'
        | 'rejected'
        | 'storage_failed',
      options?: { lastError?: string | null; reconciliationRequired?: boolean }
    ): Promise<void> {
      const { error } = await rpcClient.rpc('mark_payment_event_processing', {
        p_event_id: eventId,
        p_processing_status: status,
        p_last_error: options?.lastError ?? null,
        p_reconciliation_required: options?.reconciliationRequired ?? null,
      })

      if (error) throw error
    },
  }
}
