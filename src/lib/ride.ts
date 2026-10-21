/**
 * Content for /home-alternate/, the journey homepage: the hero's keyword facts and six
 * chapters, newest first. Nothing here is new copy that states a fact. Every figure, period
 * and sentence is picked from src/data; `must` and `find` fail the build if a picked phrase
 * is no longer in the data it was taken from, so the page can never drift from the resume.
 * Chapter kickers ("Now", "Win", ...) and link labels are the only editorial words.
 */
import { branches, commits, type BranchColour } from '../data/journey.ts';
import { caseStudies } from '../data/caseStudies.ts';
import { accolades, capabilities, certification, education, experience, profile } from '../data/profile.ts';

/** Particle scene drawn for a chapter (src/scripts/ride-field.ts). */
export type Scene = 'accounts' | 'agents' | 'merge' | 'surge' | 'stream' | 'origin';

export interface Chapter {
  id: string;
  kicker: string;
  /** Short label and year for the progress rail. */
  rail: string;
  year: string;
  colour: BranchColour;
  /** Branch ref, as in the git log. */
  ref: string;
  title: string;
  org: string;
  period: string;
  /** Headline figure; `count` counts it up once (final value is in the HTML). */
  figure?: { value: string; label: string; count?: boolean };
  outcome: string;
  beats: string[];
  tags: string[];
  link: { href: string; label: string };
  scene: Scene;
}

const must = (text: string, phrase: string) => {
  if (!text.includes(phrase)) throw new Error(`ride: "${phrase}" is not in "${text.slice(0, 60)}..."`);
  return phrase;
};
const find = (list: readonly string[], phrase: string) => {
  const hit = list.find((s) => s.includes(phrase));
  if (!hit) throw new Error(`ride: no entry mentions "${phrase}"`);
  return hit;
};
const role = (branch: string) => {
  const r = experience.find((x) => x.branch === branch);
  if (!r) throw new Error(`ride: no role on branch "${branch}"`);
  return r;
};
const study = (id: string) => {
  const c = caseStudies.find((x) => x.id === id);
  if (!c) throw new Error(`ride: no case study "${id}"`);
  return c;
};
const yearOf = (s: string) => (s.match(/\d{4}/) || [''])[0];
const metric = (label: string) => {
  const m = profile.metrics.find((x) => x.label.includes(label));
  if (!m) throw new Error(`ride: no metric "${label}"`);
  return m;
};

const latitude = role('latitude');
const cit = role('cit');
const akqa = role('akqa');
const cvent = role('cvent');
const infraguard = role('infraguard');
const alfred = study('alfred');
const proxy = study('claude-bedrock-proxy');
const netflix = study('netflix-game-launch');
const observability = study('observability-migrations');
const users = metric('concurrent users');

