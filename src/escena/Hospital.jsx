// Hospital Universitario Buganvilia (ficticio): plaza caribeña, fachada colonial e interior.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { MeshStandardMaterial, MeshBasicMaterial, Color, DoubleSide, ShaderMaterial, AdditiveBlending } from 'three';
import { useMateriales, fusionarCajas, geometriaCaja, TILE } from './materiales.js';
import { construirMuros, construirMuebles, SALAS, CONSULTORIOS, Z_CAMILLA, FUENTE } from '../juego/mapa.js';
import { texturaLetrero, texturaECG } from './texturasCanvas.js';
import { Instancias, CajasInstanciadas, usePartes, MallaInstanciada } from './Utileria.jsx';
import { G } from '../juego/mundo.js';
import { TEXTOS } from '../data/contenido.js';

const URL = {
  palmera: ['modelos/palmera_1.glb', 'modelos/palmera_2.glb', 'modelos/palmera_3.glb'],
  arbusto: 'modelos/arbusto_flores.glb',
  banca: 'modelos/banca.glb',
  farol: 'modelos/farol.glb',
  estante: 'modelos/estante.glb',
  escritorio: 'modelos/escritorio.glb',
  silla: 'modelos/silla_oficina.glb',
};
const BUGANVILIA = { Flowers: '#ff3c9e', Leaves_NormalTree: '#7fae4a' };

export default function Hospital({ calidad }) {
  const mats = useMateriales();
  const muros = useMemo(() => construirMuros(), []);
  const muebles = useMemo(() => construirMuebles(), []);
  const grupos = useMemo(() => fusionarCajas(muros, mats), [muros, mats]);
  const suelos = useMemo(
    () =>
      fusionarCajas(
        [
          { x: 0, y: -0.1, z: 25.2, sx: 80.8, sy: 0.2, sz: 30.4, mat: 'plaza' },
          { x: 0, y: -0.1, z: -6, sx: 64.6, sy: 0.2, sz: 32.6, mat: 'piso' },
          { x: 0, y: -0.25, z: 10, sx: 260, sy: 0.2, sz: 200, mat: 'suelo' },
        ],
        mats,
      ),
    [mats],
  );

  return (
    <group>
      {suelos.map(({ mat, geo }) => (
        <mesh key={mat} geometry={geo} material={mats[mat]} receiveShadow />
      ))}
      {grupos.map(({ mat, geo }) => (
        <mesh key={mat} geometry={geo} material={mats[mat]} castShadow receiveShadow />
      ))}
      <Colisiones muros={muros} muebles={muebles} />
      <Fachada mats={mats} />
      <Interior mats={mats} calidad={calidad} />
      <Plaza mats={mats} calidad={calidad} />
      <Ciudad mats={mats} />
      {calidad !== 'baja' && <Sparkles count={calidad === 'alta' ? 90 : 45} scale={[60, 5, 34]} position={[0, 2.6, -6]} size={2.6} speed={0.18} opacity={0.55} color="#ffe2b0" />}
      {calidad !== 'baja' && <Sparkles count={calidad === 'alta' ? 60 : 30} scale={[70, 6, 26]} position={[0, 3, 26]} size={3} speed={0.15} opacity={0.5} color="#ffd59a" />}
    </group>
  );
}

