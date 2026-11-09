// Contenido del Canvas: luces, cielo, física, mundo, personajes, efectos y bucle del juego.
import { Suspense, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, useProgress } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Vector3 } from 'three';
import { useJuego, juego } from '../estado/store.js';
import { G, PARAMS } from '../juego/mundo.js';
import { actualizarDirector } from '../juego/director.js';
import { actualizarAutopiloto } from '../juego/autopiloto.js';
import { consumirEntrada, instalarEntrada } from '../juego/entrada.js';
import { actualizarEtiquetas } from '../hud/etiquetas.js';
import Hospital from './Hospital.jsx';
import NPCs from './NPCs.jsx';
import Azotea from './Azotea.jsx';
import Pasarela from './Pasarela.jsx';
import Jugador from './Jugador.jsx';
import Camara from './Camara.jsx';
import { Orbes, Mitos, Marcadores } from './Mision.jsx';
import Jefe from './Jefe.jsx';
import Efectos from './Efectos.jsx';
import Postpro from './Postpro.jsx';
import Cielo, { DIR_SOL } from './Cielo.jsx';


export const ROTACION_CIELO = [0, -2.2, 0];

function Sol({ calidad }) {
  const luz = useRef();
  const centro = useRef(new Vector3(0, 0, 16));
  useFrame(() => {
    const l = luz.current;
    if (!l) return;
    const p = G.activo || G.camara.modo === 'resultados' ? G.jugador.pos : centro.current.set(0, 0, 14);
    l.position.set(p.x + DIR_SOL.x * 70, p.y + DIR_SOL.y * 70, p.z + DIR_SOL.z * 70);
    l.target.position.set(p.x, p.y, p.z);
    l.target.updateMatrixWorld();
  });
  const tam = calidad === 'alta' ? 2048 : 1024;
  const ext = calidad === 'alta' ? 34 : 26;
  return (
    <directionalLight
      ref={luz}
      color="#ffd2a1"
      intensity={2.1}
      castShadow={calidad !== 'baja'}
      shadow-mapSize={[tam, tam]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.045}
      shadow-camera-left={-ext}
      shadow-camera-right={ext}
      shadow-camera-top={ext}
      shadow-camera-bottom={-ext}
      shadow-camera-near={1}
      shadow-camera-far={160}
    />
  );
}

function Bucle() {
  const { gl } = useThree();
  useEffect(() => instalarEntrada(gl.domElement), [gl]);
  useFrame((_, dt) => {
    actualizarAutopiloto(dt);
    actualizarDirector(dt);
  }, -3);
  useFrame(({ camera, size }) => {
    actualizarEtiquetas(camera, size.width, size.height);
    consumirEntrada();
  }, 0);
  return null;
}

// Calidad automática: mide los fps y baja la calidad si no alcanza
function Rendimiento() {
  const { setDpr } = useThree();
  const calidad = useJuego((s) => s.calidad);
  const muestras = useRef({ t: 0, frames: 0, malos: 0 });
  useEffect(() => {
    G.calidad = calidad;
    const max = calidad === 'alta' ? 1.75 : calidad === 'media' ? 1.25 : 0.85;
    setDpr(Math.min(window.devicePixelRatio || 1, max));
  }, [calidad, setDpr]);
  useFrame((_, dt) => {
    const m = muestras.current;
    // Los tirones aislados (compilación de sombreadores, cambio de fase) no cuentan
    if (dt > 0.25) return;
    m.t += dt;
    m.frames++;
    if (m.t >= 1.5) {
      const fps = m.frames / m.t;
      G.fps = fps;
      m.t = 0;
      m.frames = 0;
      if (PARAMS.calidad || document.hidden || !G.activo || G.t < 4) {
        m.malos = 0;
        return;
      }
      const umbral = G.entrada.tactil ? 27 : 42;
      const actual = juego().calidad;
      if (fps < umbral && actual !== 'baja') {
        m.malos++;
        if (m.malos >= 3) {
          m.malos = 0;
          juego().set({ calidad: actual === 'alta' ? 'media' : 'baja' });
        }
      } else m.malos = 0;
    }
  });
  return null;
}

// Progreso de carga (se consulta fuera del render para no actualizar React a mitad de un render)
function Progreso() {
  useEffect(() => {
    const t = setInterval(() => {
      const p = Math.round(useProgress.getState().progress || 0);
      if (!juego().mundoListo && p !== juego().progreso) juego().set({ progreso: Math.min(99, p) });
      if (juego().mundoListo) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, []);
  return null;
}

function Listo() {
  useEffect(() => {
    juego().set({ mundoListo: true, progreso: 100 });
  }, []);
  return null;
}

export default function Escena() {
  const calidad = useJuego((s) => s.calidad);
  const fase = useJuego((s) => s.fase);
  const pantalla = useJuego((s) => s.pantalla);
  const partida = useJuego((s) => s.partida);
  const enHospital = pantalla === 'seleccion' || pantalla === 'cuenta' || (pantalla === 'juego' && fase === 'mision');
  return (
    <>
      <color attach="background" args={['#ffd6a8']} />
      <fog attach="fog" args={['#ffd2a6', 60, 300]} />
      <hemisphereLight args={['#ffd9b8', '#7a5446', 0.6]} />
      <Cielo />
      <Sol calidad={calidad} />
      <Progreso />
      <Rendimiento />
      <Suspense fallback={null}>
        <Environment files="hdri/atardecer.hdr" environmentRotation={ROTACION_CIELO} environmentIntensity={0.75} />
        <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
          <Hospital calidad={calidad} />
          {enHospital && <NPCs calidad={calidad} />}
          <Azotea />
          <Pasarela calidad={calidad} />
          <Jugador key={partida} />
          <Camara />
        </Physics>
        <Orbes />
        <Mitos />
        <Marcadores />
        <Jefe calidad={calidad} />
        <Efectos calidad={calidad} />
        <Bucle />
        <Postpro calidad={calidad} />
        <Listo />
      </Suspense>
    </>
  );
}
