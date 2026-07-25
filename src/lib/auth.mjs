const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const SESSION_SECRET = process.env.SESSION_SECRET || 'votos-marta-dev-secret';

// Duración de la sesión: 365 días. La sesión persiste al cerrar el navegador
// y solo se cierra al pulsar "Salir" (o al caducar pasado un año).
const SESSION_MS = 1000 * 60 * 60 * 24 * 365;
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

// Sesión simple: cookie firmada con valor "user|exp|sig"
// No es JWT pero suficiente para una app de admin única.

async function hmac(data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

export async function createSessionCookie() {
  const exp = Date.now() + SESSION_MS;
  const payload = `${ADMIN_USER}|${exp}`;
  const sig = await hmac(payload);
  const value = `${payload}|${sig}`;
  return `session=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export async function verifySession(cookieHeader) {
  if (!cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }),
  );
  const value = cookies.session;
  if (!value) return false;
  const parts = value.split('|');
  if (parts.length !== 3) return false;
  const [user, exp, sig] = parts;
  const payload = `${user}|${exp}`;
  const expected = await hmac(payload);
  if (sig !== expected) return false;
  if (Number(exp) < Date.now()) return false;
  return user === ADMIN_USER;
}

export function checkCredentials(user, pass) {
  return user === ADMIN_USER && pass === ADMIN_PASSWORD;
}
