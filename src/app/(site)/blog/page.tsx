import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Management Guides | PropertyManageWiz',
  description: 'Expert guides to help you choose, implement, and get the most from your property management software.',
}

export const dynamic = 'force-dynamic'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
}

export default async function BlogPage() {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('de_blog_posts')
    .select('id, title, slug, excerpt, category, reading_time_minutes, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Property Management Guides</h1>
          <p className="text-lg text-gray-500">
            Expert guides to help you choose, implement, and get the most from your property management software.
          </p>
        </div>

        {(!posts || posts.length === 0) ? (
          <p className="text-gray-500 text-center py-16">Guides coming soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-gray-100 p-6 hover:border-violet-200 hover:shadow-sm transition-all flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                      {post.category}
                    </span>
                  )}
                  {post.reading_time_minutes && (
                    <span className="text-xs text-gray-400">{post.reading_time_minutes} min read</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors mb-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-3">{post.excerpt}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4">
                  {post.published_at && (
                    <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
                  )}
                  <span className="text-sm font-medium text-violet-500 group-hover:text-violet-600 transition-colors">
                    Read Guide →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
