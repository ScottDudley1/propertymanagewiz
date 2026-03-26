import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { slug } = await params
  const { data: post } = await supabase
    .from('de_blog_posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) return { title: 'Post Not Found | PropertyManageWiz' }

  return {
    title: `${post.title} | PropertyManageWiz`,
    description: post.excerpt,
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: Props) {
  const supabase = createClient()
  const { slug } = await params
  const { data: post } = await supabase
    .from('de_blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8 inline-block">
          ← All Guides
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 mb-10 text-sm">
          {post.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
              {post.category}
            </span>
          )}
          {post.reading_time_minutes && (
            <span className="text-gray-400">{post.reading_time_minutes} min read</span>
          )}
          {post.published_at && (
            <span className="text-gray-400">{formatDate(post.published_at)}</span>
          )}
          {post.author && (
            <span className="text-gray-400">By {post.author}</span>
          )}
        </div>

        <article className="prose prose-gray prose-headings:font-bold prose-a:text-violet-600 max-w-none">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('/')) {
                  return <Link href={href} className="text-violet-600 hover:text-violet-700 underline">{children}</Link>
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline">{children}</a>
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        <div className="mt-12 p-8 bg-violet-50 rounded-2xl border border-violet-100 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to find your software?</h3>
          <p className="text-gray-500 mb-6">Use our free decision wizard to get a personalised recommendation in 2 minutes.</p>
          <Link
            href="/wizard"
            className="inline-block bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
          >
            Find My Software →
          </Link>
        </div>
      </div>
    </div>
  )
}
