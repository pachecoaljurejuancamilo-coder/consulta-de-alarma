// =====================================================================
//  CONTENIDO DEL JUEGO «Consulta de Alarma»
//  Aquí están todos los casos, preguntas y textos. Puedes editarlos sin
//  tocar el resto del código. Usa coma decimal (34,9 %) en los textos.
//  Después de editar: npm run build (o haz push a GitHub y se publica solo).
// =====================================================================

export const ARTICULO = {
  titulo:
    'Análisis comparativo del conocimiento sobre los signos de alarma que diferencian la endometriosis de la dismenorrea en estudiantes de II, VI y VIII semestre de Medicina de la Universidad de Cartagena, periodo 2026-2',
  autores: 'Gino Petro Petro, Juan Camilo Pacheco Aljure y Liz Olivieri Jiménez',
  cita: 'Petro Petro et al., 2026',
  curso: 'Producción y Comprensión Textual II · Programa de Medicina · Universidad de Cartagena',
  docente: 'Docente: Karen Ortega',
};

// Tiempos en segundos. Suman exactamente 180 s (3:00).
export const TIEMPOS = {
  porPaciente: 35, // 3 pacientes = 105 s (1:45)
  globoCaso: 2, // globo del tutor después de cada decisión (dentro de los 35 s)
  etapaHallazgos: 45, // 4 preguntas = 45 s (11,25 s cada una)
  globoPregunta: 1.75,
  etapaOpinion: 30,
  total: 180,
};

export const PUNTAJE = {
  tarjeta: 10, // por tarjeta bien clasificada
  decision: 30, // por decisión clínica correcta
  rapidezMax: 15, // bonificación por rapidez (solo si la decisión es correcta)
  pregunta: 20, // por pregunta correcta en «Lo que encontramos»
};

export const RANGOS = [
  { min: 250, nombre: 'Especialista en alarma', icono: '🏅', texto: 'Reconoces los signos de alarma como un especialista.' },
  { min: 150, nombre: 'Residente atento', icono: '🩺', texto: 'Vas muy bien: repasa los signos que se te escaparon.' },
  { min: 0, nombre: 'Interno curioso', icono: '📚', texto: 'Buen comienzo: los signos de alarma se aprenden practicando.' },
];

export const SEMESTRES = [
  { id: 'II', etiqueta: 'II' },
  { id: 'VI', etiqueta: 'VI' },
  { id: 'VIII', etiqueta: 'VIII' },
  { id: 'Otro', etiqueta: 'Otro' },
  { id: 'Docente', etiqueta: 'Docente' },
];

export const TUTORES = {
  liz: {
    nombre: 'Liz Olivieri',
    rol: 'Tutora · Etapa 1',
    cuerpo: 'assets/liz.webp',
    retrato: 'assets/liz_retrato.webp',
  },
  juan: {
    nombre: 'Juan Camilo Pacheco',
    rol: 'Tutor · Etapa 2',
    cuerpo: 'assets/juan_camilo.webp',
    retrato: 'assets/juan_camilo_retrato.webp',
  },
  gino: {
    nombre: 'Gino Petro',
    rol: 'Tutor · Etapa 3',
    cuerpo: 'assets/gino.webp',
    retrato: 'assets/gino_retrato.webp',
  },
};

export const DECISIONES = {
  dismenorrea: {
    id: 'dismenorrea',
    titulo: 'Dismenorrea primaria',
    detalle: 'Manejo con AINE o anticonceptivos',
    icono: '💊',
  },
  remitir: {
    id: 'remitir',
    titulo: 'Sospecha de endometriosis',
    detalle: 'Remitir a ginecología',
    icono: '🚩',
  },
};

