import { createClient } from '@/lib/supabase-server'
import VendorGrid from '@/components/vendors/VendorGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Management Software — Compare All Vendors | PropertyManageWiz',
  description: 'Compare property management software platforms. Filter by portfolio size, property type, budget and location. Free, unbiased recommendations.',
}

export const revalidate = 3600 // revalidate every hour

export default async function VendorsPage() {
  const supabase = createClient()

  const [{ data: vendors }, { data: geographies }, { data: ranges }] = await Promise.all([
    supabase.from('de_vendors').select('id, name, slug, tagline, market_position, pricing_model, pricing_from, pricing_currency, free_trial').eq('active', true).order('name'),
    supabase.from('de_vendor_geographies').select('vendor_id, country_code'),
    supabase.from('de_vendor_portfolio_ranges').select('vendor_id, range_label, is_sweet_spot').eq('is_sweet_spot', true),
  ])

  const geoMap = new Map<number, string[]>()
  for (const g of geographies || []) {
    const arr = geoMap.get(g.vendor_id) || []
    arr.push(g.country_code)
    geoMap.set(g.vendor_id, arr)
  }

  const sweetMap = new Map<number, string>()
  for (const r of ranges || []) {
    if (!sweetMap.has(r.vendor_id)) sweetMap.set(r.vendor_id, r.range_label)
  }

  const cards = (vendors || []).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    tagline: v.tagline,
    market_position: v.market_position,
    pricing_model: v.pricing_model,
    pricing_from: v.pricing_from,
    pricing_currency: v.pricing_currency,
    free_trial: v.free_trial,
    geographies: geoMap.get(v.id) || [],
    sweet_spot: sweetMap.get(v.id) || null,
  }))

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Property Management Software</h1>
          <p className="text-lg text-gray-500">
            Compare {cards.length} property management software platforms. Filter by portfolio size, property type, budget and location.
          </p>
        </div>
        <VendorGrid vendors={cards} />
      </div>
    </div>
  )
}
