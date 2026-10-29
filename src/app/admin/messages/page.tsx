export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminShell } from '../_components/AdminShell'
import { listConversations } from '@/lib/ghl/client'

const CHANNEL_LABELS: Record<string, string> = {
  TYPE_INSTAGRAM: 'Instagram',
  TYPE_FACEBOOK: 'Facebook',
  TYPE_EMAIL: 'E-mail',
  TYPE_PHONE: 'SMS / Téléphone',
  TYPE_LIVE_CHAT: 'Chat du site',
  TYPE_CUSTOM: 'Autre',
}

function channelLabel(type: string): string {
  return CHANNEL_LABELS[type] ?? type
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string }>
}) {
  const params = await searchParams
  let conversations: Awaited<ReturnType<typeof listConversations>>['conversations'] = []
  let total = 0
  let error = false

  try {
    const result = await listConversations({
      limit: 20,
      startAfterId: params.after,
    })
    conversations = result.conversations
    total = result.total
  } catch {
    error = true
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {error ? '' : `${total} conversation${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800 font-medium">Messages temporairement indisponibles</p>
            <p className="text-sm text-yellow-600 mt-1">
              Le service de messagerie est actuellement inaccessible. Réessayez dans quelques instants.
            </p>
            <Link
              href="/admin/messages"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200"
            >
              Actualiser
            </Link>
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Aucune conversation pour le moment.
          </div>
        ) : (
          <>
            {/* Desktop list */}
            <div className="hidden md:block rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Dernier message</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Canal</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Non lus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {conversations.map((conv) => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/messages/${conv.id}`}
                          className="font-medium text-gray-900 hover:text-amber-700"
                        >
                          {conv.fullName ?? conv.contactName ?? 'Client inconnu'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {conv.lastMessageBody ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {channelLabel(conv.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {timeAgo(conv.lastMessageDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(conv.unreadCount ?? 0) > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                            {conv.unreadCount}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/admin/messages/${conv.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {conv.fullName ?? conv.contactName ?? 'Client inconnu'}
                    </span>
                    <div className="flex items-center gap-2">
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {timeAgo(conv.lastMessageDate)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessageBody ?? '—'}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                    {channelLabel(conv.type)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {conversations.length >= 20 && (
              <div className="flex justify-center pt-2">
                <Link
                  href={`/admin/messages?after=${conversations[conversations.length - 1]?.id}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Charger plus →
                </Link>
              </div>
            )}
          </>
        )}

        <div className="pt-2">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
