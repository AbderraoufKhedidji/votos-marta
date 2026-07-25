# Votos Marta

Web en **Astro** para gestionar categorías de actores/actrices y puntuarlos en directo desde el chat de Twitch. Desplegable en **Vercel** sin base de datos: toda la información se guarda en el **localStorage** del navegador.

## Funcionalidades

- Autenticación de admin (`admin` / `password` por defecto, configurables).
- CRUD de **categorías** (cada una agrupa actores/actrices).
- CRUD de **actores** con nombre, rol y **foto** (URL o archivo, guardada como data-URL en el navegador).
- **Actor activo**: el admin elige qué actor se está votando en cada momento.
- **Vista de votación en directo** (`/votar/[id]`): al hacer clic en una actriz se muestra su foto a la izquierda, una **gráfica de barras en tiempo real** y un **chat propio minimalista** a la derecha (solo lectura, solo mensajes de la gente con su color, sin escritura ni regalos). El chat es una **isla React** (`src/components/votacion/VotacionDirecto.jsx`) que se conecta al IRC de Twitch desde el navegador por WebSocket (conexión anónima, sin token) en tiempo real; no usa el embed nativo de Twitch ni requiere backend. La gráfica se actualiza en vivo contando los votos del chat en el cliente (un voto por usuario). Hay botones de **Guardar votación** (persiste el recuento en localStorage), **Resetear** y **Ver votaciones** (modal con la lista de usuarios y sus notas).
- Página pública de **resultados** con medias y rankings.
- **Seed automática**: la primera vez que se carga, se crea una categoría de ejemplo con 10 actrices famosas de Hollywood (fotos vía Wikimedia) en el localStorage.

## Stack

- Astro 7 (`output: server`) + adapter `@astrojs/vercel`.
- Tailwind CSS v4.
- **Sin base de datos**: `src/lib/storage.js` guarda categorías, actores, votos y ajustes en `localStorage`. No necesita variables de entorno ni sistema de archivos escribible (funciona en Vercel serverless sin configuración).
- React (islas) para la vista de votación en directo.

> **Importante:** al usar localStorage, los datos viven en el navegador del admin. No se comparten entre dispositivos ni entre espectadores. La votación en directo se cuenta en el navegador donde se abre la vista `/votar/[id]`.

## Puesta en marcha local

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y ajusta credenciales de admin y Twitch (opcional):
   ```bash
   cp .env.example .env
   ```
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre http://localhost:4321/login e inicia sesión con `admin` / `password` (o los que pusiste en `.env`).

La categoría de ejemplo (Hollywood) se crea automáticamente la primera vez en tu navegador. Puedes borrarla o editarla desde el panel.

## Obtener el token de Twitch

La vista de votación en directo **no necesita token** (se conecta al IRC de Twitch de forma anónima). El token solo se usa si ejecutas el hook de Twitch opcional (ver más abajo).

1. Entra en https://twitchapps.com/tmi/ y autoriza.
2. Copia el token (formato `oauth:xxxx...`).
3. Ponlo en `TWITCH_OAUTH_TOKEN`.
4. `TWITCH_USERNAME` debe ser el nombre de la cuenta bot (o la tuya) y `TWITCH_CHANNEL` el canal a escuchar (por defecto `darkmius`).

## Despliegue en Vercel

No requiere ninguna variable de entorno obligatoria (solo las opcionales de admin/Twitch).

1. Sube el repo a GitHub (Vercel lo detecta automáticamente gracias al adapter de Astro).
2. Importa el proyecto en Vercel.
3. (Opcional) Añade variables de entorno:
   - `ADMIN_USER`, `ADMIN_PASSWORD`
   - `TWITCH_CHANNEL` (canal a escuchar en la vista en directo; por defecto `darkmius`)
4. Despliega. La web queda en tu URL de Vercel.

> No hace falta Turso, Postgres ni Vercel Blob. Toda la persistencia es client-side.
> Las credenciales de admin en producción se definen con `ADMIN_USER` / `ADMIN_PASSWORD`
> en Vercel (Project → Settings → Environment Variables). Si no se definen, se usan
> los valores por defecto `admin` / `password`.

## Estructura

```
src/
  lib/
    auth.mjs        # sesión cookie firmada (admin/password)
    storage.js      # capa de datos en localStorage (categorías, actores, votos, settings)
  hooks/
    useTwitchChat.js  # lee el chat de Twitch en el cliente (WebSocket al IRC, anónimo)
  components/
    votacion/VotacionDirecto.jsx  # isla React: actriz + gráfica + chat + votos + guardar/reset/ver
  middleware.mjs    # protege rutas /admin salvo públicas
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
seeds/seed-hollywood.json   # JSON seed con la categoría y 10 actrices (editable)
```

## Hook de Twitch (opcional, legacy)

`twitch-hook/index.mjs` es un bot de chat (`tmi.js`) que puede grabar votos en segundo plano. Como los votos ya se cuentan en el navegador en la vista `/votar/[id]`, **no es necesario** para el funcionamiento. Si lo usas, necesita una conexión IRC persistente (no se ejecuta en Vercel serverless) y depende de la antigua capa `src/lib/db.mjs` (SQLite local / Turso). Se deja solo como referencia.

## Notas

- La regla de "un voto por usuario" se aplica **por actor** dentro de la vista en directo.
- La puntuación se extrae como el primer número entero del 0 al 10 encontrado en el mensaje.
- Para reiniciar todo (borrar localStorage): en la consola del navegador ejecuta `localStorage.clear()` y recarga.
