export type Vendor = {
  id: number
  name: string
  slug: string
  website: string | null
  logo_url: string | null
  tagline: string | null
  founded_year: number | null
  hq_country: string | null
  pricing_model: 'per_unit' | 'flat_rate' | 'tiered' | 'quote_based' | 'freemium' | 'hybrid' | null
  pricing_from: number | null
  pricing_to: number | null
  pricing_currency: string | null
  pricing_per: string | null
  pricing_notes: string | null
  free_trial: boolean
  free_trial_days: number | null
  free_plan: boolean
  contract_required: boolean | null
  onboarding_support: string | null
  review_score_g2: number | null
  review_score_capterra: number | null
  market_position: 'budget' | 'mid_market' | 'premium' | 'enterprise' | null
  best_for_summary: string | null
  avoid_if_summary: string | null
  active: boolean
}

export type VendorFeature = {
  id: number
  vendor_id: number
  feature_category: string
  feature_name: string
  feature_slug: string
  supported: boolean
  support_level: 'full' | 'partial' | 'addon' | 'roadmap' | 'no' | null
  is_standout: boolean
  notes: string | null
}

export type VendorTargetProfile = {
  id: number
  vendor_id: number
  target_type: string
  fit_score: number | null
  fit_notes: string | null
}

export type VendorPropertyType = {
  id: number
  vendor_id: number
  property_type: string
  support_level: 'native' | 'supported' | 'partial' | 'workaround' | null
  notes: string | null
}

export type VendorPortfolioRange = {
  id: number
  vendor_id: number
  range_label: string
  units_min: number | null
  units_max: number | null
  is_sweet_spot: boolean
  pricing_at_range: string | null
  notes: string | null
}

export type VendorGeography = {
  id: number
  vendor_id: number
  country_code: string
  compliance_level: 'native' | 'supported' | 'partial' | 'none' | null
  local_support: boolean
  notes: string | null
}

export type WizardQuestion = {
  id: number
  question_key: string
  question_text: string
  question_subtext: string | null
  input_type: 'single_select' | 'multi_select' | 'range_slider' | 'boolean' | 'number'
  display_order: number
  is_required: boolean
  depends_on_question_key: string | null
  depends_on_value: string | null
  options: Array<{
    value: string
    label: string
    description?: string
    icon?: string
  }> | null
  help_text: string | null
  tooltip: string | null
  active: boolean
}

export type DecisionRule = {
  id: number
  rule_name: string
  rule_type: 'hard_exclude' | 'boost' | 'penalise' | 'flag_warning'
  rule_order: number
  priority: number
  active: boolean
  condition_logic: 'AND' | 'OR'
  conditions: Record<string, unknown>
  score_adjustment: number
  explanation_template: string | null
  warning_message: string | null
}

export type WizardAnswers = {
  manager_type?: string
  portfolio_size?: string
  property_types?: string[]
  country?: string
  budget?: string
  must_have_features?: string[]
  accounting_integration?: string
  growth_plans?: string
  onboarding_preference?: string
  deal_breakers?: string[]
}

export type VendorBundle = {
  vendor: Vendor
  targets: VendorTargetProfile[]
  portfolioRanges: VendorPortfolioRange[]
  geographies: VendorGeography[]
  propertyTypes: VendorPropertyType[]
  features: VendorFeature[]
}

export type RuleExecutionLogEntry = {
  rule_id: number
  rule_name: string
  vendor_id: number
  vendor_name: string
  matched: boolean
  action: string
  score_adjustment: number
  explanation: string | null
  warning: string | null
  skipped_reason?: string
}

export type ScoredVendor = {
  vendor: Vendor
  score: number
  explanations: string[]
  warnings: string[]
  excluded: boolean
  exclusion_reason: string | null
}
