import { createClient } from '@libsql/client';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Conexión:
// - Si hay TURSO_DATABASE_URL -> Turso (libSQL alojado, producción en Vercel).
// - Si no -> SQLite local en disco (desarrollo).
const TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || '';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || '';

let client;
let isLocal = false;
if (TURSO_URL) {
  client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN || undefined });
} else if (process.env.VERCEL) {
  // En Vercel el sistema de archivos es de solo lectura: el modo SQLite local
  // no funciona. Se requiere configurar Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
  throw new Error(
    '[votos-marta] Falta la configuración de Turso. Añade las variables de entorno ' +
      'TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel (Project > Settings > Environment Variables).'
  );
} else {
  isLocal = true;
  const localFile = resolve(__dirname, '..', '..', 'data', 'votos.db');
  try {
    mkdirSync(dirname(localFile), { recursive: true });
  } catch (e) {
    throw new Error(`[votos-marta] No se pudo crear el directorio de la base de datos local (${dirname(localFile)}): ${e.message}`);
  }
  client = createClient({ url: `file:${localFile}` });
}

export function isLocalMode() {
  return isLocal;
}

// Esquema (idempotente). Se ejecuta al cargar el módulo; cada función lo espera.
let ready;
function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      await client.execute(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await client.execute(`CREATE TABLE IF NOT EXISTS actors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT,
        photo_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await client.execute(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (actor_id, username)
      )`);
      await client.execute(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_actors_category ON actors(category_id)`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_votes_actor ON votes(actor_id)`);
    })().catch((e) => {
      console.error('Error inicializando esquema de la base de datos:', e);
      throw e;
    });
  }
  return ready;
}

export async function initSchema() {
  return ensureSchema();
}

// --- Categorías ---
export async function listCategories() {
  await ensureSchema();
  const rs = await client.execute({
    sql: `SELECT c.id, c.name, c.description, c.created_at,
            (SELECT COUNT(*) FROM actors a WHERE a.category_id = c.id) AS actor_count
          FROM categories c ORDER BY c.created_at DESC`,
  });
  return rs.rows;
}

export async function listCategoriesWithVotes() {
  await ensureSchema();
  const rs = await client.execute({
    sql: `SELECT c.id, c.name, c.description,
            (SELECT COUNT(*) FROM actors a WHERE a.category_id = c.id) AS actor_count,
            (SELECT COUNT(*) FROM votes v JOIN actors a ON a.id = v.actor_id WHERE a.category_id = c.id) AS vote_count
          FROM categories c ORDER BY c.created_at DESC`,
  });
  return rs.rows;
}

export async function getCategory(id) {
  await ensureSchema();
  const rs = await client.execute({ sql: `SELECT * FROM categories WHERE id = ?`, args: [Number(id)] });
  return rs.rows[0] ?? null;
}

export async function createCategory(name, description) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `INSERT INTO categories (name, description) VALUES (?, ?) RETURNING *`,
    args: [name, description],
  });
  return rs.rows[0];
}

export async function updateCategory(id, name, description) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `UPDATE categories SET name = ?, description = ? WHERE id = ? RETURNING *`,
    args: [name, description, Number(id)],
  });
  return rs.rows[0];
}

export async function deleteCategory(id) {
  await ensureSchema();
  await client.execute({ sql: `DELETE FROM categories WHERE id = ?`, args: [Number(id)] });
}

// --- Actores ---
export async function listActors(categoryId) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `SELECT a.*,
            (SELECT COUNT(*) FROM votes v WHERE v.actor_id = a.id) AS vote_count,
            (SELECT COALESCE(AVG(v.score), 0) FROM votes v WHERE v.actor_id = a.id) AS avg_score
          FROM actors a WHERE a.category_id = ? ORDER BY a.created_at DESC`,
    args: [Number(categoryId)],
  });
  return rs.rows;
}

