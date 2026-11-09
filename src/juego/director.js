// Director del juego: reloj global de 3:00, fases, misiones, jefe y salida.
// Toda la lógica vive aquí; los componentes 3D solo dibujan lo que hay en D.
import { Vector3 } from 'three';
import { G, PARAMS, ahora, camaraLenta, sacudir, vibrar, resetMundo } from './mundo.js';
import { FX } from './efectos.js';
import { juego } from '../estado/store.js';
import { sonido, musica, ambienteHospital } from '../audio/audio.js';
import { soltarPuntero } from './entrada.js';
import { PACIENTES, MITOS, PREGUNTAS, ENCUESTA, TIEMPOS as T, PUNTAJE, RANGOS, TEXTOS, DESTINOS, AVATARES } from '../data/contenido.js';
import { CONSULTORIOS, CZ_SALA, Z_CAMILLA, salaPorId, dentroSala, AZOTEA, JEFE_POS, SPAWN_JEFE, CRISTALES_POS, PASARELA, xCarrera, SPAWN } from './mapa.js';
import { enviarResultado } from '../api.js';

export const D = {
  fase: null,
  mision: -1,
  etapa: null,
  tEtapa: 0,
  limiteAnamnesis: 0,
  orbes: [],
  mitos: [],
  recogidos: {},
  decisiones: [undefined, undefined, undefined],
  mitosDestruidos: 0,
  preguntas: [],
  q: -1,
  cristales: [],
  jefe: null,
  proyectiles: [],
  ondas: [],
  filas: [],
  filaActual: 0,
  encuesta: {},
  finalizado: false,
  dañoRecibido: 0,
  vecesSinVida: 0,
};

const rnd = (a, b) => a + Math.random() * (b - a);
function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const formatoSeg = (s) => `${Math.max(0, Math.ceil(s))} s`;

// ---------------------------------------------------------------------
// Inicio y fin de partida
// ---------------------------------------------------------------------
export function empezarPartida() {
  resetMundo();
  Object.assign(D, {
    fase: null,
    mision: -1,
    etapa: null,
    orbes: [],
    mitos: [],
    recogidos: {},
    decisiones: [undefined, undefined, undefined],
    mitosDestruidos: 0,
    preguntas: [undefined, undefined, undefined, undefined],
    q: -1,
    cristales: [],
    jefe: null,
    proyectiles: [],
    ondas: [],
    filas: [],
    filaActual: 0,
    encuesta: { op_entendiste: '', op_innovador: '', op_reconocerias: 'sin respuesta' },
    finalizado: false,
    dañoRecibido: 0,
    vecesSinVida: 0,
  });
  const s = juego();
  s.set({
    pantalla: 'juego',
    segundos: 0,
    vida: 100,
    puntaje: 0,
    radio: null,
    avisos: [],
    tarjeta: null,
    cine: null,
    jefe: null,
    pregunta: null,
    fila: null,
    orbes: [],
    mitos: [],
    cristales: [],
    filas: [],
    destinosActivos: false,
    interaccion: null,
    resultado: null,
    fundido: false,
  });
  G.inicioMs = performance.now() - PARAMS.saltar * 1000;
  G.t = 0;
  G.activo = true;
  musica('calma');
  ambienteHospital(true);
}

// Llamado en cada frame desde la escena
export function actualizarDirector(dt) {
  if (!G.activo) return;
  G.t = (performance.now() - G.inicioMs) / 1000;
  // Cámara lenta
  if (ahora() > G.slowmoHasta) G.escala += (1 - G.escala) * Math.min(1, dt * 6);
  G.dtJuego = Math.min(dt, 0.1) * G.escala;

  const s = juego();
  if (G.t >= T.total) {
    finalizar();
    return;
  }
  const seg = Math.floor(G.t);
  if (seg !== s.segundos) s.set({ segundos: seg });

  const finMisiones = T.porMision * 3;
  const finJefe = finMisiones + T.jefe;
  if (G.t < finMisiones) {
    const i = Math.min(2, Math.floor(G.t / T.porMision));
    if (D.fase !== 'mision' || D.mision !== i) iniciarMision(i);
    actualizarMision(dt);
  } else if (G.t < finJefe) {
    if (D.fase !== 'jefe') iniciarJefe();
    actualizarJefe(dt);
  } else {
    if (D.fase !== 'salida') iniciarSalida();
    actualizarSalida(dt);
  }
}

// ---------------------------------------------------------------------
// Daño al jugador
// ---------------------------------------------------------------------
export function recibirDano(cantidad, desde, { forzar = false } = {}) {
  const j = G.jugador;
  const t = ahora();
  if (!forzar && t < j.invulnHasta) return false;
  if (D.finalizado) return false;
  j.invulnHasta = t + 0.9;
  j.golpeHasta = t + 0.45;
  if (desde) {
    const dx = j.pos.x - desde.x;
    const dz = j.pos.z - desde.z;
    const l = Math.hypot(dx, dz) || 1;
    j.empuje = { x: (dx / l) * 7, z: (dz / l) * 7, hasta: t + 0.25 };
  }
  const s = juego();
  let vida = s.vida - cantidad;
  D.dañoRecibido += cantidad;
  FX.flash('#ff1f4b', 0.4);
  sacudir(0.35);
  vibrar(90);
  sonido('dano');
  FX.numero(new Vector3(j.pos.x, j.pos.y + 2.1, j.pos.z), `−${cantidad}`, '#ff5d7a');
  if (vida <= 0) {
    vida = 50;
    D.vecesSinVida++;
    s.sumar(PUNTAJE.sinCredibilidad);
    const tutor = D.fase === 'jefe' ? 'juan' : D.fase === 'salida' ? 'gino' : 'liz';
    s.hablar(tutor, TEXTOS.radio.sinVida, 3500);
    s.aviso('¡Credibilidad agotada! −20', 'mal');
  }
  s.set({ vida });
  return true;
}

