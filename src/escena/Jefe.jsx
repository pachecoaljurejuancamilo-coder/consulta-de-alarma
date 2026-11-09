// Jefe final «El Retraso Diagnóstico», cristales de respuesta y ataques.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles } from '@react-three/drei';
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, Vector3 } from 'three';
import { useJuego } from '../estado/store.js';
import { D } from '../juego/director.js';
import { G, ahora } from '../juego/mundo.js';
import { crearEtiqueta } from '../hud/etiquetas.js';
import { MODELOS, clonarModelo, Animador } from './personajes.js';
import { texturaReloj, texturaDoceAnios } from './texturasCanvas.js';
import { materialHolograma } from './Mision.jsx';
import { AZOTEA } from '../juego/mapa.js';

export default function Jefe({ calidad }) {
  const fase = useJuego((s) => s.fase);
  const pantalla = useJuego((s) => s.pantalla);
  if (fase !== 'jefe' || pantalla !== 'juego') return null;
  return (
    <group>
      <Criatura calidad={calidad} />
      <Cristales />
      <Proyectiles />
      <Ondas />
    </group>
  );
}

function Criatura({ calidad }) {
  const gltf = useGLTF(MODELOS.fantasma, false, true);
  const { raiz, anim } = useMemo(() => {
    const raiz = clonarModelo(gltf, {}, { sombra: true, alto: 7.5 });
    raiz.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.name === 'Ghost_Main') {
          m.color.set('#1c0f22');
          m.emissive = new Color('#4a1240');
          m.emissiveIntensity = 0.5;
          m.roughness = 0.4;
        } else if (m.name === 'Eye_White') {
          m.color.set('#ff2a55');
          m.emissive = new Color('#ff1f4b');
          m.emissiveIntensity = 3;
          m.toneMapped = false;
        }
      }
    });
    const anim = new Animador(raiz, gltf.animations);
    anim.play('Flying_Idle');
    return { raiz, anim };
  }, [gltf]);
  const grupo = useRef();
  const relojes = useRef();
  const pecho = useRef();
  const texRelojes = useMemo(() => [0, 1, 2, 3, 4, 5].map((k) => texturaReloj(k)), []);
  const doce = useMemo(() => texturaDoceAnios(), []);
  const aura = useMemo(() => materialHolograma('#b0124a', 0.9), []);

  useFrame((_, dtReal) => {
    const J = D.jefe;
    const g = grupo.current;
    if (!J || !g) return;
    const dt = Math.min(dtReal, 0.1) * G.escala;
    const t = ahora();
    g.visible = J.estado !== 'muerto';
    g.position.copy(J.pos);
    const j = G.jugador.pos;
    g.rotation.y = Math.atan2(j.x - J.pos.x, j.z - J.pos.z);
    if (J.estado === 'muriendo') {
      anim.play('Death', { unaVez: true, fundido: 0.2 });
      const k = Math.min(1, (G.t - J.tEstado) / 1.4);
      g.scale.setScalar(1 + Math.sin(t * 40) * 0.04 * k);
    } else if (t < J.golpeHasta) {
      anim.play('HitReact', { unaVez: true, fundido: 0.08, escala: 1.2 });
      g.scale.setScalar(1);
    } else if (t < J.ataqueHasta) {
      anim.play('Punch', { unaVez: true, fundido: 0.1 });
      g.scale.setScalar(1);
    } else {
      anim.play('Flying_Idle', { fundido: 0.3 });
      g.scale.setScalar(1);
    }
    anim.update(dt);
    if (relojes.current) {
      relojes.current.rotation.y += dt * 0.7;
      relojes.current.children.forEach((c, k) => {
        c.position.y = 3.6 + Math.sin(t * 1.2 + k) * 0.6;
        c.rotation.z += dt * (k % 2 ? 1.5 : -1.1);
      });
    }
    aura.uniforms.uT.value = t;
    if (pecho.current) pecho.current.material.opacity = 0.75 + Math.sin(t * 4) * 0.25;
  });

  return (
    <group ref={grupo}>
      <primitive object={raiz} />
      <mesh ref={pecho} position={[0, 3.3, 1.75]}>
        <planeGeometry args={[3.4, 1.7]} />
        <meshBasicMaterial map={doce} transparent toneMapped={false} depthWrite={false} color="#ffffff" />
      </mesh>
      <mesh material={aura} position={[0, 3.6, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[4.2, 24, 16]} />
      </mesh>
      <group ref={relojes}>
        {texRelojes.map((tex, k) => {
          const a = (k / 6) * Math.PI * 2;
          return (
            <mesh key={k} position={[Math.sin(a) * 5.2, 3.6, Math.cos(a) * 5.2]} rotation={[0.3, a, 0]}>
              <cylinderGeometry args={[0.75, 0.75, 0.14, 24]} />
              <meshStandardMaterial attach="material-0" color="#5b3a2a" />
              <meshStandardMaterial attach="material-1" map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
              <meshStandardMaterial attach="material-2" map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
            </mesh>
          );
        })}
      </group>
      {calidad !== 'baja' && <Sparkles count={calidad === 'alta' ? 70 : 35} scale={[9, 9, 9]} position={[0, 3.5, 0]} size={8} speed={0.6} color="#ff4d8a" />}
    </group>
  );
}

