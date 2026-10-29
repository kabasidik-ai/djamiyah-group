'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MessageReplyForm({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: message.trim() }),
      })

      if (!res.ok) {
        throw new Error('Échec envoi')
      }

      setMessage('')
      router.refresh()
    } catch {
      setError("Impossible d'envoyer le message. Réessayez.")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Écrire une réponse…"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? 'Envoi…' : 'Envoyer'}
      </button>
      {error && <p className="text-xs text-red-600 self-center">{error}</p>}
    </form>
  )
}
