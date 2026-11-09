// Minimapa circular que gira con la cámara, con marcadores y flecha hacia el objetivo.
import { useEffect, useRef } from 'react';
import { G } from '../juego/mundo.js';
import { D } from '../juego/director.js';
import { construirMuros, AZOTEA, PASARELA } from '../juego/mapa.js';

const MUROS = construirMuros().filter((m) => m.sy > 1);
const COLOR = { mision: '#F2C42C', farmacia: '#3fbf7f', ginecologia: '#f4a3b7' };

export default function Minimapa({ tam }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = tam * dpr;
    c.height = tam * dpr;
    let vivo = true;
    let ultimo = 0;
    const R = tam / 2;
    const dibujar = (ms) => {
      if (!vivo) return;
      requestAnimationFrame(dibujar);
      if (ms - ultimo < 50) return;
      ultimo = ms;
      const j = G.jugador.pos;
      const cy = G.camara.yaw;
      const fx = Math.sin(cy);
      const fz = Math.cos(cy);
      const rx = -Math.cos(cy);
      const rz = Math.sin(cy);
      const escala = (R / 34) * (D.fase === 'jefe' ? 1.6 : 1);
      const aPantalla = (x, z) => {
        const dx = x - j.x;
        const dz = z - j.z;
        return [R + (dx * rx + dz * rz) * escala, R - (dx * fx + dz * fz) * escala];
      };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, tam, tam);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(26, 10, 18, 0.72)';
      ctx.fillRect(0, 0, tam, tam);
      if (D.fase === 'jefe') {
        const [ax, ay] = aPantalla(AZOTEA.x, AZOTEA.z);
        ctx.fillStyle = 'rgba(255,247,242,0.16)';
        ctx.beginPath();
        ctx.arc(ax, ay, AZOTEA.radio * escala, 0, Math.PI * 2);
        ctx.fill();
        if (D.jefe && D.jefe.estado !== 'muerto') punto(ctx, ...aPantalla(D.jefe.pos.x, D.jefe.pos.z), 7, '#ff2a55');
        for (const cr of D.cristales) if (cr.vivo) punto(ctx, ...aPantalla(cr.pos.x, cr.pos.z), 4, '#b9a5ff');
        for (const p of D.proyectiles) if (p.vivo) punto(ctx, ...aPantalla(p.pos.x, p.pos.z), 2.5, '#ff6b81');
      } else if (D.fase === 'salida') {
        ctx.fillStyle = 'rgba(255,247,242,0.16)';
        const pts = [aPantalla(PASARELA.x0, -7), aPantalla(PASARELA.xFin, -7), aPantalla(PASARELA.xFin, 7), aPantalla(PASARELA.x0, 7)];
        poligono(ctx, pts);
        for (const f of D.filas) {
          const a = aPantalla(f.x, -6);
          const b = aPantalla(f.x, 6);
          ctx.strokeStyle = '#F2C42C';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(...a);
          ctx.lineTo(...b);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(255,247,242,0.55)';
        for (const m of MUROS) {
          const hx = m.sx / 2;
          const hz = m.sz / 2;
          poligono(ctx, [aPantalla(m.x - hx, m.z - hz), aPantalla(m.x + hx, m.z - hz), aPantalla(m.x + hx, m.z + hz), aPantalla(m.x - hx, m.z + hz)]);
        }
        for (const o of D.orbes) if (o.vivo) punto(ctx, ...aPantalla(o.pos.x, o.pos.z), 2.5, '#9fe8ff');
        for (const mi of D.mitos) if (mi.vivo && mi.aparecido) punto(ctx, ...aPantalla(mi.pos.x, mi.pos.z), 3.5, '#c9a0ff');
      }
      // Marcadores (con flecha en el borde si están lejos)
      for (const mk of G.marcadores) {
        let [x, y] = aPantalla(mk.x, mk.z);
        const dx = x - R;
        const dy = y - R;
        const d = Math.hypot(dx, dy);
        const color = COLOR[mk.tipo] || '#F2C42C';
        if (d > R - 9) {
          const ang = Math.atan2(dy, dx);
          x = R + Math.cos(ang) * (R - 9);
          y = R + Math.sin(ang) * (R - 9);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ang);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-5, -6);
          ctx.lineTo(-5, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          punto(ctx, x, y, 6, color);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();
      // Jugador (flecha según su orientación respecto a la cámara)
      const rel = G.jugador.yaw - cy;
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(-rel);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#8e1b35';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Borde
      ctx.strokeStyle = '#F2C42C';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(R, R, R - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#F2C42C';
      ctx.font = '800 11px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', R - Math.sin(cy) * (R - 10), R + Math.cos(cy) * (R - 10) + 4);
    };
    requestAnimationFrame(dibujar);
    return () => {
      vivo = false;
    };
  }, [tam]);
  return <canvas ref={ref} className="minimapa" style={{ width: tam, height: tam }} aria-label="Minimapa" />;
}

function punto(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function poligono(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  ctx.closePath();
  ctx.fill();
}
