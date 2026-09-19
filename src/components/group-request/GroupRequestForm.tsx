'use client'

// ============================================================
// GroupRequestForm — Formulaire progressif « Groupes & Séminaires »
// 3 étapes : 1) Contact · 2) Événement · 3) Prestations
//
// Collecte UNIQUEMENT une demande. Aucune confirmation (disponibilité,
// prestation, tarif) n'est émise ici : la validation relève du
// responsable humain. L'intégration GHL se fera à une phase ultérieure.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { conferences, rooms } from '@/data/content'
import {
  groupRequestSchema,
  GROUP_EVENT_TYPES,
  ROOM_CONFIGURATIONS,
  PREFERRED_CHANNELS,
  type GroupRequestInput,
} from '@/lib/schemas/groupRequest'
import { GROUP_REQUEST_SUCCESS_MESSAGE } from '@/lib/groupRequests'
// Valeurs brutes du formulaire (z.input) — avant coercition Zod.
type GroupFormValues = z.input<typeof groupRequestSchema>

const EVENT_TYPE_OPTIONS = [
  { value: 'seminar', label: 'Séminaire' },
  { value: 'conference', label: 'Conférence' },
  { value: 'training', label: 'Formation' },
  { value: 'meeting', label: 'Réunion' },
  { value: 'professional_group', label: 'Groupe professionnel' },
  { value: 'other', label: 'Autre événement professionnel' },
] satisfies { value: (typeof GROUP_EVENT_TYPES)[number]; label: string }[]

const CONFIG_OPTIONS = [
  { value: 'theatre', label: 'Théâtre / conférence' },
  { value: 'classroom', label: 'Classe / formation' },
  { value: 'u_shape', label: 'En U' },
  { value: 'boardroom', label: 'Table de direction' },
  { value: 'cabaret', label: 'Cabaret / atelier' },
  { value: 'recommandee', label: 'À recommander' },
] satisfies { value: (typeof ROOM_CONFIGURATIONS)[number]; label: string }[]

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'whatsapp', label: 'WhatsApp' },
] satisfies { value: (typeof PREFERRED_CHANNELS)[number]; label: string }[]

const MEAL_OPTIONS = [
  { value: 'african', label: 'Africain' },
  { value: 'european', label: 'Européen' },
  { value: 'mixed', label: 'Mixte' },
  { value: 'to_define', label: 'À définir' },
]

const SERVICE_OPTIONS = [
  { value: 'buffet', label: 'Buffet' },
  { value: 'table_service', label: 'Service à table' },
  { value: 'to_define', label: 'À définir' },
]

// Salles réelles présentes dans les données du projet.
const SALLE_OPTIONS = conferences.facilities.map((f) => ({
  value: f.name,
  label: `${f.name} — ${f.capacity}`,
}))

const STEPS = [
  { id: 1, title: 'Contact' },
  { id: 2, title: 'Événement' },
  { id: 3, title: 'Prestations' },
] as const

const DRAFT_KEY = 'djamiyah:groupRequestDraft:v2'

const defaultValues: GroupFormValues = {
  source: 'site',
  establishment: 'maison-blanche-coyah',
  contact: {
    firstName: '',
    lastName: '',
    jobTitle: '',
    phone: '',
    email: '',
    preferredChannel: 'email',
  },
  company: { name: '' },
  event: {
    type: 'seminar',
    name: '',
    startDate: '',
    endDate: '',
    flexibleDates: false,
    desiredHours: '',
    participants: 1,
    requestedRoom: '',
    configuration: 'theatre',
  },
  accommodation: {
    requested: false,
    arrival: '',
    departure: '',
    roomQuantities: rooms.map((room) => ({ type: room.name, count: 0 })),
  },
  catering: {
    morningBreak: { requested: false, time: '' },
    lunch: { requested: false, time: '' },
    afternoonBreak: { requested: false, time: '' },
    mealType: 'to_define',
    serviceStyle: 'to_define',
    dietaryConstraints: '',
  },
  comments: '',
}

