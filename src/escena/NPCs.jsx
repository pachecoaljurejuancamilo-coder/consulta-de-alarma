// Personajes no jugables: pacientes, enfermería y médicos que caminan; camillas que se mueven.
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MeshStandardMaterial, Vector3 } from 'three';
import { MODELOS, clonarModelo, Animador } from './personajes.js';
import { PACIENTES } from '../data/contenido.js';
import { CONSULTORIOS, Z_CAMILLA, FUENTE } from '../juego/mapa.js';
import { ASIENTOS_ESPERA } from './Hospital.jsx';
import { G } from '../juego/mundo.js';

const ALTO = 1.72;
const ROPA = {
  enfermera: { Shirt: '#3e9c8f', Pants: '#3e9c8f', Shoes: '#f2f2f2', Socks: '#f2f2f2' },
  medico: { Shirt: '#f6f6f6', Pants: '#2d3b55', Details: '#9cc8e6', TieTexture: '#8e1b35' },
  paciente1: { Shirt: '#f2c42c', Pants: '#33415c' },
  paciente2: { Shirt: '#ea93ab', Pants: '#2b2b2b' },
  paciente3: { Shirt: '#7fc6a4', Pants: '#4b3b2b' },
};
const PIELES = ['#e8b796', '#c68b63', '#8d5a3b', '#f1c7a8', '#a9714b'];

// Recorridos en bucle de los que caminan
const RUTAS = {
  plaza: [
    [-8, 22],
    [-8, 33],
    [8, 33],
    [8, 22],
  ],
  plaza2: [
    [-26, 18],
    [-14, 30],
    [-26, 34],
  ],
  lobby: [
    [3, 7],
    [3, -0.5],
    [10, -0.5],
    [10, 7],
  ],
  urgencias: [
    [12, 1.2],
    [30, 1.2],
  ],
};

function construirLista(calidad) {
  const lista = [];
  // Pacientes de las misiones, sentadas en la camilla de su consultorio
  PACIENTES.forEach((P) => {
    const sala = CONSULTORIOS[P.consultorio];
    lista.push({ id: P.id, modelo: P.modelo, ropa: { ...P.ropa, Skin: P.piel, Hair: P.pelo }, tipo: 'sentado', x: sala.cx - 0.1, y: 0.36, z: Z_CAMILLA + 0.32, yaw: 0, siempre: true });
  });
  const n = calidad === 'alta' ? 1 : calidad === 'media' ? 0.7 : 0.4;
  const asientos = ASIENTOS_ESPERA.slice(0, Math.round(6 * n));
  asientos.forEach((a, i) =>
    lista.push({ id: 'espera' + i, modelo: ['npc_mujer_a', 'npc_hombre_a', 'npc_mujer_b', 'npc_hombre_b'][i % 4], ropa: { ...ROPA['paciente' + ((i % 3) + 1)], Skin: PIELES[i % 5] }, tipo: 'sentado', x: a.x, y: 0.02, z: a.z - 0.05, yaw: a.yaw }),
  );
  // Personal de pie
  lista.push({ id: 'recepcion', modelo: 'npc_mujer_b', ropa: { ...ROPA.enfermera, Skin: PIELES[1] }, tipo: 'quieto', x: -7.1, y: 0, z: 3.6, yaw: Math.PI / 2 });
  lista.push({ id: 'farmaceuta', modelo: 'npc_hombre_b', ropa: { ...ROPA.medico, Skin: PIELES[2] }, tipo: 'quieto', x: -26, y: 0, z: -13.2, yaw: 0 });
  lista.push({ id: 'gineco', modelo: 'npc_mujer_a', ropa: { Shirt: '#f6f6f6', Pants: '#8e1b35', Skin: PIELES[0], Shoes: '#f0f0f0' }, tipo: 'quieto', x: 27, y: 0, z: -17.6, yaw: -0.6 });
  // Caminantes
  const caminantes = [
    { ruta: 'plaza', modelo: 'npc_hombre_b', ropa: ROPA.medico, fase: 0 },
    { ruta: 'plaza', modelo: 'npc_mujer_c', ropa: { Dress: '#5b98cc' }, fase: 0.5 },
    { ruta: 'lobby', modelo: 'npc_mujer_a', ropa: ROPA.enfermera, fase: 0.2 },
    { ruta: 'plaza2', modelo: 'npc_hombre_a', ropa: ROPA.paciente1, fase: 0.3 },
    { ruta: 'urgencias', modelo: 'npc_hombre_a', ropa: ROPA.enfermera, fase: 0.1 },
    { ruta: 'plaza2', modelo: 'npc_mujer_b', ropa: ROPA.paciente2, fase: 0.8 },
  ].slice(0, Math.round(6 * n));
  caminantes.forEach((c, i) => lista.push({ id: 'cam' + i, modelo: c.modelo, ropa: { ...c.ropa, Skin: PIELES[(i + 2) % 5] }, tipo: 'camina', ruta: RUTAS[c.ruta], fase: c.fase, vel: 1.25 + (i % 3) * 0.15 }));
  return lista;
}

