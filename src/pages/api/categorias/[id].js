import { getCategory, updateCategory, deleteCategory } from '../../../lib/db.mjs';

export const prerender = false;

export async function POST({ params, request }) {
  const id = Number(params.id);
  const url = new URL(request.url);
  const method = (url.searchParams.get('_method') || 'POST').toUpperCase();

  if (method === 'DELETE') {
    await deleteCategory(id);
    return new Response(null, { status: 303, headers: { Location: '/admin' } });
  }

  if (method === 'PUT') {
    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    const description = String(form.get('description') || '').trim() || null;
    if (!name) return new Response(null, { status: 400 });
    await updateCategory(id, name, description);
    return new Response(null, { status: 303, headers: { Location: `/admin/categorias/${id}` } });
  }

  return new Response(null, { status: 405 });
}