function Colisiones({ muros, muebles }) {
  const lista = [...muros.filter((m) => m.col), ...muebles];
  return (
    <RigidBody type="fixed" colliders={false}>
      {lista.map((c, i) => (
        <CuboidCollider key={i} args={[c.sx / 2, c.sy / 2, c.sz / 2]} position={[c.x, c.y, c.z]} />
      ))}
      {/* Suelos */}
      <CuboidCollider args={[130, 0.5, 100]} position={[0, -0.5, 10]} />
      {/* Columnas de la marquesina y troncos de palmeras */}
      {[-3.2, 3.2].map((x) => (
        <CuboidCollider key={'m' + x} args={[0.18, 1.8, 0.18]} position={[x, 1.8, 13.3]} />
      ))}
      {PALMERAS.map((p, i) => (
        <CuboidCollider key={'p' + i} args={[0.35, 2, 0.35]} position={[p.x, 2, p.z]} />
      ))}
      {FAROLES.map((p, i) => (
        <CuboidCollider key={'f' + i} args={[0.15, 2, 0.15]} position={[p.x, 2, p.z]} />
      ))}
      {BANCAS.map((b, i) => (
        <CuboidCollider key={'b' + i} args={[0.9, 0.45, 0.35]} position={[b.x, 0.45, b.z]} rotation={[0, b.ry, 0]} />
      ))}
      {/* Sillas de espera */}
      {FILAS_SILLAS.map((f, i) => (
        <CuboidCollider key={'s' + i} args={[(f.x1 - f.x0) / 2, 0.45, 0.3]} position={[(f.x0 + f.x1) / 2, 0.45, f.z]} />
      ))}
      {/* Camillas de urgencias */}
      {[15.25, 19.75, 24.25, 28.75].map((x) => (
        <CuboidCollider key={'cu' + x} args={[0.45, 0.4, 1.05]} position={[x, 0.4, 6.6]} />
      ))}
      {/* Ambulancia */}
      <CuboidCollider args={[1.15, 1.3, 2.9]} position={[AMBULANCIA.x, 1.3, AMBULANCIA.z]} />
      {/* Escritorios de consultorios */}
      {CONSULTORIOS.map((s) => (
        <CuboidCollider key={'e' + s.id} args={[0.95, 0.45, 0.45]} position={[s.cx - 4, 0.45, -18.6]} />
      ))}
    </RigidBody>
  );
}

// ---------------------------------------------------------------------
// FACHADA
// ---------------------------------------------------------------------
const XS_VENTANAS = [-29.7, -26.1, -22.5, -18.9, -15.3, -11.7, -8.1, 8.1, 11.7, 15.3, 18.9, 22.5, 26.1, 29.7];
const ZF = 10.8;

