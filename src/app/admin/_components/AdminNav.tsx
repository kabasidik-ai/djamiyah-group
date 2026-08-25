'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BedDouble,
  Presentation,
  Users,
  MessageSquare,
  CalendarDays,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { logoutAction } from '../actions'

const navLinks = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  {
    href: '/admin/room-reservations',
    label: 'Réservations chambres',
    exact: false,
    icon: BedDouble,
  },
  {
    href: '/admin/conference-reservations',
    label: 'Salles de conférence',
    exact: false,
    icon: Presentation,
  },
  { href: '/admin/clients', label: 'Clients / Contacts', exact: false, icon: Users },
  { href: '/admin/messages', label: 'Messages', exact: false, icon: MessageSquare },
  { href: '/admin/calendar', label: 'Agenda', exact: false, icon: CalendarDays },
] as const

function isActive(pathname: string, link: { href: string; exact: boolean }): boolean {
  return link.exact ? pathname === link.href : pathname.startsWith(link.href)
}

function SidebarLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-1 px-2 py-4" aria-label="Navigation principale">
      {navLinks.map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-amber-100 text-amber-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="flex items-center gap-3 h-16 px-4 border-b border-gray-200 shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo-djamiyah.svg" alt="Djamiyah Group" className="h-9 w-9 shrink-0" />
      <span className="text-base font-bold text-gray-900 leading-tight">
        Djamiyah
        <span className="block text-xs font-medium text-gray-500">Espace Staff</span>
      </span>
    </Link>
  )
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="border-t border-gray-200 p-3 space-y-3 shrink-0">
      <span className="block px-1 text-xs text-gray-500 truncate">{email}</span>
      <form action={logoutAction} className="w-full">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          Déconnexion
        </button>
      </form>
    </div>
  )
}

function SidebarContent({
  pathname,
  email,
  onNavigate,
}: {
  pathname: string
  email: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <Brand onNavigate={onNavigate} />
      <SidebarLinks pathname={pathname} />
      <SidebarFooter email={email} />
    </div>
  )
}

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* ── Desktop : sidebar fixe compacte ─────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent pathname={pathname} email={email} />
      </aside>

      {/* ── Mobile : barre supérieure + hamburger ───────────── */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-djamiyah.svg" alt="Djamiyah Group" className="h-9 w-9" />
            <span className="text-base font-bold text-gray-900 leading-tight">
              Djamiyah
              <span className="block text-xs font-medium text-gray-500">Espace Staff</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="p-2 -mr-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Mobile : drawer overlay ─────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Espace Staff"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="absolute top-4 right-4 z-10 p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <SidebarContent
              pathname={pathname}
              email={email}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