export default function NPCs({ calidad }) {
  const gltfs = {
    npc_mujer_a: useGLTF(MODELOS.npc_mujer_a, false, true),
    npc_mujer_b: useGLTF(MODELOS.npc_mujer_b, false, true),
    npc_mujer_c: useGLTF(MODELOS.npc_mujer_c, false, true),
    npc_hombre_a: useGLTF(MODELOS.npc_hombre_a, false, true),
    npc_hombre_b: useGLTF(MODELOS.npc_hombre_b, false, true),
  };
  const lista = useMemo(() => construirLista(calidad), [calidad]);
  const npcs = useMemo(
    () =>
      lista.map((d) => {
        const g = gltfs[d.modelo];
        const raiz = clonarModelo(g, d.ropa, { sombra: calidad !== 'baja', alto: ALTO });
        const anim = new Animador(raiz, g.animations);
        anim.play(d.tipo === 'sentado' ? 'Sitting' : d.tipo === 'camina' ? 'Walk' : 'Idle');
        anim.mixer.update(Math.random() * 2);
        return { d, raiz, anim, largo: d.ruta ? largoRuta(d.ruta) : 0, s: (d.fase || 0) * (d.ruta ? largoRuta(d.ruta) : 0) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lista],
  );

  const contador = useRef(0);
  useFrame((state, dtReal) => {
    const dt = Math.min(dtReal, 0.1) * G.escala;
    contador.current++;
    const cam = state.camera.position;
    for (const n of npcs) {
      const { d, raiz } = n;
      if (d.tipo === 'camina') {
        n.s = (n.s + d.vel * dt) % n.largo;
        const { x, z, yaw } = puntoRuta(d.ruta, n.s);
        raiz.position.set(x, 0, z);
        let dy = yaw - raiz.rotation.y;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        raiz.rotation.y += dy * Math.min(1, dt * 6);
      } else if (!n.colocado) {
        raiz.position.set(d.x, d.y, d.z);
        raiz.rotation.y = d.yaw;
        n.colocado = true;
      }
      // Animar solo si está cerca (y a menos fps si está lejos)
      const dist = cam.distanceTo(raiz.position);
      raiz.visible = dist < 75;
      if (dist < 28 || (contador.current % 3 === 0 && dist < 75)) n.anim.update(dist < 28 ? dt : dt * 3);
    }
  });

  return (
    <group>
      {npcs.map((n) => (
        <primitive key={n.d.id} object={n.raiz} />
      ))}
      <Camillas gltf={gltfs.npc_hombre_a} gltf2={gltfs.npc_mujer_a} calidad={calidad} />
    </group>
  );
}

function largoRuta(r) {
  let l = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    l += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return l;
}
function puntoRuta(r, s) {
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s <= l) {
      const k = s / l;
      return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, yaw: Math.atan2(b[0] - a[0], b[1] - a[1]) };
    }
    s -= l;
  }
  return { x: r[0][0], z: r[0][1], yaw: 0 };
}

