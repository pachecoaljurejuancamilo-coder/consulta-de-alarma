// Cuenta regresiva 3-2-1 antes de empezar el turno (no cuenta en el tiempo).
import { useEffect, useState } from 'react';
import { G, resetMundo } from '../juego/mundo.js';
import { empezarPartida } from '../juego/director.js';
import { reiniciarAutopiloto } from '../juego/autopiloto.js';
import { sonido } from '../audio/audio.js';
import { limpiarEtiquetas } from '../hud/etiquetas.js';

const PASOS = ['3', '2', '1', '¡A TRABAJAR!'];

export default function Cuenta() {
  const [i, setI] = useState(0);
  useEffect(() => {
    limpiarEtiquetas();
    resetMundo();
    reiniciarAutopiloto();
    G.camara.modo = 'libre';
    G.camara.pitch = 0.3;
    sonido('tic');
  }, []);
  useEffect(() => {
    if (i >= PASOS.length) {
      empezarPartida();
      return;
    }
    const t = setTimeout(() => {
      setI(i + 1);
      if (i + 1 < PASOS.length) sonido('tic', { tono: i + 1 === PASOS.length - 1 ? 1.5 : 1 });
      else sonido('mision');
    }, i === PASOS.length - 1 ? 600 : 750);
    return () => clearTimeout(t);
  }, [i]);
  if (i >= PASOS.length) return null;
  return (
    <div className="pantalla-cuenta">
      <div className="cuenta-numero" key={i}>
        {PASOS[i]}
      </div>
      <p className="cuenta-sub">Hospital Universitario Buganvilia · Turno de urgencias</p>
    </div>
  );
}