// ---------------------------------------------------------------------
// FASE 1: MISIONES
// ---------------------------------------------------------------------
function iniciarMision(i) {
  if (D.fase === 'mision' && D.mision >= 0) cerrarMision(D.mision);
  const P = PACIENTES[i];
  const sala = CONSULTORIOS[P.consultorio];
  D.fase = 'mision';
  D.mision = i;
  D.etapa = 'marcador';
  D.tEtapa = G.t;
  D.orbes = [];
  D.mitos = [];
  G.marcadores = [{ x: sala.cx, z: CZ_SALA, tipo: 'mision' }];
  G.objetivoGuia = { x: sala.cx, z: -12 };
  const s = juego();
  s.set({
    fase: 'mision',
    mision: i,
    etapa: 'marcador',
    titulo: `Misión ${i + 1}/3 · ${P.nombre}`,
    objetivo: `Corre al ${sala.nombre.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`,
    orbes: [],
    mitos: [],
    destinosActivos: false,
    cine: null,
    interaccion: null,
  });
  if (i === 0) s.hablar('liz', TEXTOS.radio.inicio, 6000);
}

function cerrarMision(i) {
  if (D.decisiones[i] === undefined) D.decisiones[i] = null;
  limpiarEntidadesMision();
  G.marcadores = [];
}

function limpiarEntidadesMision() {
  for (const o of D.orbes) G.objetivos.delete(o.id);
  for (const m of D.mitos) G.objetivos.delete(m.id);
  D.orbes.forEach((o) => (o.vivo = false));
  D.mitos.forEach((m) => (m.vivo = false));
  juego().set({ orbes: [], mitos: [], interaccion: null });
}

function actualizarMision(dt) {
  const i = D.mision;
  const P = PACIENTES[i];
  const sala = CONSULTORIOS[P.consultorio];
  const w0 = i * T.porMision;
  const fin = w0 + T.porMision;
  const tl = G.t - w0;
  const s = juego();
  const j = G.jugador;

  if (D.etapa === 'marcador') {
    if (dentroSala(sala, j.pos, 0.4)) return iniciarCinematica();
    if (tl > T.llegadaMax) {
      j.teleport = { x: sala.cx, y: 0.05, z: -10.5, yaw: Math.PI };
      s.aviso('Te llevamos al consultorio', 'info');
      return iniciarCinematica();
    }
    s.set({ cuentaObjetivo: null });
  } else if (D.etapa === 'cinematica') {
    const saltar = G.entrada.interactuar || G.entrada.disparar;
    if (G.t - D.tEtapa >= T.cinematica || saltar || G.t > fin - T.reservaDecision - 6) iniciarAnamnesis();
  } else if (D.etapa === 'anamnesis') {
    const ta = G.t - D.tEtapa;
    // Aparición de mitos
    for (const m of D.mitos) {
      if (!m.aparecido && m.vivo && ta >= m.retraso) {
        m.aparecido = true;
        FX.estallido(m.pos, { color: '#b58cff', cantidad: 30, velocidad: 4, vida: 0.7, tam: 0.4 });
        sonido('mito', { tono: 0.7 });
      }
    }
    actualizarOrbes();
    actualizarMitos(dt);
    const alarmas = D.orbes.filter((o) => o.tipo === 'alarma' && o.vivo).length;
    const mitosPend = D.mitos.filter((m) => m.vivo).length;
    const restante = D.limiteAnamnesis - G.t;
    s.cuentaObjetivo !== Math.ceil(restante) && s.set({ cuentaObjetivo: Math.ceil(restante) });
    const listo = G.entrada.interactuar && dentroSala(sala, j.pos, -1) && ta > 1.5;
    if ((alarmas === 0 && mitosPend === 0) || listo || G.t >= D.limiteAnamnesis) iniciarDecision();
  } else if (D.etapa === 'decision') {
    actualizarMitos(dt);
    const restante = fin - 0.5 - G.t;
    s.cuentaObjetivo !== Math.ceil(restante) && s.set({ cuentaObjetivo: Math.ceil(restante) });
    if (dentroSala(salaPorId('farmacia'), j.pos, 0.3)) decidir('farmacia');
    else if (dentroSala(salaPorId('ginecologia'), j.pos, 0.3)) decidir('ginecologia');
    else if (G.t >= fin - 0.5) decidir(null);
  } else if (D.etapa === 'resultado') {
    const restante = fin - G.t;
    if (i < 2) s.cuentaObjetivo !== Math.ceil(restante) && s.set({ cuentaObjetivo: Math.ceil(restante) });
  }
}

function iniciarCinematica() {
  const P = PACIENTES[D.mision];
  const sala = CONSULTORIOS[P.consultorio];
  D.etapa = 'cinematica';
  D.tEtapa = G.t;
  G.marcadores = [];
  G.objetivoGuia = null;
  G.jugador.modo = 'quieto';
  G.camara.modo = 'cine';
  G.camara.cine = {
    pos: new Vector3(sala.cx + 2.6, 1.7, Z_CAMILLA + 4.2),
    mira: new Vector3(sala.cx, 1.15, Z_CAMILLA),
    deriva: new Vector3(-1.2, 0.15, -0.6),
  };
  juego().set({
    etapa: 'cinematica',
    cine: { nombre: P.nombre, edad: P.edad, ocupacion: P.ocupacion, frase: P.frase, id: P.id },
    interaccion: 'Saltar',
    objetivo: 'Conoce a tu paciente',
    cuentaObjetivo: null,
  });
  sonido('tic');
}

