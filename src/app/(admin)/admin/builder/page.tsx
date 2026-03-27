'use client';

import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Card } from '@/components/ui';

// ── Types ────────────────────────────────────────────────────────────────────

type VarType = 'string' | 'number' | 'boolean' | 'array';

interface Variable {
  id: string;
  name: string;
  type: VarType;
  sample: string;
  desc: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  variables: Variable[];
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  projectId: string;
  name: string;
  description: string;
  schemaType: 'blank' | 'executive' | 'comparison' | 'single' | 'custom';
  fields: string[];
  fieldSegments: Record<string, Segment[]>;
  createdAt: string;
  updatedAt: string;
}

interface TextSegment {
  id: string;
  type: 'text';
  value: string;
}

interface VarSegment {
  id: string;
  type: 'var';
  name: string;
}

interface CondSegment {
  id: string;
  type: 'cond';
  variable: string;
  op: string;
  compareValue: string;
  ifTrue: Segment[];
  ifFalse: Segment[];
}

type Segment = TextSegment | VarSegment | CondSegment;

// ── localStorage helpers ─────────────────────────────────────────────────────

const PROJECTS_KEY = 'pmw-builder-projects';
const TEMPLATES_KEY = 'pmw-builder-templates';

function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  window.dispatchEvent(new CustomEvent('pmw-builder-change'));
}

function removeProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  // Also remove associated templates
  const templates = getTemplates().filter((t) => t.projectId !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent('pmw-builder-change'));
}

function getTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplate(template: Template): void {
  const templates = getTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  window.dispatchEvent(new CustomEvent('pmw-builder-change'));
}

// ── useProjects hook ─────────────────────────────────────────────────────────

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);

  const reload = useCallback(() => {
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener('pmw-builder-change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('pmw-builder-change', handler);
      window.removeEventListener('storage', handler);
    };
  }, [reload]);

  const createProject = useCallback(
    (name: string, description = '') => {
      const now = new Date().toISOString();
      const project: Project = {
        id: nanoid(),
        name,
        description,
        variables: [],
        createdAt: now,
        updatedAt: now,
      };
      saveProject(project);
      reload();
      return project;
    },
    [reload],
  );

  const deleteProject = useCallback(
    (id: string) => {
      removeProject(id);
      reload();
    },
    [reload],
  );

  return { projects, createProject, deleteProject };
}

// ── Segment factory helpers ──────────────────────────────────────────────────

function segText(value: string): TextSegment {
  return { id: nanoid(), type: 'text', value };
}

function segVar(name: string): VarSegment {
  return { id: nanoid(), type: 'var', name };
}

function segCond(
  variable: string,
  op: string,
  compareValue: string,
  ifTrue: Segment[],
  ifFalse: Segment[],
): CondSegment {
  return { id: nanoid(), type: 'cond', variable, op, compareValue, ifTrue, ifFalse };
}

// ── Property Management demo data ────────────────────────────────────────────

function createPropertyDemoVariables(): Variable[] {
  return [
    { id: nanoid(), name: 'occupancy_rate', type: 'number', sample: '94.2', desc: 'Current occupancy rate %' },
    { id: nanoid(), name: 'quarter', type: 'string', sample: 'Q1 2026', desc: 'Current reporting quarter' },
    { id: nanoid(), name: 'occupancy_benchmark_diff', type: 'string', sample: '3.1% above benchmark', desc: 'Pre-computed benchmark comparison text' },
    { id: nanoid(), name: 'avg_rent_current', type: 'number', sample: '2450', desc: 'Current average monthly rent' },
    { id: nanoid(), name: 'avg_rent_previous', type: 'number', sample: '2380', desc: 'Previous quarter average rent' },
    { id: nanoid(), name: 'rent_delta', type: 'number', sample: '2.9', desc: 'Rent % change quarter over quarter' },
    { id: nanoid(), name: 'rent_delta_abs', type: 'number', sample: '2.9', desc: 'Absolute rent change %' },
    { id: nanoid(), name: 'previous_quarter', type: 'string', sample: 'Q4 2025', desc: 'Previous quarter label' },
    { id: nanoid(), name: 'vacancy_rate', type: 'number', sample: '5.8', desc: 'Current vacancy rate %' },
    { id: nanoid(), name: 'vacancy_delta', type: 'number', sample: '-1.2', desc: 'Vacancy rate change % (negative = improved)' },
    { id: nanoid(), name: 'maintenance_requests', type: 'number', sample: '47', desc: 'Open maintenance requests' },
    { id: nanoid(), name: 'maintenance_resolved', type: 'number', sample: '112', desc: 'Resolved maintenance requests this quarter' },
    { id: nanoid(), name: 'avg_resolution_days', type: 'number', sample: '3.2', desc: 'Average days to resolve maintenance' },
    { id: nanoid(), name: 'total_units', type: 'number', sample: '342', desc: 'Total units managed' },
    { id: nanoid(), name: 'noi_current', type: 'number', sample: '284500', desc: 'Current Net Operating Income' },
    { id: nanoid(), name: 'noi_delta', type: 'number', sample: '4.7', desc: 'NOI % change quarter over quarter' },
    { id: nanoid(), name: 'lease_renewals', type: 'number', sample: '28', desc: 'Lease renewals this quarter' },
    { id: nanoid(), name: 'renewal_rate', type: 'number', sample: '82.4', desc: 'Lease renewal rate %' },
    { id: nanoid(), name: 'delinquency_rate', type: 'number', sample: '2.1', desc: 'Rent delinquency rate %' },
    { id: nanoid(), name: 'delinquency_benchmark', type: 'number', sample: '3.5', desc: 'Benchmark delinquency rate %' },
    { id: nanoid(), name: 'occupancy_benchmark', type: 'number', sample: '91.0', desc: 'Occupancy benchmark %' },
  ];
}