// ---------------------------------------------------------------------
//  ETAPA 1 · CONSULTA (tres pacientes ficticias)
//  tipo: 'alarma' (signo de alarma) o 'esperable'
//  Fuentes de los signos de alarma: Becker et al., 2022; Shim, 2024; ACOG, 2018
// ---------------------------------------------------------------------
export const CASOS = [
  {
    id: 'sofia',
    nombre: 'Sofía',
    apellido: 'Martínez R.',
    edad: 16,
    ocupacion: 'Estudiante de colegio',
    codigo: 'HU-26-04817',
    motivo: 'Cólico menstrual desde hace un año.',
    antecedentes: 'Menarquia a los 11 años. Sin cirugías. No planifica. Madre con cólicos menstruales.',
    avatar: { piel: '#E8B796', pelo: '#3B2418', peinado: 'cola', ropa: '#5B8DB8' },
    vitales: { fc: 78, pas: 108, pad: 68, temp: 36.6, spo2: 99, fr: 16 },
    mensajes: [
      'Doctor, me dan cólicos con la regla.',
      'Me empiezan el primer día y con un ibuprofeno se me calman.',
      'Vine porque a mi mamá también le daban y me preocupa.',
    ],
    correcta: 'dismenorrea',
    hallazgos: [
      {
        id: 's_inicio',
        texto: 'El cólico inicia con la regla o pocas horas antes',
        tipo: 'esperable',
        explicacion: 'Es típico de la dismenorrea primaria: el dolor empieza con el sangrado o unas horas antes (ACOG, 2018).',
      },
      {
        id: 's_dos_dias',
        texto: 'El dolor dura solo los dos primeros días',
        tipo: 'esperable',
        explicacion: 'En la dismenorrea primaria el dolor suele durar de 1 a 3 días (ACOG, 2018).',
      },
      {
        id: 's_ibuprofeno',
        texto: 'Dolor leve que mejora con ibuprofeno',
        tipo: 'esperable',
        explicacion: 'La buena respuesta a los AINE orienta a dismenorrea primaria (ACOG, 2018).',
      },
      {
        id: 's_examen',
        texto: 'Examen físico normal',
        tipo: 'esperable',
        explicacion: 'Un examen físico normal es lo esperable en la dismenorrea primaria (ACOG, 2018).',
      },
      {
        id: 's_mama',
        texto: 'Le preocupa porque su mamá también tenía cólicos',
        tipo: 'esperable',
        explicacion:
          'Que la mamá tuviera cólicos no es, por sí solo, un signo de alarma: el dolor menstrual afecta entre el 50 % y el 90 % de las adolescentes (Itani et al., 2022).',
      },
    ],
    globo: {
      bien: '¡Bien! Dolor que inicia con la regla, dura 1 o 2 días y cede con ibuprofeno: es una dismenorrea primaria (ACOG, 2018).',
      mal: 'Sofía no tenía signos de alarma: su dolor es típico y cede con ibuprofeno. El dolor menstrual afecta al 50-90 % de las adolescentes (Itani et al., 2022).',
    },
  },
  {
    id: 'valentina',
    nombre: 'Valentina',
    apellido: 'Gómez P.',
    edad: 19,
    ocupacion: 'Estudiante universitaria',
    codigo: 'HU-26-05932',
    motivo: 'Dolor menstrual intenso que no mejora con tratamiento.',
    antecedentes: 'Menarquia a los 12 años. Usa anticonceptivos orales hace 8 meses. Sin cirugías.',
    avatar: { piel: '#C68B63', pelo: '#1F130D', peinado: 'largo', ropa: '#8E1B35' },
    vitales: { fc: 94, pas: 116, pad: 74, temp: 36.8, spo2: 98, fr: 18 },
    mensajes: [
      'El dolor de la regla es cada vez peor y ni las pastillas me sirven.',
      'Cuando tengo la regla me duele hasta ir al baño a hacer popó.',
      'Este semestre he faltado a varias clases… y me duele aunque no tenga la regla.',
    ],
    correcta: 'remitir',
    hallazgos: [
      {
        id: 'v_aine',
        estudio: 71.6, // % que lo reconoció en nuestro estudio
        texto: 'El dolor no mejora con AINE ni con anticonceptivos',
        tipo: 'alarma',
        explicacion:
          'El dolor que no cede a AINE ni a anticonceptivos es un signo de alarma (Becker et al., 2022). En nuestro estudio lo reconoció el 71,6 %.',
      },
      {
        id: 'v_disquecia',
        estudio: 34.9, // % que lo reconoció en nuestro estudio
        texto: 'Le duele al defecar durante la regla (disquecia)',
        tipo: 'alarma',
        explicacion:
          'La disquecia es un signo de alarma: en nuestro estudio solo el 34,9 % la reconoció y el 50,5 % la atribuyó a un trastorno digestivo o urinario.',
      },
      {
        id: 'v_ausentismo',
        estudio: 39.4, // % que lo reconoció en nuestro estudio
        texto: 'Ha faltado varias veces a clases por el dolor',
        tipo: 'alarma',
        explicacion:
          'El ausentismo es un signo de alarma: solo el 39,4 % lo reconoció y el 43,1 % lo consideró normal. El 22,9 % de las adolescentes falta a clases o al trabajo por el dolor (Tomsett et al., 2025).',
      },
      {
        id: 'v_no_ciclico',
        texto: 'Tiene dolor pélvico también fuera de la menstruación',
        tipo: 'alarma',
        explicacion: 'El dolor pélvico que aparece fuera de la regla orienta a endometriosis (Becker et al., 2022; Shim, 2024).',
      },
      {
        id: 'v_menarquia',
        texto: 'Su primera regla fue a los 12 años',
        tipo: 'esperable',
        explicacion: 'Una menarquia a los 12 años está dentro de lo normal.',
      },
    ],
    globo: {
      bien: '¡Remisión correcta! La disquecia es un signo de alarma: en nuestro estudio solo el 34,9 % la reconoció.',
      mal: 'Valentina tenía cuatro signos de alarma: había que remitirla. La disquecia, por ejemplo, solo la reconoció el 34,9 % en nuestro estudio.',
    },
  },
  {
    id: 'mariana',
    nombre: 'Mariana',
    apellido: 'Herrera C.',
    edad: 24,
    ocupacion: 'Enfermera',
    codigo: 'HU-26-06275',
    motivo: 'Dolor pélvico y dificultad para quedar en embarazo.',
    antecedentes: 'G0. Busca embarazo hace 14 meses. Ciclos de 28 días. Turnos nocturnos.',
    avatar: { piel: '#F1C7A8', pelo: '#6B3A1E', peinado: 'corto', ropa: '#3E9C8F' },
    vitales: { fc: 84, pas: 112, pad: 72, temp: 36.7, spo2: 99, fr: 16 },
    mensajes: [
      'Hace más de un año estamos buscando un bebé y nada.',
      'Me duele mucho al tener relaciones, como muy adentro.',
      'Y con la regla me arde al orinar; una vez hasta vi sangre.',
    ],
    correcta: 'remitir',
    hallazgos: [
      {
        id: 'm_dispareunia',
        estudio: 58.7, // % que lo reconoció en nuestro estudio
        texto: 'Dolor profundo durante las relaciones sexuales (dispareunia profunda)',
        tipo: 'alarma',
        explicacion: 'La dispareunia profunda es un signo de alarma (Becker et al., 2022). En nuestro estudio la reconoció el 58,7 %.',
      },
      {
        id: 'm_urinario',
        estudio: 33.0, // % que lo reconoció en nuestro estudio
        texto: 'Dolor al orinar o sangre en la orina durante la regla',
        tipo: 'alarma',
        explicacion: 'La disuria o hematuria cíclica fue el signo menos reconocido en nuestro estudio: solo el 33,0 %.',
      },
      {
        id: 'm_infertilidad',
        estudio: 67.9, // % que lo reconoció en nuestro estudio
        texto: 'Dolor pélvico con dificultad para quedar en embarazo',
        tipo: 'alarma',
        explicacion: 'El dolor pélvico con infertilidad es un signo de alarma (Shim, 2024). En nuestro estudio lo reconoció el 67,9 %.',
      },
      {
        id: 'm_ciclos',
        texto: 'Ciclos regulares de 28 días',
        tipo: 'esperable',
        explicacion: 'Un ciclo regular de 28 días es normal.',
      },
      {
        id: 'm_sangrado',
        texto: 'La regla le dura 5 días',
        tipo: 'esperable',
        explicacion: 'Un sangrado de 2 a 7 días se considera normal.',
      },
    ],
    globo: {
      bien: '¡Exacto! El dolor al orinar o la hematuria con la regla fue el signo menos reconocido en nuestro estudio: solo el 33,0 %.',
      mal: 'Mariana tenía tres signos de alarma. El dolor al orinar o la hematuria con la regla solo lo reconoció el 33,0 % en nuestro estudio.',
    },
  },
];