function iniciarAnamnesis() {
  const i = D.mision;
  const P = PACIENTES[i];
  const sala = CONSULTORIOS[P.consultorio];
  const fin = (i + 1) * T.porMision;
  D.etapa = 'anamnesis';
  D.tEtapa = G.t;
  D.limiteAnamnesis = Math.min(G.t + T.anamnesisMax, fin - T.reservaDecision);
  const j = G.jugador;
  j.modo = 'libre';
  if (!dentroSala(sala, j.pos, 0.4)) j.teleport = { x: sala.cx, y: 0.05, z: -10.5, yaw: Math.PI };
  G.camara.modo = 'libre';
  G.camara.yaw = Math.PI;
  G.camara.pitch = 0.42;

  // Orbes en anillo alrededor del centro de la sala
  const n = P.orbes.length;
  const desfase = rnd(0, Math.PI * 2);
  const orden = barajar(P.orbes);
  D.orbes = orden.map((o, k) => {
    const ang = desfase + (k / n) * Math.PI * 2;
    const radio = 3.3 + (k % 2) * 0.6;
    const pos = new Vector3(sala.cx + Math.sin(ang) * radio * 1.15, 1.25, CZ_SALA + 0.6 + Math.cos(ang) * radio);
    pos.z = Math.min(pos.z, -9.4);
    pos.z = Math.max(pos.z, Z_CAMILLA + 1.4);
    const orbe = { ...o, pos, base: pos.y, vivo: true, fase: rnd(0, 6) };
    G.objetivos.set(o.id, {
      tipo: 'orbe',
      pos,
      radio: 0.55,
      prioridad: 0.15,
      colorImpacto: '#bfefff',
      activo: () => orbe.vivo && D.etapa === 'anamnesis',
      golpe: () => recogerOrbe(orbe),
    });
    return orbe;
  });

  // Mitos (aparecen escalonados)
  const puntos = [
    new Vector3(sala.cx, 1.3, -8.6),
    new Vector3(sala.x0 + 0.8, 1.3, CZ_SALA + 2),
    new Vector3(sala.x1 - 0.8, 1.3, CZ_SALA - 2),
  ];
  D.mitos = P.mitos.map((clave, k) => {
    const id = `mito_${i}_${k}`;
    const mito = {
      id,
      clave,
      frase: MITOS[clave].frase,
      dato: MITOS[clave].dato,
      pos: puntos[k].clone(),
      vivo: true,
      aparecido: false,
      retraso: [0.6, 4.5, 9][k],
      enfriamiento: 0,
      fase: rnd(0, 6),
    };
    G.objetivos.set(id, {
      tipo: 'mito',
      pos: mito.pos,
      radio: 0.8,
      prioridad: -0.25,
      colorImpacto: '#c9a0ff',
      activo: () => mito.vivo && mito.aparecido,
      golpe: () => destruirMito(mito),
    });
    return mito;
  });

  const s = juego();
  s.set({
    etapa: 'anamnesis',
    cine: null,
    orbes: D.orbes.map((o) => ({ id: o.id, texto: o.texto })),
    mitos: D.mitos.map((m) => ({ id: m.id, frase: m.frase })),
    objetivo: 'Recoge SOLO los signos de alarma',
    interaccion: 'Terminar anamnesis',
  });
  s.hablar('liz', P.orbes.some((o) => o.tipo === 'alarma') ? TEXTOS.radio.anamnesis : TEXTOS.radio.anamnesisSofia, 6000);
  musica('tension');
}

function actualizarOrbes() {
  const j = G.jugador;
  for (const o of D.orbes) {
    if (!o.vivo) continue;
    const dx = o.pos.x - j.pos.x;
    const dz = o.pos.z - j.pos.z;
    const dy = o.pos.y - (j.pos.y + 1);
    if (dx * dx + dz * dz < 0.95 * 0.95 && Math.abs(dy) < 1.3) recogerOrbe(o);
  }
}

function recogerOrbe(o) {
  if (!o.vivo) return;
  o.vivo = false;
  G.objetivos.delete(o.id);
  D.recogidos[o.id] = true;
  const s = juego();
  const pos = o.pos.clone();
  if (o.tipo === 'alarma') {
    s.sumar(PUNTAJE.orbeCorrecto);
    FX.estallido(pos, { color: '#ffd84a', cantidad: 40, velocidad: 5, vida: 0.8, tam: 0.4 });
    FX.onda(pos, { color: '#ffd84a', radio: 2.5, vida: 0.5 });
    FX.numero(pos, `+${PUNTAJE.orbeCorrecto}`, '#ffe066');
    sonido('recoger');
    s.aviso('¡Signo de alarma! +10', 'bien', 1300);
  } else {
    s.sumar(PUNTAJE.orbeIncorrecto);
    FX.estallido(pos, { color: '#ff4d6d', cantidad: 30, velocidad: 4, vida: 0.7, tam: 0.35 });
    FX.numero(pos, `${PUNTAJE.orbeIncorrecto}`, '#ff6b81');
    sonido('error');
    vibrar(40);
    s.mostrarTarjeta('Esperable, no es alarma (−10)', `«${o.texto}»: ${o.explicacion}`, 'mal', 4200);
  }
}

