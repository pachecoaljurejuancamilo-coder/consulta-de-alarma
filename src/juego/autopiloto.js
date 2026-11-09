// Modo demo (?demo=1): el juego se juega solo de principio a fin.
// Sirve para las pruebas automáticas y para proyectarlo durante la sustentación.
import { G, PARAMS, ahora } from './mundo.js';
import { D } from './director.js';
import { rutaHacia, CONSULTORIOS, AZOTEA } from './mapa.js';
import { PACIENTES } from '../data/contenido.js';
import { dispararRayo } from './combate.js';

let ruta = [];
let destinoRuta = null;
let ultimoCalculo = 0;
let atascado = { t: 0, x: 0, z: 0 };
let inicioPregunta = { q: -1, t: 0 };
let lateral = { dir: 1, hasta: 0 };
let respuestas = null;
let filaVista = -1;
let filaDesde = 0;

function girarCamaraHacia(x, z, rapidez = 6, dt = 0.016) {
  const j = G.jugador.pos;
  const objetivo = Math.atan2(x - j.x, z - j.z);
  let d = objetivo - G.camara.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  G.camara.yaw += d * Math.min(1, dt * rapidez);
  return Math.abs(d);
}

function irA(nodo, dt) {
  const j = G.jugador.pos;
  const t = ahora();
  if (destinoRuta !== nodo || t - ultimoCalculo > 1.5) {
    ruta = rutaHacia(j, nodo);
    destinoRuta = nodo;
    ultimoCalculo = t;
  }
  while (ruta.length > 1 && Math.hypot(ruta[0].x - j.x, ruta[0].z - j.z) < 1.3) ruta.shift();
  const p = ruta[0];
  if (!p) return true;
  const dist = Math.hypot(p.x - j.x, p.z - j.z);
  if (ruta.length === 1 && dist < 0.8) return true;
  let tx = p.x;
  let tz = p.z;
  // Esquiva obstáculos móviles (camillas)
  for (const o of G.obstaculos) {
    const dx = j.x - o.pos.x;
    const dz = j.z - o.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.6 && d > 0.01) {
      tx += (dx / d) * 2.2;
      tz += (dz / d) * 2.2;
      if (d < 1.7 && G.jugador.enSuelo) G.entrada.saltar = true;
    }
  }
  girarCamaraHacia(tx, tz, 7, dt);
  G.entrada.my = 1;
  G.entrada.mx = 0;
  // Si se queda atascado, salta y se mueve de lado
  if (t - atascado.t > 0.8) {
    if (Math.hypot(j.x - atascado.x, j.z - atascado.z) < 0.3) {
      G.entrada.saltar = true;
      G.entrada.mx = Math.random() < 0.5 ? -1 : 1;
    }
    atascado = { t, x: j.x, z: j.z };
  }
  return false;
}

// Movimiento lateral relativo a la cámara (para moverse mientras se apunta a otra cosa)
function moverHacia(x, z, fuerza = 1) {
  const j = G.jugador.pos;
  let dx = x - j.x;
  let dz = z - j.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.4) return true;
  dx /= d;
  dz /= d;
  // Esquiva los orbes esperables para no recogerlos por accidente
  for (const o of D.orbes) {
    if (!o.vivo || o.tipo === 'alarma') continue;
    const ox = j.x - o.pos.x;
    const oz = j.z - o.pos.z;
    const od = Math.hypot(ox, oz);
    if (od < 2.4 && od > 0.01) {
      dx += (ox / od) * (2.4 - od) * 4;
      dz += (oz / od) * (2.4 - od) * 4;
    }
  }
  const l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  const cy = G.camara.yaw;
  G.entrada.my = (dx * Math.sin(cy) + dz * Math.cos(cy)) * fuerza;
  G.entrada.mx = (dx * -Math.cos(cy) + dz * Math.sin(cy)) * fuerza;
  return false;
}

function apuntarYDisparar(obj, dt) {
  const err = girarCamaraHacia(obj.pos.x, obj.pos.z, 10, dt);
  if (err < 0.12) dispararRayo(obj);
}

