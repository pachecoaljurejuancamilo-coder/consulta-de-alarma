// «Consulta de Alarma» · flujo principal del juego
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './estilos.css';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import {
  ARTICULO,
  TIEMPOS,
  PUNTAJE,
  RANGOS,
  SEMESTRES,
  TUTORES,
  DECISIONES,
  CASOS,
  PREGUNTAS,
  OPINION,
  TEXTOS,
} from './data/contenido.js';
import { sonido, vibrar } from './audio.js';
import { enviarResultado, obtenerTablero, reintentarPendientes, urlBackend } from './api.js';
import { avatarSVG, CINTA_SVG } from './avatar.js';
import { iniciarFondo, decidirModo, precargarModulo3D } from './fondo.js';

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const barajar = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const movReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (movReducido) gsap.globalTimeline.timeScale(4);
const nuevoId = () =>
  (crypto.randomUUID && crypto.randomUUID()) || 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2);

// ---------------------------------------------------------------------
//  Estado de la partida
// ---------------------------------------------------------------------
const partida = {
  id: nuevoId(),
  nombre: '',
  semestre: '',
  puntos: 0,
  t0: 0,
  fin: 0,
  limite: false,
  casos: [],
  preguntas: [],
  opinion: { entendiste: null, innovador: null, reconocerias: null, palabra: '' },
};
window.__partida = partida; // útil para depurar y para las pruebas

// ---------------------------------------------------------------------
//  Motor de tiempo (basado en performance.now, sigue aunque el celular se bloquee)
// ---------------------------------------------------------------------
const temporizadores = new Set();
let esperaActual = null;

function crearTemporizador(ms, { onTick, onFin } = {}) {
  const t = { fin: performance.now() + ms, dur: ms, onTick, onFin };
  temporizadores.add(t);
  return {
    cancelar: () => temporizadores.delete(t),
    restante: () => Math.max(0, t.fin - performance.now()),
  };
}

function dormir(ms) {
  return new Promise((r) => crearTemporizador(ms, { onFin: r }));
}

// Espera una acción del jugador o que se agote el tiempo (lo que pase primero).
function esperarAccion(ms, configurar, onTick) {
  return new Promise((resolve) => {
    let listo = false;
    const t0 = performance.now();
    const fin = (r) => {
      if (listo) return;
      listo = true;
      tm.cancelar();
      if (esperaActual === fin) esperaActual = null;
      resolve({ ...r, segundos: (performance.now() - t0) / 1000 });
    };
    const tm = crearTemporizador(Math.max(0, ms), { onTick, onFin: () => fin({ tipo: 'tiempo' }) });
    esperaActual = fin;
    if (configurar) configurar(fin, tm);
  });
}

function bucle() {
  const ahora = performance.now();
  if (partida.t0 && !partida.fin) actualizarCronometro(ahora);
  for (const t of [...temporizadores]) {
    const rest = t.fin - ahora;
    if (t.onTick) t.onTick(Math.max(0, rest), t.dur);
    if (rest <= 0) {
      temporizadores.delete(t);
      if (t.onFin) t.onFin();
    }
  }
}
setInterval(bucle, 50);
document.addEventListener('visibilitychange', bucle);

// Fecha y hora reales en la historia clínica
const fmtFecha = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
setInterval(() => {
  const txt = fmtFecha.format(new Date());
  $$('[data-reloj-real]').forEach((e) => (e.textContent = txt));
}, 1000);

// ---------------------------------------------------------------------
//  Barra superior: cronómetro global, etapa, puntos y sonido
// ---------------------------------------------------------------------
const elCrono = $('#cronometro');
let ultimoSegundo = -1;
function actualizarCronometro(ahora) {
  const seg = Math.min(TIEMPOS.total, (ahora - partida.t0) / 1000);
  const entero = Math.floor(seg);
  if (entero !== ultimoSegundo) {
    ultimoSegundo = entero;
    elCrono.textContent = mmss(entero);
    elCrono.dataset.segundos = String(entero);
    const final = TIEMPOS.total - entero <= 10;
    $('.barra-reloj').classList.toggle('urgente', final);
  }
  $('#barra-avance').style.width = `${(seg / TIEMPOS.total) * 100}%`;
}

function mostrarCronometroFinal(seg) {
  elCrono.textContent = mmss(seg);
  elCrono.dataset.segundos = String(Math.floor(seg));
  $('#barra-avance').style.width = `${(seg / TIEMPOS.total) * 100}%`;
  $('.barra-reloj').classList.remove('urgente');
}

function setEtapa(n, texto) {
  $('#barra-etapa-texto').textContent = texto;
  document.body.dataset.etapa = String(n);
}

