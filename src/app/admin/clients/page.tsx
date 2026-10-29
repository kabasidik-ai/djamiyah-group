export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { AdminShell } from '../_components/AdminShell'
import { searchContacts } from '@/lib/ghl/client'
import { formatDateFR } from '@/lib/adminLabels'

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; after?: string }>
}) {
  const params = await searchParams
  let contacts: Awaited<ReturnType<typeof searchContacts>>['contacts'] = []
  let total = 0
  let error = false

  try {
    const result = await searchContacts({
      query: params.q,
      limit: 20,
      startAfterId: params.after,
    })
    contacts = result.contacts
    total = result.total
  } catch {
    error = true
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {error ? '' : `${total} client${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Search */}
        <form method="GET" action="/admin/clients" className="flex gap-2 max-w-md">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Rechercher par nom, email ou téléphone…"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Rechercher
          </button>
        </form>

        {error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-yellow-800 font-medium">Clients temporairement indisponibles</p>
            <p className="text-sm text-yellow-600 mt-1">
              Le service est actuellement inaccessible. Réessayez dans quelques instants.
            </p>
            <Link
              href="/admin/clients"
              className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200"
            >
              Actualiser
            </Link>
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            {params.q ? `Aucun client trouvé pour « ${params.q} »` : 'Aucun client pour le moment.'}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-gray-200 bg-white overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Téléphone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Tags</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="font-medium text-gray-900 hover:text-amber-700"
                        >
                          {[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{c.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        {c.tags && c.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                            {c.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{c.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.source ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {c.createdAt ? formatDateFR(c.createdAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-amber-300 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom'}
                  </div>
                  {c.phone && <div className="text-sm text-gray-600 mt-1">{c.phone}</div>}
                  {c.email && <div className="text-sm text-gray-500">{c.email}</div>}
                  {c.tags && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {contacts.length >= 20 && (
              <div className="flex justify-center pt-2">
                <Link
                  href={`/admin/clients?after=${contacts[contacts.length - 1]?.id}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}`}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Charger plus →
                </Link>
              </div>
            )}
          </>
        )}

        <div className="pt-2">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    </AdminShell>
  )
}
