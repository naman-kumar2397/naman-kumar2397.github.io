import type { APIRoute, GetStaticPaths } from 'astro';
import { caseStudies, type CaseStudy } from '../../data/caseStudies';
import { caseStudyMd } from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = () => caseStudies.filter((c) => c.feature).map((c) => ({ params: { id: c.id }, props: { c } }));

export const GET: APIRoute = ({ props }) => new Response(caseStudyMd(props.c as CaseStudy), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
