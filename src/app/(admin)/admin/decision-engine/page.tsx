'use client'

/**
 * Decision Engine Admin
 * Internal Tool -- manages vendors, features, rules, and sessions
 * for the deterministic decision engine (Property Management Software niche)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Eye,
  X,
  Database,
  ShoppingBag,
  Grid3X3,
  Scale,
  Activity,
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Card, Button, Input, Select, Textarea, Label, Toggle } from '@/components/ui';

/* ─── Types ─── */

interface Vendor {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  tagline: string | null;
  founded_year: number | null;
  hq_country: string | null;
  hq_city: string | null;
  company_size_tier: string | null;
  publicly_traded: boolean;
  parent_company: string | null;
  pricing_model: string | null;
  pricing_from: number | null;
  pricing_to: number | null;
  pricing_currency: string;
  pricing_per: string | null;
  pricing_notes: string | null;
  setup_fee: number | null;
  setup_fee_notes: string | null;
  free_trial: boolean;
  free_trial_days: number | null;
  free_plan: boolean;
  contract_required: boolean;
  minimum_contract_months: number | null;
  implementation_complexity: number | null;
  onboarding_support: string | null;
  typical_go_live_days: number | null;
  customer_support_tier: string | null;
  nps_score: number | null;
  review_count_g2: number | null;
  review_count_capterra: number | null;
  review_score_g2: number | null;
  review_score_capterra: number | null;
  market_position: string | null;
  best_for_summary: string | null;
  avoid_if_summary: string | null;
  active: boolean;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

interface VendorFeature {
  id: number;
  vendor_id: number;
  feature_category: string | null;
  feature_name: string;
  feature_slug: string;
  supported: boolean;
  support_level: string | null;
  is_standout: boolean;
  notes: string | null;
}

interface DecisionRule {
  id: number;
  rule_name: string;
  rule_description: string | null;
  rule_group: string | null;
  rule_order: number;
  priority: number;
  active: boolean;
  rule_type: string | null;
  condition_logic: string;
  conditions: unknown;
  action_type: string;
  action_target: string | null;
  score_adjustment: number;
  explanation_template: string | null;
  warning_message: string | null;
  created_at: string;
  updated_at: string;
}

interface DecisionSession {
  id: number;
  session_token: string;
  session_source: string | null;
  inputs: Record<string, unknown> | null;
  rule_execution_log: unknown[] | null;
  scored_vendors: unknown | null;
  recommended_vendor_ids: number[] | null;
  recommendation_explained: boolean;
  pdf_downloaded: boolean;
  clicked_vendor_id: number | null;
  clicked_at: string | null;
  converted: boolean;
  conversion_value: number | null;
  referral_code: string | null;
  user_agent: string | null;
  country_code: string | null;
  created_at: string;
  de_vendors?: { name: string } | null;
}

interface VendorTargetProfile {
  id?: number;
  vendor_id: number;
  target_type: string;
  fit_score: number;
  notes: string | null;
}

interface VendorPropertyType {
  id?: number;
  vendor_id: number;
  property_type: string;
  support_level: string | null;
  notes: string | null;
}

interface VendorPortfolioRange {
  id?: number;
  vendor_id: number;
  range_label: string;
  is_sweet_spot: boolean;
  pricing_at_range: string | null;
  notes: string | null;
}

interface VendorGeography {
  id?: number;
  vendor_id: number;
  country_code: string;
  region: string | null;
  compliance_level: string | null;
  local_support: boolean;
  local_data_residency: boolean;
  legislation_coverage: string | null;
}

interface VendorIntegrationRow {
  id?: number;
  vendor_id: number;
  integration_name: string;
  integration_slug: string;
  integration_category: string | null;
  integration_type: string | null;
}

interface VendorProCon {
  id?: number;
  vendor_id: number;
  type: 'pro' | 'con';
  category: string | null;
  content: string;
  severity: number;
  source: string | null;
}

interface VendorAffiliate {
  id?: number;
  vendor_id: number;
  programme_exists: boolean;
  programme_type: string | null;
  programme_url: string | null;
  network: string | null;
  commission_type: string | null;
  commission_value: number | null;
  commission_currency: string;
  commission_notes: string | null;
  cookie_duration_days: number | null;
  attribution_model: string | null;
  minimum_payout: number | null;
  payout_frequency: string | null;
  approval_required: boolean;
  approval_notes: string | null;
  direct_partnership_possible: boolean;
  direct_contact_name: string | null;
  direct_contact_email: string | null;
  partnership_notes: string | null;
  estimated_monthly_leads: number | null;
  estimated_monthly_revenue: number | null;
  last_checked: string | null;
  status: string | null;
}

type TabKey = 'vendors' | 'features' | 'rules' | 'sessions';

/* ─── Constants ─── */

const PRICING_MODELS = ['per_unit', 'flat_rate', 'tiered', 'quote_based', 'freemium', 'hybrid'];
const CURRENCIES = ['USD', 'AUD', 'GBP', 'NZD', 'CAD'];
const PRICING_PER = ['unit', 'property', 'month', 'user', 'quote'];
const MARKET_POSITIONS = ['budget', 'mid_market', 'premium', 'enterprise'];

const FEATURE_CATEGORIES = [
  'accounting',
  'leasing',
  'maintenance',
  'communication',
  'inspections',
  'compliance',
  'reporting',
  'automation',
  'mobile',
  'integrations',
];

const SUPPORT_LEVELS = ['full', 'partial', 'addon', 'roadmap', 'no'];

const SUPPORT_LEVEL_COLOURS: Record<string, string> = {
  full: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  addon: 'bg-blue-100 text-blue-700',
  roadmap: 'bg-purple-100 text-purple-700',
  no: 'bg-red-100 text-red-700',
};

const RULE_TYPE_COLOURS: Record<string, string> = {
  hard_exclude: 'bg-red-100 text-red-700',
  soft_exclude: 'bg-orange-100 text-orange-700',
  boost: 'bg-green-100 text-green-700',
  penalise: 'bg-amber-100 text-amber-700',
  flag_warning: 'bg-blue-100 text-blue-700',
  flag_recommended: 'bg-emerald-100 text-emerald-700',
  require_feature: 'bg-teal-100 text-teal-700',
  conflict_detection: 'bg-purple-100 text-purple-700',
};

const RULE_TYPES = [
  'hard_exclude',
  'soft_exclude',
  'boost',
  'penalise',
  'flag_warning',
  'flag_recommended',
  'require_feature',
  'conflict_detection',
];

const TARGET_TYPES = [
  'solo_landlord', 'accidental_landlord', 'portfolio_investor', 'small_agency', 'large_agency',
  'franchise_agency', 'commercial_manager', 'commercial_developer', 'hoa_strata_manager',
  'airbnb_host', 'short_term_operator', 'build_to_rent_operator', 'student_accommodation',
  'social_housing', 'mixed_portfolio_manager',
];

const PROPERTY_TYPES = [
  'residential_rental', 'residential_sales', 'commercial_office', 'commercial_retail',
  'commercial_industrial', 'short_term_rental', 'student_accommodation', 'hoa_strata',
  'build_to_rent', 'social_housing', 'mixed_use', 'holiday_letting', 'serviced_apartments',
];

const PROPERTY_SUPPORT_LEVELS = ['native', 'supported', 'partial', 'workaround'];

const PORTFOLIO_RANGES: { key: string; label: string }[] = [
  { key: 'micro_1_5', label: '1-5 units' },
  { key: 'small_6_20', label: '6-20 units' },
  { key: 'growing_21_50', label: '21-50 units' },
  { key: 'medium_51_200', label: '51-200 units' },
  { key: 'large_201_500', label: '201-500 units' },
  { key: 'portfolio_501_1000', label: '501-1,000 units' },
  { key: 'enterprise_1001_plus', label: '1,001+ units' },
];

const COMPLIANCE_LEVELS = ['native', 'supported', 'partial', 'none'];
const INTEGRATION_CATEGORIES = ['accounting', 'crm', 'payments', 'portals', 'communication', 'maintenance', 'screening', 'advertising', 'document_signing', 'analytics'];
const INTEGRATION_TYPES = ['native', 'api', 'zapier', 'manual'];
const PRO_CON_CATEGORIES = ['pricing', 'features', 'support', 'usability', 'reliability', 'scalability'];
const PRO_CON_SOURCES = ['verified_review', 'editorial', 'user_report'];
const PROGRAMME_TYPES = ['public', 'invite_only', 'direct_only'];
const NETWORKS = ['impact', 'cj', 'shareasale', 'direct', 'other'];
const COMMISSION_TYPES = ['cpa', 'revenue_share', 'flat_fee', 'hybrid'];
const ATTRIBUTION_MODELS = ['last_click', 'first_click', 'linear'];
const AFFILIATE_STATUSES = ['active', 'pending', 'not_found', 'rejected'];

/* ─── Helpers ─── */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatCurrency(amount: number | null, currency = 'USD'): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Vendor Modal ─── */

interface VendorFormData {
  name: string;
  slug: string;
  website: string;
  tagline: string;
  pricing_model: string;
  pricing_from: string;
  pricing_currency: string;
  pricing_per: string;
  free_trial: boolean;
  free_trial_days: string;
  market_position: string;
  active: boolean;
}

const EMPTY_VENDOR_FORM: VendorFormData = {
  name: '',
  slug: '',
  website: '',
  tagline: '',
  pricing_model: '',
  pricing_from: '',
  pricing_currency: 'USD',
  pricing_per: '',
  free_trial: false,
  free_trial_days: '',
  market_position: '',
  active: true,
};

function vendorToForm(v: Vendor): VendorFormData {
  return {
    name: v.name,
    slug: v.slug,
    website: v.website || '',
    tagline: v.tagline || '',
    pricing_model: v.pricing_model || '',
    pricing_from: v.pricing_from != null ? String(v.pricing_from) : '',
    pricing_currency: v.pricing_currency || 'USD',
    pricing_per: v.pricing_per || '',
    free_trial: v.free_trial,
    free_trial_days: v.free_trial_days != null ? String(v.free_trial_days) : '',
    market_position: v.market_position || '',
    active: v.active,
  };
}

function VendorModal({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const isEdit = vendor !== null;
  const [form, setForm] = useState<VendorFormData>(
    isEdit ? vendorToForm(vendor) : { ...EMPTY_VENDOR_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: isEdit ? f.slug : toSlug(name),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      website: form.website.trim() || null,
      tagline: form.tagline.trim() || null,
      pricing_model: form.pricing_model || null,
      pricing_from: form.pricing_from ? parseFloat(form.pricing_from) : null,
      pricing_currency: form.pricing_currency,
      pricing_per: form.pricing_per || null,
      free_trial: form.free_trial,
      free_trial_days: form.free_trial && form.free_trial_days ? parseInt(form.free_trial_days) : null,
      market_position: form.market_position || null,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (isEdit) {
      result = await supabase.from('de_vendors').update(payload).eq('id', vendor.id);
    } else {
      result = await supabase.from('de_vendors').insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Vendor' : 'Add Vendor'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Buildium"
            />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="e.g. buildium"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="Short description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pricing Model</Label>
              <Select
                value={form.pricing_model}
                onChange={(e) => setForm((f) => ({ ...f, pricing_model: e.target.value }))}
              >
                <option value="">Select...</option>
                {PRICING_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {formatLabel(m)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Pricing From</Label>
              <Input
                type="number"
                value={form.pricing_from}
                onChange={(e) => setForm((f) => ({ ...f, pricing_from: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Currency</Label>
              <Select
                value={form.pricing_currency}
                onChange={(e) => setForm((f) => ({ ...f, pricing_currency: e.target.value }))}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Per</Label>
              <Select
                value={form.pricing_per}
                onChange={(e) => setForm((f) => ({ ...f, pricing_per: e.target.value }))}
              >
                <option value="">Select...</option>
                {PRICING_PER.map((p) => (
                  <option key={p} value={p}>
                    {formatLabel(p)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Market Position</Label>
            <Select
              value={form.market_position}
              onChange={(e) => setForm((f) => ({ ...f, market_position: e.target.value }))}
            >
              <option value="">Select...</option>
              {MARKET_POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {formatLabel(p)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Toggle
                checked={form.free_trial}
                onChange={(e) =>
                  setForm((f) => ({ ...f, free_trial: (e.target as HTMLInputElement).checked }))
                }
              />
              <span className="text-sm text-gray-700">Free Trial</span>
            </div>
            {form.free_trial && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-20"
                  value={form.free_trial_days}
                  onChange={(e) => setForm((f) => ({ ...f, free_trial_days: e.target.value }))}
                  placeholder="Days"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))
              }
            />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section wrapper ─── */

function DetailSection({
  title,
  saving,
  onSave,
  children,
}: {
  title: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Save
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

/* ─── Vendor Detail Slide-In ─── */

function VendorDetailSlideIn({
  vendor,
  onClose,
  onEdit,
  showToast,
}: {
  vendor: Vendor;
  onClose: () => void;
  onEdit: () => void;
  showToast: (msg: string) => void;
}) {
  const supabase = createClient();

  // Section loading states
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [loadingGeos, setLoadingGeos] = useState(true);
  const [loadingInts, setLoadingInts] = useState(true);
  const [loadingPros, setLoadingPros] = useState(true);
  const [loadingAff, setLoadingAff] = useState(true);

  // Section saving states
  const [savingTargets, setSavingTargets] = useState(false);
  const [savingProps, setSavingProps] = useState(false);
  const [savingRanges, setSavingRanges] = useState(false);
  const [savingGeos, setSavingGeos] = useState(false);
  const [savingInts, setSavingInts] = useState(false);
  const [savingPros, setSavingPros] = useState(false);
  const [savingAff, setSavingAff] = useState(false);

  // Section data
  const [targets, setTargets] = useState<Record<string, { fit_score: number; notes: string }>>({});
  const [props, setProps] = useState<Record<string, { checked: boolean; support_level: string; notes: string }>>({});
  const [ranges, setRanges] = useState<Record<string, { checked: boolean; is_sweet_spot: boolean; pricing_at_range: string; notes: string }>>({});
  const [geos, setGeos] = useState<VendorGeography[]>([]);
  const [ints, setInts] = useState<VendorIntegrationRow[]>([]);
  const [prosCons, setProsCons] = useState<VendorProCon[]>([]);
  const [affiliate, setAffiliate] = useState<VendorAffiliate | null>(null);
  const [affExists, setAffExists] = useState(false);

  // Load all section data
  useEffect(() => {
    const vid = vendor.id;

    // Target Profiles
    supabase.from('de_vendor_target_profiles').select('*').eq('vendor_id', vid).then(({ data }) => {
      const m: Record<string, { fit_score: number; notes: string }> = {};
      TARGET_TYPES.forEach((t) => { m[t] = { fit_score: 0, notes: '' }; });
      (data || []).forEach((r: VendorTargetProfile) => { m[r.target_type] = { fit_score: r.fit_score, notes: r.notes || '' }; });
      setTargets(m);
      setLoadingTargets(false);
    });

    // Property Types
    supabase.from('de_vendor_property_types').select('*').eq('vendor_id', vid).then(({ data }) => {
      const m: Record<string, { checked: boolean; support_level: string; notes: string }> = {};
      PROPERTY_TYPES.forEach((t) => { m[t] = { checked: false, support_level: '', notes: '' }; });
      (data || []).forEach((r: VendorPropertyType) => { m[r.property_type] = { checked: true, support_level: r.support_level || '', notes: r.notes || '' }; });
      setProps(m);
      setLoadingProps(false);
    });

    // Portfolio Ranges
    supabase.from('de_vendor_portfolio_ranges').select('*').eq('vendor_id', vid).then(({ data }) => {
      const m: Record<string, { checked: boolean; is_sweet_spot: boolean; pricing_at_range: string; notes: string }> = {};
      PORTFOLIO_RANGES.forEach((r) => { m[r.key] = { checked: false, is_sweet_spot: false, pricing_at_range: '', notes: '' }; });
      (data || []).forEach((r: VendorPortfolioRange) => { m[r.range_label] = { checked: true, is_sweet_spot: r.is_sweet_spot, pricing_at_range: r.pricing_at_range || '', notes: r.notes || '' }; });
      setRanges(m);
      setLoadingRanges(false);
    });

    // Geographies
    supabase.from('de_vendor_geographies').select('*').eq('vendor_id', vid).then(({ data }) => {
      setGeos((data || []) as VendorGeography[]);
      setLoadingGeos(false);
    });

    // Integrations
    supabase.from('de_vendor_integrations').select('*').eq('vendor_id', vid).then(({ data }) => {
      setInts((data || []) as VendorIntegrationRow[]);
      setLoadingInts(false);
    });

    // Pros & Cons
    supabase.from('de_vendor_pros_cons').select('*').eq('vendor_id', vid).order('type').then(({ data }) => {
      setProsCons((data || []) as VendorProCon[]);
      setLoadingPros(false);
    });

    // Affiliate
    supabase.from('de_vendor_affiliate_programmes').select('*').eq('vendor_id', vid).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setAffiliate(data[0] as VendorAffiliate);
        setAffExists(data[0].programme_exists ?? false);
      } else {
        setAffiliate({
          vendor_id: vid, programme_exists: false, programme_type: null, programme_url: null, network: null,
          commission_type: null, commission_value: null, commission_currency: 'USD',
          commission_notes: null, cookie_duration_days: null, attribution_model: null,
          minimum_payout: null, payout_frequency: null, approval_required: false,
          approval_notes: null, direct_partnership_possible: false, direct_contact_name: null,
          direct_contact_email: null, partnership_notes: null, estimated_monthly_leads: null,
          estimated_monthly_revenue: null, last_checked: null, status: null,
        });
        setAffExists(false);
      }
      setLoadingAff(false);
    });
  }, [vendor.id, supabase]);

  // Save handlers
  const saveTargets = async () => {
    setSavingTargets(true);
    const toUpsert: { vendor_id: number; target_type: string; fit_score: number; notes: string | null }[] = [];
    const toDelete: string[] = [];
    for (const [type, val] of Object.entries(targets)) {
      if (val.fit_score > 0) toUpsert.push({ vendor_id: vendor.id, target_type: type, fit_score: val.fit_score, notes: val.notes.trim() || null });
      else toDelete.push(type);
    }
    if (toDelete.length) await supabase.from('de_vendor_target_profiles').delete().eq('vendor_id', vendor.id).in('target_type', toDelete);
    if (toUpsert.length) await supabase.from('de_vendor_target_profiles').upsert(toUpsert, { onConflict: 'vendor_id,target_type' });
    setSavingTargets(false);
    showToast('Target profiles saved.');
  };

  const saveProps = async () => {
    setSavingProps(true);
    const toUpsert: { vendor_id: number; property_type: string; support_level: string | null; notes: string | null }[] = [];
    const toDelete: string[] = [];
    for (const [type, val] of Object.entries(props)) {
      if (val.checked) toUpsert.push({ vendor_id: vendor.id, property_type: type, support_level: val.support_level || null, notes: val.notes.trim() || null });
      else toDelete.push(type);
    }
    if (toDelete.length) await supabase.from('de_vendor_property_types').delete().eq('vendor_id', vendor.id).in('property_type', toDelete);
    if (toUpsert.length) await supabase.from('de_vendor_property_types').upsert(toUpsert, { onConflict: 'vendor_id,property_type' });
    setSavingProps(false);
    showToast('Property types saved.');
  };

  const saveRanges = async () => {
    setSavingRanges(true);
    const toUpsert: { vendor_id: number; range_label: string; is_sweet_spot: boolean; pricing_at_range: string | null; notes: string | null }[] = [];
    const toDelete: string[] = [];
    for (const [key, val] of Object.entries(ranges)) {
      if (val.checked) toUpsert.push({ vendor_id: vendor.id, range_label: key, is_sweet_spot: val.is_sweet_spot, pricing_at_range: val.pricing_at_range.trim() || null, notes: val.notes.trim() || null });
      else toDelete.push(key);
    }
    if (toDelete.length) await supabase.from('de_vendor_portfolio_ranges').delete().eq('vendor_id', vendor.id).in('range_label', toDelete);
    if (toUpsert.length) await supabase.from('de_vendor_portfolio_ranges').upsert(toUpsert, { onConflict: 'vendor_id,range_label' });
    setSavingRanges(false);
    showToast('Portfolio ranges saved.');
  };

  const saveGeos = async () => {
    setSavingGeos(true);
    await supabase.from('de_vendor_geographies').delete().eq('vendor_id', vendor.id);
    const rows = geos.filter((g) => g.country_code.trim()).map((g) => ({
      vendor_id: vendor.id,
      country_code: g.country_code.trim(),
      region: g.region?.trim() || null,
      compliance_level: g.compliance_level || null,
      local_support: g.local_support,
      local_data_residency: g.local_data_residency,
      legislation_coverage: g.legislation_coverage?.trim() || null,
    }));
    if (rows.length) await supabase.from('de_vendor_geographies').insert(rows);
    setSavingGeos(false);
    showToast('Geographies saved.');
  };

  const saveInts = async () => {
    setSavingInts(true);
    await supabase.from('de_vendor_integrations').delete().eq('vendor_id', vendor.id);
    const rows = ints.filter((i) => i.integration_name.trim()).map((i) => ({
      vendor_id: vendor.id,
      integration_name: i.integration_name.trim(),
      integration_slug: i.integration_slug || toSlug(i.integration_name),
      integration_category: i.integration_category || null,
      integration_type: i.integration_type || null,
    }));
    if (rows.length) await supabase.from('de_vendor_integrations').insert(rows);
    setSavingInts(false);
    showToast('Integrations saved.');
  };

  const savePros = async () => {
    setSavingPros(true);
    await supabase.from('de_vendor_pros_cons').delete().eq('vendor_id', vendor.id);
    const rows = prosCons.filter((p) => p.content.trim()).map((p) => ({
      vendor_id: vendor.id,
      type: p.type,
      category: p.category || null,
      content: p.content.trim(),
      severity: p.severity,
      source: p.source || null,
    }));
    if (rows.length) await supabase.from('de_vendor_pros_cons').insert(rows);
    setSavingPros(false);
    showToast('Pros & Cons saved.');
  };

  const saveAffiliate = async () => {
    if (!affiliate) return;
    setSavingAff(true);
    const payload = {
      vendor_id: vendor.id,
      programme_exists: affExists,
      programme_type: affiliate.programme_type || null,
      programme_url: affiliate.programme_url?.trim() || null,
      network: affiliate.network || null,
      commission_type: affiliate.commission_type || null,
      commission_value: affiliate.commission_value,
      commission_currency: affiliate.commission_currency || 'USD',
      commission_notes: affiliate.commission_notes?.trim() || null,
      cookie_duration_days: affiliate.cookie_duration_days,
      attribution_model: affiliate.attribution_model || null,
      minimum_payout: affiliate.minimum_payout,
      payout_frequency: affiliate.payout_frequency?.trim() || null,
      approval_required: affiliate.approval_required,
      approval_notes: affiliate.approval_notes?.trim() || null,
      direct_partnership_possible: affiliate.direct_partnership_possible,
      direct_contact_name: affiliate.direct_contact_name?.trim() || null,
      direct_contact_email: affiliate.direct_contact_email?.trim() || null,
      partnership_notes: affiliate.partnership_notes?.trim() || null,
      estimated_monthly_leads: affiliate.estimated_monthly_leads,
      estimated_monthly_revenue: affiliate.estimated_monthly_revenue,
      last_checked: affiliate.last_checked || null,
      status: affiliate.status || null,
    };
    if (affExists && affiliate.id) {
      await supabase.from('de_vendor_affiliate_programmes').update(payload).eq('id', affiliate.id);
    } else {
      const { data } = await supabase.from('de_vendor_affiliate_programmes').insert(payload).select('id').single();
      if (data) { setAffiliate((a) => a ? { ...a, id: data.id } : a); setAffExists(true); }
    }
    setSavingAff(false);
    showToast('Affiliate programme saved.');
  };

  const fields: [string, string | number | boolean | null][] = [
    ['Name', vendor.name], ['Slug', vendor.slug], ['Website', vendor.website],
    ['Tagline', vendor.tagline], ['Founded', vendor.founded_year],
    ['HQ', [vendor.hq_city, vendor.hq_country].filter(Boolean).join(', ') || null],
    ['Company Size', vendor.company_size_tier ? formatLabel(vendor.company_size_tier) : null],
    ['Publicly Traded', vendor.publicly_traded], ['Parent Company', vendor.parent_company],
    ['Pricing Model', vendor.pricing_model ? formatLabel(vendor.pricing_model) : null],
    ['Pricing From', formatCurrency(vendor.pricing_from, vendor.pricing_currency)],
    ['Pricing To', formatCurrency(vendor.pricing_to, vendor.pricing_currency)],
    ['Pricing Per', vendor.pricing_per ? formatLabel(vendor.pricing_per) : null],
    ['Pricing Notes', vendor.pricing_notes],
    ['Setup Fee', formatCurrency(vendor.setup_fee, vendor.pricing_currency)],
    ['Free Trial', vendor.free_trial], ['Free Trial Days', vendor.free_trial_days],
    ['Free Plan', vendor.free_plan], ['Contract Required', vendor.contract_required],
    ['Min Contract (months)', vendor.minimum_contract_months],
    ['Implementation Complexity', vendor.implementation_complexity ? `${vendor.implementation_complexity}/5` : null],
    ['Onboarding', vendor.onboarding_support ? formatLabel(vendor.onboarding_support) : null],
    ['Go-Live Days', vendor.typical_go_live_days],
    ['Support Tier', vendor.customer_support_tier ? formatLabel(vendor.customer_support_tier) : null],
    ['NPS Score', vendor.nps_score], ['G2 Reviews', vendor.review_count_g2],
    ['G2 Score', vendor.review_score_g2], ['Capterra Reviews', vendor.review_count_capterra],
    ['Capterra Score', vendor.review_score_capterra],
    ['Market Position', vendor.market_position ? formatLabel(vendor.market_position) : null],
    ['Best For', vendor.best_for_summary], ['Avoid If', vendor.avoid_if_summary],
    ['Active', vendor.active], ['Last Verified', vendor.last_verified || 'Never'],
  ];

  const sectionLoader = <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-3xl bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{vendor.name}</h2>
            <p className="text-xs text-gray-500">{vendor.slug}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            <Pencil className="h-3 w-3" /> Edit Core
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1: Core Details */}
          <div className="border border-gray-200 rounded-xl bg-white">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">Core Details</h4>
            </div>
            <div className="p-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {fields.map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-gray-500">{label as string}</dt>
                    <dd className="text-gray-900 font-medium">
                      {typeof value === 'boolean' ? <BoolBadge value={value} /> : value != null && value !== '' && value !== '-' ? String(value) : <span className="text-gray-400">-</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Section 2: Target Profiles */}
          <DetailSection title="Target Profiles" saving={savingTargets} onSave={saveTargets}>
            {loadingTargets ? sectionLoader : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TARGET_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{formatLabel(t)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => setTargets((prev) => ({ ...prev, [t]: { ...prev[t], fit_score: prev[t].fit_score === n ? 0 : n } }))}
                            className="p-0">
                            <Star className={`h-4 w-4 ${n <= (targets[t]?.fit_score || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input className="w-32 text-xs" placeholder="Notes" value={targets[t]?.notes || ''} onChange={(e) => setTargets((prev) => ({ ...prev, [t]: { ...prev[t], notes: e.target.value } }))} />
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* Section 3: Property Types */}
          <DetailSection title="Property Types" saving={savingProps} onSave={saveProps}>
            {loadingProps ? sectionLoader : (
              <div className="space-y-2">
                {PROPERTY_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-3 py-1">
                    <input type="checkbox" checked={props[t]?.checked || false} onChange={(e) => setProps((prev) => ({ ...prev, [t]: { ...prev[t], checked: e.target.checked } }))} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-900 w-44">{formatLabel(t)}</span>
                    {props[t]?.checked && (
                      <>
                        <Select className="w-36 text-xs" value={props[t]?.support_level || ''} onChange={(e) => setProps((prev) => ({ ...prev, [t]: { ...prev[t], support_level: e.target.value } }))}>
                          <option value="">Level...</option>
                          {PROPERTY_SUPPORT_LEVELS.map((l) => <option key={l} value={l}>{formatLabel(l)}</option>)}
                        </Select>
                        <Input className="flex-1 text-xs" placeholder="Notes" value={props[t]?.notes || ''} onChange={(e) => setProps((prev) => ({ ...prev, [t]: { ...prev[t], notes: e.target.value } }))} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* Section 4: Portfolio Ranges */}
          <DetailSection title="Portfolio Ranges" saving={savingRanges} onSave={saveRanges}>
            {loadingRanges ? sectionLoader : (
              <div className="space-y-2">
                {PORTFOLIO_RANGES.map((r) => (
                  <div key={r.key} className={`flex items-center gap-3 py-1.5 px-2 rounded-lg ${ranges[r.key]?.is_sweet_spot ? 'bg-green-50 border border-green-200' : ''}`}>
                    <input type="checkbox" checked={ranges[r.key]?.checked || false} onChange={(e) => setRanges((prev) => ({ ...prev, [r.key]: { ...prev[r.key], checked: e.target.checked } }))} className="rounded border-gray-300" />
                    <span className="text-sm text-gray-900 w-32">{r.label}</span>
                    {ranges[r.key]?.checked && (
                      <>
                        <div className="flex items-center gap-1">
                          <Toggle checked={ranges[r.key]?.is_sweet_spot || false} onChange={(e) => setRanges((prev) => ({ ...prev, [r.key]: { ...prev[r.key], is_sweet_spot: (e.target as HTMLInputElement).checked } }))} />
                          <span className="text-xs text-gray-500">Sweet Spot</span>
                        </div>
                        <Input className="w-32 text-xs" placeholder="e.g. $59/mo" value={ranges[r.key]?.pricing_at_range || ''} onChange={(e) => setRanges((prev) => ({ ...prev, [r.key]: { ...prev[r.key], pricing_at_range: e.target.value } }))} />
                        <Input className="flex-1 text-xs" placeholder="Notes" value={ranges[r.key]?.notes || ''} onChange={(e) => setRanges((prev) => ({ ...prev, [r.key]: { ...prev[r.key], notes: e.target.value } }))} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* Section 5: Geographies */}
          <DetailSection title="Geographies" saving={savingGeos} onSave={saveGeos}>
            {loadingGeos ? sectionLoader : (
              <div className="space-y-2">
                {geos.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <Input className="w-20 text-xs" placeholder="AU" value={g.country_code} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], country_code: e.target.value.toUpperCase() }; setGeos(next); }} />
                    <Input className="w-28 text-xs" placeholder="Region" value={g.region || ''} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], region: e.target.value }; setGeos(next); }} />
                    <Select className="w-28 text-xs" value={g.compliance_level || ''} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], compliance_level: e.target.value }; setGeos(next); }}>
                      <option value="">Compliance...</option>
                      {COMPLIANCE_LEVELS.map((l) => <option key={l} value={l}>{formatLabel(l)}</option>)}
                    </Select>
                    <div className="flex items-center gap-1">
                      <Toggle checked={g.local_support} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], local_support: (e.target as HTMLInputElement).checked }; setGeos(next); }} />
                      <span className="text-xs text-gray-500">Support</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Toggle checked={g.local_data_residency} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], local_data_residency: (e.target as HTMLInputElement).checked }; setGeos(next); }} />
                      <span className="text-xs text-gray-500">Data Res.</span>
                    </div>
                    <Input className="flex-1 text-xs" placeholder="Legislation" value={g.legislation_coverage || ''} onChange={(e) => { const next = [...geos]; next[i] = { ...next[i], legislation_coverage: e.target.value }; setGeos(next); }} />
                    <button onClick={() => setGeos((prev) => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setGeos((prev) => [...prev, { vendor_id: vendor.id, country_code: '', region: null, compliance_level: null, local_support: false, local_data_residency: false, legislation_coverage: null }])}>
                  <Plus className="h-3 w-3" /> Add Geography
                </Button>
              </div>
            )}
          </DetailSection>

          {/* Section 6: Integrations */}
          <DetailSection title="Integrations" saving={savingInts} onSave={saveInts}>
            {loadingInts ? sectionLoader : (
              <div className="space-y-2">
                {ints.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="w-40 text-xs" placeholder="Name" value={item.integration_name} onChange={(e) => { const next = [...ints]; next[i] = { ...next[i], integration_name: e.target.value, integration_slug: toSlug(e.target.value) }; setInts(next); }} />
                    <span className="text-xs text-gray-400 font-mono w-32 truncate">{item.integration_slug}</span>
                    <Select className="w-36 text-xs" value={item.integration_category || ''} onChange={(e) => { const next = [...ints]; next[i] = { ...next[i], integration_category: e.target.value }; setInts(next); }}>
                      <option value="">Category...</option>
                      {INTEGRATION_CATEGORIES.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}
                    </Select>
                    <Select className="w-28 text-xs" value={item.integration_type || ''} onChange={(e) => { const next = [...ints]; next[i] = { ...next[i], integration_type: e.target.value }; setInts(next); }}>
                      <option value="">Type...</option>
                      {INTEGRATION_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                    </Select>
                    <button onClick={() => setInts((prev) => prev.filter((_, j) => j !== i))} className="p-1 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="secondary" onClick={() => setInts((prev) => [...prev, { vendor_id: vendor.id, integration_name: '', integration_slug: '', integration_category: null, integration_type: null }])}>
                  <Plus className="h-3 w-3" /> Add Integration
                </Button>
              </div>
            )}
          </DetailSection>

          {/* Section 7: Pros & Cons */}
          <DetailSection title="Pros & Cons" saving={savingPros} onSave={savePros}>
            {loadingPros ? sectionLoader : (
              <div className="grid md:grid-cols-2 gap-4">
                {(['pro', 'con'] as const).map((type) => (
                  <div key={type}>
                    <p className={`text-sm font-semibold mb-2 ${type === 'pro' ? 'text-green-700' : 'text-red-700'}`}>{type === 'pro' ? 'Pros' : 'Cons'}</p>
                    <div className="space-y-2">
                      {prosCons.filter((p) => p.type === type).map((p, idx) => {
                        const globalIdx = prosCons.indexOf(p);
                        return (
                          <div key={idx} className="border border-gray-100 rounded-lg p-2 space-y-1">
                            <Input className="text-xs" placeholder="Content" value={p.content} onChange={(e) => { const next = [...prosCons]; next[globalIdx] = { ...next[globalIdx], content: e.target.value }; setProsCons(next); }} />
                            <div className="flex gap-2">
                              <Select className="flex-1 text-xs" value={p.category || ''} onChange={(e) => { const next = [...prosCons]; next[globalIdx] = { ...next[globalIdx], category: e.target.value }; setProsCons(next); }}>
                                <option value="">Category...</option>
                                {PRO_CON_CATEGORIES.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}
                              </Select>
                              <Select className="w-24 text-xs" value={String(p.severity)} onChange={(e) => { const next = [...prosCons]; next[globalIdx] = { ...next[globalIdx], severity: parseInt(e.target.value) }; setProsCons(next); }}>
                                <option value="1">Low</option>
                                <option value="2">Medium</option>
                                <option value="3">High</option>
                              </Select>
                              <Select className="w-32 text-xs" value={p.source || ''} onChange={(e) => { const next = [...prosCons]; next[globalIdx] = { ...next[globalIdx], source: e.target.value }; setProsCons(next); }}>
                                <option value="">Source...</option>
                                {PRO_CON_SOURCES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                              </Select>
                              <button onClick={() => setProsCons((prev) => prev.filter((_, j) => j !== globalIdx))} className="p-1 hover:bg-red-50 rounded">
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <Button size="sm" variant="secondary" onClick={() => setProsCons((prev) => [...prev, { vendor_id: vendor.id, type, category: null, content: '', severity: 1, source: null }])}>
                        <Plus className="h-3 w-3" /> Add {type === 'pro' ? 'Pro' : 'Con'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* Section 8: Affiliate Programme */}
          <DetailSection title="Affiliate Programme" saving={savingAff} onSave={saveAffiliate}>
            {loadingAff || !affiliate ? sectionLoader : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Toggle checked={affExists} onChange={(e) => setAffExists((e.target as HTMLInputElement).checked)} />
                  <span className="text-sm text-gray-700">Programme exists</span>
                </div>
                {affExists && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Programme Type</Label>
                        <Select value={affiliate.programme_type || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, programme_type: e.target.value } : a)}>
                          <option value="">Select...</option>
                          {PROGRAMME_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label>Network</Label>
                        <Select value={affiliate.network || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, network: e.target.value } : a)}>
                          <option value="">Select...</option>
                          {NETWORKS.map((n) => <option key={n} value={n}>{formatLabel(n)}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Programme URL</Label>
                      <Input value={affiliate.programme_url || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, programme_url: e.target.value } : a)} placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Commission Type</Label>
                        <Select value={affiliate.commission_type || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, commission_type: e.target.value } : a)}>
                          <option value="">Select...</option>
                          {COMMISSION_TYPES.map((t) => <option key={t} value={t}>{formatLabel(t)}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label>Commission Value</Label>
                        <Input type="number" value={affiliate.commission_value ?? ''} onChange={(e) => setAffiliate((a) => a ? { ...a, commission_value: e.target.value ? parseFloat(e.target.value) : null } : a)} />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <Select value={affiliate.commission_currency} onChange={(e) => setAffiliate((a) => a ? { ...a, commission_currency: e.target.value } : a)}>
                          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Commission Notes</Label>
                      <Textarea rows={2} value={affiliate.commission_notes || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, commission_notes: e.target.value } : a)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Cookie Days</Label>
                        <Input type="number" value={affiliate.cookie_duration_days ?? ''} onChange={(e) => setAffiliate((a) => a ? { ...a, cookie_duration_days: e.target.value ? parseInt(e.target.value) : null } : a)} />
                      </div>
                      <div>
                        <Label>Attribution</Label>
                        <Select value={affiliate.attribution_model || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, attribution_model: e.target.value } : a)}>
                          <option value="">Select...</option>
                          {ATTRIBUTION_MODELS.map((m) => <option key={m} value={m}>{formatLabel(m)}</option>)}
                        </Select>
                      </div>
                      <div>
                        <Label>Min Payout</Label>
                        <Input type="number" value={affiliate.minimum_payout ?? ''} onChange={(e) => setAffiliate((a) => a ? { ...a, minimum_payout: e.target.value ? parseFloat(e.target.value) : null } : a)} />
                      </div>
                    </div>
                    <div>
                      <Label>Payout Frequency</Label>
                      <Input value={affiliate.payout_frequency || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, payout_frequency: e.target.value } : a)} placeholder="e.g. Monthly, Net 30" />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Toggle checked={affiliate.approval_required} onChange={(e) => setAffiliate((a) => a ? { ...a, approval_required: (e.target as HTMLInputElement).checked } : a)} />
                        <span className="text-sm text-gray-700">Approval Required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle checked={affiliate.direct_partnership_possible} onChange={(e) => setAffiliate((a) => a ? { ...a, direct_partnership_possible: (e.target as HTMLInputElement).checked } : a)} />
                        <span className="text-sm text-gray-700">Direct Partnership</span>
                      </div>
                    </div>
                    {affiliate.approval_required && (
                      <div>
                        <Label>Approval Notes</Label>
                        <Textarea rows={2} value={affiliate.approval_notes || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, approval_notes: e.target.value } : a)} />
                      </div>
                    )}
                    {affiliate.direct_partnership_possible && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Contact Name</Label>
                          <Input value={affiliate.direct_contact_name || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, direct_contact_name: e.target.value } : a)} />
                        </div>
                        <div>
                          <Label>Contact Email</Label>
                          <Input value={affiliate.direct_contact_email || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, direct_contact_email: e.target.value } : a)} />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Partnership Notes</Label>
                      <Textarea rows={2} value={affiliate.partnership_notes || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, partnership_notes: e.target.value } : a)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Est. Monthly Leads</Label>
                        <Input type="number" value={affiliate.estimated_monthly_leads ?? ''} onChange={(e) => setAffiliate((a) => a ? { ...a, estimated_monthly_leads: e.target.value ? parseInt(e.target.value) : null } : a)} />
                      </div>
                      <div>
                        <Label>Est. Monthly Revenue</Label>
                        <Input type="number" value={affiliate.estimated_monthly_revenue ?? ''} onChange={(e) => setAffiliate((a) => a ? { ...a, estimated_monthly_revenue: e.target.value ? parseFloat(e.target.value) : null } : a)} />
                      </div>
                      <div>
                        <Label>Last Checked</Label>
                        <Input type="date" value={affiliate.last_checked || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, last_checked: e.target.value } : a)} />
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={affiliate.status || ''} onChange={(e) => setAffiliate((a) => a ? { ...a, status: e.target.value } : a)}>
                        <option value="">Select...</option>
                        {AFFILIATE_STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}

/* ─── Rule Modal ─── */

interface RuleFormData {
  rule_name: string;
  rule_description: string;
  rule_group: string;
  rule_order: string;
  priority: string;
  active: boolean;
  rule_type: string;
  condition_logic: string;
  conditions: string;
  action_type: string;
  action_target: string;
  score_adjustment: string;
  explanation_template: string;
  warning_message: string;
}

const EMPTY_RULE_FORM: RuleFormData = {
  rule_name: '',
  rule_description: '',
  rule_group: '',
  rule_order: '',
  priority: '5',
  active: true,
  rule_type: '',
  condition_logic: 'AND',
  conditions: '[]',
  action_type: '',
  action_target: '',
  score_adjustment: '0',
  explanation_template: '',
  warning_message: '',
};

function ruleToForm(r: DecisionRule): RuleFormData {
  return {
    rule_name: r.rule_name,
    rule_description: r.rule_description || '',
    rule_group: r.rule_group || '',
    rule_order: String(r.rule_order),
    priority: String(r.priority),
    active: r.active,
    rule_type: r.rule_type || '',
    condition_logic: r.condition_logic || 'AND',
    conditions: JSON.stringify(r.conditions, null, 2),
    action_type: r.action_type,
    action_target: r.action_target || '',
    score_adjustment: String(r.score_adjustment),
    explanation_template: r.explanation_template || '',
    warning_message: r.warning_message || '',
  };
}

function RuleModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: DecisionRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const isEdit = rule !== null;
  const [form, setForm] = useState<RuleFormData>(
    isEdit ? ruleToForm(rule) : { ...EMPTY_RULE_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.rule_name.trim()) {
      setError('Rule name is required.');
      return;
    }
    if (!form.rule_order.trim()) {
      setError('Rule order is required.');
      return;
    }

    let parsedConditions;
    try {
      parsedConditions = JSON.parse(form.conditions);
    } catch {
      setError('Conditions must be valid JSON.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      rule_name: form.rule_name.trim(),
      rule_description: form.rule_description.trim() || null,
      rule_group: form.rule_group.trim() || null,
      rule_order: parseInt(form.rule_order),
      priority: parseInt(form.priority) || 5,
      active: form.active,
      rule_type: form.rule_type || null,
      condition_logic: form.condition_logic || 'AND',
      conditions: parsedConditions,
      action_type: form.action_type.trim() || form.rule_type || 'boost',
      action_target: form.action_target.trim() || null,
      score_adjustment: parseInt(form.score_adjustment) || 0,
      explanation_template: form.explanation_template.trim() || null,
      warning_message: form.warning_message.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (isEdit) {
      result = await supabase.from('de_decision_rules').update(payload).eq('id', rule.id);
    } else {
      result = await supabase.from('de_decision_rules').insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Rule' : 'Add Rule'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <Label>Rule Name *</Label>
            <Input
              value={form.rule_name}
              onChange={(e) => setForm((f) => ({ ...f, rule_name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.rule_description}
              onChange={(e) => setForm((f) => ({ ...f, rule_description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Rule Group</Label>
              <Input
                value={form.rule_group}
                onChange={(e) => setForm((f) => ({ ...f, rule_group: e.target.value }))}
                placeholder="e.g. budget"
              />
            </div>
            <div>
              <Label>Rule Order *</Label>
              <Input
                type="number"
                value={form.rule_order}
                onChange={(e) => setForm((f) => ({ ...f, rule_order: e.target.value }))}
              />
            </div>
            <div>
              <Label>Priority (1-10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rule Type</Label>
              <Select
                value={form.rule_type}
                onChange={(e) => setForm((f) => ({ ...f, rule_type: e.target.value }))}
              >
                <option value="">Select...</option>
                {RULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatLabel(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Condition Logic</Label>
              <Select
                value={form.condition_logic}
                onChange={(e) => setForm((f) => ({ ...f, condition_logic: e.target.value }))}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Conditions (JSON)</Label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 bg-white font-mono text-xs"
              rows={8}
              value={form.conditions}
              onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Action Type</Label>
              <Input
                value={form.action_type}
                onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value }))}
                placeholder="e.g. exclude_vendor"
              />
            </div>
            <div>
              <Label>Score Adjustment</Label>
              <Input
                type="number"
                value={form.score_adjustment}
                onChange={(e) => setForm((f) => ({ ...f, score_adjustment: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Explanation Template</Label>
            <Textarea
              value={form.explanation_template}
              onChange={(e) => setForm((f) => ({ ...f, explanation_template: e.target.value }))}
              rows={2}
              placeholder="e.g. {{vendor_name}} is excluded because..."
            />
          </div>
          <div>
            <Label>Warning Message</Label>
            <Textarea
              value={form.warning_message}
              onChange={(e) => setForm((f) => ({ ...f, warning_message: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: (e.target as HTMLInputElement).checked }))
              }
            />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Add Rule'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Cell Popover ─── */

function FeatureCellPopover({
  vendorId,
  featureSlug,
  featureCategory,
  featureName,
  existing,
  onClose,
  onSaved,
}: {
  vendorId: number;
  featureSlug: string;
  featureCategory: string;
  featureName: string;
  existing: VendorFeature | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [supported, setSupported] = useState(existing?.supported ?? false);
  const [supportLevel, setSupportLevel] = useState(existing?.support_level ?? '');
  const [isStandout, setIsStandout] = useState(existing?.is_standout ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('de_vendor_features').upsert(
      {
        vendor_id: vendorId,
        feature_slug: featureSlug,
        feature_name: featureName,
        feature_category: featureCategory,
        supported,
        support_level: supportLevel || null,
        is_standout: isStandout,
        notes: notes.trim() || null,
      },
      { onConflict: 'vendor_id,feature_slug' },
    );
    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">{featureName}</h4>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Toggle
              checked={supported}
              onChange={(e) => setSupported((e.target as HTMLInputElement).checked)}
            />
            <span className="text-sm text-gray-700">Supported</span>
          </div>
          <div>
            <Label>Support Level</Label>
            <Select value={supportLevel} onChange={(e) => setSupportLevel(e.target.value)}>
              <option value="">Not Set</option>
              {SUPPORT_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {formatLabel(l)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Toggle
              checked={isStandout}
              onChange={(e) => setIsStandout((e.target as HTMLInputElement).checked)}
            />
            <span className="text-sm text-gray-700">Standout Feature</span>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function DecisionEngineAdminPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<TabKey>('vendors');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorModal, setVendorModal] = useState<{ open: boolean; vendor: Vendor | null }>({
    open: false,
    vendor: null,
  });
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);

  // Features
  const [features, setFeatures] = useState<VendorFeature[]>([]);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(FEATURE_CATEGORIES),
  );
  const [featurePopover, setFeaturePopover] = useState<{
    vendorId: number;
    featureSlug: string;
    featureCategory: string;
    featureName: string;
    existing: VendorFeature | null;
  } | null>(null);

  // Rules
  const [rules, setRules] = useState<DecisionRule[]>([]);
  const [ruleModal, setRuleModal] = useState<{ open: boolean; rule: DecisionRule | null }>({
    open: false,
    rule: null,
  });

  // Sessions
  const [sessions, setSessions] = useState<DecisionSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Fetch data
  const fetchVendors = useCallback(async () => {
    const { data } = await supabase.from('de_vendors').select('*').order('name');
    if (data) setVendors(data);
  }, [supabase]);

  const fetchFeatures = useCallback(async () => {
    const { data } = await supabase.from('de_vendor_features').select('*');
    if (data) setFeatures(data);
  }, [supabase]);

  const fetchRules = useCallback(async () => {
    const { data } = await supabase.from('de_decision_rules').select('*').order('rule_order');
    if (data) setRules(data);
  }, [supabase]);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('de_decision_sessions')
      .select('*, de_vendors!clicked_vendor_id(name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setSessions(data);
  }, [supabase]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchVendors(), fetchFeatures(), fetchRules(), fetchSessions()]);
      setLoading(false);
    };
    load();
  }, [fetchVendors, fetchFeatures, fetchRules, fetchSessions]);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleToggleRuleActive = async (ruleId: number, active: boolean) => {
    await supabase
      .from('de_decision_rules')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', ruleId);
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, active } : r)));
  };

  // Stats
  const activeVendors = vendors.filter((v) => v.active).length;
  const pendingVerification = vendors.filter((v) => {
    if (!v.last_verified) return true;
    const daysSince = (Date.now() - new Date(v.last_verified).getTime()) / 86400000;
    return daysSince > 90;
  }).length;

  const totalSessions = sessions.length;
  const conversions = sessions.filter((s) => s.converted).length;
  const conversionRate = totalSessions > 0 ? ((conversions / totalSessions) * 100).toFixed(1) : '0.0';
  const pdfDownloads = sessions.filter((s) => s.pdf_downloaded).length;

  // Feature matrix data
  const activeVendorList = vendors.filter((v) => v.active);
  const featureMap = new Map<string, Map<number, VendorFeature>>();
  const featureNameMap = new Map<string, { name: string; category: string }>();

  for (const f of features) {
    if (!featureMap.has(f.feature_slug)) {
      featureMap.set(f.feature_slug, new Map());
    }
    featureMap.get(f.feature_slug)!.set(f.vendor_id, f);
    if (!featureNameMap.has(f.feature_slug)) {
      featureNameMap.set(f.feature_slug, {
        name: f.feature_name,
        category: f.feature_category || 'other',
      });
    }
  }

  const featuresByCategory = new Map<string, string[]>();
  for (const [slug, info] of featureNameMap) {
    const cat = info.category;
    if (!activeCategories.has(cat)) continue;
    if (!featuresByCategory.has(cat)) featuresByCategory.set(cat, []);
    featuresByCategory.get(cat)!.push(slug);
  }

  const tabs: { key: TabKey; label: string; icon: typeof Database }[] = [
    { key: 'vendors', label: 'Vendors', icon: ShoppingBag },
    { key: 'features', label: 'Features', icon: Grid3X3 },
    { key: 'rules', label: 'Rules', icon: Scale },
    { key: 'sessions', label: 'Sessions', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Internal Tools
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Decision Engine Admin</h1>
        <p className="text-gray-500">
          Manage vendors, features, rules, and sessions for the Property Management Software
          decision engine.
        </p>
      </div>

      {/* Toast */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab: Vendors ─── */}
      {tab === 'vendors' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500 mb-1">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900">{vendors.length}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Active Vendors</p>
              <p className="text-3xl font-bold text-gray-900">{activeVendors}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Pending Verification</p>
              <p className="text-3xl font-bold text-gray-900">{pendingVerification}</p>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setVendorModal({ open: true, vendor: null })}>
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          </div>

          <Card className="overflow-x-auto">
            {vendors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No vendors yet. Add your first vendor to get started.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500">Name</th>
                    <th className="pb-3 font-medium text-gray-500">Slug</th>
                    <th className="pb-3 font-medium text-gray-500">Position</th>
                    <th className="pb-3 font-medium text-gray-500">Pricing Model</th>
                    <th className="pb-3 font-medium text-gray-500">From</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500">Verified</th>
                    <th className="pb-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{v.name}</td>
                      <td className="py-3 text-gray-500 font-mono text-xs">{v.slug}</td>
                      <td className="py-3">
                        {v.market_position ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {formatLabel(v.market_position)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">
                        {v.pricing_model ? formatLabel(v.pricing_model) : '-'}
                      </td>
                      <td className="py-3 text-gray-600">
                        {formatCurrency(v.pricing_from, v.pricing_currency)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {v.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">
                        {v.last_verified || 'Never'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewingVendor(v)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => setVendorModal({ open: true, vendor: v })}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {vendorModal.open && (
            <VendorModal
              vendor={vendorModal.vendor}
              onClose={() => setVendorModal({ open: false, vendor: null })}
              onSaved={() => {
                setVendorModal({ open: false, vendor: null });
                fetchVendors();
                showToast(vendorModal.vendor ? 'Vendor updated.' : 'Vendor added.');
              }}
            />
          )}
          {viewingVendor && (
            <VendorDetailSlideIn
              vendor={viewingVendor}
              onClose={() => setViewingVendor(null)}
              onEdit={() => {
                setVendorModal({ open: true, vendor: viewingVendor });
              }}
              showToast={showToast}
            />
          )}
        </>
      )}

      {/* ─── Tab: Features ─── */}
      {tab === 'features' && (
        <>
          {/* Category filter */}
          <Card>
            <p className="text-sm font-medium text-gray-700 mb-2">Filter Categories</p>
            <div className="flex flex-wrap gap-2">
              {FEATURE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(cat)) next.delete(cat);
                      else next.add(cat);
                      return next;
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategories.has(cat)
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {formatLabel(cat)}
                </button>
              ))}
            </div>
          </Card>

          {activeVendorList.length === 0 ? (
            <Card>
              <p className="text-gray-500 text-center py-8">
                No features recorded. Add vendors first, then manage their feature matrix.
              </p>
            </Card>
          ) : featuresByCategory.size === 0 ? (
            <Card>
              <p className="text-gray-500 text-center py-8">
                No features in selected categories. Try adding feature data or adjusting the
                filter.
              </p>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500 sticky left-0 bg-white min-w-[180px]">
                      Feature
                    </th>
                    {activeVendorList.map((v) => (
                      <th
                        key={v.id}
                        className="pb-3 font-medium text-gray-500 text-center min-w-[100px]"
                      >
                        {v.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...featuresByCategory.entries()].map(([cat, slugs]) => (
                    <>
                      <tr key={`cat-${cat}`}>
                        <td
                          colSpan={activeVendorList.length + 1}
                          className="pt-4 pb-2 font-semibold text-xs uppercase tracking-wider text-gray-400"
                        >
                          {formatLabel(cat)}
                        </td>
                      </tr>
                      {slugs.map((slug) => {
                        const info = featureNameMap.get(slug)!;
                        return (
                          <tr
                            key={slug}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 text-gray-900 sticky left-0 bg-white">
                              {info.name}
                            </td>
                            {activeVendorList.map((v) => {
                              const f = featureMap.get(slug)?.get(v.id) ?? null;
                              const level = f?.support_level;
                              return (
                                <td key={v.id} className="py-2 text-center">
                                  <button
                                    onClick={() =>
                                      setFeaturePopover({
                                        vendorId: v.id,
                                        featureSlug: slug,
                                        featureCategory: cat,
                                        featureName: info.name,
                                        existing: f,
                                      })
                                    }
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-violet-500/30 transition-all"
                                  >
                                    {level ? (
                                      <span className={SUPPORT_LEVEL_COLOURS[level]}>
                                        {formatLabel(level)}
                                      </span>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                        -
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {featurePopover && (
            <FeatureCellPopover
              vendorId={featurePopover.vendorId}
              featureSlug={featurePopover.featureSlug}
              featureCategory={featurePopover.featureCategory}
              featureName={featurePopover.featureName}
              existing={featurePopover.existing}
              onClose={() => setFeaturePopover(null)}
              onSaved={() => {
                setFeaturePopover(null);
                fetchFeatures();
                showToast('Feature updated.');
              }}
            />
          )}
        </>
      )}

      {/* ─── Tab: Rules ─── */}
      {tab === 'rules' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setRuleModal({ open: true, rule: null })}>
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>

          <Card className="overflow-x-auto">
            {rules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No rules configured.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500">Order</th>
                    <th className="pb-3 font-medium text-gray-500">Name</th>
                    <th className="pb-3 font-medium text-gray-500">Group</th>
                    <th className="pb-3 font-medium text-gray-500">Type</th>
                    <th className="pb-3 font-medium text-gray-500">Priority</th>
                    <th className="pb-3 font-medium text-gray-500">Active</th>
                    <th className="pb-3 font-medium text-gray-500">Conditions</th>
                    <th className="pb-3 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => {
                    const condCount = Array.isArray(r.conditions)
                      ? (r.conditions as unknown[]).length
                      : typeof r.conditions === 'object' && r.conditions !== null
                        ? Object.keys(r.conditions as Record<string, unknown>).length
                        : 0;

                    return (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-mono text-xs text-gray-500">{r.rule_order}</td>
                        <td className="py-3 font-medium text-gray-900">{r.rule_name}</td>
                        <td className="py-3">
                          {r.rule_group ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {r.rule_group}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          {r.rule_type ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                RULE_TYPE_COLOURS[r.rule_type] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {formatLabel(r.rule_type)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600">{r.priority}</td>
                        <td className="py-3">
                          <Toggle
                            checked={r.active}
                            onChange={(e) =>
                              handleToggleRuleActive(
                                r.id,
                                (e.target as HTMLInputElement).checked,
                              )
                            }
                          />
                        </td>
                        <td className="py-3 text-gray-500">{condCount}</td>
                        <td className="py-3">
                          <button
                            onClick={() => setRuleModal({ open: true, rule: r })}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>

          {ruleModal.open && (
            <RuleModal
              rule={ruleModal.rule}
              onClose={() => setRuleModal({ open: false, rule: null })}
              onSaved={() => {
                setRuleModal({ open: false, rule: null });
                fetchRules();
                showToast(ruleModal.rule ? 'Rule updated.' : 'Rule added.');
              }}
            />
          )}
        </>
      )}

      {/* ─── Tab: Sessions ─── */}
      {tab === 'sessions' && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Conversions</p>
              <p className="text-3xl font-bold text-gray-900">{conversions}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500 mb-1">PDF Downloads</p>
              <p className="text-3xl font-bold text-gray-900">{pdfDownloads}</p>
            </Card>
          </div>

          <Card className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No sessions recorded yet. Sessions will appear once the recommendation wizard is
                live.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-medium text-gray-500"></th>
                    <th className="pb-3 font-medium text-gray-500">Token</th>
                    <th className="pb-3 font-medium text-gray-500">Source</th>
                    <th className="pb-3 font-medium text-gray-500">Created</th>
                    <th className="pb-3 font-medium text-gray-500">Inputs</th>
                    <th className="pb-3 font-medium text-gray-500">Recommended</th>
                    <th className="pb-3 font-medium text-gray-500">Clicked</th>
                    <th className="pb-3 font-medium text-gray-500">Converted</th>
                    <th className="pb-3 font-medium text-gray-500">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const inputCount = s.inputs ? Object.keys(s.inputs).length : 0;
                    const recCount = s.recommended_vendor_ids
                      ? s.recommended_vendor_ids.length
                      : 0;
                    const vendorName = s.de_vendors?.name || 'None';
                    const isExpanded = expandedSession === s.id;

                    return (
                      <>
                        <tr
                          key={s.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            setExpandedSession(isExpanded ? null : s.id)
                          }
                        >
                          <td className="py-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </td>
                          <td className="py-3 font-mono text-xs text-gray-600">
                            {s.session_token.substring(0, 8)}
                          </td>
                          <td className="py-3 text-gray-600">{s.session_source || '-'}</td>
                          <td className="py-3 text-gray-500 text-xs">
                            {relativeTime(s.created_at)}
                          </td>
                          <td className="py-3 text-gray-600">{inputCount}</td>
                          <td className="py-3 text-gray-600">{recCount}</td>
                          <td className="py-3 text-gray-600">{vendorName}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                s.converted
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {s.converted ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                s.pdf_downloaded
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {s.pdf_downloaded ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.id}-detail`}>
                            <td colSpan={9} className="p-4 bg-gray-50">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Inputs
                                  </p>
                                  <pre className="text-xs font-mono bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-64">
                                    {s.inputs
                                      ? JSON.stringify(s.inputs, null, 2)
                                      : 'No inputs'}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Rule Execution Log
                                  </p>
                                  <pre className="text-xs font-mono bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-64">
                                    {s.rule_execution_log
                                      ? JSON.stringify(s.rule_execution_log, null, 2)
                                      : 'No log'}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