// "Live in production since September 2026" -> figure "Live", label "since September 2026".
const alfredStatus = alfred.feature!.facts.find((f) => f.label === 'Status')!.value.match(/^(Live) in production (since .+)$/);
if (!alfredStatus) throw new Error('ride: Alfred status fact changed shape');
// "AWS, GCP, Azure and Alibaba Cloud" -> 4
const clouds = infraguard.scope[0];
const cloudCount = clouds.split(/,\s*|\s+and\s+/).length;
// "Cvent Hero: Agility (2020)" -> "Cvent Hero (2020)"
const awards = accolades.map((a) => a.replace(/:[^(]*/, ' ').replace(/\s+/g, ' ').trim()).join(', ');

/** The hero's keyword facts; the leading figure of each is emphasised when rendered. */
export const heroFacts: string[] = [
  `${metric('years').value} ${metric('years').label.split(' ')[0]}`,
  must(latitude.scope[0], 'Leads a team of 10 engineers'),
  must(latitude.scope[1], '80+ AWS accounts'),
  `${users.value} ${must(users.label, 'concurrent users')} (${must(netflix.context, 'Netflix')} launch)`,
  must(capabilities.find((c) => c.group.startsWith('AI'))!.evidence, 'AI SRE live on Bedrock AgentCore'),
];

export const chapters: Chapter[] = [
  {
    id: 'now', kicker: 'Now', rail: 'Latitude', year: yearOf(latitude.period), colour: branches.latitude.colour,
    ref: branches.latitude.name, title: latitude.client!, org: `${profile.current.role} at ${profile.current.employer}`,
    period: latitude.period,
    figure: { value: metric('AWS accounts').value, label: metric('AWS accounts').label },
    outcome: latitude.headline,
    beats: [find(branches.latitude.highlights, 'Zero-touch ECS'), find(branches.latitude.highlights, 'CrowdStrike Falcon')],
    tags: latitude.stack.slice(0, 4),
    link: { href: '/#experience', label: 'Every Latitude achievement' },
    scene: 'accounts',
  },
  {
    id: 'alfred', kicker: 'Win', rail: 'Alfred', year: yearOf(branches.ai.period), colour: branches.ai.colour,
    ref: branches.ai.name, title: alfred.title, org: profile.current.client, period: branches.ai.period,
    figure: { value: alfredStatus[1], label: alfredStatus[2] },
    outcome: find(branches.ai.highlights, 'orchestrating AWS DevOps Agent with'),
    beats: [find(branches.ai.highlights, 'Multi-agent incident investigator'), `Next: ${proxy.title} (${proxy.status.toLowerCase()})`],
    tags: alfred.stack.slice(0, 3),
    link: { href: `/projects/${alfred.id}/`, label: 'Read the Alfred case study' },
    scene: 'agents',
  },
  {
    id: 'cit', kicker: 'Merger', rail: cit.employer, year: yearOf(cit.period), colour: branches.cit.colour,
    ref: branches.cit.name, title: cit.employer, org: `${cit.title}, for ${cit.client}`, period: cit.period,
    outcome: cit.headline,
    beats: [find(branches.cit.highlights, 'Delta Lakehouse')],
    tags: cit.stack.slice(0, 4),
    link: { href: '/resume/', label: 'The full role on the resume' },
    scene: 'merge',
  },
  {
    id: 'netflix', kicker: 'Win', rail: 'Netflix', year: yearOf(branches.netflix.period), colour: branches.netflix.colour,
    ref: branches.netflix.name, title: netflix.title, org: netflix.context, period: akqa.period,
    figure: { value: users.value, label: users.label, count: true },
    outcome: find(branches.netflix.highlights, 'first 10 minutes'),
    beats: [find(branches.netflix.highlights, 'NVIDIA DCGM')],
    tags: netflix.stack.slice(0, 4),
    link: { href: `/projects/${netflix.id}/`, label: 'Read the launch case study' },
    scene: 'surge',
  },
  {
    id: 'cvent', kicker: 'Scale', rail: cvent.employer, year: yearOf(cvent.period), colour: branches.cvent.colour,
    ref: branches.cvent.name, title: cvent.employer, org: cvent.title, period: cvent.period,
    figure: { value: metric('log events').value, label: metric('log events').label, count: true },
    outcome: find(branches.cvent.highlights, 'Sev1'),
    beats: [find(branches.cvent.highlights, '70+ clusters'), find(branches.cvent.highlights, 'Octopus Deploy'), `Awards: ${awards}`],
    tags: cvent.stack.slice(0, 3),
    link: { href: `/projects/${observability.id}/`, label: observability.headline },
    scene: 'stream',
  },
  {
    id: 'origins', kicker: 'Origins', rail: 'Origins', year: commits[0].date, colour: branches.infraguard.colour,
    ref: branches.main.name, title: `${infraguard.employer} and ${must(education, 'Manipal')}`, org: `${infraguard.title} at ${infraguard.employer}`,
    period: infraguard.period,
    figure: { value: String(cloudCount), label: `clouds: ${clouds}` },
    outcome: infraguard.headline,
    beats: [education, certification.replace(/\s*\([A-Z0-9]{8,}\)/, '')],
    tags: infraguard.stack,
    link: { href: '/resume/', label: 'Education and certification on the resume' },
    scene: 'origin',
  },
];
