// Tablero en vivo para proyectar al final del taller (se actualiza cada 5 s).
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './tablero.css';
import { CASOS, PREGUNTAS, OPINION, ARTICULO } from './data/contenido.js';
import { obtenerTablero, urlBackend } from './api.js';
import { agregar } from './agregar.js';
import { CINTA_SVG } from './avatar.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (v) => (v === null || v === undefined ? '–' : `${v.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`);
const dec = (v) => (v === null || v === undefined ? '–' : v.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 }));
const demo = new URLSearchParams(location.search).has('demo');

// Signos de alarma (tarjetas tipo «alarma») con su dato del estudio
const SIGNOS = CASOS.flatMap((c) =>
  c.hallazgos.filter((h) => h.tipo === 'alarma').map((h) => ({ id: h.id, texto: h.texto.replace(/\s*\(.*\)\s*$/, ''), estudio: h.estudio ?? null })),
);
const PREGUNTAS_CORTAS = {
  p1: 'Signo menos reconocido',
  p2: 'Nivel alto en VIII semestre',
  p3: 'Tiempo hasta el diagnóstico',
  p4: 'Promedio de VIII semestre',
};

$('#tablero').innerHTML = `
  <header class="tb-cab">
    <div class="tb-marca">${CINTA_SVG}<div><h1>Consulta de Alarma</h1><p>Resultados en vivo del taller</p></div></div>
    <div class="tb-estado"><span class="tb-vivo" aria-hidden="true"></span><span id="tb-actualizado">Conectando…</span></div>
    <div class="tb-participantes"><span id="tb-n" data-testid="participantes">0</span><small>participantes</small></div>
  </header>
  <p class="tb-aviso" id="tb-aviso" hidden></p>
  <main class="tb-grid">
    <section class="tb-panel tb-ranking">
      <h2><span aria-hidden="true">🏆</span> Ranking</h2>
      <ol id="tb-ranking" class="tb-lista"></ol>
    </section>
    <section class="tb-panel tb-signos">
      <h2><span aria-hidden="true">⚠</span> ¿Reconocieron los signos de alarma?</h2>
      <div class="tb-leyenda"><span><i class="ley-barra"></i> Taller de hoy</span><span><i class="ley-marca"></i> Nuestro estudio (${esc(ARTICULO.cita)})</span></div>
      <div id="tb-signos" class="tb-barras"></div>
      <h3>Acierto en «Lo que encontramos»</h3>
      <div id="tb-preguntas" class="tb-barras tb-barras-sm"></div>
      <details class="tb-tabla"><summary>Ver como tabla</summary><div id="tb-tabla"></div></details>
    </section>
    <section class="tb-panel tb-opinion">
      <h2><span aria-hidden="true">💬</span> Su opinión</h2>
      <div class="tb-tiles">
        <div class="tb-tile"><span class="tb-tile-etq">¿Entendieron el artículo?</span><span class="tb-tile-val"><b id="tb-entendiste">–</b><small>/ 5</small></span><div class="tb-dist" id="tb-dist-entendiste"></div></div>
        <div class="tb-tile"><span class="tb-tile-etq">¿Es innovador?</span><span class="tb-tile-val"><b id="tb-innovador">–</b><small>/ 5</small></span><div class="tb-dist" id="tb-dist-innovador"></div></div>
      </div>
      <h3>¿Reconocerían una endometriosis en consulta?</h3>
      <div id="tb-reconocerias" class="tb-apilada"></div>
      <div id="tb-reconocerias-ley" class="tb-leyenda"></div>
      <h3>En una palabra, ¿qué se llevan?</h3>
      <div id="tb-nube" class="tb-nube" data-testid="nube"></div>
    </section>
  </main>
  <footer class="tb-pie">${esc(ARTICULO.autores)} · ${esc(ARTICULO.curso)} · ${esc(ARTICULO.docente)}</footer>
`;

