'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'unknown'

type ReservationInfo = {
  paymentStatus: PaymentStatus
  roomType?: string
  roomName?: string
  totalPrice?: number
  currency?: string
  reservationType?: 'room' | 'conference'
}

const statusConfig: Record<
  PaymentStatus,
  { icon: string; title: string; message: string; color: string; bgColor: string; iconBg: string }
> = {
  paid: {
    icon: '✓',
    title: 'Paiement confirmé',
    message:
      'Votre paiement a été reçu avec succès. Notre équipe vous contactera pour confirmer les détails.',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
  },
  pending: {
    icon: '⏳',
    title: 'Paiement en cours de confirmation',
    message:
      'Votre paiement est en cours de traitement. Vous recevrez une confirmation dès que le paiement sera validé. Cette page peut être rechargée ultérieurement.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
  },
  failed: {
    icon: '✗',
    title: "Le paiement n'a pas abouti",
    message:
      'Votre réservation est toujours en attente. Vous pouvez réessayer le paiement depuis la page de réservation.',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
  },
  refunded: {
    icon: '↩',
    title: 'Paiement remboursé',
    message: 'Le montant de votre réservation a été remboursé. Contactez-nous pour toute question.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
  },
  unknown: {
    icon: '?',
    title: 'Statut en cours de vérification',
    message:
      'Nous vérifions le statut de votre paiement. Veuillez patienter ou recharger cette page dans quelques instants.',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100',
  },
}

export default function ReservationSuccessPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>('unknown')
  const [info, setInfo] = useState<ReservationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const orderId = searchParams?.get('order_id') || searchParams?.get('operation_id')
  const reservationId = searchParams?.get('reservation_id')
  const reservationType = searchParams?.get('reservation_type') // 'conference' or null (room)

  useEffect(() => {
    if (!reservationId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function checkStatus() {
      try {
        // Sélectionner le bon endpoint selon le type
        const endpoint =
          reservationType === 'conference'
            ? `/api/conference-reservations/status?id=${encodeURIComponent(reservationId!)}`
            : `/api/reservations/status?id=${encodeURIComponent(reservationId!)}`

        const response = await fetch(endpoint)

        if (!response.ok) {
          if (!cancelled) {
            setStatus('unknown')
            setIsLoading(false)
          }
          return
        }

        const data = await response.json()
        if (cancelled) return

        const paymentStatus: PaymentStatus =
          data.paymentStatus === 'paid' ||
          data.paymentStatus === 'pending' ||
          data.paymentStatus === 'failed' ||
          data.paymentStatus === 'refunded'
            ? data.paymentStatus
            : 'unknown'

        setStatus(paymentStatus)
        setInfo({
          paymentStatus,
          roomType: data.roomType,
          roomName: data.roomName,
          totalPrice: data.totalPrice,
          currency: data.currency,
          reservationType:
            data.reservationType || (reservationType === 'conference' ? 'conference' : 'room'),
        })
      } catch {
        if (!cancelled) setStatus('unknown')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    checkStatus()
    return () => {
      cancelled = true
    }
  }, [reservationId, reservationType])

  const config = statusConfig[status]
  const isConference = info?.reservationType === 'conference' || reservationType === 'conference'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {isLoading ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 animate-pulse" />
            <p className="text-gray-500">Vérification du statut de paiement…</p>
          </>
        ) : (
          <>
            {/* Icône statut */}
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${config.iconBg}`}
            >
              {status === 'paid' ? (
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className={`text-3xl ${config.color}`}>{config.icon}</span>
              )}
            </div>

            <h1 className={`text-2xl font-bold mb-2 ${config.color}`}>{config.title}</h1>

            {/* Badge type de réservation */}
            {isConference && (
              <span className="inline-block mb-3 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Salle de conférence
              </span>
            )}

            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{config.message}</p>

            {/* Nom de salle si conférence */}
            {info?.roomName && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Salle
                </p>
                <p className="text-sm font-semibold text-gray-800">{info.roomName}</p>
              </div>
            )}

            {/* Référence de paiement */}
            {orderId && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4 text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Référence de paiement
                </p>
                <p className="text-sm font-mono text-gray-800 break-all">{orderId}</p>
              </div>
            )}

            {/* Montant si disponible */}
            {info?.totalPrice && info.totalPrice > 0 && (
              <div className={`rounded-lg px-4 py-3 mb-6 border ${config.bgColor}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Montant de la réservation
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {info.totalPrice.toLocaleString('fr-FR')} {info.currency || 'GNF'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {status === 'failed' && (
                <Link
                  href="/reservation"
                  className="block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 transition-colors"
                >
                  Réessayer le paiement
                </Link>
              )}
              <Link
                href="/"
                className={`block w-full rounded-xl ${
                  status === 'failed'
                    ? 'border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium'
                    : 'bg-amber-600 hover:bg-amber-700 text-white font-semibold'
                } py-3 px-6 transition-colors`}
              >
                Retour à l&apos;accueil
              </Link>
              <Link
                href="/contact"
                className="block w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400">Hôtel Maison Blanche — Groupe Djamiyah</p>
    </main>
  )
}