function actualizarMitos(dt) {
  const j = G.jugador;
  const dtj = G.dtJuego;
  const t = ahora();
  for (const m of D.mitos) {
    if (!m.vivo || !m.aparecido) continue;
    m.fase += dtj * 3;
    const dx = j.pos.x - m.pos.x;
    const dz = j.pos.z - m.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    if (t > m.enfriamiento) {
      const v = 2.9 * dtj;
      m.pos.x += (dx / d) * v;
      m.pos.z += (dz / d) * v;
    } else {
      m.pos.x -= (dx / d) * 3 * dtj;
      m.pos.z -= (dz / d) * 3 * dtj;
    }
    m.pos.y = 1.35 + Math.sin(m.fase) * 0.18;
    if (d < 0.85 && t > m.enfriamiento && D.etapa !== 'resultado') {
      if (recibirDano(10, m.pos)) m.enfriamiento = t + 1.3;
    }
  }
}

function destruirMito(m) {
  if (!m.vivo) return;
  m.vivo = false;
  G.objetivos.delete(m.id);
  D.mitosDestruidos++;
  const s = juego();
  s.sumar(PUNTAJE.mito);
  const pos = m.pos.clone();
  FX.estallido(pos, { color: '#c9a0ff', cantidad: 50, velocidad: 6, vida: 0.9, tam: 0.45 });
  FX.estallido(pos, { color: '#ffd84a', cantidad: 16, velocidad: 3, vida: 0.6, tam: 0.3 });
  FX.onda(pos, { color: '#c9a0ff', radio: 3, vida: 0.55 });
  FX.numero(pos, `+${PUNTAJE.mito}`, '#d9b8ff');
  sacudir(0.15);
  sonido('impacto');
  s.mostrarTarjeta(`Mito destruido: «${m.frase}» (+5)`, m.dato, 'dato', 4500);
}

function iniciarDecision() {
  D.etapa = 'decision';
  D.tEtapa = G.t;
  // Los orbes que queden se desvanecen; los mitos siguen persiguiendo hasta que llegues
  for (const o of D.orbes) {
    o.vivo = false;
    G.objetivos.delete(o.id);
  }
  const f = salaPorId('farmacia');
  const g = salaPorId('ginecologia');
  G.marcadores = [
    { x: f.cx, z: CZ_SALA, tipo: 'farmacia' },
    { x: g.cx, z: CZ_SALA, tipo: 'ginecologia' },
  ];
  G.objetivoGuia = null;
  const s = juego();
  s.set({ etapa: 'decision', destinosActivos: true, orbes: [], objetivo: 'Decide: ¿Farmacia o Ginecología?', interaccion: null });
  s.hablar('liz', TEXTOS.radio.decision, 5000);
  sonido('tic');
}

function decidir(destino) {
  const i = D.mision;
  const P = PACIENTES[i];
  D.decisiones[i] = destino;
  D.etapa = 'resultado';
  D.tEtapa = G.t;
  for (const m of D.mitos) {
    if (m.vivo) FX.estallido(m.pos, { color: '#b58cff', cantidad: 20, velocidad: 3, vida: 0.5, tam: 0.3 });
    m.vivo = false;
    G.objetivos.delete(m.id);
  }
  const ok = destino === P.correcto;
  const s = juego();
  const j = G.jugador;
  if (ok) {
    s.sumar(PUNTAJE.destino);
    const p = new Vector3(j.pos.x, j.pos.y + 1, j.pos.z);
    FX.estallido(p, { color: '#ffd84a', cantidad: 90, velocidad: 9, vida: 1.2, tam: 0.5, gravedad: -4 });
    FX.estallido(p, { color: '#f4a3b7', cantidad: 40, velocidad: 6, vida: 1, tam: 0.4 });
    FX.onda(new Vector3(j.pos.x, j.pos.y + 0.1, j.pos.z), { color: '#ffd84a', radio: 6, vida: 0.8 });
    FX.flash('#ffe9a8', 0.35);
    FX.numero(new Vector3(j.pos.x, j.pos.y + 2.4, j.pos.z), `+${PUNTAJE.destino}`, '#ffe066');
    sonido('mision');
    s.aviso('¡MISIÓN COMPLETADA! +40', 'mision', 2400);
    s.hablar('liz', P.bien, 7000);
  } else {
    sonido('error');
    s.aviso(destino ? 'Destino incorrecto' : 'Sin decisión: se acabó el tiempo', 'mal', 2200);
    s.hablar('liz', P.mal, 8000);
  }
  // Siguiente objetivo
  if (i < 2) {
    const sig = CONSULTORIOS[PACIENTES[i + 1].consultorio];
    G.marcadores = [{ x: sig.cx, z: CZ_SALA, tipo: 'mision' }];
    G.objetivoGuia = { x: sig.cx, z: -12 };
    s.set({ etapa: 'resultado', destinosActivos: false, mitos: [], objetivo: `Siguiente paciente: ${sig.nombre.toLowerCase()}` });
  } else {
    G.marcadores = [];
    G.objetivoGuia = null;
    s.set({ etapa: 'resultado', destinosActivos: false, mitos: [], objetivo: 'Prepárate: subes a la azotea', cuentaObjetivo: null });
  }
  musica('calma');
}

// ---------------------------------------------------------------------
// FASE 2: JEFE FINAL
// ---------------------------------------------------------------------
function fundido() {
  const s = juego();
  s.set({ fundido: true });
  setTimeout(() => s.set({ fundido: false }), 450);
}

