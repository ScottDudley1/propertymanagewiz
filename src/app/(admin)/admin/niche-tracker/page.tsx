'use client'

/**
 * Niche Discovery Tracker
 * Side Project — Internal Tool (not part of OneClickMetric functionality)
 * Persisted to Supabase niche_evaluations table
 */

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ChevronDown, ChevronRight, Trash2, Plus, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

const SUPABASE_URL = 'https://yfkagntsuvgwzzbbrivy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlma2FnbnRzdXZnd3p6YmJyaXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzQ3NjQsImV4cCI6MjA4NTE1MDc2NH0.v0U4boBPrftiuSr2jP_ZCwdzWxRbMxG_733CP6zO3rc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SIGNALS = [
  { key: "vendorCount", label: "10\u201340 Vendors", desc: "Sweet spot vendor fragmentation" },
  { key: "buyerConfusion", label: "Buyer Confusion", desc: "Searches like 'best X' or 'X vs Y'" },
  { key: "purchaseValue", label: "High Purchase Value", desc: "$500\u2013$50k purchase range" },
  { key: "weakSerp", label: "Weak SERP", desc: "Vendor blogs & generic lists dominate" },
  { key: "poorMessaging", label: "Poor Vendor Messaging", desc: "Buzzwords, unclear pricing, vague features" },
];

const SCORE_BADGES: Record<number, { label: string; classes: string }> = {
  5: { label: "Goldmine", classes: "bg-green-100 text-green-700" },
  4: { label: "Strong", classes: "bg-green-100 text-green-700" },
  3: { label: "Moderate", classes: "bg-yellow-100 text-yellow-700" },
  2: { label: "Weak", classes: "bg-orange-100 text-orange-700" },
  1: { label: "Poor", classes: "bg-red-100 text-red-700" },
  0: { label: "Unscored", classes: "bg-gray-100 text-gray-700" },
};

interface SignalState {
  vendorCount: boolean;
  buyerConfusion: boolean;
  purchaseValue: boolean;
  weakSerp: boolean;
  poorMessaging: boolean;
}

interface Niche {
  id: number;
  name: string;
  signals: SignalState;
  notes: string;
  score: number;
  date: string;
}

