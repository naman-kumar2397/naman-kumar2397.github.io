import type { APIRoute } from 'astro';
import { homeMd } from '../lib/markdown';

export const GET: APIRoute = () => new Response(homeMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