function iniciarJefe() {
  if (D.fase === 'mision') cerrarMision(D.mision);
  D.fase = 'jefe';
  D.etapa = 'intro';
  D.tEtapa = G.t;
  D.q = -1;
  D.cristales = [];
  D.proyectiles = [];
  D.ondas = [];
  D.jefe = {
    vida: 1,
    pos: new Vector3(JEFE_POS.x, JEFE_POS.y + 1.2, JEFE_POS.z),
    estado: 'entrando',
    tEstado: G.t,
    proxOnda: G.t + T.jefeIntro + 3,
    proxProy: G.t + T.jefeIntro + 1.5,
    golpeHasta: 0,
    ataqueHasta: 0,
  };
  G.objetivos.clear();
  fundido();
  const j = G.jugador;
  j.teleport = { x: SPAWN_JEFE.x, y: AZOTEA.y + 0.05, z: SPAWN_JEFE.z, yaw: SPAWN_JEFE.yaw };
  j.modo = 'quieto';
  G.marcadores = [];
  G.objetivoGuia = null;
  G.camara.modo = 'cine';
  G.camara.cine = {
    pos: new Vector3(AZOTEA.x + 7, AZOTEA.y + 3.2, AZOTEA.z + 11),
    mira: new Vector3(JEFE_POS.x, JEFE_POS.y + 4.5, JEFE_POS.z),
    deriva: new Vector3(-4, 1.2, 1.5),
  };
  const s = juego();
  s.set({
    fase: 'jefe',
    etapa: 'intro',
    titulo: 'Jefe final · Azotea',
    objetivo: '¡El Retraso Diagnóstico!',
    cuentaObjetivo: null,
    jefe: { vida: 1, nombre: 'EL RETRASO DIAGNÓSTICO' },
    orbes: [],
    mitos: [],
    destinosActivos: false,
    cine: null,
    interaccion: null,
  });
  s.hablar('juan', TEXTOS.radio.jefe, 7000);
  musica('jefe');
  ambienteHospital(false);
  sacudir(0.5);
}

function actualizarJefe(dt) {
  const w0 = T.porMision * 3;
  const tl = G.t - w0;
  const s = juego();
  const J = D.jefe;
  const j = G.jugador;

  if (D.etapa === 'intro') {
    if (tl >= T.jefeIntro) {
      D.etapa = 'combate';
      j.modo = 'libre';
      G.camara.modo = 'libre';
      G.camara.jefe = true;
      G.camara.yaw = Math.PI;
      G.camara.pitch = 0.08;
      J.estado = 'flotando';
      s.set({ etapa: 'combate' });
    }
  }
  if (D.etapa !== 'intro') {
    const finPreg = T.jefeIntro + T.porPregunta * 4;
    const qSlot = tl < finPreg ? Math.floor((tl - T.jefeIntro) / T.porPregunta) : 4;
    if (qSlot > D.q) {
      if (D.q >= 0 && !D.preguntas[D.q]) resolverPregunta(D.q, null);
      if (qSlot < 4) iniciarPregunta(qSlot);
      D.q = qSlot;
    }
    if (D.q < 4 && D.q >= 0) {
      const restante = w0 + T.jefeIntro + T.porPregunta * (D.q + 1) - G.t;
      const n = Math.ceil(restante);
      if (s.cuentaObjetivo !== n) s.set({ cuentaObjetivo: n });
    }
    if (tl >= finPreg + 0.6 && J.estado !== 'muriendo' && J.estado !== 'muerto') explotarJefe(false);
  }

  // Ataques del jefe
  if (J.estado === 'flotando' && D.etapa === 'combate') {
    if (G.t >= J.proxOnda) {
      J.proxOnda = G.t + 4.6;
      J.ataqueHasta = ahora() + 0.8;
      setTimeout(() => lanzarOnda(9.5, 12), 650);
    }
    if (G.t >= J.proxProy) {
      J.proxProy = G.t + 3.1;
      J.ataqueHasta = ahora() + 0.6;
      lanzarProyectil(-1);
      lanzarProyectil(1);
    }
  }
  // Movimiento del jefe
  if (J.estado !== 'muerto') {
    const t = ahora();
    J.pos.x = JEFE_POS.x + Math.sin(t * 0.5) * 2.2;
    J.pos.y = JEFE_POS.y + 1.2 + Math.sin(t * 1.3) * 0.4 + (J.estado === 'entrando' ? -2 + Math.min(2, (G.t - J.tEstado) * 1.2) : 0);
  }
  if (J.estado === 'muriendo' && G.t - J.tEstado > 1.4) {
    J.estado = 'muerto';
    const p = J.pos.clone().add(new Vector3(0, 2.5, 0));
    for (let k = 0; k < 4; k++) FX.estallido(p, { color: k % 2 ? '#ffd84a' : '#fff1b8', cantidad: 140, velocidad: 12 + k * 3, vida: 1.8, tam: 0.6, gravedad: -2 });
    FX.onda(new Vector3(J.pos.x, AZOTEA.y + 0.1, J.pos.z), { color: '#ffd84a', radio: 22, vida: 1.2 });
    FX.flash('#fff3c4', 0.85);
    sacudir(1);
    vibrar(200);
    sonido('golpeJefe', { tono: 0.6 });
    camaraLenta(1.2, 0.3);
    s.set({ jefe: null });
  }

  // Proyectiles
  const dtj = G.dtJuego;
  for (const p of D.proyectiles) {
    if (!p.vivo) continue;
    p.vida -= dtj;
    const dx = j.pos.x - p.pos.x;
    const dy = j.pos.y + 1.1 - p.pos.y;
    const dz = j.pos.z - p.pos.z;
    const d = Math.hypot(dx, dy, dz) || 1;
    p.vel.x += (dx / d) * 4 * dtj;
    p.vel.y += (dy / d) * 4 * dtj;
    p.vel.z += (dz / d) * 4 * dtj;
    p.vel.setLength(6.5);
    p.pos.addScaledVector(p.vel, dtj);
    if (d < 0.75) {
      recibirDano(10, p.pos);
      destruirProyectil(p, false);
    } else if (p.vida <= 0 || p.pos.y < AZOTEA.y) destruirProyectil(p, false);
  }
  // Ondas en el piso
  for (const o of D.ondas) {
    if (!o.vivo) continue;
    o.r += o.vel * dtj;
    if (o.r > AZOTEA.radio + 3) o.vivo = false;
    const d = Math.hypot(j.pos.x - o.x, j.pos.z - o.z);
    if (!o.golpeo && Math.abs(d - o.r) < 0.6 && j.pos.y - AZOTEA.y < 0.5) {
      if (recibirDano(o.dano, { x: o.x, z: o.z }, { forzar: o.forzar })) o.golpeo = true;
    }
  }
  if (D.proyectiles.length > 20) D.proyectiles = D.proyectiles.filter((p) => p.vivo);
  if (D.ondas.length > 10) D.ondas = D.ondas.filter((o) => o.vivo);
}

