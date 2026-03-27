'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Sparkles,
  Globe,
  FileText,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Wand2,
  Eye,
  Users,
  Target,
  AlertOctagon,
  MessageSquare,
  Crosshair,
  BookOpen,
  Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Input, Select, Textarea, Card, Toggle, Label } from '@/components/ui'

interface SiteSettings {
  id?: string
  site_name: string
  site_description: string
  author_name: string
  author_credentials: string
  ai_enabled: boolean
  auto_publish: boolean
  content_niche: string
  content_categories: string
  primary_keywords: string
  icp_title: string
  icp_description: string
  icp_pain_points: string
  icp_goals: string
  writing_tone: string
  writing_style: string
  content_angles: string
  unique_perspective: string
  min_word_count: number
  max_word_count: number
  include_intro_hook: boolean
  include_subheadings: boolean
  include_actionable_takeaways: boolean
  include_cta: boolean
  cta_text: string
  avoid_ai_cliches: boolean
  avoid_fake_stats: boolean
  avoid_citations: boolean
  things_to_avoid: string
  required_elements: string
  brand_voice: string
  methodology: string
  competitive_positioning: string
  key_messages: string
  content_formats: string
  cta_guidelines: string
  spelling_preference: string
  custom_system_prompt: string
  custom_instructions: string
  slack_webhook_url: string
  weekly_report_enabled: boolean
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'PropertyManageWiz',
  site_description: 'PropertyManageWiz helps property managers and landlords find the right property management software for their needs.',
  author_name: '',
  author_credentials: '',
  ai_enabled: false,
  auto_publish: false,
  content_niche: 'Property management software comparison and selection',
  content_categories: 'Property Management Software, Vendor Comparisons, Australian Market, UK Market, US Market, Industry Trends, Best Practices',
  primary_keywords: 'property management software, best property management software Australia, property management tools comparison, landlord software',
  icp_title: 'Property managers, landlords, real estate investors',
  icp_description: '',
  icp_pain_points: '',
  icp_goals: '',
  writing_tone: 'authoritative',
  writing_style: '',
  content_angles: '',
  unique_perspective: '',
  min_word_count: 1200,
  max_word_count: 1800,
  include_intro_hook: true,
  include_subheadings: true,
  include_actionable_takeaways: true,
  include_cta: true,
  cta_text: '',
  avoid_ai_cliches: true,
  avoid_fake_stats: true,
  avoid_citations: true,
  things_to_avoid: '',
  required_elements: '',
  brand_voice: '',
  methodology: '',
  competitive_positioning: '',
  key_messages: '',
  content_formats: '',
  cta_guidelines: '',
  spelling_preference: 'british',
  custom_system_prompt: '',
  custom_instructions: '',
  slack_webhook_url: '',
  weekly_report_enabled: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPromptPreview, setShowPromptPreview] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('de_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch settings:', error)
        showMessage('error', 'Failed to load settings')
      } else if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { id, ...settingsToSave } = settings as any

      const { data, error } = await supabase
        .from('de_settings')
        .upsert(id ? { id, ...settingsToSave } : settingsToSave)
        .select()
        .single()

      if (error) throw new Error(error.message)
      setSettings({ ...DEFAULT_SETTINGS, ...data })
      showMessage('success', 'Settings saved successfully')
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      showMessage('error', error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const generatePromptPreview = () => {
    const s = settings
    const spellingNote = s.spelling_preference === 'british' ? 'Use British English spelling (optimise, organisation, colour, etc.).' : s.spelling_preference === 'american' ? 'Use American English spelling (optimize, organization, color, etc.).' : ''

    return `You are ${s.author_name}, ${s.author_credentials}. You write for ${s.site_name}: ${s.site_description}.

## YOUR AUDIENCE (ICP)
Target Reader: ${s.icp_title}
Who They Are: ${s.icp_description}
Their Pain Points: ${s.icp_pain_points}
Their Goals: ${s.icp_goals}

## YOUR UNIQUE PERSPECTIVE
${s.unique_perspective}

## CONTENT FOCUS
Niche: ${s.content_niche}
Categories: ${s.content_categories}
Primary Keywords: ${s.primary_keywords}

## WRITING STYLE
Tone: ${s.writing_tone}
Style: ${s.writing_style}
Content Angles: ${s.content_angles}
${spellingNote ? `Spelling: ${spellingNote}` : ''}

${s.brand_voice ? `## BRAND VOICE RULES\n${s.brand_voice}` : ''}

${s.methodology ? `## CORE METHODOLOGY\n${s.methodology}` : ''}

${s.competitive_positioning ? `## COMPETITIVE POSITIONING\n${s.competitive_positioning}` : ''}

${s.key_messages ? `## KEY MESSAGES TO REINFORCE\n${s.key_messages}` : ''}

${s.content_formats ? `## CONTENT FORMAT GUIDELINES\n${s.content_formats}` : ''}

${s.cta_guidelines ? `## CTA GUIDELINES\n${s.cta_guidelines}` : ''}

## CONTENT STRUCTURE
- Word Count: ${s.min_word_count} - ${s.max_word_count} words
${s.include_intro_hook ? '- Start with a compelling hook that grabs attention in the first sentence' : ''}
${s.include_subheadings ? '- Use clear H2 subheadings to structure the content for scannability' : ''}
${s.include_actionable_takeaways ? '- Include actionable takeaways the reader can implement immediately' : ''}
${s.include_cta ? `- End with CTA: "${s.cta_text}"` : ''}

## REQUIRED ELEMENTS
${s.required_elements}

## THINGS TO ABSOLUTELY AVOID
${s.avoid_fake_stats ? '- NEVER invent statistics, percentages, or data points' : ''}
${s.avoid_citations ? "- NEVER cite studies, research papers, or sources (we can't verify them)" : ''}
${s.avoid_ai_cliches ? '- NEVER use AI cliches or overused phrases' : ''}
${s.things_to_avoid ? `- Specifically avoid: ${s.things_to_avoid}` : ''}

${s.custom_system_prompt ? `## ADDITIONAL CONTEXT\n${s.custom_system_prompt}` : ''}

${s.custom_instructions ? `## SPECIAL INSTRUCTIONS\n${s.custom_instructions}` : ''}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-violet-500" />
          <div>
            <h1 className="text-2xl font-bold">Content Settings</h1>
            <p className="text-gray-500">Full control over your AI content generation</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowPromptPreview(!showPromptPreview)}
          >
            <Eye className="h-4 w-4" />
            {showPromptPreview ? 'Hide' : 'Show'} Prompt Preview
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg font-medium ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Prompt Preview */}
      {showPromptPreview && (
        <div className="mb-6 bg-gray-900 text-gray-100 rounded-xl p-6 overflow-auto max-h-96">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Live Prompt Preview</h2>
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">Updates as you edit</span>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-mono text-gray-300">{generatePromptPreview()}</pre>
        </div>
      )}

      <div className="space-y-6">
        {/* AI Generation Toggle */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">AI Content Generation</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              settings.ai_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {settings.ai_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable AI Generation</p>
                <p className="text-sm text-gray-500">Allow generating blog posts using AI</p>
              </div>
              <Toggle
                checked={settings.ai_enabled}
                onChange={(e) => setSettings({ ...settings, ai_enabled: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-publish Posts</p>
                <p className="text-sm text-gray-500">Publish immediately (not recommended - review first)</p>
              </div>
              <Toggle
                checked={settings.auto_publish}
                onChange={(e) => setSettings({ ...settings, auto_publish: e.target.checked })}
              />
            </div>
          </div>
        </Card>

        {/* Site Identity */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Site & Author Identity</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Site Name</Label>
                <Input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Author Name</Label>
                <Input
                  type="text"
                  value={settings.author_name}
                  onChange={(e) => setSettings({ ...settings, author_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Site Description</Label>
              <Textarea
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                rows={2}
                placeholder="What is this site about?"
              />
            </div>
            <div>
              <Label>Author Credentials</Label>
              <Textarea
                value={settings.author_credentials}
                onChange={(e) => setSettings({ ...settings, author_credentials: e.target.value })}
                rows={2}
                placeholder="Your background and expertise that establishes credibility"
              />
            </div>
          </div>
        </Card>

        {/* Target Audience */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Target Audience (ICP)</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">Define who you&apos;re writing for - this shapes every piece of content</p>

          <div className="space-y-4">
            <div>
              <Label>Target Reader Title</Label>
              <Input
                type="text"
                value={settings.icp_title}
                onChange={(e) => setSettings({ ...settings, icp_title: e.target.value })}
                placeholder="e.g., Property Managers, Landlords, Real Estate Investors"
              />
            </div>
            <div>
              <Label>Who They Are</Label>
              <Textarea
                value={settings.icp_description}
                onChange={(e) => setSettings({ ...settings, icp_description: e.target.value })}
                rows={3}
                placeholder="Describe your ideal reader - their situation, mindset, what they value..."
              />
            </div>
            <div>
              <Label>Their Pain Points</Label>
              <Textarea
                value={settings.icp_pain_points}
                onChange={(e) => setSettings({ ...settings, icp_pain_points: e.target.value })}
                rows={3}
                placeholder="What frustrates them? What problems do they face daily?"
              />
            </div>
            <div>
              <Label>Their Goals</Label>
              <Textarea
                value={settings.icp_goals}
                onChange={(e) => setSettings({ ...settings, icp_goals: e.target.value })}
                rows={2}
                placeholder="What are they trying to achieve?"
              />
            </div>
          </div>
        </Card>

        {/* Content Focus */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Content Focus</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Content Niche</Label>
              <Input
                type="text"
                value={settings.content_niche}
                onChange={(e) => setSettings({ ...settings, content_niche: e.target.value })}
                placeholder="e.g., property management software comparison"
              />
            </div>
            <div>
              <Label>Content Categories</Label>
              <Textarea
                value={settings.content_categories}
                onChange={(e) => setSettings({ ...settings, content_categories: e.target.value })}
                rows={2}
                placeholder="Comma-separated list of categories"
              />
              <p className="text-xs text-gray-500 mt-1">These will be available when generating posts</p>
            </div>
            <div>
              <Label>Primary Keywords</Label>
              <Textarea
                value={settings.primary_keywords}
                onChange={(e) => setSettings({ ...settings, primary_keywords: e.target.value })}
                rows={2}
                placeholder="Keywords to naturally incorporate"
              />
            </div>
          </div>
        </Card>

        {/* Writing Style */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Writing Style & Voice</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Writing Tone</Label>
                <Select
                  value={settings.writing_tone}
                  onChange={(e) => setSettings({ ...settings, writing_tone: e.target.value })}
                >
                  <option value="authoritative">Authoritative - Expert sharing hard-won insights</option>
                  <option value="conversational">Conversational - Like talking to a smart colleague</option>
                  <option value="provocative">Provocative - Challenging conventional wisdom</option>
                  <option value="educational">Educational - Teaching complex concepts simply</option>
                  <option value="inspirational">Inspirational - Motivating action and change</option>
                </Select>
              </div>
              <div>
                <Label>Spelling Preference</Label>
                <Select
                  value={settings.spelling_preference}
                  onChange={(e) => setSettings({ ...settings, spelling_preference: e.target.value })}
                >
                  <option value="british">British English (optimise, organisation, colour)</option>
                  <option value="american">American English (optimize, organization, color)</option>
                  <option value="auto">Auto (match audience region)</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Writing Style Instructions</Label>
              <Textarea
                value={settings.writing_style}
                onChange={(e) => setSettings({ ...settings, writing_style: e.target.value })}
                rows={3}
                placeholder="Describe how the content should be written..."
              />
            </div>
            <div>
              <Label>Content Angles</Label>
              <Textarea
                value={settings.content_angles}
                onChange={(e) => setSettings({ ...settings, content_angles: e.target.value })}
                rows={2}
                placeholder="What angles or perspectives should the content take?"
              />
            </div>
            <div>
              <Label>Your Unique Perspective</Label>
              <Textarea
                value={settings.unique_perspective}
                onChange={(e) => setSettings({ ...settings, unique_perspective: e.target.value })}
                rows={3}
                placeholder="What's your core thesis or unique viewpoint that should come through in every piece?"
              />
              <p className="text-xs text-gray-500 mt-1">This is your thought leadership differentiator</p>
            </div>
          </div>
        </Card>

        {/* Brand Voice & Methodology */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Brand Voice & Methodology</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">Core brand rules and methodology the AI should reference in every piece of content</p>

          <div className="space-y-4">
            <div>
              <Label>Brand Voice Rules</Label>
              <Textarea
                value={settings.brand_voice}
                onChange={(e) => setSettings({ ...settings, brand_voice: e.target.value })}
                rows={8}
                placeholder="Do's and don'ts for writing voice..."
              />
              <p className="text-xs text-gray-500 mt-1">Specific do&apos;s and don&apos;ts that guide the AI&apos;s writing voice</p>
            </div>
            <div>
              <Label>Core Methodology / Framework</Label>
              <Textarea
                value={settings.methodology}
                onChange={(e) => setSettings({ ...settings, methodology: e.target.value })}
                rows={10}
                placeholder="Your core methodology or framework that content should reference..."
              />
              <p className="text-xs text-gray-500 mt-1">The AI will weave this methodology into content naturally</p>
            </div>
            <div>
              <Label>Content Format Guidelines</Label>
              <Textarea
                value={settings.content_formats}
                onChange={(e) => setSettings({ ...settings, content_formats: e.target.value })}
                rows={8}
                placeholder="Guidelines for different content formats..."
              />
              <p className="text-xs text-gray-500 mt-1">Format-specific structures and guidelines</p>
            </div>
          </div>
        </Card>

        {/* Competitive Positioning & Key Messages */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Competitive Positioning & Key Messages</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">Help the AI understand your market position and the messages to reinforce</p>

          <div className="space-y-4">
            <div>
              <Label>Competitive Positioning</Label>
              <Textarea
                value={settings.competitive_positioning}
                onChange={(e) => setSettings({ ...settings, competitive_positioning: e.target.value })}
                rows={8}
                placeholder="How you differ from competitors..."
              />
            </div>
            <div>
              <Label>Key Messages to Reinforce</Label>
              <Textarea
                value={settings.key_messages}
                onChange={(e) => setSettings({ ...settings, key_messages: e.target.value })}
                rows={6}
                placeholder="Core messages and phrases to weave into content..."
              />
            </div>
            <div>
              <Label>CTA Guidelines</Label>
              <Textarea
                value={settings.cta_guidelines}
                onChange={(e) => setSettings({ ...settings, cta_guidelines: e.target.value })}
                rows={6}
                placeholder="Guidelines for calls-to-action — what to use, what to avoid..."
              />
            </div>
          </div>
        </Card>

        {/* Content Structure */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Content Structure</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Minimum Words</Label>
                <Input
                  type="number"
                  min={500}
                  max={5000}
                  value={settings.min_word_count}
                  onChange={(e) => setSettings({ ...settings, min_word_count: parseInt(e.target.value) || 1200 })}
                />
              </div>
              <div>
                <Label>Maximum Words</Label>
                <Input
                  type="number"
                  min={500}
                  max={5000}
                  value={settings.max_word_count}
                  onChange={(e) => setSettings({ ...settings, max_word_count: parseInt(e.target.value) || 1800 })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { key: 'include_intro_hook', label: 'Start with compelling hook', description: 'Grab attention in the first sentence' },
                { key: 'include_subheadings', label: 'Use H2 subheadings', description: 'Break content into scannable sections' },
                { key: 'include_actionable_takeaways', label: 'Include actionable takeaways', description: 'Give readers something they can do immediately' },
                { key: 'include_cta', label: 'Include call-to-action', description: 'End with a clear next step' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <Toggle
                    checked={(settings as any)[item.key]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  />
                </div>
              ))}
            </div>

            {settings.include_cta && (
              <div className="pt-2">
                <Label>CTA Text</Label>
                <Textarea
                  value={settings.cta_text}
                  onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
                  rows={2}
                  placeholder="What action should readers take?"
                />
              </div>
            )}

            <div className="pt-2">
              <Label>Required Elements</Label>
              <Textarea
                value={settings.required_elements}
                onChange={(e) => setSettings({ ...settings, required_elements: e.target.value })}
                rows={2}
                placeholder="What must every post include?"
              />
            </div>
          </div>
        </Card>

        {/* Quality Controls */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Quality Controls & Things to Avoid</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">Critical rules to prevent AI from generating problematic content</p>

          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { key: 'avoid_fake_stats', label: 'Never invent statistics', description: 'No made-up percentages or data points' },
                { key: 'avoid_citations', label: 'Never cite sources', description: "No references to studies or papers we can't verify" },
                { key: 'avoid_ai_cliches', label: 'Avoid AI cliches', description: 'No "dive into", "unleash", "game-changer", etc.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <Toggle
                    checked={(settings as any)[item.key]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Specific Things to Avoid</Label>
              <Textarea
                value={settings.things_to_avoid}
                onChange={(e) => setSettings({ ...settings, things_to_avoid: e.target.value })}
                rows={3}
                placeholder="List specific phrases, topics, or approaches to avoid..."
              />
            </div>
          </div>
        </Card>

        {/* Custom Instructions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Custom Instructions</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Additional Context (System Prompt)</Label>
              <Textarea
                value={settings.custom_system_prompt}
                onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
                rows={4}
                placeholder="Any additional background, context, or brand guidelines..."
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Special Instructions</Label>
              <Textarea
                value={settings.custom_instructions}
                onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
                rows={4}
                placeholder="Any special instructions that should be included in every generation..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Weekly Slack Report */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Weekly Slack Report</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Weekly Report</p>
                <p className="text-sm text-gray-500">Send search performance summary to Slack every Monday</p>
              </div>
              <Toggle
                checked={settings.weekly_report_enabled}
                onChange={(e) => setSettings({ ...settings, weekly_report_enabled: e.target.checked })}
              />
            </div>

            <div>
              <Label>Slack Webhook URL</Label>
              <Input
                type="url"
                value={settings.slack_webhook_url}
                onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/T.../B.../xxx"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create at api.slack.com/apps &rarr; Incoming Webhooks
              </p>
            </div>
          </div>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <Button size="lg" onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
