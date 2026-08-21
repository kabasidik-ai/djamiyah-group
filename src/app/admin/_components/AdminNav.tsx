'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '../actions'

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/room-reservations', label: 'Chambres' },
  { href: '/admin/conference-reservations', label: 'Salles de conférence' },
] as const

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Title */}
          <Link href="/admin" className="text-lg font-bold text-gray-900 shrink-0">
            Djamiyah Staff
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-gray-500 truncate max-w-[180px]">
              {email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
