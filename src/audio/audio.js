// Música dinámica (Tone.js) y efectos de sonido (jsfxr), todo generado en el navegador.
import * as Tone from 'tone';
import { sfxr } from 'jsfxr';

let iniciado = false;
let silenciado = false;
let escena = 'nada';
const buffers = {};
let salidaSfx = null;
let inst = null;
let ambiente = null;
let paso = 0;

// Generador pseudoaleatorio con semilla: los sonidos de jsfxr son siempre los mismos
function conSemilla(semilla, fn) {
  const original = Math.random;
  let s = semilla >>> 0;
  Math.random = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

const SFX = {
  disparo: ['laserShoot', 11, 0.5],
  impacto: ['explosion', 4, 0.45],
  recoger: ['pickupCoin', 7, 0.5],
  error: ['hitHurt', 21, 0.5],
  mision: ['powerUp', 5, 0.5],
  dash: ['jump', 31, 0.32],
  salto: ['jump', 3, 0.3],
  dano: ['hitHurt', 9, 0.55],
  cristal: ['explosion', 17, 0.5],
  golpeJefe: ['explosion', 23, 0.7],
  portal: ['powerUp', 44, 0.5],
  tic: ['blipSelect', 2, 0.35],
  mito: ['hitHurt', 50, 0.45],
};

function crearBuffers(ctx) {
  for (const [nombre, [preset, semilla, vol]] of Object.entries(SFX)) {
    try {
      const params = conSemilla(semilla * 7919, () => sfxr.generate(preset, { sound_vol: vol, sample_rate: 44100, sample_size: 16 }));
      const nodo = sfxr.toWebAudio(params, ctx);
      buffers[nombre] = nodo.buffer;
    } catch {
      /* sin ese sonido */
    }
  }
}

function crearInstrumentos() {
  const maestro = new Tone.Gain(0.55).toDestination();
  const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.22 }).connect(maestro);
  const marimba = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.35, sustain: 0, release: 0.3 },
    volume: -11,
  }).connect(reverb);
  marimba.maxPolyphony = 16;
  const pluck = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.003, decay: 0.18, sustain: 0.05, release: 0.2 },
    volume: -14,
  }).connect(reverb);
  pluck.maxPolyphony = 16;
  const bajo = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { Q: 1, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.25, sustain: 0.4, release: 0.2 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 180, octaves: 2.2 },
    volume: -9,
  }).connect(maestro);
  const bombo = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 5, envelope: { attack: 0.001, decay: 0.32, sustain: 0 }, volume: -8 }).connect(maestro);
  const filtroHat = new Tone.Filter(7000, 'highpass').connect(maestro);
  const maraca = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.002, decay: 0.05, sustain: 0 }, volume: -24 }).connect(filtroHat);
  const caja = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 }, volume: -16 }).connect(reverb);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
    envelope: { attack: 0.4, decay: 0.5, sustain: 0.6, release: 1.2 },
    volume: -24,
  });
  pad.maxPolyphony = 20;
  const filtroPad = new Tone.Filter(1400, 'lowpass').connect(reverb);
  pad.connect(filtroPad);
  const lider = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.1 }, volume: -20 }).connect(reverb);
  return { maestro, marimba, pluck, bajo, bombo, maraca, caja, pad, lider };
}

// Progresiones (una por compás de 16 semicorcheas)
const ESCENAS = {
  calma: { bpm: 100, acordes: [['D4', 'F#4', 'A4'], ['B3', 'D4', 'F#4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4']], bajos: ['D2', 'B1', 'G1', 'A1'] },
  tension: { bpm: 112, acordes: [['D4', 'F4', 'A4'], ['A#3', 'D4', 'F4'], ['C4', 'E4', 'G4'], ['A3', 'C#4', 'E4']], bajos: ['D2', 'A#1', 'C2', 'A1'] },
  jefe: { bpm: 142, acordes: [['D4', 'F4', 'A4'], ['A#3', 'D4', 'F4'], ['C4', 'E4', 'G4'], ['A3', 'C#4', 'E4']], bajos: ['D2', 'A#1', 'C2', 'A1'] },
  salida: { bpm: 126, acordes: [['G4', 'B4', 'D5'], ['D4', 'F#4', 'A4'], ['A3', 'C#4', 'E4'], ['B3', 'D4', 'F#4']], bajos: ['G1', 'D2', 'A1', 'B1'] },
  final: { bpm: 92, acordes: [['D4', 'F#4', 'A4', 'C#5'], ['G3', 'B3', 'D4', 'F#4'], ['E4', 'G4', 'B4'], ['A3', 'C#4', 'E4', 'G4']], bajos: ['D2', 'G1', 'E2', 'A1'] },
};
const TRESILLO = [0, 3, 6, 8, 11, 14];

