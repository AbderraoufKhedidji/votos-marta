// Genera seeds/seed-hollywood.json con varias categorías y fotos
// (thumbnails 330px) vía la API de Wikipedia/Wikimedia. No toca ninguna BD.

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = resolve(__dirname, '..', 'seeds', 'seed-hollywood.json');

const CATEGORIES = [
  {
    name: 'Actrices más famosas: Hollywood y España',
    description: 'Selección de actrices icónicas de Hollywood y del cine español. Fotos desde Wikimedia Commons.',
    actors: [
      // Hollywood
      { title: 'Meryl Streep', name: 'Meryl Streep', role: 'Miranda Priestly (El diablo viste de Prada)' },
      { title: 'Scarlett Johansson', name: 'Scarlett Johansson', role: 'Black Widow (Marvel)' },
      { title: 'Angelina Jolie', name: 'Angelina Jolie', role: 'Lara Croft (Tomb Raider)' },
      { title: 'Jennifer Lawrence', name: 'Jennifer Lawrence', role: 'Katniss Everdeen (Los Juegos del Hambre)' },
      { title: 'Natalie Portman', name: 'Natalie Portman', role: 'Nina Sayers (El cisne negro)' },
      { title: 'Margot Robbie', name: 'Margot Robbie', role: 'Harley Quinn (DC)' },
      { title: 'Zendaya', name: 'Zendaya', role: 'MJ (Spider-Man)' },
      { title: 'Emma Stone', name: 'Emma Stone', role: 'Mia (La La Land)' },
      { title: 'Cate Blanchett', name: 'Cate Blanchett', role: 'Galadriel (El Señor de los Anillos)' },
      { title: 'Viola Davis', name: 'Viola Davis', role: 'Aibileen (The Help)' },
      { title: 'Anne Hathaway', name: 'Anne Hathaway', role: 'Fantine (Los miserables)' },
      { title: 'Charlize Theron', name: 'Charlize Theron', role: 'Furiosa (Mad Max: Fury Road)' },
      { title: 'Emma Watson', name: 'Emma Watson', role: 'Hermione Granger (Harry Potter)' },
      { title: 'Keira Knightley', name: 'Keira Knightley', role: 'Elizabeth Bennet (Orgullo y prejuicio)' },
      { title: 'Reese Witherspoon', name: 'Reese Witherspoon', role: 'Elle Woods (Legalmente rubia)' },
      { title: 'Julia Roberts', name: 'Julia Roberts', role: 'Vivian (Pretty Woman)' },
      { title: 'Sandra Bullock', name: 'Sandra Bullock', role: 'Leigh Anne (The Blind Side)' },
      { title: 'Nicole Kidman', name: 'Nicole Kidman', role: 'Satine (Moulin Rouge)' },
      { title: 'Amy Adams', name: 'Amy Adams', role: 'Giselle (Encantada)' },
      { title: 'Jessica Chastain', name: 'Jessica Chastain', role: 'Maya (La noche más oscura)' },
      { title: 'Brie Larson', name: 'Brie Larson', role: 'Ma (Room)' },
      { title: 'Saoirse Ronan', name: 'Saoirse Ronan', role: 'Jo March (Mujercitas)' },
      { title: 'Florence Pugh', name: 'Florence Pugh', role: 'Amy March (Mujercitas)' },
      { title: 'Anya Taylor-Joy', name: 'Anya Taylor-Joy', role: 'Beth Harmon (Gambito de dama)' },
      { title: 'Alicia Vikander', name: 'Alicia Vikander', role: 'Gerda (La chica danesa)' },
      { title: 'Elizabeth Olsen', name: 'Elizabeth Olsen', role: 'Wanda Maximoff (Marvel)' },
      { title: 'Gal Gadot', name: 'Gal Gadot', role: 'Wonder Woman (DC)' },
      { title: 'Ana de Armas', name: 'Ana de Armas', role: 'Marta Cabrera (Knives Out)' },
      { title: 'Rachel McAdams', name: 'Rachel McAdams', role: 'Allie (El diario de Noah)' },
      { title: 'Kate Winslet', name: 'Kate Winslet', role: 'Rose (Titanic)' },
      { title: 'Jennifer Connelly', name: 'Jennifer Connelly', role: 'Alicia Nash (Una mente maravillosa)' },
      { title: 'Michelle Williams (actress)', name: 'Michelle Williams', role: 'Marilyn Monroe (My Week with Marilyn)' },
      { title: 'Kristen Stewart', name: 'Kristen Stewart', role: 'Bella Swan (Crepúsculo)' },
      { title: 'Salma Hayek', name: 'Salma Hayek', role: 'Frida Kahlo (Frida)' },
      { title: 'Halle Berry', name: 'Halle Berry', role: "Leticia (Monster's Ball)" },
      { title: 'Zoe Saldana', name: 'Zoe Saldana', role: 'Neytiri (Avatar)' },
      { title: 'Marion Cotillard', name: 'Marion Cotillard', role: 'Édith Piaf (La vida en rosa)' },
      { title: 'Léa Seydoux', name: 'Léa Seydoux', role: 'Madeleine Swann (Spectre)' },
      { title: 'Monica Bellucci', name: 'Monica Bellucci', role: 'Persephone (Matrix Reloaded)' },
      // Españolas
      { title: 'Penélope Cruz', name: 'Penélope Cruz', role: 'Raimunda (Volver)' },
      { title: 'Paz Vega', name: 'Paz Vega', role: 'Lucía (Lucía y el sexo)' },
      { title: 'Victoria Abril', name: 'Victoria Abril', role: 'Ana (Átame)' },
      { title: 'Carmen Maura', name: 'Carmen Maura', role: 'Pepa (Mujeres al borde de un ataque de nervios)' },
      { title: 'Maribel Verdú', name: 'Maribel Verdú', role: 'Luisa (Y tu mamá también)' },
      { title: 'Elena Anaya', name: 'Elena Anaya', role: 'Vera (La piel que habito)' },
      { title: 'Ariadna Gil', name: 'Ariadna Gil', role: 'Violeta (Belle Époque)' },
      { title: 'Aitana Sánchez-Gijón', name: 'Aitana Sánchez-Gijón', role: 'Nadie hablará de nosotras cuando hayamos muerto' },
      { title: 'Pilar López de Ayala', name: 'Pilar López de Ayala', role: 'Juana I de Castilla (Juana la Loca)' },
      { title: 'Adriana Ugarte', name: 'Adriana Ugarte', role: 'Vera (Durante la tormenta)' },
      { title: 'Belén Rueda', name: 'Belén Rueda', role: 'Laura (El orfanato)' },
      { title: 'Clara Lago', name: 'Clara Lago', role: 'Carol (Ocho apellidos catalanes)' },
      { title: 'Úrsula Corberó', name: 'Úrsula Corberó', role: 'Tokio (La casa de papel)' },
      { title: 'Blanca Suárez', name: 'Blanca Suárez', role: 'Leticia (El internado)' },
    ],
  },
  {
    name: 'Actores más famosos: Hollywood y España',
    description: 'Selección de actores icónicos de Hollywood y del cine español. Fotos desde Wikimedia Commons.',
    actors: [
      // Hollywood / internacionales
      { title: 'Leonardo DiCaprio', name: 'Leonardo DiCaprio', role: 'Jack Dawson (Titanic)' },
      { title: 'Brad Pitt', name: 'Brad Pitt', role: 'Tyler Durden (El club de la lucha)' },
      { title: 'Tom Cruise', name: 'Tom Cruise', role: 'Ethan Hunt (Misión Imposible)' },
      { title: 'Johnny Depp', name: 'Johnny Depp', role: 'Jack Sparrow (Piratas del Caribe)' },
      { title: 'Robert Downey Jr.', name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man (Marvel)' },
      { title: 'Denzel Washington', name: 'Denzel Washington', role: 'Alonzo Harris (Training Day)' },
      { title: 'Morgan Freeman', name: 'Morgan Freeman', role: 'Red (Cadena perpetua)' },
      { title: 'Al Pacino', name: 'Al Pacino', role: 'Michael Corleone (El padrino)' },
      { title: 'Robert De Niro', name: 'Robert De Niro', role: 'Travis Bickle (Taxi Driver)' },
      { title: 'Tom Hanks', name: 'Tom Hanks', role: 'Forrest Gump' },
      { title: 'Will Smith', name: 'Will Smith', role: 'Agent J (Men in Black)' },
      { title: 'Dwayne Johnson', name: 'Dwayne Johnson', role: 'Luke Hobbs (Fast & Furious)' },
      { title: 'Chris Hemsworth', name: 'Chris Hemsworth', role: 'Thor (Marvel)' },
      { title: 'Chris Evans (actor)', name: 'Chris Evans', role: 'Steve Rogers / Capitán América (Marvel)' },
      { title: 'Ryan Reynolds', name: 'Ryan Reynolds', role: 'Deadpool (Marvel)' },
      { title: 'Ryan Gosling', name: 'Ryan Gosling', role: 'Sebastian (La La Land)' },
      { title: 'Timothée Chalamet', name: 'Timothée Chalamet', role: 'Paul Atreides (Dune)' },
      { title: 'Cillian Murphy', name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { title: 'Christian Bale', name: 'Christian Bale', role: 'Bruce Wayne / Batman (El caballero oscuro)' },
      { title: 'Joaquin Phoenix', name: 'Joaquin Phoenix', role: 'Arthur Fleck / Joker' },
      { title: 'Matthew McConaughey', name: 'Matthew McConaughey', role: 'Cooper (Interstellar)' },
      { title: 'Jake Gyllenhaal', name: 'Jake Gyllenhaal', role: 'Louis Bloom (Nightcrawler)' },
      { title: 'Hugh Jackman', name: 'Hugh Jackman', role: 'Wolverine (X-Men)' },
      { title: 'Keanu Reeves', name: 'Keanu Reeves', role: 'Neo (Matrix)' },
      { title: 'Idris Elba', name: 'Idris Elba', role: 'Stringer Bell (The Wire)' },
      { title: 'Pedro Pascal', name: 'Pedro Pascal', role: 'Din Djarin / The Mandalorian' },
      { title: 'Oscar Isaac', name: 'Oscar Isaac', role: 'Poe Dameron (Star Wars)' },
      { title: 'Benedict Cumberbatch', name: 'Benedict Cumberbatch', role: 'Sherlock Holmes' },
      { title: 'Michael B. Jordan', name: 'Michael B. Jordan', role: 'Killmonger (Black Panther)' },
      { title: 'Adam Driver', name: 'Adam Driver', role: 'Kylo Ren (Star Wars)' },
      { title: 'Daniel Craig', name: 'Daniel Craig', role: 'James Bond' },
      { title: 'George Clooney', name: 'George Clooney', role: 'Danny Ocean (Ocean\'s Eleven)' },
      { title: 'Matt Damon', name: 'Matt Damon', role: 'Jason Bourne' },
      { title: 'Harrison Ford', name: 'Harrison Ford', role: 'Indiana Jones' },
      { title: 'Anthony Hopkins', name: 'Anthony Hopkins', role: 'Hannibal Lecter' },
      // Españoles
      { title: 'Javier Bardem', name: 'Javier Bardem', role: 'Anton Chigurh (No es país para viejos)' },
      { title: 'Antonio Banderas', name: 'Antonio Banderas', role: 'Zorro (La máscara del Zorro)' },
      { title: 'Eduard Fernández', name: 'Eduard Fernández', role: 'Cine español' },
      { title: 'Luis Tosar', name: 'Luis Tosar', role: 'Malamadre (Celda 211)' },
      { title: 'José Coronado', name: 'José Coronado', role: 'Ricardo Delgado (El Príncipe)' },
      { title: 'Javier Cámara', name: 'Javier Cámara', role: 'Benigno (Hable con ella)' },
      { title: 'Sergi López (actor)', name: 'Sergi López', role: 'Harry (El laberinto del fauno)' },
      { title: 'Carlos Areces', name: 'Carlos Areces', role: 'Javier (La que se avecina)' },
      { title: 'Mario Casas', name: 'Mario Casas', role: 'Ángel (El bar)' },
      { title: 'Álex González (actor)', name: 'Álex González', role: 'El Príncipe' },
      { title: 'Miguel Ángel Silvestre', name: 'Miguel Ángel Silvestre', role: 'Rafael (Velvet)' },
      { title: 'Álvaro Morte', name: 'Álvaro Morte', role: 'El Profesor (La casa de papel)' },
      { title: 'Jaime Lorente', name: 'Jaime Lorente', role: 'Denver (La casa de papel)' },
      { title: 'Paco León', name: 'Paco León', role: 'Luisma (Aída)' },
      { title: 'Dani Rovira', name: 'Dani Rovira', role: 'Rafa (Ocho apellidos vascos)' },
      { title: 'Quim Gutiérrez', name: 'Quim Gutiérrez', role: 'Cine y series españolas' },
      { title: 'Raúl Arévalo', name: 'Raúl Arévalo', role: 'Tarde para la ira' },
      { title: 'Juan Diego Botto', name: 'Juan Diego Botto', role: 'Cine español' },
    ],
  },
  {
    name: 'Futbolistas más famosos',
    description: 'Selección de futbolistas icónicos de la historia reciente. Fotos desde Wikimedia Commons.',
    actors: [
      { title: 'Lionel Messi', name: 'Lionel Messi', role: 'Delantero · Argentina / Inter Miami' },
      { title: 'Cristiano Ronaldo', name: 'Cristiano Ronaldo', role: 'Delantero · Portugal / Al-Nassr' },
      { title: 'Neymar', name: 'Neymar', role: 'Delantero · Brasil' },
      { title: 'Kylian Mbappé', name: 'Kylian Mbappé', role: 'Delantero · Francia / Real Madrid' },
      { title: 'Erling Haaland', name: 'Erling Haaland', role: 'Delantero · Noruega / Manchester City' },
      { title: 'Robert Lewandowski', name: 'Robert Lewandowski', role: 'Delantero · Polonia / Barcelona' },
      { title: 'Karim Benzema', name: 'Karim Benzema', role: 'Delantero · Francia' },
      { title: 'Zinedine Zidane', name: 'Zinedine Zidane', role: 'Centrocampista · Francia' },
      { title: 'Ronaldinho', name: 'Ronaldinho', role: 'Centrocampista · Brasil' },
      { title: 'Pelé', name: 'Pelé', role: 'Delantero · Brasil' },
      { title: 'Diego Maradona', name: 'Diego Maradona', role: 'Centrocampista · Argentina' },
      { title: 'Ronaldo (Brazilian footballer)', name: 'Ronaldo Nazário', role: 'Delantero · Brasil' },
      { title: 'Thierry Henry', name: 'Thierry Henry', role: 'Delantero · Francia' },
      { title: 'David Beckham', name: 'David Beckham', role: 'Centrocampista · Inglaterra' },
      { title: 'Luka Modrić', name: 'Luka Modrić', role: 'Centrocampista · Croacia / Real Madrid' },
      { title: 'Kevin De Bruyne', name: 'Kevin De Bruyne', role: 'Centrocampista · Bélgica / Manchester City' },
      { title: 'Mohamed Salah', name: 'Mohamed Salah', role: 'Delantero · Egipto / Liverpool' },
      { title: 'Virgil van Dijk', name: 'Virgil van Dijk', role: 'Defensa · Países Bajos / Liverpool' },
      { title: 'Manuel Neuer', name: 'Manuel Neuer', role: 'Portero · Alemania / Bayern Múnich' },
      { title: 'Gianluigi Buffon', name: 'Gianluigi Buffon', role: 'Portero · Italia' },
      { title: 'Iker Casillas', name: 'Iker Casillas', role: 'Portero · España' },
      { title: 'Xavi Hernández', name: 'Xavi Hernández', role: 'Centrocampista · España' },
      { title: 'Andrés Iniesta', name: 'Andrés Iniesta', role: 'Centrocampista · España' },
      { title: 'Sergio Ramos', name: 'Sergio Ramos', role: 'Defensa · España' },
      { title: 'Gerard Piqué', name: 'Gerard Piqué', role: 'Defensa · España' },
      { title: 'Fernando Torres', name: 'Fernando Torres', role: 'Delantero · España' },
      { title: 'David Villa', name: 'David Villa', role: 'Delantero · España' },
      { title: 'Raúl (footballer)', name: 'Raúl González', role: 'Delantero · España' },
      { title: 'Álvaro Morata', name: 'Álvaro Morata', role: 'Delantero · España' },
      { title: 'Pedri', name: 'Pedri', role: 'Centrocampista · España / Barcelona' },
      { title: 'Gavi (footballer)', name: 'Gavi', role: 'Centrocampista · España / Barcelona' },
      { title: 'Lamine Yamal', name: 'Lamine Yamal', role: 'Extremo · España / Barcelona' },
      { title: 'Vinícius Júnior', name: 'Vinícius Júnior', role: 'Extremo · Brasil / Real Madrid' },
      { title: 'Jude Bellingham', name: 'Jude Bellingham', role: 'Centrocampista · Inglaterra / Real Madrid' },
      { title: 'Harry Kane', name: 'Harry Kane', role: 'Delantero · Inglaterra / Bayern Múnich' },
      { title: 'Antoine Griezmann', name: 'Antoine Griezmann', role: 'Delantero · Francia / Atlético de Madrid' },
      { title: 'Luis Suárez', name: 'Luis Suárez', role: 'Delantero · Uruguay' },
      { title: 'Eden Hazard', name: 'Eden Hazard', role: 'Extremo · Bélgica' },
      { title: 'Paulo Dybala', name: 'Paulo Dybala', role: 'Delantero · Argentina' },
      { title: 'Gareth Bale', name: 'Gareth Bale', role: 'Extremo · Gales' },
      { title: 'Steven Gerrard', name: 'Steven Gerrard', role: 'Centrocampista · Inglaterra' },
      { title: 'Frank Lampard', name: 'Frank Lampard', role: 'Centrocampista · Inglaterra' },
      { title: 'Andrea Pirlo', name: 'Andrea Pirlo', role: 'Centrocampista · Italia' },
      { title: 'Francesco Totti', name: 'Francesco Totti', role: 'Delantero · Italia' },
      { title: 'Kaká', name: 'Kaká', role: 'Centrocampista · Brasil' },
      { title: 'Samuel Eto\'o', name: "Samuel Eto'o", role: 'Delantero · Camerún' },
      { title: 'Didier Drogba', name: 'Didier Drogba', role: 'Delantero · Costa de Marfil' },
      { title: 'Wayne Rooney', name: 'Wayne Rooney', role: 'Delantero · Inglaterra' },
      { title: 'Mesut Özil', name: 'Mesut Özil', role: 'Centrocampista · Alemania' },
      { title: 'N\'Golo Kanté', name: "N'Golo Kanté", role: 'Centrocampista · Francia' },
    ],
  },
];

async function fetchPhotoUrl(title) {
  for (const lang of ['en', 'es']) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'votos-marta-seed/1.0 (https://example.com)' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const photo = data.thumbnail?.source || data.originalimage?.source || null;
      if (photo) return photo;
    } catch {
      // probar siguiente idioma
    }
  }
  throw new Error(`sin foto para ${title}`);
}

async function resolveActors(list) {
  const out = [];
  for (const a of list) {
    try {
      const photo_url = await fetchPhotoUrl(a.title);
      out.push({ name: a.name, role: a.role, photo_url });
      console.log(`  ✓ ${a.name} -> foto OK`);
    } catch (e) {
      console.error(`  ✗ ${a.name}: ${e.message}`);
      out.push({ name: a.name, role: a.role, photo_url: null });
    }
  }
  return out;
}

async function buildSeed() {
  const categories = [];
  for (const cat of CATEGORIES) {
    console.log(`\n[${cat.name}] Buscando fotos (${cat.actors.length})...`);
    categories.push({
      name: cat.name,
      description: cat.description,
      actors: await resolveActors(cat.actors),
    });
  }
  return { categories };
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
    console.log(`\nJSON guardado en ${SEED_FILE}`);
  }

  const cats = seed.categories || [];
  for (const c of cats) {
    const conFoto = (c.actors || []).filter((a) => a.photo_url).length;
    console.log(`  · ${c.name}: ${c.actors.length} personas, ${conFoto} con foto`);
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
