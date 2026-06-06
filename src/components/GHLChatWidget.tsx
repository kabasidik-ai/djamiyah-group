'use client'

import Script from 'next/script'

/**
 * Widget Live Chat GoHighLevel natif
 * Remplace le ConciergeWidget React custom
 */
export default function GHLChatWidget() {
  const widgetId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'a5wcdv6hapHNnLA9xnl4'

  return (
    <Script
      src={`https://widgets.leadconnectorhq.com/loader.js`}
      data-widget-id={widgetId}
      strategy="lazyOnload"
      id="ghl-chat-widget"
    />
  )
}
