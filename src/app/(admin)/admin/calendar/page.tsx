'use client';

/**
 * Content Calendar Page
 * Keyword-targeted content planning with queue management
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Download,
  Play,
  Trash2,
  Edit3,
  X,
  Loader2,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button, Input, Select, Textarea, Label } from '@/components/ui';

async function getAuthHeaders() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

interface CalendarItem {
  id: string;
  target_keyword: string;
  secondary_keywords: string[];
  suggested_title: string | null;
  search_volume: number | null;
  keyword_difficulty: number | null;
  source: string;
  category: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'queued' | 'generating' | 'published' | 'skipped';
  notes: string | null;
  blog_post_id: string | null;
  planned_date: string | null;
  created_at: string;
  blog_posts?: { title: string; slug: string; status: string } | null;
}

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  queued: 'bg-yellow-100 text-yellow-700',
  generating: 'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
  skipped: 'bg-gray-100 text-gray-500',
};

const priorityIcons: Record<string, any> = {
  high: ArrowUpCircle,
  medium: ArrowRightCircle,
  low: ArrowDownCircle,
};

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-gray-400',
};

export default function ContentCalendarPage() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    target_keyword: '',
    secondary_keywords: '',
    suggested_title: '',
    search_volume: '',
    keyword_difficulty: '',
    category: '',
    priority: 'medium',
    planned_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar?${params}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setForm({
      target_keyword: '',
      secondary_keywords: '',
      suggested_title: '',
      search_volume: '',
      keyword_difficulty: '',
      category: '',
      priority: 'medium',
      planned_date: '',
      notes: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.target_keyword.trim()) {
      showMsg('error', 'Target keyword is required');
      return;
    }

    const body: any = {
      target_keyword: form.target_keyword.trim(),
      secondary_keywords: form.secondary_keywords
        ? form.secondary_keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
      suggested_title: form.suggested_title || null,
      search_volume: form.search_volume ? parseInt(form.search_volume) : null,
      keyword_difficulty: form.keyword_difficulty ? parseInt(form.keyword_difficulty) : null,
      category: form.category || null,
      priority: form.priority,
      planned_date: form.planned_date || null,
      notes: form.notes || null,
    };

    try {
      const isEdit = !!editingId;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar/${editingId}`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar`;

      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        showMsg('success', isEdit ? 'Entry updated' : 'Keyword added to calendar');
        resetForm();
        fetchItems();
      } else {
        const err = await response.json().catch(() => ({}));
        showMsg('error', err.error || 'Failed to save');
      }
    } catch (error) {
      showMsg('error', 'Failed to save');
    }
  };

  const handleQueue = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar/queue/${id}`,
        { method: 'POST', headers }
      );
      if (response.ok) {
        showMsg('success', 'Queued for generation');
        fetchItems();
      }
    } catch {
      showMsg('error', 'Failed to queue');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar/${id}`, {
        method: 'DELETE',
        headers,
      });
      fetchItems();
    } catch {
      showMsg('error', 'Failed to delete');
    }
  };

  const handleEdit = (item: CalendarItem) => {
    setForm({
      target_keyword: item.target_keyword,
      secondary_keywords: item.secondary_keywords?.join(', ') || '',
      suggested_title: item.suggested_title || '',
      search_volume: item.search_volume?.toString() || '',
      keyword_difficulty: item.keyword_difficulty?.toString() || '',
      category: item.category || '',
      priority: item.priority,
      planned_date: item.planned_date || '',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calendar/import`,
        { method: 'POST', headers }
      );
      const data = await response.json();
      if (data.imported > 0) {
        showMsg('success', `Imported ${data.imported} keywords from flywheel`);
        fetchItems();
      } else {
        showMsg('success', data.message || 'Nothing to import');
      }
    } catch {
      showMsg('error', 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  const counts = {
    planned: items.filter((i) => i.status === 'planned').length,
    queued: items.filter((i) => i.status === 'queued').length,
    published: items.filter((i) => i.status === 'published').length,
    total: items.length,
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-violet-500" />
          <div>
            <h1 className="text-2xl font-bold">Content Calendar</h1>
            <p className="text-gray-500">Plan and manage keyword-targeted content</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleImport} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Import from Flywheel
          </Button>
          <Button onClick={() => { resetForm(); setShowAddForm(true); }}>
            <Plus className="h-4 w-4" /> Add Keyword
          </Button>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg font-medium ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-700' },
          { label: 'Planned', value: counts.planned, color: 'text-blue-600' },
          { label: 'Queued', value: counts.queued, color: 'text-yellow-600' },
          { label: 'Published', value: counts.published, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'planned', 'queued', 'generating', 'published', 'skipped'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{editingId ? 'Edit Entry' : 'Add New Keyword'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Target Keyword *</Label>
              <Input
                type="text"
                value={form.target_keyword}
                onChange={(e) => setForm({ ...form, target_keyword: e.target.value })}
                placeholder="e.g. property management tips"
                className="text-sm"
              />
            </div>
            <div>
              <Label>Secondary Keywords</Label>
              <Input
                type="text"
                value={form.secondary_keywords}
                onChange={(e) => setForm({ ...form, secondary_keywords: e.target.value })}
                placeholder="Comma-separated"
                className="text-sm"
              />
            </div>
            <div>
              <Label>Suggested Title</Label>
              <Input
                type="text"
                value={form.suggested_title}
                onChange={(e) => setForm({ ...form, suggested_title: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Tenant Screening"
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Volume</Label>
                <Input
                  type="number"
                  value={form.search_volume}
                  onChange={(e) => setForm({ ...form, search_volume: e.target.value })}
                  placeholder="Monthly"
                  className="text-sm"
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Input
                  type="number"
                  value={form.keyword_difficulty}
                  onChange={(e) => setForm({ ...form, keyword_difficulty: e.target.value })}
                  placeholder="0-100"
                  className="text-sm"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Planned Date</Label>
              <Input
                type="date"
                value={form.planned_date}
                onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Update' : 'Add to Calendar'}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No calendar entries yet. Add a keyword or import from Flywheel.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Priority</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Keyword</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Volume</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Source</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const PriorityIcon = priorityIcons[item.priority] || ArrowRightCircle;
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <PriorityIcon className={`h-5 w-5 ${priorityColors[item.priority]}`} />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.target_keyword}</p>
                        {item.suggested_title && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.suggested_title}</p>
                        )}
                        {item.blog_posts && (
                          <Link
                            href={`/blog/${item.blog_posts.slug}`}
                            className="text-xs text-violet-500 hover:underline mt-0.5 block"
                          >
                            {item.blog_posts.title}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.category || '\u2014'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.search_volume ? item.search_volume.toLocaleString() : '\u2014'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.planned_date || '\u2014'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{item.source}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'planned' && (
                          <button
                            onClick={() => handleQueue(item.id)}
                            className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"
                            title="Queue for generation"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {(item.status === 'planned' || item.status === 'queued') && (
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
