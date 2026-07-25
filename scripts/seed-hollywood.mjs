// Busca fotos de actrices famosas vía la API de Wikipedia/Wikimedia,
// genera seeds/seed-hollywood.json. No toca ninguna base de datos.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = resolve(__dirname, '..', 'seeds', 'seed-hollywood.json');

const ACTRESSES = [
  // --- Hollywood ---
  { title: 'Meryl Streep',          name: 'Meryl Streep',          role: 'Miranda Priestly (El diablo viste de Prada)' },
  { title: 'Scarlett Johansson',    name: 'Scarlett Johansson',    role: 'Black Widow (Marvel)' },
  { title: 'Angelina Jolie',        name: 'Angelina Jolie',        role: 'Lara Croft (Tomb Raider)' },
  { title: 'Jennifer Lawrence',     name: 'Jennifer Lawrence',     role: 'Katniss Everdeen (Los Juegos del Hambre)' },
  { title: 'Natalie Portman',       name: 'Natalie Portman',       role: 'Nina Sayers (El cisne negro)' },
  { title: 'Margot Robbie',         name: 'Margot Robbie',         role: 'Harley Quinn (DC)' },
  { title: 'Zendaya',               name: 'Zendaya',               role: 'MJ (Spider-Man)' },
  { title: 'Emma Stone',            name: 'Emma Stone',            role: 'Mia (La La Land)' },
  { title: 'Cate Blanchett',        name: 'Cate Blanchett',        role: 'Galadriel (El Señor de los Anillos)' },
  { title: 'Viola Davis',           name: 'Viola Davis',           role: 'Aibileen (The Help)' },
  { title: 'Anne Hathaway',         name: 'Anne Hathaway',         role: 'Fantine (Los miserables)' },
  { title: 'Charlize Theron',       name: 'Charlize Theron',       role: 'Furiosa (Mad Max: Fury Road)' },
  { title: 'Emma Watson',           name: 'Emma Watson',           role: 'Hermione Granger (Harry Potter)' },
  { title: 'Keira Knightley',       name: 'Keira Knightley',       role: 'Elizabeth Bennet (Orgullo y prejuicio)' },
  { title: 'Reese Witherspoon',     name: 'Reese Witherspoon',     role: 'Elle Woods (Legalmente rubia)' },
  { title: 'Julia Roberts',         name: 'Julia Roberts',         role: 'Vivian (Pretty Woman)' },
  { title: 'Sandra Bullock',        name: 'Sandra Bullock',        role: 'Leigh Anne (The Blind Side)' },
  { title: 'Nicole Kidman',         name: 'Nicole Kidman',         role: 'Satine (Moulin Rouge)' },
  { title: 'Amy Adams',             name: 'Amy Adams',             role: 'Giselle (Encantada)' },
  { title: 'Jessica Chastain',      name: 'Jessica Chastain',      role: 'Maya (La noche más oscura)' },
  { title: 'Brie Larson',           name: 'Brie Larson',           role: 'Ma (Room)' },
  { title: 'Saoirse Ronan',         name: 'Saoirse Ronan',         role: 'Jo March (Mujercitas)' },
  { title: 'Florence Pugh',         name: 'Florence Pugh',         role: 'Amy March (Mujercitas)' },
  { title: 'Anya Taylor-Joy',      name: 'Anya Taylor-Joy',      role: 'Beth Harmon (Gambito de dama)' },
  { title: 'Alicia Vikander',       name: 'Alicia Vikander',       role: 'Gerda (La chica danesa)' },
  { title: 'Elizabeth Olsen',       name: 'Elizabeth Olsen',       role: 'Wanda Maximoff (Marvel)' },
  { title: 'Gal Gadot',             name: 'Gal Gadot',             role: 'Wonder Woman (DC)' },
  { title: 'Ana de Armas',          name: 'Ana de Armas',          role: 'Marta Cabrera (Knives Out)' },
  { title: 'Rachel McAdams',        name: 'Rachel McAdams',        role: 'Allie (El diario de Noah)' },
  { title: 'Kate Winslet',          name: 'Kate Winslet',          role: 'Rose (Titanic)' },
  { title: 'Jennifer Connelly',     name: 'Jennifer Connelly',     role: 'Alicia Nash (Una mente maravillosa)' },
  { title: 'Michelle Williams (actress)', name: 'Michelle Williams', role: 'Marilyn Monroe (My Week with Marilyn)' },
  { title: 'Kristen Stewart',       name: 'Kristen Stewart',       role: 'Bella Swan (Crepúsculo)' },
  { title: 'Salma Hayek',           name: 'Salma Hayek',           role: 'Frida Kahlo (Frida)' },
  { title: 'Halle Berry',           name: 'Halle Berry',           role: 'Leticia (Monster\'s Ball)' },
  { title: 'Zoe Saldana',           name: 'Zoe Saldana',           role: 'Neytiri (Avatar)' },
  { title: 'Marion Cotillard',      name: 'Marion Cotillard',      role: 'Édith Piaf (La vida en rosa)' },
  { title: 'Léa Seydoux',           name: 'Léa Seydoux',           role: 'Madeleine Swann (Spectre)' },
  { title: 'Monica Bellucci',       name: 'Monica Bellucci',       role: 'Persephone (Matrix Reloaded)' },
  // --- Españolas ---
  { title: 'Penélope Cruz',         name: 'Penélope Cruz',         role: 'Raimunda (Volver)' },
  { title: 'Paz Vega',              name: 'Paz Vega',              role: 'Lucía (Lucía y el sexo)' },
  { title: 'Victoria Abril',        name: 'Victoria Abril',        role: 'Ana (Átame)' },
  { title: 'Carmen Maura',          name: 'Carmen Maura',          role: 'Pepa (Mujeres al borde de un ataque de nervios)' },
  { title: 'Maribel Verdú',         name: 'Maribel Verdú',         role: 'Luisa (Y tu mamá también)' },
  { title: 'Elena Anaya',           name: 'Elena Anaya',           role: 'Vera (La piel que habito)' },
  { title: 'Ariadna Gil',           name: 'Ariadna Gil',           role: 'Violeta (Belle Époque)' },
  { title: 'Aitana Sánchez-Gijón',  name: 'Aitana Sánchez-Gijón',  role: 'Nadie hablará de nosotras cuando hayamos muerto' },
  { title: 'Pilar López de Ayala',  name: 'Pilar López de Ayala',  role: 'Juana I de Castilla (Juana la Loca)' },
  { title: 'Adriana Ugarte',        name: 'Adriana Ugarte',        role: 'Vera (Durante la tormenta)' },
  { title: 'Belén Rueda',           name: 'Belén Rueda',           role: 'Laura (El orfanato)' },
  { title: 'Clara Lago',            name: 'Clara Lago',            role: 'Carol (Ocho apellidos catalanes)' },
  { title: 'Úrsula Corberó',         name: 'Úrsula Corberó',        role: 'Tokio (La casa de papel)' },
  { title: 'Blanca Suárez',          name: 'Blanca Suárez',         role: 'Leticia (El internado)' },
];

async function fetchPhotoUrl(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'votos-marta-seed/1.0 (https://example.com)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${title}`);
  const data = await res.json();
  return data.originalimage?.source || data.thumbnail?.source || null;
}

async function buildSeed() {
  console.log(`Buscando fotos en Wikipedia/Wikimedia para ${ACTRESSES.length} actrices...`);
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
  return {
    category: {
      name: 'Actrices más famosas: Hollywood y España',
      description: 'Selección de actrices icónicas de Hollywood y del cine español. Fotos desde Wikimedia Commons.',
    },
    actors,
  };
}

async function main() {
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
  const conFoto = seed.actors.filter((a) => a.photo_url).length;
  console.log(`\nHecho. ${seed.actors.length} actrices, ${conFoto} con foto.`);
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
