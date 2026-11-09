import { lazy, Suspense } from 'react';
import { useJuego } from './estado/store.js';
import { G, PARAMS } from './juego/mundo.js';
import { fijarCapa } from './hud/etiquetas.js';
import HUD from './hud/HUD.jsx';
import Seleccion from './pantallas/Seleccion.jsx';
import Cuenta from './pantallas/Cuenta.jsx';
import Resultados from './pantallas/Resultados.jsx';

// El mundo 3D se descarga en segundo plano mientras se elige el avatar
const Lienzo = lazy(() => import('./escena/Lienzo.jsx'));

function AvisoGirar() {
  const pantalla = useJuego((s) => s.pantalla);
  if (!G.entrada.tactil || pantalla === 'seleccion') return null;
  return (
    <div className="aviso-girar" aria-hidden="true">
      <span>📱↻</span> Gira el teléfono para jugar mejor
    </div>
  );
}

export default function App() {
  const pantalla = useJuego((s) => s.pantalla);
  return (
    <div className={'app pantalla-' + pantalla + (PARAMS.demo ? ' demo' : '')}>
      <Suspense fallback={<div className="lienzo fondo-espera" />}>
        <Lienzo />
      </Suspense>
      <div id="capa-etiquetas" ref={(el) => el && fijarCapa(el)} />
      <div id="destello" />
      {pantalla === 'juego' && <HUD />}
      {pantalla === 'seleccion' && <Seleccion />}
      {pantalla === 'cuenta' && <Cuenta />}
      {pantalla === 'resultados' && <Resultados />}
      <AvisoGirar />
      {PARAMS.demo && pantalla !== 'resultados' && <div className="sello-demo">MODO DEMO</div>}
    </div>
  );
}
