'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { navigation } from '@/data/content'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/98 shadow-[0_2px_24px_rgba(13,59,62,0.10)] backdrop-blur-md'
          : 'bg-white/95 backdrop-blur-sm border-b border-[#0D3B3E]/8'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10">
        {/* ── Barre principale — hauteur min 72px ── */}
        <div className="flex items-center justify-between min-h-[72px]">
          {/* ── Logo ── */}
          <Link
            href="/"
            className="group flex items-center transition-opacity duration-200 hover:opacity-85 shrink-0"
            aria-label="Groupe Djamiyah — Accueil"
          >
            <LogoIcon
              variant="default"
              size="lg"
              showSubtitle={true}
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* ── Navigation desktop ── */}
          <div className="hidden lg:flex items-center gap-10">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative text-[15px] font-medium text-gray-600 hover:text-[#0D3B3E] transition-colors duration-200 group py-1"
              >
                {item.name}
                <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-[#F9A03F] rounded-full group-hover:w-full transition-all duration-300 ease-out" />
              </Link>
            ))}
          </div>

          {/* ── Actions desktop ── */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link
              href="/reservation"
              className="
                inline-flex items-center gap-2
                bg-[#F9A03F] hover:bg-[#e8911e]
                text-white text-[14px] font-semibold
                px-6 py-2.5 rounded-full
                shadow-[0_2px_12px_rgba(249,160,63,0.35)]
                hover:shadow-[0_4px_20px_rgba(249,160,63,0.50)]
                transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
              "
            >
              Réserver
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* ── Bouton hamburger mobile ── */}
          <button
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 text-[#0D3B3E] rounded-lg hover:bg-[#0D3B3E]/6 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
          >
            <span
              className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
            />
            <span
              className={`block h-[2px] w-5 bg-current rounded-full my-[5px] transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-x-0' : ''}`}
            />
            <span
              className={`block h-[2px] w-5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
            />
          </button>
        </div>

        {/* ── Menu mobile déroulant ── */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[600px] opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-2 pb-2 border-t border-[#0D3B3E]/8 space-y-0.5">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-3 text-[15px] font-medium text-gray-600 hover:text-[#0D3B3E] hover:bg-[#0D3B3E]/5 rounded-xl transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 px-3">
              <Link
                href="/reservation"
                className="
                  flex items-center justify-center gap-2
                  bg-[#F9A03F] hover:bg-[#e8911e]
                  text-white text-[15px] font-semibold
                  w-full py-3.5 rounded-2xl
                  shadow-[0_2px_12px_rgba(249,160,63,0.35)]
                  transition-all duration-200
                "
                onClick={() => setIsMenuOpen(false)}
              >
                Réserver maintenant
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
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
