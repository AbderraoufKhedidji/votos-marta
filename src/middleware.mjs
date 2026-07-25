import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/auth.mjs';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/login',
  '/resultados',
  '/api/votes',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Permitir assets estáticos y rutas internas de Vite en dev
  // (en producción el JS bundleado se sirve desde /_astro/)
  if (
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/@vite') ||
    pathname.startsWith('/@fs') ||
    pathname.startsWith('/@react-refresh')
  ) {
    return next();
  }

  // Calcular SIEMPRE el estado de sesión (para que el layout muestre el nav correcto)
  const authed = await verifySession(context.request.headers.get('cookie'));
  context.locals.authed = authed;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/resultados/') ||
    pathname.startsWith('/votar/') ||
    pathname.startsWith('/api/vote') ||
    pathname.startsWith('/api/votos/') ||
    pathname.startsWith('/uploads/');

  if (isPublic) {
    return next();
  }

  if (!authed) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/login');
  }

  return next();
});
