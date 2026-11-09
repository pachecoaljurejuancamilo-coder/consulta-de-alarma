// Entidades de las misiones: orbes holográficos de síntomas, mitos fantasmales y columnas de luz.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Vector3 } from 'three';
import { useJuego } from '../estado/store.js';
import { D } from '../juego/director.js';
import { G, ahora } from '../juego/mundo.js';
import { crearEtiqueta } from '../hud/etiquetas.js';
import { MODELOS, clonarModelo, Animador } from './personajes.js';
import { salaPorId, CZ_SALA } from '../juego/mapa.js';
import { DESTINOS, PACIENTES } from '../data/contenido.js';

// ---------------------------------------------------------------------
// Material holográfico (mismo color para todos los orbes)
// ---------------------------------------------------------------------
export function materialHolograma(color = '#9fe8ff', intensidad = 1.6) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uT: { value: 0 }, uI: { value: intensidad } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uT; uniform float uI; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
        float lineas = 0.55 + 0.45*sin(vY*38.0 - uT*6.0);
        float a = (0.25 + f*1.2) * lineas;
        gl_FragColor = vec4(uColor*uI*(0.5+f*1.5), a); }`,
  });
}

function Orbe({ id, texto }) {
  const orbe = D.orbes.find((o) => o.id === id);
  const grupo = useRef();
  const anillo = useRef();
  const mat = useMemo(() => materialHolograma('#9fe8ff', 1.5), []);
  const nucleo = useMemo(() => materialHolograma('#e6fbff', 2.2), []);
  const escala = useRef(0);
  useEffect(() => {
    if (!orbe) return;
    const e = crearEtiqueta({ texto, clase: 'etq-orbe', pos: orbe.pos, dy: 0.62, maxDist: 26, visible: () => orbe.vivo && escala.current > 0.5 });
    return () => e.quitar();
  }, [orbe, texto]);
  useFrame((_, dt) => {
    if (!orbe || !grupo.current) return;
    const t = ahora();
    orbe.pos.y = orbe.base + Math.sin(t * 2.2 + orbe.fase) * 0.14;
    const objetivo = orbe.vivo ? 1 : 0;
    escala.current += (objetivo - escala.current) * Math.min(1, dt * (orbe.vivo ? 5 : 12));
    grupo.current.position.copy(orbe.pos);
    grupo.current.scale.setScalar(Math.max(0.001, escala.current));
    grupo.current.visible = escala.current > 0.02;
    mat.uniforms.uT.value = t;
    nucleo.uniforms.uT.value = t;
    if (anillo.current) {
      anillo.current.rotation.x = t * 1.3;
      anillo.current.rotation.y = t * 0.9 + orbe.fase;
    }
  });
  if (!orbe) return null;
  return (
    <group ref={grupo}>
      <mesh material={mat}>
        <sphereGeometry args={[0.42, 24, 16]} />
      </mesh>
      <mesh material={nucleo} scale={0.45}>
        <icosahedronGeometry args={[0.42, 1]} />
      </mesh>
      <mesh ref={anillo} material={mat}>
        <torusGeometry args={[0.6, 0.025, 6, 40]} />
      </mesh>
    </group>
  );
}

export function Orbes() {
  const orbes = useJuego((s) => s.orbes);
  return orbes.map((o) => <Orbe key={o.id} id={o.id} texto={o.texto} />);
}

// ---------------------------------------------------------------------
// Mitos: fantasmas que persiguen al jugador
// ---------------------------------------------------------------------
function Mito({ id, frase, gltf }) {
  const mito = D.mitos.find((m) => m.id === id);
  const { raiz, anim } = useMemo(() => {
    const raiz = clonarModelo(gltf, {}, { sombra: true, alto: 1.7 });
    raiz.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.name === 'Ghost_Main') {
          m.color.set('#d9c9ff');
          m.emissive = new Color('#6a4bd6');
          m.emissiveIntensity = 0.75;
          m.transparent = true;
          m.opacity = 0.8;
        } else if (m.name === 'Eye_White') {
          m.emissive = new Color('#ff3d6e');
          m.emissiveIntensity = 2.5;
          m.toneMapped = false;
        }
      }
    });
    const anim = new Animador(raiz, gltf.animations);
    anim.play('Fast_Flying');
    return { raiz, anim };
  }, [gltf]);
  const grupo = useRef();
  const vis = useRef(0);
  useEffect(() => {
    if (!mito) return;
    const e = crearEtiqueta({ texto: `«${frase}»`, clase: 'etq-mito', pos: mito.pos, dy: 1.25, maxDist: 30, visible: () => mito.vivo && mito.aparecido });
    return () => e.quitar();
  }, [mito, frase]);
  useFrame((_, dtReal) => {
    if (!mito || !grupo.current) return;
    const dt = Math.min(dtReal, 0.1) * G.escala;
    const objetivo = mito.vivo && mito.aparecido ? 1 : 0;
    vis.current += (objetivo - vis.current) * Math.min(1, dtReal * (objetivo ? 4 : 10));
    grupo.current.visible = vis.current > 0.02;
    grupo.current.position.set(mito.pos.x, mito.pos.y - 0.9, mito.pos.z);
    grupo.current.scale.setScalar(Math.max(0.001, vis.current));
    const j = G.jugador.pos;
    grupo.current.rotation.y = Math.atan2(j.x - mito.pos.x, j.z - mito.pos.z);
    if (ahora() < mito.enfriamiento) anim.play('Punch', { fundido: 0.1 });
    else anim.play('Fast_Flying', { fundido: 0.2 });
    anim.update(dt);
  });
  if (!mito) return null;
  return (
    <group ref={grupo}>
      <primitive object={raiz} />
    </group>
  );
}

export function Mitos() {
  const mitos = useJuego((s) => s.mitos);
  const gltf = useGLTF(MODELOS.fantasma, false, true);
  return mitos.map((m) => <Mito key={m.id} id={m.id} frase={m.frase} gltf={gltf} />);
}

// ---------------------------------------------------------------------
// Columnas de luz (marcadores de misión y destinos)
// ---------------------------------------------------------------------
const COLORES_MARCADOR = { mision: '#F2C42C', farmacia: '#3fbf7f', ginecologia: '#f4a3b7' };

function materialColumna() {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#F2C42C') }, uT: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uT; varying vec2 vUv;
      void main(){ float h = vUv.y; float a = pow(1.0-h, 2.4) * (0.55 + 0.45*sin(h*60.0 - uT*5.0));
        a *= 0.85; gl_FragColor = vec4(uColor*1.8, a); }`,
  });
}

