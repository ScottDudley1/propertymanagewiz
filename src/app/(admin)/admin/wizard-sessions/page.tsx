'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui'

interface ClickStats {
  totalSessions: number
  totalClicks: number
  mostClickedVendor: { name: string; clicks: number } | null
}

interface SessionRow {
  id: string
  session_token: string
  created_at: string
  recommended_vendor_ids: number[] | null
  clicked_vendor_id: number | null
  clicked_at: string | null
  clicked_vendor_name?: string
}

export default function WizardSessionsPage() {
  const [stats, setStats] = useState<ClickStats>({ totalSessions: 0, totalClicks: 0, mostClickedVendor: null })
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // Fetch sessions with clicked vendor names
      const { data: allSessions } = await supabase
        .from('de_decision_sessions')
        .select('id, session_token, created_at, recommended_vendor_ids, clicked_vendor_id, clicked_at')
        .order('created_at', { ascending: false })
        .limit(50)

      const rows = (allSessions || []) as SessionRow[]
      const totalSessions = rows.length

      // Count clicks
      const clickedSessions = rows.filter((s) => s.clicked_vendor_id != null)
      const totalClicks = clickedSessions.length

      // Find most clicked vendor
      const clickCounts = new Map<number, number>()
      for (const s of clickedSessions) {
        const vid = s.clicked_vendor_id!
        clickCounts.set(vid, (clickCounts.get(vid) || 0) + 1)
      }

      let mostClickedVendor: ClickStats['mostClickedVendor'] = null
      if (clickCounts.size > 0) {
        const topId = [...clickCounts.entries()].sort((a, b) => b[1] - a[1])[0]
        const { data: vendor } = await supabase
          .from('de_vendors')
          .select('name')
          .eq('id', topId[0])
          .single()
        mostClickedVendor = { name: vendor?.name || `Vendor #${topId[0]}`, clicks: topId[1] }
      }

      // Resolve clicked vendor names for display
      const clickedIds = [...new Set(clickedSessions.map((s) => s.clicked_vendor_id!))]
      const vendorNames = new Map<number, string>()
      if (clickedIds.length > 0) {
        const { data: vendors } = await supabase
          .from('de_vendors')
          .select('id, name')
          .in('id', clickedIds)
        for (const v of vendors || []) {
          vendorNames.set(v.id, v.name)
        }
      }
      for (const row of rows) {
        if (row.clicked_vendor_id) {
          row.clicked_vendor_name = vendorNames.get(row.clicked_vendor_id)
        }
      }

      setStats({ totalSessions, totalClicks, mostClickedVendor })
      setSessions(rows)
    } catch (error) {
      console.error('Failed to fetch wizard sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-violet-500 hover:text-violet-600 mb-2 inline-block">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Wizard Sessions</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-violet-600">{stats.totalSessions}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Clicks</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalClicks}</p>
          {stats.totalSessions > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {((stats.totalClicks / stats.totalSessions) * 100).toFixed(1)}% click-through rate
            </p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Most Clicked Vendor</p>
          {stats.mostClickedVendor ? (
            <>
              <p className="text-xl font-bold text-gray-900">{stats.mostClickedVendor.name}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.mostClickedVendor.clicks} clicks</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No clicks yet</p>
          )}
        </Card>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Date</th>
              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Session</th>
              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Recommended</th>
              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Clicked</th>
              <th className="text-left py-3 text-gray-500 font-medium">Clicked At</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-gray-50">
                <td className="py-2.5 pr-4 text-gray-500">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs">
                  {s.session_token.slice(0, 8)}...
                </td>
                <td className="py-2.5 pr-4 text-gray-700">
                  {s.recommended_vendor_ids?.length || 0} vendors
                </td>
                <td className="py-2.5 pr-4">
                  {s.clicked_vendor_name ? (
                    <span className="text-green-600 font-medium">{s.clicked_vendor_name}</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="py-2.5 text-gray-400 text-xs">
                  {s.clicked_at ? new Date(s.clicked_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length === 0 && (
        <p className="text-center text-gray-400 py-8">No wizard sessions yet.</p>
      )}
    </div>
  )
}
