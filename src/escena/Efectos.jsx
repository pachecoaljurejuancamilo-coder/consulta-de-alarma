// Efectos de combate: partículas, rayos de energía, ondas expansivas, números flotantes y destellos.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, CylinderGeometry, DoubleSide, Mesh, MeshBasicMaterial, Points, Quaternion, RingGeometry, ShaderMaterial, Vector3 } from 'three';
import { FX } from '../juego/efectos.js';
import { G } from '../juego/mundo.js';
import { crearEtiqueta } from '../hud/etiquetas.js';

const col = new Color();
const arriba = new Vector3(0, 1, 0);
const tmpV = new Vector3();
const tmpQ = new Quaternion();

export default function Efectos({ calidad }) {
  const capacidad = calidad === 'alta' ? 2400 : calidad === 'media' ? 1400 : 700;
  const factor = calidad === 'alta' ? 1 : calidad === 'media' ? 0.65 : 0.35;

  // ---------------- Partículas ----------------
  const sistema = useMemo(() => {
    const geo = new BufferGeometry();
    const pos = new Float32Array(capacidad * 3);
    const colr = new Float32Array(capacidad * 3);
    const tam = new Float32Array(capacidad);
    const alfa = new Float32Array(capacidad);
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new BufferAttribute(colr, 3));
    geo.setAttribute('aTam', new BufferAttribute(tam, 1));
    geo.setAttribute('aAlfa', new BufferAttribute(alfa, 1));
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uEscala: { value: 1 } },
      vertexShader: `attribute vec3 aColor; attribute float aTam; attribute float aAlfa; varying vec3 vC; varying float vA; uniform float uEscala;
        void main(){ vC = aColor; vA = aAlfa; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = aTam * uEscala / -mv.z; gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vC; varying float vA;
        void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); if (d>0.5) discard; float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC*(1.0+a*1.5), a*vA); }`,
    });
    const puntos = new Points(geo, mat);
    puntos.frustumCulled = false;
    puntos.renderOrder = 5;
    const vel = new Float32Array(capacidad * 3);
    const vida = new Float32Array(capacidad);
    const vidaMax = new Float32Array(capacidad);
    const grav = new Float32Array(capacidad);
    const tamBase = new Float32Array(capacidad);
    return { geo, mat, puntos, pos, colr, tam, alfa, vel, vida, vidaMax, grav, tamBase, siguiente: 0 };
  }, [capacidad]);

  // ---------------- Rayos ----------------
  const rayos = useMemo(() => {
    const geo = new CylinderGeometry(1, 1, 1, 10, 1, true);
    geo.translate(0, 0.5, 0);
    return Array.from({ length: 8 }, () => {
      const nucleo = new Mesh(geo, new MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
      const halo = new Mesh(geo, new MeshBasicMaterial({ color: '#ffd84a', transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }));
      nucleo.visible = halo.visible = false;
      nucleo.frustumCulled = halo.frustumCulled = false;
      return { nucleo, halo, vida: 0, vidaMax: 0.2, grosor: 0.15, desde: new Vector3(), hasta: new Vector3() };
    });
  }, []);

  // ---------------- Ondas ----------------
  const ondas = useMemo(() => {
    const geo = new RingGeometry(0.8, 1, 48);
    return Array.from({ length: 10 }, () => {
      const m = new Mesh(geo, new MeshBasicMaterial({ color: '#ffd84a', transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }));
      m.visible = false;
      m.frustumCulled = false;
      return { m, vida: 0, vidaMax: 0.5, radio: 2 };
    });
  }, []);

  const indiceRayo = useRef(0);
  const indiceOnda = useRef(0);
  const ultimaEstela = useRef(0);

  useEffect(() => {
    const emitir = (p, { color = '#ffffff', cantidad = 20, velocidad = 4, vida = 0.6, tam = 0.35, gravedad = -3 } = {}) => {
      const s = sistema;
      const n = Math.max(1, Math.round(cantidad * factor));
      col.set(color);
      for (let k = 0; k < n; k++) {
        const i = s.siguiente;
        s.siguiente = (s.siguiente + 1) % capacidad;
        s.pos[i * 3] = p.x;
        s.pos[i * 3 + 1] = p.y;
        s.pos[i * 3 + 2] = p.z;
        // Dirección aleatoria en esfera
        const u = Math.random() * 2 - 1;
        const th = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const v = velocidad * (0.35 + Math.random() * 0.75);
        s.vel[i * 3] = r * Math.cos(th) * v;
        s.vel[i * 3 + 1] = u * v + velocidad * 0.25;
        s.vel[i * 3 + 2] = r * Math.sin(th) * v;
        s.vida[i] = s.vidaMax[i] = vida * (0.6 + Math.random() * 0.6);
        s.grav[i] = gravedad;
        s.tamBase[i] = tam * (0.6 + Math.random() * 0.8);
        s.colr[i * 3] = col.r;
        s.colr[i * 3 + 1] = col.g;
        s.colr[i * 3 + 2] = col.b;
      }
    };
    FX.estallido = emitir;
    FX.estela = (p, color) => {
      const t = performance.now();
      if (t - ultimaEstela.current < 16) return;
      ultimaEstela.current = t;
      emitir(p, { color, cantidad: 6, velocidad: 0.8, vida: 0.45, tam: 0.45, gravedad: 0 });
    };
    FX.rayo = (desde, hasta, { color = '#ffd84a', grosor = 0.16, vida = 0.22 } = {}) => {
      const r = rayos[indiceRayo.current];
      indiceRayo.current = (indiceRayo.current + 1) % rayos.length;
      r.desde.copy(desde);
      r.hasta.copy(hasta);
      r.vida = r.vidaMax = vida;
      r.grosor = grosor;
      r.halo.material.color.set(color);
      // Chispas a lo largo del rayo
      const pasos = Math.min(14, Math.ceil(desde.distanceTo(hasta) / 1.2));
      for (let k = 0; k <= pasos; k++) {
        tmpV.lerpVectors(desde, hasta, k / pasos);
        emitir(tmpV, { color, cantidad: 2, velocidad: 1.2, vida: 0.35, tam: grosor * 2.2, gravedad: 0 });
      }
    };
    FX.onda = (p, { color = '#ffd84a', radio = 2.5, vida = 0.5 } = {}) => {
      const o = ondas[indiceOnda.current];
      indiceOnda.current = (indiceOnda.current + 1) % ondas.length;
      o.m.position.copy(p);
      o.vida = o.vidaMax = vida;
      o.radio = radio;
      o.m.material.color.set(color);
    };
    FX.numero = (p, texto, color = '#ffe066') => {
      const e = crearEtiqueta({ texto, clase: 'etq-numero', pos: p.clone(), dy: 0, maxDist: 60, vida: 1.1 });
      e.el.style.color = color;
    };
    FX.flash = (color = '#ffffff', intensidad = 0.5) => {
      const el = document.getElementById('destello');
      if (!el) return;
      el.style.transition = 'none';
      el.style.background = color;
      el.style.opacity = String(intensidad);
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.45s ease-out';
        el.style.opacity = '0';
      });
    };
  }, [sistema, rayos, ondas, capacidad, factor]);

  const anterior = useRef(performance.now());
  useFrame((state) => {
    const ahoraMs = performance.now();
    const dtR = Math.min(0.05, (ahoraMs - anterior.current) / 1000);
    anterior.current = ahoraMs;
    const dt = dtR * G.escala;
    // Partículas
    const s = sistema;
    s.mat.uniforms.uEscala.value = state.size.height * 0.9;
    for (let i = 0; i < capacidad; i++) {
      if (s.vida[i] <= 0) {
        if (s.alfa[i] !== 0) {
          s.alfa[i] = 0;
          s.tam[i] = 0;
        }
        continue;
      }
      s.vida[i] -= dt;
      const k = Math.max(0, s.vida[i] / s.vidaMax[i]);
      s.vel[i * 3 + 1] += s.grav[i] * dt;
      const arrastre = 1 - Math.min(1, dt * 1.8);
      s.vel[i * 3] *= arrastre;
      s.vel[i * 3 + 2] *= arrastre;
      s.pos[i * 3] += s.vel[i * 3] * dt;
      s.pos[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
      s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
      s.alfa[i] = k;
      s.tam[i] = s.tamBase[i] * (0.4 + k * 0.6);
    }
    s.geo.attributes.position.needsUpdate = true;
    s.geo.attributes.aAlfa.needsUpdate = true;
    s.geo.attributes.aTam.needsUpdate = true;
    s.geo.attributes.aColor.needsUpdate = true;

    // Rayos
    for (const r of rayos) {
      if (r.vida <= 0) {
        r.nucleo.visible = r.halo.visible = false;
        continue;
      }
      r.vida -= dtR;
      const k = Math.max(0, r.vida / r.vidaMax);
      tmpV.subVectors(r.hasta, r.desde);
      const largo = tmpV.length();
      tmpQ.setFromUnitVectors(arriba, tmpV.normalize());
      for (const [m, g, a] of [
        [r.nucleo, r.grosor * 0.45, 1],
        [r.halo, r.grosor * (1.4 + (1 - k) * 1.2), 0.55],
      ]) {
        m.visible = true;
        m.position.copy(r.desde);
        m.quaternion.copy(tmpQ);
        m.scale.set(g * (0.5 + k * 0.5), largo, g * (0.5 + k * 0.5));
        m.material.opacity = a * k;
      }
    }
    // Ondas
    for (const o of ondas) {
      if (o.vida <= 0) {
        o.m.visible = false;
        continue;
      }
      o.vida -= dtR;
      const k = 1 - Math.max(0, o.vida / o.vidaMax);
      o.m.visible = true;
      o.m.quaternion.copy(state.camera.quaternion);
      o.m.scale.setScalar(0.2 + o.radio * k);
      o.m.material.opacity = (1 - k) * 0.9;
    }
  });

  return (
    <group>
      <primitive object={sistema.puntos} />
      {rayos.map((r, i) => (
        <group key={i}>
          <primitive object={r.nucleo} />
          <primitive object={r.halo} />
        </group>
      ))}
      {ondas.map((o, i) => (
        <primitive key={'o' + i} object={o.m} />
      ))}
    </group>
  );
}
