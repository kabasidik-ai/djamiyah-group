'use client'
import { useEffect, useState } from 'react'

// Extension du type Window pour les APIs tierces (GHL + config)
declare global {
  interface Window {
    __GOHIGHLEVEL_CONFIG__?: {
      account: string
      campaign: string
    }
    GHL?: {
      open: () => void
    }
  }
}

export function ContactButton() {
  const [ghlReady, setGhlReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Configuration GHL
    window.__GOHIGHLEVEL_CONFIG__ = {
      account: 'oxubAkzf7YiQ8ws9MOLx',
      campaign: 'default',
    }

    // Charger le script GHL widget
    const script = document.createElement('script')
    script.src = 'https://widgets.gohighlevel.com/widget.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('✅ GHL Widget chargé avec succès')
      setGhlReady(true)
      setIsLoading(false)
    }
    script.onerror = () => {
      console.log('⚠️ GHL fallback: utiliser WhatsApp direct')
      setGhlReady(false)
      setIsLoading(false)
    }
    document.body.appendChild(script)

    // Timeout de sécurité (3 sec)
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => {
      clearTimeout(timeout)
      const existingScript = document.querySelector(
        'script[src="https://widgets.gohighlevel.com/widget.js"]'
      )
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  const handleContactClick = () => {
    // Stratégie : GHL prioritaire, fallback WhatsApp
    if (ghlReady && window.GHL?.open) {
      console.log('📞 Ouverture chat GHL')
      window.GHL.open()
    } else {
      // Fallback : redirection WhatsApp directe
      console.log('📱 Fallback: redirection WhatsApp')
      window.open('https://wa.me/224610759090', '_blank')
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Bouton WhatsApp-style */}
      <button
        onClick={handleContactClick}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-75 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out p-4 animate-bounce-slow hover:scale-110"
        title={ghlReady ? 'Ouvrir chat GHL (lead capture)' : 'Contacter sur WhatsApp'}
        aria-label="Bouton contact WhatsApp"
      >
        {/* SVG WhatsApp Icon */}
        <svg
          className="w-6 h-6 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.004 0C5.374 0 0 5.373 0 12.004c0 2.117.554 4.103 1.522 5.827L.057 23.998l6.306-1.654a11.954 11.954 0 005.641 1.424h.001C18.634 23.768 24 18.394 24 11.764 24 5.373 18.634 0 12.004 0zm0 21.785a9.918 9.918 0 01-5.056-1.382l-.362-.215-3.754.984.999-3.648-.237-.374A9.919 9.919 0 012.22 11.764C2.22 6.582 6.482 2.22 12.004 2.22c5.52 0 9.783 4.362 9.783 9.544 0 5.422-4.263 10.021-9.783 10.021z" />
        </svg>

        {/* Texte visible au hover (desktop) */}
        <span className="hidden group-hover:inline text-sm font-semibold whitespace-nowrap pr-1">
          {ghlReady ? 'Chat en direct' : 'WhatsApp'}
        </span>
      </button>

      {/* Tooltip info */}
      <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium shadow-lg">
        {ghlReady ? '💬 Réponse en moins de 2 min' : '📱 Contactez-nous par WhatsApp'}
      </div>
    </div>
  )
}
