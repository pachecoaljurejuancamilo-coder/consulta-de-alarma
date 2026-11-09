// Lienzo 3D. Se carga aparte (import dinámico) para que la pantalla de selección aparezca
// de inmediato mientras el motor 3D, la física y los modelos terminan de descargarse.
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Escena from './Escena.jsx';

export default function Lienzo() {
  return (
    <Canvas
      className="lienzo"
      shadows="percentage"
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
      camera={{ fov: 60, near: 0.1, far: 1200, position: [0, 7, 38] }}
    >
      <Escena />
    </Canvas>
  );
}
