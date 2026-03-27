'use client';

/**
 * Comment Capture Page
 * Capture and manage LinkedIn comments on blog posts
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  UserCheck,
  Upload,
  ShieldAlert,
  RefreshCw,
  Quote,
} from 'lucide-react';
import { Button, Input, Select, Textarea, Label } from '@/components/ui';
import { createClient } from '@/lib/supabase';

interface Comment {
  id: string;
  post_id: string | null;
  post_title: string;
  commenter_name: string;
  commenter_title: string;
  commenter_company: string;
  comment_text: string;
  comment_date: string;
  sentiment: string;
  topic_ideas: string;
  is_prospect: boolean;
  prospect_score: number | null;
  linked_theme: string | null;
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  publish_at: string | null;
  created_at: string;
  linkedin_snippet: string | null;
}

interface Objection {
  id: string;
  objection_theme: string;
  description: string;
  comment_count: number;
  example_quotes: { comment_id: string; commenter_name: string; excerpt: string }[];
  generated_at: string;
}

type ActiveTab = 'comments' | 'objections';

const SENTIMENTS = ['Positive', 'Neutral', 'Negative', 'Question'];

const sentimentColors: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-gray-100 text-gray-700',
  Negative: 'bg-red-100 text-red-700',
  Question: 'bg-blue-100 text-blue-700',
};

type SortField = 'comment_date' | 'post_title' | 'sentiment' | 'prospect_score';
type SortDir = 'asc' | 'desc';

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

function ProspectBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  let colorClass = '';
  if (score >= 8) colorClass = 'bg-red-100 text-red-700 border-red-200';
  else if (score >= 6) colorClass = 'bg-orange-100 text-orange-700 border-orange-200';
  else if (score >= 4) colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
  else colorClass = 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
      {score}
    </span>
  );
}

export default function CommentCapturePage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    post_id: '',
    post_title: '',
    commenter_name: '',
    commenter_title: '',
    commenter_company: '',
    comment_text: '',
    comment_date: new Date().toISOString().split('T')[0],
    sentiment: 'Neutral',
    topic_ideas: '',
    is_prospect: false,
    prospect_score: null as number | null,
  });

  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkPostId, setBulkPostId] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    imported: number;
    duplicates: number;
    skipped: number;
    total_parsed: number;
  } | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');

  // Objections state
  const [objections, setObjections] = useState<Objection[]>([]);
  const [objectionsLoading, setObjectionsLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('comment_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [prospectsOnly, setProspectsOnly] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchComments();
    fetchBlogPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'objections' && objections.length === 0 && !objectionsLoading) {
      fetchObjections();
    }
  }, [activeTab]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchComments = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/comments`, { headers });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/blog/posts`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const posts = (Array.isArray(data) ? data : []).filter((p: BlogPost) => p.status === 'published');
      posts.sort((a: BlogPost, b: BlogPost) => {
        const dateA = a.publish_at || a.created_at;
        const dateB = b.publish_at || b.created_at;
        return dateB.localeCompare(dateA);
      });
      setBlogPosts(posts);
    } catch {
      // Non-critical
    }
  };

  const fetchObjections = async () => {
    setObjectionsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/comments/objections`, { headers });
      if (!res.ok) throw new Error('Failed to fetch objections');
      const data = await res.json();
      setObjections(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setObjectionsLoading(false);
    }
  };

  const extractObjections = async () => {
    setExtracting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/comments/objections`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Extraction failed');
      }
      const result = await res.json();
      setObjections(result.objections || []);
      showMsg('success', `Extracted ${(result.objections || []).length} objection themes from ${result.total_comments_analysed} comments`);
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setExtracting(false);
    }
  };

  const formatPostDate = (post: BlogPost): string => {
    const dateStr = post.publish_at || post.created_at;
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const resetForm = () => {
    setForm({
      post_id: '',
      post_title: '',
      commenter_name: '',
      commenter_title: '',
      commenter_company: '',
      comment_text: '',
      comment_date: new Date().toISOString().split('T')[0],
      sentiment: 'Neutral',
      topic_ideas: '',
      is_prospect: false,
      prospect_score: null,
    });
    setEditingId(null);
  };

  const handlePostSelect = (postId: string) => {
    const post = blogPosts.find((p) => p.id === postId);
    setForm({ ...form, post_id: postId, post_title: post?.title || '' });
  };

  const handleSubmit = async () => {
    if (!form.post_title.trim() || !form.commenter_name.trim() || !form.comment_text.trim()) {
      showMsg('error', 'Post title, commenter name, and comment text are required');
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const url = editingId
        ? `${SUPABASE_URL}/functions/v1/comments/${editingId}`
        : `${SUPABASE_URL}/functions/v1/comments`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      showMsg('success', editingId ? 'Comment updated' : 'Comment captured');
      resetForm();
      setShowForm(false);
      fetchComments();
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setForm({
      post_id: comment.post_id || '',
      post_title: comment.post_title,
      commenter_name: comment.commenter_name,
      commenter_title: comment.commenter_title,
      commenter_company: comment.commenter_company,
      comment_text: comment.comment_text,
      comment_date: comment.comment_date,
      sentiment: comment.sentiment,
      topic_ideas: comment.topic_ideas,
      is_prospect: comment.is_prospect,
      prospect_score: comment.prospect_score,
    });
    setEditingId(comment.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/comments/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete');
      showMsg('success', 'Comment deleted');
      fetchComments();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim() || bulkText.trim().length < 50) {
      showMsg('error', 'Please paste LinkedIn comments (text is too short)');
      return;
    }

    setBulkImporting(true);
    setBulkResult(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/comments/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: bulkText, post_id: bulkPostId || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bulk import failed');
      }

      const result = await res.json();
      setBulkResult(result);

      if (result.imported > 0) {
        showMsg('success', `Imported ${result.imported} comments (${result.duplicates} duplicates skipped)`);
        fetchComments();
      } else if (result.duplicates > 0) {
        showMsg('success', `All ${result.duplicates} comments already exist -- no duplicates imported`);
      } else {
        showMsg('error', 'No comments could be parsed from the pasted text');
      }
    } catch (err: any) {
      showMsg('error', err.message);
    } finally {
      setBulkImporting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const filteredComments = useMemo(() => {
    let filtered = comments;

    if (prospectsOnly) {
      filtered = filtered.filter((c) => (c.prospect_score || 0) >= 6);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.commenter_name.toLowerCase().includes(q) ||
          c.comment_text.toLowerCase().includes(q) ||
          c.post_title.toLowerCase().includes(q)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'comment_date') {
        cmp = a.comment_date.localeCompare(b.comment_date);
      } else if (sortField === 'post_title') {
        cmp = a.post_title.localeCompare(b.post_title);
      } else if (sortField === 'sentiment') {
        cmp = a.sentiment.localeCompare(b.sentiment);
      } else if (sortField === 'prospect_score') {
        cmp = (a.prospect_score || 0) - (b.prospect_score || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [comments, searchQuery, sortField, sortDir, prospectsOnly]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comment Capture</h1>
          <p className="text-gray-500">Track LinkedIn comments on your blog posts</p>
        </div>
        {activeTab === 'comments' && (
          <div className="flex gap-2">
            <Button
              variant={showBulkImport ? 'ghost' : 'primary'}
              onClick={() => {
                setShowBulkImport(!showBulkImport);
                if (!showBulkImport) {
                  setShowForm(false);
                  setBulkResult(null);
                }
              }}
            >
              {showBulkImport ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {showBulkImport ? 'Cancel' : 'Bulk Import'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (showForm) {
                  resetForm();
                  setShowForm(false);
                } else {
                  resetForm();
                  setShowForm(true);
                  setShowBulkImport(false);
                }
              }}
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? 'Cancel' : 'Single'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'comments'
              ? 'border-violet-500 text-violet-500'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('objections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'objections'
              ? 'border-violet-500 text-violet-500'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Objections ({objections.length})
        </button>
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

      {/* -- Comments Tab -- */}
      {activeTab === 'comments' && (<>

      {/* Bulk Import Panel */}
      {showBulkImport && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Bulk Import LinkedIn Comments</h2>
          <p className="text-sm text-gray-500">
            Go to your LinkedIn post, select all comments (Cmd+A), copy, and paste below.
            AI will parse each commenter, score them, and skip duplicates.
          </p>

          {/* Post selector */}
          <div>
            <Label>
              Which post are these comments from?
            </Label>
            {blogPosts.length > 0 ? (
              <Select
                value={bulkPostId}
                onChange={(e) => setBulkPostId(e.target.value)}
              >
                <option value="">Select a post...</option>
                {blogPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPostDate(p)} - {p.linkedin_snippet
                      ? p.linkedin_snippet.substring(0, 80) + (p.linkedin_snippet.length > 80 ? '...' : '')
                      : p.title}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-sm text-gray-400">No published posts found</p>
            )}
          </div>

          {/* Paste area */}
          <div>
            <Label>
              Paste LinkedIn comments
            </Label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={10}
              placeholder="Paste all LinkedIn comments here..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {bulkText.length > 0
                ? `${bulkText.length.toLocaleString()} characters pasted`
                : 'Tip: Click on the first comment, then Cmd+Shift+End to select all, then Cmd+C'}
            </p>
          </div>

          {/* Result summary */}
          {bulkResult && (
            <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm space-y-1">
              <p className="font-medium">Import Results:</p>
              <p className="text-green-700">Imported: {bulkResult.imported} new comments</p>
              {bulkResult.duplicates > 0 && (
                <p className="text-gray-500">Duplicates skipped: {bulkResult.duplicates}</p>
              )}
              {bulkResult.skipped > 0 && (
                <p className="text-yellow-600">Skipped (invalid): {bulkResult.skipped}</p>
              )}
              <p className="text-gray-500">Total parsed from text: {bulkResult.total_parsed}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkImport(false);
                setBulkText('');
                setBulkPostId('');
                setBulkResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={bulkImporting || bulkText.trim().length < 50}
            >
              {bulkImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing & importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Comments
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId ? 'Edit Comment' : 'Capture New Comment'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Post Title */}
            <div className="md:col-span-2">
              <Label>Post Title *</Label>
              {blogPosts.length > 0 ? (
                <Select
                  value={form.post_id}
                  onChange={(e) => handlePostSelect(e.target.value)}
                >
                  <option value="">Select a post...</option>
                  {blogPosts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPostDate(p)} - {p.title}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="text"
                  value={form.post_title}
                  onChange={(e) => setForm({ ...form, post_title: e.target.value })}
                  placeholder="Enter post title"
                />
              )}
            </div>

            {/* Commenter Name */}
            <div>
              <Label>Commenter Name *</Label>
              <Input
                type="text"
                value={form.commenter_name}
                onChange={(e) => setForm({ ...form, commenter_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>

            {/* Commenter Title */}
            <div>
              <Label>Title / Role *</Label>
              <Input
                type="text"
                value={form.commenter_title}
                onChange={(e) => setForm({ ...form, commenter_title: e.target.value })}
                placeholder="Head of Data"
              />
            </div>

            {/* Commenter Company */}
            <div>
              <Label>Company <span className="text-gray-400">(optional)</span></Label>
              <Input
                type="text"
                value={form.commenter_company}
                onChange={(e) => setForm({ ...form, commenter_company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>

            {/* Date */}
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.comment_date}
                onChange={(e) => setForm({ ...form, comment_date: e.target.value })}
              />
            </div>

            {/* Sentiment */}
            <div>
              <Label>Sentiment</Label>
              <Select
                value={form.sentiment}
                onChange={(e) => setForm({ ...form, sentiment: e.target.value })}
              >
                {SENTIMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            {/* Prospect Score */}
            <div>
              <Label>Prospect Score (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={form.prospect_score ?? ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || null;
                  setForm({ ...form, prospect_score: val, is_prospect: (val || 0) >= 7 });
                }}
                placeholder="-"
                className="w-20"
              />
              <p className="text-xs text-gray-400 mt-1">7+ = strong prospect</p>
            </div>

            {/* Comment Text */}
            <div className="md:col-span-2">
              <Label>Comment Text *</Label>
              <Textarea
                value={form.comment_text}
                onChange={(e) => setForm({ ...form, comment_text: e.target.value })}
                rows={3}
                placeholder="Paste the LinkedIn comment here..."
              />
            </div>

            {/* Topic Ideas */}
            <div className="md:col-span-2">
              <Label>Topic Ideas <span className="text-gray-400">(optional notes)</span></Label>
              <Textarea
                value={form.topic_ideas}
                onChange={(e) => setForm({ ...form, topic_ideas: e.target.value })}
                rows={2}
                placeholder="Content ideas this comment suggests..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? 'Update' : 'Save Comment'}
            </Button>
          </div>
        </div>
      )}

      {/* Stats + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          <div className="px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
            <span className="font-bold text-red-700">
              {comments.filter(c => (c.prospect_score || 0) >= 8).length}
            </span>
            <span className="text-red-600 ml-1">Hot</span>
          </div>
          <div className="px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100">
            <span className="font-bold text-orange-700">
              {comments.filter(c => (c.prospect_score || 0) >= 6 && (c.prospect_score || 0) < 8).length}
            </span>
            <span className="text-orange-600 ml-1">Warm</span>
          </div>
        </div>
        <button
          onClick={() => {
            setProspectsOnly(!prospectsOnly);
            if (!prospectsOnly) {
              setSortField('prospect_score');
              setSortDir('desc');
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1 ${
            prospectsOnly
              ? 'bg-violet-500 text-white border-violet-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Prospects
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, comment, or post..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            Comments ({filteredComments.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500 mb-4" />
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {comments.length === 0
                ? 'No comments captured yet. Click "New Comment" to get started.'
                : 'No comments match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th
                    className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('comment_date')}
                  >
                    Date
                    <SortIcon field="comment_date" />
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('post_title')}
                  >
                    Post
                    <SortIcon field="post_title" />
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('prospect_score')}
                  >
                    Score
                    <SortIcon field="prospect_score" />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">Commenter</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Comment</th>
                  <th
                    className="px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => toggleSort('sentiment')}
                  >
                    Sentiment
                    <SortIcon field="sentiment" />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComments.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(c.comment_date + 'T00:00:00').toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate font-medium text-gray-900">{c.post_title}</p>
                      {c.linked_theme && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          {c.linked_theme}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <ProspectBadge score={c.prospect_score} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <a
                            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.commenter_name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:text-violet-500 hover:underline"
                          >
                            {c.commenter_name}
                          </a>
                          <p className="text-xs text-gray-500">
                            {c.commenter_title}
                            {c.commenter_company ? ` at ${c.commenter_company}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[400px]">
                      <details>
                        <summary className="text-gray-700 line-clamp-2 cursor-pointer hover:text-violet-500 list-none">
                          {c.comment_text.substring(0, 100)}{c.comment_text.length > 100 ? '...' : ''}
                        </summary>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap text-sm leading-relaxed border-t pt-2">
                          {c.comment_text}
                        </p>
                      </details>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentColors[c.sentiment] || sentimentColors.Neutral}`}
                      >
                        {c.sentiment}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>)}

      {/* -- Objections Tab -- */}
      {activeTab === 'objections' && (
        <div className="space-y-6">
          {/* Extract button + info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                AI analyses all captured comments and groups recurring objections, concerns, and pushback by theme.
              </p>
              {objections.length > 0 && objections[0].generated_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Last generated: {new Date(objections[0].generated_at).toLocaleString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <Button
              onClick={extractObjections}
              disabled={extracting || comments.length === 0}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {objections.length > 0 ? 'Re-extract Objections' : 'Extract Objections'}
                </>
              )}
            </Button>
          </div>

          {/* Loading */}
          {(objectionsLoading || extracting) && objections.length === 0 && (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-violet-500 mb-4" />
              <p className="text-gray-500">
                {extracting ? 'AI is analysing all comments for objections...' : 'Loading objections...'}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!objectionsLoading && !extracting && objections.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
              <ShieldAlert className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No objections extracted yet.</p>
              <p className="text-sm text-gray-400">
                Click &quot;Extract Objections&quot; to have AI scan your {comments.length} comments for recurring concerns and pushback.
              </p>
            </div>
          )}

          {/* Objection cards */}
          {objections.length > 0 && (
            <div className="grid gap-4">
              {objections.map((obj) => (
                <div key={obj.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{obj.objection_theme}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{obj.description}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      {obj.comment_count} comment{obj.comment_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {obj.example_quotes.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Example quotes</p>
                      {obj.example_quotes.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Quote className="h-3.5 w-3.5 text-gray-300 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-700 italic">&quot;{q.excerpt}&quot;</span>
                            <span className="text-gray-400 ml-1.5">-- {q.commenter_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
