import { createClient, hasSupabaseConfig } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

/* ─── Static generation ─── */

export async function generateStaticParams() {
  if (!hasSupabaseConfig()) return []
  const supabase = createClient()
  const { data } = await supabase.from('de_vendors').select('slug').eq('active', true)
  return (data || []).map((v) => ({ slug: v.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()
  const { data: vendor } = await supabase.from('de_vendors').select('name, tagline').eq('slug', slug).single()
  return {
    title: `${vendor?.name} Review 2026 — PropertyManageWiz`,
    description: vendor?.tagline || `Read our detailed review of ${vendor?.name} property management software.`,
  }
}

export const revalidate = 3600

/* ─── Helpers ─── */

const MARKET_BADGES: Record<string, { label: string; cls: string }> = {
  budget: { label: 'Budget', cls: 'bg-green-100 text-green-700' },
  mid_market: { label: 'Mid Market', cls: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-orange-100 text-orange-700' },
}

const SUPPORT_BADGES: Record<string, { label: string; cls: string }> = {
  native: { label: 'Native', cls: 'bg-green-100 text-green-700' },
  supported: { label: 'Supported', cls: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700' },
  workaround: { label: 'Workaround', cls: 'bg-gray-100 text-gray-500' },
}

const COMPLIANCE_BADGES: Record<string, { label: string; cls: string }> = {
  native: { label: 'Native', cls: 'bg-green-100 text-green-700' },
  supported: { label: 'Supported', cls: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700' },
  none: { label: 'None', cls: 'bg-gray-100 text-gray-500' },
}

function formatRange(label: string) {
  const map: Record<string, string> = {
    micro_1_5: '1–5 units',
    small_6_20: '6–20 units',
    growing_21_50: '21–50 units',
    medium_51_200: '51–200 units',
    large_201_500: '201–500 units',
    portfolio_501_1000: '501–1,000 units',
    enterprise_1001_plus: '1,001+ units',
  }
  return map[label] || label
}

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatPrice(vendor: { pricing_model: string | null; pricing_from: number | null; pricing_to: number | null; pricing_currency: string | null; pricing_per: string | null }) {
  if (vendor.pricing_model === 'quote_based') return 'Quote-based'
  const sym = vendor.pricing_currency === 'AUD' ? 'A$' : '$'
  const parts: string[] = []
  if (vendor.pricing_from != null) parts.push(`From ${sym}${vendor.pricing_from}`)
  if (vendor.pricing_to != null) parts.push(`to ${sym}${vendor.pricing_to}`)
  if (vendor.pricing_per) parts.push(`per ${vendor.pricing_per}`)
  return parts.length > 0 ? parts.join(' ') : null
}

/* ─── Page ─── */

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()

  const { data: vendor } = await supabase.from('de_vendors').select('*').eq('slug', slug).single()
  if (!vendor) notFound()

  const [
    { data: targets },
    { data: propertyTypes },
    { data: ranges },
    { data: geographies },
    { data: prosCons },
    { data: affiliate },
  ] = await Promise.all([
    supabase.from('de_vendor_target_profiles').select('*').eq('vendor_id', vendor.id).order('fit_score', { ascending: false }),
    supabase.from('de_vendor_property_types').select('*').eq('vendor_id', vendor.id).order('property_type'),
    supabase.from('de_vendor_portfolio_ranges').select('*').eq('vendor_id', vendor.id).order('units_min'),
    supabase.from('de_vendor_geographies').select('*').eq('vendor_id', vendor.id).order('country_code'),
    supabase.from('de_vendor_pros_cons').select('*').eq('vendor_id', vendor.id).order('type'),
    supabase.from('de_vendor_affiliate_programmes').select('*').eq('vendor_id', vendor.id).limit(1),
  ])

  const marketBadge = vendor.market_position ? MARKET_BADGES[vendor.market_position] : null
  const price = formatPrice(vendor)
  const bestFor = (targets || []).filter((t) => t.fit_score >= 4)
  const pros = (prosCons || []).filter((p) => p.type === 'pro')
  const cons = (prosCons || []).filter((p) => p.type === 'con')
  const hasProsCons = pros.length > 0 || cons.length > 0
  const aff = affiliate && affiliate.length > 0 ? affiliate[0] : null

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/vendors" className="text-sm text-indigo-600 hover:text-indigo-700">← All Software</Link>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{vendor.name}</h1>
            {marketBadge && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${marketBadge.cls}`}>
                {marketBadge.label}
              </span>
            )}
            {vendor.free_trial && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                Free Trial{vendor.free_trial_days ? ` · ${vendor.free_trial_days} days` : ''}
              </span>
            )}
          </div>
          {vendor.tagline && (
            <p className="text-lg text-gray-500 mb-6">{vendor.tagline}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {vendor.free_trial ? 'Start Free Trial →' : 'Visit Website →'}
              </a>
            )}
            <Link
              href="/wizard"
              className="bg-white text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Find My Software →
            </Link>
          </div>
        </div>

        {/* Pricing */}
        {(price || vendor.pricing_notes) && (
          <Section title="Pricing">
            {price && <p className="text-lg font-semibold text-gray-900 mb-2">{price}</p>}
            {vendor.pricing_model && (
              <p className="text-sm text-gray-500 mb-1">
                Model: <span className="text-gray-700 font-medium">{formatLabel(vendor.pricing_model)}</span>
              </p>
            )}
            {vendor.pricing_notes && <p className="text-sm text-gray-500 mt-2">{vendor.pricing_notes}</p>}
            {vendor.free_trial && vendor.free_trial_days && (
              <p className="text-sm text-indigo-600 mt-2 font-medium">{vendor.free_trial_days}-day free trial available</p>
            )}
          </Section>
        )}

        {/* Best For */}
        {bestFor.length > 0 && (
          <Section title="Best For">
            <div className="flex flex-wrap gap-2">
              {bestFor.map((t) => (
                <span key={t.target_type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                  {formatLabel(t.target_type)}
                  <span className="text-indigo-400 text-xs">({t.fit_score}/5)</span>
                </span>
              ))}
            </div>
            {bestFor.some((t) => t.fit_notes) && (
              <div className="mt-4 space-y-2">
                {bestFor.filter((t) => t.fit_notes).map((t) => (
                  <p key={t.target_type} className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{formatLabel(t.target_type)}:</span> {t.fit_notes}
                  </p>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Property Types */}
        {propertyTypes && propertyTypes.length > 0 && (
          <Section title="Property Types">
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((pt) => {
                const badge = pt.support_level ? SUPPORT_BADGES[pt.support_level] : null
                return (
                  <div key={pt.property_type} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 text-sm">
                    <span className="text-gray-700 font-medium">{formatLabel(pt.property_type)}</span>
                    {badge && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Portfolio Ranges */}
        {ranges && ranges.length > 0 && (
          <Section title="Portfolio Ranges">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Range</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Units</th>
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Pricing</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((r) => (
                    <tr key={r.range_label} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 text-gray-700 font-medium">{formatRange(r.range_label)}</td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {r.units_min != null && r.units_max != null
                          ? `${r.units_min}–${r.units_max}`
                          : r.units_min != null
                            ? `${r.units_min}+`
                            : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">{r.pricing_at_range || '—'}</td>
                      <td className="py-2.5">
                        {r.is_sweet_spot ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Sweet Spot</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ranges.some((r) => r.notes) && (
              <div className="mt-3 space-y-1">
                {ranges.filter((r) => r.notes).map((r) => (
                  <p key={r.range_label} className="text-xs text-gray-400">
                    {formatRange(r.range_label)}: {r.notes}
                  </p>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Geographic Coverage */}
        {geographies && geographies.length > 0 && (
          <Section title="Geographic Coverage">
            <div className="flex flex-wrap gap-3">
              {geographies.map((g) => {
                const badge = g.compliance_level ? COMPLIANCE_BADGES[g.compliance_level] : null
                return (
                  <div key={g.country_code} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-700">{g.country_code}</span>
                    {badge && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                    {g.local_support && (
                      <span className="text-xs text-gray-400">Local support</span>
                    )}
                  </div>
                )
              })}
            </div>
            {geographies.some((g) => g.notes) && (
              <div className="mt-3 space-y-1">
                {geographies.filter((g) => g.notes).map((g) => (
                  <p key={g.country_code} className="text-xs text-gray-400">
                    {g.country_code}: {g.notes}
                  </p>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Pros & Cons */}
        {hasProsCons && (
          <Section title="Pros & Cons">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pros.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3">Pros</h4>
                  <ul className="space-y-3">
                    {pros.map((p) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                        <div>
                          <p className="text-sm text-gray-700">{p.content}</p>
                          {p.category && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 mt-1">
                              {formatLabel(p.category)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-3">Cons</h4>
                  <ul className="space-y-3">
                    {cons.map((p) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="text-red-500 mt-0.5 flex-shrink-0">−</span>
                        <div>
                          <p className="text-sm text-gray-700">{p.content}</p>
                          {p.category && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 mt-1">
                              {formatLabel(p.category)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 bg-indigo-50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Not sure if {vendor.name} is right for you?
          </h2>
          <p className="text-gray-500 mb-6">
            Use our decision wizard to find your perfect match based on your exact requirements.
          </p>
          <Link
            href="/wizard"
            className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
          >
            Find My Software →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Section wrapper ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </section>
  )
}
