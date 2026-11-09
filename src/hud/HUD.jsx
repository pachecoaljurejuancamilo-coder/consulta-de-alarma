// HUD de videojuego: retrato, Credibilidad Clínica, puntaje, cronómetro, minimapa, misión, radio y avisos.
import { useEffect, useRef, useState } from 'react';
import { useJuego } from '../estado/store.js';
import { G, PARAMS } from '../juego/mundo.js';
import { AVATARES, TUTORES, TIEMPOS } from '../data/contenido.js';
import Minimapa from './Minimapa.jsx';
import Controles from './Controles.jsx';
import { silenciar } from '../audio/audio.js';
import { pantallaCompleta } from '../pantallas/util.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Puntaje() {
  const puntaje = useJuego((s) => s.puntaje);
  const [mostrado, setMostrado] = useState(puntaje);
  const [salto, setSalto] = useState(0);
  useEffect(() => {
    let raf;
    const desde = mostrado;
    const inicio = performance.now();
    const paso = (t) => {
      const k = Math.min(1, (t - inicio) / 450);
      setMostrado(Math.round(desde + (puntaje - desde) * k));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    setSalto((x) => x + 1);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntaje]);
  return (
    <div className="hud-puntaje" key={salto} data-testid="puntaje">
      <small>PUNTOS</small>
      <b>{mostrado}</b>
    </div>
  );
}

function Estado() {
  const perfil = useJuego((s) => s.perfil);
  const vida = useJuego((s) => s.vida);
  const avatar = AVATARES.find((a) => a.id === perfil.avatar) || AVATARES[0];
  const ref = useRef(vida);
  const [golpe, setGolpe] = useState(false);
  useEffect(() => {
    if (vida < ref.current) {
      setGolpe(true);
      const t = setTimeout(() => setGolpe(false), 380);
      ref.current = vida;
      return () => clearTimeout(t);
    }
    ref.current = vida;
  }, [vida]);
  return (
    <div className={'hud-estado' + (golpe ? ' golpe' : '')}>
      <img className="hud-retrato" src={avatar.retrato} alt="" />
      <div className="hud-barras">
        <div className="hud-nombre">{perfil.nombre || avatar.corto}</div>
        <div className="hud-vida" role="meter" aria-valuenow={vida} aria-valuemin={0} aria-valuemax={100} aria-label="Credibilidad Clínica">
          <i style={{ width: `${vida}%` }} />
          <span>Credibilidad Clínica · {vida}</span>
        </div>
        <Puntaje />
      </div>
    </div>
  );
}

function Cronometro() {
  const segundos = useJuego((s) => s.segundos);
  const titulo = useJuego((s) => s.titulo);
  const objetivo = useJuego((s) => s.objetivo);
  const cuenta = useJuego((s) => s.cuentaObjetivo);
  const restante = TIEMPOS.total - segundos;
  const fases = [
    { n: 'M1', d: 35 },
    { n: 'M2', d: 35 },
    { n: 'M3', d: 35 },
    { n: 'Jefe', d: 45 },
    { n: 'Salida', d: 30 },
  ];
  return (
    <div className="hud-centro">
      <div className={'hud-reloj' + (restante <= 10 ? ' urgente' : '')} data-testid="cronometro">
        {mmss(segundos)}
        <small> / 3:00</small>
      </div>
      <div className="hud-fases">
        {fases.map((f, i) => {
          const ini = fases.slice(0, i).reduce((a, b) => a + b.d, 0);
          const k = Math.max(0, Math.min(1, (segundos - ini) / f.d));
          return (
            <span key={f.n} style={{ flex: f.d }} className={k > 0 && k < 1 ? 'actual' : ''}>
              <i style={{ width: `${k * 100}%` }} />
            </span>
          );
        })}
      </div>
      {titulo && <div className="hud-titulo">{titulo}</div>}
      {objetivo && (
        <div className="hud-objetivo">
          {objetivo}
          {cuenta !== null && cuenta !== undefined && cuenta >= 0 && <b className="hud-cuenta">{cuenta} s</b>}
        </div>
      )}
    </div>
  );
}

function Radio() {
  const radio = useJuego((s) => s.radio);
  if (!radio) return null;
  const t = TUTORES[radio.tutor];
  return (
    <div className="hud-radio" key={radio.id} role="status" aria-live="polite">
      <img src={t.retrato} alt="" />
      <div>
        <b>
          <span className="radio-onda" aria-hidden="true" /> {t.nombre} · radio
        </b>
        <p>{radio.texto}</p>
      </div>
    </div>
  );
}

function Avisos() {
  const avisos = useJuego((s) => s.avisos);
  return (
    <div className="hud-avisos">
      {avisos.map((a) => (
        <div key={a.id} className={'aviso aviso-' + a.tipo}>
          {a.texto}
        </div>
      ))}
    </div>
  );
}

