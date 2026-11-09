// Distribución del mundo (metros). +x = este, -z = norte. El suelo está en y = 0.
// Hospital: plaza al sur (z 10…40), fachada en z = 10, interior sin techo (patio caribeño).

export const ALTO_MURO = 3.6;
const E = 0.3; // grosor de muros

export const Z = { norte: -22, pasilloN: -8, pasilloS: -2, fachada: 10, plazaFin: 40 };
export const X = { oeste: -32, este: 32, limite: 40 };

// Franja norte: farmacia, 3 consultorios y ginecología
export const SALAS = [
  { id: 'farmacia', nombre: 'FARMACIA', x0: -32, x1: -19.2, cx: -25.6 },
  { id: 'c1', nombre: 'CONSULTORIO 1', x0: -19.2, x1: -6.4, cx: -12.8 },
  { id: 'c2', nombre: 'CONSULTORIO 2', x0: -6.4, x1: 6.4, cx: 0 },
  { id: 'c3', nombre: 'CONSULTORIO 3', x0: 6.4, x1: 19.2, cx: 12.8 },
  { id: 'ginecologia', nombre: 'GINECOLOGÍA', x0: 19.2, x1: 32, cx: 25.6 },
];
export const CONSULTORIOS = [SALAS[1], SALAS[2], SALAS[3]];
export const CZ_SALA = -15; // centro z de las salas del norte
export const Z_CAMILLA = -20.2;
export const ANCHO_PUERTA = 3;

export const SPAWN = { x: 0, z: 20, yaw: Math.PI };

export function dentroSala(sala, p, margen = 0.2) {
  return p.x > sala.x0 + margen && p.x < sala.x1 - margen && p.z < Z.pasilloN - 0.6 && p.z > Z.norte;
}
export const salaPorId = (id) => SALAS.find((s) => s.id === id);

// ---------------------------------------------------------------------
// Muros y bloques: {x, y, z, sx, sy, sz, mat, col (colisión), tile}
// (x, y, z) es el centro de la caja.
// ---------------------------------------------------------------------
function caja(x0, x1, y0, y1, z0, z1, mat, extra = {}) {
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: Math.abs(x1 - x0), sy: Math.abs(y1 - y0), sz: Math.abs(z1 - z0), mat, col: true, ...extra };
}

export function construirMuros() {
  const m = [];
  const H = ALTO_MURO;
  // Muros exteriores del hospital
  m.push(caja(X.oeste - E, X.oeste, 0, H, Z.norte - E, Z.fachada, 'muroExt'));
  m.push(caja(X.este, X.este + E, 0, H, Z.norte - E, Z.fachada, 'muroExt'));
  m.push(caja(X.oeste - E, X.este + E, 0, H, Z.norte - E, Z.norte, 'muroExt'));

  // Muro norte del pasillo, con puertas centradas en cada sala
  const huecos = SALAS.map((s) => [s.cx - ANCHO_PUERTA / 2, s.cx + ANCHO_PUERTA / 2]);
  let x = X.oeste;
  for (const [a, b] of huecos) {
    if (a > x) m.push(caja(x, a, 0, H, Z.pasilloN - E / 2, Z.pasilloN + E / 2, 'muroInt'));
    m.push(caja(a, b, 2.8, H, Z.pasilloN - E / 2, Z.pasilloN + E / 2, 'muroInt')); // dintel
    x = b;
  }
  m.push(caja(x, X.este, 0, H, Z.pasilloN - E / 2, Z.pasilloN + E / 2, 'muroInt'));

  // Divisiones entre salas
  for (const s of SALAS.slice(1)) m.push(caja(s.x0 - E / 2, s.x0 + E / 2, 0, H, Z.norte, Z.pasilloN, 'muroInt'));

  // Paredes de color dentro de farmacia y ginecología (detrás, decorativas)
  m.push(caja(-31.95, -31.75, 0.05, 3.2, -21.8, -8.6, 'acentoFarmacia', { col: false }));
  m.push(caja(31.75, 31.95, 0.05, 3.2, -21.8, -8.6, 'acentoGine', { col: false }));
  // Zócalo de color en el pasillo
  m.push(caja(X.oeste, X.este, 0.02, 1.1, Z.pasilloN + E / 2, Z.pasilloN + E / 2 + 0.05, 'zocalo', { col: false }));

  // Columnas entre el pasillo y urgencias
  for (const cx of [-19.2, -6.4, 6.4, 19.2]) m.push(caja(cx - 0.35, cx + 0.35, 0, H, Z.pasilloS - 0.35, Z.pasilloS + 0.35, 'columna'));

  // Fachada (dos pisos) con tramos de colores
  const tramos = [
    [-X.limite, -32.3, 'muroJardin', 3],
    [-32.3, -18, 'fachadaAmarilla', 9],
    [-18, -6, 'fachadaCoral', 9],
    [-6, -2.5, 'fachadaCrema', 9],
    [2.5, 6, 'fachadaCrema', 9],
    [6, 18, 'fachadaAzul', 9],
    [18, 32.3, 'fachadaRosa', 9],
    [32.3, X.limite, 'muroJardin', 3],
  ];
  for (const [a, b, mat, alto] of tramos) m.push(caja(a, b, 0, alto, Z.fachada, Z.fachada + 0.8, mat));
  m.push(caja(-2.5, 2.5, 3.6, 9, Z.fachada, Z.fachada + 0.8, 'fachadaCrema')); // sobre la entrada

  // Límites de la plaza
  m.push(caja(-X.limite - 0.4, -X.limite, 0, 2.2, Z.fachada, Z.plazaFin, 'muroJardin'));
  m.push(caja(X.limite, X.limite + 0.4, 0, 2.2, Z.fachada, Z.plazaFin, 'muroJardin'));
  m.push(caja(-X.limite, X.limite, 0, 1.2, Z.plazaFin, Z.plazaFin + 0.4, 'muroJardin'));

  // Recepción de urgencias
  m.push(caja(-6.2, -5.2, 0, 1.1, 0.8, 5.5, 'recepcion'));
  m.push(caja(-6.4, -5.0, 1.1, 1.18, 0.6, 5.7, 'mesonClaro', { col: false }));

  // Cubículos de urgencias (cortinas) al este
  for (const cx of [13, 17.5, 22, 26.5, 31]) m.push(caja(cx - 0.05, cx + 0.05, 0, 2.3, 3.2, 9.6, 'cortina'));

  return m;
}

