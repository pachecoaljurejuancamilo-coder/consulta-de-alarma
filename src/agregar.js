// Calcula las estadísticas del tablero a partir de las respuestas.
// La misma lógica está copiada en apps-script/Code.gs (función agregar).
// Se usa aquí cuando no hay backend (modo local).

export function agregar(filas) {
  const num = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const participantes = filas.length;

  const ranking = filas
    .map((f) => ({
      id: f.id,
      nombre: f.nombre || 'Anónimo',
      semestre: f.semestre || '',
      avatar: f.avatar || '',
      puntaje: num(f.puntaje) || 0,
      tiempo: num(f.tiempo_total_s) || 0,
    }))
    .sort((a, b) => b.puntaje - a.puntaje || a.tiempo - b.tiempo)
    .slice(0, 10);

  const promedio = (clave) => {
    const vals = filas.map((f) => num(f[clave])).filter((v) => v !== null && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const distribucion = (clave, valores) => {
    const d = {};
    valores.forEach((v) => (d[v] = 0));
    filas.forEach((f) => {
      const v = String(f[clave] ?? '');
      if (v in d) d[v]++;
    });
    return d;
  };

  const porcentajes = (prefijo) => {
    const res = {};
    const claves = new Set();
    filas.forEach((f) => Object.keys(f).forEach((k) => k.startsWith(prefijo) && claves.add(k)));
    claves.forEach((k) => {
      const vals = filas.map((f) => num(f[k])).filter((v) => v !== null);
      res[k.slice(prefijo.length)] = vals.length ? (100 * vals.reduce((a, b) => a + b, 0)) / vals.length : null;
    });
    return res;
  };

  const pctOk = (clave) => {
    const vals = filas.map((f) => num(f[clave])).filter((v) => v !== null);
    return vals.length ? (100 * vals.reduce((a, b) => a + b, 0)) / vals.length : null;
  };
  const preguntas = {};
  ['p1', 'p2', 'p3', 'p4'].forEach((p) => (preguntas[p] = pctOk(p + '_ok')));
  const misiones = {};
  ['m1', 'm2', 'm3'].forEach((m) => (misiones[m] = pctOk(m + '_ok')));

  const avatares = {};
  filas.forEach((f) => {
    if (!f.avatar) return;
    avatares[f.avatar] = (avatares[f.avatar] || 0) + 1;
  });

  const semestres = {};
  filas.forEach((f) => {
    const s = f.semestre || 'Otro';
    if (!semestres[s]) semestres[s] = { n: 0, suma: 0 };
    semestres[s].n++;
    semestres[s].suma += num(f.puntaje) || 0;
  });
  const porSemestre = Object.entries(semestres).map(([s, v]) => ({ semestre: s, n: v.n, promedio: v.suma / v.n }));

  return {
    participantes,
    ranking,
    promedios: { entendiste: promedio('op_entendiste'), innovador: promedio('op_innovador'), puntaje: promedio('puntaje') },
    distribucion: {
      entendiste: distribucion('op_entendiste', ['1', '2', '3', '4', '5']),
      innovador: distribucion('op_innovador', ['1', '2', '3', '4', '5']),
      reconocerias: distribucion('op_reconocerias', ['Sí', 'Tal vez', 'No']),
    },
    tarjetas: porcentajes('t_'),
    preguntas,
    misiones,
    avatares,
    porSemestre,
    actualizado: new Date().toISOString(),
  };
}
