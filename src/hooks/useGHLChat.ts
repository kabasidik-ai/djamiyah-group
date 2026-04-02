/**
 * Hook personnalisé pour l'intégration du Chat Widget GoHighLevel
 * Gère la détection du widget, l'ouverture du chat et le fallback WhatsApp
 */

import { useEffect, useState } from 'react'

const WHATSAPP_NUMBER = '224610759090'
const WHATSAPP_MESSAGE = "Bonjour, je souhaite des informations sur l'Hôtel Maison Blanche."
const GHL_DETECTION_TIMEOUT = 3000 // 3 secondes pour connexion 3G
const POLLING_INTERVAL = 500 // Vérification toutes les 500ms

interface UseGHLChatReturn {
  isGHLReady: boolean
  isLoading: boolean
  openChat: () => void
}

export function useGHLChat(): UseGHLChatReturn {
  const [isGHLReady, setIsGHLReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let timeout: NodeJS.Timeout | null = null

    /**
     * Vérifie si le widget GHL est chargé et disponible
     * @returns true si le widget est disponible, false sinon
     */
    const checkGHLWidget = (): boolean => {
      try {
        const hasLeadConnector = window.leadConnector?.open !== undefined
        const hasMsgSndr = window.msgsndr?.open !== undefined
        const isAvailable = hasLeadConnector || hasMsgSndr

        if (isAvailable) {
          console.log('✅ GHL Widget détecté et prêt')
          setIsGHLReady(true)
          setIsLoading(false)
          return true
        }
        return false
      } catch (error) {
        // Gestion silencieuse des erreurs (pas de crash)
        console.warn('⚠️ Erreur lors de la détection GHL (silencieuse):', error)
        return false
      }
    }

    // Vérification initiale immédiate
    if (checkGHLWidget()) {
      return
    }

    // Polling régulier pour détecter le widget (500ms)
    pollInterval = setInterval(() => {
      if (checkGHLWidget() && pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }, POLLING_INTERVAL)

    // Timeout de sécurité (3 secondes max)
    timeout = setTimeout(() => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }

      if (!isGHLReady) {
        console.log('⏱️ Timeout GHL: WhatsApp sera utilisé comme fallback')
        setIsGHLReady(false)
      }
      setIsLoading(false)
    }, GHL_DETECTION_TIMEOUT)

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isGHLReady])

  /**
   * Ouvre le chat GHL si disponible, sinon redirige vers WhatsApp
   */
  const openChat = (): void => {
    try {
      // PRIORITÉ 1: Ouvrir le widget GHL
      if (isGHLReady) {
        if (window.leadConnector?.open) {
          console.log('💬 Ouverture du Chat Widget GHL (leadConnector)')
          window.leadConnector.open()
          return
        }

        if (window.msgsndr?.open) {
          console.log('💬 Ouverture du Chat Widget GHL (msgsndr)')
          window.msgsndr.open()
          return
        }
      }

      // FALLBACK: Redirection WhatsApp
      console.log('📱 Fallback: Ouverture WhatsApp')
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      // Gestion silencieuse : toujours rediriger vers WhatsApp en cas d'erreur
      console.error("❌ Erreur lors de l'ouverture du chat, fallback WhatsApp:", error)
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return {
    isGHLReady,
    isLoading,
    openChat,
  }
}
