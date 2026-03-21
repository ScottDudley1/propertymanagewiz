import { createClient } from '@/lib/supabase-server'
import WizardClient from '@/components/wizard/WizardClient'
import type { Metadata } from 'next'
import type { Vendor, VendorBundle } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Find Your Property Management Software — PropertyManageWiz',
  description:
    'Answer 10 questions and get a personalised property management software recommendation. No AI guesswork, no affiliate bias — just deterministic logic.',
}

export const dynamic = 'force-dynamic'

export default async function WizardPage() {
  const supabase = createClient()

  const [
    { data: questions },
    { data: vendors },
    { data: rules },
    { data: targets },
    { data: portfolioRanges },
    { data: geographies },
    { data: propertyTypes },
    { data: features },
  ] = await Promise.all([
    supabase
      .from('de_wizard_questions')
      .select('*')
      .eq('active', true)
      .order('display_order'),
    supabase.from('de_vendors').select('*').eq('active', true),
    supabase
      .from('de_decision_rules')
      .select('*')
      .eq('active', true)
      .order('rule_order'),
    supabase.from('de_vendor_target_profiles').select('*'),
    supabase.from('de_vendor_portfolio_ranges').select('*'),
    supabase.from('de_vendor_geographies').select('*'),
    supabase.from('de_vendor_property_types').select('*'),
    supabase.from('de_vendor_features').select('*'),
  ])

  const vendorBundles: VendorBundle[] = (vendors || []).map((v: Vendor) => ({
    vendor: v,
    targets: (targets || []).filter(
      (t: { vendor_id: number }) => t.vendor_id === v.id
    ),
    portfolioRanges: (portfolioRanges || []).filter(
      (r: { vendor_id: number }) => r.vendor_id === v.id
    ),
    geographies: (geographies || []).filter(
      (g: { vendor_id: number }) => g.vendor_id === v.id
    ),
    propertyTypes: (propertyTypes || []).filter(
      (pt: { vendor_id: number }) => pt.vendor_id === v.id
    ),
    features: (features || []).filter(
      (f: { vendor_id: number }) => f.vendor_id === v.id
    ),
  }))

  return (
    <WizardClient
      questions={questions || []}
      vendorBundles={vendorBundles}
      rules={rules || []}
    />
  )
}
