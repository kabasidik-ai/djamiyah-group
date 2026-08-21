'use client'

import { useEffect, useMemo, useState } from 'react'

type ConferenceRoom = {
  id: string
  name: string
  capacity: number
  pricePerDay: number
  isAvailable: boolean
}

type AvailabilityReason =
  | 'available'
  | 'past_date'
  | 'room_unavailable'
  | 'capacity_exceeded'
  | 'already_booked'

type AvailabilityResponse = {
  available: boolean
  reason: AvailabilityReason
  room: ConferenceRoom
  totalPrice: number
  message?: string
}

type FormState = {
  conferenceRoomId: string
  eventDate: string
  participants: string
  eventType: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests: string
}

type ConfirmedReservation = {
  id: string
  status: string
  paymentStatus: string
  totalPrice: number
  currency: string
  roomName: string
  eventDate: string
  participants: number
  customerName: string
  customerEmail: string
}

const initialForm: FormState = {
  conferenceRoomId: '',
  eventDate: '',
  participants: '1',
  eventType: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialRequests: '',
}

const eventTypes = [
  { value: 'seminar', label: "Séminaire d'entreprise" },
  { value: 'conference', label: 'Conférence professionnelle' },
  { value: 'training', label: 'Formation / atelier' },
  { value: 'meeting', label: "Réunion d'affaires" },
  { value: 'other', label: 'Autre événement professionnel' },
]

const availabilityMessages: Record<AvailabilityReason, string> = {
  available: 'Cette salle est disponible à la date sélectionnée.',
  past_date: "La date de l'événement doit être aujourd'hui ou dans le futur.",
  room_unavailable: "Cette salle n'est pas ouverte à la réservation.",
  capacity_exceeded: 'Le nombre de participants dépasse la capacité de cette salle.',
  already_booked: 'Cette salle est déjà réservée à cette date.',
}

type Step = 'form' | 'confirmed'

