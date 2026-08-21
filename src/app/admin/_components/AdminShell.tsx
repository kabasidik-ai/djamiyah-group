import { requireAdmin } from '@/lib/adminAuth'
import { AdminNav } from './AdminNav'

/**
 * Wrapper serveur pour toutes les pages admin authentifiées.
 * Vérifie la session + allowlist, puis affiche la nav + children.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav email={admin.email} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  )
}
