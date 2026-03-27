'use client';

/**
 * Analytics Page — 6-tab dashboard
 * Overview | Traffic | Engagement | Geography | Blog | Wizard
 */

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Eye,
  Users,
  FileText,
  MousePointer,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  RefreshCw,
  Link2,
  ScrollText,
  Mail,
  Search,
  Wand2,
  ArrowDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Button, Input, Select, Card } from '@/components/ui';

type TabKey = 'overview' | 'traffic' | 'engagement' | 'geography' | 'blog' | 'wizard';

type DateRange = 'today' | 'yesterday' | '7d' | '28d' | 'this_month' | 'last_month' | '90d' | 'this_year';

function getDateRangeParams(range: DateRange): string {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (range) {
    case 'today':
      return `start_date=${fmt(today)}&end_date=${fmt(today)}`;
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return `start_date=${fmt(yesterday)}&end_date=${fmt(yesterday)}`;
    }
    case '7d':
      return 'days=7';
    case '28d':
      return 'days=28';
    case 'this_month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return `start_date=${fmt(monthStart)}&end_date=${fmt(today)}`;
    }
    case 'last_month': {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return `start_date=${fmt(lastMonthStart)}&end_date=${fmt(lastMonthEnd)}`;
    }
    case '90d':
      return 'days=90';
    case 'this_year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return `start_date=${fmt(yearStart)}&end_date=${fmt(today)}`;
    }
  }
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '28d': 'Last 28 days',
  this_month: 'This Month',
  last_month: 'Last Month',
  '90d': 'Last 90 days',
  this_year: 'This Year',
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('28d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [traffic, setTraffic] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [geography, setGeography] = useState<any>(null);
  const [blog, setBlog] = useState<any>(null);
  const [wizard, setWizard] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => { fetchAll(); }, [dateRange]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      };
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analytics`;
      const params = getDateRangeParams(dateRange);
      const [sRes, tRes, eRes, gRes, bRes, wRes] = await Promise.all([
        fetch(`${base}/stats?${params}`, { headers }),
        fetch(`${base}/traffic?${params}`, { headers }),
        fetch(`${base}/engagement?${params}`, { headers }),
        fetch(`${base}/geography?${params}`, { headers }),
        fetch(`${base}/blog?${params}`, { headers }),
        fetch(`${base}/wizard?${params}`, { headers }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (tRes.ok) setTraffic(await tRes.json());
      if (eRes.ok) setEngagement(await eRes.json());
      if (gRes.ok) setGeography(await gRes.json());
      if (bRes.ok) setBlog(await bRes.json());
      if (wRes.ok) setWizard(await wRes.json());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
    setLoading(false);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'traffic', label: 'Traffic' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'geography', label: 'Geography' },
    { key: 'blog', label: 'Blog' },
    { key: 'wizard', label: 'Wizard' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-violet-500" /> Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Site-wide event tracking and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="text-sm"
          >
            {Object.entries(DATE_RANGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          <Button variant="secondary" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-lg p-1 inline-flex mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'traffic' && <TrafficTab traffic={traffic} filter={searchFilter} setFilter={setSearchFilter} />}
          {activeTab === 'engagement' && <EngagementTab engagement={engagement} />}
          {activeTab === 'geography' && <GeographyTab geography={geography} />}
          {activeTab === 'blog' && <BlogTab blog={blog} />}
          {activeTab === 'wizard' && <WizardTab wizard={wizard} />}
        </>
      )}
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ stats }: { stats: any }) {
  if (!stats) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Page Views" value={stats.pageViews} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="Sessions" value={stats.uniqueSessions} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Blog Views" value={stats.blogViews} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="CTA Clicks" value={stats.ctaClicks} icon={<MousePointer className="h-5 w-5" />} />
      </div>

      {/* Daily Trend */}
      {stats.dailyTrend && stats.dailyTrend.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Daily Page Views</h2>
          <div className="flex items-end gap-1 h-40">
            {stats.dailyTrend.map((day: any) => {
              const maxViews = Math.max(...stats.dailyTrend.map((d: any) => d.views), 1);
              const height = Math.max((day.views / maxViews) * 100, 2);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {day.date}: {day.views} views, {day.sessions} sessions
                  </div>
                  <div
                    className="w-full bg-violet-500/80 hover:bg-violet-500 rounded-t transition-colors"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{stats.dailyTrend[0]?.date}</span>
            <span>{stats.dailyTrend[stats.dailyTrend.length - 1]?.date}</span>
          </div>
        </Card>
      )}

      {/* Top Pages */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
        {stats.topPages?.length > 0 ? (
          <div className="space-y-3">
            {stats.topPages.map((page: any, i: number) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-violet-500/10 text-violet-500 text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-[300px]">{page.path}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{page.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No data yet</p>
        )}
      </Card>
    </div>
  );
}

// ============================================
// TRAFFIC TAB
// ============================================

function TrafficTab({ traffic, filter, setFilter }: { traffic: any; filter: string; setFilter: (v: string) => void }) {
  if (!traffic) return <EmptyState />;

  const filterList = (items: any[], field: string) => {
    if (!filter) return items;
    const q = filter.toLowerCase();
    return items.filter((item: any) => (item[field] || '').toLowerCase().includes(q));
  };

  return (
    <div className="space-y-6">
      {/* Search filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Referrers</h2>
          <RankedList items={filterList(traffic.topReferrers || [], 'referrer')} nameField="referrer" />
        </Card>

        {/* Landing Pages */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Landing Pages</h2>
          <RankedList items={filterList(traffic.landingPages || [], 'path')} nameField="path" />
        </Card>

        {/* UTM Sources */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">UTM Sources</h2>
          <RankedList items={filterList(traffic.utmSources || [], 'name')} nameField="name" />
        </Card>

        {/* UTM Mediums */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">UTM Mediums</h2>
          <RankedList items={filterList(traffic.utmMediums || [], 'name')} nameField="name" />
        </Card>

        {/* UTM Campaigns */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">UTM Campaigns</h2>
          <RankedList items={filterList(traffic.utmCampaigns || [], 'name')} nameField="name" />
        </Card>
      </div>
    </div>
  );
}

// ============================================
// ENGAGEMENT TAB
// ============================================

function EngagementTab({ engagement }: { engagement: any }) {
  if (!engagement) return <EmptyState />;

  const summary = engagement.scrollDepthSummary;

  return (
    <div className="space-y-6">
      {/* Scroll Depth Summary */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-violet-500" /> Overall Scroll Depth
        </h2>
        {summary ? (
          <div className="grid grid-cols-4 gap-4">
            {[25, 50, 75, 100].map((m) => (
              <div key={m} className="text-center">
                <div className="relative h-24 flex items-end justify-center mb-2">
                  <div
                    className="w-12 bg-violet-500/80 rounded-t"
                    style={{ height: `${Math.max(summary[`pct_${m}`] || 0, 2)}%` }}
                  />
                </div>
                <p className="text-xl font-bold text-gray-900">{summary[`pct_${m}`] || 0}%</p>
                <p className="text-xs text-gray-500">{m}% depth</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No scroll data yet</p>
        )}
      </Card>

      {/* Scroll Depth by Page */}
      {engagement.scrollDepthByPage?.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Scroll Depth by Page</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Page</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Views</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">25%</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">50%</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">75%</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">100%</th>
                </tr>
              </thead>
              <tbody>
                {engagement.scrollDepthByPage.map((row: any) => (
                  <tr key={row.page} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 truncate max-w-[250px]">{row.page}</td>
                    <td className="py-2 px-3 text-right font-medium">{row.total_views}</td>
                    <td className="py-2 px-3 text-right">{row.pct_25}%</td>
                    <td className="py-2 px-3 text-right">{row.pct_50}%</td>
                    <td className="py-2 px-3 text-right">{row.pct_75}%</td>
                    <td className="py-2 px-3 text-right">{row.pct_100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* CTA Clicks by Type */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">CTA Clicks by Type</h2>
          <p className="text-3xl font-bold text-violet-500 mb-4">{engagement.totalCTAClicks || 0} total</p>
          <RankedList items={engagement.ctaClicksByType || []} nameField="name" />
        </Card>

        {/* CTA Clicks by Location */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">CTA Clicks by Location</h2>
          <p className="text-3xl font-bold text-violet-500 mb-4">{engagement.totalLinkClicks || 0} link clicks</p>
          <RankedList items={engagement.ctaClicksByLocation || []} nameField="name" />
        </Card>

        {/* Top External Links */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-violet-500" /> Top External Link Clicks
          </h2>
          {engagement.topExternalLinks?.length > 0 ? (
            <div className="space-y-3">
              {engagement.topExternalLinks.map((link: any, i: number) => (
                <div key={link.url} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-violet-500/10 text-violet-500 text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[400px]">{link.url}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{link.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No external link clicks yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================
// GEOGRAPHY TAB
// ============================================

function GeographyTab({ geography }: { geography: any }) {
  if (!geography) return <EmptyState />;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Countries */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-violet-500" /> Countries
          </h2>
          <RankedList items={geography.countries || []} nameField="name" />
        </Card>

        {/* Cities */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Cities</h2>
          <RankedList items={geography.cities || []} nameField="name" />
        </Card>

        {/* Devices */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Devices</h2>
          <PercentBars items={geography.devices || []} />
        </Card>

        {/* Browsers */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Browsers</h2>
          <PercentBars items={geography.browsers || []} />
        </Card>

        {/* Operating Systems */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Operating Systems</h2>
          <PercentBars items={geography.operatingSystems || []} />
        </Card>
      </div>
    </div>
  );
}

// ============================================
// BLOG TAB
// ============================================

function BlogTab({ blog }: { blog: any }) {
  if (!blog) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Blog Views" value={blog.totalBlogViews} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Listing Views" value={blog.listingPageViews} icon={<Eye className="h-5 w-5" />} />
        <StatCard label="CTA Clicks" value={blog.ctaClicks} icon={<MousePointer className="h-5 w-5" />} />
        <StatCard label="Newsletter Signups" value={blog.newsletterSignups} icon={<Mail className="h-5 w-5" />} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Posts</h2>
          {blog.topPosts?.length > 0 ? (
            <div className="space-y-3">
              {blog.topPosts.map((post: any, i: number) => (
                <div key={post.slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]" title={post.title}>
                      {post.title || post.slug}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{post.views} views</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No blog views yet</p>
          )}
        </Card>

        {/* Category Distribution */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
          <PercentBars items={blog.categoryDistribution?.map((c: any) => ({ name: c.category, count: c.count })) || []} />
        </Card>

        {/* Top Blog Searches */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-violet-500" /> Top Blog Searches
          </h2>
          {blog.topSearches?.length > 0 ? (
            <div className="space-y-3">
              {blog.topSearches.map((item: any, i: number) => (
                <div key={item.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-violet-500/10 text-violet-500 text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item.query}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No blog searches yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================
// WIZARD TAB
// ============================================

function WizardTab({ wizard }: { wizard: any }) {
  if (!wizard) return <EmptyState />;

  const funnel = wizard.funnel || [];
  const maxCount = funnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Wizard Starts" value={wizard.totalWizardStarts} icon={<Wand2 className="h-5 w-5" />} />
        <StatCard
          label="Results Viewed"
          value={funnel.find((s: any) => s.ctaType === 'wizard_result_view')?.count || 0}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard label="Book a Call" value={wizard.totalBookings} icon={<MousePointer className="h-5 w-5" />} />
        <Card>
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Start-to-Book Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {wizard.totalWizardStarts > 0
              ? Math.round((wizard.totalBookings / wizard.totalWizardStarts) * 100)
              : 0}%
          </p>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-500" /> Wizard Funnel
        </h2>
        <div className="space-y-3">
          {funnel.map((step: any, i: number) => {
            const barWidth = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 2) : 2;
            return (
              <div key={step.ctaType}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    Step {step.step}: {step.label}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-gray-900">{step.count}</span>
                    {i > 0 && (
                      <span className="text-gray-400">
                        {step.conversionFromPrevious}% from prev
                      </span>
                    )}
                    {i > 0 && (
                      <span className="text-gray-400">
                        {step.conversionFromStart}% overall
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500/80 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {i < funnel.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-3 w-3 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Popular Choices */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Industries</h2>
          <RankedList items={wizard.choices?.industries || []} nameField="name" />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Questions</h2>
          <RankedList items={wizard.choices?.questions || []} nameField="name" />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Colours</h2>
          {wizard.choices?.colours?.length > 0 ? (
            <div className="space-y-3">
              {wizard.choices.colours.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: item.name }}
                    />
                    <span className="text-sm text-gray-700 font-mono">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Chart Types</h2>
          <RankedList items={wizard.choices?.chartTypes || []} nameField="name" />
        </Card>
      </div>
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{(value || 0).toLocaleString()}</p>
    </Card>
  );
}

function RankedList({ items, nameField }: { items: any[]; nameField: string }) {
  if (!items || items.length === 0) return <p className="text-gray-500 text-sm">No data yet</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item[nameField] || i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-violet-500/10 text-violet-500 text-xs font-bold rounded-full flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 truncate max-w-[250px]">{item[nameField] || '(unknown)'}</span>
          </div>
          <span className="text-sm font-medium text-gray-600">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function PercentBars({ items }: { items: { name: string; count: number }[] }) {
  if (!items || items.length === 0) return <p className="text-gray-500 text-sm">No data yet</p>;

  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  const getDeviceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (n === 'tablet') return <Tablet className="h-4 w-4" />;
    if (n === 'desktop') return <Monitor className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getDeviceIcon(item.name)}
                <span className="text-gray-700">{item.name || '(unknown)'}</span>
              </div>
              <span className="text-gray-500">{pct}% ({item.count})</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-700 mb-2">No Analytics Data Yet</h2>
      <p className="text-gray-500 max-w-md mx-auto">
        Analytics data will appear here once visitors start browsing the site. Events are tracked automatically on all public pages.
      </p>
    </Card>
  );
}
