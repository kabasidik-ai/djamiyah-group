'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'

type ChapChapPaymentMethod = 'orange_money' | 'mtn_momo' | 'wave' | 'card' | 'paycard' | 'cc'

type PaymentMode = ChapChapPaymentMethod | 'bank_transfer'

export type ChapChapPayPayload = {
  amount: number
  currency: 'GNF'
  paymentMethod: ChapChapPaymentMethod
  phoneNumber?: string
  customerName: string
  customerEmail: string
  bookingReference?: string
  reservationId?: string
}

type ChapChapPayProps = {
  amount: number
  nights: number
  roomName?: string
  orderId?: string
  customerName?: string
  customerEmail?: string
  bookingReference?: string
  reservationId?: string
  onSuccess?: (data: unknown) => void
  onError?: (message: string) => void
}

const methodLabels: Record<PaymentMode, string> = {
  orange_money: 'Orange Money',
  mtn_momo: 'MTN Mobile Money',
  wave: 'Wave',
  card: 'Carte bancaire (Visa / Mastercard)',
  paycard: 'PayCard',
  cc: 'Carte de crédit (CC)',
  bank_transfer: 'Virement Bancaire',
}

const chapchapMethods: ChapChapPaymentMethod[] = [
  'orange_money',
  'mtn_momo',
  'wave',
  'card',
  'paycard',
  'cc',
]

const paymentSchema = z
  .object({
    amount: z.number().int().positive(),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(190),
    paymentMethod: z.enum(['orange_money', 'mtn_momo', 'wave', 'card', 'paycard', 'cc']),
    phoneNumber: z.string().trim().min(8).max(30).optional(),
  })
  .superRefine((value, ctx) => {
    const needsPhone =
      value.paymentMethod === 'orange_money' ||
      value.paymentMethod === 'mtn_momo' ||
      value.paymentMethod === 'wave'
    if (needsPhone && !value.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phoneNumber'],
        message: 'Le numéro de téléphone est requis.',
      })
    }
  })