let idProy = 0;
function lanzarProyectil(lado) {
  const J = D.jefe;
  if (!J || J.estado !== 'flotando') return;
  const id = 'proy_' + ++idProy;
  const pos = J.pos.clone().add(new Vector3(lado * 2.6, 2.4, 1.2));
  const p = { id, pos, vel: new Vector3(lado * 2, 1, 5), vida: 4.5, vivo: true };
  D.proyectiles.push(p);
  G.objetivos.set(id, {
    tipo: 'proyectil',
    pos,
    radio: 0.5,
    prioridad: 0.4,
    colorImpacto: '#ff5d7a',
    activo: () => p.vivo,
    golpe: () => destruirProyectil(p, true),
  });
}
function destruirProyectil(p, porRayo) {
  if (!p.vivo) return;
  p.vivo = false;
  G.objetivos.delete(p.id);
  FX.estallido(p.pos, { color: porRayo ? '#ffd84a' : '#ff3d6e', cantidad: 18, velocidad: 4, vida: 0.5, tam: 0.3 });
}
function lanzarOnda(vel, dano, forzar = false) {
  const J = D.jefe;
  if (!J || J.estado === 'muerto' || J.estado === 'muriendo' || D.fase !== 'jefe') return;
  D.ondas.push({ x: J.pos.x, z: J.pos.z, r: 1.5, vel, dano, forzar, vivo: true, golpeo: false, id: Math.random() });
  sonido('impacto', { tono: 0.5, volumen: 0.7 });
  sacudir(0.2);
}

function iniciarPregunta(q) {
  const P = PREGUNTAS[q];
  const opciones = barajar(P.opciones.map((texto, k) => ({ texto, correcta: k === 0 })));
  D.cristales = opciones.map((o, k) => {
    const id = `cristal_${q}_${k}`;
    const pos = new Vector3(CRISTALES_POS[k].x, CRISTALES_POS[k].y, CRISTALES_POS[k].z);
    const c = { id, ...o, pos, vivo: true, fase: k };
    G.objetivos.set(id, {
      tipo: 'cristal',
      pos,
      radio: 1,
      prioridad: -0.3,
      colorImpacto: '#9fe8ff',
      activo: () => c.vivo,
      golpe: () => resolverPregunta(q, c),
    });
    return c;
  });
  const s = juego();
  s.set({
    pregunta: { texto: P.pregunta, n: q + 1, total: 4 },
    cristales: D.cristales.map((c) => ({ id: c.id, texto: c.texto })),
    objetivo: `Pregunta ${q + 1}/4: destruye el cristal correcto`,
  });
  sonido('tic');
}

function resolverPregunta(q, cristal) {
  if (D.preguntas[q]) return;
  const P = PREGUNTAS[q];
  const ok = !!cristal?.correcta;
  D.preguntas[q] = { elegida: cristal ? cristal.texto : null, ok };
  const correcta = D.cristales.find((c) => c.correcta);
  for (const c of D.cristales) {
    if (c.vivo) {
      const elegido = c === cristal;
      FX.estallido(c.pos, { color: elegido ? (ok ? '#9fe8ff' : '#ff5d7a') : '#d6c8ff', cantidad: elegido ? 60 : 16, velocidad: elegido ? 8 : 3, vida: elegido ? 1 : 0.5, tam: 0.4, gravedad: -6 });
    }
    c.vivo = false;
    G.objetivos.delete(c.id);
  }
  const s = juego();
  const J = D.jefe;
  const j = G.jugador;
  if (ok) {
    s.sumar(PUNTAJE.pregunta);
    sonido('cristal');
    camaraLenta(1.3, 0.22);
    const desde = j.mano.clone();
    const hasta = J.pos.clone().add(new Vector3(0, 2.6, 0));
    setTimeout(() => {
      FX.rayo(desde, hasta, { color: '#ffe066', grosor: 0.65, vida: 0.9 });
      FX.estallido(hasta, { color: '#ffd84a', cantidad: 120, velocidad: 10, vida: 1.2, tam: 0.55 });
      FX.onda(hasta, { color: '#fff1b8', radio: 9, vida: 0.8 });
      FX.flash('#ffffff', 0.6);
      FX.numero(hasta.clone().add(new Vector3(0, 1.5, 0)), '−25 %', '#ffe066');
      sacudir(0.9);
      vibrar(120);
      sonido('golpeJefe');
      J.vida = Math.max(0, J.vida - 0.25);
      J.golpeHasta = ahora() + 0.7;
      s.set({ jefe: J.vida > 0.001 ? { vida: J.vida, nombre: 'EL RETRASO DIAGNÓSTICO' } : { vida: 0, nombre: 'EL RETRASO DIAGNÓSTICO' } });
      if (J.vida <= 0.001) explotarJefe(true);
    }, 180);
    s.aviso('¡GOLPE CRÍTICO! +30', 'mision', 1800);
  } else {
    sonido('error');
    J.ataqueHasta = ahora() + 0.9;
    setTimeout(() => lanzarOnda(22, 15, true), 450);
    s.aviso(cristal ? '¡Respuesta incorrecta! El jefe contraataca' : '¡Tiempo! El jefe contraataca', 'mal', 2200);
    s.hablar('juan', `Era «${correcta.texto}». ${P.explicacion}`, 7500);
    s.mostrarTarjeta('Dato correcto', P.explicacion, 'dato', 5000);
  }
  s.set({ pregunta: null, cristales: [], objetivo: q < 3 ? 'Esquiva los ataques: viene otra pregunta' : 'Remata al jefe' });
}