// ---------------------------------------------------------------------
//  ETAPA 2 · LO QUE ENCONTRAMOS (datos reales del artículo: no cambiar)
//  La primera opción de cada lista es la correcta (en pantalla se barajan).
// ---------------------------------------------------------------------
export const PREGUNTAS = [
  {
    id: 'p1',
    pregunta: '¿Qué signo de alarma reconocieron MENOS los estudiantes?',
    opciones: [
      'Dolor al orinar o hematuria',
      'Dolor que no cede a los AINE',
      'Dolor con infertilidad',
      'Dispareunia',
    ],
    explicacion:
      'Dolor al orinar o hematuria: solo el 33,0 %. Le siguen la dispareunia (58,7 %), el dolor con infertilidad (67,9 %) y el dolor que no cede a AINE (71,6 %).',
  },
  {
    id: 'p2',
    pregunta: '¿Qué porcentaje de estudiantes de VIII semestre alcanzó un nivel ALTO de conocimiento?',
    opciones: ['60,6 %', '18,2 %', '25,0 %', '90 %'],
    explicacion: 'VIII semestre: 60,6 %. En II fue el 18,2 % y en VI, el 25,0 %. El nivel medio predominó (51,4 %).',
  },
  {
    id: 'p3',
    pregunta: '¿Cuánto puede tardar el diagnóstico de la endometriosis?',
    opciones: ['Entre 0,3 y 12 años', 'Menos de un mes', 'Entre uno y seis meses', 'Alrededor de un año'],
    explicacion: 'Puede tardar entre 0,3 y 12 años (De Corte et al., 2025). En el estudio solo el 33,9 % lo sabía.',
  },
  {
    id: 'p4',
    pregunta: 'El puntaje promedio subió de 7,8 en II semestre a ___ en VIII semestre (sobre 16).',
    opciones: ['12,2', '9,7', '9,9', '15,0'],
    explicacion: 'Subió de 7,8 (II) a 9,9 (VI) y a 12,2 (VIII). El promedio total fue 9,7 sobre 16.',
  },
];

