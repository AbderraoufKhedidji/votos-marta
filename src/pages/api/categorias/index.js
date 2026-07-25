import { createCategory, listCategories } from '../../../lib/db.mjs';

export const prerender = false;

export async function GET() {
  const rows = await listCategories();
  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }) {
  const form = await request.formData();
  const name = String(form.get('name') || '').trim();
  const description = String(form.get('description') || '').trim() || null;
  if (!name) {
    return new Response(null, { status: 400 });
  }
  const cat = await createCategory(name, description);
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/categorias/${cat.id}` },
  });
}
