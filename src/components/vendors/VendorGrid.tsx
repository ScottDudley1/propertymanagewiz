'use client'

import { useState } from 'react'
import Link from 'next/link'

type VendorCard = {
  id: number
  name: string
  slug: string
  tagline: string | null
  market_position: string | null
  pricing_model: string | null
  pricing_from: number | null
  pricing_currency: string | null
  free_trial: boolean
  geographies: string[]
  sweet_spot: string | null
}

const MARKET_BADGES: Record<string, { label: string; cls: string }> = {
  budget: { label: 'Budget', cls: 'bg-green-100 text-green-700' },
  mid_market: { label: 'Mid Market', cls: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-orange-100 text-orange-700' },
}

function formatPrice(vendor: VendorCard) {
  if (vendor.pricing_model === 'quote_based') return 'Quote-based'
  if (vendor.pricing_from != null) {
    const sym = vendor.pricing_currency === 'AUD' ? 'A$' : '$'
    return `From ${sym}${vendor.pricing_from}/mo`
  }
  return null
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

export default function VendorGrid({ vendors }: { vendors: VendorCard[] }) {
  const [market, setMarket] = useState('all')
  const [geo, setGeo] = useState('all')
  const [trial, setTrial] = useState('all')

  const filtered = vendors.filter((v) => {
    if (market !== 'all' && v.market_position !== market) return false
    if (geo !== 'all' && !v.geographies.includes(geo)) return false
    if (trial === 'yes' && !v.free_trial) return false
    return true
  })

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Positions</option>
          <option value="budget">Budget</option>
          <option value="mid_market">Mid Market</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={geo}
          onChange={(e) => setGeo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Regions</option>
          <option value="AU">Australia</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="NZ">New Zealand</option>
          <option value="CA">Canada</option>
        </select>
        <select
          value={trial}
          onChange={(e) => setTrial(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Free Trial: Any</option>
          <option value="yes">Free Trial Only</option>
        </select>
        <span className="text-sm text-gray-400 self-center ml-auto">
          {filtered.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No vendors match your filters. Try broadening your selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((v) => {
            const badge = v.market_position ? MARKET_BADGES[v.market_position] : null
            const price = formatPrice(v)
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{v.name}</h3>
                  {badge && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {v.tagline && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{v.tagline}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {price && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {price}
                    </span>
                  )}
                  {v.free_trial && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      Free Trial
                    </span>
                  )}
                </div>
                {v.geographies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {v.geographies.slice(0, 3).map((g) => (
                      <span key={g} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                        {g}
                      </span>
                    ))}
                    {v.geographies.length > 3 && (
                      <span className="text-xs text-gray-400 self-center">+{v.geographies.length - 3}</span>
                    )}
                  </div>
                )}
                {v.sweet_spot && (
                  <p className="text-xs text-gray-400 mb-4">
                    Sweet spot: <span className="text-gray-600 font-medium">{formatRange(v.sweet_spot)}</span>
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <Link
                    href={`/vendors/${v.slug}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
