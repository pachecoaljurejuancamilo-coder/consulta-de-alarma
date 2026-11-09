// =====================================================================
//  CONTENIDO DEL JUEGO «Código Alarma 3D»
//  Aquí están las pacientes, los orbes de síntomas, los mitos, las
//  preguntas del jefe, la encuesta y los textos. Puedes editarlos sin
//  tocar el resto del código. Usa coma decimal (34,9 %) en los textos.
//  Después de editar: npm run build (o haz push a GitHub y se publica solo).
// =====================================================================

export const ARTICULO = {
  titulo:
    'El análisis comparativo del conocimiento sobre los signos de alarma que diferencian la endometriosis de la dismenorrea en estudiantes de II, VI y VIII semestre de Medicina de la Universidad de Cartagena, periodo 2026-2',
  autores: 'Gino Petro Petro, Juan Camilo Pacheco Aljure y Liz Olivieri Jiménez',
  cita: 'Petro Petro et al., 2026',
  curso: 'Producción y Comprensión Textual II · Universidad de Cartagena',
  docente: 'Docente: Karen Ortega',
};

// Tiempos en segundos (suman exactamente 180 s = 3:00).
// Cada fase tiene una ventana fija: si el jugador termina antes, el tiempo
// sobrante se usa para leer la explicación y llegar al siguiente objetivo.
export const TIEMPOS = {
  porMision: 35, // 3 misiones = 1:45
  jefe: 45, // 0:45
  salida: 30, // 0:30
  total: 180,
  cinematica: 3, // presentación de la paciente (se puede saltar)
  anamnesisMax: 20, // recoger orbes y destruir mitos
  reservaDecision: 11, // segundos mínimos que quedan para correr al destino
  llegadaMax: 8, // si no llega al consultorio en este tiempo, el juego lo lleva
  jefeIntro: 2.5,
  porPregunta: 9.5, // 4 preguntas
  salidaIntro: 1.2,
};

export const PUNTAJE = {
  orbeCorrecto: 10,
  orbeIncorrecto: -10,
  mito: 5,
  destino: 40,
  pregunta: 30,
  bonoVida: 0.5, // puntos por cada punto de vida que quede al final
  sinCredibilidad: -20, // si la barra de vida llega a 0 (Liz te respalda y sigues)
};

export const RANGOS = [
  { min: 280, nombre: 'Especialista en alarma', icono: '🏅', texto: 'Reconoces los signos de alarma como una especialista.' },
  { min: 160, nombre: 'Residente atento', icono: '🩺', texto: 'Vas muy bien: repasa los signos que se te escaparon.' },
  { min: -999, nombre: 'Interno curioso', icono: '📚', texto: 'Buen comienzo: los signos de alarma se aprenden practicando.' },
];

export const SEMESTRES = ['II', 'VI', 'VIII', 'Otro', 'Docente'];

// Avatares jugables. modelo: 'mujer', 'barba' u 'corto'. Los colores visten el cuerpo 3D.
export const AVATARES = [
  {
    id: 'liz',
    nombre: 'Liz Olivieri',
    corto: 'Liz',
    foto: 'assets/liz.webp',
    retrato: 'assets/liz_retrato.webp',
    modelo: 'mujer',
    piel: '#e2b48f',
    pelo: '#2a1a10',
  },
  {
    id: 'gino',
    nombre: 'Gino Petro',
    corto: 'Gino',
    foto: 'assets/gino.webp',
    retrato: 'assets/gino_retrato.webp',
    modelo: 'barba',
    piel: '#b9876a',
    pelo: '#121010',
  },
  {
    id: 'juan',
    nombre: 'Juan Camilo Pacheco',
    corto: 'Juan Camilo',
    foto: 'assets/juan_camilo.webp',
    retrato: 'assets/juan_camilo_retrato.webp',
    modelo: 'corto',
    piel: '#d9ab8a',
    pelo: '#141110',
    gafas: true,
  },
];

// Tutores por «radio»: Liz guía las misiones, Juan Camilo el jefe y Gino la salida.
export const TUTORES = {
  liz: { nombre: 'Liz', retrato: 'assets/liz_retrato.webp' },
  juan: { nombre: 'Juan Camilo', retrato: 'assets/juan_camilo_retrato.webp' },
  gino: { nombre: 'Gino', retrato: 'assets/gino_retrato.webp' },
};

export const DESTINOS = {
  farmacia: {
    id: 'farmacia',
    sala: 'FARMACIA',
    titulo: 'Dismenorrea primaria',
    detalle: 'AINE o anticonceptivos',
    color: '#3fbf7f',
  },
  ginecologia: {
    id: 'ginecologia',
    sala: 'GINECOLOGÍA',
    titulo: 'Sospecha de endometriosis',
    detalle: 'Remitir',
    color: '#f4a3b7',
  },
};

