import { useEffect, useMemo, useRef, useState } from 'react';
import { useTwitchChat } from '../../hooks/useTwitchChat';

// Extrae el primer número 0-10 de un mensaje (igual que el hook de Twitch).
function extractScore(message) {
  const m = message.trim().match(/\b(10(?:\.0+)?)\b|\b([0-9](?:\.\d+)?)\b/);
  if (!m) return null;
  const raw = m[1] ?? m[2];
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 0 || n > 10) return null;
  return n;
}

export const VotacionDirecto = ({ actorId, channel, authed, initialVotes }) => {
  const { messages } = useTwitchChat(channel);
  // Mapa user -> score (un voto por usuario)
  const votesRef = useRef(new Map());
  const [votes, setVotes] = useState(() => {
    const m = new Map();
    for (const v of initialVotes || []) m.set(v.username.toLowerCase(), { user: v.username, score: v.score });
    return m;
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Procesar mensajes nuevos: extraer votos
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    const score = extractScore(last.message);
    if (score === null) return;
    const key = last.user.toLowerCase();
    if (votesRef.current.has(key)) return; // ya votó, ignorar
    votesRef.current.set(key, { user: last.user, score });
    setVotes(new Map(votesRef.current));
  }, [messages]);

  const stats = useMemo(() => {
    const dist = Array(11).fill(0);
    let total = 0;
    let sum = 0;
    for (const { score } of votes.values()) {
      dist[score]++;
      total++;
      sum += score;
    }
    return { dist, total, average: total ? sum / total : 0 };
  }, [votes]);

  const max = Math.max(1, ...stats.dist);

  async function guardar() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const payload = Array.from(votes.values()).map((v) => ({ username: v.user, score: v.score }));
      const res = await fetch(`/api/votos/${actorId}/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: payload }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        console.error('Error guardando votación:', res.status);
      }
    } catch (e) {
      console.error('Error guardando votación:', e);
    } finally {
      setSaving(false);
    }
  }

  async function resetear() {
    if (resetting) return;
    if (!confirm('¿Resetear la votación? Se borrarán todos los votos actuales (también los guardados).')) return;
    setResetting(true);
    setSaved(false);
    try {
      // Limpiar el recuento en cliente
      votesRef.current = new Map();
      setVotes(new Map());
      // Limpiar los votos guardados en la bd
      await fetch(`/api/votos/${actorId}/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: [] }),
      });
    } catch (e) {
      console.error('Error reseteando votación:', e);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Gráfica de barras en tiempo real */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Votos en directo</h2>
          <span className="text-xs flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }}></span>
            en tiempo real · {stats.total} votos · ⭐ {stats.average.toFixed(1)}
          </span>
        </div>
        <div className="flex items-end gap-2 h-56">
          {stats.dist.map((count, score) => (
            <div key={score} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{count}</div>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${(count / max) * 100}%`,
                  minHeight: count > 0 ? '4px' : '2px',
                  background: 'linear-gradient(180deg, var(--accent), var(--accent-2))',
                  transition: 'height 0.4s ease',
                }}
              ></div>
              <div className="text-xs font-bold">{score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat minimalista (solo lectura) */}
      <div className="card p-3 flex flex-col" style={{ height: 420 }}>
        <ChatPanel messages={messages} channel={channel} />
      </div>

      {/* Botones de gestión (solo admin) */}
      {authed && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="btn btn-primary"
            onClick={guardar}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Guardando…' : 'Guardar votación'}
          </button>
          <button className="btn" onClick={resetear} disabled={resetting} style={{ opacity: resetting ? 0.6 : 1 }}>
            {resetting ? 'Reseteando…' : 'Resetear votación'}
          </button>
          <button className="btn" onClick={() => setShowModal(true)}>Ver votaciones</button>
          {saved && (
            <span className="text-sm" style={{ color: 'var(--accent)' }}>
              ✓ Votación guardada ({stats.total} votos)
            </span>
          )}
        </div>
      )}

      {/* Modal: lista de usuarios y sus votos */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card p-5"
            style={{ width: 'min(420px, 92vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Votaciones ({votes.size})</h3>
              <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '4px 10px' }}>✕</button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-1" style={{ minHeight: 0 }}>
              {votes.size === 0 ? (
                <div className="text-sm italic" style={{ color: 'var(--muted)' }}>
                  Todavía no hay votos.
                </div>
              ) : (
                Array.from(votes.values())
                  .sort((a, b) => a.user.localeCompare(b.user))
                  .map((v) => (
                    <div
                      key={v.user.toLowerCase()}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{ background: 'var(--bg)' }}
                    >
                      <span className="font-medium">{v.user}</span>
                      <span className="badge" style={{ color: 'var(--accent)' }}>{v.score}/10</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatPanel = ({ messages, channel }) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 80;
    if (isAtBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--muted)' }}>
        <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }}></span>
        Chat en directo · #{channel}
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-lg p-2 flex flex-col gap-1"
        style={{ background: 'var(--bg)', minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <div className="text-xs italic" style={{ color: 'var(--muted)' }}>
            Esperando mensajes del chat de Twitch…
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="leading-snug wrap-break-word text-sm">
              <strong style={{ color: msg.color }}>{msg.user}</strong>
              <span style={{ color: 'var(--muted)' }}>: </span>
              <span>{msg.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