// Mostradores y muebles con colisión (además de los muros)
export function construirMuebles() {
  const m = [];
  // Farmacia: mostrador
  m.push(caja(-31.6, -21.2, 0, 1.05, -11.6, -10.8, 'mostrador'));
  // Consultorios: camillas (colisión) y escritorios
  for (const s of CONSULTORIOS) {
    m.push(caja(s.cx - 1.1, s.cx + 1.1, 0, 0.75, Z_CAMILLA - 0.5, Z_CAMILLA + 0.5, null));
  }
  // Ginecología: camilla
  m.push(caja(26.5, 30.5, 0, 0.75, -20.5, -19.5, null));
  // Fuente de la plaza (colisión cilíndrica aproximada con una caja)
  m.push(caja(-3.2, 3.2, 0, 0.9, 24.8, 31.2, null));
  return m;
}

export const FUENTE = { x: 0, z: 28, radio: 3.6 };

// ---------------------------------------------------------------------
// Ruta para el autopiloto y la minimapa (nodos y conexiones)
// ---------------------------------------------------------------------
const NODOS = {
  plaza: [0, 20],
  plazaE: [9, 18],
  plazaO: [-9, 18],
  entradaFuera: [0, 13],
  entradaDentro: [0, 7],
  lobby: [0, 0],
};
const CONEX = [
  ['plaza', 'entradaFuera'],
  ['plazaE', 'entradaFuera'],
  ['plazaO', 'entradaFuera'],
  ['plaza', 'plazaE'],
  ['plaza', 'plazaO'],
  ['entradaFuera', 'entradaDentro'],
  ['entradaDentro', 'lobby'],
];
SALAS.forEach((s, i) => {
  NODOS['pas_' + s.id] = [s.cx, -5];
  NODOS['puerta_' + s.id] = [s.cx, -9.6];
  NODOS['sala_' + s.id] = [s.cx, s.id === 'farmacia' || s.id === 'ginecologia' ? -15 : -13.2];
  CONEX.push(['pas_' + s.id, 'puerta_' + s.id], ['puerta_' + s.id, 'sala_' + s.id]);
  if (i > 0) CONEX.push(['pas_' + SALAS[i - 1].id, 'pas_' + s.id]);
});
CONEX.push(['lobby', 'pas_c2'], ['lobby', 'pas_c1'], ['lobby', 'pas_c3']);

export function rutaHacia(desde, haciaNodo) {
  // Nodo más cercano al jugador (con línea razonable) y BFS ponderado (Dijkstra simple)
  const nombres = Object.keys(NODOS);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  let inicio = nombres[0];
  let mejor = Infinity;
  for (const n of nombres) {
    const dd = d2(NODOS[n], [desde.x, desde.z]);
    if (dd < mejor) {
      mejor = dd;
      inicio = n;
    }
  }
  const vecinos = {};
  for (const [a, b] of CONEX) {
    (vecinos[a] ||= []).push(b);
    (vecinos[b] ||= []).push(a);
  }
  const dist = { [inicio]: 0 };
  const prev = {};
  const abiertos = new Set([inicio]);
  while (abiertos.size) {
    let u = null;
    for (const n of abiertos) if (u === null || dist[n] < dist[u]) u = n;
    abiertos.delete(u);
    if (u === haciaNodo) break;
    for (const v of vecinos[u] || []) {
      const nd = dist[u] + Math.sqrt(d2(NODOS[u], NODOS[v]));
      if (dist[v] === undefined || nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        abiertos.add(v);
      }
    }
  }
  const camino = [];
  let n = haciaNodo;
  while (n) {
    camino.unshift({ x: NODOS[n][0], z: NODOS[n][1], nodo: n });
    n = prev[n];
  }
  return camino;
}

// ---------------------------------------------------------------------
// Azotea del jefe y pasarela de salida (lejos del hospital)
// ---------------------------------------------------------------------
export const AZOTEA = { x: -150, y: 16, z: 0, radio: 15 };
export const JEFE_POS = { x: AZOTEA.x, y: AZOTEA.y, z: AZOTEA.z - 11 };
export const SPAWN_JEFE = { x: AZOTEA.x, z: AZOTEA.z + 5.5, yaw: Math.PI };
export const CRISTALES_POS = [-6.6, -2.2, 2.2, 6.6].map((dx) => ({ x: AZOTEA.x + dx, y: AZOTEA.y + 1.75, z: AZOTEA.z - 1 + Math.abs(dx) * 0.3 }));

export const PASARELA = {
  y: AZOTEA.y,
  x0: AZOTEA.x - 10, // inicio de la carrera
  xFin: AZOTEA.x - 300,
  ancho: 14,
  velocidad: 9,
};
// Posición x de la carrera en función del tiempo de la fase de salida
export const xCarrera = (tFase, intro) => PASARELA.x0 - PASARELA.velocidad * Math.max(0, tFase - intro);
