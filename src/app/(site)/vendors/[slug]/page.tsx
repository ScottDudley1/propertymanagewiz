import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = createClient()
  const { slug } = await params
  const { data: vendor } = await supabase
    .from('de_vendors')
    .select('name, tagline, pricing_from, pricing_currency, market_position')
    .eq('slug', slug)
    .single()

  const name = vendor?.name || slug
  const price = vendor?.pricing_from
    ? `From ${vendor.pricing_currency === 'AUD' ? 'A$' : '$'}${vendor.pricing_from}/month`
    : 'Quote-based pricing'

  return {
    title: `${name} Review 2026 — Pricing, Features & Alternatives | PropertyManageWiz`,
    description: `Detailed ${name} review covering pricing, features, pros and cons. ${price}. See how ${name} compares to alternatives and find out if it's right for your portfolio.`,
  }
}

/* ─── Helpers ─── */

const MARKET_BADGES: Record<string, { label: string; cls: string }> = {
  budget: { label: 'Budget', cls: 'bg-green-100 text-green-700' },
  mid_market: { label: 'Mid Market', cls: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-orange-100 text-orange-700' },
}

const PRICING_MODEL_LABELS: Record<string, string> = {
  per_unit: 'Per Unit',
  flat_rate: 'Flat Rate',
  tiered: 'Tiered',
  quote_based: 'Quote Based',
  freemium: 'Freemium',
  hybrid: 'Hybrid',
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
  none: { label: 'None', cls: 'bg-red-100 text-red-600' },
}

const INTEGRATION_TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  native: { label: 'Native', cls: 'bg-green-100 text-green-700' },
  api: { label: 'API', cls: 'bg-blue-100 text-blue-700' },
  zapier: { label: 'Zapier', cls: 'bg-orange-100 text-orange-700' },
  manual: { label: 'Manual', cls: 'bg-gray-100 text-gray-500' },
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  AU: 'Australia',
  CA: 'Canada',
  NZ: 'New Zealand',
  IE: 'Ireland',
  ZA: 'South Africa',
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
  if (vendor.pricing_model === 'quote_based') return 'Quote-based pricing'
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
    { data: integrations },
  ] = await Promise.all([
    supabase.from('de_vendor_target_profiles').select('*').eq('vendor_id', vendor.id).order('fit_score', { ascending: false }),
    supabase.from('de_vendor_property_types').select('*').eq('vendor_id', vendor.id).order('property_type'),
    supabase.from('de_vendor_portfolio_ranges').select('*').eq('vendor_id', vendor.id).order('units_min'),
    supabase.from('de_vendor_geographies').select('*').eq('vendor_id', vendor.id).order('country_code'),
    supabase.from('de_vendor_pros_cons').select('*').eq('vendor_id', vendor.id).order('display_order'),
    supabase.from('de_vendor_affiliate_programmes').select('*').eq('vendor_id', vendor.id).limit(1),
    supabase.from('de_vendor_integrations').select('*').eq('vendor_id', vendor.id),
  ])

  const marketBadge = vendor.market_position ? MARKET_BADGES[vendor.market_position] : null
  const price = formatPrice(vendor)
  const bestFor = (targets || []).filter((t: { fit_score: number | null }) => (t.fit_score ?? 0) >= 3)
  const pros = (prosCons || []).filter((p: { type: string }) => p.type === 'pro')
  const cons = (prosCons || []).filter((p: { type: string }) => p.type === 'con')
  const hasProsCons = pros.length > 0 || cons.length > 0
  const aff = affiliate && affiliate.length > 0 ? affiliate[0] : null

  // Group integrations by category
  const integrationsByCategory = new Map<string, typeof integrations>()
  for (const intg of integrations || []) {
    const cat = intg.integration_category || 'Other'
    const arr = integrationsByCategory.get(cat) || []
    arr.push(intg)
    integrationsByCategory.set(cat, arr)
  }
  const hasIntegrations = (integrations || []).length > 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: vendor.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: vendor.website,
    description: vendor.tagline,
    ...(vendor.pricing_from ? {
      offers: {
        '@type': 'Offer',
        price: vendor.pricing_from,
        priceCurrency: vendor.pricing_currency || 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: vendor.pricing_from,
          priceCurrency: vendor.pricing_currency || 'USD',
          unitText: vendor.pricing_per || 'month',
        },
      },
    } : {}),
  }

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link href="/vendors" className="text-sm text-violet-500 hover:text-violet-600">← All Software</Link>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{vendor.name}</h1>
            {marketBadge && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${marketBadge.cls}`}>
                {marketBadge.label}
              </span>
            )}
            {vendor.free_trial && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                Free Trial{vendor.free_trial_days ? ` · ${vendor.free_trial_days} days` : ''}
              </span>
            )}
            {vendor.pricing_model && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {PRICING_MODEL_LABELS[vendor.pricing_model] || formatLabel(vendor.pricing_model)}
              </span>
            )}
          </div>
          {vendor.tagline && (
            <p className="text-lg text-gray-500 mb-4">{vendor.tagline}</p>
          )}
          {price && (
            <p className="text-lg font-semibold text-gray-900 mb-6">{price}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {vendor.website && vendor.free_trial && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-violet-600 transition-colors"
              >
                Start Free Trial →
              </a>
            )}
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className={vendor.free_trial
                  ? 'bg-white text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
                  : 'bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-violet-600 transition-colors'
                }
              >
                Visit Website →
              </a>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            Not sure if {vendor.name} is right for you?{' '}
            <Link href="/wizard" className="text-violet-500 hover:text-violet-600 font-medium">Take our 2-minute quiz →</Link>
          </p>
        </div>

        {/* Quick Facts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12">
          {vendor.founded_year && (
            <QuickFact label="Founded" value={String(vendor.founded_year)} />
          )}
          {vendor.hq_country && (
            <QuickFact label="Headquarters" value={COUNTRY_NAMES[vendor.hq_country] || vendor.hq_country} />
          )}
          {vendor.market_position && (
            <QuickFact label="Segment" value={formatLabel(vendor.market_position)} />
          )}
          {price && (
            <QuickFact label="Pricing" value={price} />
          )}
          <QuickFact
            label="Free Trial"
            value={vendor.free_trial ? (vendor.free_trial_days ? `Yes · ${vendor.free_trial_days} days` : 'Yes') : 'No'}
          />
        </div>

        {/* Best For */}
        {bestFor.length > 0 && (
          <Section title="Best For">
            <div className="flex flex-wrap gap-2">
              {bestFor.map((t: { target_type: string; fit_score: number | null }) => {
                const score = t.fit_score ?? 0
                const cls = score >= 5
                  ? 'bg-violet-500 text-white'
                  : score >= 4
                    ? 'bg-white text-violet-600 border border-violet-300'
                    : 'bg-white text-gray-600 border border-gray-200'
                return (
                  <span key={t.target_type} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cls}`}>
                    {formatLabel(t.target_type)}
                    <span className={score >= 5 ? 'text-violet-200 text-xs' : 'text-gray-400 text-xs'}>({score}/5)</span>
                  </span>
                )
              })}
            </div>
            {bestFor.some((t: { fit_notes: string | null }) => t.fit_notes) && (
              <div className="mt-4 space-y-2">
                {bestFor.filter((t: { fit_notes: string | null }) => t.fit_notes).map((t: { target_type: string; fit_notes: string | null }) => (
                  <p key={t.target_type} className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{formatLabel(t.target_type)}:</span> {t.fit_notes}
                  </p>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Pricing */}
        {(price || vendor.pricing_notes) && (
          <Section title="Pricing">
            {price && <p className="text-lg font-semibold text-gray-900 mb-2">{price}</p>}
            {vendor.pricing_model && (
              <p className="text-sm text-gray-500 mb-1">
                Model: <span className="text-gray-700 font-medium">{PRICING_MODEL_LABELS[vendor.pricing_model] || formatLabel(vendor.pricing_model)}</span>
              </p>
            )}
            {vendor.pricing_notes && <p className="text-sm text-gray-500 mt-2">{vendor.pricing_notes}</p>}
            {vendor.free_trial && vendor.free_trial_days && (
              <p className="text-sm text-violet-500 mt-2 font-medium">{vendor.free_trial_days}-day free trial available</p>
            )}
            {vendor.contract_required != null && (
              <p className="text-sm text-gray-500 mt-1">
                Contract: <span className="text-gray-700 font-medium">{vendor.contract_required ? 'Required' : 'No contract required'}</span>
              </p>
            )}
          </Section>
        )}

        {/* Property Types */}
        {propertyTypes && propertyTypes.length > 0 && (
          <Section title="Property Types">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {propertyTypes.map((pt: { property_type: string; support_level: string | null; notes: string | null }) => {
                const badge = pt.support_level ? SUPPORT_BADGES[pt.support_level] : null
                return (
                  <div key={pt.property_type} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 font-medium">{formatLabel(pt.property_type)}</span>
                      {pt.notes && <p className="text-xs text-gray-400 mt-0.5">{pt.notes}</p>}
                    </div>
                    {badge && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
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
          <Section title="Portfolio Size">
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
                  {ranges.map((r: { range_label: string; units_min: number | null; units_max: number | null; pricing_at_range: string | null; is_sweet_spot: boolean }) => (
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">★ Sweet Spot</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ranges.some((r: { notes: string | null }) => r.notes) && (
              <div className="mt-3 space-y-1">
                {ranges.filter((r: { notes: string | null }) => r.notes).map((r: { range_label: string; notes: string | null }) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {geographies.map((g: { country_code: string; compliance_level: string | null; local_support: boolean; notes: string | null }) => {
                const badge = g.compliance_level ? COMPLIANCE_BADGES[g.compliance_level] : null
                return (
                  <div key={g.country_code} className="px-4 py-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-gray-900">{g.country_code}</span>
                      <span className="text-sm text-gray-500">{COUNTRY_NAMES[g.country_code] || ''}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {badge && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                      {g.local_support && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          Local Support
                        </span>
                      )}
                    </div>
                    {g.notes && <p className="text-xs text-gray-400 mt-1.5">{g.notes}</p>}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* Integrations */}
        {hasIntegrations && (
          <Section title="Integrations">
            <div className="space-y-4">
              {Array.from(integrationsByCategory.entries()).map(([category, intgs]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{formatLabel(category)}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(intgs || []).map((intg: { integration_slug: string; integration_name: string; integration_type: string | null }) => {
                      const badge = intg.integration_type ? INTEGRATION_TYPE_BADGES[intg.integration_type] : null
                      return (
                        <span key={intg.integration_slug} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 text-sm">
                          <span className="text-gray-700">{intg.integration_name}</span>
                          {badge && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
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
                    {pros.map((p: { id: number; content: string; category: string | null }) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">+</span>
                        <div>
                          <p className="text-sm text-gray-700">{p.content}</p>
                          {p.category && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 mt-1">
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
                    {cons.map((p: { id: number; content: string; category: string | null }) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="text-red-500 mt-0.5 flex-shrink-0 font-bold">−</span>
                        <div>
                          <p className="text-sm text-gray-700">{p.content}</p>
                          {p.category && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 mt-1">
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
        <div className="mt-16 bg-violet-50 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Is {vendor.name} right for you?
          </h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            Answer 10 questions and get a personalised recommendation that compares {vendor.name} against 6 other platforms.
          </p>
          <Link
            href="/wizard"
            className="bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-600 transition-colors inline-block"
          >
            Find My Best Match →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Quick Fact Card ─── */

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-gray-100 text-center">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
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
