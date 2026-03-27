'use client'

/**
 * Search Performance Page
 * Google Search Console data with queries, pages, and opportunities
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  MousePointer,
  Eye,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Input, Select, Card } from '@/components/ui'

interface DashboardData {
  period: { days: number; label: string }
  summary: {
    this_period: { clicks: number; impressions: number; ctr: number; position: number }
    last_period: { clicks: number; impressions: number; ctr: number; position: number }
    change: { clicks: number; impressions: number; ctr: number; position: number }
  }
  top_pages: any[]
  top_queries: any[]
  top_searches: any[]
  opportunities: any[]
  query_opportunities: any[]
  pending_recommendations: number
  indexed_pages: number
}

type TabKey = 'searches' | 'queries' | 'pages' | 'opportunities'

export default function SearchPerformancePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(28)
  const [activeTab, setActiveTab] = useState<TabKey>('searches')
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [days])

  const fetchData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flywheel/dashboard?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      if (res.ok) {
        setData(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch search data:', err)
    }
    setLoading(false)
  }

  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`
  const formatPosition = (n: number) => (n > 0 ? n.toFixed(1) : '-')

  const extractSlug = (url: string) => {
    try {
      return new URL(url).pathname || url
    } catch {
      return url
    }
  }

  const filterItems = (items: any[], field: string) => {
    if (!searchFilter) return items
    const q = searchFilter.toLowerCase()
    return items.filter((item) => (item[field] || '').toLowerCase().includes(q))
  }

  const periodLabel = days <= 7 ? '7 days' : days <= 28 ? '28 days' : `${days} days`

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Performance</h1>
          <p className="text-gray-500 text-sm mt-1">
            Google Search Console data synced via BigQuery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : !data || (data.summary.this_period.clicks === 0 && data.summary.this_period.impressions === 0) ? (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Search Data Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Search Console data will appear here once BigQuery sync is running. Data typically takes 2-3 days after enabling the export, plus 48-72 hours for Search Console processing.
          </p>
          <p className="text-xs text-gray-400">
            Sync runs daily at 10:00 AM AWST. {data?.indexed_pages || 0} pages indexed so far.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <SummaryCard
              label="Clicks"
              value={data.summary.this_period.clicks.toLocaleString()}
              change={data.summary.change.clicks}
              icon={<MousePointer className="h-5 w-5" />}
              periodLabel={periodLabel}
            />
            <SummaryCard
              label="Impressions"
              value={data.summary.this_period.impressions.toLocaleString()}
              change={data.summary.change.impressions}
              icon={<Eye className="h-5 w-5" />}
              periodLabel={periodLabel}
            />
            <SummaryCard
              label="CTR"
              value={formatPercent(data.summary.this_period.ctr)}
              change={data.summary.change.ctr}
              changeFormat={(v) => `${(v * 100).toFixed(1)}pp`}
              icon={<Target className="h-5 w-5" />}
              periodLabel={periodLabel}
            />
            <SummaryCard
              label="Avg Position"
              value={formatPosition(data.summary.this_period.position)}
              change={data.summary.change.position}
              inverse
              changeFormat={(v) => v.toFixed(1)}
              icon={<TrendingUp className="h-5 w-5" />}
              periodLabel={periodLabel}
            />
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Pages Indexed</span>
                <span className="text-gray-400"><Search className="h-5 w-5" /></span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.indexed_pages}</p>
              {data.pending_recommendations > 0 && (
                <Link href="/admin/flywheel" className="text-xs text-violet-500 hover:underline">
                  {data.pending_recommendations} flywheel recommendations
                </Link>
              )}
            </Card>
          </div>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: 'searches', label: 'Top Searches' },
                { key: 'queries', label: 'By Impressions' },
                { key: 'pages', label: 'Pages' },
                { key: 'opportunities', label: 'Opportunities' },
              ] as { key: TabKey; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Filter..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Top Searches Tab */}
          {activeTab === 'searches' && (
            <Card className="p-0">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Top Searches by Clicks ({periodLabel})
                </h2>
                <span className="text-xs text-gray-400">
                  {filterItems(data.top_searches, 'query').length} queries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Search Query</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filterItems(data.top_searches, 'query').map((q: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{q.query}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {q.clicks}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{q.impressions}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPercent(q.ctr)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPosition(q.position)}
                        </td>
                      </tr>
                    ))}
                    {filterItems(data.top_searches, 'query').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          No search data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Queries by Impressions Tab */}
          {activeTab === 'queries' && (
            <Card className="p-0">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Queries by Impressions ({periodLabel})
                </h2>
                <span className="text-xs text-gray-400">
                  {filterItems(data.top_queries, 'query').length} queries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Query</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filterItems(data.top_queries, 'query').map((q: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{q.query}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {q.impressions}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{q.clicks}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPercent(q.ctr)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPosition(q.position)}
                        </td>
                      </tr>
                    ))}
                    {filterItems(data.top_queries, 'query').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          No query data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <Card className="p-0">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Top Pages ({periodLabel})
                </h2>
                <span className="text-xs text-gray-400">
                  {filterItems(data.top_pages, 'page').length} pages
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 w-8">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Page</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filterItems(data.top_pages, 'page').map((page: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">
                          {extractSlug(page.page)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {page.clicks}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {page.impressions}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPercent(page.ctr)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatPosition(page.position)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={page.page}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-violet-500"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {filterItems(data.top_pages, 'page').length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No page data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-6">
              {/* Page Opportunities */}
              <Card className="p-0">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Page Opportunities
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Pages with high impressions but low CTR — improve titles and meta descriptions
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Page</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.opportunities.map((opp: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 max-w-xs truncate">
                            {extractSlug(opp.page)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {opp.impressions}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{opp.clicks}</td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {formatPercent(opp.ctr)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatPosition(opp.position)}
                          </td>
                        </tr>
                      ))}
                      {data.opportunities.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            No page opportunities found — needs more data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Query Opportunities — feed into flywheel */}
              <Card className="p-0">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Target className="h-5 w-5 text-violet-500" />
                        Query Opportunities
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Queries people search for but don't click — potential new content topics
                      </p>
                    </div>
                    <Link
                      href="/admin/flywheel"
                      className="text-sm text-violet-500 hover:underline flex items-center gap-1"
                    >
                      View Flywheel <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Query</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.query_opportunities.map((q: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">{q.query}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {q.impressions}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{q.clicks}</td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {formatPercent(q.ctr)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatPosition(q.position)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/calendar?keyword=${encodeURIComponent(q.query)}`}
                              className="inline-flex items-center gap-1 text-xs text-violet-500 hover:underline"
                            >
                              <Plus className="h-3 w-3" />
                              Add to Calendar
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {data.query_opportunities.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                            No query opportunities found — needs more data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Flywheel CTA */}
              {data.pending_recommendations > 0 && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {data.pending_recommendations} Flywheel Recommendations Pending
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        The flywheel has generated content recommendations based on your search data. Review and approve them to keep your content strategy aligned.
                      </p>
                    </div>
                    <Link href="/admin/flywheel">
                      <Button>Review</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  change,
  icon,
  inverse = false,
  changeFormat,
  periodLabel,
}: {
  label: string
  value: string | number
  change: number
  icon: React.ReactNode
  inverse?: boolean
  changeFormat?: (v: number) => string
  periodLabel: string
}) {
  const positive = inverse ? change < 0 : change > 0
  const changeText = changeFormat
    ? changeFormat(Math.abs(change))
    : Math.abs(change).toLocaleString()

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== 0 && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {changeText} vs prev {periodLabel}
        </div>
      )}
    </Card>
  )
}
