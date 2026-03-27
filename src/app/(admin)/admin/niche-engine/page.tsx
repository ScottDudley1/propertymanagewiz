'use client';

/**
 * Niche Discovery Engine
 * Generates, scores, and ranks niche candidates for decision engine portfolio
 */

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Check, X, Zap, ListChecks, BarChart3, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

/* ─── Types ─── */

interface SeedCategory {
  id: number;
  category_name: string;
  industry: string;
  example_niches: string[];
  priority: number;
}

interface Candidate {
  id: number;
  name: string;
  category: string;
  industry: string;
  status: string;
  created_at: string;
}

interface ScoredNiche {
  id: number;
  candidate_id: number;
  vendor_count_score: number;
  purchase_value_score: number;
  buyer_confusion_score: number;
  serp_weakness_score: number;
  vendor_messaging_score: number;
  trends_score: number;
  total_score: number;
  scoring_notes: string;
  scored_at: string;
  candidate?: Candidate;
}

const SIGNALS = [
  { key: 'vendor_count_score', label: 'Vendor Count', desc: '10\u201340 vendors in the market' },
  { key: 'purchase_value_score', label: 'Purchase Value', desc: '$500\u2013$50k purchase range' },
  { key: 'buyer_confusion_score', label: 'Buyer Confusion', desc: 'Comparison search queries exist' },
  { key: 'serp_weakness_score', label: 'Weak SERP', desc: 'No major comparison platforms ranking' },
  { key: 'vendor_messaging_score', label: 'Poor Messaging', desc: 'Buzzwords, hidden pricing' },
  { key: 'trends_score', label: 'Google Trends', desc: 'Rosetta Stone \u2014 keyword in sweet spot range vs orchid care, leadership skills, beekeeping, improve memory. Stable or trending up.' },
] as const;

type SignalKey = typeof SIGNALS[number]['key'];

const SCORE_BADGES: Record<number, { label: string; classes: string }> = {
  6: { label: 'Goldmine', classes: 'bg-green-100 text-green-700' },
  5: { label: 'Goldmine', classes: 'bg-green-100 text-green-700' },
  4: { label: 'Strong', classes: 'bg-green-100 text-green-700' },
  3: { label: 'Moderate', classes: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'Weak', classes: 'bg-red-100 text-red-700' },
  1: { label: 'Weak', classes: 'bg-red-100 text-red-700' },
  0: { label: 'Unscored', classes: 'bg-gray-100 text-gray-700' },
};