export default function ConferenceReservationForm() {
  const [rooms, setRooms] = useState<ConferenceRoom[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [step, setStep] = useState<Step>('form')
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [confirmed, setConfirmed] = useState<ConfirmedReservation | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.conferenceRoomId),
    [rooms, form.conferenceRoomId]
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadRooms() {
      try {
        const response = await fetch('/api/conference-rooms', { signal: controller.signal })
        const result = await response.json()

        if (!response.ok) throw new Error(result?.message || 'Impossible de charger les salles.')
        setRooms(result.rooms ?? [])
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Impossible de charger les salles.',
        })
      } finally {
        setIsLoadingRooms(false)
      }
    }

    loadRooms()
    return () => controller.abort()
  }, [])

  const updateField = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
    setAvailability(null)
    setMessage(null)
  }

  const checkAvailability = async (): Promise<boolean> => {
    if (!form.conferenceRoomId || !form.eventDate || !form.participants) {
      setMessage({ type: 'error', text: 'Sélectionnez une salle, une date et les participants.' })
      return false
    }

    setIsChecking(true)
    setMessage(null)

    try {
      const response = await fetch('/api/conference-reservations/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceRoomId: form.conferenceRoomId,
          eventDate: form.eventDate,
          participants: Number(form.participants),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        setAvailability(null)
        setMessage({ type: 'error', text: result?.message || 'Disponibilité non vérifiable.' })
        return false
      }

      setAvailability(result)
      if (!result.available) {
        setMessage({
          type: 'error',
          text: availabilityMessages[result.reason as AvailabilityReason] || 'Salle indisponible.',
        })
        return false
      }

      setMessage({ type: 'success', text: availabilityMessages.available })
      return true
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau pendant la vérification.' })
      return false
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    // Snapshot before any reset
    const snapshot = { ...form }

    try {
      const isAvailable = await checkAvailability()
      if (!isAvailable) return

      const response = await fetch('/api/conference-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceRoomId: snapshot.conferenceRoomId,
          eventDate: snapshot.eventDate,
          participants: Number(snapshot.participants),
          eventType: snapshot.eventType,
          firstName: snapshot.firstName,
          lastName: snapshot.lastName,
          email: snapshot.email,
          phone: snapshot.phone,
          specialRequests: snapshot.specialRequests,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        setAvailability(null)
        setMessage({
          type: 'error',
          text: result?.message || "Impossible d'enregistrer votre demande.",
        })
        return
      }

      // Stocker la réservation confirmée
      const room = rooms.find((r) => r.id === snapshot.conferenceRoomId)
      setConfirmed({
        id: result.reservationId,
        status: result.status ?? 'awaiting_confirmation',
        paymentStatus: result.paymentStatus ?? 'pending',
        totalPrice: result.totalPrice,
        currency: result.currency ?? 'GNF',
        roomName: room?.name ?? 'Salle de conférence',
        eventDate: snapshot.eventDate,
        participants: Number(snapshot.participants),
        customerName: `${snapshot.firstName} ${snapshot.lastName}`.trim(),
        customerEmail: snapshot.email,
      })
      setStep('confirmed')
      setMessage({
        type: 'success',
        text: result?.message || 'Votre réservation a bien été enregistrée.',
      })
      setForm(initialForm)
      setAvailability(null)
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau. Veuillez réessayer.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayment = async () => {
    if (!confirmed) return

    setIsPaying(true)
    setMessage(null)

    try {
      const response = await fetch('/api/conference-reservations/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conferenceReservationId: confirmed.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: result?.message || 'Impossible de démarrer le paiement.',
        })
        return
      }

      const redirectUrl =
        result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl

      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        setMessage({ type: 'error', text: 'URL de redirection de paiement introuvable.' })
      }
    } catch {
      setMessage({ type: 'error', text: "Impossible d'initialiser le paiement pour le moment." })
    } finally {
      setIsPaying(false)
    }
  }

  const handleNewReservation = () => {
    setStep('form')
    setConfirmed(null)
    setMessage(null)
  }

  const minimumDate = new Date().toISOString().slice(0, 10)
  const fieldClass =
    'w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100'

  // ── ÉCRAN DE CONFIRMATION + PAIEMENT ──
  if (step === 'confirmed' && confirmed) {
    const statusLabel =
      confirmed.status === 'awaiting_confirmation'
        ? 'En attente de confirmation'
        : confirmed.status === 'confirmed'
          ? 'Confirmée'
          : confirmed.status

    const paymentStatusLabel =
      confirmed.paymentStatus === 'paid'
        ? 'Paiement confirmé'
        : confirmed.paymentStatus === 'pending'
          ? 'En attente'
          : confirmed.paymentStatus === 'failed'
            ? "Le paiement n'a pas abouti"
            : confirmed.paymentStatus === 'refunded'
              ? 'Remboursé'
              : confirmed.paymentStatus

    const isPaid = confirmed.paymentStatus === 'paid'
    const isFailed = confirmed.paymentStatus === 'failed'

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
          {/* Icône + titre */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-green-100">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Réservation enregistrée
            </h2>
            {message && (
              <p
                className={`text-sm rounded-lg px-4 py-3 border ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>

          {/* Détails */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-lg px-5 py-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                N° de réservation
              </p>
              <p className="text-lg font-bold text-gray-900 font-mono">
                CONF-{confirmed.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salle</p>
                <p className="font-semibold text-gray-900">{confirmed.roomName}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Statut</p>
                <p className="font-semibold text-amber-700">{statusLabel}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
                <p className="font-semibold text-gray-900">{confirmed.eventDate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Participants</p>
                <p className="font-semibold text-gray-900">{confirmed.participants}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-5 py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paiement</p>
                <p
                  className={`font-semibold ${
                    isPaid ? 'text-green-700' : isFailed ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {paymentStatusLabel}
                </p>
              </div>
            </div>

            {/* Montant */}
            <div className="bg-gradient-to-r from-primary to-amber-500 rounded-lg px-5 py-4 text-white text-center">
              <p className="text-sm text-white/80 mb-1">Montant de la réservation</p>
              <p className="text-2xl font-bold">
                {confirmed.totalPrice.toLocaleString('fr-FR')} {confirmed.currency}
              </p>
            </div>
          </div>

          {/* Section paiement en ligne */}
          {!isPaid && confirmed.paymentStatus !== 'refunded' && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Paiement en ligne</h3>
              <p className="text-sm text-gray-600 mb-5">
                Vous serez redirigé vers notre plateforme de paiement sécurisée pour choisir votre
                moyen de paiement.
              </p>

              <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="w-5 h-5 text-green-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Paiement sécurisé</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Orange Money, carte bancaire et autres moyens disponibles selon ChapChap.
                </p>
              </div>

              {isFailed && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                  Le paiement n&apos;a pas abouti. Vous pouvez réessayer.
                </p>
              )}

              <button
                type="button"
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full rounded-xl bg-primary px-5 py-4 text-white font-semibold text-base transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying
                  ? 'Redirection vers le paiement…'
                  : isFailed
                    ? 'Réessayer le paiement'
                    : 'Procéder au paiement sécurisé'}
              </button>
            </div>
          )}

          {/* Paiement confirmé */}
          {isPaid && (
            <div className="border-t pt-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-semibold">Paiement confirmé</span>
              </div>
            </div>
          )}

          {/* Paiement remboursé */}
          {confirmed.paymentStatus === 'refunded' && (
            <div className="border-t pt-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                  />
                </svg>
                <span className="text-lg font-semibold">Paiement remboursé</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-sm">
              Vous recevrez une confirmation par email sous 24 heures.
            </p>
            <button
              onClick={handleNewReservation}
              className="bg-[#0D3B3E] hover:bg-[#0D3B3E]/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Faire une nouvelle réservation
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── FORMULAIRE ──
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-white p-5 shadow-lg sm:p-8">
          <h2 className="mb-2 text-2xl font-serif font-bold text-gray-900 sm:text-3xl">
            Réserver une salle de conférence
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-gray-600 sm:text-base">
            Sélectionnez votre espace, vérifiez sa disponibilité puis envoyez votre demande.
          </p>

          {message && (
            <div
              role="status"
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="mb-5 border-b pb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                Salle et date
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Salle *
                  <select
                    required
                    disabled={isLoadingRooms}
                    value={form.conferenceRoomId}
                    onChange={(event) => updateField('conferenceRoomId', event.target.value)}
                    className={`${fieldClass} mt-2`}
                  >
                    <option value="">
                      {isLoadingRooms ? 'Chargement des salles...' : 'Sélectionner une salle'}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id} disabled={!room.isAvailable}>
                        {room.name} — {room.capacity} places —{' '}
                        {room.pricePerDay.toLocaleString('fr-FR')} GNF/jour
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Date de l&apos;événement *
                  <input
                    required
                    type="date"
                    min={minimumDate}
                    value={form.eventDate}
                    onChange={(event) => updateField('eventDate', event.target.value)}
                    className={`${fieldClass} mt-2`}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Nombre de participants *
                  <input
                    required
                    type="number"
                    min="1"
                    max={selectedRoom?.capacity}
                    value={form.participants}
                    onChange={(event) => updateField('participants', event.target.value)}
                    className={`${fieldClass} mt-2`}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Type d&apos;événement *
                  <select
                    required
                    value={form.eventType}
                    onChange={(event) => updateField('eventType', event.target.value)}
                    className={`${fieldClass} mt-2`}
                  >
                    <option value="">Sélectionner un type</option>
                    {eventTypes.map((eventType) => (
                      <option key={eventType.value} value={eventType.value}>
                        {eventType.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={checkAvailability}
                disabled={isChecking || isSubmitting}
                className="mt-5 w-full rounded-lg border-2 border-primary px-5 py-3 font-semibold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isChecking ? 'Vérification...' : 'Vérifier la disponibilité'}
              </button>
            </section>

            <section>
              <h3 className="mb-5 border-b pb-2 text-lg font-semibold text-gray-900 sm:text-xl">
                Coordonnées
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  ['firstName', 'Prénom', 'text'],
                  ['lastName', 'Nom', 'text'],
                  ['email', 'Adresse email', 'email'],
                  ['phone', 'Téléphone', 'tel'],
                ].map(([name, label, type]) => (
                  <label key={name} className="block text-sm font-medium text-gray-700">
                    {label} *
                    <input
                      required
                      type={type}
                      value={form[name as keyof FormState]}
                      onChange={(event) => updateField(name as keyof FormState, event.target.value)}
                      className={`${fieldClass} mt-2`}
                    />
                  </label>
                ))}
              </div>

              <label className="mt-5 block text-sm font-medium text-gray-700">
                Demandes particulières
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={form.specialRequests}
                  onChange={(event) => updateField('specialRequests', event.target.value)}
                  className={`${fieldClass} mt-2`}
                  placeholder="Configuration de salle, équipement ou besoins spécifiques..."
                />
              </label>
            </section>

            <button
              type="submit"
              disabled={isSubmitting || isChecking || !selectedRoom}
              className="w-full rounded-lg bg-[#0D3B3E] px-6 py-4 font-semibold text-white transition hover:bg-[#0D3B3E]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? 'Envoi de la demande...' : 'Envoyer la demande de réservation'}
            </button>
            <p className="text-center text-xs text-gray-500 sm:text-sm">
              Votre demande restera en attente jusqu&apos;à la confirmation de notre équipe.
            </p>
          </form>
        </div>
      </div>

      <aside>
        <div className="rounded-2xl bg-gray-50 p-5 sm:p-6 lg:sticky lg:top-6">
          <h3 className="mb-5 text-xl font-serif font-bold text-gray-900 sm:text-2xl">
            Récapitulatif
          </h3>
          {selectedRoom ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-white p-4">
                <p className="text-lg font-semibold text-gray-900">{selectedRoom.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Capacité : {selectedRoom.capacity} personnes
                </p>
                <p className="mt-3 text-lg font-bold text-primary">
                  {selectedRoom.pricePerDay.toLocaleString('fr-FR')} GNF
                  <span className="text-sm font-normal text-gray-500"> / jour</span>
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 text-sm text-gray-700">
                <div className="flex justify-between gap-4">
                  <span>Date</span>
                  <span className="font-medium">{form.eventDate || '—'}</span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span>Participants</span>
                  <span className="font-medium">{form.participants || '—'}</span>
                </div>
              </div>
              {availability?.available && (
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  Disponible pour votre événement.
                </p>
              )}
              <p className="text-xs leading-relaxed text-gray-500">
                Tarif affiché à titre informatif. Le montant officiel est toujours recalculé par le
                serveur lors de la demande.
              </p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-gray-600">
              Choisissez une salle pour afficher sa capacité et son tarif journalier.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
