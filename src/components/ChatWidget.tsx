'use client'

import { useEffect } from 'react'

const WIDGET_ID = '69d1e67a34c0446b134002e2'
const WIDGET_SRC = 'https://beta.leadconnectorhq.com/loader.js'
const RESOURCES_URL = 'https://beta.leadconnectorhq.com/chat-widget/loader.js'

/**
 * Widget de chat hôtelier - Salematou (Réceptionniste Virtuelle)
 * Hôtel La Maison Blanche, Coyah - Groupe Djamiyah
 */
export default function ChatWidget() {
  useEffect(() => {
    if (document.querySelector(`script[data-widget-id="${WIDGET_ID}"]`)) return

    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.setAttribute('data-resources-url', RESOURCES_URL)
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
