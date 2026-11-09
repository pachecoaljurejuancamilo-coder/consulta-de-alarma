// Pasarela de salida sobre el mar: filas de arcos de la encuesta y portal dorado final.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial } from 'three';
import { useJuego } from '../estado/store.js';
import { D, TIEMPOS_FILAS, T_PORTAL, geometriaFila } from '../juego/director.js';
import { PASARELA, xCarrera } from '../juego/mapa.js';
import { TIEMPOS as T, ENCUESTA, TEXTOS } from '../data/contenido.js';
import { useMateriales, geometriaCaja, TILE } from './materiales.js';
import { CajasInstanciadas } from './Utileria.jsx';
import { texturaLetrero } from './texturasCanvas.js';
import { ahora } from '../juego/mundo.js';

export const X_PORTAL = xCarrera(T_PORTAL, T.salidaIntro) - 1;
const COLORES_ARCO = ['#8e1b35', '#c2185b', '#f4a3b7', '#f2a65a', '#F2C42C'];

export default function Pasarela({ calidad }) {
  const mats = useMateriales();
  const y = PASARELA.y;
  const x0 = PASARELA.x0 + 5;
  const x1 = X_PORTAL - 25;
  const largo = x0 - x1;
  const piezas = useMemo(() => {
    const postes = [];
    const pilares = [];
    const faroles = [];
    for (let x = x0; x > x1; x -= 2.5) for (const z of [-7.1, 7.1]) postes.push({ x, y: y + 0.55, z, sx: 0.1, sy: 1.1, sz: 0.1 });
    for (let x = x0 - 10; x > x1; x -= 32) for (const z of [-5, 5]) pilares.push({ x, y: y / 2, z, sx: 1.2, sy: y, sz: 1.2 });
    for (let x = x0 - 6; x > x1; x -= 16) for (const z of [-7.4, 7.4]) faroles.push({ x, y: y + 1.6, z, sx: 0.12, sy: 3.2, sz: 0.12 });
    return { postes, pilares, faroles };
  }, [x0, x1, y]);
  const metal = useMemo(() => new MeshStandardMaterial({ color: '#d9d2c4', metalness: 0.5, roughness: 0.4 }), []);
  const geoTablas = useMemo(() => geometriaCaja(largo, 0.5, PASARELA.ancho + 1, TILE.madera), [largo]);
  const luz = useMemo(() => new MeshBasicMaterial({ color: '#ffd59a', toneMapped: false }), []);
  const filas = useMemo(() => ENCUESTA.map((e, k) => ({ ...e, x: xCarrera(TIEMPOS_FILAS[k], T.salidaIntro), arcos: geometriaFila(e.opciones.length) })), []);

  return (
    <group>
      <mesh position={[(x0 + x1) / 2, y - 0.25, 0]} material={mats.madera} geometry={geoTablas} receiveShadow castShadow />
      {[-7.1, 7.1].map((z) => (
        <mesh key={z} position={[(x0 + x1) / 2, y + 1.1, z]} material={metal}>
          <boxGeometry args={[largo, 0.08, 0.12]} />
        </mesh>
      ))}
      <CajasInstanciadas cajas={piezas.postes} material={metal} sombra={false} />
      <CajasInstanciadas cajas={piezas.pilares} material={mats.columna} sombra={false} />
      <CajasInstanciadas cajas={piezas.faroles} material={metal} sombra={false} />
      <CajasInstanciadas cajas={piezas.faroles.map((f) => ({ ...f, y: y + 3.3, sx: 0.4, sy: 0.4, sz: 0.4 }))} material={luz} sombra={false} />
      {filas.map((f, k) => (
        <FilaArcos key={f.id} fila={f} indice={k} />
      ))}
      <Portal calidad={calidad} />
    </group>
  );
}

