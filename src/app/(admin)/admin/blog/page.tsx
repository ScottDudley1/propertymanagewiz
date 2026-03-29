'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  ExternalLink,
  X,
  Eye,
  Save,
  PenLine,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Input, Textarea, Card, Badge, Label } from '@/components/ui'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[] | null
  reading_time_minutes: number | null
  published: boolean
  published_at: string | null
  created_at: string
}

export default function BlogManagerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Preview/Edit state
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // New post state
  const [showNewForm, setShowNewForm] = useState(false)
  const [newForm, setNewForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Property Management Software',
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

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

  const handlePublish = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('de_blog_posts')
        .update({ published: true, published_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw new Error(error.message)
      showMessage('success', 'Blog post is now live')
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('de_blog_posts')
        .update({ published: false })
        .eq('id', id)

      if (error) throw new Error(error.message)
      showMessage('success', 'Blog post unpublished')
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
      slug: selectedPost.slug,
      excerpt: selectedPost.excerpt,
      content: selectedPost.content || '',
      category: selectedPost.category || '',
    })
    setIsEditing(true)
  }

  const closeModal = () => {
    setSelectedPost(null)
    setIsEditing(false)
    setEditForm({ title: '', slug: '', excerpt: '', content: '', category: '' })
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleCreatePost = async () => {
    if (!newForm.title.trim()) {
      showMessage('error', 'Title is required')
      return
    }
    setIsCreating(true)
    try {
      const supabase = createClient()
      const slug = newForm.slug.trim() || generateSlug(newForm.title)
      const { error } = await supabase
        .from('de_blog_posts')
        .insert({
          title: newForm.title,
          slug,
          excerpt: newForm.excerpt,
          content: newForm.content,
          category: newForm.category,
          published: false,
        })

      if (error) throw new Error(error.message)
      showMessage('success', `"${newForm.title}" created as draft`)
      setShowNewForm(false)
      setNewForm({ title: '', slug: '', excerpt: '', content: '', category: 'Property Management Software' })
      fetchPosts()
    } catch (error: any) {
      showMessage('error', error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const statusLabel = (post: BlogPost) => post.published ? 'Published' : 'Draft'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Manager</h1>
          <p className="text-gray-500">Manage your published and draft blog content</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Blog Posts List */}
      <Card className="p-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Blog Posts ({posts.length})</h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500 mb-4" />
              <p className="text-gray-500">Loading blog posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <PenLine className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Blog Posts Yet</h3>
              <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
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
                      <Badge variant={post.published ? 'success' : 'default'}>
                        {statusLabel(post)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{post.category}</span>
                      <span>&bull;</span>
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}</span>
                      {post.reading_time_minutes && (
                        <>
                          <span>&bull;</span>
                          <span>{post.reading_time_minutes} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {post.published && (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="secondary" size="sm" className="inline-flex" title="View live post">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {!post.published && (
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
                    {isEditing ? 'Make changes and save' : `${selectedPost.content?.split(/\s+/).filter(Boolean).length || 0} words · ${selectedPost.category} · ${statusLabel(selectedPost)}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
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
                    <Label>Slug</Label>
                    <Input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
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
                    <Label>Category</Label>
                    <Input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
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
                {selectedPost.published && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleUnpublish(selectedPost.id)
                      closeModal()
                    }}
                  >
                    Unpublish
                  </Button>
                )}
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
                {!selectedPost.published && (
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

      {/* New Post Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <PenLine className="h-5 w-5 text-violet-500" />
                <div>
                  <h2 className="font-semibold">New Blog Post</h2>
                  <p className="text-sm text-gray-500">Create a new draft post</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowNewForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  type="text"
                  value={newForm.title}
                  onChange={(e) => {
                    setNewForm({ ...newForm, title: e.target.value, slug: generateSlug(e.target.value) })
                  }}
                  placeholder="Article title"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  type="text"
                  value={newForm.slug}
                  onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  type="text"
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={newForm.excerpt}
                  onChange={(e) => setNewForm({ ...newForm, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Brief summary of the article"
                />
              </div>
              <div>
                <Label>
                  Content (Markdown)
                  <span className="text-gray-400 font-normal ml-2">
                    {newForm.content.split(/\s+/).filter(Boolean).length} words
                  </span>
                </Label>
                <Textarea
                  value={newForm.content}
                  onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Write your article content in Markdown..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <Button variant="secondary" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={isCreating || !newForm.title.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Draft
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