function createPropertyDemoFieldSegments(): Record<string, Segment[]> {
  const headline: Segment[] = [
    segText('Portfolio occupancy reached '),
    segVar('occupancy_rate'),
    segText('% in '),
    segVar('quarter'),
    segText(', '),
    segVar('occupancy_benchmark_diff'),
    segText(', with average rent at $'),
    segVar('avg_rent_current'),
    segText('/mo across '),
    segVar('total_units'),
    segText(' units.'),
  ];

  const keyShifts: Segment[] = [
    segText('Average rent '),
    segCond('rent_delta', 'gt', '0', [segText('increased')], [segText('decreased')]),
    segText(' by '),
    segVar('rent_delta_abs'),
    segText('% compared to '),
    segVar('previous_quarter'),
    segText(' ($'),
    segVar('avg_rent_previous'),
    segText('/mo). Vacancy '),
    segCond('vacancy_delta', 'lt', '0', [segText('improved')], [segText('worsened')]),
    segText(' to '),
    segVar('vacancy_rate'),
    segText('%. Maintenance resolution averages '),
    segVar('avg_resolution_days'),
    segText(' days with '),
    segVar('maintenance_requests'),
    segText(' open tickets.'),
  ];

  const benchmarkPerformance: Segment[] = [
    segText('Occupancy of '),
    segVar('occupancy_rate'),
    segText('% is '),
    segCond(
      'occupancy_rate',
      'gt',
      '91',
      [segText('above')],
      [segText('below')],
    ),
    segText(' the '),
    segVar('occupancy_benchmark'),
    segText('% benchmark. Delinquency at '),
    segVar('delinquency_rate'),
    segText('% '),
    segCond(
      'delinquency_rate',
      'lt',
      '3.5',
      [segText('outperforms')],
      [segText('trails')],
    ),
    segText(' the '),
    segVar('delinquency_benchmark'),
    segText('% industry average.'),
  ];

  const strategicOutlook: Segment[] = [
    segText('NOI '),
    segCond('noi_delta', 'gt', '0', [segText('grew')], [segText('contracted')]),
    segText(' '),
    segVar('noi_delta'),
    segText('% quarter-over-quarter. Lease renewal rate of '),
    segVar('renewal_rate'),
    segText('% '),
    segCond(
      'renewal_rate',
      'gte',
      '80',
      [segText('remains strong')],
      [segText('needs attention')],
    ),
    segText('. Focus on reducing the '),
    segVar('maintenance_requests'),
    segText(' open maintenance items to sustain tenant satisfaction.'),
  ];

  return {
    headline,
    key_shifts: keyShifts,
    benchmark_performance: benchmarkPerformance,
    strategic_outlook: strategicOutlook,
  };
}

// ── Tenant Retention demo data ───────────────────────────────────────────────

function createTenantRetentionVariables(): Variable[] {
  return [
    { id: nanoid(), name: 'renewal_rate', type: 'number', sample: '82.4', desc: 'Lease renewal rate %' },
    { id: nanoid(), name: 'avg_tenure_months', type: 'number', sample: '26', desc: 'Average tenant tenure in months' },
    { id: nanoid(), name: 'churn_rate', type: 'number', sample: '17.6', desc: 'Tenant churn rate %' },
    { id: nanoid(), name: 'satisfaction_score', type: 'number', sample: '4.2', desc: 'Tenant satisfaction score (1-5)' },
    { id: nanoid(), name: 'move_out_reason_top', type: 'string', sample: 'Relocation', desc: 'Most common move-out reason' },
    { id: nanoid(), name: 'move_out_reason_pct', type: 'number', sample: '34', desc: 'Top reason percentage' },
    { id: nanoid(), name: 'early_terminations', type: 'number', sample: '5', desc: 'Early lease terminations this quarter' },
    { id: nanoid(), name: 'renewal_incentive_cost', type: 'number', sample: '12400', desc: 'Total renewal incentive cost this quarter' },
  ];
}

