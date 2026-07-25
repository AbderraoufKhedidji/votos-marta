# Votos Marta

Web en **Astro** para gestionar categorías de actores/actrices y puntuarlos en directo desde el chat de Twitch. Desplegable en **Vercel**.

## Funcionalidades

- Autenticación de admin (`admin` / `password` por defecto, configurables).
- CRUD de **categorías** (cada una agrupa actores/actrices).
- CRUD de **actores** con nombre, rol y **foto** (subida a Vercel Blob).
- **Actor activo**: el admin elige qué actor se está votando en cada momento.
- **Hook de Twitch** (script Node con `tmi.js`) que lee el chat del canal, extrae el primer número del **0 al 10** de cada mensaje y guarda **un único voto por usuario** (las siguientes votaciones se ignoran), asignándolo al actor activo.
- Página pública de **resultados** con medias y rankings.
- **Vista de votación en directo** (`/votar/[id]`): al hacer clic en una actriz se muestra su foto a la izquierda, una **gráfica de barras en tiempo real** y un **chat propio minimalista** a la derecha (solo lectura, solo mensajes de la gente con su color, sin escritura ni regalos). El chat es una **isla React** (`src/components/votacion/VotacionDirecto.jsx`) que se conecta al IRC de Twitch desde el navegador por WebSocket (conexión anónima, sin token) en tiempo real; no usa el embed nativo de Twitch ni requiere backend. La gráfica se actualiza en vivo contando los votos del chat en el cliente (un voto por usuario). Hay botones de **Guardar votación** (persiste el recuento en la BD), **Resetear** y **Ver votaciones** (modal con la lista de usuarios y sus notas).

## Stack

- Astro 7 (`output: server`) + adapter `@astrojs/vercel`.
- Tailwind CSS v4.
- **Base de datos: Turso (libSQL/SQLite)** — un único `src/lib/db.mjs` que en local usa un archivo SQLite (`data/votos.db`) y en Vercel usa Turso (SQLite alojado). Mismo SQL, mismo código, solo cambia la URL de conexión.
- **Fotos:** Vercel Blob en producción, o disco local (`public/uploads/`) en desarrollo.
- `tmi.js` para el hook de Twitch (opcional, graba votos en segundo plano).

## Puesta en marcha local

Hay **un único backend** (libSQL/SQLite) que se configura solo:

- **Modo local (por defecto en dev):** si no hay `TURSO_DATABASE_URL`, se usa un archivo SQLite en `data/votos.db` (se crea solo al arrancar) y las fotos en `public/uploads/`. No necesita Turso ni Blob.
- **Modo Turso (producción/Vercel):** si existe `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`), se conecta a Turso.

### Opción rápida: modo local (sin Turso)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y ajusta credenciales de admin y Twitch (opcional para el CRUD):
   ```bash
   cp .env.example .env
   ```
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El esquema de la BD se crea automáticamente la primera vez.
4. Abre http://localhost:4321/login e inicia sesión con `admin` / `password` (o los que pusiste en `.env`).
5. (Opcional) Lanza el hook de Twitch para recibir votos:
   ```bash
   npm run twitch-hook
   ```

> En modo local **no hace falta** ejecutar `npm run db:setup` (el esquema se crea solo al arrancar).

### Datos de ejemplo (seed)

Para cargar una categoría de ejemplo con 10 actrices famosas de Hollywood (las fotos se buscan solas vía la API de Wikimedia y se guardan como URL en `seeds/seed-hollywood.json`, luego se insertan en la bd):

```bash
npm run seed:hollywood
```

- La primera vez descarga las URLs de foto y crea `seeds/seed-hollywood.json`.
- Para volver a insertar sin descargar (reutilizando el JSON): `npm run seed:hollywood -- --reuse`.
- Puedes editar `seeds/seed-hollywood.json` a mano y volver a ejecutar con `--reuse` para cargar tus propios datos.

### Opción con Turso (para probar producción en local)

