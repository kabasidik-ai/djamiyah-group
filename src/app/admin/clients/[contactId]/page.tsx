export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminShell } from '../../_components/AdminShell'
import { getContact, findConversationByContact } from '@/lib/ghl/client'
import { formatDateFR } from '@/lib/adminLabels'
import type { GHLContact, GHLConversation } from '@/lib/ghl/types'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>
}) {
  const { contactId } = await params
  let contact: GHLContact | null = null
  let conversation: GHLConversation | null = null
  let error = false

  try {
    const [c, conv] = await Promise.allSettled([
      getContact(contactId),
      findConversationByContact(contactId),
    ])
    contact = c.status === 'fulfilled' ? c.value : null
    conversation = conv.status === 'fulfilled' ? conv.value : null
  } catch {
    error = true
  }

  if (error || !contact) {
    return (
      <AdminShell>
        <div className="space-y-4">
          <Link href="/admin/clients" className="text-sm text-gray-500 hover:text-gray-700">
            ← Clients
          </Link>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800 font-medium">Client temporairement indisponible</p>
            <p className="text-sm text-yellow-600 mt-1">
              Impossible de charger cette fiche. Réessayez dans quelques instants.
            </p>
            <Link
              href={`/admin/clients/${contactId}`}
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200"
            >
              Actualiser
            </Link>
          </div>
        </div>
      </AdminShell>
    )
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Sans nom'

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/clients" className="text-sm text-gray-500 hover:text-gray-700">
            ← Clients
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
        </div>

        {/* Coordonnées */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Coordonnées
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Nom</dt>
              <dd className="font-medium text-gray-900">{fullName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Téléphone</dt>
              <dd className="text-gray-900">{contact.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">E-mail</dt>
              <dd className="text-gray-900">{contact.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Source</dt>
              <dd className="text-gray-900">{contact.source ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Créé le</dt>
              <dd className="text-gray-900">
                {contact.createdAt ? formatDateFR(contact.createdAt) : '—'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Conversation récente */}
        {conversation && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Dernière conversation
            </h2>
            <p className="text-sm text-gray-700 mb-2">
              {conversation.lastMessageBody ?? 'Aucun message récent'}
            </p>
            <Link
              href={`/admin/messages/${conversation.id}`}
              className="text-sm text-amber-700 hover:text-amber-900 font-medium"
            >
              Voir la conversation →
            </Link>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
