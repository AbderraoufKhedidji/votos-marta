// Crea el esquema de la base de datos (Turso o SQLite local).
// En local no hace falta ejecutarlo (el esquema se crea solo al arrancar),
// pero es útil para inicializar Turso antes del primer deploy.

import { initSchema, isLocalMode } from '../src/lib/db.mjs';

if (isLocalMode()) {
  console.log('Modo local detectado: el esquema se crea automáticamente en data/votos.db.');
  console.log('Para inicializar Turso, define TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.');
}

try {
  await initSchema();
  console.log('Esquema creado/verificado correctamente.');
} catch (err) {
  console.error('Error creando el esquema:', err);
  process.exit(1);
}