const contadorPuntos = { v: 0 };
function sumarPuntos(n) {
  if (!n) return;
  partida.puntos += n;
  gsap.to(contadorPuntos, {
    v: partida.puntos,
    duration: 0.8,
    ease: 'power2.out',
    onUpdate: () => ($('#puntos').textContent = Math.round(contadorPuntos.v)),
  });
  gsap.fromTo('.barra-puntos', { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
}

const btnSonido = $('#btn-sonido');
function pintarBotonSonido() {
  btnSonido.textContent = sonido.silenciado ? '🔇' : '🔊';
  btnSonido.setAttribute('aria-pressed', String(sonido.silenciado));
  btnSonido.setAttribute('aria-label', sonido.silenciado ? 'Activar sonido' : 'Silenciar sonido');
}
btnSonido.addEventListener('click', () => {
  sonido.desbloquear();
  sonido.setSilencio(!sonido.silenciado);
  pintarBotonSonido();
});
pintarBotonSonido();

// Partículas «+10» que flotan
function flotante(texto, elemento, clase = '') {
  if (!elemento || !elemento.isConnected) return;
  const r = elemento.getBoundingClientRect();
  if (r.bottom < 70 || r.top > window.innerHeight - 40) return; // fuera de la vista
  const f = h(`<span class="flotante ${clase}" aria-hidden="true">${esc(texto)}</span>`);
  f.style.left = `${r.left + r.width - 46}px`;
  f.style.top = `${r.top + r.height / 2 - 12}px`;
  document.body.append(f);
  gsap.fromTo(
    f,
    { y: 0, opacity: 0, scale: 0.6 },
    { y: -46, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', onComplete: () => gsap.to(f, { opacity: 0, y: -70, duration: 0.5, delay: 0.3, onComplete: () => f.remove() }) },
  );
}

// ---------------------------------------------------------------------
//  Componentes: introducción de etapa y globo del tutor
// ---------------------------------------------------------------------
async function introEtapa({ numero, titulo, texto, tutor }, ms) {
  const el = h(`<div class="intro-etapa" data-testid="intro-etapa" role="dialog" aria-label="Etapa ${numero}: ${esc(titulo)}">
    <div class="intro-fondo"></div>
    <img class="intro-tutor" src="${tutor.cuerpo}" alt="${esc(tutor.nombre)}" />
    <div class="intro-contenido">
      <div class="intro-num">Etapa ${numero} de 3</div>
      <h2>${esc(titulo)}</h2>
      <p>${esc(texto)}</p>
      <div class="intro-tutor-nombre"><img src="${tutor.retrato}" alt="" />${esc(tutor.nombre)} <small>${esc(tutor.rol)}</small></div>
    </div>
  </div>`);
  $('#capa-modal').append(el);
  const tl = gsap.timeline();
  tl.from(el.querySelector('.intro-fondo'), { opacity: 0, duration: 0.25 })
    .from(el.querySelector('.intro-tutor'), { x: 140, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.05)
    .from(el.querySelectorAll('.intro-contenido > *'), { y: 24, opacity: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out' }, 0.1);
  sonido.campana();
  await esperarAccion(ms, (fin) => el.addEventListener('click', () => fin({ tipo: 'toque' })));
  gsap.to(el, { opacity: 0, duration: 0.25, onComplete: () => el.remove() });
}

function mostrarGlobo({ tutor, estado, titulo, chips = [], texto, boton = 'Continuar' }, ms) {
  const capa = $('#capa-globo');
  capa.innerHTML = '';
  const icono = { ok: '✓', mal: '✗', tiempo: '⏱' }[estado] || 'ℹ';
  const el = h(`<div class="globo globo-${estado}" data-testid="globo" role="status">
    <img class="globo-retrato" src="${tutor.retrato}" alt="" />
    <div class="globo-cuerpo">
      <div class="globo-tutor">${esc(tutor.nombre)} <small>${esc(tutor.rol)}</small></div>
      <div class="globo-titulo"><span class="globo-icono" aria-hidden="true">${icono}</span> ${esc(titulo)}</div>
      ${chips.length ? `<div class="globo-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
      <p class="globo-texto">${esc(texto)}</p>
      <button type="button" class="globo-btn">${esc(boton)} <span aria-hidden="true">▸</span></button>
      <i class="globo-tiempo" aria-hidden="true"></i>
    </div>
  </div>`);
  capa.append(el);
  gsap.from(el, { y: 60, opacity: 0, scale: 0.92, duration: 0.4, ease: 'back.out(1.6)' });
  gsap.fromTo(el.querySelector('.globo-tiempo'), { scaleX: 1 }, { scaleX: 0, duration: ms / 1000, ease: 'none' });
  return esperarAccion(ms, (fin) => el.querySelector('.globo-btn').addEventListener('click', () => {
    sonido.click();
    fin({ tipo: 'toque' });
  })).then((r) => {
    gsap.to(el, { y: 40, opacity: 0, duration: 0.25, onComplete: () => el.remove() });
    return r;
  });
}

// ---------------------------------------------------------------------
//  PORTADA (etapa 0)
// ---------------------------------------------------------------------
let fondo = null;

function pantallaInicio() {
  const liz = TUTORES.liz;
  const el = h(`<section class="portada" data-testid="portada">
    <div class="portada-arriba">
      <img class="logo-udc" src="assets/logo_udc.png" alt="Universidad de Cartagena" />
      <span class="chip-taller">Taller de gamificación</span>
    </div>
    <div class="portada-tarjeta">
      <div class="portada-marca">
        ${CINTA_SVG}
        <div>
          <h1>${esc(TEXTOS.tituloJuego)}</h1>
          <p class="subtitulo">${esc(TEXTOS.subtitulo)}</p>
        </div>
      </div>
      <div class="tutor-dice">
        <img src="${liz.retrato}" alt="${esc(liz.nombre)}" />
        <p><b>${esc(liz.nombre)}:</b> ${esc(TEXTOS.bienvenida)}</p>
      </div>
      <form id="form-inicio" novalidate>
        <label for="nombre" class="etiqueta">Tu nombre o apodo</label>
        <input id="nombre" name="nombre" maxlength="24" autocomplete="nickname" placeholder="Ej.: Caro, Dr. Pérez…" required />
        <fieldset class="semestres">
          <legend class="etiqueta">Tu semestre</legend>
          <div class="semestres-opciones">
            ${SEMESTRES.map(
              (s) => `<label class="chip-radio"><input type="radio" name="semestre" value="${esc(s.id)}" /><span>${esc(s.etiqueta)}</span></label>`,
            ).join('')}
          </div>
        </fieldset>
        <button type="submit" class="btn btn-primario btn-grande" id="btn-iniciar" disabled>
          <span aria-hidden="true">▶</span> Iniciar turno
        </button>
        <p class="ayuda" id="ayuda-inicio">Escribe tu nombre y elige tu semestre para empezar.</p>
      </form>
      <div class="portada-etapas" aria-label="Etapas del turno">
        <span><b>1:45</b> Consulta</span><span><b>0:45</b> Lo que encontramos</span><span><b>0:30</b> Tu opinión</span>
      </div>
      <div class="portada-equipo">
        ${Object.values(TUTORES)
          .map((t) => `<figure><img src="${t.retrato}" alt="" /><figcaption>${esc(t.nombre)}</figcaption></figure>`)
          .join('')}
      </div>
      <details class="portada-articulo">
        <summary>Sobre nuestro artículo</summary>
        <p><i>${esc(ARTICULO.titulo)}</i></p>
        <p>${esc(ARTICULO.autores)}.<br />${esc(ARTICULO.curso)}. ${esc(ARTICULO.docente)}.</p>
      </details>
    </div>
  </section>`);
  const pantalla = $('#pantalla');
  pantalla.innerHTML = '';
  pantalla.append(el);

  const form = $('#form-inicio');
  const nombre = $('#nombre');
  const btn = $('#btn-iniciar');
  const ayuda = $('#ayuda-inicio');
  const validar = () => {
    const ok = nombre.value.trim().length > 0 && !!form.semestre.value;
    btn.disabled = !ok;
    ayuda.textContent = ok
      ? '¡Listo! Tienes 3 minutos en total.'
      : !nombre.value.trim()
        ? 'Escribe tu nombre o apodo.'
        : 'Elige tu semestre.';
    return ok;
  };
  form.addEventListener('input', validar);
  form.addEventListener('change', () => {
    sonido.desbloquear();
    sonido.click();
    validar();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validar()) return;
    partida.nombre = nombre.value.trim().slice(0, 24);
    partida.semestre = form.semestre.value;
    iniciarTurno();
  });

  gsap.from('.portada-tarjeta', { y: 80, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 });
  gsap.from('.portada-tarjeta > *', { y: 18, opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.35, ease: 'power2.out' });
  gsap.from('.portada-arriba > *', { y: -20, opacity: 0, duration: 0.6, stagger: 0.1, delay: 0.2 });
}

async function iniciarTurno() {
  sonido.desbloquear();
  sonido.iniciarAmbiente();
  sonido.acierto();
  vibrar(30);
  // Apagamos el 3D para ahorrar batería durante el juego
  gsap.to(['#escena3d', '#fondo2d'], {
    opacity: 0,
    duration: 0.6,
    onComplete: () => {
      fondo?.destruir();
      fondo = null;
    },
  });
  document.body.classList.add('jugando');
  $('#barra').hidden = false;
  gsap.from('#barra', { y: -70, duration: 0.5, ease: 'power3.out' });
  partida.t0 = performance.now();
  crearTemporizador(TIEMPOS.total * 1000, {
    onFin: () => {
      partida.limite = true;
      if (esperaActual) esperaActual({ tipo: 'fin-global' });
    },
  });
  await etapaConsulta();
  if (!partida.limite) await etapaHallazgos();
  if (!partida.limite) await etapaOpinion();
  terminar();
}

// ---------------------------------------------------------------------
//  ETAPA 1 · CONSULTA
// ---------------------------------------------------------------------
function crearVistaCaso(caso, indice) {
  const tarjetas = barajar(caso.hallazgos);
  const el = h(`<section class="consulta" data-testid="consulta" data-caso="${caso.id}">
    <div class="hce">
      <div class="hce-top">
        <span class="hce-sistema"><span class="punto-vivo" aria-hidden="true"></span>HCE · Hospital Universitario<span class="hce-servicio"> · Consulta externa de Ginecología</span></span>
        <span class="hce-fecha" data-reloj-real>${fmtFecha.format(new Date())}</span>
      </div>
      <div class="ficha">
        <div class="ficha-avatar">${avatarSVG(caso.avatar, 'Paciente ' + caso.nombre)}</div>
        <div class="ficha-datos">
          <h2 class="ficha-nombre" tabindex="-1">${esc(caso.nombre)} ${esc(caso.apellido)}</h2>
          <div class="ficha-meta">${caso.edad} años · ${esc(caso.ocupacion)}</div>
          <div class="ficha-codigo"><span>ID ${esc(caso.codigo)}</span><span>Paciente ${indice + 1} de ${CASOS.length}</span></div>
        </div>
        <div class="anillo" data-testid="anillo-caso" role="timer" aria-label="Segundos para decidir">
          <svg viewBox="0 0 44 44" aria-hidden="true"><circle class="anillo-fondo" r="19" cx="22" cy="22"/><circle class="anillo-valor" r="19" cx="22" cy="22"/></svg>
          <span class="anillo-num">${TIEMPOS.porPaciente}</span>
        </div>
      </div>
      <div class="pestanas" role="tablist" aria-label="Historia clínica">
        <button type="button" role="tab" aria-selected="true" data-tab="motivo">Motivo</button>
        <button type="button" role="tab" aria-selected="false" data-tab="antecedentes">Antecedentes</button>
        <button type="button" role="tab" aria-selected="false" data-tab="plan">Plan</button>
      </div>
      <div class="pestana-panel" role="tabpanel" data-panel="motivo"><b>Motivo de consulta:</b> ${esc(caso.motivo)}</div>
      <div class="pestana-panel" role="tabpanel" data-panel="antecedentes" hidden><b>Antecedentes:</b> ${esc(caso.antecedentes)}</div>
      <div class="pestana-panel" role="tabpanel" data-panel="plan" hidden><b>Plan:</b> pendiente de tu decisión clínica.</div>
      <div class="vitales" aria-label="Signos vitales">
        <div class="vital vital-fc"><span class="vital-et">FC <span class="corazon" aria-hidden="true">♥</span></span><span class="vital-val" data-v="fc">${caso.vitales.fc}</span><span class="vital-u">lpm</span></div>
        <div class="vital vital-ecg" aria-hidden="true"><canvas class="mini-ecg" width="240" height="64"></canvas></div>
        <div class="vital"><span class="vital-et">PA</span><span class="vital-val" data-v="pa">${caso.vitales.pas}/${caso.vitales.pad}</span><span class="vital-u">mmHg</span></div>
        <div class="vital"><span class="vital-et">SpO₂</span><span class="vital-val" data-v="spo2">${caso.vitales.spo2}</span><span class="vital-u">%</span></div>
        <div class="vital"><span class="vital-et">T°</span><span class="vital-val" data-v="temp">${caso.vitales.temp.toFixed(1).replace('.', ',')}</span><span class="vital-u">°C</span></div>
      </div>
    </div>
    <div class="entrevista">
      <div class="seccion-titulo"><span aria-hidden="true">💬</span> Entrevista</div>
      <div class="chat" aria-live="polite"></div>
    </div>
    <div class="hallazgos">
      <div class="seccion-titulo"><span aria-hidden="true">🩺</span> Hallazgos <span class="seccion-ayuda">Toca los que sean <b>signo de alarma</b></span></div>
      <div class="leyenda" aria-hidden="true"><span class="ley ley-esperable">✓ Esperable</span><span class="ley-flecha">toca ⇄</span><span class="ley ley-alarma">⚠ Alarma</span></div>
      <ul class="tarjetas">
        ${tarjetas
          .map(
            (t) => `<li><button type="button" class="tarjeta" data-testid="tarjeta" data-id="${t.id}" aria-pressed="false">
              <span class="tarjeta-icono" aria-hidden="true"><i class="i-esp">✓</i><i class="i-ala">⚠</i></span>
              <span class="tarjeta-texto">${esc(t.texto)}</span>
              <span class="tarjeta-estado"><span class="e-esp">Esperable</span><span class="e-ala">Alarma</span></span>
            </button></li>`,
          )
          .join('')}
      </ul>
    </div>
    <div class="decision" role="group" aria-label="Decisión clínica">
      ${Object.values(DECISIONES)
        .map(
          (d) => `<button type="button" class="btn-decision d-${d.id}" data-testid="decision-${d.id}" data-decision="${d.id}">
            <span class="d-icono" aria-hidden="true">${d.icono}</span>
            <span class="d-texto"><b>${esc(d.titulo)}</b><small>${esc(d.detalle)}</small></span>
          </button>`,
        )
        .join('')}
    </div>
  </section>`);

  const pantalla = $('#pantalla');
  pantalla.innerHTML = '';
  pantalla.append(el);
  window.scrollTo(0, 0);

  // Pestañas
  $$('[role=tab]', el).forEach((b) =>
    b.addEventListener('click', () => {
      sonido.click();
      $$('[role=tab]', el).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      $$('.pestana-panel', el).forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
    }),
  );

  // Tarjetas: un toque alterna entre «esperable» y «signo de alarma»
  let bloqueado = false;
  $$('.tarjeta', el).forEach((b) =>
    b.addEventListener('click', () => {
      if (bloqueado) return;
      const alarma = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(alarma));
      sonido.marcar(alarma);
      vibrar(12);
      gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
    }),
  );

  // Signos vitales que oscilan + mini ECG con bip
  const v = { ...caso.vitales };
  const intervaloVitales = setInterval(() => {
    const base = caso.vitales;
    v.fc = Math.max(base.fc - 5, Math.min(base.fc + 5, v.fc + Math.round(Math.random() * 4 - 2)));
    v.pas = base.pas + Math.round(Math.random() * 4 - 2);
    v.pad = base.pad + Math.round(Math.random() * 2 - 1);
    v.spo2 = Math.random() < 0.8 ? base.spo2 : base.spo2 - 1;
    v.temp = base.temp + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -0.1 : 0.1) : 0);
    const pon = (k, txt) => {
      const n = el.querySelector(`[data-v="${k}"]`);
      if (n && n.textContent !== txt) {
        n.textContent = txt;
        n.classList.remove('cambio');
        void n.offsetWidth;
        n.classList.add('cambio');
      }
    };
    pon('fc', String(v.fc));
    pon('pa', `${v.pas}/${v.pad}`);
    pon('spo2', String(v.spo2));
    pon('temp', v.temp.toFixed(1).replace('.', ','));
  }, 1600);

  const lienzo = el.querySelector('.mini-ecg');
  const g = lienzo.getContext('2d');
  const traza = new Array(lienzo.width).fill(0);
  let x = 0;
  let fase = 0;
  let ultimo = performance.now();
  let rafEcg = 0;
  const forma = (p) => {
    if (p < 0.1) return Math.sin((p / 0.1) * Math.PI) * 0.1;
    if (p < 0.17) return 0;
    if (p < 0.19) return -0.2;
    if (p < 0.22) return 1;
    if (p < 0.25) return -0.32;
    if (p < 0.42) return 0;
    if (p < 0.56) return Math.sin(((p - 0.42) / 0.14) * Math.PI) * 0.22;
    return 0;
  };
  const corazon = el.querySelector('.corazon');
  function dibujarEcg(ahora) {
    rafEcg = requestAnimationFrame(dibujarEcg);
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    const pasos = Math.max(1, Math.round(dt * 90));
    for (let i = 0; i < pasos; i++) {
      const antes = fase;
      fase = (fase + v.fc / 60 / 90) % 1;
      if (antes < 0.2 && fase >= 0.2) {
        sonido.bip(0.022);
        corazon.classList.remove('late');
        void corazon.offsetWidth;
        corazon.classList.add('late');
      }
      traza[x] = forma(fase);
      x = (x + 1) % traza.length;
    }
    g.clearRect(0, 0, lienzo.width, lienzo.height);
    g.strokeStyle = '#1E9E67';
    g.lineWidth = 2.5;
    g.beginPath();
    let mover = true;
    for (let i = 0; i < traza.length; i++) {
      if ((i - x + traza.length) % traza.length < 10) {
        mover = true;
        continue;
      }
      const yy = lienzo.height / 2 + 6 - traza[i] * (lienzo.height * 0.42);
      if (mover) g.moveTo(i, yy);
      else g.lineTo(i, yy);
      mover = false;
    }
    g.stroke();
  }
  rafEcg = requestAnimationFrame(dibujarEcg);

  // Animación de entrada
  gsap.from(el.querySelector('.hce'), { y: 30, opacity: 0, duration: 0.45, ease: 'power3.out' });
  gsap.from($$('.tarjeta', el), { y: 24, opacity: 0, duration: 0.4, stagger: 0.07, delay: 0.25, ease: 'power2.out' });
  gsap.from($$('.btn-decision', el), { y: 30, opacity: 0, duration: 0.4, stagger: 0.08, delay: 0.5, ease: 'back.out(1.5)' });

  // Entrevista con animación de «escribiendo…»
  let chatVivo = true;
  async function correrChat() {
    const chat = el.querySelector('.chat');
    const agregar = (html) => {
      const m = h(html);
      chat.append(m);
      gsap.from(m, { y: 12, opacity: 0, scale: 0.96, duration: 0.3, ease: 'back.out(2)' });
      return m;
    };
    agregar(`<div class="msg msg-medico"><span>Buen día, ${esc(caso.nombre)}. ¿Qué la trae a consulta?</span></div>`);
    for (const texto of caso.mensajes) {
      await dormir(350);
      if (!chatVivo) return;
      const escribiendo = agregar(
        `<div class="msg msg-paciente escribiendo" aria-label="${esc(caso.nombre)} está escribiendo"><span class="puntos-escribiendo"><i></i><i></i><i></i></span></div>`,
      );
      await dormir(650 + Math.min(900, texto.length * 12));
      if (!chatVivo) return;
      escribiendo.remove();
      agregar(`<div class="msg msg-paciente"><span>${esc(texto)}</span></div>`);
      sonido.tono(660, { dur: 0.06, vol: 0.03 });
    }
  }

  const anillo = el.querySelector('.anillo');
  const anilloValor = el.querySelector('.anillo-valor');
  const anilloNum = el.querySelector('.anillo-num');
  const C = 2 * Math.PI * 19;
  anilloValor.style.strokeDasharray = `${C}`;
  let ultimoNum = -1;

  return {
    el,
    activar() {
      correrChat();
    },
    anillo(rest, dur) {
      const frac = Math.max(0, rest / dur);
      anilloValor.style.strokeDashoffset = `${C * (1 - frac)}`;
      const n = Math.ceil(rest / 1000);
      anillo.dataset.restante = String(n);
      if (n !== ultimoNum) {
        ultimoNum = n;
        anilloNum.textContent = String(n);
        const urg = n <= 5;
        anillo.classList.toggle('urgente', urg);
        if (urg && n > 0) sonido.tic();
      }
    },
    onDecision(fn) {
      $$('.btn-decision', el).forEach((b) =>
        b.addEventListener('click', () => {
          if (bloqueado) return;
          fn(b.dataset.decision);
        }),
      );
    },
    leerMarcas() {
      const marcas = {};
      $$('.tarjeta', el).forEach((b) => (marcas[b.dataset.id] = b.getAttribute('aria-pressed') === 'true'));
      return marcas;
    },
    bloquear(decision) {
      bloqueado = true;
      el.classList.add('bloqueada');
      $$('.btn-decision', el).forEach((b) => {
        b.disabled = true;
        b.classList.toggle('elegida', b.dataset.decision === decision);
      });
    },
    revelar(resultadoTarjetas) {
      $$('.tarjeta', el).forEach((b, i) => {
        const r = resultadoTarjetas[b.dataset.id];
        b.classList.add('revelada', r.ok ? 'ok' : 'mal');
        b.disabled = true;
        const veredicto = r.ok
          ? `<span class="veredicto v-ok"><b aria-hidden="true">✓</b> Bien</span>`
          : `<span class="veredicto v-mal"><b aria-hidden="true">✗</b> ${r.tipo === 'alarma' ? 'Era alarma' : 'Era esperable'}</span>`;
        b.insertAdjacentHTML('beforeend', veredicto);
        gsap.fromTo(b, { rotateX: -70, opacity: 0.4 }, { rotateX: 0, opacity: 1, duration: 0.45, delay: i * 0.06, ease: 'back.out(1.6)' });
        if (r.ok) setTimeout(() => flotante(`+${PUNTAJE.tarjeta}`, b), 200 + i * 60);
      });
      const decisionCorrecta = $(`.btn-decision[data-decision="${caso.correcta}"]`, el);
      decisionCorrecta.classList.add('correcta');
    },
    destruir() {
      chatVivo = false;
      clearInterval(intervaloVitales);
      cancelAnimationFrame(rafEcg);
    },
  };
}

async function etapaConsulta() {
  setEtapa(1, 'Etapa 1 · Consulta');
  for (let i = 0; i < CASOS.length; i++) {
    if (partida.limite) return;
    const caso = CASOS[i];
    const inicioSlot = performance.now();
    const finSlot = inicioSlot + TIEMPOS.porPaciente * 1000;
    const vista = crearVistaCaso(caso, i);
    if (i === 0) {
      await introEtapa(
        { numero: 1, titulo: 'Consulta', texto: TEXTOS.introEtapa1, tutor: TUTORES.liz },
        1500,
      );
      if (partida.limite) return vista.destruir();
    }
    vista.activar();
    $('.ficha-nombre', vista.el)?.focus({ preventScroll: true });
    const ventanaMs = finSlot - TIEMPOS.globoCaso * 1000 - performance.now();
    const res = await esperarAccion(
      ventanaMs,
      (fin) => vista.onDecision((valor) => fin({ tipo: 'decision', valor })),
      (rest, dur) => vista.anillo(rest, dur),
    );
    const decision = res.tipo === 'decision' ? res.valor : null;
    vista.bloquear(decision);

    // Calificación
    const marcas = vista.leerMarcas();
    const resultadoTarjetas = {};
    let buenas = 0;
    caso.hallazgos.forEach((t) => {
      const marcoAlarma = !!marcas[t.id];
      const ok = marcoAlarma === (t.tipo === 'alarma');
      if (ok) buenas++;
      resultadoTarjetas[t.id] = { ok, marcoAlarma, tipo: t.tipo };
    });
    const correcta = decision === caso.correcta;
    const bonus = correcta ? Math.round(PUNTAJE.rapidezMax * Math.max(0, 1 - res.segundos / (ventanaMs / 1000))) : 0;
    const puntosCaso = buenas * PUNTAJE.tarjeta + (correcta ? PUNTAJE.decision : 0) + bonus;
    partida.casos.push({ id: caso.id, decision, correcta, tarjetas: resultadoTarjetas, buenas, bonus, puntos: puntosCaso, segundos: res.segundos });

    vista.revelar(resultadoTarjetas);
    sumarPuntos(puntosCaso);
    if (correcta) {
      sonido.acierto();
      vibrar(40);
    } else {
      sonido.error();
      vibrar([80, 50, 80]);
    }
    if (partida.limite) return vista.destruir();

    const estado = res.tipo !== 'decision' ? 'tiempo' : correcta ? 'ok' : 'mal';
    const titulo =
      estado === 'tiempo' ? 'Se acabó el tiempo' : correcta ? `¡Decisión correcta! +${PUNTAJE.decision}` : 'Decisión incorrecta';
    const chips = [`Tarjetas ${buenas}/${caso.hallazgos.length} · +${buenas * PUNTAJE.tarjeta}`];
    if (bonus) chips.push(`⚡ Rapidez +${bonus}`);
    const fbMs = Math.max(1500, Math.min(3200, finSlot - performance.now()));
    await mostrarGlobo(
      {
        tutor: TUTORES.liz,
        estado,
        titulo,
        chips,
        texto: correcta ? caso.globo.bien : caso.globo.mal,
        boton: i < CASOS.length - 1 ? 'Siguiente paciente' : 'Continuar',
      },
      fbMs,
    );
    vista.destruir();
  }
}

// ---------------------------------------------------------------------
//  ETAPA 2 · LO QUE ENCONTRAMOS
// ---------------------------------------------------------------------
function crearVistaPregunta(p, indice) {
  const opciones = barajar(p.opciones.map((texto, i) => ({ texto, correcta: i === 0 })));
  const juan = TUTORES.juan;
  const el = h(`<section class="quiz" data-testid="quiz" data-pregunta="${p.id}">
    <div class="quiz-cabecera">
      <img src="${juan.retrato}" alt="${esc(juan.nombre)}" class="quiz-tutor" />
      <div>
        <div class="quiz-etq">Lo que encontramos · ${esc(juan.nombre)}</div>
        <div class="quiz-progreso" aria-label="Pregunta ${indice + 1} de ${PREGUNTAS.length}">
          ${PREGUNTAS.map((_, i) => `<i class="${i < indice ? 'hecha' : i === indice ? 'actual' : ''}"></i>`).join('')}
          <span>Pregunta ${indice + 1} de ${PREGUNTAS.length}</span>
        </div>
      </div>
    </div>
    <div class="quiz-tiempo" role="timer" aria-label="Tiempo de la pregunta"><i></i><span class="quiz-seg"></span></div>
    <h2 class="quiz-pregunta" tabindex="-1">${esc(p.pregunta)}</h2>
    <div class="quiz-opciones">
      ${opciones
        .map(
          (o, i) => `<button type="button" class="opcion" data-testid="opcion" data-texto="${esc(o.texto)}">
            <span class="opcion-letra" aria-hidden="true">${'ABCD'[i]}</span>
            <span class="opcion-texto">${esc(o.texto)}</span>
            <span class="opcion-marca" aria-hidden="true"></span>
          </button>`,
        )
        .join('')}
    </div>
    <p class="quiz-fuente">Datos de nuestro estudio (${esc(ARTICULO.cita)}) · n = 109</p>
  </section>`);
  const pantalla = $('#pantalla');
  pantalla.innerHTML = '';
  pantalla.append(el);
  window.scrollTo(0, 0);
  gsap.from(el.querySelector('.quiz-pregunta'), { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' });
  gsap.from($$('.opcion', el), { x: -30, opacity: 0, duration: 0.35, stagger: 0.06, delay: 0.1, ease: 'power2.out' });
  const barra = el.querySelector('.quiz-tiempo i');
  const seg = el.querySelector('.quiz-seg');
  return {
    el,
    tick(rest, dur) {
      barra.style.transform = `scaleX(${Math.max(0, rest / dur)})`;
      const n = Math.ceil(rest / 1000);
      if (seg.textContent !== `${n} s`) {
        seg.textContent = `${n} s`;
        el.querySelector('.quiz-tiempo').classList.toggle('urgente', n <= 3);
        if (n <= 3 && n > 0) sonido.tic();
      }
    },
    onRespuesta(fn) {
      $$('.opcion', el).forEach((b) => b.addEventListener('click', () => fn(b.dataset.texto)));
    },
    revelar(elegida) {
      $$('.opcion', el).forEach((b) => {
        b.disabled = true;
        const esCorrecta = b.dataset.texto === p.opciones[0];
        if (esCorrecta) {
          b.classList.add('correcta');
          b.querySelector('.opcion-marca').innerHTML = '<b>✓</b> Correcta';
        } else if (b.dataset.texto === elegida) {
          b.classList.add('incorrecta');
          b.querySelector('.opcion-marca').innerHTML = '<b>✗</b> Tu respuesta';
        } else b.classList.add('apagada');
      });
      gsap.fromTo(el.querySelector('.opcion.correcta'), { scale: 1.05 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    },
  };
}

async function etapaHallazgos() {
  setEtapa(2, 'Etapa 2 · Lo que encontramos');
  const slot = (TIEMPOS.etapaHallazgos * 1000) / PREGUNTAS.length;
  for (let i = 0; i < PREGUNTAS.length; i++) {
    if (partida.limite) return;
    const p = PREGUNTAS[i];
    const finSlot = performance.now() + slot;
    const vista = crearVistaPregunta(p, i);
    if (i === 0) {
      await introEtapa({ numero: 2, titulo: 'Lo que encontramos', texto: TEXTOS.introEtapa2, tutor: TUTORES.juan }, 1400);
      if (partida.limite) return;
    }
    $('.quiz-pregunta', vista.el)?.focus({ preventScroll: true });
    const ventana = finSlot - TIEMPOS.globoPregunta * 1000 - performance.now();
    const res = await esperarAccion(
      ventana,
      (fin) => vista.onRespuesta((valor) => fin({ tipo: 'respuesta', valor })),
      (rest, dur) => vista.tick(rest, dur),
    );
    const elegida = res.tipo === 'respuesta' ? res.valor : null;
    const ok = elegida === p.opciones[0];
    partida.preguntas.push({ id: p.id, respuesta: elegida, ok, segundos: res.segundos });
    vista.revelar(elegida);
    if (ok) {
      sumarPuntos(PUNTAJE.pregunta);
      sonido.acierto();
      vibrar(40);
      flotante(`+${PUNTAJE.pregunta}`, vista.el.querySelector('.opcion.correcta'));
    } else {
      sonido.error();
      vibrar([80, 50, 80]);
    }
    if (partida.limite) return;
    const fbMs = Math.max(1300, Math.min(2800, finSlot - performance.now()));
    await mostrarGlobo(
      {
        tutor: TUTORES.juan,
        estado: !elegida ? 'tiempo' : ok ? 'ok' : 'mal',
        titulo: !elegida ? 'Se acabó el tiempo' : ok ? `¡Correcto! +${PUNTAJE.pregunta}` : 'No era esa',
        texto: p.explicacion,
        boton: i < PREGUNTAS.length - 1 ? 'Siguiente' : 'Continuar',
      },
      fbMs,
    );
  }
}

// ---------------------------------------------------------------------
//  ETAPA 3 · TU OPINIÓN
// ---------------------------------------------------------------------
async function etapaOpinion() {
  setEtapa(3, 'Etapa 3 · Tu opinión');
  const ahora = performance.now();
  const restanteGlobal = TIEMPOS.total * 1000 - (ahora - partida.t0);
  const presupuesto = Math.max(0, Math.min(TIEMPOS.etapaOpinion * 1000, restanteGlobal));
  const finEtapa = ahora + presupuesto;
  const gino = TUTORES.gino;
  const claves = ['entendiste', 'innovador', 'reconocerias', 'palabra'];

  const el = h(`<section class="opinion" data-testid="opinion">
    <div class="opinion-cabecera">
      <img src="${gino.retrato}" alt="${esc(gino.nombre)}" class="quiz-tutor" />
      <div class="opinion-globo"><b>${esc(gino.nombre)}:</b> ${esc(TEXTOS.introEtapa3)}</div>
    </div>
    <div class="quiz-tiempo opinion-tiempo" role="timer" aria-label="Tiempo de la etapa"><i></i><span class="quiz-seg"></span></div>
    <div class="opinion-pasos" aria-hidden="true">${claves.map((_, i) => `<i data-paso="${i}"></i>`).join('')}</div>
    <div class="opinion-zona"></div>
  </section>`);
  const pantalla = $('#pantalla');
  pantalla.innerHTML = '';
  pantalla.append(el);
  window.scrollTo(0, 0);

  const barra = el.querySelector('.opinion-tiempo i');
  const seg = el.querySelector('.opinion-tiempo .quiz-seg');
  const tickEtapa = () => {
    const rest = Math.max(0, finEtapa - performance.now());
    barra.style.transform = `scaleX(${presupuesto ? rest / presupuesto : 0})`;
    seg.textContent = `${Math.ceil(rest / 1000)} s`;
    el.querySelector('.opinion-tiempo').classList.toggle('urgente', rest < 5000);
  };

  await introEtapa({ numero: 3, titulo: 'Tu opinión', texto: TEXTOS.introEtapa3, tutor: gino }, 1200);

  for (let i = 0; i < claves.length; i++) {
    if (partida.limite) return;
    const rest = finEtapa - performance.now();
    if (rest <= 0) return;
    const clave = claves[i];
    const q = OPINION[clave];
    $$('.opinion-pasos i', el).forEach((p, k) => {
      p.classList.toggle('hecha', k < i);
      p.classList.toggle('actual', k === i);
    });
    const zona = el.querySelector('.opinion-zona');
    let bloque;
    if (clave !== 'palabra') {
      bloque = h(`<div class="op-bloque" data-testid="op-${clave}">
        <h2 class="op-pregunta" tabindex="-1">${esc(q.pregunta)}</h2>
        <div class="op-escala op-n${q.opciones.length}">
          ${q.opciones
            .map(
              (o) => `<button type="button" class="op-opcion" data-valor="${esc(o.valor)}" aria-label="${esc(o.etiqueta)}">
                <span class="op-emoji" aria-hidden="true">${o.emoji}</span><span class="op-etq">${esc(o.etiqueta)}</span>
                ${typeof o.valor === 'number' ? `<span class="op-num" aria-hidden="true">${o.valor}</span>` : ''}
              </button>`,
            )
            .join('')}
        </div>
      </div>`);
    } else {
      bloque = h(`<div class="op-bloque" data-testid="op-palabra">
        <h2 class="op-pregunta" tabindex="-1"><label for="op-palabra">${esc(q.pregunta)}</label></h2>
        <div class="op-chips">
          ${q.sugerencias.map((s) => `<button type="button" class="chip-sug" data-valor="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>
        <div class="op-campo">
          <input id="op-palabra" maxlength="${q.max}" autocomplete="off" placeholder="Escribe aquí (opcional)" enterkeyhint="done" />
          <span class="op-contador" aria-live="polite">0/${q.max}</span>
        </div>
        <div class="op-acciones">
          <button type="button" class="btn btn-secundario" data-accion="omitir">Omitir</button>
          <button type="button" class="btn btn-primario" data-accion="listo" data-testid="btn-terminar">Terminar turno ✓</button>
        </div>
      </div>`);
    }
    zona.innerHTML = '';
    zona.append(bloque);
    gsap.from(bloque, { x: 50, opacity: 0, duration: 0.35, ease: 'power2.out' });
    gsap.from($$('.op-opcion, .chip-sug', bloque), { y: 16, opacity: 0, duration: 0.3, stagger: 0.04, delay: 0.1 });
    bloque.querySelector('.op-pregunta')?.focus({ preventScroll: true });

    const r = await esperarAccion(
      finEtapa - performance.now(),
      (fin) => {
        if (clave !== 'palabra') {
          $$('.op-opcion', bloque).forEach((b) =>
            b.addEventListener('click', () => {
              sonido.click();
              vibrar(15);
              b.classList.add('elegida');
              const valor = typeof q.opciones[0].valor === 'number' ? Number(b.dataset.valor) : b.dataset.valor;
              fin({ tipo: 'valor', valor });
            }),
          );
        } else {
          const input = bloque.querySelector('#op-palabra');
          const contador = bloque.querySelector('.op-contador');
          input.addEventListener('input', () => {
            partida.opinion.palabra = input.value.trim().slice(0, q.max);
            contador.textContent = `${input.value.length}/${q.max}`;
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') fin({ tipo: 'valor', valor: input.value.trim().slice(0, q.max) });
          });
          $$('.chip-sug', bloque).forEach((b) =>
            b.addEventListener('click', () => {
              sonido.click();
              b.classList.add('elegida');
              input.value = b.dataset.valor;
              fin({ tipo: 'valor', valor: b.dataset.valor });
            }),
          );
          bloque.querySelector('[data-accion=omitir]').addEventListener('click', () => fin({ tipo: 'valor', valor: '' }));
          bloque.querySelector('[data-accion=listo]').addEventListener('click', () =>
            fin({ tipo: 'valor', valor: input.value.trim().slice(0, q.max) }),
          );
        }
      },
      tickEtapa,
    );
    if (r.tipo !== 'valor') return; // se acabó el tiempo: se guarda lo que haya escrito
    partida.opinion[clave] = r.valor;
    await dormir(260);
  }
}

// ---------------------------------------------------------------------
//  ETAPA 4 · RESULTADOS
// ---------------------------------------------------------------------
function rangoDe(p) {
  return RANGOS.find((r) => p >= r.min) || RANGOS[RANGOS.length - 1];
}

function construirRegistro(segundos) {
  const rango = rangoDe(partida.puntos);
  const r = {
    id: partida.id,
    nombre: partida.nombre,
    semestre: partida.semestre,
    puntaje: partida.puntos,
    rango: rango.nombre,
    puntaje_consulta: partida.casos.reduce((a, c) => a + c.puntos, 0),
    puntaje_hallazgos: partida.preguntas.filter((p) => p.ok).length * PUNTAJE.pregunta,
    tarjetas_correctas: partida.casos.reduce((a, c) => a + c.buenas, 0),
    decisiones_correctas: partida.casos.filter((c) => c.correcta).length,
    preguntas_correctas: partida.preguntas.filter((p) => p.ok).length,
  };
  CASOS.forEach((caso) => {
    const c = partida.casos.find((x) => x.id === caso.id);
    r[`caso_${caso.id}`] = c ? (c.decision ? DECISIONES[c.decision].titulo : 'Sin decisión') : 'No atendida';
    caso.hallazgos.forEach((t) => {
      r[`t_${t.id}`] = c ? (c.tarjetas[t.id].ok ? 1 : 0) : '';
    });
  });
  PREGUNTAS.forEach((p) => {
    const q = partida.preguntas.find((x) => x.id === p.id);
    r[p.id] = q ? q.respuesta || 'Sin respuesta' : 'No respondida';
    r[`${p.id}_ok`] = q ? (q.ok ? 1 : 0) : 0;
  });
  r.op_entendiste = partida.opinion.entendiste ?? '';
  r.op_innovador = partida.opinion.innovador ?? '';
  r.op_reconocerias = partida.opinion.reconocerias ?? '';
  r.op_palabra = (partida.opinion.palabra || '').slice(0, OPINION.palabra.max);
  r.tiempo_total_s = Math.round(segundos * 10) / 10;
  r.fecha_local = new Date().toISOString();
  return r;
}

function repasoHTML() {
  const casos = CASOS.map((caso) => {
    const c = partida.casos.find((x) => x.id === caso.id);
    if (!c) return '';
    const decisionTxt = c.decision ? DECISIONES[c.decision].titulo : 'Sin decisión (tiempo agotado)';
    const items = caso.hallazgos
      .map((t) => {
        const r = c.tarjetas[t.id];
        const marca = r.marcoAlarma ? 'la marcaste como signo de alarma' : 'la dejaste como esperable';
        return r.ok
          ? `<li class="rep-ok"><b aria-hidden="true">✓</b><span>${esc(t.texto)} <em>(${t.tipo === 'alarma' ? 'signo de alarma' : 'esperable'})</em></span></li>`
          : `<li class="rep-mal"><b aria-hidden="true">✗</b><span><strong>${esc(t.texto)}</strong>: ${marca}, pero ${t.tipo === 'alarma' ? 'es un signo de alarma' : 'es esperable'}. <span class="rep-dato">${esc(t.explicacion)}</span></span></li>`;
      })
      .join('');
    return `<article class="rep-caso">
      <header>
        <div class="rep-avatar">${avatarSVG(caso.avatar, caso.nombre)}</div>
        <div><b>${esc(caso.nombre)}, ${caso.edad} años</b>
          <div class="rep-decision ${c.correcta ? 'rep-ok' : 'rep-mal'}"><b aria-hidden="true">${c.correcta ? '✓' : '✗'}</b> ${esc(decisionTxt)}${
            c.correcta ? '' : ` · Correcto: ${esc(DECISIONES[caso.correcta].titulo)}`
          }</div>
        </div>
        <span class="rep-puntos">+${c.puntos}</span>
      </header>
      <ul>${items}</ul>
    </article>`;
  }).join('');
  const preguntas = PREGUNTAS.map((p) => {
    const q = partida.preguntas.find((x) => x.id === p.id);
    if (!q) return `<li class="rep-mal"><b aria-hidden="true">–</b><span>${esc(p.pregunta)} <em>(no alcanzaste a responder)</em> <span class="rep-dato">${esc(p.explicacion)}</span></span></li>`;
    return q.ok
      ? `<li class="rep-ok"><b aria-hidden="true">✓</b><span>${esc(p.pregunta)} <strong>${esc(p.opciones[0])}</strong></span></li>`
      : `<li class="rep-mal"><b aria-hidden="true">✗</b><span>${esc(p.pregunta)} Respondiste «${esc(q.respuesta || 'sin respuesta')}». <span class="rep-dato">${esc(p.explicacion)}</span></span></li>`;
  }).join('');
  return `${casos}<article class="rep-caso"><header><div class="rep-avatar rep-avatar-img"><img src="${TUTORES.juan.retrato}" alt="" /></div><div><b>Lo que encontramos</b><div class="rep-decision">${partida.preguntas.filter((x) => x.ok).length} de ${PREGUNTAS.length} correctas</div></div></header><ul>${preguntas}</ul></article>`;
}

async function terminar() {
  if (partida.fin) return;
  partida.fin = performance.now();
  for (const t of [...temporizadores]) temporizadores.delete(t);
  $('#capa-globo').innerHTML = '';
  $('#capa-modal').innerHTML = '';
  const segundos = partida.limite ? TIEMPOS.total : Math.min(TIEMPOS.total, (partida.fin - partida.t0) / 1000);
  mostrarCronometroFinal(segundos);
  setEtapa(4, 'Resultados');
  const registro = construirRegistro(segundos);
  const rango = rangoDe(partida.puntos);
  const tarjetasTotal = CASOS.reduce((a, c) => a + c.hallazgos.length, 0);

  const el = h(`<section class="resultados" data-testid="resultados">
    <div class="res-hero">
      <div class="res-tutores" aria-hidden="true">
        <img src="${TUTORES.liz.cuerpo}" alt="" /><img src="${TUTORES.juan.cuerpo}" alt="" /><img src="${TUTORES.gino.cuerpo}" alt="" />
      </div>
      <div class="res-caja">
        <div class="res-etq">Turno terminado · ${esc(partida.nombre)} (${esc(partida.semestre)})</div>
        <div class="res-puntaje"><span id="res-num" data-testid="puntaje-final" data-valor="${partida.puntos}">0</span><small>puntos</small></div>
        <div class="res-rango" data-testid="rango"><span aria-hidden="true">${rango.icono}</span> ${esc(rango.nombre)}</div>
        <p class="res-rango-texto">${esc(rango.texto)}</p>
        <div class="res-stats">
          <span><b aria-hidden="true">⏱</b> <span data-testid="tiempo-final">${mmss(segundos)}</span> de 3:00</span>
          <span><b aria-hidden="true">🃏</b> ${registro.tarjetas_correctas}/${tarjetasTotal} hallazgos</span>
          <span><b aria-hidden="true">🩺</b> ${registro.decisiones_correctas}/${CASOS.length} decisiones</span>
          <span><b aria-hidden="true">📊</b> ${registro.preguntas_correctas}/${PREGUNTAS.length} preguntas</span>
        </div>
        <div class="res-envio" id="res-envio" role="status"><span class="spin" aria-hidden="true"></span> Enviando tus respuestas…</div>
        <div class="res-top" id="res-top" hidden></div>
      </div>
    </div>
    <div class="res-cierre">${CINTA_SVG}<p>${esc(TEXTOS.cierre)}</p></div>
    <div class="res-acciones">
      <button type="button" class="btn btn-primario btn-grande" id="btn-ranking" data-testid="btn-ranking"><span aria-hidden="true">🏆</span> Ver ranking</button>
      <button type="button" class="btn btn-secundario" id="btn-otra"><span aria-hidden="true">↻</span> Jugar otra vez</button>
    </div>
    <section class="res-repaso">
      <h2>Lo que acertaste y lo que no</h2>
      ${repasoHTML()}
    </section>
    <footer class="res-pie">
      <p><b>Nuestro artículo:</b> <i>${esc(ARTICULO.titulo)}</i>. ${esc(ARTICULO.autores)}. ${esc(ARTICULO.curso)}. ${esc(ARTICULO.docente)}.</p>
      <p>${esc(TEXTOS.datoMuestra)}</p>
      <p class="res-refs">Referencias citadas: ACOG (2018); Becker et al. (2022); De Corte et al. (2025); Itani et al. (2022); Shim (2024); Tomsett et al. (2025).</p>
    </footer>
  </section>`);
  const pantalla = $('#pantalla');
  pantalla.innerHTML = '';
  pantalla.append(el);
  window.scrollTo(0, 0);

  sonido.fanfarria();
  vibrar([60, 40, 60, 40, 120]);
  const tl = gsap.timeline();
  tl.from('.res-tutores img', { y: 120, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'back.out(1.4)' })
    .from('.res-caja > *', { y: 20, opacity: 0, stagger: 0.06, duration: 0.4 }, 0.2)
    .from('.res-cierre, .res-acciones, .rep-caso', { y: 24, opacity: 0, stagger: 0.08, duration: 0.4 }, 0.5);
  const c = { v: 0 };
  gsap.to(c, {
    v: partida.puntos,
    duration: 1.6,
    delay: 0.4,
    ease: 'power2.out',
    onUpdate: () => ($('#res-num').textContent = Math.round(c.v)),
  });

  $('#btn-ranking').addEventListener('click', () => abrirRanking());
  $('#btn-otra').addEventListener('click', () => location.reload());

  // Envío y verificación de top 3
  const estado = await enviarResultado(registro);
  const envio = $('#res-envio');
  if (estado === 'enviado') envio.innerHTML = '<b aria-hidden="true">✓</b> Respuestas enviadas. ¡Gracias!';
  else if (estado === 'sin-backend') envio.innerHTML = '<b aria-hidden="true">💾</b> Respuestas guardadas en este dispositivo.';
  else envio.innerHTML = '<b aria-hidden="true">💾</b> Sin conexión: guardamos tus respuestas y las enviaremos luego.';
  envio.classList.add(estado === 'enviado' ? 'ok' : 'local');
  if (estado === 'enviado') await dormir(2500);
  try {
    const datos = await obtenerTablero();
    const pos = datos.ranking.findIndex((x) => x.id === partida.id);
    if (pos >= 0 && pos < 3) {
      const top = $('#res-top');
      top.hidden = false;
      top.innerHTML = `<span aria-hidden="true">🎉</span> ¡Quedaste en el puesto ${pos + 1} del ranking${datos.origen === 'nube' ? '' : ' de este dispositivo'}!`;
      gsap.from(top, { scale: 0.6, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
      lanzarConfeti();
    }
  } catch {
    /* sin ranking */
  }
}

function lanzarConfeti() {
  if (movReducido) return;
  const colores = ['#8E1B35', '#F4A3B7', '#F2C42C', '#FFF7F2'];
  const fin = Date.now() + 1800;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: colores, zIndex: 300 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: colores, zIndex: 300 });
    if (Date.now() < fin) requestAnimationFrame(frame);
  })();
  sonido.fanfarria();
}

async function abrirRanking() {
  sonido.click();
  const capa = $('#capa-modal');
  const el = h(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-ranking" data-testid="modal-ranking">
    <div class="modal-caja">
      <div class="modal-cab"><h2 id="titulo-ranking"><span aria-hidden="true">🏆</span> Ranking del turno</h2>
      <button type="button" class="btn-icono modal-cerrar" aria-label="Cerrar ranking">✕</button></div>
      <div class="modal-cuerpo"><p class="cargando"><span class="spin" aria-hidden="true"></span> Cargando ranking…</p></div>
    </div>
  </div>`);
  capa.innerHTML = '';
  capa.append(el);
  gsap.from(el.querySelector('.modal-caja'), { y: 60, opacity: 0, duration: 0.35, ease: 'power3.out' });
  const cerrar = () => gsap.to(el, { opacity: 0, duration: 0.2, onComplete: () => el.remove() });
  el.querySelector('.modal-cerrar').addEventListener('click', cerrar);
  el.addEventListener('click', (e) => e.target === el && cerrar());
  el.querySelector('.modal-cerrar').focus();
  const datos = await obtenerTablero();
  const cuerpo = el.querySelector('.modal-cuerpo');
  const medallas = ['🥇', '🥈', '🥉'];
  cuerpo.innerHTML = `
    ${datos.origen !== 'nube' ? `<p class="aviso">${urlBackend() ? 'Sin conexión con el tablero: ' : ''}ranking de las partidas jugadas en este dispositivo.</p>` : `<p class="aviso">${datos.participantes} participantes en total.</p>`}
    <ol class="ranking">
      ${datos.ranking
        .map(
          (r, i) => `<li class="${r.id === partida.id ? 'yo' : ''}">
            <span class="rk-pos">${medallas[i] || i + 1}</span>
            <span class="rk-nombre">${esc(r.nombre)} <small>${esc(r.semestre)}</small>${r.id === partida.id ? ' <em>(tú)</em>' : ''}</span>
            <span class="rk-pts">${r.puntaje}</span>
          </li>`,
        )
        .join('') || '<li>Aún no hay partidas.</li>'}
    </ol>`;
  gsap.from(cuerpo.querySelectorAll('.ranking li'), { x: -20, opacity: 0, stagger: 0.05, duration: 0.3 });
}

// ---------------------------------------------------------------------
//  Precarga con pantalla de carga animada
// ---------------------------------------------------------------------
function cargarImagen(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = () => res();
    i.src = src;
  });
}

async function precargar() {
  const barra = $('#carga-barra');
  const pct = $('#carga-pct');
  const texto = $('#carga-texto');
  const mensajes = ['Preparando el consultorio…', 'Calibrando el monitor…', 'Llamando a las pacientes…', 'Revisando historias clínicas…'];
  let hechas = 0;
  const modo = decidirModo();
  const tareas = [];
  const sumar = (p) =>
    p.then((r) => {
      hechas++;
      const v = Math.round((hechas / tareas.length) * 100);
      barra.style.width = `${v}%`;
      pct.textContent = `${v} %`;
      texto.textContent = mensajes[Math.min(mensajes.length - 1, Math.floor((hechas / tareas.length) * mensajes.length))];
      return r;
    });
  const imagenes = ['assets/logo_udc.png', ...Object.values(TUTORES).flatMap((t) => [t.retrato, t.cuerpo])];
  imagenes.forEach((src) => tareas.push(sumar(cargarImagen(src))));
  const fuentes = ['800 32px "Baloo 2"', '600 32px "Baloo 2"', '400 16px Nunito', '700 16px Nunito', '800 16px Nunito'];
  tareas.push(sumar(Promise.all(fuentes.map((f) => document.fonts.load(f).catch(() => null)))));
  let modulo3d = null;
  if (modo === '3d') tareas.push(sumar(precargarModulo3D().then((m) => (modulo3d = m)).catch(() => null)));
  const minimo = new Promise((r) => setTimeout(r, 700));
  await Promise.race([Promise.all([...tareas, minimo]), new Promise((r) => setTimeout(r, 12000))]);
  return modulo3d;
}

async function arrancar() {
  reintentarPendientes();
  const modulo = await precargar();
  pantallaInicio();
  fondo = await iniciarFondo({
    canvas: $('#escena3d'),
    contenedor2d: $('#fondo2d'),
    modulo,
  });
  const cargador = $('#cargador');
  cargador.classList.add('oculto');
  setTimeout(() => cargador.remove(), 700);
}

arrancar();