1. Crea una base de datos en https://turso.app (gratis) y obtén la URL (`libsql://...`) y un token.
2. Pon en `.env`:
   ```
   TURSO_DATABASE_URL=libsql://<tu-db>.turso.io
   TURSO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Crea el esquema en Turso:
   ```bash
   npm run db:setup
   ```
4. Arranca:
   ```bash
   npm run dev
   ```

## Obtener el token de Twitch

1. Entra en https://twitchapps.com/tmi/ y autoriza.
2. Copia el token (formato `oauth:xxxx...`).
3. Ponlo en `TWITCH_OAUTH_TOKEN`.
4. `TWITCH_USERNAME` debe ser el nombre de la cuenta bot (o la tuya) y `TWITCH_CHANNEL` el canal a escuchar (por defecto `darkmius`).

## Despliegue en Vercel

1. Sube el repo a GitHub (Vercel lo detecta automáticamente gracias al adapter de Astro).
2. Importa el proyecto en Vercel.
3. **Crea la base de datos Turso** (la forma más fácil es desde el marketplace de Vercel):
   - En Vercel: **Storage → Marketplace → Turso → Create database**.
   - Esto inyecta automáticamente `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en las variables de entorno del proyecto.
   - (Alternativa: crea la BD en https://turso.app y copia la URL y el token a mano en las variables de entorno).
4. **Crea Vercel Blob** (para las fotos de los actores):
   - En Vercel: **Storage → Create → Blob**. Se inyecta `BLOB_READ_WRITE_TOKEN`.
5. Añade las variables de entorno restantes:
   - `ADMIN_USER`, `ADMIN_PASSWORD`
   - `TWITCH_CHANNEL`, `TWITCH_USERNAME`, `TWITCH_OAUTH_TOKEN` (solo si vas a usar el hook)
6. Crea el esquema en Turso (una vez). Desde tu máquina, con las variables cargadas:
   ```bash
   vercel env pull .env.local
   npm run db:setup
   ```
   (O ejecuta `npm run db:setup` en cualquier entorno donde estén las variables de Turso).
7. Despliega. La web queda en tu URL de Vercel.

> El **hook de Twitch** necesita una conexión IRC persistente, así que **no** se ejecuta dentro de Vercel Serverless. Ejecútalo en tu máquina, un VPS, Railway, Render, Fly.io, etc. Apunta a la misma `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` para que los votos se guarden en la BD compartida. (No es necesario para la vista en directo, que cuenta los votos en el navegador.)

## Estructura

```
src/
  lib/
    auth.mjs        # sesión cookie firmada (admin/password)
    db.mjs          # backend único libSQL/SQLite (Turso o archivo local)
    photos.mjs      # subida de fotos: Vercel Blob o disco local
  hooks/
    useTwitchChat.js  # lee el chat de Twitch en el cliente (WebSocket al IRC, anónimo)
  components/
    votacion/VotacionDirecto.jsx  # isla React: gráfica + chat + votos + guardar/reset/ver
  middleware.mjs    # protege rutas /admin y /api/* salvo públicas
  layouts/Base.astro
  pages/
    index.astro            # home pública
    login.astro
    logout.js
    admin/                 # panel (protegido)
      index.astro
      categorias/
        nueva.astro
        [id]/index.astro
        [id]/editar.astro
        [id]/nuevo-actor.astro
        [id]/actores/[actorId]/editar.astro
    resultados/
      index.astro
      [id].astro
    votar/
      [id].astro            # vista de votación en directo (actriz + gráfica + chat Twitch)
    api/
      login.js
      categorias/index.js  [id].js
      actores/index.js  [id].js  [id]/activar.js  [id]/desactivar.js
      votos/[id].js               # estadísticas de votos en vivo (JSON, para la gráfica)
      votos/[id]/guardar.js       # guardar/resetear la votación de un actor (admin)
scripts/setup-db.mjs        # crea el esquema en Turso (en local se crea solo)
scripts/seed-hollywood.mjs  # busca fotos en Wikimedia y carga actrices de ejemplo
twitch-hook/index.mjs       # bot de chat (tmi.js, opcional, no en Vercel)
seeds/seed-hollywood.json   # JSON seed con la categoría y 10 actrices (editable)
data/votos.db               # base de datos local SQLite (dev, gitignored)
public/uploads/             # fotos subidas en modo local (gitignored)
```

## Notas

- La regla de "un voto por usuario" es **global** (un usuario solo puede votar una vez en toda la vida, no por actor). Si quieres reiniciar las votaciones, borra la tabla `votes` o añade un endpoint de admin.
- La puntuación se extrae como el primer número entero del 0 al 10 encontrado en el mensaje.
