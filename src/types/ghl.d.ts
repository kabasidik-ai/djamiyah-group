/**
 * GoHighLevel (GHL) Widget Type Definitions
 * Typage strict pour l'intégration du Chat Widget GHL
 */

export interface LeadConnectorWidget {
  open: () => void
  close?: () => void
  toggle?: () => void
}

declare global {
  interface Window {
    leadConnector?: LeadConnectorWidget
    msgsndr?: LeadConnectorWidget
  }
}

export {}
