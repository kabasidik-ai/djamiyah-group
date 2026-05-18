'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const PDF_URL = '/menus/menu-restaurant-djamiyah.pdf'

/** Sélecteurs d'éléments focusables dans la modal */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function MenuPDFViewer() {
  const [isOpen, setIsOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  /* ── close — déclaré avant les effets qui l'utilisent ── */
  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => triggerRef.current?.focus(), 50)
  }, [])

  /* ── Animation (raf — évite setState synchrone dans l'effet) ── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(isOpen))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  /* ── Fermeture ESC ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  /* ── Blocage scroll body ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /* ── Focus trap ── */
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return
    const firstFocusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)[0]
    firstFocusable?.focus()

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', onTab)
    return () => window.removeEventListener('keydown', onTab)
  }, [isOpen])

  return (
    <>
      {/* ── Bouton déclencheur ── */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="
          inline-flex items-center gap-2
          bg-[#F9A03F] hover:bg-[#e8911e]
          text-white text-sm font-semibold
          px-6 py-3 rounded-full
          shadow-[0_2px_12px_rgba(249,160,63,0.35)]
          hover:shadow-[0_4px_20px_rgba(249,160,63,0.50)]
          transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
          focus:outline-none focus:ring-2 focus:ring-[#F9A03F] focus:ring-offset-2
        "
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="menu-pdf-dialog"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        Voir toute la carte +
      </button>

      {/* ── Backdrop + Modal ── */}
      {isOpen && (
        /* Backdrop — cliquable pour fermer */
        <div
          className={`
            fixed inset-0 z-[60] flex items-end sm:items-center justify-center
            transition-colors duration-300
            ${visible ? 'bg-black/80' : 'bg-black/0'}
          `}
          onClick={close}
          aria-hidden="true"
        >
          {/* Modal — stopPropagation pour ne pas fermer quand on clique à l'intérieur */}
          <div
            id="menu-pdf-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu restaurant — Hôtel Maison Blanche"
            className={`
              bg-white flex flex-col overflow-hidden shadow-2xl
              transition-all duration-300
              w-full h-full rounded-none
              sm:rounded-2xl sm:w-full sm:max-w-6xl sm:h-[90vh] sm:mx-6
              ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── En-tête ── */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#F9A03F] font-semibold mb-0.5">
                  Groupe Djamiyah
                </p>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#0D3B3E] leading-tight">
                  Menu Restaurant — Hôtel Maison Blanche
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Bouton Télécharger */}
                <a
                  href={PDF_URL}
                  download="menu-restaurant-djamiyah.pdf"
                  className="
                    inline-flex items-center gap-1.5
                    bg-[#0D3B3E] hover:bg-[#164B4F]
                    text-white text-sm font-medium
                    px-3 sm:px-4 py-2 rounded-full
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-[#0D3B3E] focus:ring-offset-1
                  "
                  aria-label="Télécharger le menu PDF"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="hidden sm:inline">Télécharger</span>
                </a>

                {/* Bouton Fermer */}
                <button
                  onClick={close}
                  className="
                    flex items-center justify-center
                    w-9 h-9 min-w-[36px] min-h-[36px]
                    rounded-full text-gray-500
                    hover:text-gray-900 hover:bg-gray-100
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-[#F9A03F]
                  "
                  aria-label="Fermer le menu"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Visionneuse PDF ── */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              <embed
                src={`${PDF_URL}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                className="w-full h-full"
                title="Menu restaurant Hôtel Maison Blanche — Groupe Djamiyah"
              />
            </div>

            {/* ── Fallback (PDF non rendu sur iOS Safari) ── */}
            <div className="shrink-0 px-4 sm:px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Le PDF ne s&apos;affiche pas ?{' '}
                <a
                  href={PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F9A03F] underline hover:text-[#e8911e] font-medium"
                >
                  Ouvrir dans un nouvel onglet
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
