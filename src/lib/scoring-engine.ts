import type {
  WizardAnswers,
  VendorBundle,
  DecisionRule,
  ScoredVendor,
  RuleExecutionLogEntry,
  VendorGeography,
} from './types'

/* ─── Data normalization maps ─── */

// Q4 uses GB but some vendor geographies use UK
const COUNTRY_ALIASES: Record<string, string[]> = {
  GB: ['GB', 'UK'],
  UK: ['GB', 'UK'],
}

// Q1 uses short_term_operator but target_profiles use airbnb_host
const MANAGER_TYPE_ALIASES: Record<string, string[]> = {
  short_term_operator: ['short_term_operator', 'airbnb_host'],
  airbnb_host: ['short_term_operator', 'airbnb_host'],
}

function getCountryCodes(code: string): string[] {
  return COUNTRY_ALIASES[code] || [code]
}

function getManagerTypes(type: string): string[] {
  return MANAGER_TYPE_ALIASES[type] || [type]
}

/* ─── Budget helpers ─── */

// Maps budget option → max monthly price per unit (USD)
const BUDGET_CEILING: Record<string, number> = {
  free: 0,
  under_2: 2,
  '2_5': 5,
  '5_10': 10,
  '10_20': 20,
  '20_plus': Infinity,
  quote: Infinity,
}

// Portfolio size order for "next tier" calculations
const PORTFOLIO_ORDER = [
  'micro_1_5',
  'small_6_20',
  'growing_21_50',
  'medium_51_200',
  'large_201_500',
  'portfolio_501_1000',
  'enterprise_1001_plus',
]

/* ─── Template interpolation ─── */

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || key)
}

function formatManagerType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCountry(code: string): string {
  const map: Record<string, string> = {
    US: 'the United States',
    GB: 'the United Kingdom',
    UK: 'the United Kingdom',
    AU: 'Australia',
    NZ: 'New Zealand',
    CA: 'Canada',
    OTHER: 'your region',
  }
  return map[code] || code
}

function formatPortfolioSize(size: string): string {
  const map: Record<string, string> = {
    micro_1_5: '1–5',
    small_6_20: '6–20',
    growing_21_50: '21–50',
    medium_51_200: '51–200',
    large_201_500: '201–500',
    portfolio_501_1000: '501–1,000',
    enterprise_1001_plus: '1,001+',
  }
  return map[size] || size
}

/* ─── Computed condition evaluators ─── */

function getVendorGeoForCountry(
  bundle: VendorBundle,
  country: string
): VendorGeography | undefined {
  const codes = getCountryCodes(country)
  return bundle.geographies.find((g) => codes.includes(g.country_code))
}

