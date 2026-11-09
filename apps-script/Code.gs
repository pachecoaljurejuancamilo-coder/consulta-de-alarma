/**
 * Backend del juego «Código Alarma 3D» (Google Apps Script + Google Sheets).
 *
 * - doPost: recibe el JSON de cada partida y agrega una fila a la hoja «Respuestas».
 * - doGet:  devuelve el top 10, los promedios de opinión y las estadísticas del tablero.
 *
 * Publicar: Implementar > Nueva implementación > Aplicación web
 *           Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario
 * Ver INSTRUCCIONES_BACKEND.md
 */

var NOMBRE_HOJA = 'Respuestas';

// Columnas en orden. Si el juego envía campos nuevos, se agregan al final automáticamente.
var COLUMNAS = [
  'fecha', 'id', 'version', 'nombre', 'semestre', 'avatar', 'puntaje', 'rango',
  'vida_final', 'bono_vida', 'mitos_destruidos',
  'orbes_correctos', 'orbes_incorrectos', 'orbes_alarma_recogidos', 'orbes_esperables_recogidos',
  'm1_destino', 'm1_ok', 'm2_destino', 'm2_ok', 'm3_destino', 'm3_ok', 'misiones_correctas',
  't_s_inicio', 't_s_dos_dias', 't_s_ibuprofeno', 't_s_examen', 't_s_mama',
  't_v_aine', 't_v_disquecia', 't_v_ausentismo', 't_v_no_ciclico', 't_v_menarquia',
  't_m_dispareunia', 't_m_urinario', 't_m_infertilidad', 't_m_ciclos',
  'p1', 'p1_ok', 'p2', 'p2_ok', 'p3', 'p3_ok', 'p4', 'p4_ok', 'preguntas_correctas',
  'op_entendiste', 'op_innovador', 'op_reconocerias',
  'tiempo_total_s', 'dispositivo', 'calidad', 'fecha_local'
];

function obtenerHoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) hoja = libro.insertSheet(NOMBRE_HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#FCE6EB');
  }
  return hoja;
}

// Evita que un texto se interprete como fórmula en la hoja.
function limpiar_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  var s = String(v).slice(0, 400);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var datos = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    datos.fecha = new Date();
    var hoja = obtenerHoja_();
    var encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

    // Evita duplicados si el celular reintenta el envío
    if (datos.id && hoja.getLastRow() > 1) {
      var colId = encabezados.indexOf('id') + 1;
      if (colId > 0) {
        var ids = hoja.getRange(2, colId, hoja.getLastRow() - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) {
          if (ids[i][0] === datos.id) return respuesta_({ ok: true, duplicado: true });
        }
      }
    }

    // Agrega columnas nuevas si llegan campos desconocidos
    Object.keys(datos).forEach(function (k) {
      if (encabezados.indexOf(k) === -1) {
        encabezados.push(k);
        hoja.getRange(1, encabezados.length).setValue(k).setFontWeight('bold').setBackground('#FCE6EB');
      }
    });
    var fila = encabezados.map(function (k) {
      return k === 'fecha' ? datos.fecha : limpiar_(datos[k]);
    });
    hoja.appendRow(fila);
    return respuesta_({ ok: true });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var hoja = obtenerHoja_();
  var valores = hoja.getDataRange().getValues();
  var encabezados = valores.shift() || [];
  var filas = valores.map(function (v) {
    var o = {};
    encabezados.forEach(function (k, i) { o[k] = v[i]; });
    return o;
  });
  var datos = agregar(filas);
  var callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(datos) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return respuesta_(datos);
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---- Misma lógica que src/agregar.js ----
function agregar(filas) {
  function num(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function suma(a, b) { return a + b; }
  var ranking = filas.map(function (f) {
    return { id: f.id, nombre: f.nombre || 'Anónimo', semestre: f.semestre || '', avatar: f.avatar || '', puntaje: num(f.puntaje) || 0, tiempo: num(f.tiempo_total_s) || 0 };
  }).sort(function (a, b) { return b.puntaje - a.puntaje || a.tiempo - b.tiempo; }).slice(0, 10);

  function promedio(clave) {
    var vals = filas.map(function (f) { return num(f[clave]); }).filter(function (v) { return v !== null && v > 0; });
    return vals.length ? vals.reduce(suma, 0) / vals.length : null;
  }
  function distribucion(clave, valores) {
    var d = {};
    valores.forEach(function (v) { d[v] = 0; });
    filas.forEach(function (f) { var v = String(f[clave] === undefined ? '' : f[clave]); if (v in d) d[v]++; });
    return d;
  }
  function porcentajes(prefijo) {
    var res = {};
    var claves = {};
    filas.forEach(function (f) { Object.keys(f).forEach(function (k) { if (k.indexOf(prefijo) === 0) claves[k] = true; }); });
    Object.keys(claves).forEach(function (k) {
      var vals = filas.map(function (f) { return num(f[k]); }).filter(function (v) { return v !== null; });
      res[k.slice(prefijo.length)] = vals.length ? 100 * vals.reduce(suma, 0) / vals.length : null;
    });
    return res;
  }
  function pctOk(clave) {
    var vals = filas.map(function (f) { return num(f[clave]); }).filter(function (v) { return v !== null; });
    return vals.length ? 100 * vals.reduce(suma, 0) / vals.length : null;
  }
  var preguntas = {};
  ['p1', 'p2', 'p3', 'p4'].forEach(function (p) { preguntas[p] = pctOk(p + '_ok'); });
  var misiones = {};
  ['m1', 'm2', 'm3'].forEach(function (m) { misiones[m] = pctOk(m + '_ok'); });
  var avatares = {};
  filas.forEach(function (f) { if (f.avatar) avatares[f.avatar] = (avatares[f.avatar] || 0) + 1; });
  var sem = {};
  filas.forEach(function (f) {
    var s = f.semestre || 'Otro';
    if (!sem[s]) sem[s] = { n: 0, suma: 0 };
    sem[s].n++;
    sem[s].suma += num(f.puntaje) || 0;
  });
  return {
    participantes: filas.length,
    ranking: ranking,
    promedios: { entendiste: promedio('op_entendiste'), innovador: promedio('op_innovador'), puntaje: promedio('puntaje') },
    distribucion: {
      entendiste: distribucion('op_entendiste', ['1', '2', '3', '4', '5']),
      innovador: distribucion('op_innovador', ['1', '2', '3', '4', '5']),
      reconocerias: distribucion('op_reconocerias', ['Sí', 'Tal vez', 'No'])
    },
    tarjetas: porcentajes('t_'),
    preguntas: preguntas,
    misiones: misiones,
    avatares: avatares,
    porSemestre: Object.keys(sem).map(function (s) { return { semestre: s, n: sem[s].n, promedio: sem[s].suma / sem[s].n }; }),
    actualizado: new Date().toISOString()
  };
}

// Prueba manual desde el editor: ejecuta esta función y revisa la hoja.
function probarEnvio() {
  doPost({ postData: { contents: JSON.stringify({ id: 'prueba-' + Date.now(), version: '3d', nombre: 'Prueba', semestre: 'Docente', avatar: 'Liz Olivieri', puntaje: 250, m1_ok: 1, op_entendiste: 5, op_reconocerias: 'Sí' }) } });
  Logger.log(JSON.stringify(agregar([]).participantes));
}