function tocarPaso(tiempo) {
  if (!inst || escena === 'nada') return;
  const e = ESCENAS[escena];
  const s = paso % 16;
  const compas = Math.floor(paso / 16) % 4;
  const acorde = e.acordes[compas];
  const bajo = e.bajos[compas];
  const i = inst;
  if (escena === 'calma' || escena === 'tension') {
    if (TRESILLO.includes(s)) i.marimba.triggerAttackRelease(acorde[(s / 3) % acorde.length | 0], '16n', tiempo, 0.55 + (s === 0 ? 0.3 : 0));
    if (s === 0 || s === 6 || s === 10) i.bajo.triggerAttackRelease(s === 6 ? Tone.Frequency(bajo).transpose(7).toNote() : bajo, '8n', tiempo, 0.8);
    if (s % 2 === 0) i.maraca.triggerAttackRelease('32n', tiempo, s % 4 === 2 ? 0.9 : 0.4);
    if (s === 0 || s === 8) i.bombo.triggerAttackRelease('C1', '8n', tiempo, 0.6);
    if (escena === 'tension') {
      if (s % 4 === 2) i.pluck.triggerAttackRelease(Tone.Frequency(acorde[0]).transpose(12).toNote(), '32n', tiempo, 0.4);
      if (s === 4 || s === 12) i.caja.triggerAttackRelease('16n', tiempo, 0.35);
    }
  } else if (escena === 'jefe') {
    if (s % 4 === 0) i.bombo.triggerAttackRelease('C1', '8n', tiempo, 1);
    if (s === 4 || s === 12) i.caja.triggerAttackRelease('8n', tiempo, 0.9);
    if (s % 2 === 0) i.bajo.triggerAttackRelease(bajo, '16n', tiempo, s % 4 === 0 ? 1 : 0.6);
    if (s === 0) i.pad.triggerAttackRelease(acorde, '1m', tiempo, 0.6);
    if ([0, 3, 6, 10, 12].includes(s)) i.lider.triggerAttackRelease(Tone.Frequency(acorde[s % 3]).transpose(12).toNote(), '16n', tiempo, 0.5);
    if (s % 2 === 1) i.maraca.triggerAttackRelease('32n', tiempo, 0.6);
  } else if (escena === 'salida') {
    if (s % 4 === 0) i.bombo.triggerAttackRelease('C1', '8n', tiempo, 0.9);
    if (s % 4 === 2) i.bajo.triggerAttackRelease(bajo, '8n', tiempo, 0.8);
    if (s % 2 === 0) i.pluck.triggerAttackRelease(acorde[(s / 2) % acorde.length], '16n', tiempo, 0.7);
    if (s === 4 || s === 12) i.caja.triggerAttackRelease('16n', tiempo, 0.5);
    if (s % 2 === 1) i.maraca.triggerAttackRelease('32n', tiempo, 0.7);
    if (s === 0 && compas % 2 === 0) i.pad.triggerAttackRelease(acorde, '2m', tiempo, 0.4);
  } else if (escena === 'final') {
    if (s === 0) i.pad.triggerAttackRelease(acorde, '1m', tiempo, 0.35);
    if (s % 4 === 0) i.marimba.triggerAttackRelease(acorde[(s / 4) % acorde.length], '8n', tiempo, 0.5);
    if (s === 0) i.bajo.triggerAttackRelease(bajo, '2n', tiempo, 0.6);
  }
  paso++;
}

function crearAmbiente() {
  const g = new Tone.Gain(0).toDestination();
  const ruido = new Tone.Noise('brown');
  const filtro = new Tone.Filter(380, 'lowpass');
  ruido.connect(filtro);
  filtro.connect(g);
  const pitido = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 }, volume: -30 }).connect(g);
  const loop = new Tone.Loop((t) => pitido.triggerAttackRelease(988, '32n', t, 0.7), 1.05);
  return { g, ruido, loop, filtro };
}

// Debe llamarse dentro de un gesto del usuario (toque o clic)
export async function iniciarAudio() {
  if (iniciado) return;
  iniciado = true;
  try {
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    salidaSfx = new Tone.Gain(0.9).toDestination();
    crearBuffers(ctx);
    inst = crearInstrumentos();
    ambiente = crearAmbiente();
    Tone.getTransport().bpm.value = 100;
    new Tone.Loop((t) => tocarPaso(t), '16n').start(0);
    Tone.getTransport().start('+0.05');
    Tone.getDestination().mute = silenciado;
  } catch {
    iniciado = false;
  }
}

// Si el audio se inició sin un toque (por ejemplo en el modo demo), se reanuda con el primer toque o tecla
if (typeof window !== 'undefined') {
  const reanudar = () => {
    try {
      const ctx = Tone.getContext().rawContext;
      if (ctx.state !== 'running') ctx.resume();
    } catch {
      /* nada */
    }
  };
  window.addEventListener('pointerdown', reanudar, { passive: true });
  window.addEventListener('keydown', reanudar);
}

export function sonido(nombre, { volumen = 1, tono = 1 } = {}) {
  if (!iniciado || silenciado || !buffers[nombre]) return;
  try {
    const ctx = Tone.getContext().rawContext;
    const src = ctx.createBufferSource();
    src.buffer = buffers[nombre];
    src.playbackRate.value = tono * (0.96 + Math.random() * 0.08);
    const g = ctx.createGain();
    g.gain.value = volumen;
    src.connect(g);
    Tone.connect(g, salidaSfx);
    src.start();
  } catch {
    /* sin audio */
  }
}

export function musica(nombre) {
  if (!iniciado || nombre === escena) return;
  escena = nombre;
  const e = ESCENAS[nombre];
  if (e) Tone.getTransport().bpm.rampTo(e.bpm, 0.5);
  paso = Math.floor(paso / 16) * 16; // empieza en el siguiente compás
  if (inst) inst.maestro.gain.rampTo(nombre === 'nada' ? 0 : nombre === 'final' ? 0.45 : 0.55, 0.6);
}

export function ambienteHospital(activo) {
  if (!ambiente) return;
  try {
    if (activo) {
      if (ambiente.ruido.state !== 'started') ambiente.ruido.start();
      ambiente.loop.start();
      ambiente.g.gain.rampTo(0.18, 1);
    } else {
      ambiente.g.gain.rampTo(0, 1);
      ambiente.loop.stop();
    }
  } catch {
    /* nada */
  }
}

export function silenciar(valor) {
  silenciado = valor;
  try {
    Tone.getDestination().mute = valor;
  } catch {
    /* nada */
  }
}
