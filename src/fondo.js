// Elige el fondo de la portada: escena 3D o, si el equipo es lento, fondo 2D animado.

function soportaWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function decidirModo() {
  const forzado = new URLSearchParams(location.search).get('modo');
  if (forzado === '2d' || forzado === '3d') return forzado;
  if (!soportaWebGL()) return '2d';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return '2d';
  const memoria = navigator.deviceMemory;
  const nucleos = navigator.hardwareConcurrency;
  if ((memoria && memoria <= 2) || (nucleos && nucleos <= 2)) return '2d';
  return '3d';
}

// Precarga el módulo 3D (Three.js) en paralelo con la pantalla de carga.
export function precargarModulo3D() {
  return import('./escena3d.js');
}

export function activarFondo2D(contenedor) {
  contenedor.classList.add('fondo2d-activo');
  document.body.dataset.fondo = '2d';
}

export async function iniciarFondo({ canvas, contenedor2d, modulo, onLatido }) {
  const modo = decidirModo();
  if (modo === '2d' || !modulo) {
    activarFondo2D(contenedor2d);
    return null;
  }
  try {
    const { crearEscena3D } = modulo;
    let escena = null;
    escena = crearEscena3D(canvas, {
      onLatido,
      onLento: () => {
        // Cambio automático a 2D si el celular no da más de ~28 cuadros por segundo
        if (new URLSearchParams(location.search).get('modo') === '3d') return;
        escena?.destruir();
        canvas.style.opacity = '0';
        activarFondo2D(contenedor2d);
        escena = null;
      },
    });
    document.body.dataset.fondo = '3d';
    canvas.classList.add('visible');
    return {
      destruir: () => escena?.destruir(),
      pausar: () => escena?.pausar(),
      reanudar: () => escena?.reanudar(),
    };
  } catch (e) {
    console.warn('Sin 3D, usando fondo 2D', e);
    activarFondo2D(contenedor2d);
    return null;
  }
}
