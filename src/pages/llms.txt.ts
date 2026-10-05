import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/markdown';

/** https://llmstxt.org: a Markdown map of the site for AI assistants. */
export const GET: APIRoute = () => new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
