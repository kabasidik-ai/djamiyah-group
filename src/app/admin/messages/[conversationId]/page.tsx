export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminShell } from '../../_components/AdminShell'
import { getMessages } from '@/lib/ghl/client'
import { MessageReplyForm } from './MessageReplyForm'

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  let messages: Awaited<ReturnType<typeof getMessages>> = []
  let error = false

  try {
    messages = await getMessages(conversationId, 30)
  } catch {
    error = true
  }

  // Reverse for chronological order (oldest first)
  const sortedMessages = [...messages].reverse()

  return (
    <AdminShell>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/messages"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Messages
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Conversation</h1>
        </div>

        {error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800 font-medium">Messages temporairement indisponibles</p>
            <p className="text-sm text-yellow-600 mt-1">
              Impossible de charger cette conversation. Réessayez dans quelques instants.
            </p>
            <Link
              href={`/admin/messages/${conversationId}`}
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200"
            >
              Actualiser
            </Link>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Aucun message dans cette conversation.
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
              {sortedMessages.map((msg) => {
                const isOutbound = msg.direction === 'outbound'
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                        isOutbound
                          ? 'bg-amber-50 border border-amber-200 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-gray-400">
                          {isOutbound ? 'Vous' : 'Client'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(msg.dateAdded)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!error && (
          <MessageReplyForm conversationId={conversationId} />
        )}
      </div>
    </AdminShell>
  )
}