// ---------------------------------------------------------------------
//  FASE 1 · PACIENTES FICTICIAS
//  tipo: 'alarma' (signo de alarma) o 'esperable'
//  estudio: % de estudiantes que reconoció ese signo en nuestro artículo
//  Fuentes: Becker et al., 2022; Shim, 2024; ACOG, 2018
// ---------------------------------------------------------------------
export const PACIENTES = [
  {
    id: 'sofia',
    nombre: 'Sofía',
    edad: 16,
    ocupacion: 'Estudiante de colegio',
    consultorio: 1, // 0, 1 o 2 (consultorios 1, 2 y 3 de oeste a este)
    correcto: 'farmacia',
    modelo: 'npc_mujer_b',
    ropa: { Shirt: '#f4f4f0', Pants: '#2b3a67', Shoes: '#1f1f22' },
    piel: '#e8b796',
    pelo: '#3b2418',
    frase: '«Me dan cólicos con la regla, pero con ibuprofeno se me pasan.»',
    orbes: [
      { id: 's_inicio', texto: 'Cólico que inicia con la regla', tipo: 'esperable', explicacion: 'Típico de la dismenorrea primaria: empieza con el sangrado (ACOG, 2018).' },
      { id: 's_dos_dias', texto: 'Dolor solo los dos primeros días', tipo: 'esperable', explicacion: 'En la dismenorrea primaria el dolor suele durar de 1 a 3 días (ACOG, 2018).' },
      { id: 's_ibuprofeno', texto: 'Mejora con ibuprofeno', tipo: 'esperable', explicacion: 'La buena respuesta a los AINE orienta a dismenorrea primaria (ACOG, 2018).' },
      { id: 's_examen', texto: 'Examen físico normal', tipo: 'esperable', explicacion: 'Un examen físico normal es lo esperable en la dismenorrea primaria.' },
      { id: 's_mama', texto: 'Su mamá también tenía cólicos', tipo: 'esperable', explicacion: 'No es un signo de alarma: el dolor menstrual afecta al 50-90 % de las adolescentes (Itani et al., 2022).' },
    ],
    mitos: ['normal', 'aguanta', 'pasara'],
    bien: '¡Bien! Sin signos de alarma: es una dismenorrea primaria. No todo dolor menstrual es endometriosis.',
    mal: 'Sofía no tenía signos de alarma: su dolor es típico y cede con ibuprofeno. No todo dolor menstrual es endometriosis.',
  },
  {
    id: 'valentina',
    nombre: 'Valentina',
    edad: 19,
    ocupacion: 'Universitaria',
    consultorio: 0,
    correcto: 'ginecologia',
    modelo: 'npc_mujer_a',
    ropa: { Shirt: '#8e1b35', Pants: '#3d5a80', Shoes: '#f0f0f0', Socks: '#f0f0f0' },
    piel: '#c68b63',
    pelo: '#1f130d',
    frase: '«Ni las pastillas me sirven… y he faltado a clases por el dolor.»',
    orbes: [
      { id: 'v_aine', texto: 'No mejora con AINE ni anticonceptivos', tipo: 'alarma', estudio: 71.6, explicacion: 'Dolor que no cede a AINE ni a anticonceptivos: signo de alarma (Becker et al., 2022). Lo reconoció el 71,6 %.' },
      { id: 'v_disquecia', texto: 'Dolor al defecar en la regla (disquecia)', tipo: 'alarma', estudio: 34.9, explicacion: 'Solo el 34,9 % reconoció la disquecia; el 50,5 % la atribuyó a un trastorno digestivo o urinario.' },
      { id: 'v_ausentismo', texto: 'Falta a clases por el dolor (ausentismo)', tipo: 'alarma', estudio: 39.4, explicacion: 'Solo el 39,4 % reconoció el ausentismo y el 43,1 % lo consideró normal.' },
      { id: 'v_no_ciclico', texto: 'Dolor pélvico fuera de la regla', tipo: 'alarma', explicacion: 'El dolor pélvico fuera de la menstruación orienta a endometriosis (Becker et al., 2022; Shim, 2024).' },
      { id: 'v_menarquia', texto: 'Primera regla a los 12 años', tipo: 'esperable', explicacion: 'Una menarquia a los 12 años está dentro de lo normal.' },
    ],
    mitos: ['colitis', 'pastilla', 'aguanta'],
    bien: '¡Remisión correcta! Valentina tenía cuatro signos de alarma. La disquecia solo la reconoció el 34,9 %.',
    mal: 'Valentina tenía cuatro signos de alarma: había que remitirla a Ginecología. La disquecia solo la reconoció el 34,9 %.',
  },
  {
    id: 'mariana',
    nombre: 'Mariana',
    edad: 24,
    ocupacion: 'Enfermera',
    consultorio: 2,
    correcto: 'ginecologia',
    modelo: 'npc_mujer_c',
    ropa: { Dress: '#3e9c8f', Shoes: '#f4f4f4' },
    piel: '#f1c7a8',
    pelo: '#6b3a1e',
    frase: '«Llevamos más de un año buscando un bebé… y me duele mucho.»',
    orbes: [
      { id: 'm_dispareunia', texto: 'Dolor profundo en las relaciones (dispareunia)', tipo: 'alarma', estudio: 58.7, explicacion: 'La dispareunia profunda es un signo de alarma (Becker et al., 2022). La reconoció el 58,7 %.' },
      { id: 'm_urinario', texto: 'Dolor al orinar o sangre en la orina en la regla', tipo: 'alarma', estudio: 33.0, explicacion: 'Fue el signo MENOS reconocido del estudio: solo el 33,0 %.' },
      { id: 'm_infertilidad', texto: 'Dolor pélvico y dificultad para embarazarse', tipo: 'alarma', estudio: 67.9, explicacion: 'El dolor pélvico con infertilidad es un signo de alarma (Shim, 2024). Lo reconoció el 67,9 %.' },
      { id: 'm_ciclos', texto: 'Ciclos regulares de 28 días', tipo: 'esperable', explicacion: 'Un ciclo regular de 28 días es normal.' },
    ],
    mitos: ['urinaria', 'normal', 'pasara'],
    bien: '¡Exacto! El dolor al orinar o la hematuria con la regla fue el signo menos reconocido: solo el 33,0 %.',
    mal: 'Mariana tenía tres signos de alarma: había que remitirla. El dolor al orinar o la hematuria solo lo reconoció el 33,0 %.',
  },
];