type StepId = (typeof STEPS)[number]['id']

const STEP_1_PATHS: FieldPath<GroupFormValues>[] = [
  'company.name',
  'contact.firstName',
  'contact.lastName',
  'contact.phone',
  'contact.email',
  'contact.preferredChannel',
]

const STEP_2_PATHS: FieldPath<GroupFormValues>[] = [
  'event.type',
  'event.name',
  'event.startDate',
  'event.endDate',
  'event.desiredHours',
  'event.participants',
  'event.requestedRoom',
  'event.configuration',
]
export default function GroupRequestForm() {
  const [step, setStep] = useState<StepId>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submitLock = useRef(false)

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<GroupFormValues, unknown, GroupRequestInput>({
    resolver: zodResolver(groupRequestSchema),
    defaultValues,
    mode: 'onTouched',
  })

  // ── Conservation temporaire (coupure / refresh) ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY)
      if (raw) {
        reset(JSON.parse(raw) as GroupFormValues)
      }
    } catch {
      // fragment corrompu : on ignore
    }
  }, [reset])

  useEffect(() => {
    const subscription = watch(() => {
      if (submitLock.current) return
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()))
      } catch {
        // stockage indisponible : on ignore
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, getValues])

  const err = (path: string): string | undefined => {
    const keys = path.split('.')
    let node: unknown = errors
    for (const key of keys) {
      if (node && typeof node === 'object' && key in (node as Record<string, unknown>)) {
        node = (node as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    }
    if (node && typeof node === 'object' && 'message' in (node as Record<string, unknown>)) {
      return (node as { message?: string }).message
    }
    return undefined
  }

  const handleNext = async () => {
    const ok = step === 1 ? await trigger(STEP_1_PATHS) : await trigger(STEP_2_PATHS)
    if (ok) {
      setSubmitError(null)
      setStep((s) => (s + 1) as StepId)
    }
  }

  const handleBack = () => {
    setSubmitError(null)
    setStep((s) => (s - 1) as StepId)
  }

  async function onSubmit(data: GroupRequestInput) {
    if (submitLock.current) return
    submitLock.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/group-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as { message?: string; success?: boolean } | null
      if (!response.ok || !result?.success) {
        throw new Error(result?.message ?? 'Impossible de transmettre la demande.')
      }
      setSubmitMessage(result.message ?? GROUP_REQUEST_SUCCESS_MESSAGE)
      submitLock.current = false
      try {
        window.localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* ignore */
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erreur lors de la transmission.')
      submitLock.current = false
    } finally {
      setIsSubmitting(false)
    }
  }

  const registerIndexed = (name: string) => register(name as FieldPath<GroupFormValues>)
  const roomQuantities = watch('accommodation.roomQuantities') ?? []
  const stepTitle = STEPS.find((s) => s.id === step)?.title ?? ''

  const renderStepContent = (
    <>
      {step === 1 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Entreprise / organisation"
            placeholder="Nom de votre entreprise ou groupe"
            required
            {...register('company.name')}
            error={err('company.name')}
          />
          <div className="sm:col-span-2 border-t border-gray-100 pt-4" aria-hidden="true" />
          <Input
            label="Prénom"
            required
            {...register('contact.firstName')}
            error={err('contact.firstName')}
          />
          <Input
            label="Nom"
            required
            {...register('contact.lastName')}
            error={err('contact.lastName')}
          />
          <Input
            label="Fonction"
            placeholder="Ex. Chargée d’événements…"
            {...register('contact.jobTitle')}
            error={err('contact.jobTitle')}
          />
          <Input
            label="Téléphone"
            type="tel"
            inputMode="tel"
            required
            {...register('contact.phone')}
            error={err('contact.phone')}
          />
          <Input
            label="Email"
            type="email"
            inputMode="email"
            required
            {...register('contact.email')}
            error={err('contact.email')}
          />
          <Select
            label="Canal de contact préféré"
            required
            options={CHANNEL_OPTIONS}
            {...register('contact.preferredChannel')}
            error={err('contact.preferredChannel')}
          />
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Type d’événement professionnel"
            required
            options={EVENT_TYPE_OPTIONS}
            {...register('event.type')}
            error={err('event.type')}
          />
          <Input
            label="Nom de l’événement"
            required
            {...register('event.name')}
            error={err('event.name')}
          />
          <Input
            label="Date de début"
            type="date"
            required
            {...register('event.startDate')}
            error={err('event.startDate')}
          />
          <Input
            label="Date de fin"
            type="date"
            required
            {...register('event.endDate')}
            error={err('event.endDate')}
          />
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#F9A03F] focus:ring-[#F9A03F]"
              {...register('event.flexibleDates')}
            />
            <span>Dates flexibles</span>
          </label>
          <Input
            label="Heures souhaitées"
            placeholder="Ex. 9h00 – 17h30"
            {...register('event.desiredHours')}
            error={err('event.desiredHours')}
          />
          <Input
            label="Nombre de participants"
            type="number"
            min={1}
            required
            {...register('event.participants')}
            error={err('event.participants')}
          />
          <Select
            label="Salle souhaitée"
            required
            hint="Vous pouvez laisser l’équipe recommander la salle adaptée."
            options={[{ value: '', label: '— À recommander —' }, ...SALLE_OPTIONS]}
            {...register('event.requestedRoom')}
            error={err('event.requestedRoom')}
          />
          <Select
            label="Configuration souhaitée"
            required
            options={CONFIG_OPTIONS}
            {...register('event.configuration')}
          />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-8">
          <section aria-labelledby="group-hebergement">
            <h4 id="group-hebergement" className="mb-3 text-lg font-semibold text-[#0D3B3E]">
              Hébergement
            </h4>
            <label className="mb-4 inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#F9A03F] focus:ring-[#F9A03F]"
                {...register('accommodation.requested')}
              />
              <span>Demander un hébergement sur place</span>
            </label>

            {watch('accommodation.requested') && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Date d’arrivée"
                  type="date"
                  required
                  {...register('accommodation.arrival')}
                  error={err('accommodation.arrival')}
                />
                <Input
                  label="Date de départ"
                  type="date"
                  required
                  {...register('accommodation.departure')}
                  error={err('accommodation.departure')}
                />

                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 block text-sm font-medium text-gray-700">
                    Nombre et types de chambres
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {roomQuantities.map((item, index) => (
                      <label
                        key={item.type}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <span className="text-xs text-gray-700">{item.type}</span>
                        <input
                          type="number"
                          min={0}
                          className="w-16 rounded-md border border-gray-200 px-2 py-1 text-sm"
                          aria-label={`Nombre de ${item.type}`}
                          {...registerIndexed(`accommodation.roomQuantities.${index}.count`)}
                        />
                      </label>
                    ))}
                  </div>
                  {err('accommodation.roomQuantities') && (
                    <p className="mt-1 text-xs text-red-600">
                      {err('accommodation.roomQuantities')}
                    </p>
                  )}
                </fieldset>

                <Input
                  label="Nombre de personnes hébergées"
                  type="number"
                  min={1}
                  required
                  {...register('accommodation.hostedPeople')}
                  error={err('accommodation.hostedPeople')}
                />
              </div>
            )}
          </section>

          <section aria-labelledby="group-restauration">
            <h4 id="group-restauration" className="mb-3 text-lg font-semibold text-[#0D3B3E]">
              Restauration
            </h4>
            <div className="space-y-4">
              {(
                [
                  { slot: 'morningBreak', label: 'Pause du matin' },
                  { slot: 'lunch', label: 'Déjeuner' },
                  { slot: 'afternoonBreak', label: 'Pause de l’après-midi' },
                ] as const
              ).map(({ slot, label }) => (
                <div key={slot} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-800">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[#F9A03F] focus:ring-[#F9A03F]"
                      {...register(`catering.${slot}.requested`)}
                    />
                    {label}
                  </label>
                  {watch(`catering.${slot}.requested`) && (
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <Input
                        label="Heure"
                        type="time"
                        required
                        {...register(`catering.${slot}.time`)}
                        error={err(`catering.${slot}.time`)}
                      />
                      <Input
                        label="Couverts"
                        type="number"
                        min={1}
                        required
                        {...register(`catering.${slot}.covers`)}
                        error={err(`catering.${slot}.covers`)}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Type de repas"
                  options={MEAL_OPTIONS}
                  {...register('catering.mealType')}
                />
                <Select
                  label="Service"
                  options={SERVICE_OPTIONS}
                  {...register('catering.serviceStyle')}
                />
              </div>

              <Textarea
                label="Contraintes alimentaires signalées"
                rows={3}
                placeholder="Allergies, régimes, préférences…"
                {...register('catering.dietaryConstraints')}
              />
            </div>
          </section>

          <section aria-labelledby="group-commentaires">
            <Textarea
              label="Commentaires complémentaires"
              rows={4}
              hint="Précisions utiles à la préparation de votre proposition."
              {...register('comments')}
            />
          </section>
        </div>
      )}
    </>
  )
  const renderNavButtons = (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
      {step > 1 && (
        <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
          ← Précédent
        </Button>
      )}
      {step < 3 ? (
        <Button type="button" onClick={handleNext} disabled={isSubmitting}>
          Suivant →
        </Button>
      ) : (
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Transmission…' : 'Envoyer la demande'}
        </Button>
      )}
    </div>
  )
  return submitMessage ? (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div>
            <h3 className="text-xl font-serif font-bold text-gray-900">Demande transmise</h3>
            <p className="mt-2 text-gray-700 leading-relaxed">{submitMessage}</p>
            <p className="mt-3 text-sm text-gray-500">
              La référence de dossier vous sera communiquée par notre équipe lors de la validation.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset(defaultValues)
            setStep(1)
            setSubmitMessage(null)
          }}
        >
          Soumettre une autre demande
        </Button>
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <nav aria-label="Progression du formulaire" className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((s) => {
          const isCurrent = s.id === step
          const isDone = s.id < step
          return (
            <div
              key={s.id}
              className="flex flex-1 flex-col gap-1.5"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isDone
                      ? 'bg-[#0D3B3E] text-white'
                      : isCurrent
                        ? 'bg-[#F9A03F] text-white ring-2 ring-[#F9A03F]/40'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isDone ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </span>
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {s.title}
                </span>
              </div>
              <div
                className={`h-1 rounded-full ${isDone ? 'bg-[#0D3B3E]/30' : isCurrent ? 'bg-[#F9A03F]/50' : 'bg-gray-200'}`}
              />
            </div>
          )
        })}
      </nav>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <fieldset
          disabled={isSubmitting}
          className="rounded-2xl border border-[#EFEDE9] bg-white p-5 shadow-[0_4px_14px_rgba(17,24,39,0.05)] sm:p-7"
        >
          <legend className="sr-only">Demande Groupes &amp; Séminaires — étape {step}</legend>
          <h3 className="mb-5 text-xl font-serif font-bold text-[#0D3B3E]">
            Étape {step} — {stepTitle}
          </h3>
          {renderStepContent}
          <div className="mt-6">{renderNavButtons}</div>
        </fieldset>
      </form>

      <p className="text-sm text-gray-500 leading-relaxed">
        Après envoi, la disponibilité de la salle, les prestations et la proposition seront
        vérifiées par notre équipe avant toute réponse. Aucune réservation n’est considérée
        confirmée tant qu’elle n’a pas été validée.
      </p>
    </div>
  )
}