function ScoreBadge({ score }: { score: number }) {
  const badge = SCORE_BADGES[score] ?? SCORE_BADGES[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badge.classes}`}>
      {score}/6 {badge.label}
    </span>
  );
}

/* ─── Seed Categories Table ─── */

function CategoryTable({
  categories,
  onGenerate,
  onGenerateAll,
  generatingId,
  generatingAll,
}: {
  categories: SeedCategory[];
  onGenerate: (cat: SeedCategory) => Promise<void>;
  onGenerateAll: () => Promise<void>;
  generatingId: number | null;
  generatingAll: boolean;
}) {
  return (
    <Card className="p-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-500" />
          <h2 className="font-semibold text-gray-900">Seed Categories</h2>
        </div>
        <Button size="sm" onClick={onGenerateAll} disabled={generatingAll || generatingId !== null}>
          {generatingAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : 'Generate All'}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Industry</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">Priority</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">Examples</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.category_name}</td>
                <td className="px-4 py-3 text-gray-600">{cat.industry}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    cat.priority === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    P{cat.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{cat.example_niches?.length ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onGenerate(cat)}
                    disabled={generatingId === cat.id || generatingAll}
                  >
                    {generatingId === cat.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : 'Generate Candidates'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── Scoring Panel ─── */

function ScoringPanel({
  candidate,
  onSave,
  onCancel,
}: {
  candidate: Candidate;
  onSave: (scores: Record<SignalKey, number>, notes: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<Record<SignalKey, number>>({
    vendor_count_score: 0,
    purchase_value_score: 0,
    buyer_confusion_score: 0,
    serp_weakness_score: 0,
    vendor_messaging_score: 0,
    trends_score: 0,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const toggle = (key: SignalKey) => setScores(s => ({ ...s, [key]: s[key] === 1 ? 0 : 1 }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(scores, notes);
    setSaving(false);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Score: {candidate.name}</h3>
        <ScoreBadge score={total} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SIGNALS.map(sig => {
          const active = scores[sig.key] === 1;
          return (
            <div
              key={sig.key}
              onClick={() => toggle(sig.key)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                active
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                active ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
              }`}>
                {active && <Check className="h-3 w-3 text-white" />}
              </div>
              <div>
                <div className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-700'}`}>{sig.label}</div>
                <div className="text-xs text-gray-500">{sig.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Vendor names, SERP observations, rough pricing..."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : 'Save Score'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

/* ─── Pending Candidates Queue ─── */

function PendingQueue({
  candidates,
  onScore,
  onAutoScore,
  onAutoScoreAll,
  autoScoringId,
  autoScoringAll,
  autoScoreProgress,
  autoScoreResults,
}: {
  candidates: Candidate[];
  onScore: (candidate: Candidate, scores: Record<SignalKey, number>, notes: string) => Promise<void>;
  onAutoScore: (candidateId: number) => Promise<void>;
  onAutoScoreAll: () => void;
  autoScoringId: number | null;
  autoScoringAll: boolean;
  autoScoreProgress: string;
  autoScoreResults: Record<number, 'success' | 'error'>;
}) {
  const [scoringId, setScoringId] = useState<number | null>(null);
  const busy = autoScoringAll || autoScoringId !== null;

  if (candidates.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-400 py-6 italic">No pending candidates. Generate some from seed categories above.</p>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-violet-500" />
          <h2 className="font-semibold text-gray-900">Pending Candidates</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {autoScoringAll ? autoScoreProgress : `${candidates.length} awaiting scoring`}
          </span>
          <Button
            size="sm"
            onClick={onAutoScoreAll}
            disabled={busy || candidates.length === 0}
          >
            {autoScoringAll ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scoring...
              </>
            ) : 'Auto-Score All'}
          </Button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {candidates.map(c => (
          <div key={c.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="ml-2 text-xs text-gray-400">{c.category} · {c.industry}</span>
              </div>
              <div className="flex items-center gap-2">
                {autoScoreResults[c.id] === 'success' && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {autoScoreResults[c.id] === 'error' && (
                  <X className="h-4 w-4 text-red-500" />
                )}
                {autoScoringId === c.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                )}
                {scoringId !== c.id && autoScoringId !== c.id && !autoScoreResults[c.id] && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAutoScore(c.id)}
                      disabled={busy}
                    >
                      Auto-Score
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setScoringId(c.id)}
                      disabled={busy}
                    >
                      Score
                    </Button>
                  </>
                )}
              </div>
            </div>
            {scoringId === c.id && (
              <ScoringPanel
                candidate={c}
                onSave={async (scores, notes) => {
                  await onScore(c, scores, notes);
                  setScoringId(null);
                }}
                onCancel={() => setScoringId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Score Edit Panel ─── */

function ScoreEditPanel({
  niche,
  onSave,
  onCancel,
}: {
  niche: ScoredNiche;
  onSave: (id: number, scores: Record<SignalKey, number>, notes: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<Record<SignalKey, number>>({
    vendor_count_score: niche.vendor_count_score,
    purchase_value_score: niche.purchase_value_score,
    buyer_confusion_score: niche.buyer_confusion_score,
    serp_weakness_score: niche.serp_weakness_score,
    vendor_messaging_score: niche.vendor_messaging_score,
    trends_score: niche.trends_score,
  });
  const [notes, setNotes] = useState(niche.scoring_notes || '');
  const [saving, setSaving] = useState(false);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const toggle = (key: SignalKey) => setScores(s => ({ ...s, [key]: s[key] === 1 ? 0 : 1 }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(niche.id, scores, notes);
    setSaving(false);
  };

  return (
    <tr>
      <td colSpan={7} className="px-4 py-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Edit: {niche.candidate?.name ?? '\u2014'}</h3>
            <ScoreBadge score={total} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SIGNALS.map(sig => {
              const active = scores[sig.key] === 1;
              return (
                <div
                  key={sig.key}
                  onClick={() => toggle(sig.key)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                    active ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
                  }`}>
                    {active && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-700'}`}>{sig.label}</div>
                    <div className="text-xs text-gray-500">{sig.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Scoring notes..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── Scored Niches Tab ─── */

function ScoredNichesTab({
  scoredNiches,
  onEditScore,
}: {
  scoredNiches: ScoredNiche[];
  onEditScore: (id: number, scores: Record<SignalKey, number>, notes: string) => Promise<void>;
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const categories = [...new Set(scoredNiches.map(s => s.candidate?.category).filter(Boolean))];

  const filtered = scoredNiches.filter(s => {
    if (categoryFilter !== 'all' && s.candidate?.category !== categoryFilter) return false;
    if (s.total_score < minScore) return false;
    return true;
  });

  const goldmines = scoredNiches.filter(s => s.total_score >= 5).length;
  const avgScore = scoredNiches.length
    ? (scoredNiches.reduce((acc, s) => acc + s.total_score, 0) / scoredNiches.length).toFixed(1)
    : '\u2013';

  return (
    <div className="space-y-6">
      {/* Stats */}
      {scoredNiches.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500 mb-1">Total Scored</p>
            <p className="text-3xl font-bold text-gray-900">{scoredNiches.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 mb-1">Goldmines (5\u20136)</p>
            <p className="text-3xl font-bold text-gray-900">{goldmines}</p>
            <p className="text-xs text-gray-400 mt-1">strong candidates</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
            <p className="text-xs text-gray-400 mt-1">out of 6.0</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={minScore}
          onChange={e => setMinScore(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          <option value={0}>Min Score: Any</option>
          <option value={1}>Min Score: 1+</option>
          <option value={2}>Min Score: 2+</option>
          <option value={3}>Min Score: 3+</option>
          <option value={4}>Min Score: 4+ (Strong)</option>
          <option value={5}>Min Score: 5+ (Goldmines)</option>
          <option value={6}>Min Score: 6 (Perfect)</option>
        </select>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <Card className="p-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ranked Niches</h2>
            <span className="text-xs text-gray-400">sorted by score</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500 w-12">#</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Niche</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-center">Score</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  editingId === s.id ? (
                    <ScoreEditPanel
                      key={s.id}
                      niche={s}
                      onSave={async (id, scores, notes) => {
                        await onEditScore(id, scores, notes);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={s.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.candidate?.name ?? '\u2014'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.candidate?.category ?? '\u2014'}</td>
                      <td className="px-4 py-3 text-center"><ScoreBadge score={s.total_score} /></td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.scoring_notes || '\u2014'}</td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {s.scored_at ? new Date(s.scored_at).toLocaleDateString('en-AU') : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingId(s.id)}
                          className="text-gray-400 hover:text-violet-500 transition-colors"
                          title="Edit score"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-center text-gray-400 py-8 italic">
            {scoredNiches.length === 0
              ? 'No niches scored yet. Generate candidates and score them from the Generator tab.'
              : 'No niches match the current filters.'}
          </p>
        </Card>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function NicheEnginePage() {
  const [tab, setTab] = useState<'generator' | 'scored'>('generator');
  const [categories, setCategories] = useState<SeedCategory[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scoredNiches, setScoredNiches] = useState<ScoredNiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [toast, setToast] = useState('');
  const [autoScoringId, setAutoScoringId] = useState<number | null>(null);
  const [autoScoringAll, setAutoScoringAll] = useState(false);
  const [autoScoreProgress, setAutoScoreProgress] = useState('');
  const [autoScoreResults, setAutoScoreResults] = useState<Record<number, 'success' | 'error'>>({});

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ─── Helper: get session access token ─── */

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  /* ─── Data Fetching ─── */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catRes, candRes, scoreRes] = await Promise.all([
      supabase.from('niche_seed_categories').select('*').order('priority').order('category_name'),
      supabase.from('niche_candidates').select('*').eq('status', 'pending').order('created_at'),
      supabase.from('niche_scores').select('*, candidate:niche_candidates(*)').order('total_score', { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (candRes.data) setCandidates(candRes.data);
    if (scoreRes.data) setScoredNiches(scoreRes.data as ScoredNiche[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Generate Candidates ─── */

  const generateForCategory = useCallback(async (cat: SeedCategory) => {
    setGeneratingId(cat.id);
    const niches = cat.example_niches ?? [];

    // Get existing candidate names to skip duplicates
    const { data: existing } = await supabase
      .from('niche_candidates')
      .select('name')
      .in('name', niches);
    const existingNames = new Set((existing ?? []).map(e => e.name));

    const toInsert = niches
      .filter(n => !existingNames.has(n))
      .map(n => ({
        name: n,
        category: cat.category_name,
        industry: cat.industry,
        status: 'pending',
      }));

    if (toInsert.length > 0) {
      await supabase.from('niche_candidates').insert(toInsert);
    }

    showToast(`Generated ${toInsert.length} candidates from ${cat.category_name} (${niches.length - toInsert.length} skipped as duplicates)`);
    await fetchAll();
    setGeneratingId(null);
  }, [supabase, fetchAll]);

  const generateAll = useCallback(async () => {
    setGeneratingAll(true);
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const cat of categories) {
      const niches = cat.example_niches ?? [];
      const { data: existing } = await supabase
        .from('niche_candidates')
        .select('name')
        .in('name', niches);
      const existingNames = new Set((existing ?? []).map(e => e.name));
      const toInsert = niches
        .filter(n => !existingNames.has(n))
        .map(n => ({
          name: n,
          category: cat.category_name,
          industry: cat.industry,
          status: 'pending',
        }));
      if (toInsert.length > 0) {
        await supabase.from('niche_candidates').insert(toInsert);
      }
      totalInserted += toInsert.length;
      totalSkipped += niches.length - toInsert.length;
    }

    showToast(`Generated ${totalInserted} total candidates (${totalSkipped} skipped as duplicates)`);
    await fetchAll();
    setGeneratingAll(false);
  }, [supabase, categories, fetchAll]);

  /* ─── Score Candidate ─── */

  const scoreCandidate = useCallback(async (
    candidate: Candidate,
    scores: Record<SignalKey, number>,
    notes: string,
  ) => {
    await supabase.from('niche_scores').insert([{
      candidate_id: candidate.id,
      ...scores,
      scoring_notes: notes.trim() || null,
    }]);
    await supabase.from('niche_candidates').update({ status: 'scored' }).eq('id', candidate.id);
    showToast(`Scored: ${candidate.name}`);
    await fetchAll();
  }, [supabase, fetchAll]);

  /* ─── Edit Score ─── */

  const editScore = useCallback(async (
    scoreId: number,
    scores: Record<SignalKey, number>,
    notes: string,
  ) => {
    await supabase.from('niche_scores').update({
      ...scores,
      scoring_notes: notes.trim() || null,
    }).eq('id', scoreId);
    showToast('Score updated');
    await fetchAll();
  }, [supabase, fetchAll]);

  /* ─── Auto-Score ─── */

  const callScoreEndpoint = useCallback(async (candidateId: number) => {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/score-niche-candidate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidate_id: candidateId }),
      }
    );
    const result = await response.json();
    if (!response.ok || result.error) {
      return { success: false as const, error: result.error || 'Unknown error' };
    }
    return { success: true as const, name: result.name as string, total: result.scores?.total as number };
  }, [getAccessToken]);

  const autoScoreCandidate = useCallback(async (candidateId: number) => {
    setAutoScoringId(candidateId);
    try {
      const result = await callScoreEndpoint(candidateId);
      if (result.success) {
        setAutoScoreResults(prev => ({ ...prev, [candidateId]: 'success' }));
        showToast(`Auto-scored: ${result.name} (${result.total}/5)`);
      } else {
        setAutoScoreResults(prev => ({ ...prev, [candidateId]: 'error' }));
        showToast(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setAutoScoreResults(prev => ({ ...prev, [candidateId]: 'error' }));
      showToast(`Network error: ${err.message}`);
    }
    setAutoScoringId(null);
    await fetchAll();
  }, [callScoreEndpoint, fetchAll]);

  const autoScoreAll = useCallback(async () => {
    setAutoScoringAll(true);
    setAutoScoreResults({});
    const pendingList = [...candidates];
    let scored = 0;
    let errors = 0;

    for (let i = 0; i < pendingList.length; i++) {
      const c = pendingList[i];
      setAutoScoreProgress(`Scoring ${i + 1} of ${pendingList.length}...`);
      setAutoScoringId(c.id);

      try {
        const result = await callScoreEndpoint(c.id);
        if (result.success) {
          setAutoScoreResults(prev => ({ ...prev, [c.id]: 'success' }));
          scored++;
        } else {
          setAutoScoreResults(prev => ({ ...prev, [c.id]: 'error' }));
          errors++;
        }
      } catch {
        setAutoScoreResults(prev => ({ ...prev, [c.id]: 'error' }));
        errors++;
      }

      // 1-second delay between calls to avoid rate limiting
      if (i < pendingList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setAutoScoringId(null);
    setAutoScoringAll(false);
    setAutoScoreProgress('');
    showToast(`Auto-scoring complete: ${scored} scored, ${errors} errors`);
    await fetchAll();
  }, [candidates, callScoreEndpoint, fetchAll]);

  /* ─── Stats ─── */

  const totalCandidates = candidates.length + scoredNiches.length;
  const totalPending = candidates.length;
  const totalScored = scoredNiches.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Side Project \u2014 Decision Engine Portfolio</p>
        <h1 className="text-2xl font-bold text-gray-900">Niche Discovery Engine</h1>
        <p className="text-gray-500">Generate, score, and rank decision engine niches.</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          {toast}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Total Candidates</p>
          <p className="text-3xl font-bold text-gray-900">{totalCandidates}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Pending Scoring</p>
          <p className="text-3xl font-bold text-gray-900">{totalPending}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Scored</p>
          <p className="text-3xl font-bold text-gray-900">{totalScored}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('generator')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'generator' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="h-4 w-4" />
          Generator
        </button>
        <button
          onClick={() => setTab('scored')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'scored' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Scored Niches
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : tab === 'generator' ? (
        <div className="space-y-6">
          <CategoryTable
            categories={categories}
            onGenerate={generateForCategory}
            onGenerateAll={generateAll}
            generatingId={generatingId}
            generatingAll={generatingAll}
          />
          <PendingQueue
            candidates={candidates}
            onScore={scoreCandidate}
            onAutoScore={autoScoreCandidate}
            onAutoScoreAll={autoScoreAll}
            autoScoringId={autoScoringId}
            autoScoringAll={autoScoringAll}
            autoScoreProgress={autoScoreProgress}
            autoScoreResults={autoScoreResults}
          />
        </div>
      ) : (
        <ScoredNichesTab scoredNiches={scoredNiches} onEditScore={editScore} />
      )}
    </div>
  );
}
