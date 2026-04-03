'use client'

import { useEffect } from 'react'
import Script from 'next/script'

const GHL_LOCATION_ID = 'a5wcdv6hapHNnLA9xnl4'
const GHL_BUSINESS_ID = 'ORWCLXIGJ8k42yscyNzt'
const GHL_SNAPSHOT_ID = '67ebbd1e30e269d99774a4a0'
const GHL_USER_NICHE_ID = 'PY4tPIs4Efs5ox3Z7dGZ'

interface GHLWidgetConfig {
  locationId: string
  businessId: string
  snapshotId: string
  userNicheId: string
  hidden: boolean
}

declare global {
  interface Window {
    GHL_WIDGET_CONFIG?: GHLWidgetConfig
  }
}

export function GHLWidget() {
  useEffect(() => {
    // Configuration GHL
    window.GHL_WIDGET_CONFIG = {
      locationId: GHL_LOCATION_ID,
      businessId: GHL_BUSINESS_ID,
      snapshotId: GHL_SNAPSHOT_ID,
      userNicheId: GHL_USER_NICHE_ID,
      hidden: false,
    }
    console.log('⚙️ GHL Widget config initialisée:', window.GHL_WIDGET_CONFIG)
  }, [])

  return (
    <>
      <Script
        id="ghl-chat-widget"
        src="https://widgets.leadconnectorhq.com/loader.js"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-location-id={GHL_LOCATION_ID}
        strategy="lazyOnload"
        onLoad={() => {
          console.log('🚀 GHL Widget script chargé')
          console.log('🔍 window.leadConnector:', window.leadConnector)
          console.log('🔍 window.msgsndr:', window.msgsndr)
        }}
        onError={(e) => {
          console.error('❌ Erreur chargement GHL Widget:', e)
        }}
      />
    </>
  )
}
