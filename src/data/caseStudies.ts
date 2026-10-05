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

export interface DiagramColumn {
  title: string;
  nodes: FlowStep[];
}

/** Extra content for a dedicated /projects/<id>/ page. */
export interface Feature {
  /** My role, as the resume states it. */
  role: string;
  facts: { label: string; value: string }[];
  diagram: { caption: string; columns: DiagramColumn[] };
  contributions: string[];
  /** Trade-offs need first-hand detail; leave empty (not rendered) until supplied. */
  tradeoffs?: string[];
  confidentiality: string;
  /** Optional image from a public source, always credited and linked. `file` is in src/assets. */
  media?: { file: string; alt: string; credit: string; href: string; caption?: string };
  /** Public write-up of the project, linked from the page header. */
  publicLink?: { label: string; href: string };
  /** Optional phased history, oldest first. */
  evolution?: { phase: string; when?: string; points: string[] }[];
}

export interface CaseStudy {
  id: string;
  /** Present on the flagship studies that get their own page. */
  feature?: Feature;
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
    id: 'alfred',
    feature: {
      role: 'Designed and built it, from prototype to production',
      facts: [
        { label: 'Where', value: 'Latitude Financial Services (client), as Lead SRE at Viable Solutions via Synechron' },
        { label: 'Status', value: 'Live in production since September 2026' },
        { label: 'Platform', value: 'Amazon Bedrock AgentCore, orchestrating AWS DevOps Agent' },
      ],
      diagram: {
        caption: 'Production architecture, simplified. Client systems, data and access controls are deliberately not shown.',
        columns: [
          {
            title: 'Entry points',
            nodes: [
              { label: 'Slack / Teams', detail: 'Ask during an incident' },
              { label: 'Alerts', detail: 'Investigations start automatically' },
              { label: 'IDE', detail: 'Deep investigation' },
              { label: 'Pull requests', detail: 'Blast-radius comments' },
            ],
          },
          { title: 'Orchestrate', nodes: [{ label: 'Alfred orchestrator', detail: 'AgentCore Runtime; Bedrock inference in-account' }] },
          {
            title: 'Investigate in parallel',
            nodes: [
              { label: 'AWS DevOps Agent', detail: 'AWS-side investigation' },
              { label: 'Specialist agents', detail: 'Datadog, Dynatrace, Buildkite, GitHub via AgentCore Gateway' },
              { label: 'Dependency graph', detail: 'Deterministic blast radius' },
            ],
          },
          {
            title: 'Answer and learn',
            nodes: [
              { label: 'Timeline and root cause', detail: 'Findings correlated, blind spots declared' },
              { label: 'Knowledge base', detail: 'Updated after every investigation' },
            ],
          },
        ],
      },
      evolution: [
        {
          phase: 'Prototype: a local multi-agent helper',
          when: 'March 2026',
          points: [
            'An orchestrator in the IDE dispatching specialist agents for AWS, Datadog, Buildkite and GitHub over MCP.',
            'A structured investigation loop: recall similar past incidents, triage, form 3 to 5 hypotheses, fan out one hypothesis per agent, correlate, confirm, diagnose, then record what was learned.',
            'Used on real production investigations, which proved the pattern but kept the value on one machine.',
          ],
        },
        {
          phase: 'Production: hosted on Amazon Bedrock AgentCore',
          when: 'September 2026',
          points: [
            'Agents run on AgentCore Runtime, with tools exposed through AgentCore Gateway and AgentCore Memory and Identity services.',
            'Alfred orchestrates AWS DevOps Agent as its AWS specialist, alongside agents for Datadog, Dynatrace, Buildkite and GitHub.',
            'Reachable where engineers already work: Slack and Teams, the IDE, pull requests, and automatically from alerts.',
            'A dependency graph adds blast-radius comments to pull requests.',
          ],
        },
      ],
      contributions: [
        'Designed and built the original multi-agent prototype: orchestrator, specialist agents, MCP integrations and the knowledge-base loop.',
        'Productionised it on Amazon Bedrock AgentCore, with Alfred orchestrating AWS DevOps Agent.',
        'Built the dependency graph behind pull-request blast-radius comments.',
      ],
      tradeoffs: [
        'MCP over CLI tools: one setup and read-only enforcement on the server side, instead of installing and authenticating four CLIs and trusting the prompt. Responses are structured, which also keeps agent context small.',
        'Graph, not model, for blast radius: a deterministic dependency graph decides what a change reaches, so results are citable and cheap. The model only maps a diff onto the graph, ranks risk and explains it.',
        'Declared blind spots over confident answers: every report states what it could not see. That reads as less certain, but a tool that misses something while sounding sure teaches people to stop checking.',
      ],
      confidentiality: 'The production code is internal to the client. This page describes public AWS services and design principles only; no client data, systems or incidents are shown.',
    },
    title: 'Alfred: a multi-agent AI SRE',
    context: 'Latitude Financial Services (client, via Viable Solutions and Synechron)',
    status: 'Shipped',
    headline: 'Live in production on Amazon Bedrock AgentCore, orchestrating AWS DevOps Agent',
    overview:
      'A multi-agent incident investigator that works across AWS, Datadog, Dynatrace, Buildkite and GitHub in parallel and correlates the findings into one timeline and root cause. It started as a local helper; I took it to production on Amazon Bedrock AgentCore.',
    problem:
      'Diagnosing an incident meant stitching together several platforms by hand while it was still burning. That skill sat with a few engineers, and what they worked out was rarely written down, so the same failures were solved again later.',
    architecture: {
      caption: 'High-level flow. Client-specific details intentionally omitted.',
      steps: [
        { label: 'Entry points', detail: 'Slack/Teams, alerts, IDE, pull requests' },
        { label: 'Orchestrator', detail: 'Amazon Bedrock AgentCore' },
        { label: 'Specialists in parallel', detail: 'AWS DevOps Agent, Datadog, Dynatrace, Buildkite, GitHub' },
        { label: 'Answer', detail: 'Timeline, root cause, blast radius' },
      ],
    },
    decisions: [
      'An orchestrator with one specialist agent per platform, run in parallel, one hypothesis per dispatch.',
      'AWS DevOps Agent as the AWS specialist, orchestrated alongside Alfred’s own agents.',
      'Inference through Amazon Bedrock inside the company AWS account.',
    ],
    implementation: [
      'Orchestrator and specialist agents on AgentCore Runtime; tools through AgentCore Gateway.',
      'Integrations with AWS (via AWS DevOps Agent), Datadog, Dynatrace, Buildkite and GitHub.',
      'Dependency graph for pull-request blast radius.',
    ],
    reliability: [
      'Read-only, enforced in three layers: agent instructions, connector and gateway configuration, and IAM.',
      'Inference stays inside the company AWS account.',
      'Every investigation enriches a reviewed knowledge base, so fixes are not rediscovered.',
    ],
    outcomes: [
      'Live in production since September 2026.',
      'Used from Slack and Teams, the IDE, pull requests, and automatically from alerts.',
      'Blast-radius comments on pull requests from the dependency graph.',
    ],
    // TODO: measured outcomes (e.g. time to diagnosis, investigations per month) when available.
    stack: ['Amazon Bedrock AgentCore', 'AWS DevOps Agent', 'MCP', 'Datadog', 'Dynatrace', 'Buildkite', 'GitHub'],
    branch: 'ai',
  },
  {
    id: 'netflix-game-launch',
    feature: {
      role: 'SRE lead',
      facts: [
        { label: 'Game', value: 'Up to six players impersonate each other with AI face and voice swapping' },
        { label: 'Launch', value: '50k+ concurrent users in the first 10 minutes' },
        { label: 'Platform', value: 'Kubernetes with GPU workloads, monitored in Grafana (NVIDIA DCGM)' },
      ],
      media: {
        file: 'netflix-its-whats-inside.png',
        alt: 'A node-based AI workflow that animates a source portrait to follow the expressions of a driving video, with the movement input and the generated output side by side.',
        credit: 'AKQA',
        href: 'https://www.akqa.com/work/netflix/its-whats-inside-the-game/',
        caption: 'From AKQA\'s write-up: a face (right) animated to follow a movement input (left).',
      },
      publicLink: { label: 'See the project on AKQA.com', href: 'https://www.akqa.com/work/netflix/its-whats-inside-the-game/' },
      diagram: {
        caption: 'Simplified platform view.',
        columns: [
          { title: 'Traffic', nodes: [{ label: 'Players', detail: 'Launch-day demand' }] },
          { title: 'Platform', nodes: [{ label: 'Kubernetes clusters', detail: 'Designed for launch scale' }, { label: 'GPU workloads', detail: 'AI face transformation' }] },
          { title: 'Observe', nodes: [{ label: 'NVIDIA DCGM', detail: 'GPU metrics' }, { label: 'Grafana', detail: 'Dashboards' }] },
        ],
      },
      contributions: [
        'Led SRE for the launch.',
        'Designed the Kubernetes clusters that scaled to 50k+ concurrent users in the first 10 minutes.',
        'Included Grafana monitoring of NVIDIA DCGM GPU metrics.',
      ],
      // TODO: trade-offs (scaling approach, capacity planning, cost vs headroom) — needs first-hand detail.
      confidentiality: 'Infrastructure is described at a high level; capacity figures beyond the public launch number are omitted.',
    },
    title: "It's What's Inside: The Game",
    context: 'AKQA · for Netflix',
    status: 'Shipped',
    headline: '50k+ concurrent users in the first 10 minutes',
    overview:
      "A Netflix game where up to six players impersonate each other using AI face and voice swapping. I led SRE for its launch, including the Kubernetes platform it ran on.",
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
    decisions: [
      'Kubernetes as the platform for the GPU-backed game workloads.',
      'GPU health tracked through NVIDIA DCGM metrics in Grafana.',
    ],
    reliability: ['GPU metrics (NVIDIA DCGM) monitored in Grafana.'],
    outcomes: ['Clusters scaled to 50k+ concurrent users in the first 10 minutes of launch.'],
    // TODO: decisions/trade-offs and lessons learned not on the resume.
    stack: ['Kubernetes', 'GPU', 'Grafana', 'NVIDIA DCGM'],
    branch: 'netflix',
  },
  {
    id: 'observability-migrations',
    feature: {
      role: 'Migrated at Cvent and at Latitude',
      facts: [
        { label: 'Cvent', value: '~880M log events per week, Splunk to Datadog (completed)' },
        { label: 'Latitude', value: '20M+ log events per week, Sumo Logic to Datadog (completed)' },
        { label: 'Standards', value: 'SLI/SLO and instrumentation standards for Java microservices' },
        { label: 'Also', value: "Moved a newly acquired company to Datadog (10+ dashboards)" },
      ],
      diagram: {
        caption: 'Generalised before-and-after for both migrations.',
        columns: [
          { title: 'Sources', nodes: [{ label: 'Microservices', detail: 'Java services and more' }, { label: 'Business systems', detail: 'Including payment logs' }] },
          { title: 'Before', nodes: [{ label: 'Splunk', detail: 'Cvent' }, { label: 'Sumo Logic', detail: 'Latitude' }] },
          { title: 'Ingest', nodes: [{ label: 'Datadog log pipelines', detail: 'Grok parsing' }] },
          { title: 'Operate', nodes: [{ label: 'Logs, metrics, traces', detail: 'One platform' }, { label: 'Monitors and dashboards', detail: 'SLIs/SLOs' }] },
        ],
      },
      contributions: [
        'Cvent: migrated ~880M log events per week from Splunk to Datadog.',
        'Cvent: owned SLI/SLO and custom instrumentation standards for Java microservices.',
        "Cvent: led a newly acquired company's move to Datadog (10+ dashboards).",
        'Latitude: migrated 20M+ log events per week from Sumo Logic to Datadog, including Grok parsing pipelines and detection monitors.',
      ],
      // TODO: trade-offs (cutover strategy, dual-running, cost, retention) — needs first-hand detail.
      confidentiality: 'Pipelines and monitors are described by purpose only; log content and client system names are omitted.',
    },
    title: 'Large-scale observability migrations',
    context: 'Cvent (Splunk to Datadog) · Latitude (Sumo Logic to Datadog)',
    status: 'Shipped',
    headline: '~880M and 20M+ log events per week moved to Datadog',
    overview:
      'Two log platform migrations to Datadog, both completed: one at Cvent, and one at Latitude Financial Services (client, via Viable Solutions and Synechron).',
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
      'Latitude: migrated 20M+ log events per week from Sumo Logic to Datadog, with Grok parsing pipelines for payment logs.',
    ],
    decisions: [
      'One platform for logs, metrics and traces instead of separate tools.',
      'Parse at ingest with Grok pipelines, so payment logs arrive as structured fields.',
      'Standards alongside the move: SLI/SLO and instrumentation standards for Java microservices (Cvent).',
    ],
    reliability: ['Detection monitors for anomalies in payment transaction flows (Latitude).'],
    outcomes: [
      'Cvent: logs, metrics and traces on one platform.',
      'Latitude: migration complete; 20M+ log events per week now on Datadog.',
    ],
    // TODO: measured effect at Latitude (e.g. MTTR before/after) when available.
    // TODO: decisions/trade-offs (cutover strategy, cost) and lessons learned not on the resume.
    stack: ['Datadog', 'Splunk', 'Sumo Logic', 'Grok parsing', 'SLIs/SLOs'],
    branch: 'cvent',
  },
  {
    id: 'claude-bedrock-proxy',
    title: 'Claude for developers via a Bedrock proxy',
    context: 'Latitude Financial Services (client, via Viable Solutions and Synechron)',
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