// ---------- Tooltip ----------
const tip = $('#tooltip');
document.addEventListener('pointermove', (e) => {
  const t = e.target.closest('[data-tip]');
  if (!t) {
    tip.hidden = true;
    return;
  }
  tip.textContent = t.dataset.tip;
  tip.hidden = false;
  const x = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 14);
  tip.style.left = `${Math.max(8, x)}px`;
  tip.style.top = `${e.clientY + 16}px`;
});

// ---------- Render ----------
function barraHTML({ id, etiqueta, valor, estudio, tip }) {
  const v = valor ?? 0;
  return `<div class="tb-fila" data-id="${id}" data-tip="${esc(tip)}">
    <span class="tb-fila-etq">${esc(etiqueta)}</span>
    <span class="tb-pista">
      <i class="tb-relleno" style="width:${v}%"></i>
      ${estudio !== null && estudio !== undefined ? `<i class="tb-ref" style="left:${estudio}%" aria-hidden="true"></i>` : ''}
    </span>
    <span class="tb-fila-val">${pct(valor)}</span>
  </div>`;
}

function pintar(d) {
  $('#tb-n').textContent = d.participantes;
  const medallas = ['🥇', '🥈', '🥉'];
  $('#tb-ranking').innerHTML =
    d.ranking
      .map(
        (r, i) => `<li class="${i < 3 ? 'top' : ''}">
          <span class="rk-pos">${medallas[i] || i + 1}</span>
          <span class="rk-nom">${esc(r.nombre)} <small>${esc(r.semestre)}</small></span>
          <span class="rk-pts">${r.puntaje}</span></li>`,
      )
      .join('') || '<li class="vacio">Esperando las primeras partidas…</li>';

  const signos = SIGNOS.map((s) => ({ ...s, valor: d.tarjetas?.[s.id] ?? null })).sort((a, b) => (a.valor ?? 101) - (b.valor ?? 101));
  $('#tb-signos').innerHTML = signos
    .map((s) =>
      barraHTML({
        id: s.id,
        etiqueta: s.texto,
        valor: s.valor,
        estudio: s.estudio,
        tip: `${s.texto}: ${pct(s.valor)} hoy${s.estudio !== null ? ` · estudio: ${pct(s.estudio)}` : ''}`,
      }),
    )
    .join('');
  $('#tb-preguntas').innerHTML = PREGUNTAS.map((p) =>
    barraHTML({ id: p.id, etiqueta: PREGUNTAS_CORTAS[p.id] || p.id, valor: d.preguntas?.[p.id] ?? null, tip: `${p.pregunta} · acierto: ${pct(d.preguntas?.[p.id])}` }),
  ).join('');
  $('#tb-tabla').innerHTML = `<table><thead><tr><th>Signo de alarma</th><th>Taller</th><th>Estudio</th></tr></thead><tbody>${signos
    .map((s) => `<tr><td>${esc(s.texto)}</td><td>${pct(s.valor)}</td><td>${pct(s.estudio)}</td></tr>`)
    .join('')}</tbody></table>`;

  $('#tb-entendiste').textContent = dec(d.promedios?.entendiste);
  $('#tb-innovador').textContent = dec(d.promedios?.innovador);
  ['entendiste', 'innovador'].forEach((k) => {
    const dist = d.distribucion?.[k] || {};
    const max = Math.max(1, ...Object.values(dist));
    $(`#tb-dist-${k}`).innerHTML = OPINION[k].opciones
      .map((o) => {
        const n = dist[String(o.valor)] || 0;
        return `<span class="tb-col" data-tip="${esc(o.etiqueta)} (${o.valor}): ${n} ${n === 1 ? 'persona' : 'personas'}">
          <i style="height:${(n / max) * 100}%"></i><b aria-hidden="true">${o.emoji}</b><small>${n}</small></span>`;
      })
      .join('');
  });

  const rec = d.distribucion?.reconocerias || {};
  const totalRec = Object.values(rec).reduce((a, b) => a + b, 0);
  const clasesRec = { Sí: 'si', 'Tal vez': 'talvez', No: 'no' };
  $('#tb-reconocerias').innerHTML = totalRec
    ? OPINION.reconocerias.opciones
        .map((o) => {
          const n = rec[o.valor] || 0;
          const p = (100 * n) / totalRec;
          return p > 0
            ? `<span class="seg-${clasesRec[o.valor]}" style="width:${p}%" data-tip="${o.etiqueta}: ${n} (${pct(p)})">${p >= 12 ? `${o.emoji} ${Math.round(p)} %` : ''}</span>`
            : '';
        })
        .join('')
    : '<span class="seg-vacio">Sin respuestas aún</span>';
  $('#tb-reconocerias-ley').innerHTML = OPINION.reconocerias.opciones
    .map((o) => `<span><i class="ley-${clasesRec[o.valor]}"></i> ${o.emoji} ${o.etiqueta}: <b>${rec[o.valor] || 0}</b></span>`)
    .join('');

  const max = Math.max(1, ...d.palabras.map((p) => p.n));
  $('#tb-nube').innerHTML =
    d.palabras
      .map((p, i) => {
        const tam = 0.95 + (p.n / max) * 1.9;
        return `<span class="pal pal-${i % 4}" style="font-size:${tam.toFixed(2)}rem" data-tip="${esc(p.palabra)}: ${p.n}">${esc(p.palabra)}</span>`;
      })
      .join('') || '<span class="vacio">Las palabras aparecerán aquí</span>';

  const hora = new Date(d.actualizado || Date.now()).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('#tb-actualizado').textContent = `En vivo · ${hora}`;
  const aviso = $('#tb-aviso');
  if (demo) {
    aviso.hidden = false;
    aviso.textContent = 'DATOS DE DEMOSTRACIÓN (quita «?demo» de la dirección para ver los reales).';
  } else if (d.origen !== 'nube') {
    aviso.hidden = false;
    aviso.textContent = urlBackend()
      ? 'No se pudo conectar con Google Sheets: mostrando solo las partidas de este dispositivo. Reintentando…'
      : 'Falta configurar APPS_SCRIPT_URL en config.js: mostrando solo las partidas de este dispositivo.';
  } else aviso.hidden = true;
}