function Cristal({ id, texto }) {
  const c = D.cristales.find((x) => x.id === id);
  const ref = useRef();
  const mat = useMemo(() => new MeshStandardMaterial({ color: '#c9b8ff', emissive: '#7f5cff', emissiveIntensity: 0.9, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.88 }), []);
  const halo = useMemo(() => materialHolograma('#b9a5ff', 1.2), []);
  useEffect(() => {
    if (!c) return;
    const e = crearEtiqueta({ texto, clase: 'etq-cristal', pos: c.pos, dy: 1.35, maxDist: 40, visible: () => c.vivo });
    return () => e.quitar();
  }, [c, texto]);
  useFrame(() => {
    if (!c || !ref.current) return;
    const t = ahora();
    ref.current.visible = c.vivo;
    ref.current.position.set(c.pos.x, c.pos.y + Math.sin(t * 2 + c.fase) * 0.15, c.pos.z);
    ref.current.rotation.y = t * 0.8 + c.fase;
    const seleccionado = G.objetivoActual && G.objetivoActual.pos === c.pos;
    mat.emissiveIntensity = seleccionado ? 2.2 : 0.9 + Math.sin(t * 3 + c.fase) * 0.2;
    halo.uniforms.uT.value = t;
  });
  if (!c) return null;
  return (
    <group ref={ref}>
      <mesh material={mat} scale={[0.75, 1.25, 0.75]} castShadow>
        <octahedronGeometry args={[1, 0]} />
      </mesh>
      <mesh material={halo} scale={1.25}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
    </group>
  );
}

function Cristales() {
  const cristales = useJuego((s) => s.cristales);
  return cristales.map((c) => <Cristal key={c.id} id={c.id} texto={c.texto} />);
}

const MAX_PROY = 12;
function Proyectiles() {
  const refs = useRef([]);
  const mat = useMemo(() => new MeshBasicMaterial({ color: '#ff2a55', toneMapped: false }), []);
  const halo = useMemo(() => materialHolograma('#ff2a55', 1.6), []);
  useFrame(() => {
    const vivos = D.proyectiles.filter((p) => p.vivo);
    for (let i = 0; i < MAX_PROY; i++) {
      const r = refs.current[i];
      if (!r) continue;
      const p = vivos[i];
      r.visible = !!p;
      if (p) r.position.copy(p.pos);
    }
    halo.uniforms.uT.value = ahora();
  });
  return Array.from({ length: MAX_PROY }, (_, i) => (
    <group key={i} ref={(r) => (refs.current[i] = r)} visible={false}>
      <mesh material={mat}>
        <sphereGeometry args={[0.28, 12, 10]} />
      </mesh>
      <mesh material={halo}>
        <sphereGeometry args={[0.55, 14, 10]} />
      </mesh>
    </group>
  ));
}

const MAX_ONDAS = 6;
function Ondas() {
  const refs = useRef([]);
  const mats = useMemo(
    () => Array.from({ length: MAX_ONDAS }, () => new MeshBasicMaterial({ color: '#ff2a55', transparent: true, opacity: 0.85, blending: AdditiveBlending, side: DoubleSide, depthWrite: false, toneMapped: false })),
    [],
  );
  useFrame(() => {
    const vivas = D.ondas.filter((o) => o.vivo);
    for (let i = 0; i < MAX_ONDAS; i++) {
      const r = refs.current[i];
      if (!r) continue;
      const o = vivas[i];
      r.visible = !!o;
      if (!o) continue;
      r.position.set(o.x, AZOTEA.y + 0.12, o.z);
      r.scale.set(o.r, o.r, 1);
      mats[i].opacity = 0.9 * Math.max(0, 1 - o.r / (AZOTEA.radio + 3));
      mats[i].color.set(o.forzar ? '#ff7a2a' : '#ff2a55');
    }
  });
  return Array.from({ length: MAX_ONDAS }, (_, i) => (
    <mesh key={i} ref={(r) => (refs.current[i] = r)} rotation-x={-Math.PI / 2} material={mats[i]} visible={false}>
      <ringGeometry args={[0.95, 1.03, 64]} />
    </mesh>
  ));
}

export const _v = new Vector3();
