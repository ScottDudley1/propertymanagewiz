'use server'

import { createAuthClient } from '@/lib/supabase-server-auth'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