// Datos de demostración para ensayar la proyección
function datosDemo() {
  const nombres = ['Caro', 'Andrés', 'Vale', 'Dr. Pérez', 'Majo', 'Sebas', 'Laura', 'Nico', 'Dani', 'Profe Karen', 'Sofi', 'Juanjo', 'Isa', 'Mafe'];
  const sem = ['II', 'VI', 'VIII', 'Otro', 'Docente'];
  const palabras = ['Disquecia', 'No es normal', 'Remitir', 'Ausentismo', 'Sospechar', 'Disquecia', 'No es normal', 'Empatía', 'Remitir'];
  const filas = nombres.map((n, i) => {
    const f = { id: 'demo' + i, nombre: n, semestre: sem[i % 5], puntaje: 120 + ((i * 37) % 230), tiempo_total_s: 120 + i * 3 };
    CASOS.forEach((c) => c.hallazgos.forEach((h) => (f['t_' + h.id] = Math.random() < (h.estudio ? h.estudio / 100 + 0.15 : 0.7) ? 1 : 0)));
    PREGUNTAS.forEach((p, k) => (f[p.id + '_ok'] = Math.random() < 0.4 + k * 0.1 ? 1 : 0));
    f.op_entendiste = 3 + (i % 3);
    f.op_innovador = 4 + (i % 2);
    f.op_reconocerias = ['Sí', 'Sí', 'Tal vez', 'Sí', 'No'][i % 5];
    f.op_palabra = palabras[i % palabras.length];
    return f;
  });
  return { ...agregar(filas), origen: 'nube' };
}

async function actualizar() {
  try {
    pintar(demo ? datosDemo() : await obtenerTablero());
  } catch (e) {
    $('#tb-actualizado').textContent = 'Sin conexión · reintentando…';
  }
}
actualizar();
setInterval(actualizar, 5000);
