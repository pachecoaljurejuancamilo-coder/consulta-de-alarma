// Postprocesado según la calidad: oclusión ambiental (SSAO), bloom, mapeo de tonos ACES, viñeta y SMAA.
import { EffectComposer, Bloom, SMAA, Vignette, SSAO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';

export default function Postpro({ calidad }) {
  if (calidad === 'baja') return null;
  const alta = calidad === 'alta';
  const efectos = [];
  if (alta)
    efectos.push(
      <SSAO
        key="ao"
        blendFunction={BlendFunction.MULTIPLY}
        samples={21}
        rings={4}
        radius={0.06}
        intensity={2.2}
        luminanceInfluence={0.6}
        bias={0.04}
        fade={0.02}
        distanceScaling
        depthAwareUpsampling
        worldDistanceThreshold={30}
        worldDistanceFalloff={8}
        worldProximityThreshold={0.5}
        worldProximityFalloff={0.3}
        resolutionScale={0.5}
        color="#2a1020"
      />,
    );
  efectos.push(<Bloom key="bloom" mipmapBlur intensity={alta ? 0.9 : 0.75} luminanceThreshold={1.05} luminanceSmoothing={0.25} radius={0.75} />);
  efectos.push(<ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />);
  efectos.push(<Vignette key="vig" offset={0.32} darkness={0.5} />);
  efectos.push(<SMAA key="smaa" />);
  return (
    <EffectComposer key={calidad} multisampling={0} enableNormalPass={alta}>
      {efectos}
    </EffectComposer>
  );
}