function Fachada({ mats }) {
  const vidrio = useMemo(() => new MeshStandardMaterial({ color: '#253a52', roughness: 0.15, metalness: 0.4, emissive: '#ffbf73', emissiveIntensity: 0.22 }), []);
  const blanco = useMemo(() => new MeshStandardMaterial({ color: '#efe7da', roughness: 0.7 }), []);
  const madera = mats.maderaOscura;
  const { vidrios, marcos, losas, barrotes, barandas, contraventanas } = useMemo(() => {
    const vidrios = [];
    const marcos = [];
    const losas = [];
    const barrotes = [];
    const barandas = [];
    const contraventanas = [];
    for (const x of XS_VENTANAS) {
      for (const [y, h, w] of [
        [2.1, 1.7, 1.3],
        [6.5, 2.1, 1.25],
      ]) {
        vidrios.push({ x, y, z: ZF + 0.02, sx: w, sy: h, sz: 0.04 });
        marcos.push({ x, y: y + h / 2 + 0.08, z: ZF + 0.06, sx: w + 0.32, sy: 0.16, sz: 0.12 });
        marcos.push({ x, y: y - h / 2 - 0.08, z: ZF + 0.08, sx: w + 0.42, sy: 0.16, sz: 0.18 });
        marcos.push({ x: x - w / 2 - 0.08, y, z: ZF + 0.06, sx: 0.16, sy: h, sz: 0.12 });
        marcos.push({ x: x + w / 2 + 0.08, y, z: ZF + 0.06, sx: 0.16, sy: h, sz: 0.12 });
        // Contraventanas de madera abiertas
        contraventanas.push({ x: x - w / 2 - 0.5, y, z: ZF + 0.05, sx: 0.62, sy: h, sz: 0.06 });
        contraventanas.push({ x: x + w / 2 + 0.5, y, z: ZF + 0.05, sx: 0.62, sy: h, sz: 0.06 });
      }
      // Balcón del segundo piso
      losas.push({ x, y: 5.3, z: ZF + 0.5, sx: 2.1, sy: 0.16, sz: 1.0 });
      for (let k = 0; k <= 10; k++) barrotes.push({ x: x - 1 + k * 0.2, y: 5.85, z: ZF + 0.96, sx: 0.04, sy: 0.95, sz: 0.04 });
      for (const lado of [-1, 1]) for (let k = 1; k <= 4; k++) barrotes.push({ x: x + lado * 1.0, y: 5.85, z: ZF + k * 0.2, sx: 0.04, sy: 0.95, sz: 0.04 });
      barandas.push({ x, y: 6.35, z: ZF + 0.96, sx: 2.1, sy: 0.07, sz: 0.09 });
    }
    return { vidrios, marcos, losas, barrotes, barandas, contraventanas };
  }, []);

  const arbustos = useMemo(() => {
    const a = [];
    XS_VENTANAS.forEach((x, i) => {
      if (i % 2 === 0) a.push({ x: x + 0.9, y: 5.35, z: ZF + 0.55, s: 0.5, ry: i });
      a.push({ x: x + (i % 2 ? -1.6 : 1.6), y: 0, z: ZF + 0.8, s: 0.75, ry: i * 1.7 });
    });
    for (const x of [-4.4, 4.4]) a.push({ x, y: 0, z: ZF + 0.8, s: 0.8, ry: x });
    return a;
  }, []);

  const geoTejado = useMemo(() => geometriaCaja(65.4, 0.22, 2.2, TILE.tejas), []);
  const letrero = useMemo(() => texturaLetrero(TEXTOS.hospital.toUpperCase(), { ancho: 2048, alto: 300, fondo: '#8e1b35', color: '#fff7f2', borde: '#F2C42C', tam: 150 }), []);
  const urgencias = useMemo(() => texturaLetrero('URGENCIAS', { ancho: 1024, alto: 220, fondo: '#d7263d', color: '#ffffff', icono: 'cruz', tam: 140 }), []);

  return (
    <group>
      <CajasInstanciadas cajas={vidrios} material={vidrio} sombra={false} />
      <CajasInstanciadas cajas={marcos} material={blanco} />
      <CajasInstanciadas cajas={contraventanas} material={madera} />
      <CajasInstanciadas cajas={losas} material={madera} />
      <CajasInstanciadas cajas={barrotes} material={madera} sombra={false} />
      <CajasInstanciadas cajas={barandas} material={madera} />
      <Instancias url={URL.arbusto} transformaciones={arbustos} colores={BUGANVILIA} alto={1.4} />
      {/* Tejado de barro sobre la fachada */}
      <mesh position={[0, 9.35, 11.0]} rotation={[0.32, 0, 0]} material={mats.tejas} geometry={geoTejado} castShadow receiveShadow />
      <mesh position={[0, 9.05, 10.95]} material={blanco} castShadow>
        <boxGeometry args={[65, 0.3, 0.4]} />
      </mesh>
      <mesh position={[0, 4.6, 10.95]} material={blanco}>
        <boxGeometry args={[64.6, 0.18, 0.35]} />
      </mesh>
      {/* Letreros */}
      <mesh position={[0, 7.7, ZF + 0.06]}>
        <planeGeometry args={[8.6, 1.26]} />
        <meshStandardMaterial map={letrero} emissive="#ffffff" emissiveMap={letrero} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 4.15, ZF + 2.72]}>
        <planeGeometry args={[3.6, 0.78]} />
        <meshBasicMaterial map={urgencias} toneMapped={false} color="#ffffff" />
      </mesh>
      {/* Marquesina de la entrada */}
      <mesh position={[0, 3.75, 12.2]} material={blanco} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.25, 3.0]} />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 1.85, 13.3]} material={blanco} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 3.7, 10]} />
        </mesh>
      ))}
      <PuertaAutomatica x={0} z={10.4} ancho={5} alto={3.5} eje="x" />
    </group>
  );
}

