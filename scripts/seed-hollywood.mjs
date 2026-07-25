// Busca fotos de actrices famosas vía la API de Wikipedia/Wikimedia,
// genera data/seed-hollywood.json y lo carga en la base de datos.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = resolve(__dirname, '..', 'seeds', 'seed-hollywood.json');

const ACTRESSES = [
  { title: 'Meryl_Streep',        name: 'Meryl Streep',        role: 'Miranda Priestly (El diablo viste de Prada)' },
  { title: 'Scarlett_Johansson',  name: 'Scarlett Johansson',  role: 'Black Widow (Marvel)' },
  { title: 'Angelina_Jolie',     name: 'Angelina Jolie',      role: 'Lara Croft (Tomb Raider)' },
  { title: 'Jennifer_Lawrence',   name: 'Jennifer Lawrence',   role: 'Katniss Everdeen (Los Juegos del Hambre)' },
  { title: 'Natalie_Portman',     name: 'Natalie Portman',      role: 'Nina Sayers (El cisne negro)' },
  { title: 'Margot_Robbie',      name: 'Margot Robbie',       role: 'Harley Quinn (DC)' },
  { title: 'Zendaya',             name: 'Zendaya',             role: 'MJ (Spider-Man)' },
  { title: 'Emma_Stone',          name: 'Emma Stone',          role: 'Mia (La La Land)' },
  { title: 'Cate_Blanchett',      name: 'Cate Blanchett',      role: 'Galadriel (El Señor de los Anillos)' },
  { title: 'Viola_Davis',         name: 'Viola Davis',         role: 'Aibileen (The Help)' },
];

async function fetchPhotoUrl(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'votos-marta-seed/1.0 (https://example.com)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${title}`);
  const data = await res.json();
  const photo = data.originalimage?.source || data.thumbnail?.source || null;
  return photo;
}

async function buildSeed() {
  console.log('Buscando fotos en Wikipedia/Wikimedia...');
  const actors = [];
  for (const a of ACTRESSES) {
    try {
      const photo_url = await fetchPhotoUrl(a.title);
      actors.push({ name: a.name, role: a.role, photo_url });
      console.log(`  ✓ ${a.name} -> ${photo_url ? 'foto OK' : 'sin foto'}`);
    } catch (e) {
      console.error(`  ✗ ${a.name}: ${e.message}`);
      actors.push({ name: a.name, role: a.role, photo_url: null });
    }
  }
  const seed = {
    category: {
      name: 'Actrices más famosas de Hollywood',
      description: 'Selección de actrices icónicas de Hollywood. Fotos desde Wikimedia Commons.',
    },
    actors,
  };
  return seed;
}

async function main() {
  // 1. Generar el JSON (o reutilizarlo si ya existe con --reuse)
  const reuse = process.argv.includes('--reuse');
  let seed;
  if (reuse && existsSync(SEED_FILE)) {
    seed = JSON.parse(readFileSync(SEED_FILE, 'utf-8'));
    console.log(`Reutilizando ${SEED_FILE}`);
  } else {
    seed = await buildSeed();
    writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
    console.log(`JSON guardado en ${SEED_FILE}`);
  }

  // 2. Cargar el JSON en la base de datos
  const db = await import('../src/lib/db.mjs');
  const cat = await db.createCategory(seed.category.name, seed.category.description);
  console.log(`Categoría creada con id ${cat.id}: ${cat.name}`);
  for (const a of seed.actors) {
    await db.createActor(cat.id, a.name, a.role, a.photo_url);
    console.log(`  + actor: ${a.name}`);
  }
  console.log(`\nHecho. ${seed.actors.length} actrices cargadas en la categoría "${cat.name}".`);
  console.log(`Míralo en http://localhost:4321/admin/categorias/${cat.id}`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
