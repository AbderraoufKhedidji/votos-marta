import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = resolve(__dirname, '..', '..', 'public', 'uploads');

const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function uploadPhoto(file) {
  if (!file || typeof file === 'string' || file.size === 0) return null;

  if (hasBlob) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`actores/${Date.now()}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
    return blob.url;
  }

  // Fallback local: guardar en public/uploads
  mkdirSync(UPLOADS_DIR, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
  const buf = Buffer.from(await file.arrayBuffer());
  writeFileSync(resolve(UPLOADS_DIR, safeName), buf);
  return `/uploads/${safeName}`;
}

export async function deletePhoto(url) {
  if (!url) return;
  if (url.startsWith('http')) {
    if (hasBlob) {
      const { del } = await import('@vercel/blob');
      try { await del(url); } catch {}
    }
    return;
  }
  // Local
  if (url.startsWith('/uploads/')) {
    const p = resolve(__dirname, '..', '..', 'public', url.replace(/^\//, ''));
    if (existsSync(p)) {
      try { unlinkSync(p); } catch {}
    }
  }
}
