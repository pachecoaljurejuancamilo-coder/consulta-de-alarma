// Sonidos generados con la Web Audio API (sin archivos externos).

const CLAVE_MUTE = 'cda_silencio';

function leerMute() {
  try {
    return localStorage.getItem(CLAVE_MUTE) === '1';
  } catch {
    return false;
  }
}

class Sonido {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.silenciado = leerMute();
    this.ambienteNodos = null;
    this.timerCampana = null;
  }

  // Debe llamarse dentro de un toque del usuario (política de autoplay).
  desbloquear() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.silenciado ? 0 : 1;
    // Compresor suave para que nada sature en parlantes de celular.
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
  }

  setSilencio(valor) {
    this.silenciado = valor;
    try {
      localStorage.setItem(CLAVE_MUTE, valor ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(valor ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  // Nota simple con envolvente
  tono(freq, { dur = 0.15, tipo = 'sine', vol = 0.15, inicio = 0, glide = null, filtro = null } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + inicio;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let salida = g;
    osc.connect(g);
    if (filtro) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filtro;
      g.connect(f);
      salida = f;
    }
    salida.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // «Bip» de monitor de signos vitales
  bip(vol = 0.05) {
    this.tono(988, { dur: 0.09, tipo: 'sine', vol });
  }

  click() {
    this.tono(1400, { dur: 0.04, tipo: 'triangle', vol: 0.06 });
  }

  marcar(alarma) {
    if (alarma) this.tono(520, { dur: 0.12, tipo: 'triangle', vol: 0.1, glide: 780 });
    else this.tono(700, { dur: 0.1, tipo: 'triangle', vol: 0.07, glide: 440 });
  }

  acierto() {
    this.tono(659, { dur: 0.16, tipo: 'triangle', vol: 0.14 });
    this.tono(880, { dur: 0.18, tipo: 'triangle', vol: 0.14, inicio: 0.09 });
    this.tono(1319, { dur: 0.32, tipo: 'sine', vol: 0.1, inicio: 0.18 });
  }

  error() {
    this.tono(233, { dur: 0.22, tipo: 'sawtooth', vol: 0.08, glide: 196, filtro: 900 });
    this.tono(175, { dur: 0.3, tipo: 'sawtooth', vol: 0.08, inicio: 0.14, glide: 150, filtro: 800 });
  }

  tic() {
    this.tono(1760, { dur: 0.03, tipo: 'square', vol: 0.03, filtro: 3000 });
  }

  fanfarria() {
    [523, 659, 784, 1047].forEach((f, i) => this.tono(f, { dur: 0.35, tipo: 'triangle', vol: 0.12, inicio: i * 0.11 }));
    this.tono(1568, { dur: 0.6, tipo: 'sine', vol: 0.06, inicio: 0.45 });
  }

  // Campana de llamado tipo sistema de altavoces del hospital
  campana() {
    this.tono(784, { dur: 1.2, tipo: 'sine', vol: 0.035 });
    this.tono(622, { dur: 1.6, tipo: 'sine', vol: 0.035, inicio: 0.55 });
  }

  // Ambiente de hospital suave: ventilación (ruido café filtrado) + zumbido + campana ocasional
  iniciarAmbiente() {
    if (!this.ctx || this.ambienteNodos) return;
    const ctx = this.ctx;
    const largo = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    let ultimo = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      ultimo = (ultimo + 0.02 * blanco) / 1.02;
      datos[i] = ultimo * 3.2;
    }
    const ruido = ctx.createBufferSource();
    ruido.buffer = buffer;
    ruido.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const gRuido = ctx.createGain();
    gRuido.gain.value = 0;
    gRuido.gain.setTargetAtTime(0.05, ctx.currentTime, 1.2);
    ruido.connect(lp).connect(gRuido).connect(this.master);
    ruido.start();

    const hum = ctx.createOscillator();
    hum.frequency.value = 120;
    const gHum = ctx.createGain();
    gHum.gain.value = 0.006;
    hum.connect(gHum).connect(this.master);
    hum.start();

    this.ambienteNodos = { ruido, hum, gRuido, gHum };
    const programar = () => {
      this.timerCampana = setTimeout(() => {
        this.campana();
        programar();
      }, 22000 + Math.random() * 18000);
    };
    programar();
  }

  detenerAmbiente() {
    if (!this.ambienteNodos || !this.ctx) return;
    const { ruido, hum, gRuido, gHum } = this.ambienteNodos;
    const t = this.ctx.currentTime;
    gRuido.gain.setTargetAtTime(0, t, 0.4);
    gHum.gain.setTargetAtTime(0, t, 0.4);
    setTimeout(() => {
      try {
        ruido.stop();
        hum.stop();
      } catch {
        /* ya detenidos */
      }
    }, 2000);
    clearTimeout(this.timerCampana);
    this.ambienteNodos = null;
  }
}

export const sonido = new Sonido();

export function vibrar(patron) {
  try {
    if (navigator.vibrate) navigator.vibrate(patron);
  } catch {
    /* no disponible */
  }
}
