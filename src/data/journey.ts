/**
 * The whole career journey as a git history.
 *
 * Source of truth: Naman's resume. Do not invent dates, metrics or achievements.
 * A blank `date` means the resume does not state one; each is marked TODO.
 *
 * Lanes and branch/merge spans are computed from this data in src/lib/layout.ts.
 * `lane` on a branch is an optional override; leave it out to auto-assign.
 */

/** Colour tokens; light/dark values live in src/styles/tokens.css (--c-<name>). */
export type BranchColour =
  | 'gray' | 'yellow' | 'pink' | 'green' | 'purple'
  | 'coral' | 'red' | 'blue' | 'teal' | 'orange';

export type BranchType = 'trunk' | 'education' | 'role' | 'project';

export interface Branch {
  /** Ref name shown in pills, e.g. `work/cvent`. */
  name: string;
  type: BranchType;
  /** Short label for filters, e.g. "Cvent". */
  label: string;
  /** Branch this one forks from and merges back into. Only `main` has none. */
  parent?: string;
  colour: BranchColour;
  lane?: number;
  title?: string;
  org?: string;
  period?: string;
  highlights?: string[];
  stack?: string[];
}

export type CommitKind = 'branch' | 'commit' | 'merge';

export interface Commit {
  /** Branch the commit lives on. For a merge, the branch merged *into*. */
  branch: string;
  kind: CommitKind;
  /** For merges: the branch being merged. */
  source?: string;
  message: string;
  /** Free text as written on the resume (e.g. "Oct 2019"). Blank = unknown. */
  date: string;
  /** Long description for the git-show view. Falls back to `message`. */
  body?: string;
  /** Awards and certifications get their own marker and filter. */
  tag?: 'award' | 'cert';
  /** Plain commits shown in the curated "Highlights" view. Branches and merges always show. */
  milestone?: boolean;
}

export const author = {
  name: 'Naman Kumar',
  email: 'naman.kumar2397@gmail.com',
};