function sanitizeInput(value: string, maxLength: number): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export default function ChapChapPay({
  amount,
  nights,
  roomName,
  orderId,
  customerName = '',
  customerEmail = '',
  bookingReference,
  reservationId,
  onSuccess,
  onError,
}: ChapChapPayProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('orange_money')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState(customerName)
  const [email, setEmail] = useState(customerEmail)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [bankConfirmed, setBankConfirmed] = useState(false)

  const formattedAmount = useMemo(() => amount.toLocaleString('fr-FR'), [amount])
  const needsPhone =
    paymentMode === 'orange_money' || paymentMode === 'mtn_momo' || paymentMode === 'wave'
  const isBankTransfer = paymentMode === 'bank_transfer'

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    // ── Virement bancaire : confirmation simple ──
    if (isBankTransfer) {
      setBankConfirmed(true)
      onSuccess?.({ method: 'bank_transfer', amount })
      return
    }

    const safeName = sanitizeInput(fullName, 120)
    const safeEmail = sanitizeInput(email, 190).toLowerCase()
    const safePhone = needsPhone ? sanitizeInput(phoneNumber, 30) : undefined

    const parsed = paymentSchema.safeParse({
      amount,
      customerName: safeName,
      customerEmail: safeEmail,
      paymentMethod: paymentMode as ChapChapPaymentMethod,
      phoneNumber: safePhone,
    })

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Les données de paiement sont invalides.'
      setErrorMessage(message)
      onError?.(message)
      return
    }

    const payload: ChapChapPayPayload = {
      amount: parsed.data.amount,
      currency: 'GNF',
      paymentMethod: parsed.data.paymentMethod,
      phoneNumber: parsed.data.phoneNumber,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      bookingReference: bookingReference || orderId,
      reservationId,
    }

    try {
      setIsSubmitting(true)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)

      const response = await fetch('/api/payment/chapchap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const data = await response.json()

      if (!response.ok) {
        const message = data?.message || 'Le paiement a échoué. Veuillez réessayer.'
        setErrorMessage(message)
        onError?.(message)
        return
      }

      onSuccess?.(data)

      const redirectUrl =
        (data?.payment_url as string | undefined) ||
        (data?.paymentUrl as string | undefined) ||
        (data?.checkout_url as string | undefined) ||
        (data?.checkoutUrl as string | undefined)

      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        const message = 'URL de redirection de paiement introuvable.'
        setErrorMessage(message)
        onError?.(message)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const message = 'Le service de paiement met trop de temps à répondre.'
        setErrorMessage(message)
        onError?.(message)
        return
      }
      const message = "Impossible d'initialiser le paiement pour le moment."
      setErrorMessage(message)
      onError?.(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Confirmation virement bancaire ──
  if (bankConfirmed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-3 text-4xl">🏦</div>
        <h3 className="text-xl font-serif font-bold text-green-800 mb-2">
          Demande de virement enregistrée
        </h3>
        <p className="text-sm text-green-700 mb-4">
          Merci{fullName ? `, ${fullName}` : ''}. Veuillez effectuer le virement aux coordonnées
          ci-dessous et envoyer votre preuve de paiement à{' '}
          <a href="mailto:contact@djamiyah.com" className="underline font-medium">
            contact@djamiyah.com
          </a>
          .
        </p>
        <div className="rounded-xl bg-white border border-green-200 p-4 text-left text-sm space-y-1 text-gray-700">
          <p>
            <span className="font-semibold">Banque :</span> Société Générale Guinée
          </p>
          <p>
            <span className="font-semibold">Bénéficiaire :</span> Groupe Djamiyah
          </p>
          <p>
            <span className="font-semibold">IBAN / Compte :</span> Contactez-nous pour les détails
          </p>
          <p>
            <span className="font-semibold">Montant :</span> {formattedAmount} GNF
          </p>
          <p>
            <span className="font-semibold">Référence :</span>{' '}
            {bookingReference || orderId || 'À préciser'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-serif font-bold text-gray-900">Paiement sécurisé</h3>
      <p className="mt-2 text-sm text-gray-600">
        Finalisez votre réservation avec <span className="font-semibold">Chap Chap Pay</span> ou par
        virement bancaire.
      </p>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Chambre</span>
          <span className="font-medium text-gray-900">{roomName || 'Non sélectionnée'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <span>Nombre de nuits</span>
          <span className="font-medium text-gray-900">{nights}</span>
        </div>
        <div className="mt-3 border-t border-gray-200 pt-3 flex items-center justify-between">
          <span className="text-gray-700 font-medium">Total à payer</span>
          <span className="text-xl font-bold text-primary">{formattedAmount} GNF</span>
        </div>
      </div>

      <form onSubmit={handlePayment} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Votre nom"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="contact@djamiyah.com"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Mode de paiement</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {/* Mobile Money & Wave */}
            <optgroup label="Mobile Money">
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN Mobile Money</option>
              <option value="wave">Wave</option>
            </optgroup>
            {/* Carte */}
            <optgroup label="Carte bancaire">
              <option value="card">Visa / Mastercard</option>
              <option value="paycard">PayCard</option>
              <option value="cc">Carte de crédit (CC)</option>
            </optgroup>
            {/* Virement */}
            <optgroup label="Virement">
              <option value="bank_transfer">Virement Bancaire</option>
            </optgroup>
          </select>
        </div>

        {needsPhone && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {paymentMode === 'wave' ? 'Numéro Wave' : 'Numéro Mobile Money'}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+224 XXX XX XX XX"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Exemple: +224 6XX XX XX XX</p>
          </div>
        )}

        {/* Info virement bancaire */}
        {isBankTransfer && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800 space-y-1">
            <p className="font-semibold mb-1">Coordonnées bancaires</p>
            <p>
              <span className="font-medium">Banque :</span> Société Générale Guinée
            </p>
            <p>
              <span className="font-medium">Bénéficiaire :</span> Groupe Djamiyah
            </p>
            <p>
              <span className="font-medium">Montant :</span> {formattedAmount} GNF
            </p>
            <p className="mt-2 text-blue-700 text-xs">
              Après votre virement, envoyez la preuve à{' '}
              <a href="mailto:contact@djamiyah.com" className="underline">
                contact@djamiyah.com
              </a>{' '}
              avec votre référence de réservation.
            </p>
          </div>
        )}

        {/* Badges méthodes actives */}
        {!isBankTransfer && (
          <div className="flex flex-wrap gap-2 pt-1">
            {chapchapMethods.map((m) => (
              <span
                key={m}
                onClick={() => setPaymentMode(m)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  paymentMode === m
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-primary/40'
                }`}
              >
                {methodLabels[m]}
              </span>
            ))}
          </div>
        )}

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || amount <= 0}
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-white font-semibold transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? 'Initialisation du paiement...'
            : isBankTransfer
              ? 'Confirmer le virement'
              : 'Payer maintenant'}
        </button>
      </form>
    </div>
  )
}
