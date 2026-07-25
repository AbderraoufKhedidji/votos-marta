import { createSessionCookie, checkCredentials } from '../../lib/auth.mjs';

export const prerender = false;

export async function POST({ request }) {
  const form = await request.formData();
  const user = String(form.get('user') || '');
  const password = String(form.get('password') || '');

  if (!checkCredentials(user, password)) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/login?error=1' },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin',
      'Set-Cookie': await createSessionCookie(),
    },
  });
}