export const branches = {
  main: { name: 'main', type: 'trunk', label: 'main', colour: 'gray' },

  edu: {
    name: 'edu/btech-manipal',
    type: 'education',
    label: 'Education',
    parent: 'main',
    colour: 'yellow',
    title: 'Bachelor of Technology',
    org: 'Manipal University Jaipur',
    period: '2015 – 2019',
    highlights: [
      'Bachelor of Technology, Manipal University Jaipur',
      'AWS Certified Solutions Architect – Associate (2019)',
    ],
    stack: ['education', 'aws-certified'],
  },

  infraguard: {
    name: 'work/infraguard',
    type: 'role',
    label: 'Infraguard',
    parent: 'main',
    colour: 'pink',
    title: 'Cloud Automation Associate',
    org: 'Infraguard',
    period: 'Jan 2019 – Oct 2019',
    highlights: [
      'Lambda automations for scheduled start/stop, package updates and SSH key rotation',
      'NAT Gateway pattern to patch sensitive private-subnet servers without exposing them to the internet',
      'Knowledge base for multi-cloud VM management across AWS, GCP, Azure and Alibaba Cloud',
    ],
    stack: ['aws-lambda', 'vpc', 'multi-cloud'],
  },

  cvent: {
    name: 'work/cvent',
    type: 'role',
    label: 'Cvent',
    parent: 'main',
    colour: 'green',
    title: 'Senior Site Reliability Engineer',
    org: 'Cvent',
    period: 'Oct 2019 – Sep 2024',
    highlights: [
      'Co-developed Sev1 incident response automation, cutting time-to-respond by 20+ minutes',
      'Migrated ~880M log events per week from Splunk to Datadog',
      'Owned SLI/SLO and custom instrumentation standards for Java microservices',
      'Rolled out ECS Capacity Providers across 70+ clusters with zero downtime',
      'Octopus Deploy high-availability model at 99.9% availability, 30% lower self-hosting cost',
      'Contributed to a Rackspace to AWS migration: 17 Java microservices, 26 .NET projects, 8 websites',
      'Early AWS CDK adopter; moved all microservices to non-root, least-privilege containers',
      'Re-engineered Chef for 500+ monthly active servers',
      'Onboarded and mentored 4 new engineers',
      '12 Spot Awards and 7 Pat on Back Awards (2019 – 2024)',
    ],
    stack: ['datadog', 'aws-ecs', 'aws-cdk', 'octopus-deploy', 'pagerduty', 'chef', 'splunk'],
  },

  akqa: {
    name: 'work/akqa',
    type: 'role',
    label: 'AKQA',
    parent: 'main',
    colour: 'purple',
    title: 'Lead Site Reliability Engineer',
    org: 'AKQA',
    period: 'Sep 2024 – Apr 2025',
    highlights: [
      'Led SRE for a Netflix game launch',
      'Reviewed and upgraded monitoring, logging and alerting across all client infrastructures',
      'Incident management workflow in Python and AWS Lambda integrating OpsGenie, Slack, Teams and Jira',
      'Defined Change Request standards and automated approvals',
    ],
    stack: ['kubernetes', 'grafana', 'python', 'aws-lambda', 'opsgenie'],
  },

  netflix: {
    name: 'project/netflix-game-launch',
    type: 'project',
    label: 'Netflix launch',
    parent: 'akqa',
    colour: 'coral',
    title: 'Netflix Game Launch',
    org: 'AKQA',
    // TODO: project dates not on the resume (falls within Sep 2024 – Apr 2025).
    period: '',
    highlights: [
      'SRE lead for an AI-driven face-transforming game',
      'Kubernetes clusters that scaled to 50k+ concurrent users in the first 10 minutes of launch',
      'Grafana monitoring of NVIDIA DCGM GPU metrics',
    ],
    stack: ['kubernetes', 'gpu', 'grafana', 'nvidia-dcgm'],
  },

  cit: {
    name: 'work/ci-and-t',
    type: 'role',
    label: 'CI&T',
    parent: 'main',
    colour: 'red',
    title: 'DevOps Lead Consultant',
    org: 'CI&T, for iSelect / CompareTheMarket',
    period: 'May 2025 – Jun 2025',
    highlights: [
      'Consolidated technology assets during the iSelect and CompareTheMarket merger',
      'Led the move from CloudFormation to Terraform across multiple AWS accounts',
      'Unified Delta Lakehouse on Databricks from Salesforce, Meta, Google Ads and SFTP sources',
    ],
    stack: ['terraform', 'databricks', 'aws-dms', 'aws-transfer-family', 'python'],
  },

  latitude: {
    name: 'work/latitude',
    type: 'role',
    label: 'Latitude',
    parent: 'main',
    colour: 'blue',
    title: 'Lead Site Reliability Engineer',
    org: 'Viable Solutions (via Synechron), for Latitude Financial Services',
    period: 'Aug 2025 – Present',
    highlights: [
      'Lead a team of 10 offshore engineers supporting 80+ AWS accounts',
      'ServiceNow intake for all additional workloads and a follow-the-sun 24x7 support model',
      'Zero-touch ECS cluster upgrades to CIS-hardened Amazon Linux 2023 AMIs',
      'Removed ClickOps from monthly patching with Ivanti Security Controls',
      'Migrating 20M+ log events per week from Sumo Logic to Datadog',
      'CrowdStrike Falcon sensor injection for ECS Fargate',
      'Active/passive Windows Failover Cluster for Control-M staging hosts',
      'Moving inherited AWS accounts from ClickOps to CloudFormation and Terraform',
    ],
    stack: ['aws', 'aws-ecs', 'datadog', 'servicenow', 'crowdstrike', 'terraform'],
  },

  ai: {
    name: 'project/ai-incident-assistant',
    type: 'project',
    label: 'AI assistant',
    parent: 'latitude',
    colour: 'teal',
    title: 'AI Incident Management Assistant',
    org: 'Latitude Financial Services',
    // TODO: project dates not on the resume.
    period: '',
    highlights: [
      'Conversational AI on AWS Bedrock powered by Claude',
      'Connected to ServiceNow, Dynatrace and Datadog MCP servers',
      'Surfaces business-impact traces and mitigation hints for faster resolution',
    ],
    stack: ['aws-bedrock', 'claude', 'mcp', 'servicenow', 'dynatrace', 'datadog'],
  },

  bedrock: {
    name: 'project/claude-bedrock-proxy',
    type: 'project',
    label: 'Bedrock proxy',
    parent: 'latitude',
    colour: 'orange',
    title: 'Claude for Developers',
    org: 'Latitude Financial Services',
    // TODO: start date not on the resume.
    period: '',
    highlights: [
      'OpenAI-compatible Lambda proxy over Bedrock so GitHub Copilot (BYOK) can use Claude models',
      'Mandatory server-side guardrail',
      'Per-developer keys for cost attribution',
    ],
    stack: ['aws-bedrock', 'aws-lambda', 'claude', 'guardrails'],
  },
} satisfies Record<string, Branch>;

export type BranchId = keyof typeof branches;

/**
 * Oldest first. Order within a branch follows the resume where it is explicit;
 * where the resume gives no dates the order is approximate (see TODOs).
 */
