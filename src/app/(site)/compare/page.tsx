import { createClient } from '@/lib/supabase-server'
import CompareClient from '@/components/compare/CompareClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Property Management Software 2026 | PropertyManageWiz',
  description: 'Compare property management software side by side. See pricing, features, and suitability across 11 platforms to find the best fit for your portfolio.',
}

export const dynamic = 'force-dynamic'

export default async function ComparePage() {
  const supabase = createClient()
  const { data: vendors } = await supabase
    .from('de_vendors')
    .select('*')
    .eq('active', true)
    .order('name')

  return <CompareClient vendors={vendors || []} />
}
