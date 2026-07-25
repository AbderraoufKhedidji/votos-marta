import { sql } from '@vercel/postgres';

export async function setupDatabase() {
  console.log('Creando tablas si no existen...');
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS actors (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      photo_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (actor_id, username)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_actors_category ON actors(category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_votes_actor ON votes(actor_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `;
  console.log('Esquema creado correctamente.');
}

if (!process.env.POSTGRES_URL) {
  console.log('Modo local: no se necesita crear esquema (almacenamiento en disco en data/db.json).');
  console.log('Para usar Postgres, define POSTGRES_URL y vuelve a ejecutar este script.');
  process.exit(0);
}

setupDatabase().catch((err) => {
  console.error('Error creando esquema:', err);
  process.exit(1);
});
