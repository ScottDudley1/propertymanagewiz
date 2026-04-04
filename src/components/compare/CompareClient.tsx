'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Vendor } from '@/lib/types'

/* ─── Badge maps ─── */

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
  none: { label: 'None', cls: 'bg-red-100 text-red-600' },
}

/* ─── Helpers ─── */

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatPrice(v: Vendor) {
  if (v.pricing_model === 'quote_based') return 'Quote-based'
  if (v.pricing_model === 'freemium' && v.pricing_from === 0) return 'Free'
  const sym = v.pricing_currency === 'AUD' ? 'A$' : '$'
  if (v.pricing_from != null) {
    const per = v.pricing_per ? `/${v.pricing_per}` : '/mo'
    return `${sym}${v.pricing_from}${per}`
  }
  return '—'
}

const RANGE_LABELS: Record<string, string> = {
  micro_1_5: '1–5 units',
  small_6_20: '6–20 units',
  growing_21_50: '21–50 units',
  medium_51_200: '51–200 units',
  large_201_500: '201–500 units',
  portfolio_501_1000: '501–1,000 units',
  enterprise_1001_plus: '1,001+ units',
}

const RANGE_KEYS = Object.keys(RANGE_LABELS)

const PROPERTY_TYPES = [
  { key: 'residential_rental', label: 'Residential Rental' },
  { key: 'commercial_office', label: 'Commercial Office' },
  { key: 'commercial_retail', label: 'Commercial Retail' },
  { key: 'short_term_rental', label: 'Short-Term Rental' },
  { key: 'hoa_strata', label: 'HOA / Strata' },
  { key: 'mixed_use', label: 'Mixed Use' },
]

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'CA', name: 'Canada' },
]

const Dash = () => <span className="text-gray-300">—</span>

/* ─── Types for comparison data ─── */

type TargetProfile = { vendor_id: number; target_type: string; fit_score: number | null }
type PropertyType = { vendor_id: number; property_type: string; support_level: string | null }
type PortfolioRange = { vendor_id: number; range_label: string; is_sweet_spot: boolean }
type Geography = { vendor_id: number; country_code: string; compliance_level: string | null; local_support: boolean }

type ComparisonData = {
  targets: TargetProfile[]
  propTypes: PropertyType[]
  ranges: PortfolioRange[]
  geos: Geography[]
}

/* ─── Inner component that uses useSearchParams ─── */

