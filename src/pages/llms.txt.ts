import type { APIRoute } from 'astro';
import cv from '../data/cv.generated.json';
import { editorial } from '../data/editorial';
import { renderLlms } from '../data/llms';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('The site URL is required.');
  return new Response(renderLlms(cv, editorial, site), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