function materialCortina(color) {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uT: { value: 0 }, uBrillo: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uT; uniform float uBrillo; varying vec2 vUv;
      void main(){ float borde = smoothstep(0.5, 0.0, abs(vUv.x-0.5)) ;
        float ondas = 0.5 + 0.5*sin(vUv.y*20.0 - uT*4.0);
        float a = (0.18 + 0.22*ondas) * (0.6 + 0.4*(1.0 - vUv.y)) + uBrillo;
        gl_FragColor = vec4(uColor*(1.2 + uBrillo*3.0), a); }`,
  });
}

function FilaArcos({ fila, indice }) {
  const y = PASARELA.y;
  const n = fila.opciones.length;
  const cortinas = useMemo(() => fila.opciones.map((_, k) => materialCortina(n === 3 ? ['#3fbf7f', '#F2C42C', '#ff6b81'][k] : COLORES_ARCO[k])), [fila, n]);
  const texturas = useMemo(() => fila.opciones.map((o) => texturaLetrero(o.texto, { ancho: 512, alto: 160, fondo: '#fff7f2', color: '#3A1724', tam: 90, radio: 20 })), [fila]);
  const pregunta = useMemo(() => texturaLetrero(fila.pregunta, { ancho: 2048, alto: 260, fondo: '#3A1724', color: '#fff7f2', borde: '#F2C42C', tam: 110 }), [fila]);
  const marco = useMemo(() => new MeshStandardMaterial({ color: '#fff7f2', roughness: 0.5, emissive: '#F2C42C', emissiveIntensity: 0.15 }), []);
  useFrame(() => {
    const t = ahora();
    const f = D.filas?.[indice];
    cortinas.forEach((m, k) => {
      m.uniforms.uT.value = t + k;
      const elegido = f && f.elegido === k;
      m.uniforms.uBrillo.value += ((elegido ? 0.5 : 0) - m.uniforms.uBrillo.value) * 0.1;
    });
  });
  return (
    <group position={[fila.x, y, 0]}>
      <mesh position={[0, 6.4, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12.5, 1.6]} />
        <meshBasicMaterial map={pregunta} toneMapped={false} side={DoubleSide} />
      </mesh>
      {fila.arcos.map((a, k) => (
        <group key={k} position={[0, 0, a.z]}>
          {[-1, 1].map((l) => (
            <mesh key={l} position={[0, 2, (l * a.ancho) / 2 - l * 0.12]} material={marco} castShadow>
              <boxGeometry args={[0.3, 4, 0.24]} />
            </mesh>
          ))}
          <mesh position={[0, 4.2, 0]} material={marco}>
            <boxGeometry args={[0.32, 0.5, a.ancho]} />
          </mesh>
          <mesh position={[0.18, 4.2, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[a.ancho - 0.15, 0.46]} />
            <meshBasicMaterial map={texturas[k]} toneMapped={false} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 2, 0]} rotation-y={Math.PI / 2} material={cortinas[k]}>
            <planeGeometry args={[a.ancho - 0.3, 3.9]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Portal({ calidad }) {
  const y = PASARELA.y;
  const disco = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uT: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `uniform float uT; varying vec2 vUv;
          void main(){ vec2 p = vUv-0.5; float r = length(p)*2.0; float a = atan(p.y,p.x);
            float espiral = 0.5+0.5*sin(a*6.0 + r*14.0 - uT*4.0);
            vec3 oro = vec3(1.0,0.82,0.3); vec3 rosa = vec3(0.96,0.64,0.72);
            vec3 c = mix(rosa, oro, espiral) * (1.2 - r*0.8);
            float alfa = smoothstep(1.0, 0.2, r) * (0.35 + 0.3*espiral);
            gl_FragColor = vec4(c*0.9, alfa); }`,
      }),
    [],
  );
  const anillo = useRef();
  const lema = useMemo(() => texturaLetrero(TEXTOS.lema, { ancho: 2048, alto: 300, fondo: '#8e1b35', color: '#fff7f2', borde: '#F2C42C', tam: 120, icono: 'cinta' }), []);
  useFrame((_, dt) => {
    disco.uniforms.uT.value += dt;
    if (anillo.current) anillo.current.rotation.x += dt * 0.6;
  });
  return (
    <group position={[X_PORTAL, y, 0]}>
      <group position={[0, 4.4, 0]} rotation-y={Math.PI / 2}>
        <mesh ref={anillo}>
          <torusGeometry args={[4.3, 0.38, 16, 64]} />
          <meshStandardMaterial color="#F2C42C" emissive="#F2C42C" emissiveIntensity={1.5} metalness={0.8} roughness={0.25} toneMapped={false} />
        </mesh>
        <mesh material={disco}>
          <circleGeometry args={[4.1, 64]} />
        </mesh>
      </group>
      <mesh position={[0, 9.9, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12, 1.75]} />
        <meshBasicMaterial map={lema} toneMapped={false} side={DoubleSide} />
      </mesh>
      {calidad !== 'baja' && <Sparkles count={calidad === 'alta' ? 80 : 40} scale={[3, 9, 9]} position={[0, 4.4, 0]} size={6} speed={0.8} color="#ffe27a" />}
    </group>
  );
}
