import { getAuthUser } from '@/lib/supabase-server-auth'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  return (
    <AdminShell userEmail={user?.email || null}>
      {children}
    </AdminShell>
  )
}
