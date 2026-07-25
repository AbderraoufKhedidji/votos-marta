import { getActor, updateActor, deleteActor } from '../../../lib/db.mjs';
import { uploadPhoto, deletePhoto } from '../../../lib/photos.mjs';

export const prerender = false;

export async function POST({ params, request }) {
  const id = Number(params.id);
  const url = new URL(request.url);
  const method = (url.searchParams.get('_method') || 'POST').toUpperCase();

  if (method === 'DELETE') {
    const actor = await getActor(id);
    if (actor?.photo_url) {
      await deletePhoto(actor.photo_url);
    }
    await deleteActor(id);
    return new Response(null, { status: 303, headers: { Location: '/admin' } });
  }

  if (method === 'PUT') {
    const form = await request.formData();
    const name = String(form.get('name') || '').trim();
    const role = String(form.get('role') || '').trim() || null;
    const file = form.get('photo');
    if (!name) return new Response(null, { status: 400 });

    const photoUrl = await uploadPhoto(file);

    await updateActor(id, name, role, photoUrl);
    const actor = await getActor(id);
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/categorias/${actor.category_id}` },
    });
  }

  return new Response(null, { status: 405 });
}
