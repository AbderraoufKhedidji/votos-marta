import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '..', '..', 'data', 'db.json');

const DEFAULT_DB = {
  categories: [],
  actors: [],
  votes: [],
  settings: {},
  nextId: { category: 1, actor: 1, vote: 1 },
};

function ensureFile() {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

function read() {
  ensureFile();
  try {
    const db = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    if (!db.settings) db.settings = {};
    db.nextId = { category: 1, actor: 1, vote: 1, ...(db.nextId || {}) };
    return db;
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

function write(db) {
  ensureFile();
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const now = () => new Date().toISOString();

// --- Categorías ---
export async function listCategories() {
  const db = read();
  return db.categories
    .map((c) => ({
      ...c,
      actor_count: db.actors.filter((a) => a.category_id === c.id).length,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function listCategoriesWithVotes() {
  const db = read();
  return db.categories
    .map((c) => {
      const actorIds = db.actors.filter((a) => a.category_id === c.id).map((a) => a.id);
      const voteCount = db.votes.filter((v) => actorIds.includes(v.actor_id)).length;
      return {
        ...c,
        actor_count: actorIds.length,
        vote_count: voteCount,
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getCategory(id) {
  const db = read();
  return db.categories.find((c) => c.id === Number(id)) ?? null;
}

export async function createCategory(name, description) {
  const db = read();
  const id = db.nextId.category++;
  const cat = { id, name, description, created_at: now() };
  db.categories.push(cat);
  write(db);
  return cat;
}

export async function updateCategory(id, name, description) {
  const db = read();
  const cat = db.categories.find((c) => c.id === Number(id));
  if (!cat) return null;
  cat.name = name;
  cat.description = description;
  write(db);
  return cat;
}

export async function deleteCategory(id) {
  const db = read();
  const actorIds = db.actors
    .filter((a) => a.category_id === Number(id))
    .map((a) => a.id);
  db.categories = db.categories.filter((c) => c.id !== Number(id));
  db.actors = db.actors.filter((a) => a.category_id !== Number(id));
  db.votes = db.votes.filter((v) => !actorIds.includes(v.actor_id));
  write(db);
}

// --- Actores ---
export async function listActors(categoryId) {
  const db = read();
  return db.actors
    .filter((a) => a.category_id === Number(categoryId))
    .map((a) => {
      const votes = db.votes.filter((v) => v.actor_id === a.id);
      const avg = votes.length ? votes.reduce((s, v) => s + v.score, 0) / votes.length : 0;
      return { ...a, vote_count: votes.length, avg_score: avg };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getActor(id) {
  const db = read();
  return db.actors.find((a) => a.id === Number(id)) ?? null;
}

export async function createActor(categoryId, name, role, photoUrl) {
  const db = read();
  const id = db.nextId.actor++;
  const actor = {
    id,
    category_id: Number(categoryId),
    name,
    role,
    photo_url: photoUrl,
    created_at: now(),
  };
  db.actors.push(actor);
  write(db);
  return actor;
}

export async function updateActor(id, name, role, photoUrl) {
  const db = read();
  const actor = db.actors.find((a) => a.id === Number(id));
  if (!actor) return null;
  actor.name = name;
  actor.role = role;
  if (photoUrl) actor.photo_url = photoUrl;
  write(db);
  return actor;
}

export async function deleteActor(id) {
  const db = read();
  db.actors = db.actors.filter((a) => a.id !== Number(id));
  db.votes = db.votes.filter((v) => v.actor_id !== Number(id));
  write(db);
}

// --- Votos ---
export async function addVote(actorId, username, score) {
  const db = read();
  const exists = db.votes.some(
    (v) => v.actor_id === Number(actorId) && v.username.toLowerCase() === String(username).toLowerCase()
  );
  if (exists) return false;
  const id = db.nextId.vote++;
  db.votes.push({
    id,
    actor_id: Number(actorId),
    username: String(username).toLowerCase(),
    score: Number(score),
    created_at: now(),
  });
  write(db);
  return true;
}

export async function listVotes() {
  const db = read();
  return db.votes
    .map((v) => {
      const a = db.actors.find((x) => x.id === v.actor_id);
      const c = db.categories.find((x) => x.id === a?.category_id);
      return { ...v, actor_name: a?.name ?? null, category_name: c?.name ?? null };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function clearVotes() {
  const db = read();
  db.votes = [];
  write(db);
}

export async function listVotesForActor(actorId) {
  const db = read();
  return db.votes
    .filter((v) => v.actor_id === Number(actorId))
    .map((v) => ({ username: v.username, score: v.score }));
}

export async function replaceVotesForActor(actorId, votes) {
  const db = read();
  db.votes = db.votes.filter((v) => v.actor_id !== Number(actorId));
  for (const { username, score } of votes) {
    const id = db.nextId.vote++;
    db.votes.push({
      id,
      actor_id: Number(actorId),
      username: String(username).toLowerCase(),
      score: Number(score),
      created_at: now(),
    });
  }
  write(db);
  return votes.length;
}

// --- Settings ---
export async function getSetting(key) {
  const db = read();
  return db.settings[key] ?? null;
}

export async function setSetting(key, value) {
  const db = read();
  db.settings[key] = String(value);
  write(db);
}

export async function getActiveActor() {
  const id = await getSetting('active_actor_id');
  if (!id) return null;
  return getActor(Number(id));
}

// Estadísticas de votos de un actor (para la vista de votación en directo)
export async function getVoteStats(actorId) {
  const db = read();
  const actor = db.actors.find((a) => a.id === Number(actorId)) ?? null;
  const votes = db.votes.filter((v) => v.actor_id === Number(actorId));
  const distribution = Array(11).fill(0);
  for (const v of votes) distribution[v.score]++;
  const total = votes.length;
  const sum = votes.reduce((s, v) => s + v.score, 0);
  const average = total ? sum / total : 0;
  return { actor, distribution, total, average };
}

export function isLocalMode() {
  return true;
}