export function actualizarAutopiloto(dt) {
  if (!PARAMS.demo || !G.activo) return;
  const E = G.entrada;
  E.mx = 0;
  E.my = 0;
  const j = G.jugador;
  // Índices de arco elegidos en la salida (3-4 = valores 4-5; 0 = «Sí»)
  if (!respuestas) respuestas = [3 + Math.round(Math.random()), 3 + Math.round(Math.random()), 0];

  if (D.fase === 'mision') {
    const P = PACIENTES[D.mision];
    const sala = CONSULTORIOS[P.consultorio];
    if (D.etapa === 'marcador') irA('sala_' + sala.id, dt);
    else if (D.etapa === 'resultado' && D.mision < 2) irA('sala_' + CONSULTORIOS[PACIENTES[D.mision + 1].consultorio].id, dt);
    else if (D.etapa === 'anamnesis') {
      const mito = D.mitos.find((m) => m.vivo && m.aparecido);
      const alarma = D.orbes.find((o) => o.vivo && o.tipo === 'alarma');
      // Se ubica en el centro del consultorio mientras dispara
      const lejos = Math.hypot(j.pos.x - sala.cx, j.pos.z + 13.5) > 2.2;
      if (mito) apuntarYDisparar(G.objetivos.get(mito.id) || mito, dt);
      else if (alarma) apuntarYDisparar(G.objetivos.get(alarma.id) || alarma, dt);
      if (lejos) moverHacia(sala.cx, -13.5, 0.8);
      else if (!mito && !alarma) {
        const t = ahora();
        if (t > lateral.hasta) lateral = { dir: -lateral.dir, hasta: t + 1.2 };
        E.mx = lateral.dir * 0.35;
        girarCamaraHacia(sala.cx, -21, 2, dt);
        if (!D.mitos.some((m) => m.vivo)) E.interactuar = true;
      }
    } else if (D.etapa === 'decision') {
      irA(P.correcto === 'farmacia' ? 'sala_farmacia' : 'sala_ginecologia', dt);
    }
  } else if (D.fase === 'jefe' && D.etapa === 'combate') {
    const t = ahora();
    // Esquivar ondas saltando
    for (const o of D.ondas) {
      if (!o.vivo) continue;
      const d = Math.hypot(j.pos.x - o.x, j.pos.z - o.z);
      if (d - o.r > 0 && d - o.r < 1.4 && j.enSuelo) E.saltar = true;
    }
    // Esquivar proyectiles con dash
    for (const p of D.proyectiles) {
      if (p.vivo && p.pos.distanceTo(j.pos) < 3 && t > j.dashListo) {
        E.dash = true;
        E.mx = Math.random() < 0.5 ? -1 : 1;
      }
    }
    // Moverse de lado a lado
    if (t > lateral.hasta) lateral = { dir: -lateral.dir, hasta: t + 1.4 };
    if (!E.dash) E.mx = lateral.dir * 0.6;
    const dc = Math.hypot(j.pos.x - AZOTEA.x, j.pos.z - (AZOTEA.z + 7));
    if (dc > 4) E.my = -0.5;
    // Responder la pregunta tras un momento de "lectura"
    const correcta = D.cristales.find((c) => c.vivo && c.correcta);
    if (correcta) {
      if (inicioPregunta.q !== D.q) inicioPregunta = { q: D.q, t };
      if (t - inicioPregunta.t > 2.2) apuntarYDisparar(G.objetivos.get(correcta.id), dt);
      else girarCamaraHacia(correcta.pos.x, correcta.pos.z, 3, dt);
    } else {
      const p = D.proyectiles.find((x) => x.vivo);
      if (p && G.objetivos.get(p.id)) apuntarYDisparar(G.objetivos.get(p.id), dt);
      else girarCamaraHacia(AZOTEA.x, AZOTEA.z - 10, 3, dt);
    }
  } else if (D.fase === 'salida') {
    const f = D.filas[D.filaActual];
    if (f) {
      const t = ahora();
      if (filaVista !== D.filaActual) {
        filaVista = D.filaActual;
        filaDesde = t;
      }
      const k = Math.min(f.opciones.length - 1, respuestas[D.filaActual]);
      let zObj = f.arcos[k].z;
      // Primero se aleja un poco (así siempre hay movimiento lateral) y luego entra a su arco
      if (t - filaDesde < 1.4) zObj += zObj > 0 ? -2.2 : 2.2;
      const dz = j.pos.z - zObj;
      E.mx = Math.max(-1, Math.min(1, dz * 0.9));
      if (Math.abs(dz) < 0.15) E.mx = 0;
    }
  }
}

export function reiniciarAutopiloto() {
  filaVista = -1;
  ruta = [];
  destinoRuta = null;
  respuestas = null;
  inicioPregunta = { q: -1, t: 0 };
}
