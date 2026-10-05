/**
 * Markdown versions of every page, plus llms.txt and llms-full.txt, for AI assistants and
 * agentic search. Generated from the same data as the HTML, so they cannot drift out of date.
 */
import { caseStudies, type CaseStudy } from '../data/caseStudies.ts';
import { accolades, capabilities, certification, education, experience, profile, projects, resumeSkills, type Role } from '../data/profile.ts';

export const SITE = 'https://naman-kumar2397.github.io';
const featured = caseStudies.filter((c) => c.feature);

/** Markdown URL for an HTML page path: / -> /index.md, /resume/ -> /resume.md, /projects/x/ -> /projects/x.md */
export const mdPath = (path: string) => (path === '/' ? '/index.md' : `${path.replace(/\/$/, '')}.md`);
const abs = (path: string) => SITE + path;
const tidy = (md: string) => md.replace(/\n{3,}/g, '\n\n').trim() + '\n';
const list = (items: string[] = []) => items.map((i) => `- ${i}`).join('\n');
const section = (heading: string, body: string | undefined) => (body ? `## ${heading}\n\n${body}\n` : '');
const orgLine = (r: Role) => {
  const extra = [r.via && `via ${r.via}`, r.client && `for ${r.client}`].filter(Boolean).join(', ');
  return extra ? `${r.employer} (${extra})` : r.employer;
};
const contact = list([
  `Email: ${profile.email}`,
  `LinkedIn: ${profile.linkedin}`,
  `Website: ${SITE}/`,
  `Resume (PDF): ${SITE}/resume.pdf`,
]);

export function homeMd(): string {
  return tidy(`# ${profile.name}

${profile.role} · ${profile.location}, Australia

${profile.pitch}

${section('Summary', profile.summary)}
${section('Key numbers', list(profile.metrics.map((m) => `**${m.value}** ${m.label}: ${m.context}`)))}
${section('Experience', experience.map((r) => `- **${r.title}**, ${orgLine(r)}, ${r.period}: ${r.headline}`).join('\n') + `\n\nFull detail: [resume](${abs('/resume.md')})`)}
${section('Case studies', caseStudies.map((c) => `- ${c.feature ? `[${c.title}](${abs(mdPath(`/projects/${c.id}/`))})` : `**${c.title}**`} (${c.context}): ${c.headline}`).join('\n'))}
${section('Capabilities', list(capabilities.map((c) => `**${c.group}**: ${c.evidence}`)))}
${section('Contact', contact)}`);
}

export function resumeMd(): string {
  const roles = experience
    .map((r) => `### ${r.title}, ${orgLine(r)}\n\n${r.period}${r.terms ? ` · ${r.terms}` : ''}\n\n${list(r.points.map((p) => (p.label ? `**${p.label}**: ${p.text}` : p.text)))}`)
    .join('\n\n');
  return tidy(`# ${profile.name}

${profile.role} · ${profile.location}, Australia · ${profile.email} · ${profile.linkedin}

${section('Summary', profile.summary)}
${section('Experience', roles)}
${section('Skills', list(resumeSkills.map((s) => `**${s.group}**: ${s.items.join(', ')}`)))}
${section('Projects', list(projects.map((p) => `**${p.name}**: ${p.text}`)))}
${section('Awards', list(accolades))}
${section('Education', education)}
${section('Certifications', certification)}`);
}

export function caseStudyMd(c: CaseStudy): string {
  const f = c.feature;
  const parts = [
    `# ${c.title}`,
    `${c.context} · ${c.status}${f ? ` · Role: ${f.role}` : ''}`,
    `**${c.headline}**`,
    c.overview,
    f?.publicLink ? `Public write-up: [${f.publicLink.label}](${f.publicLink.href})` : '',
    section('Key facts', f && list(f.facts.map((x) => `**${x.label}**: ${x.value}`))),
    section('Problem', c.problem),
    section('Architecture', f
      ? `${f.diagram.caption}\n\n${f.diagram.columns.map((col, i) => `${i + 1}. **${col.title}**: ${col.nodes.map((n) => (n.detail ? `${n.label} (${n.detail})` : n.label)).join('; ')}`).join('\n')}`
      : c.architecture && `${c.architecture.caption}\n\n${c.architecture.steps.map((s, i) => `${i + 1}. **${s.label}**${s.detail ? `: ${s.detail}` : ''}`).join('\n')}`),
    section('How it evolved', f?.evolution?.map((e) => `### ${e.phase}${e.when ? ` (${e.when})` : ''}\n\n${list(e.points)}`).join('\n\n')),
    section('My contribution', f && list(f.contributions)),
    section('Key decisions', c.decisions?.length ? list(c.decisions) : undefined),
    section('Trade-offs', f?.tradeoffs?.length ? list(f.tradeoffs) : undefined),
    section('Implementation', c.implementation?.length ? list(c.implementation) : undefined),
    section('Reliability and safety', c.reliability?.length ? list(c.reliability) : undefined),
    section('Outcomes', c.outcomes?.length ? list(c.outcomes) : undefined),
    section('Stack', c.stack.join(', ')),
    f ? `_${f.confidentiality}_` : '',
    f ? `Web page: ${abs(`/projects/${c.id}/`)} · Author: ${profile.name}, ${profile.role} (${profile.email})` : '',
  ];
  return tidy(parts.filter(Boolean).join('\n\n'));
}

export function llmsTxt(): string {
  return `# ${profile.name}

> ${profile.role} in ${profile.location}, Australia, with 7+ years running AWS at scale: site reliability, observability, infrastructure as code, incident automation and AI-assisted operations. Currently Lead SRE at ${profile.current.employer}.

Every claim on this site is taken from his resume. Contact: ${profile.email} or ${profile.linkedin}.

## Profile

- [Overview](${abs('/index.md')}): summary, key numbers, career, case studies and capabilities
- [Resume](${abs('/resume.md')}): full resume with every role, skill, award and certification
- [Resume PDF](${abs('/resume.pdf')}): the same resume as a printable PDF

## Case studies

${featured.map((c) => `- [${c.title}](${abs(mdPath(`/projects/${c.id}/`))}): ${c.headline}`).join('\n')}

## Optional

- [Everything in one file](${abs('/llms-full.txt')}): the overview, resume and all case studies
- [LinkedIn](${profile.linkedin}): professional profile
`;
}

export function llmsFullTxt(): string {
  return [homeMd(), resumeMd(), ...caseStudies.map(caseStudyMd)].join('\n\n---\n\n');
}
