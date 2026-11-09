// Calcula las estadísticas del tablero a partir de las respuestas.
// La misma lógica está copiada en apps-script/Code.gs (función agregar).
// Se usa aquí cuando no hay backend (modo local).

export function agregar(filas) {
  const num = (v) => {
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const participantes = filas.length;

  const ranking = filas
    .map((f) => ({
      id: f.id,
      nombre: f.nombre || 'Anónimo',
      semestre: f.semestre || '',
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

  const preguntas = {};
  ['p1', 'p2', 'p3', 'p4'].forEach((p) => {
    const vals = filas.map((f) => num(f[p + '_ok'])).filter((v) => v !== null);
    preguntas[p] = vals.length ? (100 * vals.reduce((a, b) => a + b, 0)) / vals.length : null;
  });

  const conteoPalabras = {};
  filas.forEach((f) => {
    const p = String(f.op_palabra || '').trim();
    if (!p) return;
    const clave = p.toLowerCase();
    if (!conteoPalabras[clave]) conteoPalabras[clave] = { palabra: p.charAt(0).toUpperCase() + p.slice(1), n: 0 };
    conteoPalabras[clave].n++;
  });
  const palabras = Object.values(conteoPalabras)
    .sort((a, b) => b.n - a.n)
    .slice(0, 60);

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
    promedios: { entendiste: promedio('op_entendiste'), innovador: promedio('op_innovador') },
    distribucion: {
      entendiste: distribucion('op_entendiste', ['1', '2', '3', '4', '5']),
      innovador: distribucion('op_innovador', ['1', '2', '3', '4', '5']),
      reconocerias: distribucion('op_reconocerias', ['Sí', 'Tal vez', 'No']),
    },
    tarjetas: porcentajes('t_'),
    preguntas,
    palabras,
    porSemestre,
    actualizado: new Date().toISOString(),
  };
}