export async function getActor(id) {
  await ensureSchema();
  const rs = await client.execute({ sql: `SELECT * FROM actors WHERE id = ?`, args: [Number(id)] });
  return rs.rows[0] ?? null;
}

export async function createActor(categoryId, name, role, photoUrl) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `INSERT INTO actors (category_id, name, role, photo_url) VALUES (?, ?, ?, ?) RETURNING *`,
    args: [Number(categoryId), name, role ?? null, photoUrl ?? null],
  });
  return rs.rows[0];
}

export async function updateActor(id, name, role, photoUrl) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `UPDATE actors SET name = ?, role = ?, photo_url = COALESCE(?, photo_url) WHERE id = ? RETURNING *`,
    args: [name, role ?? null, photoUrl ?? null, Number(id)],
  });
  return rs.rows[0];
}

export async function deleteActor(id) {
  await ensureSchema();
  await client.execute({ sql: `DELETE FROM actors WHERE id = ?`, args: [Number(id)] });
}

// --- Votos ---
export async function addVote(actorId, username, score) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `INSERT INTO votes (actor_id, username, score)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (SELECT 1 FROM votes WHERE actor_id = ? AND username = ?)
          RETURNING id`,
    args: [Number(actorId), String(username).toLowerCase(), Number(score), Number(actorId), String(username).toLowerCase()],
  });
  return rs.rows.length > 0;
}

export async function listVotes() {
  await ensureSchema();
  const rs = await client.execute({
    sql: `SELECT v.*, a.name AS actor_name, c.name AS category_name
          FROM votes v
          JOIN actors a ON a.id = v.actor_id
          JOIN categories c ON c.id = a.category_id
          ORDER BY v.created_at DESC`,
  });
  return rs.rows;
}

export async function clearVotes() {
  await ensureSchema();
  await client.execute(`DELETE FROM votes`);
}

export async function listVotesForActor(actorId) {
  await ensureSchema();
  const rs = await client.execute({
    sql: `SELECT username, score FROM votes WHERE actor_id = ?`,
    args: [Number(actorId)],
  });
  return rs.rows;
}

export async function replaceVotesForActor(actorId, votes) {
  await ensureSchema();
  const aid = Number(actorId);
  const stmts = [{ sql: `DELETE FROM votes WHERE actor_id = ?`, args: [aid] }];
  for (const { username, score } of votes) {
    stmts.push({
      sql: `INSERT INTO votes (actor_id, username, score) VALUES (?, ?, ?)
            ON CONFLICT (actor_id, username) DO UPDATE SET score = EXCLUDED.score`,
      args: [aid, String(username).toLowerCase(), Number(score)],
    });
  }
  await client.batch(stmts);
  return votes.length;
}

// --- Settings (clave-valor) ---
export async function getSetting(key) {
  await ensureSchema();
  const rs = await client.execute({ sql: `SELECT value FROM settings WHERE key = ?`, args: [key] });
  return rs.rows[0]?.value ?? null;
}

export async function setSetting(key, value) {
  await ensureSchema();
  await client.execute({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    args: [key, value],
  });
}

export async function getActiveActor() {
  const id = await getSetting('active_actor_id');
  if (!id) return null;
  return getActor(Number(id));
}

// --- Estadísticas de votos de un actor (vista en directo) ---
export async function getVoteStats(actorId) {
  await ensureSchema();
  const actor = await getActor(actorId);
  const rs = await client.execute({
    sql: `SELECT score, COUNT(*) AS count FROM votes WHERE actor_id = ? GROUP BY score`,
    args: [Number(actorId)],
  });
  const distribution = Array(11).fill(0);
  for (const r of rs.rows) distribution[r.score] = r.count;
  const agg = await client.execute({
    sql: `SELECT COUNT(*) AS total, COALESCE(AVG(score), 0) AS average FROM votes WHERE actor_id = ?`,
    args: [Number(actorId)],
  });
  return { actor, distribution, total: agg.rows[0].total, average: agg.rows[0].average };
}