function evaluateComputedCondition(
  key: string,
  expectedValue: unknown,
  answers: WizardAnswers,
  bundle: VendorBundle
): boolean {
  switch (key) {
    // Rule 3: Is the user's portfolio size in the vendor's sweet spot?
    case 'portfolio_size_in_vendor_sweet_spot': {
      if (!answers.portfolio_size) return false
      const match = bundle.portfolioRanges.find(
        (r) => r.range_label === answers.portfolio_size && r.is_sweet_spot
      )
      return !!match === expectedValue
    }

    // Rule 4: Vendor supports NONE of the user's selected property types
    case 'vendor_supports_none_of_selected_property_types': {
      if (!answers.property_types || answers.property_types.length === 0)
        return false
      const vendorTypes = bundle.propertyTypes.map((pt) => pt.property_type)
      const hasAny = answers.property_types.some((pt) =>
        vendorTypes.includes(pt)
      )
      return !hasAny === expectedValue
    }

    // Rule 5: Vendor has native support for the user's primary (first selected) property type
    case 'vendor_has_native_support_for_primary_property_type': {
      if (!answers.property_types || answers.property_types.length === 0)
        return false
      const primary = answers.property_types[0]
      const match = bundle.propertyTypes.find(
        (pt) => pt.property_type === primary && pt.support_level === 'native'
      )
      return !!match === expectedValue
    }

    // Rule 6: Vendor pricing exceeds budget
    case 'vendor.pricing_from_exceeds_budget': {
      if (!answers.budget || answers.budget === 'quote') return false
      if (
        bundle.vendor.pricing_model === 'quote_based' ||
        bundle.vendor.pricing_from == null
      )
        return false
      const ceiling = BUDGET_CEILING[answers.budget]
      if (ceiling === undefined || ceiling === Infinity) return false

      // For per_unit pricing, compare directly
      // For flat/tiered, estimate per-unit cost based on portfolio
      let perUnitCost = bundle.vendor.pricing_from
      if (
        bundle.vendor.pricing_per !== 'unit' &&
        bundle.vendor.pricing_per !== 'property'
      ) {
        // Flat/tiered: divide by midpoint of portfolio range
        const midpoints: Record<string, number> = {
          micro_1_5: 3,
          small_6_20: 13,
          growing_21_50: 35,
          medium_51_200: 125,
          large_201_500: 350,
          portfolio_501_1000: 750,
          enterprise_1001_plus: 1500,
        }
        const mid = answers.portfolio_size
          ? midpoints[answers.portfolio_size] || 50
          : 50
        perUnitCost = bundle.vendor.pricing_from / mid
      }
      return perUnitCost > ceiling === (expectedValue as boolean)
    }

    // Rule 8: Vendor missing a must-have feature (depends on features table)
    case 'vendor_missing_must_have_feature': {
      // Features table is empty — skip gracefully
      if (bundle.features.length === 0) return false
      if (
        !answers.must_have_features ||
        answers.must_have_features.length === 0
      )
        return false
      const vendorFeatureSlugs = bundle.features
        .filter((f) => f.supported)
        .map((f) => f.feature_slug)
      const missing = answers.must_have_features.some(
        (f) => !vendorFeatureSlugs.includes(f)
      )
      return missing === expectedValue
    }

    // Rule 9: Vendor has standout feature matching user's needs
    case 'vendor_has_standout_feature_matching_need': {
      if (bundle.features.length === 0) return false
      if (
        !answers.must_have_features ||
        answers.must_have_features.length === 0
      )
        return false
      const standouts = bundle.features
        .filter((f) => f.is_standout && f.supported)
        .map((f) => f.feature_slug)
      const match = answers.must_have_features.some((f) =>
        standouts.includes(f)
      )
      return match === expectedValue
    }

    // Rule 10: Vendor does not operate in user's country
    case 'vendor_does_not_operate_in_country': {
      if (!answers.country || answers.country === 'OTHER') return false
      const geo = getVendorGeoForCountry(bundle, answers.country)
      return !geo === expectedValue
    }

    // Rule 13: Vendor has native integration for selected accounting
    case 'vendor_has_native_integration_for_selected_accounting': {
      // Integrations table is empty — skip gracefully
      return false
    }

    // Rule 14: Vendor lacks selected accounting integration
    case 'vendor_lacks_selected_accounting_integration': {
      // Integrations table is empty — skip gracefully
      return false
    }

    // Rule 17: Vendor covers the next portfolio tier
    case 'vendor_covers_next_portfolio_tier': {
      if (!answers.portfolio_size) return false
      const currentIdx = PORTFOLIO_ORDER.indexOf(answers.portfolio_size)
      if (currentIdx === -1 || currentIdx >= PORTFOLIO_ORDER.length - 1)
        return false
      const nextTier = PORTFOLIO_ORDER[currentIdx + 1]
      const coversNext = bundle.portfolioRanges.some(
        (r) => r.range_label === nextTier
      )
      return coversNext === expectedValue
    }

    // Rule 18: Vendor's max sweet spot is the current tier (can't scale)
    case 'vendor_max_sweet_spot_is_current_tier': {
      if (!answers.portfolio_size) return false
      const sweetSpots = bundle.portfolioRanges.filter((r) => r.is_sweet_spot)
      if (sweetSpots.length === 0) return false
      const maxSweetSpotIdx = Math.max(
        ...sweetSpots.map((r) => PORTFOLIO_ORDER.indexOf(r.range_label))
      )
      const currentIdx = PORTFOLIO_ORDER.indexOf(answers.portfolio_size)
      return (maxSweetSpotIdx <= currentIdx) === expectedValue
    }

    // Rule 21: Vendor lacks mobile app (depends on features table)
    case 'vendor_lacks_mobile_app': {
      if (bundle.features.length === 0) return false
      const hasMobile = bundle.features.some(
        (f) => f.feature_slug === 'mobile_app' && f.supported
      )
      return !hasMobile === expectedValue
    }

    // Rule 22: Vendor lacks tenant portal (depends on features table)
    case 'vendor_lacks_tenant_portal': {
      if (bundle.features.length === 0) return false
      const hasTenantPortal = bundle.features.some(
        (f) => f.feature_slug === 'tenant_portal' && f.supported
      )
      return !hasTenantPortal === expectedValue
    }

    // Rule 25: Vendor targets this manager type with high fit score
    case 'vendor_targets_manager_type_with_high_fit': {
      if (!answers.manager_type) return false
      const types = getManagerTypes(answers.manager_type)
      const match = bundle.targets.find(
        (t) => types.includes(t.target_type) && (t.fit_score ?? 0) >= 4
      )
      return !!match === expectedValue
    }

    default:
      return false
  }
}

