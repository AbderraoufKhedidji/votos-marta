import { replaceVotesForActor, getActor } from '../../../../lib/db.mjs';
import { verifySession } from '../../../../lib/auth.mjs';

export const prerender = false;

export async function POST({ params, request, cookies, redirect }) {
  const authed = await verifySession(request.headers.get('cookie'));
  if (!authed) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Number(params.id);
  const actor = await getActor(id);
  if (!actor) {
    return new Response(JSON.stringify({ error: 'Actor no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const votes = Array.isArray(body?.votes) ? body.votes : [];
  const clean = votes
    .filter((v) => v && typeof v.username === 'string' && Number.isFinite(Number(v.score)))
    .map((v) => ({ username: v.username, score: Math.max(0, Math.min(10, Math.round(Number(v.score)))) }));

  const count = await replaceVotesForActor(id, clean);
  return new Response(
    JSON.stringify({ ok: true, actor_id: id, saved: count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