// Camillas empujadas por enfermería a lo largo del pasillo (obstáculos móviles)
const CARRILES = [
  { z: -4.1, x0: -24, x1: 24, vel: 2.4, fase: 0 },
  { z: -6.1, x0: -24, x1: 24, vel: 2.1, fase: 0.55 },
];

function Camillas({ gltf, gltf2, calidad }) {
  const datos = useMemo(
    () =>
      CARRILES.map((c, i) => {
        const raiz = clonarModelo(i % 2 ? gltf2 : gltf, { ...ROPA.enfermera, Skin: PIELES[i + 1] }, { sombra: calidad !== 'baja', alto: ALTO });
        const anim = new Animador(raiz, (i % 2 ? gltf2 : gltf).animations);
        anim.play('Walk');
        const obstaculo = { pos: new Vector3(), radio: 1.4 };
        return { c, raiz, anim, obstaculo, s: c.fase * 2 * (c.x1 - c.x0) };
      }),
    [gltf, gltf2, calidad],
  );
  useEffect(() => {
    G.obstaculos = datos.map((d) => d.obstaculo);
    return () => {
      G.obstaculos = [];
    };
  }, [datos]);
  const cuerpos = useRef([]);
  const grupos = useRef([]);
  const metal = useMemo(() => new MeshStandardMaterial({ color: '#a7b0b8', metalness: 0.6, roughness: 0.35 }), []);
  const sabana = useMemo(() => new MeshStandardMaterial({ color: '#e9f4f8', roughness: 0.8 }), []);

  useFrame((_, dtReal) => {
    const dt = Math.min(dtReal, 0.1) * G.escala;
    datos.forEach((d, i) => {
      const L = d.c.x1 - d.c.x0;
      d.s = (d.s + d.c.vel * dt) % (2 * L);
      const ida = d.s < L;
      const x = ida ? d.c.x0 + d.s : d.c.x1 - (d.s - L);
      const dir = ida ? 1 : -1;
      // Camilla delante, enfermera detrás
      const xc = x + dir * 1.1;
      d.obstaculo.pos.set(xc, 0, d.c.z);
      const g = grupos.current[i];
      if (g) {
        g.position.set(xc, 0, d.c.z);
      }
      d.raiz.position.set(x - dir * 0.2, 0, d.c.z);
      d.raiz.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      d.anim.update(dt);
      const b = cuerpos.current[i];
      if (b) b.setNextKinematicTranslation({ x: xc, y: 0, z: d.c.z });
    });
  });

  return datos.map((d, i) => (
    <group key={i}>
      <primitive object={d.raiz} />
      <RigidBody ref={(r) => (cuerpos.current[i] = r)} type="kinematicPosition" colliders={false} position={[0, 0, d.c.z]}>
        <CuboidCollider args={[1.05, 0.5, 0.45]} position={[0, 0.5, 0]} />
      </RigidBody>
      <group ref={(r) => (grupos.current[i] = r)}>
        <mesh position={[0, 0.55, 0]} material={metal} castShadow>
          <boxGeometry args={[2.0, 0.12, 0.8]} />
        </mesh>
        <mesh position={[0, 0.66, 0]} material={sabana} castShadow>
          <boxGeometry args={[1.9, 0.12, 0.74]} />
        </mesh>
        {[
          [-0.85, -0.32],
          [0.85, -0.32],
          [-0.85, 0.32],
          [0.85, 0.32],
        ].map(([x, z], k) => (
          <mesh key={k} position={[x, 0.27, z]} material={metal}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
          </mesh>
        ))}
      </group>
    </group>
  ));
}

export { FUENTE };
