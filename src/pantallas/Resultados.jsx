// Resultados: puntaje, rango, precisión por signo de alarma, errores explicados y ranking en vivo.
import { useEffect, useState } from 'react';
import { useJuego } from '../estado/store.js';
import { PACIENTES, PREGUNTAS, DESTINOS, ENCUESTA, TEXTOS } from '../data/contenido.js';
import { obtenerTablero } from '../api.js';
import { volverAlInicio, alReiniciarDemo } from '../juego/director.js';
import { PARAMS } from '../juego/mundo.js';
import { CintaSVG } from './Cinta.jsx';

const ESTADO_ENVIO = {
  enviando: 'Enviando tus respuestas…',
  enviado: '✓ Respuestas enviadas al tablero del salón',
  pendiente: 'Sin conexión: tus respuestas quedaron guardadas y se enviarán solas',
  'sin-backend': 'Respuestas guardadas en este dispositivo (falta configurar el tablero)',
  demo: 'Modo demostración: estas respuestas no se guardan',
};

function Contador({ valor }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / 1400);
      setV(Math.round(valor * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <>{v}</>;
}

export default function Resultados() {
  const r = useJuego((s) => s.resultado);
  const [ranking, setRanking] = useState(null);
  const [pestana, setPestana] = useState('signos');

  useEffect(() => {
    alReiniciarDemo(() => volverAlInicio());
  }, []);
  useEffect(() => {
    if (!r) return;
    let vivo = true;
    const cargar = () =>
      obtenerTablero()
        .then((d) => vivo && setRanking(d))
        .catch(() => {});
    const t = setTimeout(cargar, PARAMS.demo ? 300 : 1500);
    const iv = setInterval(cargar, 8000);
    return () => {
      vivo = false;
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [r]);

  if (!r) return null;
  const { registro, rango, bono } = r;
  const signos = PACIENTES.flatMap((P) => P.orbes.filter((o) => o.tipo === 'alarma').map((o) => ({ ...o, paciente: P.nombre, ok: !!r.recogidos[o.id] })));
  const esperablesMal = PACIENTES.flatMap((P) => P.orbes.filter((o) => o.tipo !== 'alarma' && r.recogidos[o.id]).map((o) => ({ ...o, paciente: P.nombre })));
  const aciertosSignos = signos.filter((s) => s.ok).length;

  return (
    <div className="pantalla-resultados" data-testid="resultados">
      <div className="res-panel">
        <header className="res-cabecera">
          <div className="res-rango">
            <span className="res-icono" aria-hidden="true">
              {rango.icono}
            </span>
            <div>
              <small>TU RANGO</small>
              <h2>{rango.nombre}</h2>
              <p>{rango.texto}</p>
            </div>
          </div>
          <div className="res-puntos">
            <b data-testid="puntaje-final">
              <Contador valor={registro.puntaje} />
            </b>
            <small>puntos · incluye +{bono} por Credibilidad ({registro.vida_final})</small>
            <small className="res-turno" data-testid="turno-completo">
              Turno completo · {Math.floor(registro.tiempo_total_s / 60)}:{String(registro.tiempo_total_s % 60).padStart(2, '0')}
            </small>
          </div>
        </header>

        <div className="res-resumen">
          <span>
            <b>{aciertosSignos}/7</b> signos de alarma
          </span>
          <span>
            <b>{registro.misiones_correctas}/3</b> destinos correctos
          </span>
          <span>
            <b>{registro.preguntas_correctas}/4</b> preguntas del jefe
          </span>
          <span>
            <b>{registro.mitos_destruidos}</b> mitos destruidos
          </span>
        </div>

        <nav className="res-pestanas" role="tablist">
          {[
            ['signos', 'Signos de alarma'],
            ['errores', 'Repaso'],
            ['ranking', 'Ranking'],
          ].map(([id, t]) => (
            <button key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? 'activo' : ''} onClick={() => setPestana(id)}>
              {t}
            </button>
          ))}
        </nav>

        <div className="res-contenido">
          {pestana === 'signos' && (
            <ul className="res-signos">
              {signos.map((s) => (
                <li key={s.id} className={s.ok ? 'ok' : 'mal'}>
                  <span className="marca">{s.ok ? '✓' : '✗'}</span>
                  <div>
                    <b>{s.texto}</b>
                    <small>
                      {s.paciente}
                      {s.estudio ? ` · en el estudio lo reconoció el ${String(s.estudio.toFixed(1)).replace('.', ',')} %` : ''}
                    </small>
                    {!s.ok && <p>{s.explicacion}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {pestana === 'errores' && (
            <div className="res-repaso">
              <h3>Misiones</h3>
              <ul>
                {PACIENTES.map((P, i) => {
                  const d = r.decisiones[i];
                  const ok = d === P.correcto;
                  return (
                    <li key={P.id} className={ok ? 'ok' : 'mal'}>
                      <span className="marca">{ok ? '✓' : '✗'}</span>
                      <div>
                        <b>
                          {P.nombre}: {d ? DESTINOS[d].sala : 'sin decisión'}
                        </b>
                        <p>{ok ? P.bien : P.mal}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {esperablesMal.length > 0 && (
                <>
                  <h3>Recogiste hallazgos esperables</h3>
                  <ul>
                    {esperablesMal.map((o) => (
                      <li key={o.id} className="mal">
                        <span className="marca">✗</span>
                        <div>
                          <b>
                            {o.texto} ({o.paciente})
                          </b>
                          <p>{o.explicacion}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <h3>Preguntas del jefe</h3>
              <ul>
                {PREGUNTAS.map((P, q) => {
                  const pr = r.preguntas[q];
                  const ok = !!pr?.ok;
                  return (
                    <li key={P.id} className={ok ? 'ok' : 'mal'}>
                      <span className="marca">{ok ? '✓' : '✗'}</span>
                      <div>
                        <b>{P.pregunta}</b>
                        <small>
                          Correcta: {P.opciones[0]}
                          {!ok && pr?.elegida ? ` · elegiste: ${pr.elegida}` : !ok ? ' · sin respuesta' : ''}
                        </small>
                        {!ok && <p>{P.explicacion}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <h3>Tu opinión</h3>
              <ul className="res-opinion">
                {ENCUESTA.map((e) => (
                  <li key={e.id}>
                    <b>{e.pregunta}</b> <span>{r.encuesta[e.id] === '' || r.encuesta[e.id] === undefined ? 'sin respuesta' : String(r.encuesta[e.id])}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pestana === 'ranking' && (
            <div className="res-ranking">
              {!ranking && <p>Cargando ranking…</p>}
              {ranking && (
                <ol>
                  {ranking.ranking.map((f, i) => (
                    <li key={f.id || i} className={f.id === registro.id ? 'yo' : ''}>
                      <span className="pos">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
                      <span className="nom">
                        {f.nombre} <small>{f.semestre}</small>
                      </span>
                      <b>{f.puntaje}</b>
                    </li>
                  ))}
                  {!ranking.ranking.length && <li>Aún no hay partidas</li>}
                </ol>
              )}
              {ranking && ranking.origen !== 'nube' && <p className="res-nota">Ranking de este dispositivo (sin conexión al tablero del salón).</p>}
            </div>
          )}
        </div>

        <p className={'res-envio envio-' + r.envio}>{ESTADO_ENVIO[r.envio] || ESTADO_ENVIO.pendiente}</p>
        <div className="res-acciones">
          <button className="btn-empezar" onClick={volverAlInicio} data-testid="jugar-de-nuevo">
            Jugar de nuevo
          </button>
        </div>
        <p className="res-lema">
          <CintaSVG className="res-cinta" /> {TEXTOS.lema}
        </p>
      </div>
    </div>
  );
}
