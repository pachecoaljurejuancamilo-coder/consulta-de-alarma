// Etiquetas HTML ancladas a posiciones 3D (textos de orbes, mitos, cristales, números de daño).
// Se actualizan en un solo bucle por frame, sin re-renderizar React.
import { Vector3 } from 'three';

const etiquetas = new Set();
let capa = null;
const v = new Vector3();

export function fijarCapa(el) {
  capa = el;
  for (const e of etiquetas) if (!e.el.parentNode) capa.appendChild(e.el);
}

// opciones: {html|texto, clase, pos (Vector3 vivo), dy, maxDist, visible(), vida (s), sube}
export function crearEtiqueta({ texto = '', html = null, clase = '', pos, dy = 0, maxDist = 32, visible = null, vida = null }) {
  const el = document.createElement('div');
  el.className = 'etq ' + clase;
  if (html) el.innerHTML = html;
  else el.textContent = texto;
  const e = { el, pos, dy, maxDist, visible, nace: performance.now(), vida };
  etiquetas.add(e);
  if (capa) capa.appendChild(el);
  e.quitar = () => {
    etiquetas.delete(e);
    el.remove();
  };
  if (vida) setTimeout(e.quitar, vida * 1000);
  return e;
}

export function actualizarEtiquetas(camara, ancho, alto) {
  for (const e of etiquetas) {
    const vis = e.visible ? e.visible() : true;
    if (!vis) {
      if (e.el.style.display !== 'none') e.el.style.display = 'none';
      continue;
    }
    v.copy(e.pos);
    v.y += e.dy;
    const dist = camara.position.distanceTo(v);
    v.project(camara);
    if (v.z > 1 || dist > e.maxDist || v.x < -1.3 || v.x > 1.3 || v.y < -1.3 || v.y > 1.3) {
      if (e.el.style.display !== 'none') e.el.style.display = 'none';
      continue;
    }
    const x = (v.x * 0.5 + 0.5) * ancho;
    const y = (-v.y * 0.5 + 0.5) * alto;
    if (e.el.style.display === 'none') e.el.style.display = '';
    const escala = Math.max(0.62, Math.min(1.15, 9 / Math.max(dist, 1)));
    e.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${escala.toFixed(3)}) translate(-50%, -100%)`;
    e.el.style.zIndex = String(1000 - Math.round(dist * 10));
  }
}

export function limpiarEtiquetas() {
  for (const e of [...etiquetas]) e.quitar();
}