/* ─── Condition evaluator ─── */

function evaluateCondition(
  key: string,
  expectedValue: unknown,
  answers: WizardAnswers,
  bundle: VendorBundle
): boolean {
  // 1. Simple input match: key matches a wizard answer field
  if (key in answers) {
    const actual = answers[key as keyof WizardAnswers]
    return actual === expectedValue
  }

  // 2. Deal breaker flags: deal_breaker_* → check answers.deal_breakers array
  if (key.startsWith('deal_breaker_')) {
    const breakerKey = key.replace('deal_breaker_', '')
    const hasBreaker = (answers.deal_breakers || []).includes(breakerKey)
    return hasBreaker === expectedValue
  }

  // 3. Vendor field match: vendor.* → check vendor object
  if (key.startsWith('vendor.')) {
    const field = key.slice(7) // remove "vendor."

    // Handle comparison operators embedded in key
    if (field === 'review_score_g2_gte') {
      const score = bundle.vendor.review_score_g2
      if (score == null) return false
      return score >= (expectedValue as number)
    }
    if (field === 'review_score_g2_lt') {
      const score = bundle.vendor.review_score_g2
      if (score == null) return false
      return score < (expectedValue as number)
    }

    // Compliance level and local_data_residency come from geography table
    if (field === 'compliance_level') {
      if (!answers.country || answers.country === 'OTHER') return false
      const geo = getVendorGeoForCountry(bundle, answers.country)
      return geo?.compliance_level === expectedValue
    }
    if (field === 'local_data_residency') {
      if (!answers.country || answers.country === 'OTHER') return false
      const geo = getVendorGeoForCountry(bundle, answers.country)
      // local_data_residency isn't a column — use local_support as proxy
      return false // Column doesn't exist in schema, skip
    }
    if (field === 'onboarding_support') {
      const val = (bundle.vendor as Record<string, unknown>)[
        'onboarding_support'
      ]
      return val === expectedValue
    }

    // Direct vendor field match
    const vendorRecord = bundle.vendor as Record<string, unknown>
    if (field in vendorRecord) {
      return vendorRecord[field] === expectedValue
    }

    // Computed vendor conditions
    return evaluateComputedCondition(key, expectedValue, answers, bundle)
  }

  // 4. Computed conditions (no prefix)
  return evaluateComputedCondition(key, expectedValue, answers, bundle)
}

/* ─── Main scoring function ─── */

