/**
 * Profile, skills and resume content (README card, Skills section, /resume).
 * Source of truth: Naman's resume. No phone number anywhere on the site.
 */

export const profile = {
  name: 'Naman Kumar',
  role: 'Lead Site Reliability Engineer',
  location: 'Melbourne, VIC',
  email: 'naman.kumar2397@gmail.com',
  linkedin: 'https://www.linkedin.com/in/-namankumar/',
  linkedinLabel: 'linkedin.com/in/-namankumar',
  summary:
    'Lead Site Reliability Engineer with 7+ years of hands-on experience designing, scaling and automating large-scale distributed systems on AWS. Currently leading a team of 10 engineers supporting 80+ AWS accounts for a major financial services client. Proven track record in cutting incident response times, consolidating observability platforms, and moving ClickOps estates to Infrastructure as Code. Now focused on AI-driven operations, including LLM-powered incident tooling and secure enterprise adoption of Claude on AWS Bedrock.',
  headline: 'Engineering reliable, scalable and observable systems at production scale.',
  /** Hero copy: kept short; every claim is on the resume. */
  pitch:
    'I lead reliability engineering for large AWS estates: production operations, observability, infrastructure automation and the teams that run them. Lately that includes practical AI tooling for incident response on AWS Bedrock.',
  current: { role: 'Lead SRE', employer: 'Viable Solutions', client: 'Latitude Financial Services' },
  metrics: [
    { value: '7+', label: 'years in production engineering', context: 'Cloud automation and SRE since Jan 2019, across product, agency and consulting roles.' },
    { value: '80+', label: 'AWS accounts supported', context: 'Infrastructure support for a financial services client, delivered by the 10-engineer team I lead.' },
    { value: '~880M', label: 'log events per week migrated', context: 'Splunk to Datadog at Cvent, unifying logs, metrics and traces on one platform.' },
    { value: '50k+', label: 'concurrent users at launch', context: 'In the first 10 minutes of a Netflix game launch at AKQA, on Kubernetes clusters I designed.' },
  ],
};

/**
 * Core capabilities, in priority order. Each must be backed by the experience above.
 * The complete tool list is `resumeSkills` (shown compactly, and used by the PDF).
 */
export const capabilities: { group: string; evidence: string; key: string[] }[] = [
  { group: 'Site Reliability Engineering', evidence: 'SLI/SLO standards, zero-downtime rollouts, Sev1 automation that cut response time by 20+ minutes', key: ['SLIs/SLOs', 'Incident response', 'High availability', 'PagerDuty'] },
  { group: 'Observability', evidence: 'Two large log migrations to Datadog (~880M and 20M+ events per week); GPU monitoring for a launch', key: ['Datadog', 'Dynatrace', 'Grafana', 'Splunk'] },
  { group: 'Cloud Architecture on AWS', evidence: '80+ AWS accounts supported; 70+ ECS clusters; Rackspace to AWS migration', key: ['ECS / Fargate', 'Lambda', 'IAM', 'Kubernetes'] },
  { group: 'Infrastructure as Code and Platform', evidence: 'ClickOps to IaC, CloudFormation to Terraform, Octopus Deploy HA at 99.9%', key: ['Terraform', 'AWS CDK', 'CloudFormation', 'CI/CD'] },
  { group: 'Technical Leadership', evidence: 'Leads 10 engineers with a follow-the-sun 24x7 model; mentored 4 engineers', key: ['Team leadership', 'Support models', 'Change management', 'Mentoring'] },
  { group: 'AI-assisted Operations', evidence: 'AI incident assistant and a governed Claude proxy on AWS Bedrock', key: ['AWS Bedrock', 'Claude', 'MCP', 'Guardrails'] },
];

/** Full technology inventory, as on the resume. Used by the Skills inventory and the PDF. */
export const resumeSkills: { group: string; items: string[] }[] = [
  { group: 'Cloud and Containers', items: ['AWS (ECS, Fargate, EC2, Lambda, S3, DMS, DynamoDB, IAM, KMS, Transit Gateway, Bedrock)', 'Kubernetes', 'Docker'] },
  { group: 'Infrastructure as Code', items: ['Terraform', 'AWS CDK', 'CloudFormation'] },
  { group: 'CI/CD', items: ['Buildkite', 'GitLab', 'Jenkins', 'Harness', 'Octopus Deploy'] },
  { group: 'Observability', items: ['Datadog', 'Dynatrace', 'Grafana', 'Sumo Logic', 'Splunk', 'New Relic', 'CloudWatch'] },
  { group: 'AI and Automation', items: ['AWS Bedrock', 'Claude', 'MCP servers', 'Python automation'] },
  { group: 'Security and Patching', items: ['CrowdStrike Falcon', 'Ivanti Security Controls', 'CIS-hardened AMIs', 'Least-privilege IAM'] },
  { group: 'Incident and Service Management', items: ['PagerDuty', 'OpsGenie', 'ServiceNow', 'Jira'] },
  { group: 'Configuration Management', items: ['Chef', 'Ansible'] },
  { group: 'Languages', items: ['Python', 'TypeScript', 'Groovy', 'Shell', 'PowerShell'] },
  { group: 'Version Control', items: ['GitHub', 'Bitbucket'] },
];

