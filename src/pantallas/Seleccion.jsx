// Pantalla de inicio: nombre, semestre y avatar. El mundo 3D sigue cargando detrás.
import { useEffect, useState } from 'react';
import { useJuego, juego } from '../estado/store.js';
import { AVATARES, SEMESTRES, DATOS, TEXTOS, ARTICULO } from '../data/contenido.js';
import { G, PARAMS } from '../juego/mundo.js';
import { iniciarAudio, silenciar } from '../audio/audio.js';
import { pantallaCompleta } from './util.js';
import { CintaSVG } from './Cinta.jsx';

function Consejos() {
  const [i, setI] = useState(Math.floor(Math.random() * DATOS.length));
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % DATOS.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="consejo" key={i}>
      <b>¿Sabías que…?</b> {DATOS[i]}
    </p>
  );
}

export function Carga() {
  const progreso = useJuego((s) => s.progreso);
  return (
    <div className="pantalla-carga" role="status">
      <CintaSVG className="carga-cinta" />
      <h2>Preparando el hospital…</h2>
      <div className="barra-carga" aria-label={`Cargando ${progreso} %`}>
        <i style={{ width: `${Math.max(4, progreso)}%` }} />
      </div>
      <span className="carga-pct">{progreso} %</span>
      <Consejos />
    </div>
  );
}

export default function Seleccion() {
  const perfil = useJuego((s) => s.perfil);
  const listo = useJuego((s) => s.mundoListo);
  const progreso = useJuego((s) => s.progreso);
  const intento = useJuego((s) => s.intentoEmpezar);
  const silencio = useJuego((s) => s.silencio);
  const set = useJuego((s) => s.set);
  const [vertical, setVertical] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const f = () => setVertical(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const completo = perfil.nombre.trim().length > 0 && perfil.semestre;
  const actualizar = (p) => set({ perfil: { ...perfil, ...p } });

  const empezar = () => {
    if (!completo) return;
    iniciarAudio();
    if (G.entrada.tactil) pantallaCompleta();
    if (!juego().mundoListo) {
      set({ intentoEmpezar: true });
      return;
    }
    set({ pantalla: 'cuenta', intentoEmpezar: false });
  };

  // Si pulsó «Empezar» antes de que cargara, arranca apenas esté listo
  useEffect(() => {
    if (intento && listo) set({ pantalla: 'cuenta', intentoEmpezar: false });
  }, [intento, listo, set]);

  // Modo demo: se llena solo y arranca
  useEffect(() => {
    if (!PARAMS.demo) return;
    const av = AVATARES[Math.floor(Math.random() * AVATARES.length)].id;
    set({ perfil: { nombre: 'Demo', semestre: 'VIII', avatar: av } });
  }, [set]);
  useEffect(() => {
    if (!PARAMS.demo || !listo) return;
    const t = setTimeout(() => {
      iniciarAudio();
      set({ pantalla: 'cuenta' });
    }, 1800);
    return () => clearTimeout(t);
  }, [listo, set]);

  if (intento && !listo) return <Carga />;

  return (
    <div className="pantalla-seleccion">
      <div className="sel-panel">
        <header className="sel-cabecera">
          <CintaSVG className="sel-cinta" />
          <div>
            <h1>{TEXTOS.titulo}</h1>
            <p>{TEXTOS.subtitulo}</p>
          </div>
          <button
            className="btn-mini sel-sonido"
            onClick={() => {
              silenciar(!silencio);
              set({ silencio: !silencio });
            }}
            aria-label={silencio ? 'Activar sonido' : 'Silenciar'}
          >
            {silencio ? '🔇' : '🔊'}
          </button>
        </header>

        <p className="sel-intro">
          Turno de <b>3 minutos</b> en el {TEXTOS.hospital}: atiende tres pacientes, derrota al <b>Retraso Diagnóstico</b> y cuéntanos qué te pareció.
        </p>

        <label className="sel-campo">
          <span>Tu nombre o apodo</span>
          <input
            type="text"
            maxLength={20}
            value={perfil.nombre}
            placeholder="Escribe aquí"
            autoComplete="nickname"
            enterKeyHint="done"
            onChange={(e) => actualizar({ nombre: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            data-testid="nombre"
          />
        </label>

        <div className="sel-campo">
          <span>Semestre</span>
          <div className="chips" role="radiogroup" aria-label="Semestre">
            {SEMESTRES.map((s) => (
              <button key={s} role="radio" aria-checked={perfil.semestre === s} className={'chip' + (perfil.semestre === s ? ' activo' : '')} onClick={() => actualizar({ semestre: s })}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="sel-campo">
          <span>Elige tu avatar</span>
          <div className="avatares" role="radiogroup" aria-label="Avatar">
            {AVATARES.map((a) => (
              <button key={a.id} role="radio" aria-checked={perfil.avatar === a.id} className={'avatar' + (perfil.avatar === a.id ? ' activo' : '')} onClick={() => actualizar({ avatar: a.id })}>
                <img src={a.foto} alt="" loading="eager" />
                <b>{a.nombre}</b>
              </button>
            ))}
          </div>
        </div>

        {vertical && G.entrada.tactil && (
          <button className="sel-girar" onClick={() => pantallaCompleta()}>
            <span className="girar-icono" aria-hidden="true">📱</span> Gira el teléfono y toca aquí para pantalla completa
          </button>
        )}

        <button className="btn-empezar" disabled={!completo} onClick={empezar} data-testid="empezar">
          {!completo ? 'Escribe tu nombre y elige semestre' : listo ? '¡Empezar turno!' : `¡Empezar! (cargando ${progreso} %)`}
        </button>
        {!listo && (
          <div className="sel-carga">
            <div className="barra-carga fina">
              <i style={{ width: `${Math.max(4, progreso)}%` }} />
            </div>
            <Consejos />
          </div>
        )}
        <footer className="sel-pie">
          {ARTICULO.autores} · {ARTICULO.curso} · {ARTICULO.docente}
        </footer>
      </div>
    </div>
  );
}
