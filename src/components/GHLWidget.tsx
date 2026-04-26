'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const GHL_LOCATION_ID = 'a5wcdv6hapHNnLA9xnl4'
const GHL_BUSINESS_ID = 'ORWCLXIGJ8k42yscyNzt'
const GHL_SNAPSHOT_ID = '67ebbd1e30e269d99774a4a0'
const GHL_USER_NICHE_ID = 'PY4tPIs4Efs5ox3Z7dGZ'
const GHL_CALENDAR_ID = 'maison-blanche-booking' // ID calendrier GHL

interface GHLWidgetConfig {
  locationId: string
  businessId: string
  snapshotId: string
  userNicheId: string
  hidden: boolean
}

interface GHLBookingConfig {
  calendarId: string
  pipelineId: string
  stageId: string
  opportunityName: string
  source: string
  value: number
}

type Provider = 'gohighlevel' | 'manychat' | 'tidio' | 'crisp' | 'intercom' | 'zendesk'

interface GHLWidgetProps {
  provider?: Provider
  locationId?: string
  businessId?: string
  snapshotId?: string
  userNicheId?: string
  theme?: 'light' | 'dark'
  position?: 'left' | 'right'
  showOnPages?: string[]
  excludePages?: string[]
}

interface GHLBookingWidgetProps {
  calendarId?: string
  locationId?: string
  theme?: 'light' | 'dark'
  onBookingComplete?: (bookingData: unknown) => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    GHL_WIDGET_CONFIG?: GHLWidgetConfig
    GHLWidgets?: {
      open: () => void
      close: () => void
      hide: () => void
      show: () => void
    }
  }
}

const providerScripts: Record<Provider, { src: string; dataAttr: string }> = {
  gohighlevel: {
    src: 'https://widgets.leadconnectorhq.com/loader.js',
    dataAttr: 'https://widgets.leadconnectorhq.com/chat-widget/loader.js',
  },
  manychat: {
    src: 'https://widget.manychat.com/your-page-id.js',
    dataAttr: '',
  },
  tidio: {
    src: '//code.tidio.co.js',
    dataAttr: '',
  },
  crisp: {
    src: 'https://client.crisp.chat/l.js',
    dataAttr: '',
  },
  intercom: {
    src: 'https://widget.intercom.io/widget/your-app-id',
    dataAttr: '',
  },
  zendesk: {
    src: 'https://static.zdassets.com/ekr/snippet.js',
    dataAttr: '',
  },
}

export function GHLWidget({
  provider = 'gohighlevel',
  locationId = GHL_LOCATION_ID,
  businessId = GHL_BUSINESS_ID,
  snapshotId = GHL_SNAPSHOT_ID,
  userNicheId = GHL_USER_NICHE_ID,
  theme = 'light',
  position = 'right',
  showOnPages = [],
  excludePages = [],
}: GHLWidgetProps) {
  useEffect(() => {
    // Page visibility filtering
    if (showOnPages.length > 0 && !showOnPages.includes(window.location.pathname)) {
      return
    }
    if (excludePages.includes(window.location.pathname)) {
      return
    }

    // Configuration GHL
    window.GHL_WIDGET_CONFIG = {
      locationId,
      businessId,
      snapshotId,
      userNicheId,
      hidden: false,
    }
    console.log('Widget config initialisée:', window.GHL_WIDGET_CONFIG)

    // Global widget API
    window.GHLWidgets = {
      open: () => {
        console.log('Opening widget')
        // Trigger widget open
        const event = new CustomEvent('ghl-widget-open')
        window.dispatchEvent(event)
      },
      close: () => {
        console.log('Closing widget')
        const event = new CustomEvent('ghl-widget-close')
        window.dispatchEvent(event)
      },
      hide: () => {
        console.log('Hiding widget')
        window.GHL_WIDGET_CONFIG!.hidden = true
      },
      show: () => {
        console.log('Showing widget')
        window.GHL_WIDGET_CONFIG!.hidden = false
      },
    }
  }, [locationId, businessId, snapshotId, userNicheId])

  const scriptConfig = providerScripts[provider]

  if (provider === 'gohighlevel') {
    return (
      <>
        <Script
          id="ghl-chat-widget"
          src={scriptConfig.src}
          data-resources-url={scriptConfig.dataAttr}
          data-location-id={locationId}
          strategy="lazyOnload"
          onLoad={() => {
            console.log('Widget script chargé')
            console.log('window.leadConnector:', window.leadConnector)
            console.log('window.msgsndr:', window.msgsndr)
          }}
          onError={(e) => {
            console.error('Erreur chargement Widget:', e)
          }}
        />
      </>
    )
  }

  // Generic widget loader for other providers
  return (
    <>
      <Script
        id={`${provider}-widget`}
        src={scriptConfig.src}
        strategy="lazyOnload"
        onLoad={() => {
          console.log(`${provider} Widget script chargé`)
        }}
        onError={(e) => {
          console.error(`Erreur chargement ${provider} Widget:`, e)
        }}
      />
      <style jsx>{`
        :global(.chat-widget) {
          ${position}: 20px;
        }
      `}</style>
    </>
  )
}
