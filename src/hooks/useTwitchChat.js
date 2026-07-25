import { useState, useEffect, useRef } from 'react';

// Lee el chat de Twitch en tiempo real desde el navegador usando una conexión
// WebSocket directa al IRC de Twitch (wss://irc-ws.chat.twitch.tv), sin token
// (login anónimo "justinfan"). Sin dependencias externas.
//
// Devuelve los mensajes con display-name, color y texto.
const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

function parseTags(raw) {
  const tags = {};
  if (!raw) return tags;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    tags[part.slice(0, idx)] = part.slice(idx + 1);
  }
  return tags;
}

export const useTwitchChat = (channel) => {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!channel) return;
    setMessages([]);

    const chan = channel.replace(/^#/, '').toLowerCase();
    const nick = 'justinfan' + Math.floor(Math.random() * 90000 + 10000);
    let closed = false;

    const ws = new WebSocket(IRC_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (closed) return;
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      ws.send(`NICK ${nick}`);
      ws.send(`JOIN #${chan}`);
    };

    ws.onmessage = (ev) => {
      if (closed) return;
      const lines = String(ev.data).split('\r\n');
      for (const line of lines) {
        if (!line) continue;

        // Responder a PING para mantener viva la conexión
        if (line.startsWith('PING')) {
          ws.send('PONG :tmi.twitch.tv');
          continue;
        }

        // PRIVMSG: mensaje del chat
        // Formato: @badge-info=...;color=#FFF;display-name=NAME;... :nick!nick@nick.tmi.twitch.tv PRIVMSG #chan :texto
        if (line.includes(' PRIVMSG ')) {
          const at = line.indexOf(' :');
          const tagPart = line.startsWith('@') ? line.slice(1, line.indexOf(' ')) : '';
          const tags = parseTags(tagPart);
          const msgIdx = line.indexOf(' :', line.indexOf('PRIVMSG'));
          const text = msgIdx >= 0 ? line.slice(msgIdx + 2) : '';
          const user = tags['display-name'] || (line.split('!')[0].split(':').pop()) || 'anon';
          const color = tags.color || '#9aa3b2';
          if (text) {
            setMessages((prev) => {
              const next = [...prev, { user, message: text, color }];
              return next.length > 80 ? next.slice(-80) : next;
            });
          }
        }
      }
    };

    ws.onerror = (e) => console.error('Error en WebSocket Twitch:', e);
    ws.onclose = () => { closed = true; };

    return () => {
      closed = true;
      try { ws.close(); } catch {}
    };
  }, [channel]);

  return { messages };
};
