'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { ScoredVendor } from '@/lib/types'

function buildTrackedUrl(baseUrl: string, medium: string, slug: string) {
  const sep = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${sep}utm_source=propertymanagewiz&utm_medium=${medium}&utm_campaign=recommendation&utm_content=${slug}`
}

const MARKET_BADGES: Record<string, { label: string; cls: string }> = {
  budget: { label: 'Budget', cls: 'bg-green-100 text-green-700' },
  mid_market: { label: 'Mid Market', cls: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', cls: 'bg-orange-100 text-orange-700' },
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'text-green-600 bg-green-50 border-green-200'
      : score >= 55
        ? 'text-blue-600 bg-blue-50 border-blue-200'
        : 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${color}`}
    >
      {score}% Match
    </span>
  )
}

function VendorCTA({ vendor, sessionId }: { vendor: ScoredVendor['vendor']; sessionId: string | null }) {
  if (!vendor.website) return null

  const handleClick = async () => {
    if (sessionId) {
      try {
        const supabase = createClient()
        await supabase
          .from('de_decision_sessions')
          .update({
            clicked_vendor_id: vendor.id,
            clicked_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      } catch {
        // Click tracking failure should not block navigation
      }
    }
  }

  return (
    <a
      href={buildTrackedUrl(vendor.website, 'wizard', vendor.slug)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-violet-600 transition-colors inline-block"
    >
      {vendor.free_trial ? 'Start Free Trial →' : 'Visit Website →'}
    </a>
  )
}

export default function WizardResults({
  scoredVendors,
  onStartOver,
  sessionId,
}: {
  scoredVendors: ScoredVendor[]
  onStartOver: () => void
  sessionId: string | null
}) {
  const [showExcluded, setShowExcluded] = useState(false)

  const recommended = scoredVendors.filter((sv) => !sv.excluded)
  const excluded = scoredVendors.filter((sv) => sv.excluded)
  const topPick = recommended[0]
  const runnerUps = recommended.slice(1)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Recommendations
        </h1>
        <p className="text-gray-500">
          Based on your answers, here are the best matches for your situation.
        </p>
      </div>

      {/* Top pick hero card */}
      {topPick && (
        <div className="mb-10 p-8 rounded-2xl border-2 border-violet-200 bg-white">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
              Top Recommendation
            </span>
            <ScoreBadge score={topPick.score} />
            {topPick.vendor.market_position &&
              MARKET_BADGES[topPick.vendor.market_position] && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MARKET_BADGES[topPick.vendor.market_position].cls}`}
                >
                  {MARKET_BADGES[topPick.vendor.market_position].label}
                </span>
              )}
            {topPick.vendor.free_trial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                Free Trial
                {topPick.vendor.free_trial_days
                  ? ` · ${topPick.vendor.free_trial_days}d`
                  : ''}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {topPick.vendor.name}
          </h2>
          {topPick.vendor.tagline && (
            <p className="text-gray-500 mb-4">{topPick.vendor.tagline}</p>
          )}

          {topPick.explanations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Why we recommend it
              </h3>
              <ul className="space-y-1.5">
                {topPick.explanations.map((exp, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">
                      +
                    </span>
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {topPick.warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Things to note
              </h3>
              <ul className="space-y-1.5">
                {topPick.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-600">
                    <span className="flex-shrink-0 mt-0.5">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <VendorCTA vendor={topPick.vendor} sessionId={sessionId} />
            <Link
              href={`/vendors/${topPick.vendor.slug}`}
              className="text-sm font-medium text-violet-500 hover:text-violet-600 transition-colors px-5 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              View Full Profile
            </Link>
          </div>
        </div>
      )}

      {/* Runner-ups */}
      {runnerUps.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Other Good Matches
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runnerUps.map((sv) => (
              <div
                key={sv.vendor.id}
                className="p-6 rounded-2xl border border-gray-100 bg-white flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-lg font-bold text-gray-900">
                    {sv.vendor.name}
                  </h4>
                  <ScoreBadge score={sv.score} />
                </div>
                {sv.vendor.tagline && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {sv.vendor.tagline}
                  </p>
                )}
                {sv.explanations.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {sv.explanations.slice(0, 3).map((exp, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-xs text-gray-500"
                      >
                        <span className="text-green-500 flex-shrink-0">+</span>
                        {exp}
                      </li>
                    ))}
                  </ul>
                )}
                {sv.warnings.length > 0 && (
                  <p className="text-xs text-amber-500 mb-4">
                    {sv.warnings.length} warning
                    {sv.warnings.length > 1 ? 's' : ''}
                  </p>
                )}
                <div className="mt-auto pt-3 flex flex-wrap gap-3">
                  <VendorCTA vendor={sv.vendor} sessionId={sessionId} />
                  <Link
                    href={`/vendors/${sv.vendor.slug}`}
                    className="text-sm font-medium text-violet-500 hover:text-violet-600 transition-colors"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excluded vendors */}
      {excluded.length > 0 && (
        <div className="mb-10">
          <button
            type="button"
            onClick={() => setShowExcluded(!showExcluded)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showExcluded ? '▾' : '▸'} {excluded.length} vendor
            {excluded.length > 1 ? 's' : ''} didn&apos;t match your criteria
          </button>
          {showExcluded && (
            <div className="mt-3 space-y-2">
              {excluded.map((sv) => (
                <div
                  key={sv.vendor.id}
                  className="px-4 py-3 rounded-lg border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      {sv.vendor.name}
                    </span>
                    {sv.exclusion_reason && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sv.exclusion_reason}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/vendors/${sv.vendor.slug}`}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    View anyway →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results fallback */}
      {recommended.length === 0 && (
        <div className="text-center py-12 mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No vendors matched all your criteria
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your requirements — especially deal-breakers and
            budget — and run the wizard again.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center pb-8">
        <button
          type="button"
          onClick={onStartOver}
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
        >
          Start Over
        </button>
        <Link
          href="/vendors"
          className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
        >
          Browse All Software
        </Link>
      </div>
    </div>
  )
}
