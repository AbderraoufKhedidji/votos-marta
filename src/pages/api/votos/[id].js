import { getVoteStats } from '../../../lib/db.mjs';

export const prerender = false;

export async function GET({ params }) {
  const id = Number(params.id);
  try {
    const stats = await getVoteStats(id);
    if (!stats.actor) {
      return new Response(JSON.stringify({ error: 'Actor no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