// Puertas de vidrio que se abren al acercarse
function PuertaAutomatica({ x, z, ancho, alto, eje = 'x' }) {
  const izq = useRef();
  const der = useRef();
  const apertura = useRef(0);
  const mat = useMemo(() => new MeshStandardMaterial({ color: '#bfe3f2', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2 }), []);
  const marco = useMemo(() => new MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.6, roughness: 0.35 }), []);
  useFrame((_, dt) => {
    const p = G.jugador.pos;
    const cerca = Math.hypot(p.x - x, p.z - z) < 4.2 || G.puertasAbiertas;
    apertura.current += ((cerca ? 1 : 0) - apertura.current) * Math.min(1, dt * 6);
    const d = apertura.current * (ancho / 2 - 0.1);
    if (izq.current) izq.current.position.x = -ancho / 4 - d;
    if (der.current) der.current.position.x = ancho / 4 + d;
  });
  return (
    <group position={[x, 0, z]} rotation={[0, eje === 'x' ? 0 : Math.PI / 2, 0]}>
      <mesh ref={izq} position={[-ancho / 4, alto / 2, 0]} material={mat}>
        <boxGeometry args={[ancho / 2, alto, 0.06]} />
      </mesh>
      <mesh ref={der} position={[ancho / 4, alto / 2, 0]} material={mat}>
        <boxGeometry args={[ancho / 2, alto, 0.06]} />
      </mesh>
      <mesh position={[0, alto + 0.06, 0]} material={marco}>
        <boxGeometry args={[ancho + 0.2, 0.12, 0.16]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// INTERIOR
// ---------------------------------------------------------------------
const FILAS_SILLAS = [
  { x0: -27.5, x1: -21.5, z: 2.4 },
  { x0: -19.5, x1: -13.5, z: 2.4 },
  { x0: -27.5, x1: -21.5, z: 5.2 },
  { x0: -19.5, x1: -13.5, z: 5.2 },
  { x0: -27.5, x1: -21.5, z: 8.0 },
  { x0: -19.5, x1: -13.5, z: 8.0 },
];
export const ASIENTOS_ESPERA = FILAS_SILLAS.flatMap((f, i) => [
  { x: f.x0 + 0.85 + (i % 3) * 0.6, z: f.z, yaw: Math.PI },
  { x: f.x1 - 1.2 - (i % 2) * 1.2, z: f.z, yaw: Math.PI },
]);

function Interior({ mats, calidad }) {
  const ecg = useMemo(() => texturaECG(), []);
  const acum = useRef(0);
  useFrame((_, dt) => {
    acum.current += dt;
    if (acum.current > 0.05) {
      ecg.avanzar(Math.round(acum.current * 60));
      acum.current = 0;
    }
  });
  const blanco = useMemo(() => new MeshStandardMaterial({ color: '#f4f6f7', roughness: 0.5 }), []);
  const metal = useMemo(() => new MeshStandardMaterial({ color: '#9aa3ab', roughness: 0.35, metalness: 0.7 }), []);
  const colchon = useMemo(() => new MeshStandardMaterial({ color: '#5fa8c4', roughness: 0.7 }), []);
  const sillaMat = useMemo(() => new MeshStandardMaterial({ color: '#2f7f9e', roughness: 0.6 }), []);
  const cajaMed = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), []);

  // Sillas de espera
  const sillas = useMemo(() => {
    const asientos = [];
    const respaldos = [];
    const patas = [];
    for (const f of FILAS_SILLAS) {
      for (let x = f.x0 + 0.3; x <= f.x1 - 0.25; x += 0.6) {
        asientos.push({ x, y: 0.46, z: f.z, sx: 0.52, sy: 0.07, sz: 0.5 });
        respaldos.push({ x, y: 0.78, z: f.z + 0.24, sx: 0.52, sy: 0.55, sz: 0.06 });
      }
      patas.push({ x: (f.x0 + f.x1) / 2, y: 0.22, z: f.z, sx: f.x1 - f.x0, sy: 0.06, sz: 0.1 });
      patas.push({ x: f.x0 + 0.1, y: 0.22, z: f.z, sx: 0.06, sy: 0.44, sz: 0.4 });
      patas.push({ x: f.x1 - 0.1, y: 0.22, z: f.z, sx: 0.06, sy: 0.44, sz: 0.4 });
    }
    return { asientos, respaldos, patas };
  }, []);

  // Camillas: consultorios (a lo largo de x) y urgencias (a lo largo de z)
  const camillas = useMemo(() => {
    const marcos = [];
    const colchones = [];
    const almohadas = [];
    for (const s of CONSULTORIOS) {
      marcos.push({ x: s.cx, y: 0.42, z: Z_CAMILLA, sx: 2.2, sy: 0.55, sz: 0.9 });
      colchones.push({ x: s.cx, y: 0.76, z: Z_CAMILLA, sx: 2.1, sy: 0.14, sz: 0.86 });
      almohadas.push({ x: s.cx + 0.85, y: 0.88, z: Z_CAMILLA, sx: 0.4, sy: 0.1, sz: 0.6 });
    }
    marcos.push({ x: 28.5, y: 0.42, z: -20, sx: 3.6, sy: 0.55, sz: 0.95 });
    colchones.push({ x: 28.5, y: 0.76, z: -20, sx: 3.4, sy: 0.14, sz: 0.9 });
    for (const x of [15.25, 19.75, 24.25, 28.75]) {
      marcos.push({ x, y: 0.4, z: 6.6, sx: 0.85, sy: 0.5, sz: 2.05 });
      colchones.push({ x, y: 0.72, z: 6.6, sx: 0.8, sy: 0.14, sz: 1.95 });
      almohadas.push({ x, y: 0.84, z: 7.3, sx: 0.6, sy: 0.1, sz: 0.38 });
    }
    return { marcos, colchones, almohadas };
  }, []);

  // Cajas de medicamentos en los estantes de la farmacia
  const medicamentos = useMemo(() => {
    const colores = ['#e94b5f', '#3fbf7f', '#f2c42c', '#4e8fc7', '#f4a3b7', '#ffffff', '#8e1b35', '#7fd1c7'];
    const lista = [];
    let semilla = 7;
    const r = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < 5; k++) {
      const x0 = -31.2 + k * 2.15;
      for (const y of [0.55, 1.15, 1.75, 2.35]) {
        for (let n = 0; n < 6; n++) {
          if (r() < 0.2) continue;
          lista.push({ x: x0 + 0.2 + n * 0.3, y: y + 0.12, z: -21.45, sx: 0.22, sy: 0.22 + r() * 0.12, sz: 0.3, color: colores[Math.floor(r() * colores.length)] });
        }
      }
    }
    return lista;
  }, []);

  const letreros = useMemo(
    () =>
      SALAS.map((s) => ({
        s,
        tex:
          s.id === 'farmacia'
            ? texturaLetrero('FARMACIA', { fondo: '#1f9d61', icono: 'cruz', tam: 130 })
            : s.id === 'ginecologia'
              ? texturaLetrero('GINECOLOGÍA', { fondo: '#c2185b', icono: 'cinta', tam: 120 })
              : texturaLetrero(s.nombre, { fondo: '#2f6f8f', tam: 110 }),
      })),
    [],
  );
  const poster = useMemo(() => texturaLetrero('El dolor menstrual intenso no siempre es normal', { ancho: 768, alto: 1024, fondo: '#fff7f2', color: '#8e1b35', borde: '#f4a3b7', tam: 110, icono: null }), []);
  const posterGine = useMemo(() => texturaLetrero('Endometriosis: sospéchala a tiempo', { ancho: 1024, alto: 512, fondo: '#8e1b35', color: '#fff7f2', borde: '#F2C42C', tam: 100, icono: 'cinta' }), []);

  const tvs = [
    { x: -12, y: 2.7, z: 9.93, ry: Math.PI },
    { x: 12, y: 2.7, z: 9.93, ry: Math.PI },
    { x: -19.2, y: 2.5, z: -7.8, ry: 0 },
    { x: 6.4, y: 2.5, z: -7.8, ry: 0 },
    ...CONSULTORIOS.map((s) => ({ x: s.cx + 1.9, y: 1.6, z: -21.7, ry: 0 })),
    { x: 24.5, y: 1.6, z: -21.7, ry: 0 },
  ];

  return (
    <group>
      {/* Sillas de espera */}
      <CajasInstanciadas cajas={sillas.asientos} material={sillaMat} />
      <CajasInstanciadas cajas={sillas.respaldos} material={sillaMat} />
      <CajasInstanciadas cajas={sillas.patas} material={metal} sombra={false} />
      {/* Camillas */}
      <CajasInstanciadas cajas={camillas.marcos} material={metal} />
      <CajasInstanciadas cajas={camillas.colchones} material={colchon} />
      <CajasInstanciadas cajas={camillas.almohadas} material={blanco} />
      {/* Farmacia */}
      <Instancias url={URL.estante} alto={2.9} transformaciones={[0, 1, 2, 3, 4].map((k) => ({ x: -30.15 + k * 2.15, z: -21.45, ry: 0 }))} colores={{ Main: '#f4f1ec', Accent: '#2f9e6a' }} />
      <CajasInstanciadas cajas={medicamentos} material={cajaMed} sombra={false} />
      {/* Consultorios: escritorio, silla, gabinete, plantas */}
      <Instancias url={URL.escritorio} alto={0.82} transformaciones={CONSULTORIOS.map((s) => ({ x: s.cx - 4, z: -18.6, ry: Math.PI / 2 }))} />
      <Instancias url={URL.silla} alto={1.1} transformaciones={[...CONSULTORIOS.map((s) => ({ x: s.cx - 4.9, z: -18.6, ry: Math.PI / 2 })), { x: -7.1, z: 3, ry: Math.PI / 2 }]} />
      <CajasInstanciadas cajas={[...CONSULTORIOS.map((s) => ({ x: s.cx + 4.6, y: 0.9, z: -21.4, sx: 1.6, sy: 1.8, sz: 0.7 })), { x: 30.6, y: 0.9, z: -15, sx: 0.7, sy: 1.8, sz: 1.6 }]} material={blanco} />
      <Instancias
        url={URL.arbusto}
        alto={1.1}
        colores={{ Flowers: '#ffd84a' }}
        transformaciones={[...CONSULTORIOS.map((s) => ({ x: s.cx - 5.5, z: -21.2, s: 1 })), { x: -9, z: 8.8 }, { x: 9, z: 8.8 }, { x: 21, z: -21 }, { x: -9, z: -2.6 }, { x: 9, z: -2.6 }]}
      />
      {/* Monitores con ECG */}
      {tvs.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} rotation={[0, t.ry, 0]}>
          <mesh material={metal}>
            <boxGeometry args={[1.25, 0.78, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.12, 0.66]} />
            <meshBasicMaterial map={ecg.tex} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Letreros de las salas (lado del pasillo) */}
      {letreros.map(({ s, tex }) => (
        <mesh key={s.id} position={[s.cx, 3.18, -7.83]}>
          <planeGeometry args={[2.9, 0.62]} />
          <meshBasicMaterial map={tex} toneMapped={false} color={s.id === 'farmacia' || s.id === 'ginecologia' ? '#ffffff' : '#e8e8e8'} />
        </mesh>
      ))}
      {/* Afiches */}
      <mesh position={[-6.4, 1.9, -7.82]}>
        <planeGeometry args={[1.1, 1.45]} />
        <meshStandardMaterial map={poster} />
      </mesh>
      <mesh position={[31.74, 1.9, -14]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial map={posterGine} />
      </mesh>
      {/* Puertas automáticas de las salas */}
      {SALAS.map((s) => (
        <PuertaAutomatica key={s.id} x={s.cx} z={-8} ancho={3} alto={2.75} eje="x" />
      ))}
      {/* Cruz de neón de la farmacia */}
      <group position={[-25.6, 3.6, -7.7]}>
        <mesh>
          <boxGeometry args={[0.18, 0.6, 0.06]} />
          <meshBasicMaterial color="#3dff9a" toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.6, 0.18, 0.06]} />
          <meshBasicMaterial color="#3dff9a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------
