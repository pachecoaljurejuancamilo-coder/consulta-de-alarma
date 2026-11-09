import { createRoot } from 'react-dom/client';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './estilos.css';
import App from './App.jsx';
import { juego } from './estado/store.js';
import { G, PARAMS, ES_TACTIL } from './juego/mundo.js';
import { cargarFuentes } from './escena/texturasCanvas.js';
import { reintentarPendientes } from './api.js';

// Calidad inicial: se ajusta sola según los fps medidos
const calidad = PARAMS.calidad || (ES_TACTIL ? 'media' : 'alta');
G.calidad = calidad;
juego().set({ calidad });

// Estado mínimo para las pruebas automáticas (Playwright)
window.__codigoAlarma = () => ({ t: G.t, activo: G.activo, pos: G.jugador.pos.toArray(), pantalla: juego().pantalla, calidad: G.calidad, fps: G.fps, puntaje: juego().puntaje, resultado: juego().resultado?.registro || null });

// Reintenta enviar respuestas que quedaron pendientes en partidas anteriores
reintentarPendientes();

// Las texturas de letreros usan las tipografías: espera a que carguen (máximo 1,5 s)
Promise.race([cargarFuentes(), new Promise((r) => setTimeout(r, 1500))]).then(() => {
  createRoot(document.getElementById('raiz')).render(<App />);
});
