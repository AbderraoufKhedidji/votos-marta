// Helper de imágenes: reduce latencia y tamaño al cargar muchas fotos.
//
// Las URLs del seed ya son thumbnails de Wikimedia Commons (330px, ~25 KB cada
// una) servidos desde su CDN, en vez de las imágenes originales de varios MB.
// imgTag() solo añade lazy loading + decoding async para no cargar las imágenes
// que están fuera de pantalla (clave cuando se listan 50+ actrices a la vez).

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Devuelve un <img> optimizado. Si no hay url, devuelve un placeholder.
// El tamaño lo controla el contenedor vía className (ej: "w-full h-full object-cover").
export function imgTag(url, alt = '', { className = '', loading = 'lazy' } = {}) {
  if (!url) {
    return `<div class="${className}" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.75rem;width:100%;height:100%">Sin foto</div>`;
  }
  return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="${loading}" decoding="async" class="${className}" />`;
}
