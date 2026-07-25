export const prerender = false;

export async function GET() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/login',
      'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0',
    },
  });
}