export const commits: (Commit & { branch: BranchId; source?: BranchId })[] = [
  { branch: 'main', kind: 'commit', message: 'init: hello, world', date: '2015', milestone: true },

  { branch: 'edu', kind: 'branch', message: 'Started B.Tech at Manipal University Jaipur', date: '2015' },

  { branch: 'infraguard', kind: 'branch', message: 'Joined Infraguard as Cloud Automation Associate', date: 'Jan 2019' },
  {
    branch: 'infraguard', kind: 'commit', date: '2019',
    message: 'feat: Lambda automations for start/stop, patching and key rotation',
    body: 'Wrote Lambda automations for scheduled start/stop, package updates and SSH key rotation.',
  },
  {
    branch: 'infraguard', kind: 'commit', date: '2019',
    message: 'feat: NAT Gateway pattern for patching private-subnet servers',
    body: 'Designed a NAT Gateway pattern to patch sensitive private-subnet servers without exposing them to the internet.',
  },
  {
    branch: 'edu', kind: 'commit', date: '2019',
    message: 'feat: AWS Certified Solutions Architect – Associate', tag: 'cert',
  },
  { branch: 'main', kind: 'merge', source: 'edu', message: "Merge branch 'edu/btech-manipal'", date: '2019' },

  { branch: 'cvent', kind: 'branch', message: 'Joined Cvent as Senior Site Reliability Engineer', date: 'Oct 2019' },
  { branch: 'main', kind: 'merge', source: 'infraguard', message: "Merge branch 'work/infraguard'", date: 'Oct 2019' },

  // TODO: Cvent work commits are undated on the resume; only the awards carry years.
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'feat: Rackspace to AWS migration, 17 Java + 26 .NET projects',
    body: 'Contributed to migrating a Rackspace-hosted product (17 Java microservices, 26 .NET projects, 8 websites) to AWS, and standardised build pipelines for 134 .NET projects onto one pipeline.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '2020',
    message: 'award: Cvent Hero (Agility)', tag: 'award',
  },
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'feat: adopt AWS CDK, consolidate CloudFormation and Terraform stacks',
    body: 'Early adopter of AWS CDK, consolidating CloudFormation and Terraform stacks into a single CDK stack for multiple applications.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '2021',
    message: 'award: Q3 Quarterly Award for the Harness POC', tag: 'award',
    body: 'Q3 Quarterly Award: Harness POC, monitoring-embedded deployment pipelines.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'perf: Octopus Deploy HA at 99.9%, 30% lower hosting cost',
    body: 'Built a high-availability model for Octopus Deploy sustaining 99.9% availability and cut self-hosting costs by 30%.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'feat: ECS Capacity Providers on 70+ clusters, zero downtime',
    body: 'Rolled out ECS Capacity Providers across 70+ clusters with zero downtime.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '2023',
    message: 'award: Q1 Quarterly Award (Ownership, Innovation, Customer Success)', tag: 'award',
  },
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'feat: ~880M log events/week from Splunk to Datadog', milestone: true,
    body: 'Migrated ~880M log events per week from Splunk to Datadog, unifying logs, metrics and traces on one platform.',
  },
  {
    branch: 'cvent', kind: 'commit', date: '',
    message: 'feat: Sev1 incident automation, 20+ min faster response', milestone: true,
    body: 'Co-developed Sev1 incident response automation (Datadog and Slack triggers orchestrating Jira, Slack, Zoom and PagerDuty), cutting time-to-respond by 20+ minutes.',
  },
  { branch: 'main', kind: 'merge', source: 'cvent', message: "Merge branch 'work/cvent'", date: 'Sep 2024' },

  { branch: 'akqa', kind: 'branch', message: 'Joined AKQA as Lead Site Reliability Engineer', date: 'Sep 2024' },
  // TODO: Netflix project dates not on the resume.
  { branch: 'netflix', kind: 'branch', message: 'Kubernetes platform for an AI face-transforming game', date: '' },
  {
    branch: 'netflix', kind: 'commit', date: '',
    message: 'feat: GPU observability with Grafana and NVIDIA DCGM',
    body: 'Grafana monitoring of NVIDIA DCGM GPU metrics for the game clusters.',
  },
  {
    branch: 'akqa', kind: 'merge', source: 'netflix', date: '',
    message: 'Merge: launch held 50k+ concurrent users in the first 10 minutes',
    body: "Merge branch 'project/netflix-game-launch' into work/akqa\n\nKubernetes clusters scaled to 50k+ concurrent users in the first 10 minutes of launch.",
  },
  // TODO: AKQA commits are undated on the resume.
  {
    branch: 'akqa', kind: 'commit', date: '',
    message: 'feat: observability revamp across client infrastructures',
    body: 'Reviewed and upgraded monitoring, logging and alerting across all client infrastructures.',
  },
  {
    branch: 'akqa', kind: 'commit', date: '',
    message: 'feat: incident workflow in Python and Lambda',
    body: 'Built an incident management workflow in Python and AWS Lambda integrating OpsGenie, Slack, Teams and Jira, reducing manual overhead and response times.',
  },
  {
    branch: 'akqa', kind: 'commit', date: '',
    message: 'chore: Change Request standards and automated approvals',
    body: 'Defined Change Request standards and automated approvals to reduce deployment risk.',
  },
  { branch: 'main', kind: 'merge', source: 'akqa', message: "Merge branch 'work/akqa'", date: 'Apr 2025' },

  { branch: 'cit', kind: 'branch', message: 'Joined CI&T as DevOps Lead Consultant', date: 'May 2025' },
  {
    branch: 'cit', kind: 'commit', date: '2025',
    message: 'refactor: CloudFormation to Terraform across AWS accounts',
    body: 'Led the move from CloudFormation to Terraform across multiple AWS accounts with shared modules and state management, while consolidating technology assets through the iSelect and CompareTheMarket merger.',
  },
  {
    branch: 'cit', kind: 'commit', date: '2025',
    message: 'feat: Databricks Delta Lakehouse ingestion',
    body: 'Integrated ingestion pipelines from Salesforce, Meta, Google Ads and third-party SFTP APIs into a unified Delta Lakehouse on Databricks, using Python, Lambda, DMS and AWS Transfer Family.',
  },
  { branch: 'main', kind: 'merge', source: 'cit', message: "Merge branch 'work/ci-and-t'", date: 'Jun 2025' },

  { branch: 'latitude', kind: 'branch', message: 'Joined as Lead SRE for Latitude Financial Services', date: 'Aug 2025' },
  // TODO: Latitude commits below are undated on the resume; order is approximate.
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'feat: 10-engineer team, follow-the-sun 24x7 support', milestone: true,
    body: 'Lead a team of 10 offshore engineers in India across 80+ AWS accounts. Streamlined intake for all additional workloads through ServiceNow and set up a follow-the-sun model for 24x7 support.',
  },
  { branch: 'ai', kind: 'branch', message: 'AI incident assistant on Bedrock with Claude', date: '' },
  {
    branch: 'ai', kind: 'commit', date: '',
    message: 'feat: ServiceNow, Dynatrace and Datadog MCP servers',
    body: 'Connected the assistant to ServiceNow, Dynatrace and Datadog MCP servers, surfacing business-impact traces and mitigation hints for faster resolution.',
  },
  { branch: 'latitude', kind: 'merge', source: 'ai', message: "Merge branch 'project/ai-incident-assistant'", date: '' },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'feat: zero-touch ECS upgrades to CIS-hardened AL2023', milestone: true,
    body: 'Automated ECS cluster upgrades across all environments with zero manual intervention, moving clusters to CIS-hardened Amazon Linux 2023 AMIs.',
  },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'feat: patch automation with Ivanti Security Controls',
    body: 'Removed ClickOps from monthly patching by introducing Ivanti Security Controls; designed the networking and architecture the team built on.',
  },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'sec: CrowdStrike Falcon injection for ECS Fargate',
    body: 'Rolled out CrowdStrike Falcon sensor injection for ECS Fargate workloads using the init-container model.',
  },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'feat: 20M+ events/week from Sumo Logic to Datadog',
    body: 'Migrating 20M+ log events per week from Sumo Logic to Datadog, including Grok parsing pipelines for payment logs and transaction-orphan detection monitors, for single-pane dashboards and lower MTTR.',
  },
  { branch: 'bedrock', kind: 'branch', message: 'Claude for developers via a Bedrock proxy', date: '' },
  {
    branch: 'bedrock', kind: 'commit', date: '',
    message: 'feat: server-side guardrail and per-developer keys',
    body: 'Mandatory server-side guardrail, and per-developer keys for cost attribution.',
  },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'refactor: inherited AWS accounts from ClickOps to IaC',
    body: 'Moving AWS accounts inherited from a previous vendor from ClickOps to CloudFormation and Terraform.',
  },
  {
    branch: 'latitude', kind: 'commit', date: '',
    message: 'feat: active/passive failover cluster for Control-M', milestone: true,
    body: 'Designed a 2-node active/passive Windows Failover Cluster on shared EBS io2 Multi-Attach to replace single-server Control-M staging hosts across Test, Pre-Prod and Prod.',
  },
];
