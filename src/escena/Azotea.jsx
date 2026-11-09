// Azotea del jefe final, ciudad alrededor y mar al atardecer.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import { MeshStandardMaterial, ShaderMaterial, Color } from 'three';
import { AZOTEA } from '../juego/mapa.js';
import { useMateriales, escalarUV } from './materiales.js';
import { CylinderGeometry } from 'three';
import { CajasInstanciadas } from './Utileria.jsx';
import { generarCasas } from './Hospital.jsx';
import { texturaHelipuerto } from './texturasCanvas.js';

export default function Azotea() {
  const mats = useMateriales();
  const { x, y, z, radio } = AZOTEA;
  const baranda = useMemo(() => {
    const postes = [];
    const n = 56;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.18) continue; // hueco hacia la pasarela (oeste)
      postes.push({ x: x + Math.sin(a) * (radio + 0.2), y: y + 0.55, z: z + Math.cos(a) * (radio + 0.2), sx: 0.08, sy: 1.1, sz: 0.08 });
    }
    return postes;
  }, [x, y, z, radio]);
  const muroBorde = useMemo(() => {
    const lista = [];
    const n = 28;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      lista.push({ x: x + Math.sin(a) * (radio + 0.45), z: z + Math.cos(a) * (radio + 0.45), ry: a });
    }
    return lista;
  }, [x, z, radio]);
  const equipos = useMemo(
    () => [
      { x: x + 10, y: y + 0.7, z: z + 6, sx: 2.2, sy: 1.4, sz: 1.6 },
      { x: x - 10.5, y: y + 0.7, z: z + 5.5, sx: 2.2, sy: 1.4, sz: 1.6 },
      { x: x + 11, y: y + 0.6, z: z - 5, sx: 1.6, sy: 1.2, sz: 1.6 },
    ],
    [x, y, z],
  );
  const casas = useMemo(
    () =>
      generarCasas(7, [
        { n: 22, x0: x - 18, x1: x + 60, z0: z + 22, z1: z + 80, hMin: 6, hMax: 15 },
        { n: 22, x0: x - 18, x1: x + 60, z0: z - 80, z1: z - 22, hMin: 6, hMax: 15 },
        { n: 10, x0: x + 22, x1: x + 60, z0: z - 20, z1: z + 20, hMin: 6, hMax: 13 },
      ]),
    [x, z],
  );
  const metal = useMemo(() => new MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.7, roughness: 0.35 }), []);
  const heli = useMemo(() => texturaHelipuerto(), []);
  const geoTorre = useMemo(() => escalarUV(new CylinderGeometry(radio - 0.6, radio - 0.6, y - 0.6, 40), 36, 6), [radio, y]);
  const geoPiso = useMemo(() => escalarUV(new CylinderGeometry(radio + 0.6, radio + 0.6, 0.5, 48), 12, 12), [radio]);

  return (
    <group>
      {/* Torre */}
      <mesh position={[x, y / 2 - 0.3, z]} material={mats.fachadaCoral} geometry={geoTorre} castShadow receiveShadow />
      {/* Piso de la azotea */}
      <mesh position={[x, y - 0.25, z]} material={mats.azotea} geometry={geoPiso} receiveShadow castShadow />
      <mesh position={[x, y + 0.02, z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial map={heli} transparent depthWrite={false} roughness={0.9} />
      </mesh>
      <CajasInstanciadas cajas={baranda} material={metal} sombra={false} />
      <mesh position={[x, y + 1.12, z]} rotation-x={Math.PI / 2} material={metal}>
        <torusGeometry args={[radio + 0.2, 0.05, 6, 80, Math.PI * 2 - 0.36]} />
      </mesh>
      <CajasInstanciadas cajas={equipos} material={metal} />
      <mesh position={[x - 9, y + 2, z - 9]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 4, 18]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.7} />
      </mesh>
      {/* Colisiones: piso y borde */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.25, radio + 0.6]} position={[x, y - 0.25, z]} />
        {muroBorde.map((m, i) => (
          <CuboidCollider key={i} args={[1.8, 0.8, 0.25]} position={[m.x, y + 0.8, m.z]} rotation={[0, m.ry, 0]} />
        ))}
        {equipos.map((e, i) => (
          <CuboidCollider key={'e' + i} args={[e.sx / 2, e.sy / 2, e.sz / 2]} position={[e.x, e.y, e.z]} />
        ))}
        <CuboidCollider args={[1.3, 2, 1.3]} position={[x - 9, y + 2, z - 9]} />
      </RigidBody>
      {/* Ciudad alrededor */}
      <CajasInstanciadas cajas={casas.muros} material={mats.edificio} sombra={false} />
      <CajasInstanciadas cajas={casas.techos} material={mats.tejas} sombra={false} />
      <mesh position={[x + 20, -0.3, z]} material={mats.suelo} receiveShadow>
        <boxGeometry args={[90, 0.2, 200]} />
      </mesh>
      <Mar />
    </group>
  );
}

function Mar() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uT: { value: 0 }, uSol: { value: new Color('#ffcf8a') } },
        vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `uniform float uT; uniform vec3 uSol; varying vec3 vP;
          void main(){
            float o = sin(vP.x*0.35 + uT*1.2)*0.5 + sin(vP.z*0.27 - uT*0.9)*0.5 + sin((vP.x+vP.z)*0.9 + uT*2.0)*0.25;
            vec3 profundo = vec3(0.10, 0.33, 0.45);
            vec3 claro = vec3(0.30, 0.62, 0.70);
            vec3 c = mix(profundo, claro, o*0.25+0.4);
            float brillo = smoothstep(0.85, 1.0, sin(vP.x*1.7 + uT*2.4)*sin(vP.z*1.3 - uT*1.6)) * 0.9;
            float haciaSol = smoothstep(0.0, 1.0, clamp(-(vP.x + 300.0)/400.0, 0.0, 1.0));
            c += uSol * brillo * (0.25 + haciaSol);
            float niebla = clamp(length(vP.xz - vec2(-250.0, 0.0))/700.0, 0.0, 1.0);
            c = mix(c, vec3(0.98, 0.72, 0.55), niebla*0.75);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame((_, dt) => (mat.uniforms.uT.value += dt));
  return (
    <mesh position={[-475, 0.1, 0]} rotation-x={-Math.PI / 2} material={mat}>
      <planeGeometry args={[600, 1000, 1, 1]} />
    </mesh>
  );
}