// ---------------------------------------------------------------------
//  ETAPA 3 · TU OPINIÓN
// ---------------------------------------------------------------------
export const OPINION = {
  entendiste: {
    pregunta: '¿Qué tanto entendiste nuestro artículo?',
    opciones: [
      { valor: 1, emoji: '😵', etiqueta: 'Nada' },
      { valor: 2, emoji: '😕', etiqueta: 'Poco' },
      { valor: 3, emoji: '😐', etiqueta: 'Algo' },
      { valor: 4, emoji: '🙂', etiqueta: 'Bien' },
      { valor: 5, emoji: '🤩', etiqueta: 'Todo' },
    ],
  },
  innovador: {
    pregunta: '¿Te parece innovador abordar este tema con una campaña y un juego?',
    opciones: [
      { valor: 1, emoji: '😴', etiqueta: 'Nada' },
      { valor: 2, emoji: '🤔', etiqueta: 'Poco' },
      { valor: 3, emoji: '👍', etiqueta: 'Algo' },
      { valor: 4, emoji: '💡', etiqueta: 'Mucho' },
      { valor: 5, emoji: '🚀', etiqueta: 'Total' },
    ],
  },
  reconocerias: {
    pregunta: '¿Ahora reconocerías una endometriosis en consulta?',
    opciones: [
      { valor: 'Sí', emoji: '✅', etiqueta: 'Sí' },
      { valor: 'Tal vez', emoji: '🤷', etiqueta: 'Tal vez' },
      { valor: 'No', emoji: '❌', etiqueta: 'No' },
    ],
  },
  palabra: {
    pregunta: 'En una palabra, ¿qué te llevas?',
    max: 20,
    sugerencias: ['Disquecia', 'No es normal', 'Remitir', 'Ausentismo'],
  },
};

// ---------------------------------------------------------------------
//  TEXTOS GENERALES
// ---------------------------------------------------------------------
export const TEXTOS = {
  tituloJuego: 'Consulta de Alarma',
  subtitulo: '¿Dolor normal o endometriosis?',
  hospital: 'Hospital Universitario · Consulta externa de Ginecología',
  bienvenida:
    'Hoy atiendes un turno de consulta. Toca cada hallazgo que sea un signo de alarma y decide si remites a la paciente. ¡Tienes 3 minutos!',
  introEtapa1: 'Toca los hallazgos que sean signo de alarma y toma tu decisión clínica.',
  introEtapa2: '¿Qué encontramos en el estudio? Responde rápido.',
  introEtapa3: 'Tu opinión nos ayuda a mejorar. Un toque por pregunta.',
  cierre: 'El dolor menstrual intenso no siempre es normal. ¡Sospéchala a tiempo!',
  datoMuestra: 'Encuestamos a 109 estudiantes de Medicina (II: 44; VI: 32; VIII: 33) de 117 respuestas recibidas.',
};