function explotarJefe(porAciertos) {
  const J = D.jefe;
  if (!J || J.estado === 'muriendo' || J.estado === 'muerto') return;
  J.estado = 'muriendo';
  J.tEstado = G.t;
  for (const p of D.proyectiles) destruirProyectil(p, true);
  D.ondas.forEach((o) => (o.vivo = false));
  const s = juego();
  const aciertos = D.preguntas.filter((p) => p?.ok).length;
  s.set({ objetivo: 'Prepárate para la salida', cuentaObjetivo: null, pregunta: null, cristales: [] });
  if (porAciertos) {
    s.aviso('¡EL RETRASO DIAGNÓSTICO HA CAÍDO!', 'mision', 2800);
    s.hablar('juan', '¡Lo lograste! Reconocer los signos a tiempo acorta el retraso diagnóstico.', 6000);
  } else {
    s.aviso(`Jefe derrotado · ${aciertos}/4 aciertos`, 'mision', 2600);
    s.hablar('juan', 'Se desvanece… por ahora. Al final repasamos los datos que se te escaparon.', 6000);
  }
}

// ---------------------------------------------------------------------
// FASE 3: SALIDA (encuesta corriendo por arcos)
// ---------------------------------------------------------------------
export const TIEMPOS_FILAS = [7.5, 15, 22.5];
export const T_PORTAL = 29.5;

export function geometriaFila(n) {
  const ancho = 12 / n;
  return Array.from({ length: n }, (_, k) => ({ z: 6 - ancho * (k + 0.5), ancho }));
}

function iniciarSalida() {
  for (const p of D.proyectiles) destruirProyectil(p, true);
  D.ondas = [];
  if (D.jefe && D.jefe.estado !== 'muerto') D.jefe.estado = 'muerto';
  if (D.q < 4) for (let q = 0; q < 4; q++) if (!D.preguntas[q]) D.preguntas[q] = { elegida: null, ok: false };
  G.objetivos.clear();
  D.fase = 'salida';
  D.etapa = 'carrera';
  D.filaActual = 0;
  fundido();
  const j = G.jugador;
  j.modo = 'carrera';
  j.lateralUsado = false;
  j.teleport = { x: PASARELA.x0, y: PASARELA.y + 0.05, z: 0, yaw: -Math.PI / 2 };
  G.camara.modo = 'carrera';
  G.camara.jefe = false;
  D.filas = ENCUESTA.map((e, k) => ({
    ...e,
    x: xCarrera(TIEMPOS_FILAS[k], T.salidaIntro),
    arcos: geometriaFila(e.opciones.length),
    elegido: null,
  }));
  const s = juego();
  s.set({
    fase: 'salida',
    etapa: 'carrera',
    titulo: 'Salida',
    objetivo: 'Pasa por el arco de tu respuesta',
    cuentaObjetivo: null,
    jefe: null,
    pregunta: null,
    cristales: [],
    filas: D.filas.map((f) => ({ id: f.id, x: f.x, pregunta: f.pregunta, opciones: f.opciones, arcos: f.arcos })),
    fila: { texto: ENCUESTA[0].pregunta, n: 1, total: 3 },
  });
  s.hablar('gino', TEXTOS.radio.salida, 7000);
  musica('salida');
}

function actualizarSalida() {
  const j = G.jugador;
  const s = juego();
  const tl = G.t - (T.porMision * 3 + T.jefe);
  if (D.filaActual < D.filas.length) {
    const f = D.filas[D.filaActual];
    if (j.pos.x <= f.x) {
      const ancho = 12 / f.opciones.length;
      const k = Math.max(0, Math.min(f.opciones.length - 1, Math.floor((6 - j.pos.z) / ancho)));
      const op = f.opciones[k];
      if (j.lateralUsado) {
        f.elegido = k;
        D.encuesta[f.id] = op.valor;
        FX.estallido(new Vector3(f.x, PASARELA.y + 2, f.arcos[k].z), { color: '#ffd84a', cantidad: 60, velocidad: 7, vida: 0.9, tam: 0.45 });
        sonido('recoger', { tono: 1.2 });
        s.aviso(`Tu respuesta: ${op.texto}`, 'bien', 1500);
      } else {
        f.elegido = -1;
        sonido('error', { volumen: 0.5 });
        s.aviso('Sin respuesta (no te moviste)', 'info', 1500);
      }
      D.filaActual++;
      j.lateralUsado = false;
      const sig = D.filas[D.filaActual];
      s.set({ fila: sig ? { texto: sig.pregunta, n: D.filaActual + 1, total: 3 } : null, objetivo: sig ? 'Pasa por el arco de tu respuesta' : 'Cruza el portal dorado' });
      if (!sig) s.hablar('gino', TEXTOS.radio.final, 6000);
    }
  }
  if (tl >= T_PORTAL && !D.portal) {
    D.portal = true;
    FX.flash('#ffe9a8', 0.8);
    sonido('portal');
  }
}