// PLAZA
// ---------------------------------------------------------------------
export const PALMERAS = [
  { x: -12, z: 15.5 },
  { x: 12, z: 15.2 },
  { x: -21, z: 22 },
  { x: 21, z: 22.5 },
  { x: -31, z: 15.5 },
  { x: 31, z: 16 },
  { x: -35, z: 32 },
  { x: 35, z: 31 },
  { x: -17, z: 37.6 },
  { x: 17, z: 37.2 },
  { x: -28, z: 36.5 },
  { x: 28, z: 36 },
];
const BANCAS = [0, 1, 2, 3, 4, 5].map((k) => {
  const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
  return { x: FUENTE.x + Math.sin(a) * 6.6, z: FUENTE.z + Math.cos(a) * 6.6, ry: a + Math.PI };
});
const FAROLES = [
  { x: -6, z: 16 },
  { x: 6, z: 16 },
  { x: -16, z: 30 },
  { x: 16, z: 30 },
  { x: -28, z: 24 },
  { x: 28, z: 24 },
];
const AMBULANCIA = { x: 15, z: 15 };

function Plaza({ mats, calidad }) {
  const palmeras = useMemo(() => {
    const grupos = [[], [], []];
    PALMERAS.forEach((p, i) => grupos[i % 3].push({ x: p.x, z: p.z, ry: i * 1.3, s: 1 + (i % 4) * 0.12 }));
    return grupos;
  }, []);
  const maceteros = useMemo(() => XS_VENTANAS.map((x, i) => ({ x: x + (i % 2 ? -1.6 : 1.6), y: 0.25, z: ZF + 0.8, sx: 1.7, sy: 0.5, sz: 1.0 })), []);
  return (
    <group>
      {palmeras.map((tr, i) => (
        <Instancias key={i} url={URL.palmera[i]} transformaciones={tr} alto={6.5} />
      ))}
      <Instancias url={URL.banca} transformaciones={BANCAS.map((b) => ({ ...b, s: 1 }))} alto={0.9} />
      <Instancias url={URL.farol} transformaciones={FAROLES.map((f) => ({ ...f, ry: 0 }))} alto={4.6} colores={{ _emisivo: { Light: '#ffcf7a' } }} />
      <Instancias
        url={URL.arbusto}
        alto={1.5}
        colores={BUGANVILIA}
        transformaciones={[
          { x: -38.5, z: 14 },
          { x: -38.5, z: 22 },
          { x: -38.5, z: 30 },
          { x: 38.5, z: 14 },
          { x: 38.5, z: 22 },
          { x: 38.5, z: 30 },
          { x: -30, z: 38.6 },
          { x: -18, z: 38.6 },
          { x: 18, z: 38.6 },
          { x: 30, z: 38.6 },
        ].map((t, i) => ({ ...t, ry: i * 2.1 }))}
      />
      <CajasInstanciadas cajas={maceteros} material={mats.muroJardin} />
      <Fuente calidad={calidad} />
      <Ambulancia />
    </group>
  );
}

