'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Users,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Card } from '@/components/ui'

interface Stats {
  totalVendors: number
  publishedArticles: number
  wizardSessions: number
  conversions: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalVendors: 0,
    publishedArticles: 0,
    wizardSessions: 0,
    conversions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()

      const [vendorsRes, postsRes, sessionsRes, conversionsRes] = await Promise.all([
        supabase.from('de_vendors').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('de_blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('de_decision_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('de_decision_sessions').select('id', { count: 'exact', head: true }).eq('converted', true),
      ])

      setStats({
        totalVendors: vendorsRes.count || 0,
        publishedArticles: postsRes.count || 0,
        wizardSessions: sessionsRes.count || 0,
        conversions: conversionsRes.count || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
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
        <h1 className="text-2xl font-bold text-gray-900">PropertyManageWiz Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Vendors</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Published Articles</p>
          <p className="text-3xl font-bold text-green-600">{stats.publishedArticles}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Wizard Sessions</p>
          <p className="text-3xl font-bold text-violet-600">{stats.wizardSessions}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Conversions</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.conversions}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card hover>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-semibold">Blog Manager</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Create, edit, and manage your blog posts
          </p>
          <Button variant="secondary" onClick={() => router.push('/admin/blog')}>
            Manage Posts
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card hover>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-semibold">Vendors</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Manage property management software vendors
          </p>
          <Button variant="secondary" onClick={() => router.push('/admin/vendors')}>
            Manage Vendors
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card hover>
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-semibold">Wizard Sessions</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            View decision wizard sessions and conversions
          </p>
          <Button variant="secondary" onClick={() => router.push('/admin/wizard-sessions')}>
            View Sessions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* View Site */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-violet-500 hover:underline">
          View public site &rarr;
        </Link>
      </div>
    </div>
  )
}
