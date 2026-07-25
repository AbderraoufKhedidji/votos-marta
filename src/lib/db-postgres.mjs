import { sql } from '@vercel/postgres';

export { sql };

// Helpers de categorías
export async function listCategories() {
  const { rows } = await sql`
    SELECT c.id, c.name, c.description, c.created_at,
           (SELECT COUNT(*)::int FROM actors a WHERE a.category_id = c.id) AS actor_count
    FROM categories c
    ORDER BY c.created_at DESC
  `;
  return rows;
}

export async function listCategoriesWithVotes() {
  const { rows } = await sql`
    SELECT c.id, c.name, c.description,
           (SELECT COUNT(*)::int FROM actors a WHERE a.category_id = c.id) AS actor_count,
           (SELECT COUNT(*)::int FROM votes v JOIN actors a ON a.id = v.actor_id WHERE a.category_id = c.id) AS vote_count
    FROM categories c
    ORDER BY c.created_at DESC
  `;
  return rows;
}

export async function getCategory(id) {
  const { rows } = await sql`SELECT * FROM categories WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createCategory(name, description) {
  const { rows } = await sql`
    INSERT INTO categories (name, description) VALUES (${name}, ${description})
    RETURNING *
  `;
  return rows[0];
}

export async function updateCategory(id, name, description) {
  const { rows } = await sql`
    UPDATE categories SET name = ${name}, description = ${description} WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteCategory(id) {
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// Helpers de actores
export async function listActors(categoryId) {
  const { rows } = await sql`
    SELECT a.*,
           (SELECT COUNT(*)::int FROM votes v WHERE v.actor_id = a.id) AS vote_count,
           (SELECT COALESCE(AVG(v.score), 0)::float FROM votes v WHERE v.actor_id = a.id) AS avg_score
    FROM actors a
    WHERE a.category_id = ${categoryId}
    ORDER BY a.created_at DESC
  `;
  return rows;
}

export async function getActor(id) {
  const { rows } = await sql`SELECT * FROM actors WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createActor(categoryId, name, role, photoUrl) {
  const { rows } = await sql`
    INSERT INTO actors (category_id, name, role, photo_url)
    VALUES (${categoryId}, ${name}, ${role}, ${photoUrl})
    RETURNING *
  `;
  return rows[0];
}

export async function updateActor(id, name, role, photoUrl) {
  const { rows } = await sql`
    UPDATE actors SET name = ${name}, role = ${role}, photo_url = COALESCE(${photoUrl}, photo_url)
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteActor(id) {
  await sql`DELETE FROM actors WHERE id = ${id}`;
}

// Helpers de votos
export async function addVote(actorId, username, score) {
  // Solo 1 voto por usuario por actor. Si ya existe para ese actor, se ignora.
  const { rows } = await sql`
    INSERT INTO votes (actor_id, username, score)
    SELECT ${actorId}, ${username}, ${score}
    WHERE NOT EXISTS (
      SELECT 1 FROM votes WHERE actor_id = ${actorId} AND username = ${username}
    )
    RETURNING id
  `;
  return rows.length > 0;
}

export async function listVotes() {
  const { rows } = await sql`
    SELECT v.*, a.name AS actor_name, c.name AS category_name
    FROM votes v
    JOIN actors a ON a.id = v.actor_id
    JOIN categories c ON c.id = a.category_id
    ORDER BY v.created_at DESC
  `;
  return rows;
}

export async function clearVotes() {
  await sql`DELETE FROM votes`;
}

export async function listVotesForActor(actorId) {
  const { rows } = await sql`
    SELECT username, score FROM votes WHERE actor_id = ${Number(actorId)}
  `;
  return rows;
}

export async function replaceVotesForActor(actorId, votes) {
  await sql`DELETE FROM votes WHERE actor_id = ${Number(actorId)}`;
  for (const { username, score } of votes) {
    await sql`
      INSERT INTO votes (actor_id, username, score)
      VALUES (${Number(actorId)}, ${String(username).toLowerCase()}, ${Number(score)})
      ON CONFLICT (actor_id, username) DO UPDATE SET score = EXCLUDED.score
    `;
  }
  return votes.length;
}

// Settings (clave-valor)
export async function getSetting(key) {
  const { rows } = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key, value) {
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export async function getActiveActor() {
  const id = await getSetting('active_actor_id');
  if (!id) return null;
  return getActor(Number(id));
}

// Estadísticas de votos de un actor (para la vista de votación en directo)
export async function getVoteStats(actorId) {
  const actor = await getActor(actorId);
  const { rows } = await sql`
    SELECT score, COUNT(*)::int AS count FROM votes WHERE actor_id = ${actorId} GROUP BY score
  `;
  const distribution = Array(11).fill(0);
  for (const r of rows) distribution[r.score] = r.count;
  const { rows: agg } = await sql`
    SELECT COUNT(*)::int AS total, COALESCE(AVG(score), 0)::float AS average FROM votes WHERE actor_id = ${actorId}
  `;
  return { actor, distribution, total: agg[0].total, average: agg[0].average };
}
