// Estado mutable del juego que cambia en cada frame (posiciones, entrada, entidades).
// No usa React: los componentes lo leen dentro de useFrame para no re-renderizar.
import { Vector3 } from 'three';

const q = new URLSearchParams(location.search);
export const PARAMS = {
  demo: q.get('demo') === '1',
  debug: q.get('debug') === '1',
  calidad: ['alta', 'media', 'baja'].includes(q.get('q')) ? q.get('q') : null,
  // Para pruebas: ?rapido=N acelera el reloj N veces (solo con demo).
  rapido: Math.max(1, Math.min(8, Number(q.get('rapido')) || 1)),
  loop: q.get('loop') !== '0',
  // Solo para pruebas (?debug=1&saltar=105): empieza el turno en ese segundo
  saltar: q.get('debug') === '1' ? Math.max(0, Math.min(175, Number(q.get('saltar')) || 0)) : 0,
};

export const ES_TACTIL =
  typeof window !== 'undefined' && (('ontouchstart' in window && navigator.maxTouchPoints > 0) || matchMedia('(pointer: coarse)').matches);

export const G = {
  // Reloj global (segundos de juego desde que empezó el turno; no se detiene).
  t: 0,
  activo: false,
  inicioMs: 0,
  // Cámara lenta: afecta a las entidades, no al reloj global.
  escala: 1,
  slowmoHasta: 0,
  dtJuego: 0,

  jugador: {
    pos: new Vector3(0, 0, 20),
    yaw: Math.PI, // hacia donde mira el cuerpo (radianes; 0 = +z)
    vel: new Vector3(),
    vy: 0,
    enSuelo: true,
    dashHasta: 0,
    dashListo: 0,
    dashDir: new Vector3(),
    invulnHasta: 0,
    disparoHasta: 0,
    disparoListo: 0,
    golpeHasta: 0,
    victoria: false,
    mano: new Vector3(), // posición mundial de la mano derecha (origen del rayo)
    teleport: null, // {x,y,z,yaw} pendiente
    modo: 'libre', // 'libre' | 'carrera' | 'quieto'
    carrera: null, // {x0, v, t0, z}
    velocidadActual: 0,
    lateralUsado: false,
  },

  camara: {
    yaw: Math.PI, // ángulo de órbita alrededor del jugador
    pitch: 0.32,
    dist: 5.6,
    shake: 0,
    modo: 'orbita', // 'orbita' | 'libre' | 'cine' | 'carrera' | 'resultados'
    cine: null, // {desde:Vector3, mira:Vector3, pos:Vector3}
    orbita: { centro: new Vector3(0, 2, 16), radio: 16, altura: 5, vel: 0.08 },
    ultimoArrastre: 0,
  },

  entrada: {
    mx: 0, // -1..1 (derecha positiva)
    my: 0, // -1..1 (adelante positivo)
    lookDx: 0,
    lookDy: 0,
    saltar: false,
    dash: false,
    disparar: false,
    mantenerDisparo: false,
    interactuar: false,
    teclas: new Set(),
    tactil: ES_TACTIL,
    joystick: { x: 0, y: 0 },
  },

  // Objetivos que el Rayo de evidencia puede golpear: id -> {tipo, pos, radio, activo(), golpe()}
  objetivos: new Map(),
  // Obstáculos móviles (para el autopiloto): [{pos: Vector3, radio}]
  obstaculos: [],
  // Enemigos que dañan por contacto (mitos, proyectiles, ondas): los maneja cada componente.
  objetivoActual: null, // objetivo asistido (para la mira)
  marcadores: [], // para la minimapa: [{x, z, tipo}]
  objetivoGuia: null, // {x, z} a donde apunta la flecha de la minimapa

  calidad: 'alta',
  particulas: 1,
  fps: 60,
};

export function resetMundo() {
  const j = G.jugador;
  j.pos.set(0, 0, 20);
  j.yaw = Math.PI;
  j.vel.set(0, 0, 0);
  j.vy = 0;
  j.enSuelo = true;
  j.dashHasta = j.dashListo = j.invulnHasta = j.disparoHasta = j.disparoListo = j.golpeHasta = 0;
  j.victoria = false;
  j.teleport = { x: 0, y: 0.05, z: 20, yaw: Math.PI };
  j.modo = 'libre';
  j.carrera = null;
  G.camara.yaw = Math.PI;
  G.camara.pitch = 0.3;
  G.camara.modo = 'libre';
  G.camara.cine = null;
  G.camara.jefe = false;
  G.objetivos.clear();
  G.marcadores = [];
  G.objetivoGuia = null;
  G.t = 0;
  G.escala = 1;
  G.slowmoHasta = 0;
}

// Tiempo real en segundos (para animaciones que no dependen del reloj del juego)
export const ahora = () => performance.now() / 1000;

export function camaraLenta(segundos, escala = 0.25) {
  G.slowmoHasta = ahora() + segundos;
  G.escala = escala;
}

export function sacudir(cantidad) {
  G.camara.shake = Math.max(G.camara.shake, cantidad);
}

export function vibrar(ms) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin vibración */
  }
}
