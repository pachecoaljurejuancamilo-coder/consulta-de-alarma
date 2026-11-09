// Rayo de evidencia: disparo instantáneo con asistencia de apuntado.
import { Vector3 } from 'three';
import { G, ahora } from './mundo.js';
import { FX } from './efectos.js';
import { sonido } from '../audio/audio.js';

const tmp = new Vector3();
const dirAp = new Vector3();

// Dirección horizontal hacia donde apunta la cámara
export function direccionApuntado(salida = dirAp) {
  const y = G.camara.yaw;
  return salida.set(Math.sin(y), 0, Math.cos(y));
}

// Busca el mejor objetivo dentro de un cono horizontal (radianes) y un alcance (metros)
export function buscarObjetivo(origen, dir, cono, alcance) {
  let mejor = null;
  let mejorPuntaje = Infinity;
  for (const o of G.objetivos.values()) {
    if (!o.activo()) continue;
    tmp.copy(o.pos).sub(origen);
    tmp.y = 0;
    const d = tmp.length();
    if (d > alcance) continue;
    if (d < 0.6) return o; // pegado al jugador
    tmp.divideScalar(d);
    const ang = Math.acos(Math.max(-1, Math.min(1, tmp.dot(dir))));
    const limite = cono + Math.atan2(o.radio || 0.5, d);
    if (ang > limite) continue;
    const puntaje = ang * 2.4 + d * 0.03 + (o.prioridad || 0);
    if (puntaje < mejorPuntaje) {
      mejor = o;
      mejorPuntaje = puntaje;
    }
  }
  return mejor;
}

export const conoAsistencia = () => (G.entrada.tactil ? 0.5 : 0.3);
export const ALCANCE = 28;

// Dispara el rayo. Devuelve true si se disparó.
export function dispararRayo(forzado = null) {
  const j = G.jugador;
  const t = ahora();
  if (t < j.disparoListo || j.modo !== 'libre') return false;
  j.disparoListo = t + 0.3;
  j.disparoHasta = t + 0.5;
  const dir = direccionApuntado();
  const obj = forzado || buscarObjetivo(j.mano, dir, conoAsistencia(), ALCANCE);
  const destino = new Vector3();
  if (obj) {
    destino.copy(obj.pos);
    j.yaw = Math.atan2(obj.pos.x - j.pos.x, obj.pos.z - j.pos.z);
  } else {
    destino.copy(j.mano).addScaledVector(dir, 20);
    j.yaw = Math.atan2(dir.x, dir.z);
  }
  FX.rayo(j.mano, destino, { color: '#ffd84a', grosor: 0.16 });
  FX.estallido(j.mano, { color: '#fff3b0', cantidad: 8, velocidad: 2.5, vida: 0.25, tam: 0.25 });
  sonido('disparo');
  if (obj) {
    FX.estallido(destino, { color: obj.colorImpacto || '#ffe27a', cantidad: 26, velocidad: 6, vida: 0.6, tam: 0.35 });
    FX.onda(destino, { color: obj.colorImpacto || '#ffe27a', radio: 2.2, vida: 0.45 });
    obj.golpe({ desde: j.mano.clone() });
  }
  return true;
}
