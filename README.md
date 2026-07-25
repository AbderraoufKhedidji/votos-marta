# Votos Marta

Web en **Astro** para gestionar categorías de actores/actrices y puntuarlos en directo desde el chat de Twitch. Desplegable en **Vercel**.

## Funcionalidades

- Autenticación de admin (`admin` / `password` por defecto, configurables).
- CRUD de **categorías** (cada una agrupa actores/actrices).
- CRUD de **actores** con nombre, rol y **foto** (subida a Vercel Blob).
- **Actor activo**: el admin elige qué actor se está votando en cada momento.
- **Hook de Twitch** (script Node con `tmi.js`) que lee el chat del canal, extrae el primer número del **0 al 10** de cada mensaje y guarda **un único voto por usuario** (las siguientes votaciones se ignoran), asignándolo al actor activo.
- Página pública de **resultados** con medias y rankings.
- **Vista de votación en directo** (`/votar/[id]`): al hacer clic en una actriz se muestra su foto a la izquierda, una **gráfica de barras en tiempo real** (encuesta `/api/votos/[id]` cada segundo) y un **chat propio minimalista** a la derecha (solo lectura, solo mensajes de la gente con su color, sin escritura ni regalos). El chat es una **isla React** (`src/components/twitch/ChatDirect.jsx`) que se conecta al IRC de Twitch desde el navegador con `tmi.js` (conexión anónima, sin token) en tiempo real; no usa el embed nativo de Twitch ni requiere backend de mensajes.

## Stack

- Astro 5 (`output: server`) + adapter `@astrojs/vercel`.
- Tailwind CSS v4.
- **Almacenamiento dual:** modo local (JSON en `data/db.json` + fotos en `public/uploads/`) para desarrollo, o **Vercel Postgres** + **Vercel Blob** para producción. Se elige automáticamente según las variables de entorno.
- `tmi.js` para el hook de Twitch.

## Puesta en marcha local

Hay **dos modos** de almacenamiento, seleccionados automáticamente:

- **Modo local (por defecto en dev sin Vercel):** los datos se guardan en `data/db.json` y las fotos en `public/uploads/`. No necesita Postgres ni Blob. Ideal para probar.
- **Modo Postgres/Blob (producción):** se activa automáticamente cuando existen `POSTGRES_URL` y `BLOB_READ_WRITE_TOKEN`.

### Opción rápida: modo local (sin Vercel)

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
4. Abre http://localhost:4321/login e inicia sesión con `admin` / `password` (o los que pusiste en `.env`).
5. (Opcional) Lanza el hook de Twitch para recibir votos:
   ```bash
   npm run twitch-hook
   ```

> En modo local **no hace falta** ejecutar `npm run db:setup` (el script detecta la ausencia de `POSTGRES_URL` y no hace nada).

### Datos de ejemplo (seed)

Para cargar una categoría de ejemplo con 10 actrices famosas de Hollywood (las fotos se buscan solas vía la API de Wikimedia y se guardan como URL en `seeds/seed-hollywood.json`, luego se insertan en la bd):

```bash
npm run seed:hollywood
```

- La primera vez descarga las URLs de foto y crea `seeds/seed-hollywood.json`.
- Para volver a insertar sin descargar (reutilizando el JSON): `npm run seed:hollywood -- --reuse`.
- Puedes editar `seeds/seed-hollywood.json` a mano y volver a ejecutar con `--reuse` para cargar tus propios datos.

### Opción con Vercel Postgres + Blob

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea una base de datos **Vercel Postgres** y un store **Vercel Blob** en tu proyecto de Vercel, y enlaza las variables de entorno localmente:
   ```bash
   npm i -g vercel
   vercel link
   vercel env pull .env.local
   ```
   Esto rellena `POSTGRES_URL` y `BLOB_READ_WRITE_TOKEN`.
3. Crea el esquema en la base de datos:
   ```bash
   npm run db:setup
   ```
4. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
6. (Opcional) Lanza el hook de Twitch para empezar a recibir votos:
   ```bash
   npm run twitch-hook
   ```

## Obtener el token de Twitch

1. Entra en https://twitchapps.com/tmi/ y autoriza.
2. Copia el token (formato `oauth:xxxx...`).
3. Ponlo en `TWITCH_OAUTH_TOKEN`.
4. `TWITCH_USERNAME` debe ser el nombre de la cuenta bot (o la tuya) y `TWITCH_CHANNEL` el canal a escuchar (por defecto `darkmius`).

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en Vercel (detecta Astro automáticamente gracias al adapter).
3. En el proyecto de Vercel:
   - **Storage → Create → Postgres** (Neon). Se inyectan las variables `POSTGRES_*`.
   - **Storage → Create → Blob**. Se inyecta `BLOB_READ_WRITE_TOKEN`.
4. Añade las variables de entorno:
   - `ADMIN_USER`, `ADMIN_PASSWORD`
   - `TWITCH_CHANNEL`, `TWITCH_USERNAME`, `TWITCH_OAUTH_TOKEN`
5. Tras el primer despliegue, ejecuta una vez la creación del esquema. Puedes hacerlo desde un terminal local con `vercel env pull .env.local && npm run db:setup`, o crear un endpoint temporal.
6. Despliega. La web queda en tu URL de Vercel.

> El **hook de Twitch** necesita una conexión IRC persistente, así que **no** se ejecuta dentro de Vercel Serverless. Ejecútalo en tu máquina, un VPS, Railway, Render, Fly.io, etc. Apunta a la misma `POSTGRES_URL` de Vercel para que los votos se guarden en la BD compartida.

## Estructura

```
src/
  lib/
    auth.mjs        # sesión cookie firmada (admin/password)
    db.mjs          # dispatcher: elige backend local o Postgres
    db-local.mjs    # backend JSON en disco (dev)
    db-postgres.mjs # backend Vercel Postgres (prod)
    photos.mjs      # subida de fotos: Vercel Blob o disco local
  hooks/
    useTwitchChat.js  # lee el chat de Twitch en el cliente (tmi.js, anónimo)
  components/
    twitch/ChatDirect.jsx  # chat minimalista solo lectura (isla React)
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
      votos/[id].js        # estadísticas de votos en vivo (JSON, para la gráfica)
scripts/setup-db.mjs        # crea las tablas (solo modo Postgres)
scripts/seed-hollywood.mjs  # busca fotos en Wikimedia y carga actrices de ejemplo
twitch-hook/index.mjs       # bot de chat (tmi.js)
seeds/seed-hollywood.json   # JSON seed con la categoría y 10 actrices (editable)
data/db.json                # base de datos local (dev, gitignored)
public/uploads/             # fotos subidas en modo local (gitignored)
```

## Notas

- La regla de "un voto por usuario" es **global** (un usuario solo puede votar una vez en toda la vida, no por actor). Si quieres reiniciar las votaciones, borra la tabla `votes` o añade un endpoint de admin.
- La puntuación se extrae como el primer número entero del 0 al 10 encontrado en el mensaje.
