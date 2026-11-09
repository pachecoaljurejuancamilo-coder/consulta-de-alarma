// Texturas dibujadas con canvas: letreros, pantalla de ECG, escudo dorado, relojes rotos.
import { CanvasTexture, SRGBColorSpace } from 'three';

const cache = new Map();

export const FUENTE_TITULO = '"Baloo 2", "Nunito", system-ui, sans-serif';
export const FUENTE_TEXTO = '"Nunito", system-ui, sans-serif';

export async function cargarFuentes() {
  try {
    await Promise.all([document.fonts.load(`800 64px "Baloo 2"`), document.fonts.load(`800 32px "Nunito"`), document.fonts.load(`700 32px "Nunito"`)]);
  } catch {
    /* se usa la fuente del sistema */
  }
}

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function textura(c) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function ajustarTexto(ctx, texto, maxAncho, tam, peso = 800, familia = FUENTE_TITULO) {
  let t = tam;
  do {
    ctx.font = `${peso} ${t}px ${familia}`;
    if (ctx.measureText(texto).width <= maxAncho) break;
    t -= 2;
  } while (t > 10);
  return t;
}

function partirLineas(ctx, texto, maxAncho) {
  const palabras = texto.split(' ');
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (ctx.measureText(prueba).width > maxAncho && actual) {
      lineas.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// Letrero rectangular con fondo y texto centrado (una o varias líneas)
export function texturaLetrero(texto, { ancho = 1024, alto = 256, fondo = '#8e1b35', color = '#fff7f2', borde = null, tam = 120, icono = null, radio = 28, sub = null } = {}) {
  const clave = JSON.stringify(['l', texto, ancho, alto, fondo, color, borde, tam, icono, sub]);
  if (cache.has(clave)) return cache.get(clave);
  const [c, ctx] = lienzo(ancho, alto);
  if (fondo) {
    ctx.fillStyle = fondo;
    ctx.beginPath();
    ctx.roundRect(4, 4, ancho - 8, alto - 8, radio);
    ctx.fill();
  }
  if (borde) {
    ctx.strokeStyle = borde;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(8, 8, ancho - 16, alto - 16, radio);
    ctx.stroke();
  }
  let x0 = 0;
  if (icono === 'cruz') {
    const s = alto * 0.5;
    const cx = alto * 0.55;
    const cy = alto / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - s * 0.17, cy - s / 2, s * 0.34, s);
    ctx.fillRect(cx - s / 2, cy - s * 0.17, s, s * 0.34);
    x0 = alto * 0.55;
  }
  if (icono === 'cinta') {
    dibujarCinta(ctx, alto * 0.55, alto / 2, alto * 0.62);
    x0 = alto * 0.5;
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const util = ancho - 60 - x0;
  if (sub) {
    const t1 = ajustarTexto(ctx, texto, util, tam);
    ctx.font = `800 ${t1}px ${FUENTE_TITULO}`;
    ctx.fillText(texto, ancho / 2 + x0 / 2, alto * 0.4);
    const t2 = ajustarTexto(ctx, sub, util, tam * 0.45, 700, FUENTE_TEXTO);
    ctx.font = `700 ${t2}px ${FUENTE_TEXTO}`;
    ctx.globalAlpha = 0.92;
    ctx.fillText(sub, ancho / 2 + x0 / 2, alto * 0.76);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = `800 ${tam}px ${FUENTE_TITULO}`;
    const lineas = partirLineas(ctx, texto, util);
    if (lineas.length === 1) {
      const t = ajustarTexto(ctx, texto, util, tam);
      ctx.font = `800 ${t}px ${FUENTE_TITULO}`;
      ctx.fillText(texto, ancho / 2 + x0 / 2, alto / 2 + t * 0.06);
    } else {
      let t = tam * 0.8;
      ctx.font = `800 ${t}px ${FUENTE_TITULO}`;
      let ls = partirLineas(ctx, texto, util);
      while (ls.length * t * 1.05 > alto - 30 && t > 12) {
        t -= 3;
        ctx.font = `800 ${t}px ${FUENTE_TITULO}`;
        ls = partirLineas(ctx, texto, util);
      }
      ls.forEach((l, i) => ctx.fillText(l, ancho / 2 + x0 / 2, alto / 2 + (i - (ls.length - 1) / 2) * t * 1.05 + t * 0.06));
    }
  }
  const tex = textura(c);
  cache.set(clave, tex);
  return tex;
}

// Cinta de concientización (amarilla)
export function dibujarCinta(ctx, cx, cy, h) {
  const s = h / 96;
  ctx.save();
  ctx.translate(cx - 32 * s, cy - 48 * s);
  ctx.scale(s, s);
  const p = new Path2D('M32 6C14 6 12 30 24 46L6 86l12 4 14-32 14 32 12-4-18-40C52 30 50 6 32 6Zm0 12c8 0 9 12 0 22-9-10-8-22 0-22Z');
  ctx.fillStyle = '#F2C42C';
  ctx.strokeStyle = '#B8901A';
  ctx.lineWidth = 3;
  ctx.fill(p);
  ctx.stroke(p);
  ctx.restore();
}

// Escudo dorado del uniforme
export function texturaEscudo() {
  if (cache.has('escudo')) return cache.get('escudo');
  const [c, ctx] = lienzo(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#ffe58a');
  g.addColorStop(0.5, '#e9b730');
  g.addColorStop(1, '#a87a12');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a5608';
  ctx.lineWidth = 6;
  // Escudo
  ctx.beginPath();
  ctx.moveTo(128, 20);
  ctx.lineTo(210, 48);
  ctx.quadraticCurveTo(210, 170, 128, 236);
  ctx.quadraticCurveTo(46, 170, 46, 48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Laureles
  ctx.strokeStyle = '#fff3c0';
  ctx.lineWidth = 7;
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(128, 120, 62, lado < 0 ? Math.PI * 0.6 : Math.PI * 0.4, lado < 0 ? Math.PI * 1.25 : -Math.PI * 0.25, lado > 0);
    ctx.stroke();
  }
  // Báculo
  ctx.fillStyle = '#fff6d6';
  ctx.fillRect(122, 70, 12, 110);
  ctx.beginPath();
  ctx.arc(128, 70, 14, 0, Math.PI * 2);
  ctx.fill();
  const tex = textura(c);
  cache.set('escudo', tex);
  return tex;
}

// Reloj roto para el jefe
export function texturaReloj(variante = 0) {
  const clave = 'reloj' + variante;
  if (cache.has(clave)) return cache.get(clave);
  const [c, ctx] = lienzo(256, 256);
  ctx.fillStyle = '#efe4cf';
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a1724';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = '#3a1724';
  ctx.font = `800 30px ${FUENTE_TITULO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 1; h <= 12; h++) {
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(h), 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  const a1 = variante * 1.3 + 0.4;
  const a2 = variante * 2.1 + 2.2;
  ctx.beginPath();
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(a1) * 55, 128 + Math.sin(a1) * 55);
  ctx.moveTo(128, 128);
  ctx.lineTo(128 + Math.cos(a2) * 80, 128 + Math.sin(a2) * 80);
  ctx.stroke();
  // Grietas
  ctx.strokeStyle = '#1d0b12';
  ctx.lineWidth = 4;
  ctx.beginPath();
  let x = 40 + variante * 20;
  let y = 60;
  ctx.moveTo(x, y);
  for (let k = 0; k < 6; k++) {
    x += 22 + ((k * 37 + variante * 11) % 17);
    y += ((k * 53 + variante * 7) % 40) - 8;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  const tex = textura(c);
  cache.set(clave, tex);
  return tex;
}

// Texto brillante «12 AÑOS» del pecho del jefe
export function texturaDoceAnios() {
  if (cache.has('doce')) return cache.get('doce');
  const [c, ctx] = lienzo(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 150px ${FUENTE_TITULO}`;
  ctx.shadowColor = '#ff2a55';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffd1db';
  ctx.fillText('12', 256, 100);
  ctx.font = `800 70px ${FUENTE_TITULO}`;
  ctx.fillText('AÑOS', 256, 200);
  const tex = textura(c);
  cache.set('doce', tex);
  return tex;
}

// Pantalla con ECG animado (una sola textura compartida por todos los televisores)
let ecg = null;
export function texturaECG() {
  if (ecg) return ecg;
  const [c, ctx] = lienzo(256, 128);
  const tex = textura(c);
  let x = 0;
  let fase = 0;
  let ultimoY = 64;
  ctx.fillStyle = '#04140f';
  ctx.fillRect(0, 0, 256, 128);
  function latido(f) {
    // Onda P-QRS-T simplificada (f en 0..1)
    if (f < 0.1) return Math.sin((f / 0.1) * Math.PI) * 6;
    if (f < 0.18) return 0;
    if (f < 0.2) return -8;
    if (f < 0.23) return 46;
    if (f < 0.26) return -16;
    if (f < 0.38) return 0;
    if (f < 0.52) return Math.sin(((f - 0.38) / 0.14) * Math.PI) * 10;
    return 0;
  }
  const avanzar = (pasos) => {
    for (let k = 0; k < pasos; k++) {
      ctx.fillStyle = '#04140f';
      ctx.fillRect(x, 0, 14, 128);
      fase = (fase + 0.012) % 1;
      const y = 76 - latido(fase);
      ctx.strokeStyle = '#3dff9a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 2, ultimoY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ultimoY = y;
      x = (x + 2) % 256;
    }
    ctx.fillStyle = '#3dff9a';
    ctx.font = `800 20px ${FUENTE_TEXTO}`;
    ctx.fillStyle = '#04140f';
    ctx.fillRect(186, 4, 66, 26);
    ctx.fillStyle = '#3dff9a';
    ctx.fillText('FC 78', 190, 24);
    tex.needsUpdate = true;
  };
  ecg = { tex, avanzar };
  return ecg;
}

// Placa del helipuerto
export function texturaHelipuerto() {
  if (cache.has('heli')) return cache.get('heli');
  const [c, ctx] = lienzo(512, 512);
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = '#F2C42C';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff7f2';
  ctx.font = `800 300px ${FUENTE_TITULO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 256, 280);
  const tex = textura(c);
  cache.set('heli', tex);
  return tex;
}
