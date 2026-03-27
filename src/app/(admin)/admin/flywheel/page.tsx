'use client';

/**
 * Performance Flywheel Dashboard
 * Search Console metrics, opportunities, and recommendations
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Button, Card, Badge } from '@/components/ui';

interface DashboardData {
  summary: {
    this_period: { clicks: number; impressions: number; ctr: number; position: number };
    last_period: { clicks: number; impressions: number; ctr: number; position: number };
    change: { clicks: number; impressions: number; ctr: number; position: number };
  };
  top_pages: any[];
  top_queries: any[];
  opportunities: any[];
  pending_recommendations: number;
  indexed_pages: number;
}

interface Recommendation {
  id: string;
  rule_type: string;
  page: string;
  query: string;
  category: string;
  metrics: any;
  summary: string;
  status: string;
  notes: string;
  created_at: string;
  week_of: string;
  resolved_at: string;
}

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

export default function FlywheelPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recFilter, setRecFilter] = useState<string>('pending');
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'queries' | 'recommendations'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [recFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flywheel/dashboard`,
        { headers },
      );
      if (res.ok) {
        setDashboard(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    try {
      const headers = await getAuthHeaders();
      const url = recFilter === 'all'
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flywheel/recommendations`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flywheel/recommendations?status=${recFilter}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        setRecommendations(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const updateRecommendation = async (id: string, status: string, notes?: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/flywheel/recommendations/${id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status, notes }),
        },
      );
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update recommendation:', err);
    }
  };

  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;
  const formatPosition = (n: number) => n > 0 ? n.toFixed(1) : '-';

  const ruleTypeLabels: Record<string, { label: string; color: string }> = {
    topic_expansion: { label: 'Topic Expansion', color: 'bg-blue-100 text-blue-700' },
    title_rewrite: { label: 'Title Rewrite', color: 'bg-yellow-100 text-yellow-700' },
    content_update: { label: 'Content Update', color: 'bg-purple-100 text-purple-700' },
    indexing_issue: { label: 'Indexing Issue', color: 'bg-red-100 text-red-700' },
    pause_topic: { label: 'Pause Topic', color: 'bg-gray-100 text-gray-700' },
    link_target: { label: 'Link Target', color: 'bg-green-100 text-green-700' },
    intent_mismatch: { label: 'Intent Mismatch', color: 'bg-orange-100 text-orange-700' },
  };

  const extractSlug = (url: string) => {
    try {
      return new URL(url).pathname.replace('/blog/', '').replace(/\/$/, '') || url;
    } catch {
      return url;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Flywheel</h1>
          <p className="text-gray-500 text-sm mt-1">Search Console metrics and optimisation recommendations</p>
        </div>
        <Button variant="secondary" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : !dashboard ? (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Search Data Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Search Console data will appear here once BigQuery sync is running and data is available. This typically takes 2-3 days after enabling the export.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Clicks"
              value={dashboard.summary.this_period.clicks}
              change={dashboard.summary.change.clicks}
              icon={<MousePointer className="h-5 w-5" />}
            />
            <SummaryCard
              label="Impressions"
              value={dashboard.summary.this_period.impressions}
              change={dashboard.summary.change.impressions}
              icon={<Eye className="h-5 w-5" />}
            />
            <SummaryCard
              label="CTR"
              value={formatPercent(dashboard.summary.this_period.ctr)}
              change={dashboard.summary.change.ctr}
              changeFormat={(v) => `${(v * 100).toFixed(1)}pp`}
              icon={<Target className="h-5 w-5" />}
            />
            <SummaryCard
              label="Avg Position"
              value={formatPosition(dashboard.summary.this_period.position)}
              change={dashboard.summary.change.position}
              inverse
              changeFormat={(v) => v.toFixed(1)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <span className="text-sm text-gray-500">Pages Indexed</span>
              <p className="text-2xl font-bold text-gray-900">{dashboard.indexed_pages}</p>
            </Card>
            <Card>
              <span className="text-sm text-gray-500">Pending Recommendations</span>
              <p className="text-2xl font-bold text-gray-900">{dashboard.pending_recommendations}</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
            {(['overview', 'pages', 'queries', 'recommendations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Opportunities */}
              {dashboard.opportunities.length > 0 && (
                <Card className="p-0">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Opportunities (High Impressions, Low CTR)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Page</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dashboard.opportunities.map((opp, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{extractSlug(opp.page)}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{opp.impressions}</td>
                            <td className="px-4 py-3 text-right text-red-600">{formatPercent(opp.ctr)}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatPosition(opp.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Top 5 Pages */}
              <Card className="p-0">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Top Pages (28 days)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Page</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dashboard.top_pages.slice(0, 5).map((page, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{extractSlug(page.page)}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{page.clicks}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{page.impressions}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatPercent(page.ctr)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatPosition(page.position)}</td>
                        </tr>
                      ))}
                      {dashboard.top_pages.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No page data yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'pages' && (
            <Card className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">All Pages (28 days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Page</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.top_pages.map((page, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{extractSlug(page.page)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{page.clicks}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{page.impressions}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPercent(page.ctr)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPosition(page.position)}</td>
                      </tr>
                    ))}
                    {dashboard.top_pages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No page data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'queries' && (
            <Card className="p-0">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Top Queries (28 days)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Query</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Clicks</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Impressions</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">CTR</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.top_queries.map((q, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-gray-900">{q.query}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{q.clicks}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{q.impressions}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPercent(q.ctr)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatPosition(q.position)}</td>
                      </tr>
                    ))}
                    {dashboard.top_queries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No query data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {['pending', 'approved', 'rejected', 'all'].map(filter => (
                  <Button
                    key={filter}
                    onClick={() => setRecFilter(filter)}
                    variant={recFilter === filter ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>

              {recommendations.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-400">No {recFilter === 'all' ? '' : recFilter} recommendations</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recommendations.map(rec => {
                    const typeInfo = ruleTypeLabels[rec.rule_type] || { label: rec.rule_type, color: 'bg-gray-100 text-gray-700' };
                    return (
                      <Card key={rec.id}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="text-xs text-gray-400">Week of {rec.week_of}</span>
                            </div>
                            <p className="text-sm text-gray-900">{rec.summary}</p>
                            {rec.notes && (
                              <p className="text-xs text-gray-500 mt-1">Note: {rec.notes}</p>
                            )}
                          </div>
                          {rec.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateRecommendation(rec.id, 'approved')}
                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateRecommendation(rec.id, 'deferred')}
                                className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                title="Defer"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateRecommendation(rec.id, 'rejected')}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {rec.status !== 'pending' && (
                            <Badge
                              variant={
                                rec.status === 'approved' ? 'success' :
                                rec.status === 'rejected' ? 'danger' :
                                'default'
                              }
                            >
                              {rec.status}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  change,
  icon,
  inverse = false,
  changeFormat,
}: {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  inverse?: boolean;
  changeFormat?: (v: number) => string;
}) {
  const positive = inverse ? change < 0 : change > 0;
  const changeText = changeFormat ? changeFormat(Math.abs(change)) : Math.abs(change).toString();

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== 0 && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {changeText} vs previous period
        </div>
      )}
    </Card>
  );
}
