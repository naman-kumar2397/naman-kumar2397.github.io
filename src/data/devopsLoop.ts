/**
 * The DevOps loop in Skills: each stage lists tools used there and work done with them.
 * Grouping only; every tool and claim is taken from profile.ts / caseStudies.ts (the resume).
 * Order is the loop: Plan, Code, Build, Test (Dev half), Release, Deploy, Operate, Monitor (Ops half).
 */

export interface LoopStage {
  name: string;
  half: 'dev' | 'ops';
  what: string;
  tools: string[];
  work: [label: string, text: string][];
}

export const loopStages: LoopStage[] = [
  { name: 'Plan', half: 'dev', what: 'Intake, standards and change control before work starts.',
    tools: ['Jira', 'ServiceNow', 'SLIs / SLOs', 'Change requests'],
    work: [['Support model', 'Streamlined intake for all additional workloads through ServiceNow at Latitude.'],
           ['Change management', 'Defined Change Request standards and automated approvals at AKQA.'],
           ['Reliability standards', 'Owned SLI/SLO and instrumentation standards for Java microservices at Cvent.']] },
  { name: 'Code', half: 'dev', what: 'Automation and tooling, written and reviewed in version control.',
    tools: ['Python', 'TypeScript', 'Groovy', 'Shell', 'PowerShell', 'GitHub', 'Bitbucket', 'MCP'],
    work: [['Alfred', 'Multi-agent incident investigator, from local prototype to production on Bedrock AgentCore.'],
           ['Incident automation', 'Python and AWS Lambda workflow integrating OpsGenie, Slack, Teams and Jira at AKQA.'],
           ['neuron-graph', 'Self-hosted AWS infrastructure knowledge graph with a web UI, REST API, CLI and MCP server.']] },
  { name: 'Build', half: 'dev', what: 'Pipelines that turn commits into deployable artefacts.',
    tools: ['Buildkite', 'Jenkins', 'GitLab', 'Harness', 'Docker'],
    work: [['One pipeline', 'Standardised build pipelines for 134 .NET projects across Cvent onto one pipeline.'],
           ['Build Watcher', 'Open-source Chrome extension that chimes when a Buildkite build passes, fails or needs input.']] },
  { name: 'Test', half: 'dev', what: 'Confidence before merge: reliable tests and a known blast radius.',
    tools: ['JUnit', 'Jest', 'GitHub pull requests'],
    work: [['Flaky tests', 'Fixed flaky JUnit and Jest tests that were wasting PR build hours at Cvent.'],
           ['Blast radius', "Alfred's dependency graph posts blast-radius comments on pull requests."]] },
  { name: 'Release', half: 'ops', what: 'Getting a tested build safely approved and promoted.',
    tools: ['Octopus Deploy', 'Harness', 'Change approvals'],
    work: [['Octopus Deploy HA', 'Built a high-availability model sustaining 99.9% availability and cut self-hosting costs by 30%.'],
           ['Harness POC', 'Ran Fargate and Harness proofs of concept for deployment pipelines at Cvent.']] },
  { name: 'Deploy', half: 'ops', what: 'Infrastructure as code and rollouts without downtime.',
    tools: ['Terraform', 'AWS CDK', 'CloudFormation', 'ECS / Fargate', 'Kubernetes', 'Lambda'],
    work: [['Zero downtime', 'Rolled out ECS Capacity Providers across 70+ clusters with zero downtime at Cvent.'],
           ['IaC migration', 'Led the move from CloudFormation to Terraform across multiple AWS accounts at CI&T.'],
           ['ECS upgrades', 'Automated ECS cluster upgrades to CIS-hardened Amazon Linux 2023 AMIs at Latitude.']] },
  { name: 'Operate', half: 'ops', what: 'Running the estate day to day: patching, security, incidents.',
    tools: ['AWS', 'Chef', 'Ansible', 'Ivanti', 'CrowdStrike', 'PagerDuty', 'OpsGenie'],
    work: [['80+ AWS accounts', 'Lead a team of 10 engineers with a follow-the-sun model across Melbourne and India.'],
           ['Sev1 automation', 'Co-developed incident response automation that cut time-to-respond by 20+ minutes at Cvent.'],
           ['Patching', 'Removed ClickOps from monthly patching with Ivanti Security Controls at Latitude.']] },
  { name: 'Monitor', half: 'ops', what: 'Logs, metrics and traces on one platform, and AI that reads them.',
    tools: ['Datadog', 'Dynatrace', 'Grafana', 'Splunk', 'Sumo Logic', 'New Relic', 'CloudWatch'],
    work: [['~880M events/week', 'Migrated Splunk to Datadog at Cvent, unifying logs, metrics and traces.'],
           ['20M+ events/week', 'Migrated Sumo Logic to Datadog at Latitude, with Grok parsing for payment logs.'],
           ['GPU monitoring', 'Grafana monitoring of NVIDIA DCGM metrics for a Netflix game launch at AKQA.']] },
];
