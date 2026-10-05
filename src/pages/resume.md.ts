import type { APIRoute } from 'astro';
import { resumeMd } from '../lib/markdown';

export const GET: APIRoute = () => new Response(resumeMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
