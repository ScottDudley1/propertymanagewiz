import { createClient } from '@/lib/supabase-server'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const [{ data: vendors }, { data: posts }] = await Promise.all([
    supabase.from('de_vendors').select('slug, updated_at').eq('active', true),
    supabase.from('de_blog_posts').select('slug, updated_at').eq('published', true),
  ])

  const postUrls = (posts || []).map((p) => ({
    url: `https://www.propertymanagewiz.com/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const vendorUrls = (vendors || []).map((v) => ({
    url: `https://www.propertymanagewiz.com/vendors/${v.slug}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://www.propertymanagewiz.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://www.propertymanagewiz.com/wizard',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://www.propertymanagewiz.com/vendors',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.propertymanagewiz.com/compare',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...vendorUrls,
    ...postUrls,
  ]
}