export interface Point {
  label: string | null;
  text: string;
  /** Shown in the concise experience view; the rest sit behind "More detail". */
  top?: boolean;
}

export interface Role {
  title: string;
  /** Matching branch id in src/data/journey.ts (for colour and linking). */
  branch: string;
  /** Employer exactly as on the resume. */
  employer: string;
  /** Intermediary for the engagement, if any. */
  via?: string;
  /** Client the work was delivered for, if any. */
  client?: string;
  terms?: string;
  period: string;
  /** One-line summary for the career overview. */
  headline: string;
  /** Short scope facts, taken from the bullets below. */
  scope: string[];
  stack: string[];
  points: Point[];
}

export const experience: Role[] = [
  {
    title: 'Lead Site Reliability Engineer',
    branch: 'latitude',
    employer: 'Viable Solutions',
    via: 'Synechron',
    client: 'Latitude Financial Services',
    terms: 'Permanent',
    period: 'Aug 2025 – Present',
    headline: 'Leads a 10-engineer team supporting 80+ AWS accounts, 24x7',
    scope: ['Leads a team of 10 engineers', '80+ AWS accounts', '24x7 follow-the-sun support'],
    stack: ['AWS', 'ECS Fargate', 'Datadog', 'Dynatrace', 'ServiceNow', 'CrowdStrike', 'Terraform', 'Bedrock'],
    points: [
      { label: 'Team leadership', text: 'Lead a team of 10 offshore engineers in India, bridging client expectations and offshore delivery for infrastructure support across 80+ AWS accounts.', top: true },
      { label: 'Support model', text: 'Streamlined intake for all additional workloads through ServiceNow and set up a follow-the-sun model for 24x7 support.', top: true },
      { label: 'AI incident assistant', text: 'Built a conversational AI on AWS Bedrock (Claude) connected to ServiceNow, Dynatrace and Datadog MCP servers, surfacing business-impact traces and mitigation hints for faster resolution.' },
      { label: 'Claude for developers', text: 'Building an OpenAI-compatible Lambda proxy over Bedrock so GitHub Copilot (BYOK) can use Claude models, with a mandatory server-side guardrail and per-developer keys for cost attribution.' },
      { label: 'ECS upgrade automation', text: 'Automated ECS cluster upgrades across all environments with zero manual intervention, moving clusters to CIS-hardened Amazon Linux 2023 AMIs.', top: true },
      { label: 'Patch automation', text: 'Removed ClickOps from monthly patching by introducing Ivanti Security Controls; designed the networking and architecture the team built on.' },
      { label: 'Observability consolidation', text: 'Migrating 20M+ log events per week from Sumo Logic to Datadog, including Grok parsing pipelines for payment logs and transaction-orphan detection monitors, for single-pane dashboards and lower MTTR.', top: true },
      { label: 'Security', text: 'Rolled out CrowdStrike Falcon sensor injection for ECS Fargate workloads using the init-container model.', top: true },
      { label: 'High availability', text: 'Designed a 2-node active/passive Windows Failover Cluster on shared EBS io2 Multi-Attach to replace single-server Control-M staging hosts across Test, Pre-Prod and Prod.' },
      { label: 'IaC adoption', text: 'Moving AWS accounts inherited from a previous vendor from ClickOps to CloudFormation and Terraform.' },
    ],
  },
  {
    title: 'DevOps Lead Consultant',
    branch: 'cit',
    employer: 'CI&T',
    client: 'iSelect / CompareTheMarket',
    terms: 'Contract',
    headline: 'CloudFormation to Terraform through the iSelect / CompareTheMarket merger',
    scope: ['Multiple AWS accounts', 'Merger consolidation'],
    stack: ['Terraform', 'Databricks', 'AWS DMS', 'AWS Transfer Family', 'Python'],
    period: 'May 2025 – Jun 2025',
    points: [
      { label: 'Merger', text: 'Consolidated technology assets during the merger of iSelect and CompareTheMarket.', top: true },
      { label: 'IaC migration', text: 'Led the move from CloudFormation to Terraform across multiple AWS accounts with shared modules and state management.', top: true },
      { label: 'Data platform', text: 'Integrated ingestion pipelines from Salesforce, Meta, Google Ads and third-party SFTP APIs into a unified Delta Lakehouse on Databricks, using Python, Lambda, DMS and AWS Transfer Family.', top: true },
    ],
  },
  {
    title: 'Lead Site Reliability Engineer',
    branch: 'akqa',
    employer: 'AKQA',
    period: 'Sep 2024 – Apr 2025',
    headline: 'SRE lead for a Netflix game launch: 50k+ concurrent users in 10 minutes',
    scope: ['SRE lead for a Netflix game launch', 'All client infrastructures'],
    stack: ['Kubernetes', 'Grafana', 'NVIDIA DCGM', 'Python', 'AWS Lambda', 'OpsGenie'],
    points: [
      { label: 'Netflix game launch', text: 'Led SRE for an AI-driven face-transforming game, designing Kubernetes clusters that scaled to 50k+ concurrent users in the first 10 minutes of launch, with Grafana monitoring of NVIDIA DCGM GPU metrics.', top: true },
      { label: 'Observability revamp', text: 'Reviewed and upgraded monitoring, logging and alerting across all client infrastructures.', top: true },
      { label: 'Incident automation', text: 'Built an incident management workflow in Python and AWS Lambda integrating OpsGenie, Slack, Teams and Jira, reducing manual overhead and response times.', top: true },
      { label: 'Change management', text: 'Defined Change Request standards and automated approvals to reduce deployment risk.', top: true },
    ],
  },
  {
    title: 'Senior Site Reliability Engineer',
    branch: 'cvent',
    employer: 'Cvent',
    period: 'Oct 2019 – Sep 2024',
    headline: 'Co-developed Sev1 automation (20+ min faster response); ~880M logs/week to Datadog',
    scope: ['70+ ECS clusters', '500+ Chef-managed servers', 'Mentored 4 engineers'],
    stack: ['Datadog', 'Splunk', 'AWS ECS', 'AWS CDK', 'Octopus Deploy', 'PagerDuty', 'Chef'],
    points: [
      { label: 'Incident automation', text: 'Co-developed Sev1 incident response automation (Datadog and Slack triggers orchestrating Jira, Slack, Zoom and PagerDuty), cutting time-to-respond by 20+ minutes.', top: true },
      { label: 'Log migration', text: 'Migrated ~880M log events per week from Splunk to Datadog, unifying logs, metrics and traces on one platform.', top: true },
      { label: 'Observability ownership', text: "Owned SLI/SLO and custom instrumentation standards for Java microservices; led a newly acquired company's move to Datadog (10+ dashboards)." },
      { label: 'Platform scale', text: 'Rolled out ECS Capacity Providers across 70+ clusters with zero downtime.', top: true },
      { label: 'Octopus Deploy', text: 'Built a high-availability model sustaining 99.9% availability and cut self-hosting costs by 30%.', top: true },
      { label: 'Cloud migration', text: 'Contributed to migrating a Rackspace-hosted product (17 Java microservices, 26 .NET projects, 8 websites) to AWS, and standardised build pipelines for 134 .NET projects onto one pipeline.', top: true },
      { label: 'IaC', text: 'Early adopter of AWS CDK, consolidating CloudFormation and Terraform stacks into a single CDK stack for multiple applications.' },
      { label: 'Security', text: 'Moved all microservices to non-root, least-privilege containers.' },
      { label: 'Developer productivity', text: 'Embedded with sprint teams to remove bottlenecks, including fixing flaky JUnit/Jest tests that were wasting PR build hours; ran Fargate and Harness POCs.' },
      { label: 'Configuration management', text: 'Re-engineered Chef for 500+ monthly active servers.' },
      { label: 'Mentoring', text: 'Onboarded and mentored 4 new engineers.' },
    ],
  },
  {
    title: 'Cloud Automation Associate',
    branch: 'infraguard',
    employer: 'Infraguard',
    period: 'Jan 2019 – Oct 2019',
    headline: 'Lambda automation and private-subnet patching across multi-cloud VMs',
    scope: ['AWS, GCP, Azure and Alibaba Cloud'],
    stack: ['AWS Lambda', 'VPC', 'Multi-cloud'],
    points: [
      { label: null, top: true, text: 'Wrote Lambda automations for scheduled start/stop, package updates and SSH key rotation.' },
      { label: null, top: true, text: 'Designed a NAT Gateway pattern to patch sensitive private-subnet servers without exposing them to the internet.' },
      { label: null, top: true, text: 'Built the knowledge base for multi-cloud VM management across AWS, GCP, Azure and Alibaba Cloud.' },
    ],
  },
];

export const projects = [
  {
    name: 'neuron-graph',
    text: 'Self-hosted AWS infrastructure knowledge graph that scans multiple accounts, with a web UI, REST API, CLI and MCP server. Built with rustworkx and sigma.js, per-account subgraphs, and a scoped IAM policy in place of ReadOnlyAccess.',
  },
];

export const accolades = [
  'Q1 Quarterly Award: Ownership, Innovation, Customer Success (2023)',
  'Q3 Quarterly Award: Harness POC, monitoring-embedded deployment pipelines (2021)',
  'Cvent Hero: Agility (2020)',
  '12 Spot Awards and 7 Pat on Back Awards (2019 – 2024)',
];

export const education = 'Bachelor of Technology, Manipal University Jaipur (2015 – 2019)';
export const certification = 'AWS Certified Solutions Architect – Associate (R2XYHRM1JE1E1TKJ), 2019';