function Tarjeta() {
  const tarjeta = useJuego((s) => s.tarjeta);
  if (!tarjeta) return null;
  return (
    <div className={'hud-tarjeta tarjeta-' + tarjeta.tipo} key={tarjeta.id}>
      <b>{tarjeta.titulo}</b>
      <p>{tarjeta.texto}</p>
    </div>
  );
}

function Cine() {
  const cine = useJuego((s) => s.cine);
  if (!cine) return null;
  return (
    <div className="hud-cine" key={cine.id} onPointerDown={() => (G.entrada.interactuar = true)}>
      <div className="cine-franja arriba" />
      <div className="cine-franja abajo" />
      <div className="cine-tarjeta">
        <small>PACIENTE</small>
        <h2>{cine.nombre}</h2>
        <p>
          {cine.edad} años · {cine.ocupacion}
        </p>
        <q>{cine.frase.replace(/[«»]/g, '')}</q>
      </div>
      <div className="cine-saltar">Toca para saltar ▸</div>
    </div>
  );
}

function BarraJefe() {
  const jefe = useJuego((s) => s.jefe);
  const pregunta = useJuego((s) => s.pregunta);
  return (
    <>
      {jefe && (
        <div className="hud-jefe">
          <b>{jefe.nombre}</b>
          <div className="jefe-barra">
            <i style={{ width: `${jefe.vida * 100}%` }} />
            {[25, 50, 75].map((p) => (
              <em key={p} style={{ left: `${p}%` }} />
            ))}
          </div>
        </div>
      )}
      {pregunta && (
        <div className="hud-pregunta" key={pregunta.n}>
          <small>
            PREGUNTA {pregunta.n}/{pregunta.total} · dispara al cristal correcto
          </small>
          <p>{pregunta.texto}</p>
        </div>
      )}
    </>
  );
}

function FilaEncuesta() {
  const fila = useJuego((s) => s.fila);
  if (!fila) return null;
  return (
    <div className="hud-pregunta hud-fila" key={fila.n}>
      <small>
        TU OPINIÓN {fila.n}/{fila.total} · pasa por el arco de tu respuesta
      </small>
      <p>{fila.texto}</p>
    </div>
  );
}

function Ayuda() {
  const interaccion = useJuego((s) => s.interaccion);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 22000);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {visible && (
        <div className="hud-ayuda">
          <kbd>W A S D</kbd> mover · <kbd>Mouse</kbd> cámara · <kbd>Clic</kbd> rayo · <kbd>Espacio</kbd> saltar · <kbd>Shift</kbd> dash · <kbd>E</kbd> interactuar
        </div>
      )}
      {interaccion && (
        <div className="hud-interaccion">
          <kbd>E</kbd> {interaccion}
        </div>
      )}
    </>
  );
}

function Botonera() {
  const silencio = useJuego((s) => s.silencio);
  const set = useJuego((s) => s.set);
  return (
    <div className="hud-botonera">
      <button
        className="btn-mini"
        onClick={() => {
          silenciar(!silencio);
          set({ silencio: !silencio });
        }}
        aria-label={silencio ? 'Activar sonido' : 'Silenciar'}
      >
        {silencio ? '🔇' : '🔊'}
      </button>
      {G.entrada.tactil && (
        <button className="btn-mini" onClick={() => pantallaCompleta()} aria-label="Pantalla completa">
          ⛶
        </button>
      )}
    </div>
  );
}

function Depuracion() {
  const [info, setInfo] = useState('');
  const calidad = useJuego((s) => s.calidad);
  useEffect(() => {
    const t = setInterval(() => setInfo(`${Math.round(G.fps)} fps · ${calidad} · t=${G.t.toFixed(1)}`), 500);
    return () => clearInterval(t);
  }, [calidad]);
  return <div className="hud-debug">{info}</div>;
}

export default function HUD() {
  const tactil = G.entrada.tactil;
  const fundido = useJuego((s) => s.fundido);
  const [ancho, setAncho] = useState(window.innerWidth);
  useEffect(() => {
    const f = () => setAncho(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return (
    <div className={'hud' + (tactil ? ' tactil' : '')}>
      {tactil && <Controles />}
      <Estado />
      <Cronometro />
      <div className="hud-derecha">
        <Minimapa tam={ancho < 700 || tactil ? 92 : 150} />
        <Botonera />
      </div>
      <BarraJefe />
      <FilaEncuesta />
      <Radio />
      <Avisos />
      <Tarjeta />
      <Cine />
      {!tactil && <Ayuda />}
      <div className={'fundido' + (fundido ? ' activo' : '')} />
      {PARAMS.debug && <Depuracion />}
    </div>
  );
}
