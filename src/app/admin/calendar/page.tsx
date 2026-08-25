'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

type CalendarEvent = {
  id: string
  calendarId?: string
  title?: string
  status?: string
  startTime?: string
  endTime?: string
  appointmentStatus?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
}

function eventTitle(e: CalendarEvent): string {
  return e.title || [e.firstName, e.lastName].filter(Boolean).join(' ') || 'Rendez-vous'
}

function clientInfo(e: CalendarEvent): string {
  return [e.email, e.phone].filter(Boolean).join(' · ')
}

function formatEventDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeShort(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusFilter(e: CalendarEvent): boolean {
  const s = (e.appointmentStatus ?? e.status ?? '').toLowerCase()
  if (!s) return true
  return !['cancelled', 'canceled', 'no-show', 'noshow'].includes(s)
}

function StatusBadge({ status, className = '' }: { status?: string; className?: string }) {
  const s = (status ?? '').toLowerCase()
  if (!s) return <span className={`text-gray-400 text-xs ${className}`}>—</span>
  const map: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-100 text-amber-800',
    available: 'bg-gray-100 text-gray-700',
  }
  const cls = map[s] ?? 'bg-gray-100 text-gray-700'
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}
    >
      {status}
    </span>
  )
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/ghl/calendar/events')
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? 'Impossible de charger l’agenda.')
        }
        const data = await res.json()
        if (active) setEvents(data.events ?? [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const visible = events
    .filter(statusFilter)
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))

  if (loading) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Chargement de l’agenda…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-yellow-800 font-medium">Agenda temporairement indisponible</p>
          <p className="text-sm text-yellow-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200"
          >
            Actualiser
          </button>
        </div>
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Aucun rendez-vous dans l’agenda pour le moment.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Heure</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((e) => {
              const info = clientInfo(e)
              return (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {formatEventDate(e.startTime)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatTimeShort(e.startTime)}
                    {e.endTime ? ` – ${formatTimeShort(e.endTime)}` : ''}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{eventTitle(e)}</td>
                  <td className="px-4 py-3 text-gray-500">{info || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.appointmentStatus ?? e.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {visible.map((e) => (
          <div
            key={e.id}
            className="rounded-lg border border-gray-200 bg-white p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm">{eventTitle(e)}</div>
              <div className="text-sm text-gray-600 mt-1">{formatTime(e.startTime)}</div>
              {clientInfo(e) && (
                <div className="text-xs text-gray-500 mt-1 break-words">{clientInfo(e)}</div>
              )}
            </div>
            <StatusBadge status={e.appointmentStatus ?? e.status} className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <CalendarDays className="text-amber-600" size={28} aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <p className="text-sm text-gray-500 mt-1">Rendez-vous et événements du calendrier</p>
      </div>
    </div>
  )
}
