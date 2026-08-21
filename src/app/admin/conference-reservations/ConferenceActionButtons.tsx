'use client'

import { useActionState } from 'react'
import { setReservationStatusAction, type ReservationActionState } from '../actions'

const initialState: ReservationActionState = { error: null, success: null }

export function ConferenceActionButtons({ reservationId }: { reservationId: string }) {
  const [state, formAction, isPending] = useActionState(setReservationStatusAction, initialState)

  return (
    <div className="space-y-1">
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">{state.success}</p>}
      <div className="flex items-center gap-2">
        <form action={formAction}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <input type="hidden" name="action" value="confirmed" />
          <button
            type="submit"
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Confirmer
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="reservationId" value={reservationId} />
          <input type="hidden" name="action" value="cancelled" />
          <button
            type="submit"
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Refuser
          </button>
        </form>
      </div>
    </div>
  )
}
