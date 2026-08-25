import { requireAdmin } from '@/lib/adminAuth'
import { AdminNav } from './AdminNav'

/**
 * Wrapper serveur pour toutes les pages admin authentifiées.
 * Vérifie la session + allowlist, puis affiche la sidebar + children.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav email={admin.email} />
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  )
}
