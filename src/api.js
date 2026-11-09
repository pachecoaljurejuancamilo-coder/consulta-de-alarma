// Envío de respuestas a Google Apps Script + cola sin conexión en localStorage.
import { agregar } from './agregar.js';

const CLAVE_PENDIENTES = 'cda_pendientes';
const CLAVE_HISTORIAL = 'cda_historial';

export function urlBackend() {
  const url = (window.CONFIG_JUEGO && window.CONFIG_JUEGO.APPS_SCRIPT_URL) || '';
  return String(url).trim();
}

function leer(clave) {
  try {
    const v = JSON.parse(localStorage.getItem(clave) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

let enviando = false;

// Intenta enviar todo lo que esté en cola. Devuelve 'enviado' | 'pendiente' | 'sin-backend'.
export async function reintentarPendientes() {
  const url = urlBackend();
  if (!url) return 'sin-backend';
  if (enviando) return 'pendiente';
  let cola = leer(CLAVE_PENDIENTES);
  if (!cola.length) return 'enviado';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'pendiente';
  enviando = true;
  try {
    while (cola.length) {
      const registro = cola[0];
      // no-cors: Apps Script no devuelve cabeceras CORS en POST; la respuesta es opaca.
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(registro),
        keepalive: true,
      });
      cola = leer(CLAVE_PENDIENTES).filter((r) => r.id !== registro.id);
      guardar(CLAVE_PENDIENTES, cola);
    }
    return 'enviado';
  } catch {
    return 'pendiente';
  } finally {
    enviando = false;
  }
}

export async function enviarResultado(registro) {
  const historial = leer(CLAVE_HISTORIAL);
  historial.push(registro);
  guardar(CLAVE_HISTORIAL, historial.slice(-200));
  const cola = leer(CLAVE_PENDIENTES);
  cola.push(registro);
  guardar(CLAVE_PENDIENTES, cola);
  return reintentarPendientes();
}

export function pendientes() {
  return leer(CLAVE_PENDIENTES).length;
}

function jsonp(url, ms = 8000) {
  return new Promise((resolve, reject) => {
    const nombre = 'cda_cb_' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const limpiar = () => {
      delete window[nombre];
      s.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      limpiar();
      reject(new Error('tiempo'));
    }, ms);
    window[nombre] = (datos) => {
      limpiar();
      resolve(datos);
    };
    s.onerror = () => {
      limpiar();
      reject(new Error('jsonp'));
    };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + nombre;
    document.head.appendChild(s);
  });
}

// Estadísticas para el ranking y el tablero. Si no hay backend, usa los datos de este dispositivo.
export async function obtenerTablero() {
  const url = urlBackend();
  if (url) {
    const u = url + (url.includes('?') ? '&' : '?') + 'accion=tablero&t=' + Date.now();
    try {
      const r = await fetch(u, { redirect: 'follow' });
      if (!r.ok) throw new Error('http ' + r.status);
      const datos = await r.json();
      return { ...datos, origen: 'nube' };
    } catch {
      try {
        const datos = await jsonp(u);
        return { ...datos, origen: 'nube' };
      } catch {
        /* cae al modo local */
      }
    }
  }
  return { ...agregar(leer(CLAVE_HISTORIAL)), origen: url ? 'local-sin-red' : 'local' };
}

// Reintentos automáticos
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => reintentarPendientes());
  setInterval(() => {
    if (pendientes()) reintentarPendientes();
  }, 30000);
}