export function scoreVendors(
  answers: WizardAnswers,
  bundles: VendorBundle[],
  rules: DecisionRule[]
): { scoredVendors: ScoredVendor[]; ruleLog: RuleExecutionLogEntry[] } {
  const ruleLog: RuleExecutionLogEntry[] = []

  // Initialize scores
  const vendorScores = new Map<
    number,
    {
      score: number
      excluded: boolean
      exclusion_reason: string | null
      explanations: string[]
      warnings: string[]
    }
  >()

  for (const bundle of bundles) {
    vendorScores.set(bundle.vendor.id, {
      score: 50,
      excluded: false,
      exclusion_reason: null,
      explanations: [],
      warnings: [],
    })
  }

  // Template vars for interpolation
  const templateVars: Record<string, string> = {
    manager_type: answers.manager_type
      ? formatManagerType(answers.manager_type)
      : '',
    country: answers.country ? formatCountry(answers.country) : '',
    portfolio_size: answers.portfolio_size
      ? formatPortfolioSize(answers.portfolio_size)
      : '',
    budget: answers.budget || '',
    accounting_integration: answers.accounting_integration || '',
  }

  // Sort rules: rule_order ASC, then priority DESC
  const sortedRules = [...rules].sort(
    (a, b) => a.rule_order - b.rule_order || b.priority - a.priority
  )

  // Evaluate each rule against each vendor
  for (const rule of sortedRules) {
    for (const bundle of bundles) {
      const state = vendorScores.get(bundle.vendor.id)!

      // Skip already-excluded vendors for non-hard-exclude rules
      if (state.excluded && rule.rule_type !== 'hard_exclude') {
        continue
      }
      // Skip already-excluded vendors for hard-exclude too (already out)
      if (state.excluded) {
        continue
      }

      // Check if rule depends on empty data
      const conditionKeys = Object.keys(rule.conditions)
      const dependsOnFeatures = conditionKeys.some(
        (k) =>
          k === 'vendor_missing_must_have_feature' ||
          k === 'vendor_has_standout_feature_matching_need' ||
          k === 'vendor_lacks_mobile_app' ||
          k === 'vendor_lacks_tenant_portal'
      )
      const dependsOnIntegrations = conditionKeys.some(
        (k) =>
          k === 'vendor_has_native_integration_for_selected_accounting' ||
          k === 'vendor_lacks_selected_accounting_integration'
      )

      if (dependsOnFeatures && bundle.features.length === 0) {
        ruleLog.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          vendor_id: bundle.vendor.id,
          vendor_name: bundle.vendor.name,
          matched: false,
          action: rule.rule_type,
          score_adjustment: 0,
          explanation: null,
          warning: null,
          skipped_reason: 'Feature data not yet available',
        })
        continue
      }

      if (dependsOnIntegrations) {
        ruleLog.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          vendor_id: bundle.vendor.id,
          vendor_name: bundle.vendor.name,
          matched: false,
          action: rule.rule_type,
          score_adjustment: 0,
          explanation: null,
          warning: null,
          skipped_reason: 'Integration data not yet available',
        })
        continue
      }

      // Evaluate all conditions
      const conditionResults = Object.entries(rule.conditions).map(
        ([key, value]) => evaluateCondition(key, value, answers, bundle)
      )

      const matched =
        rule.condition_logic === 'AND'
          ? conditionResults.every(Boolean)
          : conditionResults.some(Boolean)

      // Build vendor-specific template vars
      const vendorVars = {
        ...templateVars,
        vendor_name: bundle.vendor.name,
        review_score_g2: String(bundle.vendor.review_score_g2 ?? 'N/A'),
      }

      if (matched) {
        switch (rule.rule_type) {
          case 'hard_exclude':
            state.excluded = true
            state.exclusion_reason = rule.explanation_template
              ? interpolate(rule.explanation_template, vendorVars)
              : rule.rule_name
            break
          case 'boost':
          case 'penalise':
            state.score += rule.score_adjustment
            if (rule.explanation_template) {
              state.explanations.push(
                interpolate(rule.explanation_template, vendorVars)
              )
            }
            break
          case 'flag_warning':
            if (rule.warning_message) {
              state.warnings.push(
                interpolate(rule.warning_message, vendorVars)
              )
            }
            break
        }
      }

      ruleLog.push({
        rule_id: rule.id,
        rule_name: rule.rule_name,
        vendor_id: bundle.vendor.id,
        vendor_name: bundle.vendor.name,
        matched,
        action: rule.rule_type,
        score_adjustment: matched ? rule.score_adjustment : 0,
        explanation:
          matched && rule.explanation_template
            ? interpolate(rule.explanation_template, vendorVars)
            : null,
        warning:
          matched && rule.warning_message
            ? interpolate(rule.warning_message, vendorVars)
            : null,
      })
    }
  }

  // Build final scored vendors
  const scoredVendors: ScoredVendor[] = bundles.map((bundle) => {
    const state = vendorScores.get(bundle.vendor.id)!
    return {
      vendor: bundle.vendor,
      score: Math.max(0, Math.min(100, state.score)),
      explanations: state.explanations,
      warnings: state.warnings,
      excluded: state.excluded,
      exclusion_reason: state.exclusion_reason,
    }
  })

  // Sort: non-excluded by score DESC, excluded at end
  scoredVendors.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1
    return b.score - a.score
  })

  return { scoredVendors, ruleLog }
}
