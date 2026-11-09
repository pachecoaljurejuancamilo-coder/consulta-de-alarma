// Teclado y mouse (computador). Los controles táctiles están en hud/Controles.jsx.
import { G } from './mundo.js';

const E = G.entrada;
let canvas = null;

function actualizarEjes() {
  const t = E.teclas;
  const x = (t.has('KeyD') || t.has('ArrowRight') ? 1 : 0) - (t.has('KeyA') || t.has('ArrowLeft') ? 1 : 0);
  const y = (t.has('KeyW') || t.has('ArrowUp') ? 1 : 0) - (t.has('KeyS') || t.has('ArrowDown') ? 1 : 0);
  const j = E.joystick;
  const jm = Math.hypot(j.x, j.y);
  if (x || y) {
    const l = Math.hypot(x, y);
    E.mx = x / l;
    E.my = y / l;
  } else if (jm > 0.08) {
    E.mx = j.x;
    E.my = j.y;
  } else {
    E.mx = 0;
    E.my = 0;
  }
}
E.actualizarEjes = actualizarEjes;

function enCampoTexto(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
}

function teclaAbajo(e) {
  if (enCampoTexto(e)) return;
  if (!G.activo) return;
  E.teclas.add(e.code);
  if (e.code === 'Space') {
    E.saltar = true;
    e.preventDefault();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') E.dash = true;
  if (e.code === 'KeyE' || e.code === 'Enter') E.interactuar = true;
  if (e.code === 'KeyF' || e.code === 'KeyJ') {
    E.disparar = true;
    E.mantenerDisparo = true;
  }
  if (e.code.startsWith('Arrow')) e.preventDefault();
  actualizarEjes();
}
function teclaArriba(e) {
  E.teclas.delete(e.code);
  if (e.code === 'KeyF' || e.code === 'KeyJ') E.mantenerDisparo = false;
  actualizarEjes();
}

function mouseAbajo(e) {
  if (!G.activo || E.tactil) return;
  if (e.target !== canvas) return;
  if (document.pointerLockElement !== canvas) {
    try {
      const p = canvas.requestPointerLock?.();
      if (p && p.catch) p.catch(() => {});
    } catch {
      /* sin bloqueo de puntero: se usa arrastre */
    }
  }
  if (e.button === 0) {
    E.disparar = true;
    E.mantenerDisparo = true;
  }
  if (e.button === 2) E.arrastrando = true;
}
function mouseArriba(e) {
  if (e.button === 0) E.mantenerDisparo = false;
  if (e.button === 2) E.arrastrando = false;
}
function mouseMueve(e) {
  if (!G.activo || E.tactil) return;
  if (document.pointerLockElement === canvas || E.arrastrando) {
    E.lookDx += e.movementX || 0;
    E.lookDy += e.movementY || 0;
  }
}

export function instalarEntrada(elCanvas) {
  canvas = elCanvas;
  window.addEventListener('keydown', teclaAbajo);
  window.addEventListener('keyup', teclaArriba);
  window.addEventListener('mousedown', mouseAbajo);
  window.addEventListener('mouseup', mouseArriba);
  window.addEventListener('mousemove', mouseMueve);
  window.addEventListener('blur', () => {
    E.teclas.clear();
    E.mantenerDisparo = false;
    actualizarEjes();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return () => {
    window.removeEventListener('keydown', teclaAbajo);
    window.removeEventListener('keyup', teclaArriba);
    window.removeEventListener('mousedown', mouseAbajo);
    window.removeEventListener('mouseup', mouseArriba);
    window.removeEventListener('mousemove', mouseMueve);
  };
}

export function soltarPuntero() {
  if (document.pointerLockElement) document.exitPointerLock?.();
}

// Consume los botones de un solo toque al final de cada frame
export function consumirEntrada() {
  E.saltar = false;
  E.dash = false;
  E.disparar = false;
  E.interactuar = false;
  E.lookDx = 0;
  E.lookDy = 0;
}
