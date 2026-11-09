// Cielo de atardecer dorado (degradado con sol y nubes suaves). El HDRI aporta la iluminación.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, ShaderMaterial, Vector3 } from 'three';
import { G } from '../juego/mundo.js';

export const DIR_SOL = new Vector3(-0.42, 0.42, 0.8).normalize();

export default function Cielo() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uSol: { value: DIR_SOL.clone() }, uT: { value: 0 } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
        fragmentShader: `uniform vec3 uSol; uniform float uT; varying vec3 vDir;
          float ruido(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
          float suave(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(ruido(i), ruido(i+vec2(1,0)), f.x), mix(ruido(i+vec2(0,1)), ruido(i+vec2(1,1)), f.x), f.y); }
          void main(){
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.2, 1.0);
            vec3 horizonte = vec3(1.0, 0.56, 0.24);
            vec3 medio = vec3(0.96, 0.36, 0.36);
            vec3 cenit = vec3(0.17, 0.16, 0.42);
            vec3 c = mix(horizonte, medio, smoothstep(0.0, 0.22, h));
            c = mix(c, cenit, smoothstep(0.18, 0.85, h));
            if (h < 0.0) c = mix(horizonte, vec3(0.95,0.5,0.32), clamp(-h*5.0,0.0,1.0));
            float s = max(dot(d, normalize(uSol)), 0.0);
            c += vec3(1.0, 0.78, 0.45) * pow(s, 8.0) * 0.55;
            c += vec3(1.0, 0.9, 0.7) * pow(s, 600.0) * 4.0;
            // Nubes alargadas
            vec2 uv = d.xz / max(d.y, 0.06) * 0.6 + vec2(uT*0.004, 0.0);
            float n = suave(uv*1.3)*0.6 + suave(uv*3.1)*0.3 + suave(uv*7.0)*0.1;
            float nubes = smoothstep(0.55, 0.85, n) * smoothstep(0.02, 0.25, h) * (1.0 - smoothstep(0.5, 0.9, h));
            vec3 colorNube = mix(vec3(1.0, 0.45, 0.5), vec3(1.0, 0.8, 0.45), pow(s, 2.0));
            c = mix(c, colorNube, nubes * 0.55);
            gl_FragColor = vec4(c * 1.25, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const ref = useRef();
  useFrame((state, dt) => {
    mat.uniforms.uT.value += dt;
    if (ref.current) ref.current.position.copy(state.camera.position);
  });
  return (
    <mesh ref={ref} material={mat} frustumCulled={false} renderOrder={-10} scale={500} onUpdate={(m) => (m.raycast = () => null)}>
      <sphereGeometry args={[1, 32, 16]} />
    </mesh>
  );
}

export const _G = G;
