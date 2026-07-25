import tmi from 'tmi.js';
import { addVote, getActiveActor } from '../src/lib/db.mjs';

const CHANNEL = process.env.TWITCH_CHANNEL || 'darkmius';
const USERNAME = process.env.TWITCH_USERNAME || 'votosmarta_bot';
const OAUTH = process.env.TWITCH_OAUTH_TOKEN;

if (!OAUTH) {
  console.error('Falta TWITCH_OAUTH_TOKEN en el entorno. Genera un token en https://twitchapps.com/tmi/');
  process.exit(1);
}

const client = new tmi.Client({
  connection: { secure: true, reconnect: true },
  identity: { username: USERNAME, password: OAUTH },
  channels: [CHANNEL],
});

// Extrae el primer número 0-10 de un mensaje.
// Soporta "10", "9", "9.5" (redondea), y números aislados o al inicio.
function extractScore(message) {
  const m = message.trim().match(/\b(10(?:\.0)?|10)\b|\b([0-9](?:\.\d+)?)\b/);
  if (!m) return null;
  const raw = m[1] ?? m[2];
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 10) return null;
  return n;
}

client.on('message', async (channel, tags, message, self) => {
  if (self) return;
  const username = tags.username?.toLowerCase();
  if (!username) return;

  // Procesar voto si el mensaje contiene un número 0-10
  const score = extractScore(message);
  if (score === null) return;

  const actor = await getActiveActor();
  if (!actor) {
    console.log(`[skip] No hay actor activo. Voto de ${username}: ${score}`);
    return;
  }

  const created = await addVote(actor.id, username, score);
  if (created) {
    console.log(`[vote] ${username} -> ${score} para "${actor.name}" (actor ${actor.id})`);
  } else {
    console.log(`[ignore] ${username} ya había votado antes.`);
  }
});

client.on('connected', (addr, port) => {
  console.log(`Conectado a Twitch (${addr}:${port}). Escuchando el chat de #${CHANNEL}`);
});

client.connect();
