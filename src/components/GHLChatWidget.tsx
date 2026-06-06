'use client'

import { useEffect } from 'react'

/**
 * Widget Live Chat GoHighLevel natif
 * Remplace le ConciergeWidget React custom
 */
export default function GHLChatWidget() {
  const widgetId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'a5wcdv6hapHNnLA9xnl4'

  useEffect(() => {
    // Vérifier si le script existe déjà
    if (document.getElementById('ghl-chat-widget')) {
      return
    }

    // Créer et injecter le script GHL
    const script = document.createElement('script')
    script.id = 'ghl-chat-widget'
    script.src = 'https://widgets.leadconnectorhq.com/loader.js'
    script.setAttribute('data-widget-id', widgetId)
    script.async = true

    document.body.appendChild(script)

    return () => {
      // Cleanup au démontage
      const existingScript = document.getElementById('ghl-chat-widget')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [widgetId])

  return null
}
