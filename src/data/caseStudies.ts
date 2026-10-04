/**
 * Flagship engineering case studies.
 *
 * Every sentence here must be traceable to the resume. Sections the resume does
 * not cover are left empty with a TODO and are simply not rendered: do not fill
 * them with plausible-sounding detail. Keep client architecture high level.
 */

export interface FlowStep {
  label: string;
  detail?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  context: string;
  status: 'Shipped' | 'In progress';
  /** One-line headline outcome for the card. */
  headline: string;
  overview: string;
  problem?: string;
  /** Rendered as an accessible step-by-step flow diagram. */
  architecture?: { caption: string; steps: FlowStep[] };
  decisions?: string[];
  implementation?: string[];
  reliability?: string[];
  outcomes?: string[];
  lessons?: string[];
  stack: string[];
  /** Branch in src/data/journey.ts, to link to the git log. */
  branch?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'ai-incident-assistant',
    title: 'AI incident management assistant',
    context: 'Latitude Financial Services · via Viable Solutions',
    status: 'Shipped',
    headline: 'Business-impact traces and mitigation hints in one conversation',
    overview:
      'A conversational AI assistant on AWS Bedrock, powered by Claude, that helps engineers resolve incidents faster.',
    problem:
      'Incident context lives across ServiceNow, Dynatrace and Datadog. The assistant brings it together so responders can see business impact and likely mitigations sooner.',
    architecture: {
      caption: 'High-level flow. Client-specific details intentionally omitted.',
      steps: [
        { label: 'Engineer', detail: 'Asks about an incident in natural language' },
        { label: 'Assistant on AWS Bedrock', detail: 'Claude reasons over the question' },
        { label: 'MCP servers', detail: 'ServiceNow, Dynatrace, Datadog' },
        { label: 'Answer', detail: 'Business-impact traces and mitigation hints' },
      ],
    },
    decisions: [
      'Integrations are exposed through MCP servers, so each tool (ServiceNow, Dynatrace, Datadog) is a separate, swappable connector.',
    ],
    implementation: [
      'Built the conversational assistant on AWS Bedrock with Claude.',
      'Connected it to ServiceNow, Dynatrace and Datadog MCP servers.',
    ],
    // TODO: reliability/security notes (auth, data handling, failure modes) not on the resume.
    outcomes: ['Surfaces business-impact traces and mitigation hints for faster resolution.'],
    // TODO: measured outcome (e.g. MTTR change) not on the resume.
    stack: ['AWS Bedrock', 'Claude', 'MCP', 'ServiceNow', 'Dynatrace', 'Datadog'],
    branch: 'ai',
  },
  {
    id: 'netflix-game-launch',
    title: 'High-concurrency game launch on Kubernetes',
    context: 'AKQA · Netflix game launch',
    status: 'Shipped',
    headline: '50k+ concurrent users in the first 10 minutes',
    overview:
      'SRE lead for the launch of an AI-driven, face-transforming game for Netflix, including the Kubernetes platform it ran on.',
    problem:
      'A public launch concentrates traffic into the first minutes, and the AI workload depends on GPUs, so the platform had to scale fast and GPU health had to be visible.',
    architecture: {
      caption: 'High-level view of the platform and its monitoring.',
      steps: [
        { label: 'Players', detail: 'Launch traffic' },
        { label: 'Kubernetes clusters', detail: 'Designed to scale for launch' },
        { label: 'GPU workloads', detail: 'AI face transformation' },
        { label: 'Grafana', detail: 'NVIDIA DCGM GPU metrics' },
      ],
    },
    implementation: [
      'Led SRE for the launch.',
      'Designed the Kubernetes clusters for launch-day scale.',
      'Set up Grafana monitoring of NVIDIA DCGM GPU metrics.',
    ],
    reliability: ['GPU metrics (NVIDIA DCGM) monitored in Grafana alongside the cluster.'],
    outcomes: ['Clusters scaled to 50k+ concurrent users in the first 10 minutes of launch.'],
    // TODO: decisions/trade-offs and lessons learned not on the resume.
    stack: ['Kubernetes', 'GPU', 'Grafana', 'NVIDIA DCGM'],
    branch: 'netflix',
  },
  {
    id: 'observability-migrations',
    title: 'Large-scale observability migrations',
    context: 'Cvent (Splunk to Datadog) · Latitude (Sumo Logic to Datadog)',
    status: 'In progress',
    headline: '~880M log events per week moved; 20M+ per week in flight',
    overview:
      'Two log platform migrations to Datadog at two employers: one completed at Cvent, one under way at Latitude Financial Services.',
    problem:
      'Logs, metrics and traces split across platforms make incidents slower to diagnose. Both migrations consolidate them for single-pane dashboards.',
    architecture: {
      caption: 'Before and after, simplified.',
      steps: [
        { label: 'Services and payment systems', detail: 'Log producers' },
        { label: 'Splunk / Sumo Logic', detail: 'Previous log platforms' },
        { label: 'Datadog pipelines', detail: 'Grok parsing for payment logs' },
        { label: 'Datadog', detail: 'Logs, metrics and traces; monitors and dashboards' },
      ],
    },
    implementation: [
      'Cvent: migrated ~880M log events per week from Splunk to Datadog, unifying logs, metrics and traces on one platform.',
      "Cvent: owned SLI/SLO and custom instrumentation standards for Java microservices, and led a newly acquired company's move to Datadog (10+ dashboards).",
      'Latitude: migrating 20M+ log events per week from Sumo Logic to Datadog, with Grok parsing pipelines for payment logs.',
    ],
    reliability: ['Transaction-orphan detection monitors on payment logs (Latitude).'],
    outcomes: [
      'Cvent: logs, metrics and traces on one platform.',
      'Latitude: aiming for single-pane dashboards and lower MTTR.',
    ],
    // TODO: decisions/trade-offs (cutover strategy, cost) and lessons learned not on the resume.
    stack: ['Datadog', 'Splunk', 'Sumo Logic', 'Grok parsing', 'SLIs/SLOs'],
    branch: 'cvent',
  },
  {
    id: 'claude-bedrock-proxy',
    title: 'Claude for developers via a Bedrock proxy',
    context: 'Latitude Financial Services · via Viable Solutions',
    status: 'In progress',
    headline: 'GitHub Copilot on Claude, with guardrails and per-developer cost attribution',
    overview:
      'An OpenAI-compatible Lambda proxy over AWS Bedrock so GitHub Copilot (bring your own key) can use Claude models inside the enterprise.',
    problem:
      'Developers want Claude in the tools they already use, and the organisation needs that usage governed and attributable.',
    architecture: {
      caption: 'Request path, simplified.',
      steps: [
        { label: 'GitHub Copilot (BYOK)', detail: 'Developer IDE' },
        { label: 'OpenAI-compatible Lambda proxy', detail: 'Per-developer key' },
        { label: 'Server-side guardrail', detail: 'Mandatory on every request' },
        { label: 'AWS Bedrock', detail: 'Claude models' },
      ],
    },
    decisions: [
      'OpenAI-compatible API, so Copilot BYOK can call it without client changes.',
      'Guardrail enforced server-side and mandatory, rather than left to each client.',
      'Per-developer keys, so cost can be attributed to individuals.',
    ],
    reliability: ['Mandatory server-side guardrail.', 'Per-developer keys for access and cost attribution.'],
    // TODO: outcomes once rolled out.
    stack: ['AWS Bedrock', 'AWS Lambda', 'Claude', 'GitHub Copilot', 'Guardrails'],
    branch: 'bedrock',
  },
];