export function Marcadores() {
  const refs = useRef([]);
  const anillos = useRef([]);
  const mats = useMemo(() => [materialColumna(), materialColumna(), materialColumna()], []);
  const matsAnillo = useMemo(() => [0, 1, 2].map(() => materialHolograma('#F2C42C', 2)), []);
  useFrame(() => {
    const t = ahora();
    for (let i = 0; i < 3; i++) {
      const m = G.marcadores[i];
      const c = refs.current[i];
      const a = anillos.current[i];
      if (!c || !a) continue;
      c.visible = a.visible = !!m && G.activo;
      if (!m) continue;
      c.position.set(m.x, 20, m.z);
      a.position.set(m.x, 0.06, m.z);
      const s = 1 + ((t * 0.8) % 1) * 1.6;
      a.scale.set(s, s, s);
      mats[i].uniforms.uT.value = t;
      mats[i].uniforms.uColor.value.set(COLORES_MARCADOR[m.tipo] || '#F2C42C');
      matsAnillo[i].uniforms.uColor.value.set(COLORES_MARCADOR[m.tipo] || '#F2C42C');
      matsAnillo[i].uniforms.uT.value = t;
    }
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh ref={(r) => (refs.current[i] = r)} material={mats[i]} visible={false}>
            <cylinderGeometry args={[1.25, 1.25, 40, 24, 1, true]} />
          </mesh>
          <mesh ref={(r) => (anillos.current[i] = r)} material={matsAnillo[i]} rotation-x={-Math.PI / 2} visible={false}>
            <torusGeometry args={[1.0, 0.06, 6, 40]} />
          </mesh>
        </group>
      ))}
      <EtiquetasDestino />
      <EtiquetaPaciente />
    </group>
  );
}

function EtiquetasDestino() {
  const activos = useJuego((s) => s.destinosActivos);
  useEffect(() => {
    if (!activos) return;
    const lista = ['farmacia', 'ginecologia'].map((id) => {
      const sala = salaPorId(id);
      const d = DESTINOS[id];
      return crearEtiqueta({
        html: `<b>${d.sala}</b><span>${d.titulo}: ${d.detalle}</span>`,
        clase: 'etq-destino etq-' + id,
        pos: new Vector3(sala.cx, 3.9, -9.2),
        maxDist: 90,
      });
    });
    return () => lista.forEach((e) => e.quitar());
  }, [activos]);
  return null;
}

function EtiquetaPaciente() {
  const mision = useJuego((s) => s.mision);
  const etapa = useJuego((s) => s.etapa);
  const fase = useJuego((s) => s.fase);
  const pantalla = useJuego((s) => s.pantalla);
  useEffect(() => {
    if (fase !== 'mision' || pantalla !== 'juego') return;
    // Etiqueta sobre la siguiente paciente mientras hay que llegar a ella
    const idx = etapa === 'resultado' ? mision + 1 : mision;
    if (idx > 2 || !(etapa === 'marcador' || etapa === 'resultado')) return;
    const P = PACIENTES[idx];
    const e = crearEtiqueta({
      html: `<b>${P.nombre}</b><span>${P.edad} años · ${P.ocupacion}</span>`,
      clase: 'etq-paciente',
      pos: new Vector3(salaPorId(['c1', 'c2', 'c3'][P.consultorio]).cx, 2.6, CZ_SALA - 4.6),
      maxDist: 70,
    });
    return () => e.quitar();
  }, [mision, etapa, fase, pantalla]);
  return null;
}

useGLTF.preload(MODELOS.fantasma, false, true);