// ---------------------------------------------------------------------
// RESULTADOS
// ---------------------------------------------------------------------
export function rangoDe(puntaje) {
  return RANGOS.find((r) => puntaje >= r.min);
}

function finalizar() {
  if (D.finalizado) return;
  D.finalizado = true;
  D.portal = false;
  G.activo = false;
  G.t = T.total;
  soltarPuntero();
  const s = juego();
  const vida = s.vida;
  const bono = Math.round(vida * PUNTAJE.bonoVida);
  const puntaje = s.puntaje + bono;
  const rango = rangoDe(puntaje);
  const avatar = AVATARES.find((a) => a.id === s.perfil.avatar) || AVATARES[0];

  const registro = {
    id: (crypto.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2)),
    version: '3d',
    nombre: s.perfil.nombre || 'Anónimo',
    semestre: s.perfil.semestre || 'Otro',
    avatar: avatar.nombre,
    puntaje,
    rango: rango.nombre,
    vida_final: vida,
    bono_vida: bono,
    mitos_destruidos: D.mitosDestruidos,
  };
  // Orbes: t_<id> = 1 si quedó bien clasificado (alarma recogida o esperable no recogida)
  let correctos = 0;
  let incorrectos = 0;
  const alarmaRec = [];
  const esperRec = [];
  PACIENTES.forEach((P) =>
    P.orbes.forEach((o) => {
      const rec = !!D.recogidos[o.id];
      const bien = o.tipo === 'alarma' ? rec : !rec;
      registro['t_' + o.id] = bien ? 1 : 0;
      if (rec && o.tipo === 'alarma') {
        correctos++;
        alarmaRec.push(o.texto);
      }
      if (rec && o.tipo !== 'alarma') {
        incorrectos++;
        esperRec.push(o.texto);
      }
    }),
  );
  registro.orbes_correctos = correctos;
  registro.orbes_incorrectos = incorrectos;
  registro.orbes_alarma_recogidos = alarmaRec.join(' | ');
  registro.orbes_esperables_recogidos = esperRec.join(' | ');
  let misionesOk = 0;
  PACIENTES.forEach((P, i) => {
    const d = D.decisiones[i] ?? null;
    registro[`m${i + 1}_destino`] = d ? DESTINOS[d].sala : 'sin decisión';
    registro[`m${i + 1}_ok`] = d === P.correcto ? 1 : 0;
    if (d === P.correcto) misionesOk++;
  });
  registro.misiones_correctas = misionesOk;
  let pregOk = 0;
  PREGUNTAS.forEach((P, q) => {
    const r = D.preguntas[q] || { elegida: null, ok: false };
    registro[P.id] = r.elegida ?? 'sin respuesta';
    registro[P.id + '_ok'] = r.ok ? 1 : 0;
    if (r.ok) pregOk++;
  });
  registro.preguntas_correctas = pregOk;
  registro.op_entendiste = D.encuesta.op_entendiste ?? '';
  registro.op_innovador = D.encuesta.op_innovador ?? '';
  registro.op_reconocerias = D.encuesta.op_reconocerias ?? 'sin respuesta';
  registro.tiempo_total_s = T.total;
  registro.dispositivo = G.entrada.tactil ? 'celular' : 'computador';
  registro.calidad = G.calidad;
  registro.fecha_local = new Date().toLocaleString('es-CO');

  const envio = PARAMS.demo ? Promise.resolve('demo') : enviarResultado(registro);
  s.set({
    pantalla: 'resultados',
    resultado: { registro, bono, rango, envio: 'enviando', recogidos: { ...D.recogidos }, decisiones: [...D.decisiones], preguntas: [...D.preguntas], encuesta: { ...D.encuesta } },
    radio: null,
    tarjeta: null,
    fila: null,
    pregunta: null,
    jefe: null,
    interaccion: null,
    puntaje,
    segundos: T.total,
  });
  envio.then((estado) => {
    const r = juego().resultado;
    if (r && r.registro.id === registro.id) juego().set({ resultado: { ...r, envio: estado } });
  });
  // Escena final
  const j = G.jugador;
  j.modo = 'quieto';
  j.victoria = true;
  j.teleport = { x: xCarrera(T_PORTAL, T.salidaIntro) + 7, y: PASARELA.y + 0.05, z: 0, yaw: Math.PI / 2 };
  G.camara.modo = 'resultados';
  musica('final');
  ambienteHospital(false);
  if (PARAMS.demo && PARAMS.loop) {
    setTimeout(() => {
      if (juego().pantalla === 'resultados') reiniciarDemo();
    }, 25000);
  }
}

let reinicioDemo = null;
export function alReiniciarDemo(fn) {
  reinicioDemo = fn;
}
function reiniciarDemo() {
  reinicioDemo?.();
}

export function volverAlInicio() {
  G.activo = false;
  D.finalizado = true;
  G.jugador.victoria = false;
  G.jugador.modo = 'quieto';
  G.jugador.teleport = { x: SPAWN.x, y: 0.05, z: SPAWN.z, yaw: SPAWN.yaw };
  G.camara.modo = 'orbita';
  G.objetivos.clear();
  musica('nada');
  juego().set({ pantalla: 'seleccion', resultado: null, partida: juego().partida + 1, segundos: 0 });
}