function CompareInner({ vendors }: { vendors: Vendor[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize from URL
  const urlSlugs = (searchParams.get('vendors') || '').split(',').filter(Boolean)
  const validUrlSlugs = urlSlugs.filter((s) => vendors.some((v) => v.slug === s))

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(validUrlSlugs)
  const [mode, setMode] = useState<'select' | 'compare'>(
    validUrlSlugs.length >= 2 ? 'compare' : 'select'
  )
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedVendors = vendors.filter((v) => selectedSlugs.includes(v.slug))

  const fetchComparisonData = useCallback(async (ids: number[]) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const [{ data: targets }, { data: propTypes }, { data: ranges }, { data: geos }] = await Promise.all([
        supabase.from('de_vendor_target_profiles').select('vendor_id, target_type, fit_score').in('vendor_id', ids).order('fit_score', { ascending: false }),
        supabase.from('de_vendor_property_types').select('vendor_id, property_type, support_level').in('vendor_id', ids),
        supabase.from('de_vendor_portfolio_ranges').select('vendor_id, range_label, is_sweet_spot').in('vendor_id', ids),
        supabase.from('de_vendor_geographies').select('vendor_id, country_code, compliance_level, local_support').in('vendor_id', ids),
      ])
      setComparisonData({
        targets: (targets || []) as TargetProfile[],
        propTypes: (propTypes || []) as PropertyType[],
        ranges: (ranges || []) as PortfolioRange[],
        geos: (geos || []) as Geography[],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch when entering compare mode from URL
  useEffect(() => {
    if (mode === 'compare' && !comparisonData && selectedVendors.length >= 2) {
      fetchComparisonData(selectedVendors.map((v) => v.id))
    }
  }, [mode, comparisonData, selectedVendors, fetchComparisonData])

  function toggleVendor(slug: string) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 3) return prev
      return [...prev, slug]
    })
  }

  function enterCompare() {
    if (selectedSlugs.length < 2) return
    router.replace(`/compare?vendors=${selectedSlugs.join(',')}`, { scroll: false })
    setMode('compare')
    setComparisonData(null)
    fetchComparisonData(selectedVendors.map((v) => v.id))
  }

  function changeSelection() {
    setMode('select')
    setComparisonData(null)
  }

  /* ─── Mode 1: Selection Grid ─── */
  if (mode === 'select') {
    const maxed = selectedSlugs.length >= 3

    return (
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Compare Property Management Software
            </h1>
            <p className="text-lg text-gray-500">
              Select 2 or 3 platforms to compare side by side
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {vendors.map((v) => {
              const selected = selectedSlugs.includes(v.slug)
              const disabled = maxed && !selected
              const badge = v.market_position ? MARKET_BADGES[v.market_position] : null

              return (
                <button
                  key={v.slug}
                  type="button"
                  onClick={() => toggleVendor(v.slug)}
                  disabled={disabled}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-violet-500 bg-violet-50'
                      : disabled
                        ? 'border-gray-100 bg-white opacity-40 cursor-not-allowed'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                      selected
                        ? 'bg-violet-500 border-violet-500 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected && '✓'}
                  </span>

                  <span className="block text-sm font-semibold text-gray-900 mb-1 pr-6">{v.name}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {badge && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatPrice(v)}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={enterCompare}
              disabled={selectedSlugs.length < 2}
              className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                selectedSlugs.length >= 2
                  ? 'bg-violet-500 text-white hover:bg-violet-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Compare Selected →
            </button>
            {selectedSlugs.length === 1 && (
              <p className="text-sm text-gray-400 mt-2">Select at least one more platform</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ─── Mode 2: Comparison Table ─── */
  const cols = selectedVendors

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {cols.map((v) => v.name).join(' vs ')}
          </h1>
          <button
            type="button"
            onClick={changeSelection}
            className="text-sm text-violet-500 hover:text-violet-600 font-medium"
          >
            ← Change Selection
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-3 text-sm">Loading comparison data...</p>
          </div>
        ) : comparisonData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              {/* Sticky vendor header */}
              <thead>
                <tr className="sticky top-0 bg-white z-10 border-b-2 border-gray-100">
                  <th className="text-left py-3 pr-4 w-[180px]" />
                  {cols.map((v) => (
                    <th key={v.slug} className="text-left py-3 px-3 font-semibold text-gray-900">
                      {v.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ── Overview ── */}
                <SectionHeader label="Overview" colSpan={cols.length + 1} />
                <Row label="Market Position" cols={cols} render={(v) => {
                  const b = v.market_position ? MARKET_BADGES[v.market_position] : null
                  return b ? <Badge cls={b.cls}>{b.label}</Badge> : <Dash />
                }} />
                <Row label="Tagline" cols={cols} render={(v) => (
                  <span className="text-gray-500 text-xs">{v.tagline || <Dash />}</span>
                )} />
                <Row label="Website" cols={cols} render={(v) => v.website ? (
                  <a href={`${v.website}${v.website.includes('?') ? '&' : '?'}utm_source=propertymanagewiz&utm_medium=compare&utm_campaign=cta&utm_content=${v.slug}`} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-600 text-xs font-medium">
                    Visit →
                  </a>
                ) : <Dash />} />

                {/* ── Pricing ── */}
                <SectionHeader label="Pricing" colSpan={cols.length + 1} />
                <Row label="Model" cols={cols} render={(v) => (
                  <span className="text-gray-700">{v.pricing_model ? formatLabel(v.pricing_model) : <Dash />}</span>
                )} />
                <Row label="Starting Price" cols={cols} render={(v) => (
                  <span className="text-gray-700 font-medium">{formatPrice(v)}</span>
                )} />
                <Row label="Free Trial" cols={cols} render={(v) => (
                  <span className={v.free_trial ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {v.free_trial ? 'Yes' : 'No'}
                  </span>
                )} />
                <Row label="Trial Days" cols={cols} render={(v) => (
                  v.free_trial && v.free_trial_days
                    ? <span className="text-gray-700">{v.free_trial_days} days</span>
                    : <Dash />
                )} />
                <Row label="Contract Required" cols={cols} render={(v) => (
                  v.contract_required != null
                    ? <span className={v.contract_required ? 'text-red-500' : 'text-green-600 font-medium'}>
                        {v.contract_required ? 'Yes' : 'No'}
                      </span>
                    : <Dash />
                )} />

                {/* ── Best For ── */}
                <SectionHeader label="Best For" colSpan={cols.length + 1} />
                <Row label="Top Profiles" cols={cols} render={(v) => {
                  const vTargets = comparisonData.targets
                    .filter((t) => t.vendor_id === v.id)
                    .slice(0, 3)
                  return vTargets.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {vTargets.map((t) => (
                        <span key={t.target_type} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                          {formatLabel(t.target_type)}
                        </span>
                      ))}
                    </div>
                  ) : <Dash />
                }} />

                {/* ── Property Types ── */}
                <SectionHeader label="Property Types" colSpan={cols.length + 1} />
                {PROPERTY_TYPES.map((pt) => (
                  <Row key={pt.key} label={pt.label} cols={cols} render={(v) => {
                    const match = comparisonData.propTypes.find(
                      (p) => p.vendor_id === v.id && p.property_type === pt.key
                    )
                    if (!match || !match.support_level) return <Dash />
                    const b = SUPPORT_BADGES[match.support_level]
                    return b ? <Badge cls={b.cls}>{b.label}</Badge> : <Dash />
                  }} />
                ))}

                {/* ── Portfolio Size ── */}
                <SectionHeader label="Portfolio Size" colSpan={cols.length + 1} />
                {RANGE_KEYS.map((rk) => (
                  <Row key={rk} label={RANGE_LABELS[rk]} cols={cols} render={(v) => {
                    const match = comparisonData.ranges.find(
                      (r) => r.vendor_id === v.id && r.range_label === rk
                    )
                    if (!match) return <Dash />
                    return match.is_sweet_spot
                      ? <span className="text-violet-500 font-medium">★</span>
                      : <span className="text-green-500">✓</span>
                  }} />
                ))}

                {/* ── Geographic Coverage ── */}
                <SectionHeader label="Geographic Coverage" colSpan={cols.length + 1} />
                {COUNTRIES.map((c) => (
                  <Row key={c.code} label={`${c.code} · ${c.name}`} cols={cols} render={(v) => {
                    const match = comparisonData.geos.find(
                      (g) => g.vendor_id === v.id && g.country_code === c.code
                    )
                    if (!match || !match.compliance_level) return <Dash />
                    const b = COMPLIANCE_BADGES[match.compliance_level]
                    return b ? <Badge cls={b.cls}>{b.label}</Badge> : <Dash />
                  }} />
                ))}

                {/* ── Key Facts ── */}
                <SectionHeader label="Key Facts" colSpan={cols.length + 1} />
                <Row label="Free Plan" cols={cols} render={(v) => (
                  <span className={v.free_plan ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {v.free_plan ? 'Yes' : 'No'}
                  </span>
                )} />
                <Row label="Free Trial" cols={cols} render={(v) => (
                  <span className={v.free_trial ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {v.free_trial ? 'Yes' : 'No'}
                  </span>
                )} />
                <Row label="Contract Required" cols={cols} render={(v) => (
                  v.contract_required != null
                    ? <span className={v.contract_required ? 'text-red-500' : 'text-green-600 font-medium'}>
                        {v.contract_required ? 'Yes' : 'No'}
                      </span>
                    : <Dash />
                )} />
                <Row label="Market Position" cols={cols} render={(v) => {
                  const b = v.market_position ? MARKET_BADGES[v.market_position] : null
                  return b ? <Badge cls={b.cls}>{b.label}</Badge> : <Dash />
                }} />

                {/* ── CTA Row ── */}
                <tr className="border-t-2 border-gray-100">
                  <td className="py-4 pr-4" />
                  {cols.map((v) => (
                    <td key={v.slug} className="py-4 px-3">
                      <div className="flex flex-col gap-2">
                        {v.website && (
                          <a
                            href={`${v.website}${v.website.includes('?') ? '&' : '?'}utm_source=propertymanagewiz&utm_medium=compare&utm_campaign=cta&utm_content=${v.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-violet-600 transition-colors"
                          >
                            {v.free_trial ? 'Start Free Trial →' : 'Visit Website →'}
                          </a>
                        )}
                        <Link
                          href={`/vendors/${v.slug}`}
                          className="text-center text-xs text-violet-500 hover:text-violet-600 font-medium"
                        >
                          View Full Profile →
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Bottom CTA */}
        <div className="mt-12 bg-violet-50 rounded-2xl p-8 text-center">
          <p className="text-gray-700 mb-4">
            Looking for a personalised recommendation? Our decision wizard compares all {vendors.length} platforms against your specific requirements.
          </p>
          <Link
            href="/wizard"
            className="bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-600 transition-colors inline-block"
          >
            Take the Decision Wizard →
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Table helpers ─── */

function SectionHeader({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pt-6 pb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </td>
    </tr>
  )
}

function Row({ label, cols, render }: { label: string; cols: Vendor[]; render: (v: Vendor) => React.ReactNode }) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-2.5 pr-4 text-gray-500 font-medium whitespace-nowrap">{label}</td>
      {cols.map((v) => (
        <td key={v.slug} className="py-2.5 px-3">{render(v)}</td>
      ))}
    </tr>
  )
}

function Badge({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}

/* ─── Wrapper with Suspense for useSearchParams ─── */

export default function CompareClient({ vendors }: { vendors: Vendor[] }) {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CompareInner vendors={vendors} />
    </Suspense>
  )
}
