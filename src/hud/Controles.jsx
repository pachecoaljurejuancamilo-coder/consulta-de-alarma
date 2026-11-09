// Controles táctiles: joystick (nipplejs), arrastre para la cámara y botones de acción.
import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import { G } from '../juego/mundo.js';
import { useJuego } from '../estado/store.js';

const E = G.entrada;

export default function Controles() {
  const zonaJoy = useRef();
  const zonaCam = useRef();
  const interaccion = useJuego((s) => s.interaccion);
  const fase = useJuego((s) => s.fase);

  useEffect(() => {
    const zona = zonaJoy.current;
    let joy = null;
    try {
      joy = nipplejs.create({ zone: zona, mode: 'static', position: { left: '50%', top: '50%' }, color: '#F2C42C', size: 112, restOpacity: 0.55, fadeTime: 120 });
      const mover = (evt, data) => {
        const d = data || evt?.data;
        if (!d || !d.vector) return;
        const fuerza = Math.min(1, (d.distance || 0) / 56);
        E.joystick.x = d.vector.x * fuerza;
        E.joystick.y = d.vector.y * fuerza;
        E.actualizarEjes?.();
      };
      const soltar = () => {
        E.joystick.x = 0;
        E.joystick.y = 0;
        E.actualizarEjes?.();
      };
      joy.on('move', mover);
      joy.on('end', soltar);
    } catch {
      /* sin joystick */
    }
    return () => {
      try {
        joy?.destroy();
      } catch {
        /* nada */
      }
      E.joystick.x = E.joystick.y = 0;
    };
  }, []);

  // Arrastrar con el dedo a la derecha para girar la cámara (varios dedos a la vez)
  useEffect(() => {
    const el = zonaCam.current;
    const toques = new Map();
    const inicio = (e) => {
      for (const t of e.changedTouches) toques.set(t.identifier, { x: t.clientX, y: t.clientY });
    };
    const mover = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const p = toques.get(t.identifier);
        if (!p) continue;
        E.lookDx += (t.clientX - p.x) * 1.0;
        E.lookDy += (t.clientY - p.y) * 1.0;
        p.x = t.clientX;
        p.y = t.clientY;
      }
    };
    const fin = (e) => {
      for (const t of e.changedTouches) toques.delete(t.identifier);
    };
    el.addEventListener('touchstart', inicio, { passive: true });
    el.addEventListener('touchmove', mover, { passive: false });
    el.addEventListener('touchend', fin);
    el.addEventListener('touchcancel', fin);
    return () => {
      el.removeEventListener('touchstart', inicio);
      el.removeEventListener('touchmove', mover);
      el.removeEventListener('touchend', fin);
      el.removeEventListener('touchcancel', fin);
    };
  }, []);

  // Eventos de puntero: un solo evento por toque (sin clics duplicados)
  const boton = (accion, mantener = false) => {
    const soltar = (e) => {
      if (accion === 'disparar') E.mantenerDisparo = false;
      e.currentTarget.classList.remove('activo');
    };
    return {
      onPointerDown: (e) => {
        e.stopPropagation();
        if (accion === 'disparar') {
          E.disparar = true;
          if (mantener) E.mantenerDisparo = true;
        } else E[accion] = true;
        e.currentTarget.classList.add('activo');
      },
      onPointerUp: soltar,
      onPointerCancel: soltar,
      onPointerLeave: soltar,
      onContextMenu: (e) => e.preventDefault(),
    };
  };

  const carrera = fase === 'salida';
  return (
    <div className="controles">
      <div className="zona-camara" ref={zonaCam} />
      <div className="zona-joystick" ref={zonaJoy} />
      <div className="botones">
        {!carrera && (
          <button className="btn-accion btn-rayo" {...boton('disparar', true)} aria-label="Rayo de evidencia">
            <span className="icono">⚡</span>
            <span>Rayo</span>
          </button>
        )}
        <button className="btn-accion btn-saltar" {...boton('saltar')} aria-label="Saltar">
          <span className="icono">⤒</span>
          <span>Saltar</span>
        </button>
        <button className="btn-accion btn-dash" {...boton('dash')} aria-label="Dash">
          <span className="icono">»</span>
          <span>Dash</span>
        </button>
        {interaccion && (
          <button className="btn-accion btn-interactuar" {...boton('interactuar')} aria-label={interaccion}>
            <span className="icono">✋</span>
            <span>{interaccion}</span>
          </button>
        )}
      </div>
    </div>
  );
}
