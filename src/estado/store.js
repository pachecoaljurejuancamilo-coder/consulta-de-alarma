// Estado de la interfaz (React). Solo cosas que cambian pocas veces por segundo.
import { create } from 'zustand';

let idAviso = 0;

export const useJuego = create((set, get) => ({
  pantalla: 'seleccion', // 'seleccion' | 'cuenta' | 'juego' | 'resultados'
  mundoListo: false,
  progreso: 0,
  intentoEmpezar: false,
  partida: 0, // se incrementa en cada partida (para reiniciar componentes)

  perfil: { nombre: '', semestre: '', avatar: 'liz' },
  calidad: 'alta',
  silencio: false,

  // HUD
  segundos: 0,
  fase: 'mision', // 'mision' | 'jefe' | 'salida' | 'fin'
  mision: 0,
  etapa: 'marcador',
  titulo: '',
  objetivo: '',
  cuentaObjetivo: null, // segundos restantes de la etapa
  vida: 100,
  puntaje: 0,
  radio: null, // {tutor, texto, id}
  avisos: [], // [{id, texto, tipo}]
  tarjeta: null, // {titulo, texto, tipo, id}
  cine: null, // {nombre, edad, ocupacion, frase}
  jefe: null, // {vida: 0..1, nombre}
  pregunta: null, // {texto, n, total}
  fila: null, // {texto, n, total}
  interaccion: null, // texto del botón Interactuar
  fundido: false,

  // Entidades de la misión actual (para montar/desmontar componentes)
  orbes: [], // [{id, texto, tipo, x, y, z}]
  mitos: [], // [{id, clave, frase, x, z, retraso}]
  destinosActivos: false,
  cristales: [], // [{id, texto, correcta, x, y, z}]
  filas: [], // filas de arcos de la salida

  resultado: null, // registro final + extras para la pantalla

  set: (p) => set(p),
  aviso: (texto, tipo = 'info', ms = 1600) => {
    const id = ++idAviso;
    set((s) => ({ avisos: [...s.avisos.slice(-2), { id, texto, tipo }] }));
    setTimeout(() => set((s) => ({ avisos: s.avisos.filter((a) => a.id !== id) })), ms);
  },
  hablar: (tutor, texto, ms = 6500) => {
    const id = ++idAviso;
    set({ radio: { tutor, texto, id } });
    setTimeout(() => {
      if (get().radio?.id === id) set({ radio: null });
    }, ms);
  },
  mostrarTarjeta: (titulo, texto, tipo = 'dato', ms = 4200) => {
    const id = ++idAviso;
    set({ tarjeta: { titulo, texto, tipo, id } });
    setTimeout(() => {
      if (get().tarjeta?.id === id) set({ tarjeta: null });
    }, ms);
  },
  sumar: (puntos) => set((s) => ({ puntaje: s.puntaje + puntos })),
}));

export const juego = () => useJuego.getState();
