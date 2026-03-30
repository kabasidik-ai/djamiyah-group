'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { navigation } from '@/data/content'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-[#0D3B3E]/10 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="group flex items-center transition-opacity hover:opacity-90"
            aria-label="Groupe Djamiyah — Accueil"
          >
            <LogoIcon
              variant="default"
              size="md"
              showSubtitle={true}
            />
          </Link>

          {/* ── Desktop Navigation ── */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-[#0D3B3E] font-medium transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F9A03F] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
            <Link
              href="/reservation"
              className="bg-[#F9A03F] hover:bg-orange-500 text-white px-6 py-2.5 rounded-full font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              Réserver
            </Link>
          </div>

          {/* ── Mobile menu button ── */}
          <button
            className="md:hidden text-[#0D3B3E] hover:text-[#F9A03F] p-2 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
              <span
                className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* ── Mobile menu ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-1 border-t border-gray-100">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-700 hover:text-[#0D3B3E] hover:bg-[#0D3B3E]/5 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <Link
                href="/reservation"
                className="block bg-[#F9A03F] hover:bg-orange-500 text-white px-6 py-3 rounded-full font-semibold text-center transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Réserver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
