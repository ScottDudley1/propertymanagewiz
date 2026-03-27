'use client';

/**
 * Blog Comment Moderation Page
 * Approve, reject, or mark as spam website comments on blog posts
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Search,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui';
import { createClient } from '@/lib/supabase';

interface BlogComment {
  id: string;
  blog_post_id: string;
  blog_post_slug: string;
  author_name: string;
  comment_text: string;
  status: string;
  ip_address: string | null;
  honeypot_value: string;
  user_agent: string | null;
  linked_theme: string | null;
  created_at: string;
  moderated_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  spam: 'bg-gray-100 text-gray-700',
};

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'spam';

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

export default function BlogCommentModerationPage() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blog-comments/admin`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching blog comments:', err);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blog-comments/admin/${id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
      }
    } catch (err) {
      console.error('Error updating comment:', err);
    }
    setActionLoading(null);
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment permanently?')) return;
    setActionLoading(id);
    try {
      const headers = await getAuthHeaders();
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/blog-comments/admin/${id}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
    setActionLoading(null);
  };

  // Counts per status
  const counts = useMemo(() => {
    const c = { all: comments.length, pending: 0, approved: 0, rejected: 0, spam: 0 };
    for (const comment of comments) {
      if (comment.status in c) c[comment.status as keyof typeof c]++;
    }
    return c;
  }, [comments]);

  // Filtered comments
  const filtered = useMemo(() => {
    let result = comments;
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.author_name.toLowerCase().includes(q) ||
          c.comment_text.toLowerCase().includes(q) ||
          c.blog_post_slug.toLowerCase().includes(q)
      );
    }
    return result;
  }, [comments, activeFilter, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'spam', label: 'Spam' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-violet-500" />
            Blog Comments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate comments from website visitors
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name, email, or comment text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-sm"
        />
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {comments.length === 0
            ? 'No blog comments yet.'
            : `No ${activeFilter === 'all' ? '' : activeFilter} comments found.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {comment.author_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[comment.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {comment.status}
                    </span>
                    {comment.honeypot_value && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        honeypot triggered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{formatDate(comment.created_at)}</span>
                    <Link
                      href={`/blog/${comment.blog_post_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:underline flex items-center gap-1"
                    >
                      {comment.blog_post_slug}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {comment.linked_theme && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-500">
                        {comment.linked_theme}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {actionLoading === comment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <>
                      {comment.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(comment.id, 'approved')}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {comment.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(comment.id, 'rejected')}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {comment.status !== 'spam' && (
                        <button
                          onClick={() => updateStatus(comment.id, 'spam')}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Mark as spam"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Comment text */}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {comment.comment_text}
              </p>

              {/* IP info for spam investigation */}
              {(comment.status === 'spam' || comment.status === 'pending') && comment.ip_address && (
                <p className="text-xs text-gray-400">
                  IP: {comment.ip_address}
                  {comment.user_agent && ` | UA: ${comment.user_agent.substring(0, 80)}...`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