// ---------------------------------------------------------------------
//  MITOS: enemigos fantasmales. Al destruirlos aparece un dato real.
// ---------------------------------------------------------------------
export const MITOS = {
  normal: { frase: 'Es normal que duela', dato: 'El dolor menstrual afecta al 50-90 % de las adolescentes (Itani et al., 2022), pero el dolor que incapacita no es normal.' },
  aguanta: { frase: 'Aguanta, es la regla', dato: 'El 22,9 % de las adolescentes falta a clases o al trabajo por el dolor (Tomsett et al., 2025). El 43,1 % del estudio lo consideró normal.' },
  colitis: { frase: 'Eso es colitis', dato: 'Disquecia: solo el 34,9 % la reconoció y el 50,5 % la atribuyó a un trastorno digestivo o urinario.' },
  pastilla: { frase: 'Tómate otra pastilla', dato: 'El dolor que no cede a AINE ni a anticonceptivos es un signo de alarma (Becker et al., 2022): lo reconoció el 71,6 %.' },
  pasara: { frase: 'Ya se te pasará', dato: 'El diagnóstico puede tardar entre 0,3 y 12 años (De Corte et al., 2025). Solo el 33,9 % lo sabía.' },
  urinaria: { frase: 'Es solo una infección urinaria', dato: 'Dolor al orinar o hematuria en la regla: el signo menos reconocido del estudio (33,0 %).' },
};

// ---------------------------------------------------------------------
//  FASE 2 · JEFE FINAL «El Retraso Diagnóstico»
//  Datos reales del artículo: NO cambiar las cifras.
//  La primera opción de cada lista es la correcta (en el juego se barajan).
// ---------------------------------------------------------------------
export const PREGUNTAS = [
  {
    id: 'p1',
    corta: 'Signo menos reconocido',
    pregunta: '¿Qué signo de alarma reconocieron MENOS los estudiantes?',
    opciones: ['Dolor al orinar o hematuria (33,0 %)', 'Dolor que no cede a AINE (71,6 %)', 'Dolor con infertilidad (67,9 %)', 'Dispareunia (58,7 %)'],
    explicacion: 'El menos reconocido fue el dolor al orinar o la hematuria: solo el 33,0 %.',
  },
  {
    id: 'p2',
    corta: 'Nivel alto en VIII semestre',
    pregunta: '¿Qué porcentaje de VIII semestre alcanzó nivel ALTO de conocimiento?',
    opciones: ['60,6 %', '18,2 %', '25,0 %', '90 %'],
    explicacion: 'VIII semestre: 60,6 %. En II fue el 18,2 % y en VI, el 25,0 %.',
  },
  {
    id: 'p3',
    corta: 'Tiempo hasta el diagnóstico',
    pregunta: '¿Cuánto puede tardar el diagnóstico de la endometriosis?',
    opciones: ['Entre 0,3 y 12 años', 'Menos de un mes', 'De uno a seis meses', 'Alrededor de un año'],
    explicacion: 'Puede tardar entre 0,3 y 12 años (De Corte et al., 2025). Solo el 33,9 % lo sabía.',
  },
  {
    id: 'p4',
    corta: 'Puntaje de VIII semestre',
    pregunta: 'El puntaje promedio subió de 7,8 en II semestre a ___ en VIII (sobre 16).',
    opciones: ['12,2', '9,7', '9,9', '15,0'],
    explicacion: 'Subió de 7,8 en II semestre a 12,2 en VIII (sobre 16).',
  },
];

