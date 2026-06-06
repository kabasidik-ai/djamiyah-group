'use client'

import { useEffect } from 'react'

const WIDGET_ID = 'a5wcdv6hapHNnLA9xnl4'
const WIDGET_SRC = 'https://widgets.leadconnectorhq.com/loader.js'

/**
 * Widget de chat hôtelier - Salematou (Réceptionniste Virtuelle)
 * Hôtel La Maison Blanche, Coyah - Groupe Djamiyah
 */
export default function ChatWidget() {
  useEffect(() => {
    if (document.querySelector(`script[data-widget-id="${WIDGET_ID}"]`)) return

    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.setAttribute('data-widget-id', WIDGET_ID)
    script.async = true
    document.body.appendChild(script)

    return () => {
      const el = document.querySelector(`script[data-widget-id="${WIDGET_ID}"]`)
      if (el) document.body.removeChild(el)
    }
  }, [])

  return null
}
