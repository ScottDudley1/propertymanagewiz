'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Card } from '@/components/ui'

interface Stats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  aiEnabled: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    aiEnabled: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()

      // Fetch posts
      const { data: posts } = await supabase
        .from('de_blog_posts')
        .select('status')

      // Fetch settings
      const { data: settings } = await supabase
        .from('de_settings')
        .select('ai_enabled')
        .single()

      setStats({
        totalPosts: posts?.length || 0,
        publishedPosts: posts?.filter(p => p.status === 'published').length || 0,
        draftPosts: posts?.filter(p => p.status === 'draft').length || 0,
        aiEnabled: settings?.ai_enabled || false,
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Manage your AI-powered blog content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Posts</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Published</p>
          <p className="text-3xl font-bold text-green-600">{stats.publishedPosts}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Drafts</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.draftPosts}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">AI Generation</p>
          <div className="flex items-center gap-2">
            {stats.aiEnabled ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-lg font-semibold text-green-600">Enabled</span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-gray-400" />
                <span className="text-lg font-semibold text-gray-500">Disabled</span>
              </>
            )}
          </div>
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
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/blog')}>
              <Sparkles className="h-4 w-4" />
              Generate Post
            </Button>
            <Button variant="secondary" onClick={() => router.push('/admin/blog')}>
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-semibold">Analytics</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            View content performance and traffic stats
          </p>
          <Button variant="secondary" onClick={() => router.push('/admin/analytics')}>
            View Analytics
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card hover>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-violet-500" />
            <h3 className="text-lg font-semibold">Settings</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Configure AI generation, site details, and defaults
          </p>
          <Button variant="secondary" onClick={() => router.push('/admin/settings')}>
            <Sparkles className="h-4 w-4" />
            {stats.aiEnabled ? 'Manage Settings' : 'Enable AI'}
          </Button>
        </Card>
      </div>

      {/* Getting Started */}
      {!stats.aiEnabled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-900">Get Started with AI Content</h3>
          </div>
          <p className="text-emerald-700 mb-4">
            Enable AI generation to start creating SEO-optimized blog posts automatically
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-800 mb-4">
            <li>Go to Settings and configure your site details (name, niche, keywords)</li>
            <li>Enable the AI Generation toggle</li>
            <li>Head to Blog Manager and click &quot;Generate with AI&quot;</li>
          </ol>
          <Button onClick={() => router.push('/admin/settings')}>
            Go to Settings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Blog */}
      <div className="mt-8 text-center">
        <Link href="/blog" className="text-violet-500 hover:underline">
          View public blog &rarr;
        </Link>
      </div>
    </div>
  )
}
