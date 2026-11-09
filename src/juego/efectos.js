// Puente hacia los efectos visuales. Escena/Efectos.jsx reemplaza estas funciones al montarse.
// Así cualquier módulo puede pedir un efecto sin depender de React.
export const FX = {
  rayo: () => {}, // (desde: Vector3, hasta: Vector3, {color, grosor, vida})
  estallido: () => {}, // (pos, {color, cantidad, velocidad, vida, tam, gravedad})
  onda: () => {}, // (pos, {color, radio, vida})
  numero: () => {}, // (pos, texto, color)
  flash: () => {}, // (color, intensidad)
  estela: () => {}, // (pos, color)
};
