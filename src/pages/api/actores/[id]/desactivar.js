import { setSetting } from '../../../../lib/db.mjs';

export const prerender = false;

export async function POST({ request }) {
  const form = await request.formData();
  const categoryId = String(form.get('category_id') || '');
  await setSetting('active_actor_id', '');
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/categorias/${categoryId}` },
  });
}
