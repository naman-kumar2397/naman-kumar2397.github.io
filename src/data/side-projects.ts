import type { DeepDiveContent } from "@/components/DeepDiveModal";

/* ── Kanban status type ── */
export type KanbanStatus = "shipped" | "in-progress" | "exploring" | "ideation";

/* ── Side-project type ── */
export interface SideProject {
  id: string;
  title: string;
  tagline: string;
  status: KanbanStatus;
  stack: string[];
  deepDive: DeepDiveContent;
}

/* ── Kanban columns (display order) ── */
export const KANBAN_COLUMNS: { id: KanbanStatus; label: string }[] = [
  { id: "shipped", label: "Shipped" },
  { id: "in-progress", label: "In Progress" },
  { id: "exploring", label: "Exploring" },
  { id: "ideation", label: "Ideation" },
];

/* ── Projects ── */
export const SIDE_PROJECTS: SideProject[] = [
  {
    id: "ai-incident-assistant",
    title: "AI Incident Assistant",
    tagline: "LLM-powered runbook copilot that triages PagerDuty alerts and suggests remediation steps in real time.",
    status: "shipped",
    stack: ["Python", "LangChain", "OpenAI", "PagerDuty API", "FastAPI"],
    deepDive: {
      slug: "ai-incident-assistant",
      title: "AI Incident Assistant",
      themes: ["AI/ML", "SRE", "Automation"],
      tools: ["Python", "LangChain", "OpenAI", "PagerDuty API", "FastAPI"],
      impactSnapshot: [
        "Reduced mean-time-to-acknowledge from 12 min to 3 min",
        "Auto-classified 78% of P3/P4 incidents without human intervention",
        "Saved ~6 hours/week of on-call toil across 3 teams",
      ],
      content: `## Problem

On-call engineers spend significant time triaging alerts, reading runbooks, and deciding on the right remediation path — often under pressure at 2 AM. Most P3/P4 incidents follow well-known patterns but still require manual lookup.

## Solution

Built an LLM-powered assistant that ingests PagerDuty alerts, matches them against indexed runbooks using RAG (Retrieval-Augmented Generation), and suggests step-by-step remediation actions. The assistant runs as a FastAPI service with a Slack integration for interactive triage.

Key technical decisions:
- **LangChain + OpenAI** for the reasoning chain — structured prompts enforce a triage-first, act-second workflow
- **Vector store** over runbook corpus with semantic chunking for accurate retrieval
- **PagerDuty webhooks** for real-time alert ingestion with enrichment from monitoring context

## Result

Deployed internally across 3 SRE teams. The assistant correctly auto-classifies the majority of low-severity incidents and provides actionable remediation suggestions that engineers can execute or dismiss with a single click.`,
    },
  },
  {
    id: "infra-cost-optimizer",
    title: "Infra Cost Optimizer",
    tagline: "ML model that forecasts cloud spend and recommends right-sizing actions for underutilized resources.",
    status: "in-progress",
    stack: ["Python", "scikit-learn", "AWS Cost Explorer API", "Terraform", "Streamlit"],
    deepDive: {
      slug: "infra-cost-optimizer",
      title: "Infra Cost Optimizer",
      themes: ["AI/ML", "Cloud", "FinOps"],
      tools: ["Python", "scikit-learn", "AWS Cost Explorer API", "Terraform", "Streamlit"],
      impactSnapshot: [
        "Identified $14K/month in potential savings across 3 AWS accounts",
        "Forecast accuracy within 8% of actual monthly spend",
      ],
      content: `## Problem

Cloud cost reviews happen monthly at best, and teams rarely have visibility into underutilized resources until the bill arrives. Right-sizing recommendations from AWS are generic and miss application-specific usage patterns.

## Solution

Training a time-series model on CloudWatch metrics and Cost Explorer data to forecast per-service spend and flag resources whose utilization consistently falls below configurable thresholds. A Streamlit dashboard surfaces recommendations with one-click Terraform plan generation.

## Current Status

The forecasting model is trained and accurate. Working on the Terraform integration to auto-generate right-sizing plans and the approval workflow for team leads.`,
    },
  },
  {
    id: "semantic-changelog",
    title: "Semantic Changelog",
    tagline: "CLI that reads git history and generates human-readable changelogs using LLM summarization.",
    status: "exploring",
    stack: ["TypeScript", "Node.js", "OpenAI", "Git"],
    deepDive: {
      slug: "semantic-changelog",
      title: "Semantic Changelog",
      themes: ["AI/ML", "Developer Experience", "Tooling"],
      tools: ["TypeScript", "Node.js", "OpenAI", "Git"],
      impactSnapshot: [
        "Prototype generates changelogs for repos with up to 500 commits",
        "Early user feedback: actually useful for sprint demos",
      ],
      content: `## Problem

Writing changelogs is tedious. Conventional-commits helps but most teams don't follow it consistently, and even when they do the output is too granular for stakeholders.

## Approach

Exploring a CLI tool that walks the git log, groups commits by semantic similarity, and uses an LLM to generate concise, audience-appropriate summaries. Investigating different chunking strategies (by PR, by directory, by time window) and prompt engineering for different output formats (release notes, sprint summary, customer-facing changelog).

## Status

Early prototype stage — the core pipeline works for small repos. Exploring batching and caching strategies for larger histories.`,
    },
  },
  {
    id: "llm-guardrails-bench",
    title: "LLM Guardrails Bench",
    tagline: "Benchmark suite for evaluating prompt injection defenses and output safety filters.",
    status: "ideation",
    stack: ["Python", "pytest", "OpenAI", "Anthropic"],
    deepDive: {
      slug: "llm-guardrails-bench",
      title: "LLM Guardrails Bench",
      themes: ["AI/ML", "Security", "Testing"],
      tools: ["Python", "pytest", "OpenAI", "Anthropic"],
      impactSnapshot: [
        "Concept phase — cataloging known prompt injection vectors",
        "Goal: standardized safety eval for enterprise LLM deployments",
      ],
      content: `## Problem

Teams deploying LLMs in production need to evaluate their prompt injection defenses and output filters, but there is no standardized benchmark. Each team builds ad-hoc test suites that miss entire categories of adversarial inputs.

## Idea

Create an open benchmark suite (think: OWASP Top 10 but for LLM guardrails) with categorized test cases, automated scoring, and regression tracking. Focus areas: prompt injection, data exfiltration, harmful content generation, and PII leakage.

## Status

Currently cataloging known attack vectors and reviewing existing research. Plan to build a pytest-based harness that can evaluate any LLM endpoint.`,
    },
  },
];
