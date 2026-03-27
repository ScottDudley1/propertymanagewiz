'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle,
  Settings,
  ExternalLink,
  X,
  Eye,
  Save,
  PenLine,
  AlertTriangle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Input, Select, Textarea, Card, Badge, Label } from '@/components/ui'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  status: 'draft' | 'published' | 'scheduled'
  ai_generated: boolean
  created_at: string
  publish_at: string | null
  meta_title: string
  meta_description: string
  linkedin_snippet: string
  article_format: string | null
  validation_passed: boolean | null
  validation_issues: Array<{ rule: string; match: string; context: string; severity: string }> | null
}

interface SiteSettings {
  site_name: string
  content_niche: string
  primary_keywords: string
  writing_tone: string
  icp_title: string
  content_categories: string
  ai_enabled: boolean
  author_name: string
  unique_perspective: string
  min_word_count?: number
  max_word_count?: number
}

export default function BlogManagerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settingsError, setSettingsError] = useState(false)

  // Brief-based post creation state
  const [showBriefForm, setShowBriefForm] = useState(false)
  const [isCreatingFromBrief, setIsCreatingFromBrief] = useState(false)
  const [briefForm, setBriefForm] = useState({
    brief: '',
    category: 'Property Management Software',
    article_format: 'How To',
    publish_at: '',
  })

  // Preview/Edit state
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    meta_title: '',
    meta_description: '',
    linkedin_snippet: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_settings')
        .select('*')
        .single()

      if (error) {
        console.error('Settings fetch error:', error)
        setSettingsError(true)
      } else {
        setSettings(data)
        setSettingsError(false)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setSettingsError(true)
    }
  }

  const fetchPosts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      setPosts(data || [])
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleGenerate = async () => {
    if (!settings?.ai_enabled) {
      showMessage('error', 'Enable AI generation in Settings first')
      return
    }

    setIsGenerating(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blog/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate blog post')
      }

      const data = await response.json()
      if (data.validation && !data.validation.passed) {
        showMessage('error', `"${data.post.title}" created as DRAFT — ${data.validation.issueCount} content validation issue(s) found.`)
      } else {
        showMessage('success', `"${data.post.title}" has been created`)
      }
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateFromBrief = async () => {
    if (!briefForm.brief.trim()) {
      showMessage('error', 'Please provide your brief / ideas')
      return
    }
    setIsCreatingFromBrief(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blog/generate-from-brief`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            brief: briefForm.brief,
            category: briefForm.category,
            article_format: briefForm.article_format,
            publish_at: briefForm.publish_at ? new Date(briefForm.publish_at + 'T06:00:00Z').toISOString() : null,
          }),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate from brief')
      }
      const data = await response.json()
      if (data.validation && !data.validation.passed) {
        showMessage('error', `"${data.post.title}" created as DRAFT — ${data.validation.issueCount} content validation issue(s) found.`)
      } else {
        showMessage('success', `"${data.post.title}" has been generated as a draft`)
      }
      setShowBriefForm(false)
      setBriefForm({ brief: '', category: 'Property Management Software', article_format: 'How To', publish_at: '' })
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setIsCreatingFromBrief(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('de_blog_posts')
        .update({ status: 'published', publish_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw new Error(error.message)
      showMessage('success', 'Blog post is now live')
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('de_blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
      showMessage('success', 'Blog post has been removed')
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    }
  }

  const openPreview = (post: BlogPost) => {
    setSelectedPost(post)
    setIsEditing(false)
  }

  const switchToEdit = () => {
    if (!selectedPost) return
    setEditForm({
      title: selectedPost.title,
      excerpt: selectedPost.excerpt,
      content: selectedPost.content || '',
      meta_title: selectedPost.meta_title || '',
      meta_description: selectedPost.meta_description || '',
      linkedin_snippet: selectedPost.linkedin_snippet || '',
    })
    setIsEditing(true)
  }

  const closeModal = () => {
    setSelectedPost(null)
    setIsEditing(false)
    setEditForm({ title: '', excerpt: '', content: '', meta_title: '', meta_description: '', linkedin_snippet: '' })
  }

  const handleSaveEdit = async () => {
    if (!selectedPost) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_blog_posts')
        .update(editForm)
        .eq('id', selectedPost.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      showMessage('success', 'Changes saved successfully')
      setSelectedPost(data)
      setIsEditing(false)
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishFromModal = async () => {
    if (!selectedPost) return
    const postId = selectedPost.id
    if (isEditing) {
      setIsSaving(true)
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('de_blog_posts')
          .update(editForm)
          .eq('id', postId)

        if (error) throw new Error(error.message)
      } catch (error: any) {
        showMessage('error', error.message)
        setIsSaving(false)
        return
      }
      setIsSaving(false)
    }
    await handlePublish(postId)
    closeModal()
  }

  const aiEnabled = settings?.ai_enabled || false

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Manager</h1>
          <p className="text-gray-500">
            Generate AI-powered content for {settings?.site_name || 'your site'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowBriefForm(true)}
          >
            <PenLine className="h-4 w-4" />
            Write from Brief
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!aiEnabled || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating... (30-60 seconds)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate New Post
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Warning */}
      {settingsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Could Not Load Settings</p>
                <p className="text-sm text-red-700">
                  Failed to connect to the settings service. Try refreshing the page.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => { setSettingsError(false); fetchSettings() }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
      {!settingsError && !aiEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Enable AI Generation</p>
                <p className="text-sm text-yellow-700">
                  Turn on the &quot;AI Content Generation&quot; toggle in Settings to start creating content.
                </p>
              </div>
            </div>
            <Link href="/admin/settings">
              <span className="border border-yellow-400 hover:bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
                Go to Settings
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Current Configuration Display */}
      {settings && aiEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-blue-800">
                <strong>Target:</strong> {settings.icp_title || 'Business professionals'} &nbsp;|&nbsp;
                <strong>Tone:</strong> {settings.writing_tone || 'authoritative'}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Niche:</strong> {settings.content_niche || 'property management'}
              </p>
              {settings.unique_perspective && (
                <p className="text-xs text-blue-600 italic mt-1">
                  &quot;{settings.unique_perspective.substring(0, 100)}...&quot;
                </p>
              )}
            </div>
            <Link href="/admin/settings">
              <span className="text-blue-700 hover:text-blue-900 text-sm cursor-pointer">
                Edit Prompt &rarr;
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Generation in progress indicator */}
      {isGenerating && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            <div>
              <p className="font-medium text-purple-800">Generating new article...</p>
              <p className="text-sm text-purple-600">
                Using your settings to create a {settings?.min_word_count || 1200}-{settings?.max_word_count || 1800} word article. This takes 30-60 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blog Posts List */}
      <Card className="p-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Blog Posts ({posts.length})</h2>
          <p className="text-gray-500 text-sm">Manage your published and draft blog content</p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500 mb-4" />
              <p className="text-gray-500">Loading blog posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Blog Posts Yet</h3>
              <p className="text-gray-500 mb-4">
                {aiEnabled
                  ? 'Generate your first AI-powered blog post to get started'
                  : 'Configure your settings and enable AI generation to get started'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => openPreview(post)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 hover:text-violet-500">{post.title}</h3>
                      <Badge
                        variant={
                          post.status === 'published' ? 'success' :
                          post.status === 'scheduled' ? 'purple' :
                          'default'
                        }
                      >
                        {post.status}
                      </Badge>
                      {post.ai_generated && (
                        <Badge variant="success" className="bg-emerald-100 text-emerald-700">
                          <Sparkles className="h-3 w-3" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{post.category}</span>
                      {post.article_format && (
                        <>
                          <span>&bull;</span>
                          <Badge variant="purple" className="rounded text-xs px-1.5 py-0.5">{post.article_format}</Badge>
                        </>
                      )}
                      <span>&bull;</span>
                      <span>{post.publish_at ? new Date(post.publish_at).toLocaleDateString() : 'Draft'}</span>
                      {post.validation_passed === false && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {post.validation_issues?.length || 0} issue{(post.validation_issues?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {post.status === 'published' && (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="secondary" size="sm" className="inline-flex" title="View live post">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {post.status === 'draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePublish(post.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Preview / Edit Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {isEditing ? <Edit className="h-5 w-5 text-violet-500" /> : <Eye className="h-5 w-5 text-violet-500" />}
                <div>
                  <h2 className="font-semibold">{isEditing ? 'Edit Article' : selectedPost.title}</h2>
                  <p className="text-sm text-gray-500">
                    {isEditing ? 'Make changes and save' : `${selectedPost.content?.split(/\s+/).filter(Boolean).length || 0} words · ${selectedPost.category} · ${selectedPost.publish_at ? new Date(selectedPost.publish_at).toLocaleDateString() : 'Draft'}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              {selectedPost.validation_passed === false && selectedPost.validation_issues && selectedPost.validation_issues.length > 0 && (
                <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">
                      Content Validation: {selectedPost.validation_issues.length} issue{selectedPost.validation_issues.length !== 1 ? 's' : ''} found
                    </h3>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Fix these before publishing. Fabricated company examples must use hypothetical framing.
                  </p>
                  <ul className="space-y-2">
                    {selectedPost.validation_issues.map((issue, i) => (
                      <li key={i} className="text-sm bg-white rounded p-3 border border-amber-100">
                        <span className="inline-block text-xs font-medium text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 mb-1">
                          {issue.rule.replace(/_/g, ' ')}
                        </span>
                        <p className="text-gray-700 text-xs mt-1">
                          &ldquo;{issue.context}&rdquo;
                        </p>
                        <p className="text-amber-600 text-xs mt-1">
                          Matched: <strong>{issue.match}</strong>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isEditing ? (
                <div className="p-6 space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Excerpt</Label>
                    <Textarea
                      value={editForm.excerpt}
                      onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>
                      Content (Markdown)
                      <span className="text-gray-400 font-normal ml-2">
                        {editForm.content.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </Label>
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SEO Title</Label>
                      <Input
                        type="text"
                        value={editForm.meta_title}
                        onChange={(e) => setEditForm({ ...editForm, meta_title: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">{editForm.meta_title.length}/60 characters</p>
                    </div>
                    <div>
                      <Label>SEO Description</Label>
                      <Input
                        type="text"
                        value={editForm.meta_description}
                        onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">{editForm.meta_description.length}/160 characters</p>
                    </div>
                    <div>
                      <Label>LinkedIn Post Snippet</Label>
                      <Textarea
                        value={editForm.linkedin_snippet}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_snippet: e.target.value })}
                        rows={2}
                        placeholder="Paste the first line of your LinkedIn post here to match incoming comments..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-gray-600 italic mb-6">{selectedPost.excerpt}</p>
                  <div className="prose prose-lg max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-base text-gray-700">{selectedPost.content}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Delete this post? This cannot be undone.')) {
                      handleDelete(selectedPost.id)
                      closeModal()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Back to Preview
                    </Button>
                    <Button variant="secondary" onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={switchToEdit}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {selectedPost.status === 'draft' && (
                  <Button onClick={handlePublishFromModal} disabled={isSaving}>
                    <CheckCircle className="h-4 w-4" />
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate from Brief Modal */}
      {showBriefForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <PenLine className="h-5 w-5 text-violet-500" />
                <div>
                  <h2 className="font-semibold">Generate from Your Brief</h2>
                  <p className="text-sm text-gray-500">Provide your ideas and the AI will write the full article using your brand voice</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowBriefForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label>Your Brief *</Label>
                <Textarea
                  value={briefForm.brief}
                  onChange={(e) => setBriefForm({ ...briefForm, brief: e.target.value })}
                  rows={10}
                  placeholder={"Describe the article you want written. Include:\n- The main topic or thesis\n- Key arguments or points to cover\n- Specific examples, data, or angles to include\n- Any particular tone or framing\n\nThe more detail you give, the closer the output will match your vision."}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={briefForm.category}
                    onChange={(e) => setBriefForm({ ...briefForm, category: e.target.value })}
                    className="text-sm"
                  >
                    <option>Property Management Software</option>
                    <option>Vendor Comparisons</option>
                    <option>Australian Market</option>
                    <option>UK Market</option>
                    <option>US Market</option>
                    <option>Industry Trends</option>
                    <option>Best Practices</option>
                  </Select>
                </div>
                <div>
                  <Label>Article Format</Label>
                  <Select
                    value={briefForm.article_format}
                    onChange={(e) => setBriefForm({ ...briefForm, article_format: e.target.value })}
                    className="text-sm"
                  >
                    <option>How To</option>
                    <option>Comparison</option>
                    <option>Best Practices</option>
                    <option>Problem/Agitate/Solution</option>
                    <option>Myths &amp; Misconceptions</option>
                    <option>Common Mistakes</option>
                    <option>Cost Analysis</option>
                    <option>News Commentary</option>
                  </Select>
                </div>
                <div>
                  <Label>Publish Date</Label>
                  <Input
                    type="date"
                    value={briefForm.publish_at}
                    onChange={(e) => setBriefForm({ ...briefForm, publish_at: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <Button variant="secondary" onClick={() => setShowBriefForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateFromBrief}
                disabled={isCreatingFromBrief || !briefForm.brief.trim()}
              >
                {isCreatingFromBrief ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating... (30-60s)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Article
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