function Fuente({ calidad }) {
  const piedra = useMemo(() => new MeshStandardMaterial({ color: '#efe1c8', roughness: 0.8 }), []);
  const agua = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uT: { value: 0 } },
        transparent: true,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform float uT; varying vec2 vUv;
          void main(){ vec2 p = vUv - 0.5; float r = length(p);
            float ondas = sin(r*60.0 - uT*3.0)*0.5+0.5;
            float brillo = pow(ondas, 6.0)*0.5;
            vec3 c = mix(vec3(0.15,0.55,0.7), vec3(0.45,0.85,0.95), ondas*0.5) + brillo;
            gl_FragColor = vec4(c, 0.88); }`,
      }),
    [],
  );
  useFrame((_, dt) => (agua.uniforms.uT.value += dt));
  return (
    <group position={[FUENTE.x, 0, FUENTE.z]}>
      <mesh material={piedra} position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.35, 0.8, 32, 1, true]} />
      </mesh>
      <mesh material={piedra} position={[0, 0.8, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.9, 3.25, 32]} />
      </mesh>
      <mesh material={agua} position={[0, 0.62, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.95, 32]} />
      </mesh>
      <mesh material={piedra} position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.45, 1.6, 12]} />
      </mesh>
      <mesh material={piedra} position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[1.05, 0.35, 0.4, 20]} />
      </mesh>
      {calidad !== 'baja' && <Sparkles count={40} scale={[1.6, 1.6, 1.6]} position={[0, 2.5, 0]} size={4} speed={1.2} color="#bff0ff" />}
    </group>
  );
}

function Ambulancia() {
  const luz = useRef();
  useFrame(({ clock }) => {
    if (luz.current) luz.current.color.set(Math.floor(clock.elapsedTime * 3) % 2 ? '#ff2a3a' : '#2a6bff');
  });
  return (
    <group position={[AMBULANCIA.x, 0, AMBULANCIA.z]} rotation={[0, 0.15, 0]}>
      <mesh position={[0, 1.35, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 2.1, 4.2]} />
        <meshStandardMaterial color="#fbfbfb" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 2.25]} castShadow>
        <boxGeometry args={[2.2, 1.4, 1.3]} />
        <meshStandardMaterial color="#fbfbfb" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.45, 2.6]}>
        <boxGeometry args={[2.0, 0.55, 0.6]} />
        <meshStandardMaterial color="#20303f" roughness={0.1} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.2, -0.3]}>
        <boxGeometry args={[2.22, 0.3, 4.22]} />
        <meshStandardMaterial color="#d7263d" />
      </mesh>
      <mesh position={[0, 2.5, 0.8]}>
        <boxGeometry args={[1.2, 0.18, 0.35]} />
        <meshBasicMaterial ref={luz} color="#ff2a3a" toneMapped={false} />
      </mesh>
      {[
        [-1.05, 1.5],
        [1.05, 1.5],
        [-1.05, -1.6],
        [1.05, -1.6],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.38, 0.38, 0.3, 14]} />
          <meshStandardMaterial color="#1b1b1e" />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------
// CIUDAD DE FONDO (edificios coloniales de colores)
// ---------------------------------------------------------------------
const COLORES_CASAS = ['#ecbb47', '#ec7f66', '#5b98cc', '#f6e6cb', '#ea93ab', '#7fc6a4', '#f2a65a', '#c9e3f2'];

export function generarCasas(semilla, zonas) {
  let s = semilla;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const muros = [];
  const techos = [];
  for (const z of zonas) {
    for (let k = 0; k < z.n; k++) {
      const w = 6 + r() * 5;
      const d = 6 + r() * 5;
      const h = z.hMin + r() * (z.hMax - z.hMin);
      const x = z.x0 + r() * (z.x1 - z.x0);
      const zz = z.z0 + r() * (z.z1 - z.z0);
      muros.push({ x, y: (z.y || 0) + h / 2, z: zz, sx: w, sy: h, sz: d, color: COLORES_CASAS[Math.floor(r() * COLORES_CASAS.length)] });
      techos.push({ x, y: (z.y || 0) + h + 0.25, z: zz, sx: w + 0.6, sy: 0.5, sz: d + 0.6 });
    }
  }
  return { muros, techos };
}

function Ciudad({ mats }) {
  const { muros, techos } = useMemo(
    () =>
      generarCasas(42, [
        { n: 16, x0: -80, x1: 80, z0: 50, z1: 72, hMin: 5, hMax: 10 },
        { n: 9, x0: 50, x1: 75, z0: -50, z1: 45, hMin: 5, hMax: 10 },
        { n: 9, x0: -75, x1: -50, z0: -50, z1: 45, hMin: 5, hMax: 10 },
        { n: 14, x0: -70, x1: 70, z0: -80, z1: -45, hMin: 5, hMax: 9 },
      ]),
    [],
  );
  return (
    <group>
      <CajasInstanciadas cajas={muros} material={mats.edificio} sombra={false} />
      <CajasInstanciadas cajas={techos} material={mats.tejas} sombra={false} />
    </group>
  );
}
