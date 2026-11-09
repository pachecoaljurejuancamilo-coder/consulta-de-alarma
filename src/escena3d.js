// Consultorio médico en 3D modelado con primitivas (Three.js).
import * as THREE from 'three';

const VINO = 0x8e1b35;
const ROSA = 0xf4a3b7;
const AMARILLO = 0xf2c42c;

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function texturaPiso() {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = '#E8DCD3';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${150 + Math.random() * 60},${120 + Math.random() * 40},${110 + Math.random() * 40},${Math.random() * 0.07})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  g.strokeStyle = '#D2C1B6';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function texturaCielo() {
  const [c, g] = lienzo(256, 256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#F7B6C2');
  gr.addColorStop(0.45, '#FFD6A8');
  gr.addColorStop(1, '#FFF1D6');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const sol = g.createRadialGradient(170, 150, 4, 170, 150, 90);
  sol.addColorStop(0, 'rgba(255,250,230,1)');
  sol.addColorStop(1, 'rgba(255,250,230,0)');
  g.fillStyle = sol;
  g.fillRect(0, 0, 256, 256);
  // Siluetas lejanas de la ciudad y palmeras
  g.fillStyle = 'rgba(142,27,53,0.25)';
  [[0, 200, 40, 56], [44, 188, 30, 68], [80, 210, 50, 46], [140, 196, 26, 60], [200, 205, 56, 51]].forEach(([x, y, w, h]) =>
    g.fillRect(x, y, w, h),
  );
  g.strokeStyle = 'rgba(80,30,40,0.45)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(60, 256);
  g.quadraticCurveTo(66, 200, 58, 150);
  g.stroke();
  g.fillStyle = 'rgba(80,30,40,0.45)';
  for (let a = 0; a < 6; a++) {
    g.save();
    g.translate(58, 150);
    g.rotate(-2.6 + a * 0.75);
    g.beginPath();
    g.ellipse(18, 0, 20, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaAfiche() {
  const [c, g] = lienzo(512, 720);
  g.fillStyle = '#FFF7F2';
  g.fillRect(0, 0, 512, 720);
  g.fillStyle = '#8E1B35';
  g.fillRect(0, 0, 512, 150);
  g.fillStyle = '#FFFFFF';
  g.font = '800 54px "Baloo 2", sans-serif';
  g.fillText('Endometriosis', 34, 82);
  g.font = '600 30px Nunito, sans-serif';
  g.fillText('Signos de alarma', 36, 124);
  // cinta
  g.save();
  g.translate(430, 290);
  g.fillStyle = '#F2C42C';
  g.beginPath();
  g.moveTo(0, -80);
  g.bezierCurveTo(-48, -80, -50, -10, -16, 30);
  g.lineTo(-52, 110);
  g.lineTo(-28, 118);
  g.lineTo(0, 54);
  g.lineTo(28, 118);
  g.lineTo(52, 110);
  g.lineTo(16, 30);
  g.bezierCurveTo(50, -10, 48, -80, 0, -80);
  g.fill();
  g.fillStyle = '#FFF7F2';
  g.beginPath();
  g.ellipse(0, -36, 12, 26, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.fillStyle = '#3A1724';
  g.font = '700 27px Nunito, sans-serif';
  ['Dolor que no cede a AINE', 'Disquecia', 'Dispareunia profunda', 'Disuria o hematuria', 'Ausentismo escolar', 'Dolor con infertilidad'].forEach(
    (t, i) => {
      g.fillStyle = '#8E1B35';
      g.beginPath();
      g.arc(46, 214 + i * 64, 9, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3A1724';
      g.fillText(t, 68, 224 + i * 64);
    },
  );
  g.fillStyle = '#F2C42C';
  g.fillRect(0, 630, 512, 90);
  g.fillStyle = '#3A1724';
  g.font = '800 34px "Baloo 2", sans-serif';
  g.fillText('¡Sospéchala a tiempo!', 70, 688);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function texturaHCE() {
  const [c, g] = lienzo(512, 320);
  g.fillStyle = '#F8F4F2';
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#8E1B35';
  g.fillRect(0, 0, 512, 44);
  g.fillStyle = '#fff';
  g.font = '700 22px Nunito, sans-serif';
  g.fillText('HCE · Historia clínica', 16, 30);
  g.fillStyle = '#F4A3B7';
  g.fillRect(0, 44, 140, 276);
  g.fillStyle = '#3A1724';
  g.font = '600 15px Nunito, sans-serif';
  ['Pacientes', 'Agenda', 'Órdenes', 'Remisiones'].forEach((t, i) => g.fillText(t, 16, 80 + i * 34));
  g.fillStyle = '#D9C7CC';
  for (let i = 0; i < 7; i++) g.fillRect(160, 70 + i * 32, 200 + ((i * 67) % 130), 12);
  g.fillStyle = '#F2C42C';
  g.fillRect(160, 280, 120, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Monitor de signos vitales con ECG en movimiento
function crearMonitorECG() {
  const [c, g] = lienzo(512, 300);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const traza = new Float32Array(330).fill(0);
  let x = 0;
  let fase = 0;
  const fc = 76;
  const ecg = (p) => {
    // p en [0,1) dentro de un latido
    if (p < 0.1) return Math.sin((p / 0.1) * Math.PI) * 0.12;
    if (p < 0.16) return 0;
    if (p < 0.18) return -0.18;
    if (p < 0.21) return 1;
    if (p < 0.24) return -0.35;
    if (p < 0.4) return 0;
    if (p < 0.55) return Math.sin(((p - 0.4) / 0.15) * Math.PI) * 0.25;
    return 0;
  };
  let alLatir = null;
  function actualizar(dt) {
    const pasos = Math.max(1, Math.round(dt * 120));
    for (let i = 0; i < pasos; i++) {
      const antes = fase;
      fase = (fase + fc / 60 / 120) % 1;
      if (antes < 0.19 && fase >= 0.19 && alLatir) alLatir();
      traza[x] = ecg(fase);
      x = (x + 1) % traza.length;
    }
    g.fillStyle = '#071512';
    g.fillRect(0, 0, 512, 300);
    g.strokeStyle = 'rgba(54,242,154,0.08)';
    g.lineWidth = 1;
    for (let gx = 0; gx < 340; gx += 22) {
      g.beginPath();
      g.moveTo(gx, 20);
      g.lineTo(gx, 280);
      g.stroke();
    }
    for (let gy = 20; gy < 290; gy += 22) {
      g.beginPath();
      g.moveTo(0, gy);
      g.lineTo(330, gy);
      g.stroke();
    }
    g.strokeStyle = '#36F29A';
    g.lineWidth = 3.5;
    g.shadowColor = '#36F29A';
    g.shadowBlur = 8;
    g.beginPath();
    for (let i = 0; i < traza.length; i++) {
      if ((i - x + traza.length) % traza.length < 14) {
        g.stroke();
        g.beginPath();
        continue;
      }
      const yy = 150 - traza[i] * 95;
      if (i === 0) g.moveTo(i, yy);
      else g.lineTo(i, yy);
    }
    g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = '#36F29A';
    g.font = '700 22px Nunito, sans-serif';
    g.fillText('FC', 350, 46);
    g.font = '800 64px Nunito, sans-serif';
    g.fillText(String(fc + Math.round(Math.sin(performance.now() / 2300) * 2)), 350, 106);
    g.fillStyle = '#7FD7FF';
    g.font = '700 20px Nunito, sans-serif';
    g.fillText('SpO₂', 350, 150);
    g.font = '800 44px Nunito, sans-serif';
    g.fillText('98', 350, 196);
    g.fillStyle = '#F4A3B7';
    g.font = '700 20px Nunito, sans-serif';
    g.fillText('PA', 350, 236);
    g.font = '800 30px Nunito, sans-serif';
    g.fillText('112/72', 350, 272);
    t.needsUpdate = true;
  }
  return {
    textura: t,
    actualizar,
    set alLatir(fn) {
      alLatir = fn;
    },
  };
}

function texturaReloj() {
  const [c, g] = lienzo(256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  function dibujar() {
    const d = new Date();
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.arc(128, 128, 120, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 12;
    g.strokeStyle = '#8E1B35';
    g.stroke();
    g.fillStyle = '#3A1724';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillRect(128 + Math.sin(a) * 95 - 3, 128 - Math.cos(a) * 95 - 8, 6, 16);
    }
    const mano = (ang, largo, ancho, color) => {
      g.save();
      g.translate(128, 128);
      g.rotate(ang);
      g.fillStyle = color;
      g.fillRect(-ancho / 2, -largo, ancho, largo + 12);
      g.restore();
    };
    const h = d.getHours() % 12;
    const m = d.getMinutes();
    const s = d.getSeconds();
    mano(((h + m / 60) / 12) * Math.PI * 2, 58, 9, '#3A1724');
    mano(((m + s / 60) / 60) * Math.PI * 2, 86, 6, '#3A1724');
    mano((s / 60) * Math.PI * 2, 94, 2.5, '#C0392B');
    t.needsUpdate = true;
  }
  dibujar();
  return { textura: t, dibujar };
}

export function crearEscena3D(canvas, { onLento, onLatido } = {}) {
  const movil = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !movil, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x3a1724);
  escena.fog = new THREE.Fog(0xf6e6e0, 9, 18);

  const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
  const objetivo = new THREE.Vector3(-0.5, 1.05, -1.7);

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra });
  const metal = mat(0xc9ced3, { roughness: 0.35, metalness: 0.7 });
  const blanco = mat(0xffffff, { roughness: 0.6 });

  function caja(w, h, d, material, x, y, z, { sombra = true, recibe = true } = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = recibe;
    escena.add(m);
    return m;
  }
  function cilindro(rt, rb, h, material, x, y, z, seg = 20) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    escena.add(m);
    return m;
  }

  // ---------- Habitación ----------
  const ANCHO = 7.2;
  const FONDO = 6.4;
  const ALTO = 3.1;
  const izq = -3.5;
  const atras = -3;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO + 4, FONDO + 4), mat(0xffffff, { map: texturaPiso(), roughness: 0.55 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);

  const techo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO + 4, FONDO + 4), mat(0xfaf3ef));
  techo.rotation.x = Math.PI / 2;
  techo.position.y = ALTO;
  escena.add(techo);

  const paredSup = mat(0xfff7f2, { roughness: 0.95 });
  const paredInf = mat(0xf8dbe2, { roughness: 0.9 });
  const franja = mat(VINO, { roughness: 0.5 });
  // Pared del fondo
  caja(ANCHO + 2, ALTO - 1, 0.1, paredSup, 0, 1 + (ALTO - 1) / 2, atras - 0.05, { sombra: false });
  caja(ANCHO + 2, 1, 0.1, paredInf, 0, 0.5, atras - 0.05, { sombra: false });
  caja(ANCHO + 2, 0.06, 0.04, franja, 0, 1.0, atras + 0.01, { sombra: false });
  caja(ANCHO + 2, 0.12, 0.03, mat(0x6e1328), 0, 0.06, atras + 0.01, { sombra: false });
  // Pared derecha
  caja(0.1, ALTO, FONDO + 4, paredSup, 5.2, ALTO / 2, 0, { sombra: false });

  // Pared izquierda con hueco de ventana (las piezas proyectan sombra: la luz entra solo por la ventana)
  const vz = -0.8; // centro de la ventana
  const vy = 1.75;
  const vw = 2.0;
  const vh = 1.4;
  const zMin = atras - 1;
  const zMax = FONDO / 2 + 1;
  const parteIzq = (z1, z2, y1, y2, m) =>
    caja(0.12, y2 - y1, z2 - z1, m, izq - 0.06, (y1 + y2) / 2, (z1 + z2) / 2, { sombra: true, recibe: true });
  parteIzq(zMin, vz - vw / 2, 1, ALTO + 0.3, paredSup);
  parteIzq(vz + vw / 2, zMax, 1, ALTO + 0.3, paredSup);
  parteIzq(vz - vw / 2, vz + vw / 2, vy + vh / 2, ALTO + 0.3, paredSup);
  parteIzq(vz - vw / 2, vz + vw / 2, 1, vy - vh / 2, paredSup);
  parteIzq(zMin, zMax, 0, 1, paredInf);
  caja(0.04, 0.06, zMax - zMin, franja, izq + 0.01, 1.0, (zMin + zMax) / 2, { sombra: false });

  // Ventana: marco, cielo y persianas
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), new THREE.MeshBasicMaterial({ map: texturaCielo(), toneMapped: false }));
  cielo.rotation.y = Math.PI / 2;
  cielo.position.set(izq - 0.1, vy, vz);
  escena.add(cielo);
  const marco = mat(0xffffff, { roughness: 0.4 });
  caja(0.1, 0.07, vw + 0.1, marco, izq + 0.02, vy + vh / 2, vz);
  caja(0.16, 0.07, vw + 0.2, marco, izq + 0.05, vy - vh / 2, vz);
  caja(0.1, vh, 0.07, marco, izq + 0.02, vy, vz - vw / 2);
  caja(0.1, vh, 0.07, marco, izq + 0.02, vy, vz + vw / 2);
  caja(0.06, vh, 0.04, marco, izq + 0.02, vy, vz);
  const lama = mat(0xfdf1e8, { roughness: 0.5 });
  for (let i = 0; i < 9; i++) {
    const l = caja(0.05, 0.012, vw - 0.06, lama, izq + 0.07, vy + vh / 2 - 0.05 - i * 0.065, vz);
    l.rotation.z = 0.5;
  }
  caja(0.06, 0.08, vw + 0.1, lama, izq + 0.07, vy + vh / 2 + 0.02, vz);

  // ---------- Camilla ----------
  const cx = 1.15;
  const cz = -2.35;
  const tapiz = mat(VINO, { roughness: 0.45 });
  caja(1.9, 0.08, 0.66, metal, cx, 0.62, cz);
  caja(1.8, 0.5, 0.56, mat(0xeae6e3, { roughness: 0.5 }), cx, 0.36, cz);
  [-0.82, 0.82].forEach((dx) => [-0.24, 0.24].forEach((dz) => cilindro(0.025, 0.025, 0.12, metal, cx + dx, 0.06, cz + dz, 10)));
  caja(1.3, 0.11, 0.66, tapiz, cx + 0.3, 0.72, cz);
  const respaldo = caja(0.62, 0.11, 0.66, tapiz, cx - 0.62, 0.86, cz);
  respaldo.rotation.z = -0.42;
  const papel = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.46), mat(0xfbfbfb, { roughness: 0.9, side: THREE.DoubleSide }));
  papel.rotation.x = -Math.PI / 2;
  papel.position.set(cx + 0.18, 0.78, cz);
  papel.receiveShadow = true;
  escena.add(papel);
  const rollo = cilindro(0.07, 0.07, 0.5, blanco, cx + 0.98, 0.72, cz);
  rollo.rotation.x = Math.PI / 2;
  const almohada = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 6, 12), mat(0xffffff, { roughness: 0.85 }));
  almohada.rotation.x = Math.PI / 2;
  almohada.position.set(cx - 0.72, 1.0, cz);
  almohada.rotation.z = -0.4;
  almohada.castShadow = true;
  escena.add(almohada);
  // Escalón
  caja(0.42, 0.22, 0.32, metal, cx + 0.2, 0.11, cz + 0.58);
  caja(0.44, 0.03, 0.34, mat(0x2b2b2b, { roughness: 0.9 }), cx + 0.2, 0.235, cz + 0.58);

  // ---------- Lámpara de exploración ----------
  const lx = 2.55;
  const lz = -1.7;
  cilindro(0.26, 0.28, 0.04, metal, lx, 0.02, lz, 24);
  cilindro(0.022, 0.022, 1.45, metal, lx, 0.75, lz, 10);
  const brazo = cilindro(0.018, 0.018, 0.75, metal, lx - 0.28, 1.6, lz - 0.12, 10);
  brazo.rotation.z = 1.05;
  brazo.rotation.y = 0.4;
  const cabeza = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.2, 24, 1, true),
    mat(0xf3f3f3, { roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }),
  );
  cabeza.position.set(lx - 0.62, 1.72, lz - 0.28);
  cabeza.rotation.z = 0.6;
  cabeza.castShadow = true;
  escena.add(cabeza);
  const bombillo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff4dc }));
  bombillo.position.set(lx - 0.66, 1.66, lz - 0.3);
  escena.add(bombillo);
  const foco = new THREE.SpotLight(0xffe7c9, 14, 5, 0.6, 0.6, 1.6);
  foco.position.copy(bombillo.position);
  foco.target.position.set(cx + 0.1, 0.75, cz + 0.05);
  foco.castShadow = !movil;
  foco.shadow.mapSize.set(512, 512);
  escena.add(foco, foco.target);

  // ---------- Monitor de signos vitales en brazo de pared ----------
  const monitorECG = crearMonitorECG();
  caja(0.08, 0.08, 0.5, metal, 2.4, 1.95, atras + 0.25);
  caja(0.62, 0.42, 0.08, mat(0x2a2a2e, { roughness: 0.4 }), 2.4, 1.95, atras + 0.52);
  const pantallaECG = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.33),
    new THREE.MeshBasicMaterial({ map: monitorECG.textura, toneMapped: false }),
  );
  pantallaECG.position.set(2.4, 1.95, atras + 0.565);
  escena.add(pantallaECG);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0x36f29a }));
  led.position.set(2.66, 1.77, atras + 0.57);
  escena.add(led);

  // ---------- Escritorio ----------
  const ex = -1.95;
  const ez = -2.55;
  const madera = mat(0xc49a72, { roughness: 0.6 });
  caja(1.7, 0.05, 0.78, madera, ex, 0.76, ez);
  caja(0.05, 0.74, 0.72, mat(0xf3eeea), ex - 0.8, 0.37, ez);
  caja(0.5, 0.74, 0.72, mat(0xf3eeea), ex + 0.6, 0.37, ez);
  [0.2, 0.42, 0.62].forEach((y) => caja(0.42, 0.005, 0.01, mat(0x9a8f88), ex + 0.6, y, ez + 0.365, { sombra: false }));
  // Monitor del computador con la HCE
  caja(0.2, 0.02, 0.16, mat(0x222225), ex - 0.1, 0.79, ez - 0.05);
  caja(0.04, 0.24, 0.04, mat(0x222225), ex - 0.1, 0.9, ez - 0.08);
  const monitor = caja(0.78, 0.48, 0.035, mat(0x1d1d20, { roughness: 0.35 }), ex - 0.1, 1.17, ez - 0.06);
  monitor.rotation.y = 0.25;
  const pantallaHCE = new THREE.Mesh(new THREE.PlaneGeometry(0.73, 0.43), new THREE.MeshBasicMaterial({ map: texturaHCE(), toneMapped: false }));
  pantallaHCE.position.set(0, 0, 0.019);
  monitor.add(pantallaHCE);
  // Teclado, mouse, taza, carpetas, estetoscopio
  const teclado = caja(0.46, 0.018, 0.15, mat(0x2d2d31), ex - 0.05, 0.795, ez + 0.2);
  teclado.rotation.y = 0.25;
  caja(0.06, 0.02, 0.1, mat(0x2d2d31), ex + 0.32, 0.795, ez + 0.24);
  cilindro(0.045, 0.04, 0.1, mat(ROSA, { roughness: 0.4 }), ex + 0.6, 0.835, ez + 0.12);
  caja(0.32, 0.04, 0.24, mat(VINO), ex - 0.62, 0.8, ez + 0.05).rotation.y = -0.2;
  caja(0.3, 0.03, 0.23, mat(AMARILLO), ex - 0.6, 0.835, ez + 0.06).rotation.y = -0.1;
  const esteto = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 40, Math.PI * 1.6), mat(0x2b2b2b, { roughness: 0.3 }));
  esteto.rotation.x = -Math.PI / 2;
  esteto.position.set(ex + 0.28, 0.785, ez - 0.2);
  escena.add(esteto);
  cilindro(0.03, 0.03, 0.012, metal, ex + 0.38, 0.79, ez - 0.12);

  // Silla de escritorio
  const sx = ex + 0.05;
  const sz = ez + 0.85;
  const tela = mat(0x3a1724, { roughness: 0.85 });
  caja(0.5, 0.08, 0.48, tela, sx, 0.5, sz);
  const espaldar = caja(0.46, 0.55, 0.07, tela, sx, 0.85, sz + 0.24);
  espaldar.rotation.x = 0.12;
  cilindro(0.03, 0.03, 0.4, metal, sx, 0.27, sz);
  for (let i = 0; i < 5; i++) {
    const p = caja(0.3, 0.03, 0.04, metal, sx + Math.cos((i / 5) * Math.PI * 2) * 0.15, 0.06, sz + Math.sin((i / 5) * Math.PI * 2) * 0.15);
    p.rotation.y = -(i / 5) * Math.PI * 2;
  }

  // Taburete junto a la camilla
  cilindro(0.2, 0.2, 0.07, mat(VINO), 0.15, 0.55, -1.55);
  cilindro(0.025, 0.025, 0.5, metal, 0.15, 0.28, -1.55, 10);
  cilindro(0.2, 0.22, 0.03, metal, 0.15, 0.03, -1.55);

  // Afiche de signos de alarma y reloj
  caja(0.66, 0.92, 0.02, mat(0xffffff), -0.05, 1.85, atras + 0.02);
  const afiche = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), mat(0xffffff, { map: texturaAfiche(), roughness: 0.6 }));
  afiche.position.set(-0.05, 1.85, atras + 0.035);
  escena.add(afiche);
  const reloj = texturaReloj();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), new THREE.MeshStandardMaterial({ map: reloj.textura, roughness: 0.4 }));
  disco.position.set(-1.95, 2.45, atras + 0.03);
  escena.add(disco);
  // Dispensador de gel
  caja(0.12, 0.2, 0.08, blanco, 0.75, 1.45, atras + 0.04);
  caja(0.05, 0.03, 0.05, mat(ROSA), 0.75, 1.33, atras + 0.06);

  // Cortina de privacidad
  const cortinaGeo = new THREE.PlaneGeometry(2.4, 2.1, 48, 1);
  const pos = cortinaGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 11) * 0.06);
  cortinaGeo.computeVertexNormals();
  const cortina = new THREE.Mesh(cortinaGeo, mat(0xf7c6d2, { roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.94 }));
  cortina.rotation.y = Math.PI / 2;
  cortina.position.set(3.25, 1.8, 0.3);
  cortina.castShadow = true;
  escena.add(cortina);
  caja(0.03, 0.03, 4.2, metal, 3.25, 2.88, -0.6);

  // Planta
  cilindro(0.2, 0.15, 0.36, mat(0xfff7f2, { roughness: 0.4 }), -3.05, 0.18, 0.7);
  const hoja = mat(0x4f8a5b, { roughness: 0.7 });
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), hoja);
    h.scale.set(0.45, 1.4, 0.18);
    const a = (i / 9) * Math.PI * 2;
    h.position.set(-3.05 + Math.cos(a) * 0.14, 0.62 + (i % 3) * 0.08, 0.7 + Math.sin(a) * 0.14);
    h.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    h.castShadow = true;
    escena.add(h);
  }

  // Panel de luz del techo
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ color: 0xfff8ef }));
  panel.rotation.x = Math.PI / 2;
  panel.position.set(0, ALTO - 0.01, -1.2);
  escena.add(panel);

  // ---------- Luces ----------
  escena.add(new THREE.HemisphereLight(0xfff1e6, 0xc9a9b2, 1.1));
  const techoLuz = new THREE.PointLight(0xfff3e6, 6, 9, 1.4);
  techoLuz.position.set(0, ALTO - 0.25, -1.2);
  escena.add(techoLuz);
  const sol = new THREE.DirectionalLight(0xffcf96, 4.2);
  sol.position.set(izq - 4, 4.4, vz + 0.6);
  sol.target.position.set(0.2, 0, -1);
  sol.castShadow = true;
  sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
  sol.shadow.camera.left = -5;
  sol.shadow.camera.right = 5;
  sol.shadow.camera.top = 5;
  sol.shadow.camera.bottom = -5;
  sol.shadow.camera.near = 0.5;
  sol.shadow.camera.far = 16;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  sol.shadow.radius = 4;
  escena.add(sol, sol.target);

  // Haz de luz volumétrico (falso) y partículas de polvo
  const haz = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 1.25, 4.2, 4, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0.025, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  );
  haz.position.set(izq + 1.6, 0.95, vz + 0.3);
  haz.rotation.z = 1.0;
  haz.rotation.y = Math.PI / 4;
  escena.add(haz);
  const nPolvo = movil ? 70 : 160;
  const polvoGeo = new THREE.BufferGeometry();
  const pp = new Float32Array(nPolvo * 3);
  for (let i = 0; i < nPolvo; i++) {
    pp[i * 3] = izq + 0.3 + Math.random() * 2.8;
    pp[i * 3 + 1] = 0.3 + Math.random() * 2.2;
    pp[i * 3 + 2] = vz - 0.9 + Math.random() * 2;
  }
  polvoGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const polvo = new THREE.Points(
    polvoGeo,
    new THREE.PointsMaterial({ color: 0xfff1d6, size: 0.018, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  escena.add(polvo);

  // ---------- Cámara, tamaño y animación ----------
  function ajustar() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    const aspecto = w / h;
    camara.aspect = aspecto;
    camara.fov = aspecto < 0.8 ? 68 : aspecto < 1.2 ? 58 : 48;
    // En celular la tarjeta de inicio tapa la parte baja: subimos la imagen.
    if (aspecto < 0.8) camara.setViewOffset(w, h, 0, h * 0.2, w, h);
    else if (aspecto > 1.2) camara.setViewOffset(w, h, w * 0.2, 0, w, h); // la tarjeta va a la derecha
    else camara.clearViewOffset();
    camara.updateProjectionMatrix();
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  monitorECG.alLatir = () => onLatido && onLatido();
  let ultimo = performance.now();
  let t = 0;
  let raf = 0;
  let cuadros = 0;
  let acumulado = 0;
  let medido = false;
  let ultimoReloj = 0;
  let vivo = true;

  function cuadro(ahora) {
    if (!vivo) return;
    raf = requestAnimationFrame(cuadro);
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    t += dt;

    // Movimiento lento de cámara (órbita suave)
    const ang = 0.72 + Math.sin(t * 0.09) * 0.16;
    const radio = 5.6 + Math.sin(t * 0.05) * 0.2;
    camara.position.set(objetivo.x + Math.sin(ang) * radio, 1.75 + Math.sin(t * 0.13) * 0.12, objetivo.z + Math.cos(ang) * radio);
    camara.lookAt(objetivo);

    monitorECG.actualizar(dt);
    led.visible = Math.sin(t * 6) > 0;
    const arr = polvoGeo.attributes.position.array;
    for (let i = 0; i < nPolvo; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.6 + i) * 0.0009;
      arr[i * 3] += 0.0006;
      if (arr[i * 3] > izq + 3.1) arr[i * 3] = izq + 0.3;
    }
    polvoGeo.attributes.position.needsUpdate = true;
    haz.material.opacity = 0.022 + Math.sin(t * 0.7) * 0.008;
    if (t - ultimoReloj > 1) {
      reloj.dibujar();
      ultimoReloj = t;
    }

    renderer.render(escena, camara);

    // Medición de rendimiento: si el celular es lento, pasamos al fondo 2D
    if (!medido) {
      cuadros++;
      if (cuadros > 20) acumulado += dt;
      if (cuadros === 110) {
        medido = true;
        const fps = 90 / acumulado;
        if (fps < 28 && onLento) onLento(fps);
      }
    }
  }
  raf = requestAnimationFrame(cuadro);

  return {
    destruir() {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', ajustar);
      escena.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
    pausar() {
      vivo = false;
      cancelAnimationFrame(raf);
    },
    reanudar() {
      if (vivo) return;
      vivo = true;
      ultimo = performance.now();
      raf = requestAnimationFrame(cuadro);
    },
  };
}