function createTenantRetentionTemplates(): Array<{
  name: string;
  description: string;
  fields: string[];
  fieldSegments: Record<string, Segment[]>;
}> {
  return [
    {
      name: 'retention_summary',
      description: 'Tenant retention and churn analysis',
      fields: ['overview', 'churn_analysis', 'recommendations'],
      fieldSegments: {
        overview: [
          segText('Lease renewal rate stands at '),
          segVar('renewal_rate'),
          segText('% with an average tenant tenure of '),
          segVar('avg_tenure_months'),
          segText(' months. Tenant satisfaction score is '),
          segVar('satisfaction_score'),
          segText(' out of 5.'),
        ],
        churn_analysis: [
          segText('Churn rate of '),
          segVar('churn_rate'),
          segText('% driven primarily by '),
          segVar('move_out_reason_top'),
          segText(' ('),
          segVar('move_out_reason_pct'),
          segText('% of departures). There were '),
          segVar('early_terminations'),
          segText(' early lease terminations this quarter.'),
        ],
        recommendations: [
          segText('Renewal incentive spend of $'),
          segVar('renewal_incentive_cost'),
          segText(' '),
          segCond(
            'renewal_rate',
            'gte',
            '80',
            [segText('is yielding strong results. Maintain current programs.')],
            [segText('may need to be increased to improve retention.')],
          ),
        ],
      },
    },
  ];
}

// ── Page Component ───────────────────────────────────────────────────────────

export default function BuilderDashboardPage() {
  const { projects, createProject, deleteProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject(name.trim());
    setName('');
    setShowForm(false);
  };

  const loadPropertyDemo = () => {
    const now = new Date().toISOString();
    const projectId = nanoid();
    const project: Project = {
      id: projectId,
      name: 'Sunrise Properties (Demo)',
      description: 'Portfolio KPI reporting templates -- loaded from property management reference data',
      variables: createPropertyDemoVariables(),
      createdAt: now,
      updatedAt: now,
    };
    saveProject(project);

    const templateId = nanoid();
    const template: Template = {
      id: templateId,
      projectId,
      name: 'kpi_summary',
      description: 'Key Performance Indicators executive summary',
      schemaType: 'executive',
      fields: ['headline', 'key_shifts', 'benchmark_performance', 'strategic_outlook'],
      fieldSegments: createPropertyDemoFieldSegments(),
      createdAt: now,
      updatedAt: now,
    };
    saveTemplate(template);
  };

  const loadTenantRetention = () => {
    const now = new Date().toISOString();
    const projectId = nanoid();
    const project: Project = {
      id: projectId,
      name: 'Tenant Retention Analytics',
      description: 'Retention analytics -- renewal economics, churn behaviour, and satisfaction tracking',
      variables: createTenantRetentionVariables(),
      createdAt: now,
      updatedAt: now,
    };
    saveProject(project);

    const templates = createTenantRetentionTemplates();
    for (const t of templates) {
      const templateId = nanoid();
      const template: Template = {
        id: templateId,
        projectId,
        name: t.name,
        description: t.description,
        schemaType: 'comparison',
        fields: t.fields,
        fieldSegments: t.fieldSegments,
        createdAt: now,
        updatedAt: now,
      };
      saveTemplate(template);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <span className="font-mono text-[15px] font-bold text-gray-900 tracking-tight">
            HBS Composer
          </span>
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
            deterministic templates
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Projects</h1>
            <p className="text-sm text-gray-500">
              Manage your Handlebars template projects
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={loadPropertyDemo}>
              Load Property Demo
            </Button>
            <Button size="sm" onClick={loadTenantRetention}>
              Load Tenant Retention
            </Button>
            <Button
              size="sm"
              variant={showForm ? 'secondary' : 'primary'}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : '+ New Project'}
            </Button>
          </div>
        </div>

        {/* New project form */}
        {showForm && (
          <Card className="mb-6 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block mb-1">
                Project Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Sunrise Properties"
                autoFocus
              />
            </div>
            <Button onClick={handleCreate}>Create</Button>
          </Card>
        )}

        {/* Project grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-gray-400 text-sm mb-3">No projects yet</p>
            <p className="text-gray-500 text-sm">
              Create a new project or load a demo to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card
                key={p.id}
                hover
                className="p-0 overflow-hidden group"
              >
                <Link
                  href={`/admin/builder/project/${p.id}`}
                  className="block p-5"
                >
                  <h3 className="font-mono text-sm font-bold text-gray-900 mb-1">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                    <span>
                      {p.variables.length} variable
                      {p.variables.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {new Date(p.updatedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </Link>
                <div className="border-t border-gray-100 px-5 py-2">
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${p.name}"? This cannot be undone.`,
                        )
                      ) {
                        deleteProject(p.id);
                      }
                    }}
                    className="text-[10px] font-mono text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
