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
  intro:
    '7+ years designing, scaling and automating large-scale distributed systems on AWS. I lead a team of 10 engineers supporting 80+ AWS accounts for a major financial services client, and I am now focused on AI-driven operations: LLM-powered incident tooling and secure enterprise adoption of Claude on AWS Bedrock.',
  summary:
    'Lead Site Reliability Engineer with 7+ years of hands-on experience designing, scaling and automating large-scale distributed systems on AWS. Currently leading a team of 10 engineers supporting 80+ AWS accounts for a major financial services client. Proven track record in cutting incident response times, consolidating observability platforms, and moving ClickOps estates to Infrastructure as Code. Now focused on AI-driven operations, including LLM-powered incident tooling and secure enterprise adoption of Claude on AWS Bedrock.',
  stats: [
    { value: '7+', label: 'years in SRE' },
    { value: '80+', label: 'AWS accounts supported' },
    { value: '~880M', label: 'log events/week migrated' },
    { value: '50k+', label: 'concurrent users at launch' },
  ],
  topics: [
    'aws', 'terraform', 'kubernetes', 'ecs-fargate', 'datadog',
    'bedrock', 'mcp', 'incident-management', 'observability', 'python',
  ],
};

export const skills: { group: string; items: string[] }[] = [
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

export interface Role {
  title: string;
  org: string;
  terms?: string;
  period: string;
  points: [label: string | null, text: string][];
}

export const experience: Role[] = [
  {
    title: 'Lead Site Reliability Engineer',
    org: 'Viable Solutions (via Synechron, for Latitude Financial Services)',
    terms: 'Permanent',
    period: 'Aug 2025 – Present',
    points: [
      ['Team leadership', 'Lead a team of 10 offshore engineers in India, bridging client expectations and offshore delivery for infrastructure support across 80+ AWS accounts.'],
      ['Support model', 'Streamlined intake for all additional workloads through ServiceNow and set up a follow-the-sun model for 24x7 support.'],
      ['AI incident assistant', 'Built a conversational AI on AWS Bedrock (Claude) connected to ServiceNow, Dynatrace and Datadog MCP servers, surfacing business-impact traces and mitigation hints for faster resolution.'],
      ['Claude for developers', 'Building an OpenAI-compatible Lambda proxy over Bedrock so GitHub Copilot (BYOK) can use Claude models, with a mandatory server-side guardrail and per-developer keys for cost attribution.'],
      ['ECS upgrade automation', 'Automated ECS cluster upgrades across all environments with zero manual intervention, moving clusters to CIS-hardened Amazon Linux 2023 AMIs.'],
      ['Patch automation', 'Removed ClickOps from monthly patching by introducing Ivanti Security Controls; designed the networking and architecture the team built on.'],
      ['Observability consolidation', 'Migrating 20M+ log events per week from Sumo Logic to Datadog, including Grok parsing pipelines for payment logs and transaction-orphan detection monitors, for single-pane dashboards and lower MTTR.'],
      ['Security', 'Rolled out CrowdStrike Falcon sensor injection for ECS Fargate workloads using the init-container model.'],
      ['High availability', 'Designed a 2-node active/passive Windows Failover Cluster on shared EBS io2 Multi-Attach to replace single-server Control-M staging hosts across Test, Pre-Prod and Prod.'],
      ['IaC adoption', 'Moving AWS accounts inherited from a previous vendor from ClickOps to CloudFormation and Terraform.'],
    ],
  },
  {
    title: 'DevOps Lead Consultant',
    org: 'CI&T (for iSelect / CompareTheMarket)',
    terms: 'Contract',
    period: 'May 2025 – Jun 2025',
    points: [
      ['Merger', 'Consolidated technology assets during the merger of iSelect and CompareTheMarket.'],
      ['IaC migration', 'Led the move from CloudFormation to Terraform across multiple AWS accounts with shared modules and state management.'],
      ['Data platform', 'Integrated ingestion pipelines from Salesforce, Meta, Google Ads and third-party SFTP APIs into a unified Delta Lakehouse on Databricks, using Python, Lambda, DMS and AWS Transfer Family.'],
    ],
  },
  {
    title: 'Lead Site Reliability Engineer',
    org: 'AKQA',
    period: 'Sep 2024 – Apr 2025',
    points: [
      ['Netflix game launch', 'Led SRE for an AI-driven face-transforming game, designing Kubernetes clusters that scaled to 50k+ concurrent users in the first 10 minutes of launch, with Grafana monitoring of NVIDIA DCGM GPU metrics.'],
      ['Observability revamp', 'Reviewed and upgraded monitoring, logging and alerting across all client infrastructures.'],
      ['Incident automation', 'Built an incident management workflow in Python and AWS Lambda integrating OpsGenie, Slack, Teams and Jira, reducing manual overhead and response times.'],
      ['Change management', 'Defined Change Request standards and automated approvals to reduce deployment risk.'],
    ],
  },
  {
    title: 'Senior Site Reliability Engineer',
    org: 'Cvent',
    period: 'Oct 2019 – Sep 2024',
    points: [
      ['Incident automation', 'Co-developed Sev1 incident response automation (Datadog and Slack triggers orchestrating Jira, Slack, Zoom and PagerDuty), cutting time-to-respond by 20+ minutes.'],
      ['Log migration', 'Migrated ~880M log events per week from Splunk to Datadog, unifying logs, metrics and traces on one platform.'],
      ['Observability ownership', "Owned SLI/SLO and custom instrumentation standards for Java microservices; led a newly acquired company's move to Datadog (10+ dashboards)."],
      ['Platform scale', 'Rolled out ECS Capacity Providers across 70+ clusters with zero downtime.'],
      ['Octopus Deploy', 'Built a high-availability model sustaining 99.9% availability and cut self-hosting costs by 30%.'],
      ['Cloud migration', 'Contributed to migrating a Rackspace-hosted product (17 Java microservices, 26 .NET projects, 8 websites) to AWS, and standardised build pipelines for 134 .NET projects onto one pipeline.'],
      ['IaC', 'Early adopter of AWS CDK, consolidating CloudFormation and Terraform stacks into a single CDK stack for multiple applications.'],
      ['Security', 'Moved all microservices to non-root, least-privilege containers.'],
      ['Developer productivity', 'Embedded with sprint teams to remove bottlenecks, including fixing flaky JUnit/Jest tests that were wasting PR build hours; ran Fargate and Harness POCs.'],
      ['Configuration management', 'Re-engineered Chef for 500+ monthly active servers.'],
      ['Mentoring', 'Onboarded and mentored 4 new engineers.'],
    ],
  },
  {
    title: 'Cloud Automation Associate',
    org: 'Infraguard',
    period: 'Jan 2019 – Oct 2019',
    points: [
      [null, 'Wrote Lambda automations for scheduled start/stop, package updates and SSH key rotation.'],
      [null, 'Designed a NAT Gateway pattern to patch sensitive private-subnet servers without exposing them to the internet.'],
      [null, 'Built the knowledge base for multi-cloud VM management across AWS, GCP, Azure and Alibaba Cloud.'],
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
