// Capa de datos basada en localStorage (sin servidor, sin DB).
// Toda la información vive en el navegador. Funciona en Vercel sin variables
// de entorno ni sistema de archivos escribible.

const KEYS = {
  categories: 'vm:categories',
  actors: 'vm:actors',
  votes: 'vm:votes',
  settings: 'vm:settings',
  seeded: 'vm:seeded',
  seedVersion: 'vm:seed_version',
};

import seedData from '../../seeds/seed-hollywood.json';

// Versión del seed. Subirla fuerza la regeneración del seed en navegadores
// que ya tenían una versión anterior (sin tocar las categorías creadas a mano).
// v9 = orden por popularidad. v10 = criterio de fama real (Franco arriba, etc.).
const SEED_VERSION = 10;
const SEED_NAMES = [
  'Actrices más famosas de Hollywood',          // seed v1
  'Actrices más famosas: Hollywood y España',  // seed v2/v3
  'Actores más famosos: Hollywood y España',   // seed v4
  'Futbolistas más famosos',                   // seed v4
  'Políticos españoles e históricos',          // seed v5
];

function seedCategories() {
  // Formato nuevo: { categories: [...] }
  if (Array.isArray(seedData.categories)) return seedData.categories;
  // Formato antiguo (compat): { category, actors }
  if (seedData.category) {
    return [{ ...seedData.category, actors: seedData.actors || [] }];
  }
  return [];
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextId(list) {
  return list.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
}

function now() {
  return new Date().toISOString();
}

// --- Seed inicial (con versionado) ---
// - Si no hay categorías: siembra el seed.
// - Si la versión guardada es anterior a SEED_VERSION: elimina el seed anterior
//   (categorías con nombre conocido) y vuelve a sembrar. Conserva las categorías
//   creadas a mano por el usuario.
function plantSeed() {
  let cats = read(KEYS.categories, []);
  let actors = read(KEYS.actors, []);
  const stamp = now();

  for (const seedCat of seedCategories()) {
    const catId = nextId(cats);
    const coverActor = (seedCat.actors || []).find((a) => a.name === seedCat.cover && a.photo_url)
      || (seedCat.actors || []).find((a) => a.photo_url)
      || null;
    cats = [
      {
        id: catId,
        name: seedCat.name,
        description: seedCat.description || null,
        cover_name: seedCat.cover || coverActor?.name || null,
        cover_url: coverActor?.photo_url || null,
        created_at: stamp,
      },
      ...cats,
    ];
    const base = nextId(actors);
    const newActors = (seedCat.actors || []).map((a, i) => ({
      id: base + i,
      category_id: catId,
      name: a.name,
      role: a.role ?? null,
      photo_url: a.photo_url ?? null,
      // timestamps decrecientes para preservar el orden del seed al ordenar por created_at DESC
      created_at: new Date(Date.parse(stamp) - i * 1000).toISOString(),
    }));
    actors = [...newActors, ...actors];
  }

  write(KEYS.categories, cats);
  write(KEYS.actors, actors);
  write(KEYS.seedVersion, SEED_VERSION);
  write(KEYS.seeded, true);
}

function removeSeedCategories() {
  const cats = read(KEYS.categories, []);
  const seedCats = cats.filter((c) => SEED_NAMES.includes(c.name));
  if (seedCats.length === 0) return;
  const seedIds = new Set(seedCats.map((c) => c.id));
  const actors = read(KEYS.actors, []);
  const seedActorIds = actors.filter((a) => seedIds.has(a.category_id)).map((a) => a.id);
  write(KEYS.categories, cats.filter((c) => !seedIds.has(c.id)));
  write(KEYS.actors, actors.filter((a) => !seedIds.has(a.category_id)));
  if (seedActorIds.length) {
    write(KEYS.votes, read(KEYS.votes, []).filter((v) => !seedActorIds.includes(v.actor_id)));
  }
}

export function seedIfEmpty() {
  const cats = read(KEYS.categories, []);
  const version = Number(read(KEYS.seedVersion, 0)) || 0;

  if (cats.length === 0) {
    plantSeed();
    return true;
  }
  if (version < SEED_VERSION) {
    removeSeedCategories();
    plantSeed();
    return true;
  }
  return false;
}

// --- Categorías ---
function resolveCoverUrl(cat, actors) {
  if (cat.cover_url) return cat.cover_url;
  const catActors = actors.filter((a) => a.category_id === cat.id);
  if (cat.cover_name) {
    const match = catActors.find((a) => a.name === cat.cover_name && a.photo_url);
    if (match) return match.photo_url;
  }
  return catActors.find((a) => a.photo_url)?.photo_url ?? null;
}

export function listCategories() {
  seedIfEmpty();
  const cats = read(KEYS.categories, []);
  const actors = read(KEYS.actors, []);
  return cats
    .map((c) => ({
      ...c,
      cover_url: resolveCoverUrl(c, actors),
      actor_count: actors.filter((a) => a.category_id === c.id).length,
    }))
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export function listCategoriesWithVotes() {
  seedIfEmpty();
  const cats = read(KEYS.categories, []);
  const actors = read(KEYS.actors, []);
  const votes = read(KEYS.votes, []);
  return cats
    .map((c) => {
      const catActors = actors.filter((a) => a.category_id === c.id);
      const actorIds = new Set(catActors.map((a) => a.id));
      const vote_count = votes.filter((v) => actorIds.has(v.actor_id)).length;
      return {
        ...c,
        cover_url: resolveCoverUrl(c, actors),
        actor_count: catActors.length,
        vote_count,
      };
    })
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export function getCategory(id) {
  seedIfEmpty();
  const cats = read(KEYS.categories, []);
  return cats.find((c) => c.id === Number(id)) ?? null;
}

export function createCategory(name, description) {
  const cats = read(KEYS.categories, []);
  const cat = { id: nextId(cats), name, description: description || null, created_at: now() };
  write(KEYS.categories, [cat, ...cats]);
  return cat;
}

export function updateCategory(id, name, description) {
  const cats = read(KEYS.categories, []);
  const idx = cats.findIndex((c) => c.id === Number(id));
  if (idx === -1) return null;
  cats[idx] = { ...cats[idx], name, description: description || null };
  write(KEYS.categories, cats);
  return cats[idx];
}

export function deleteCategory(id) {
  const idNum = Number(id);
  const actors = read(KEYS.actors, []);
  const actorIds = actors.filter((a) => a.category_id === idNum).map((a) => a.id);
  write(KEYS.actors, actors.filter((a) => a.category_id !== idNum));
  if (actorIds.length) {
    const votes = read(KEYS.votes, []);
    write(KEYS.votes, votes.filter((v) => !actorIds.includes(v.actor_id)));
  }
  write(KEYS.categories, read(KEYS.categories, []).filter((c) => c.id !== idNum));
}

// --- Actores ---
export function listActors(categoryId) {
  seedIfEmpty();
  const actors = read(KEYS.actors, []);
  const votes = read(KEYS.votes, []);
  return actors
    .filter((a) => a.category_id === Number(categoryId))
    .map((a) => {
      const v = votes.filter((x) => x.actor_id === a.id);
      const total = v.length;
      const sum = v.reduce((s, x) => s + Number(x.score), 0);
      return {
        ...a,
        vote_count: total,
        avg_score: total ? sum / total : 0,
      };
    })
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

export function getActor(id) {
  seedIfEmpty();
  const actors = read(KEYS.actors, []);
  return actors.find((a) => a.id === Number(id)) ?? null;
}

export function createActor(categoryId, name, role, photoUrl) {
  const actors = read(KEYS.actors, []);
  const actor = {
    id: nextId(actors),
    category_id: Number(categoryId),
    name,
    role: role || null,
    photo_url: photoUrl || null,
    created_at: now(),
  };
  write(KEYS.actors, [actor, ...actors]);
  return actor;
}

export function updateActor(id, name, role, photoUrl) {
  const actors = read(KEYS.actors, []);
  const idx = actors.findIndex((a) => a.id === Number(id));
  if (idx === -1) return null;
  actors[idx] = {
    ...actors[idx],
    name,
    role: role || null,
    photo_url: photoUrl != null ? photoUrl : actors[idx].photo_url,
  };
  write(KEYS.actors, actors);
  return actors[idx];
}

export function deleteActor(id) {
  const idNum = Number(id);
  write(KEYS.actors, read(KEYS.actors, []).filter((a) => a.id !== idNum));
  write(KEYS.votes, read(KEYS.votes, []).filter((v) => v.actor_id !== idNum));
}

// --- Votos ---
export function listVotesForActor(actorId) {
  seedIfEmpty();
  const votes = read(KEYS.votes, []);
  return votes
    .filter((v) => v.actor_id === Number(actorId))
    .map((v) => ({ username: v.username, score: v.score }));
}

export function replaceVotesForActor(actorId, votes) {
  const idNum = Number(actorId);
  const all = read(KEYS.votes, []).filter((v) => v.actor_id !== idNum);
  for (const { username, score } of votes) {
    all.push({
      id: nextId(all),
      actor_id: idNum,
      username: String(username).toLowerCase(),
      score: Number(score),
      created_at: now(),
    });
  }
  write(KEYS.votes, all);
  return votes.length;
}

export function getVoteStats(actorId) {
  seedIfEmpty();
  const actor = getActor(actorId);
  const votes = read(KEYS.votes, []).filter((v) => v.actor_id === Number(actorId));
  const distribution = Array(11).fill(0);
  for (const v of votes) distribution[Number(v.score)] = (distribution[Number(v.score)] || 0) + 1;
  const total = votes.length;
  const sum = votes.reduce((s, v) => s + Number(v.score), 0);
  return { actor, distribution, total, average: total ? sum / total : 0 };
}

// --- Actor activo (votación en curso) ---
export function getActiveActorId() {
  const s = read(KEYS.settings, {});
  return s.active_actor_id ? Number(s.active_actor_id) : null;
}

export function setActiveActor(id) {
  const s = read(KEYS.settings, {});
  s.active_actor_id = Number(id);
  write(KEYS.settings, s);
}

export function clearActiveActor() {
  const s = read(KEYS.settings, {});
  delete s.active_actor_id;
  write(KEYS.settings, s);
}

export function getActiveActor() {
  const id = getActiveActorId();
  return id ? getActor(id) : null;
}

// --- Backup / restore ---
export function exportData() {
  return {
    categories: read(KEYS.categories, []),
    actors: read(KEYS.actors, []),
    votes: read(KEYS.votes, []),
    settings: read(KEYS.settings, {}),
  };
}

export function importData(data) {
  if (data?.categories) write(KEYS.categories, data.categories);
  if (data?.actors) write(KEYS.actors, data.actors);
  if (data?.votes) write(KEYS.votes, data.votes);
  if (data?.settings) write(KEYS.settings, data.settings);
}

export function clearAll() {
  localStorage.removeItem(KEYS.categories);
  localStorage.removeItem(KEYS.actors);
  localStorage.removeItem(KEYS.votes);
  localStorage.removeItem(KEYS.settings);
  localStorage.removeItem(KEYS.seeded);
}
