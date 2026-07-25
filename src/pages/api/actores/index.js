import { createActor } from '../../../lib/db.mjs';
import { uploadPhoto } from '../../../lib/photos.mjs';

export const prerender = false;

export async function POST({ request }) {
  const form = await request.formData();
  const categoryId = Number(form.get('category_id'));
  const name = String(form.get('name') || '').trim();
  const role = String(form.get('role') || '').trim() || null;
  const file = form.get('photo');

  if (!categoryId || !name) {
    return new Response(null, { status: 400 });
  }

  const photoUrl = await uploadPhoto(file);

  await createActor(categoryId, name, role, photoUrl);
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/categorias/${categoryId}` },
  });
}