// ---------------------------------------------------------------------
//  FASE 3 · SALIDA: encuesta corriendo por arcos
// ---------------------------------------------------------------------
export const ENCUESTA = [
  {
    id: 'op_entendiste',
    pregunta: '¿Qué tanto entendiste nuestro artículo?',
    opciones: [
      { valor: 1, texto: '1 · Nada' },
      { valor: 2, texto: '2 · Poco' },
      { valor: 3, texto: '3 · Algo' },
      { valor: 4, texto: '4 · Bien' },
      { valor: 5, texto: '5 · Todo' },
    ],
  },
  {
    id: 'op_innovador',
    pregunta: '¿Te parece innovador este proyecto?',
    opciones: [
      { valor: 1, texto: '1 · Nada' },
      { valor: 2, texto: '2 · Poco' },
      { valor: 3, texto: '3 · Algo' },
      { valor: 4, texto: '4 · Mucho' },
      { valor: 5, texto: '5 · Total' },
    ],
  },
  {
    id: 'op_reconocerias',
    pregunta: '¿Ahora reconocerías una endometriosis en consulta?',
    opciones: [
      { valor: 'Sí', texto: 'Sí' },
      { valor: 'Tal vez', texto: 'Tal vez' },
      { valor: 'No', texto: 'No' },
    ],
  },
];

// Datos del artículo para la pantalla de carga y las tarjetas.
export const DATOS = [
  'Encuestamos a 109 estudiantes de Medicina (II: 44; VI: 32; VIII: 33) de 117 respuestas.',
  'Predominó el nivel medio de conocimiento (51,4 %).',
  'El nivel alto pasó del 18,2 % en II semestre al 25,0 % en VI y al 60,6 % en VIII.',
  'Solo el 34,9 % reconoció la disquecia; el 50,5 % la atribuyó a un trastorno digestivo o urinario.',
  'Solo el 39,4 % reconoció el ausentismo como signo de alarma; el 43,1 % lo consideró normal.',
  'El 22,9 % de las adolescentes falta a clases o al trabajo por el dolor (Tomsett et al., 2025).',
  'El dolor menstrual afecta entre el 50 % y el 90 % de las adolescentes (Itani et al., 2022).',
  'Solo el 33,9 % sabía que el diagnóstico puede tardar varios años.',
  'El signo menos reconocido fue el dolor al orinar o la hematuria en la regla: 33,0 %.',
];

export const TEXTOS = {
  titulo: 'Código Alarma 3D',
  subtitulo: '¿Dolor normal o endometriosis?',
  hospital: 'Hospital Universitario Buganvilia',
  lema: 'El dolor menstrual intenso no siempre es normal',
  radio: {
    inicio: '¡Bienvenido al turno! Corre a la columna de luz amarilla: tu primera paciente te espera.',
    anamnesis: 'Recoge SOLO los signos de alarma y destruye los Mitos con el Rayo de evidencia.',
    anamnesisSofia: 'Ojo: recoge SOLO signos de alarma. Si no hay ninguno, no recojas nada.',
    decision: '¿Dismenorrea primaria o sospecha de endometriosis? Corre a Farmacia o a Ginecología.',
    siguiente: 'Siguiente paciente: sigue la columna amarilla.',
    azotea: '¡A la azotea! Algo oscuro nos espera…',
    jefe: '¡El Retraso Diagnóstico! Destruye con el rayo el cristal de la respuesta correcta. Salta las ondas y usa el dash.',
    salida: '¡Último tramo! Pasa por el arco de tu respuesta: muévete a la izquierda o a la derecha para elegir.',
    final: 'El dolor menstrual intenso no siempre es normal. ¡Sospéchala a tiempo!',
    sinVida: 'Te respaldo: recuperas credibilidad. ¡Sigue!',
  },
};
