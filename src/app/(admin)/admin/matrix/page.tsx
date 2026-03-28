'use client'

/**
 * PropertyManageWiz Content Matrix
 * 7 macro themes × 7 micro topics × 7 sub-angles = 343 unique topics
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  SkipForward,
  RotateCcw,
  Grid3X3,
  Filter,
  TrendingUp,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase'

interface MatrixTopic {
  id: string
  site: string
  macro_theme: string
  micro_angle: string
  sub_angle: string
  title_suggestion: string
  used: boolean
  used_date: string | null
  skipped: boolean
  article_slug: string | null
  boost_score: number
  manual_boost: number
  search_boost: number
  created_at: string
}

interface ThemeStats {
  total: number
  used: number
  skipped: number
  available: number
}

interface ThemeSignal {
  id: string
  site: string
  macro_theme: string
  comment_count: number
  positive_count: number
  prospect_count: number
  question_count: number
  boost_score: number
  last_calculated_at: string
}

const MACRO_THEMES = [
  'Choosing Software',
  'By Geography',
  'By Portfolio Type',
  'By Portfolio Size',
  'By Feature',
  'Vendor Comparisons',
  'Implementation and Switching',
]

const themeColors: Record<string, string> = {
  'Choosing Software': 'bg-blue-100 text-blue-700 border-blue-200',
  'By Geography': 'bg-green-100 text-green-700 border-green-200',
  'By Portfolio Type': 'bg-purple-100 text-purple-700 border-purple-200',
  'By Portfolio Size': 'bg-orange-100 text-orange-700 border-orange-200',
  'By Feature': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Vendor Comparisons': 'bg-red-100 text-red-700 border-red-200',
  'Implementation and Switching': 'bg-pink-100 text-pink-700 border-pink-200',
}

type StatusFilter = 'all' | 'available' | 'used' | 'skipped'

export default function ContentMatrixPage() {
  const [topics, setTopics] = useState<MatrixTopic[]>([])
  const [signals, setSignals] = useState<ThemeSignal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Expanded groups
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())
  const [expandedAngles, setExpandedAngles] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTopics()
    fetchSignals()
  }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const fetchTopics = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_content_matrix')
        .select('*')
        .eq('site', 'pmw')
        .order('macro_theme')
        .order('micro_angle')
        .order('sub_angle')
      if (error) throw error
      setTopics(data || [])
    } catch (err: any) {
      showMsg('error', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSignals = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_content_matrix_signals')
        .select('*')
        .eq('site', 'pmw')
      if (error) return
      setSignals(data || [])
    } catch {
      // Non-critical
    }
  }

  const handleAction = async (id: string, action: 'used' | 'skip' | 'reset') => {
    setActionLoading(id)
    try {
      const supabase = createClient()
      let updateData: Record<string, any> = {}

      if (action === 'used') {
        updateData = { used: true, skipped: false, used_date: new Date().toISOString().split('T')[0] }
      } else if (action === 'skip') {
        updateData = { skipped: true, used: false, used_date: null }
      } else {
        updateData = { used: false, skipped: false, used_date: null }
      }

      const { error } = await supabase
        .from('de_content_matrix')
        .update(updateData)
        .eq('id', id)
      if (error) throw error

      showMsg('success', action === 'used' ? 'Marked as used' : action === 'skip' ? 'Skipped' : 'Reset')
      fetchTopics()
    } catch (err: any) {
      showMsg('error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBoost = async (id: string, currentBoost: number) => {
    const newBoost = currentBoost > 0 ? 0 : 10
    setActionLoading(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('de_content_matrix')
        .update({ manual_boost: newBoost })
        .eq('id', id)
      if (error) throw error

      showMsg('success', newBoost > 0 ? 'Topic force-boosted' : 'Boost removed')
      fetchTopics()
    } catch (err: any) {
      showMsg('error', err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleTheme = (theme: string) => {
    setExpandedThemes((prev) => {
      const next = new Set(prev)
      if (next.has(theme)) next.delete(theme)
      else next.add(theme)
      return next
    })
  }

  const toggleAngle = (key: string) => {
    setExpandedAngles((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => {
    const themes = new Set(MACRO_THEMES)
    const angles = new Set<string>()
    filteredTopics.forEach((t) => angles.add(`${t.macro_theme}|${t.micro_angle}`))
    setExpandedThemes(themes)
    setExpandedAngles(angles)
  }

  const collapseAll = () => {
    setExpandedThemes(new Set())
    setExpandedAngles(new Set())
  }

  // Filter topics
  const filteredTopics = useMemo(() => {
    let filtered = topics

    if (selectedTheme) {
      filtered = filtered.filter((t) => t.macro_theme === selectedTheme)
    }

    if (statusFilter === 'available') {
      filtered = filtered.filter((t) => !t.used && !t.skipped)
    } else if (statusFilter === 'used') {
      filtered = filtered.filter((t) => t.used)
    } else if (statusFilter === 'skipped') {
      filtered = filtered.filter((t) => t.skipped)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.sub_angle.toLowerCase().includes(q) ||
          t.title_suggestion.toLowerCase().includes(q) ||
          t.micro_angle.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [topics, selectedTheme, statusFilter, searchQuery])

  // Compute stats from topics
  const stats = useMemo(() => {
    const map: Record<string, ThemeStats> = {}
    for (const t of topics) {
      if (!map[t.macro_theme]) {
        map[t.macro_theme] = { total: 0, used: 0, skipped: 0, available: 0 }
      }
      const s = map[t.macro_theme]
      s.total++
      if (t.used) s.used++
      else if (t.skipped) s.skipped++
      else s.available++
    }
    return map
  }, [topics])

  // Group topics hierarchically
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, MatrixTopic[]>>()
    for (const t of filteredTopics) {
      if (!map.has(t.macro_theme)) map.set(t.macro_theme, new Map())
      const microMap = map.get(t.macro_theme)!
      if (!microMap.has(t.micro_angle)) microMap.set(t.micro_angle, [])
      microMap.get(t.micro_angle)!.push(t)
    }
    return map
  }, [filteredTopics])

  // Signal lookup by theme
  const signalMap = useMemo(() => {
    const map: Record<string, ThemeSignal> = {}
    signals.forEach((s) => (map[s.macro_theme] = s))
    return map
  }, [signals])

  // Total stats
  const totalStats = useMemo(() => {
    const s = { total: 0, used: 0, skipped: 0, available: 0 }
    Object.values(stats).forEach((v) => {
      s.total += v.total
      s.used += v.used
      s.skipped += v.skipped
      s.available += v.available
    })
    return s
  }, [stats])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid3X3 className="h-6 w-6 text-violet-500" />
            PropertyManageWiz Content Matrix
          </h1>
          <p className="text-gray-500">
            7 macro themes &times; 7 micro topics &times; 7 sub-angles = 343 unique topics
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      {totalStats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Topics</p>
            <p className="text-2xl font-bold text-gray-900">{totalStats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{totalStats.available}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Used</p>
            <p className="text-2xl font-bold text-blue-600">{totalStats.used}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Skipped</p>
            <p className="text-2xl font-bold text-gray-400">{totalStats.skipped}</p>
          </div>
        </div>
      )}

      {/* Comment Signal Boost Panel */}
      {signals.some((s) => s.comment_count > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Comment Boost Signals
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {MACRO_THEMES.map((theme) => {
              const sig = signalMap[theme]
              if (!sig) return null
              const hasBoost = sig.boost_score > 2
              return (
                <div
                  key={theme}
                  className={`p-2.5 rounded-lg border text-center ${
                    hasBoost
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-900 truncate">{theme}</p>
                  <p className={`text-lg font-bold ${hasBoost ? 'text-amber-600' : 'text-gray-400'}`}>
                    {sig.boost_score.toFixed(1)}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    {sig.comment_count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Theme Stats Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {MACRO_THEMES.map((theme) => {
            const s = stats[theme]
            if (!s) return null
            const pct = Math.round((s.used / s.total) * 100)
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(selectedTheme === theme ? '' : theme)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selectedTheme === theme
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{theme}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {s.used}/{s.total}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="used">Used</option>
            <option value="skipped">Skipped</option>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="secondary" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>

        <span className="text-sm text-gray-500">
          {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Topics Tree */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500 mb-4" />
          <p className="text-gray-500">Loading content matrix...</p>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Grid3X3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {topics.length === 0
              ? 'No topics found. Check that de_content_matrix has been seeded.'
              : 'No topics match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {MACRO_THEMES.filter((theme) => grouped.has(theme)).map((theme) => {
            const microMap = grouped.get(theme)!
            const isExpanded = expandedThemes.has(theme)
            const themeTopics = filteredTopics.filter((t) => t.macro_theme === theme)
            const usedCount = themeTopics.filter((t) => t.used).length

            return (
              <div key={theme} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Macro theme header */}
                <button
                  onClick={() => toggleTheme(theme)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${themeColors[theme] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {theme}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {usedCount}/{themeTopics.length} used
                  </span>
                </button>

                {/* Micro angles */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {Array.from(microMap.entries()).map(([angle, subs]) => {
                      const angleKey = `${theme}|${angle}`
                      const angleExpanded = expandedAngles.has(angleKey)
                      const angleUsed = subs.filter((s) => s.used).length

                      return (
                        <div key={angleKey} className="border-b border-gray-50 last:border-b-0">
                          <button
                            onClick={() => toggleAngle(angleKey)}
                            className="w-full flex items-center gap-3 pl-10 pr-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            {angleExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{angle}</span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {angleUsed}/{subs.length}
                            </span>
                          </button>

                          {/* Sub-angles (topics) */}
                          {angleExpanded && (
                            <div className="pl-16 pr-4 pb-2 space-y-1">
                              {subs.map((topic) => (
                                <div
                                  key={topic.id}
                                  className={`flex items-start gap-3 px-3 py-2 rounded-lg text-sm ${
                                    topic.used
                                      ? 'bg-blue-50/50'
                                      : topic.skipped
                                        ? 'bg-gray-50 opacity-60'
                                        : 'hover:bg-gray-50'
                                  }`}
                                >
                                  {/* Status indicator */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    {topic.used ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
                                        <Check className="h-3 w-3" />
                                      </span>
                                    ) : topic.skipped ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-500">
                                        <SkipForward className="h-3 w-3" />
                                      </span>
                                    ) : (
                                      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-300" />
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900">
                                      {topic.sub_angle}
                                      {topic.manual_boost > 0 && !topic.used && !topic.skipped && (
                                        <span className="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded text-xs bg-violet-500/10 text-violet-500 font-semibold">
                                          <Zap className="h-3 w-3" />
                                          Force-boosted
                                        </span>
                                      )}
                                      {topic.boost_score > 0 && !topic.manual_boost && !topic.used && !topic.skipped && (
                                        <span className="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                                          <TrendingUp className="h-3 w-3" />
                                          {topic.boost_score.toFixed(1)}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                                      {topic.title_suggestion}
                                    </p>
                                    {topic.used && topic.used_date && (
                                      <span className="text-xs text-gray-400">
                                        {new Date(topic.used_date + 'T00:00:00').toLocaleDateString('en-AU', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {!topic.used && !topic.skipped && (
                                      <>
                                        <button
                                          onClick={() => handleBoost(topic.id, topic.manual_boost)}
                                          disabled={actionLoading === topic.id}
                                          className={`p-1 rounded transition-colors ${
                                            topic.manual_boost > 0
                                              ? 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20'
                                              : 'text-gray-400 hover:bg-amber-100 hover:text-amber-600'
                                          }`}
                                          title={topic.manual_boost > 0 ? 'Remove boost' : 'Force-boost this topic'}
                                        >
                                          <Zap className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleAction(topic.id, 'used')}
                                          disabled={actionLoading === topic.id}
                                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                                          title="Mark as used"
                                        >
                                          {actionLoading === topic.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Check className="h-3.5 w-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleAction(topic.id, 'skip')}
                                          disabled={actionLoading === topic.id}
                                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                          title="Skip"
                                        >
                                          <SkipForward className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    )}
                                    {(topic.used || topic.skipped) && (
                                      <button
                                        onClick={() => handleAction(topic.id, 'reset')}
                                        disabled={actionLoading === topic.id}
                                        className="p-1 rounded hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition-colors"
                                        title="Reset"
                                      >
                                        {actionLoading === topic.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <RotateCcw className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