function ScoreBadge({ score }: { score: number }) {
  const badge = SCORE_BADGES[score] ?? SCORE_BADGES[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${badge.classes}`}>
      {score}/5 {badge.label}
    </span>
  );
}

function AddNicheForm({ onAdd }: { onAdd: (niche: Omit<Niche, 'id'>) => Promise<void> }) {
  const [name, setName] = useState("");
  const [signals, setSignals] = useState<SignalState>({
    vendorCount: false,
    buyerConfusion: false,
    purchaseValue: false,
    weakSerp: false,
    poorMessaging: false,
  });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const score = Object.values(signals).filter(Boolean).length;
  const toggle = (key: keyof SignalState) => setSignals((s) => ({ ...s, [key]: !s[key] }));

  const submit = async () => {
    if (!name.trim()) { setError("Enter a niche name."); return; }
    setSaving(true);
    await onAdd({ name: name.trim(), signals: { ...signals }, score, notes: notes.trim(), date: new Date().toLocaleDateString("en-AU") });
    setName("");
    setSignals({ vendorCount: false, buyerConfusion: false, purchaseValue: false, weakSerp: false, poorMessaging: false });
    setNotes("");
    setError("");
    setSaving(false);
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Evaluate Niche</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Niche Name</label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Fleet Maintenance Software"
            onKeyDown={e => e.key === "Enter" && submit()}
          />
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signals</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SIGNALS.map(sig => {
              const active = signals[sig.key as keyof SignalState];
              return (
                <div
                  key={sig.key}
                  onClick={() => toggle(sig.key as keyof SignalState)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    active
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                    active
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                  }`}>
                    {active && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${active ? 'text-foreground' : 'text-gray-700'}`}>{sig.label}</div>
                    <div className="text-xs text-gray-500">{sig.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
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

        <div className="flex items-center justify-between pt-2">
          <ScoreBadge score={score} />
          <Button onClick={submit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Record Niche"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function NicheRow({ niche, onDelete, rank }: { niche: Niche; onDelete: (id: number) => Promise<void>; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(niche.id);
    setDeleting(false);
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        <span className="text-xs text-gray-400 w-6 flex-shrink-0">#{rank}</span>
        <span className="flex-1 font-medium text-foreground">{niche.name}</span>
        <span className="text-xs text-gray-500 mr-2">{niche.date}</span>
        <ScoreBadge score={niche.score} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 pl-14 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SIGNALS.map(sig => {
              const active = niche.signals[sig.key as keyof SignalState];
              return (
                <span
                  key={sig.key}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {sig.label}
                </span>
              );
            })}
          </div>
          {niche.notes && (
            <p className="text-sm text-gray-500 leading-relaxed">{niche.notes}</p>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-3 w-3" />
                Remove
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function NicheTrackerPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("niche_evaluations")
      .select("*")
      .order("score", { ascending: false });
    if (!error && data) setNiches(data as Niche[]);
    setLoading(false);
  };

  const addNiche = useCallback(async (n: Omit<Niche, 'id'>) => {
    const { data, error } = await supabase
      .from("niche_evaluations")
      .insert([n])
      .select()
      .single();
    if (!error && data) setNiches(prev => [...prev, data as Niche].sort((a, b) => b.score - a.score));
  }, []);

  const deleteNiche = useCallback(async (id: number) => {
    const { error } = await supabase.from("niche_evaluations").delete().eq("id", id);
    if (!error) setNiches(prev => prev.filter(n => n.id !== id));
  }, []);

  const goldmines = niches.filter(n => n.score >= 4).length;
  const avgScore = niches.length ? (niches.reduce((s, n) => s + n.score, 0) / niches.length).toFixed(1) : "\u2013";

  return (
    
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Side Project — Niche Discovery Tracker</p>
          <h1 className="text-2xl font-bold text-foreground">Niche Discovery Tracker</h1>
          <p className="text-gray-500">15 minutes a day. Score niches. Let patterns emerge. Pick one.</p>
        </div>

        {/* Stats */}
        {niches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500 mb-1">Niches Evaluated</p>
              <p className="text-3xl font-bold text-foreground">{niches.length}</p>
              <p className="text-xs text-gray-400 mt-1">/ 20 target</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Goldmines (4\u20135)</p>
              <p className="text-3xl font-bold text-foreground">{goldmines}</p>
              <p className="text-xs text-gray-400 mt-1">strong candidates</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-foreground">{avgScore}</p>
              <p className="text-xs text-gray-400 mt-1">out of 5.0</p>
            </Card>
          </div>
        )}

        {/* Phase Tracker */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { phase: "Phase 1", label: "Niche Discovery", active: niches.length < 20 },
            { phase: "Phase 2", label: "Pick One Niche", active: niches.length >= 20 },
            { phase: "Phase 3", label: "Build Engine", active: false },
            { phase: "Phase 4", label: "Content Flywheel", active: false },
          ].map(p => (
            <div
              key={p.phase}
              className={`flex-1 px-3 py-2 rounded-md text-center ${
                p.active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              <div className="text-xs font-medium">{p.phase}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.label}</div>
            </div>
          ))}
        </div>

        {/* Add Form */}
        <AddNicheForm onAdd={addNiche} />

        {/* Niche List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : niches.length > 0 ? (
          <Card className="p-0">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Evaluated Niches</h2>
              <span className="text-xs text-gray-400">sorted by score</span>
            </div>
            {niches.map((n, i) => (
              <NicheRow key={n.id} niche={n} onDelete={deleteNiche} rank={i + 1} />
            ))}
          </Card>
        ) : (
          <Card>
            <p className="text-center text-gray-400 py-8 italic">No niches yet. Start with one.</p>
          </Card>
        )}

        {/* Contextual hints */}
        {niches.length >= 10 && niches.length < 20 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            You have {niches.length} niches. Patterns should be starting to emerge. Aim for 20 before committing to Phase 2.
          </div>
        )}

        {niches.length >= 20 && goldmines >= 1 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            You have {goldmines} goldmine niche{goldmines > 1 ? "s" : ""}. Time to move to Phase 2 and pick one.
          </div>
        )}
      </div>
    
  );
}
