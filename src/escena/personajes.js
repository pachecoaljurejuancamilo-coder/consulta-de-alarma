// Utilidades para personajes animados (modelos de Quaternius, CC0).
import { AnimationMixer, Box3, Color, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, PlaneGeometry, Quaternion, Vector3, TorusGeometry, MeshBasicMaterial, Group } from 'three';
import { clone as clonarEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { texturaEscudo } from './texturasCanvas.js';

export const MODELOS = {
  mujer: 'modelos/estudiante_mujer.glb',
  barba: 'modelos/estudiante_hombre_barba.glb',
  corto: 'modelos/estudiante_hombre_corto.glb',
  npc_mujer_a: 'modelos/npc_mujer_a.glb',
  npc_mujer_b: 'modelos/npc_mujer_b.glb',
  npc_mujer_c: 'modelos/npc_mujer_c.glb',
  npc_hombre_a: 'modelos/npc_hombre_a.glb',
  npc_hombre_b: 'modelos/npc_hombre_b.glb',
  fantasma: 'modelos/fantasma.glb',
};

export const UNIFORME = '#3a3c42';

// Nombre corto de una animación: 'CharacterArmature|Run' -> 'Run'; 'HumanArmature|Female_Walk' -> 'Walk'
export const nombreCorto = (n) => n.split('|').pop().replace(/^(Female|Man)_/, '');

// Clona un modelo con esqueleto propio y materiales propios (para recolorear)
export function clonarModelo(gltf, colores = {}, { sombra = true, alto = null } = {}) {
  const raiz = clonarEsqueleto(gltf.scene);
  raiz.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = sombra;
    o.receiveShadow = false;
    o.frustumCulled = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const nuevos = mats.map((m) => {
      const n = new MeshStandardMaterial({
        name: m.name,
        color: m.color ? m.color.clone() : new Color('#ffffff'),
        map: m.map || null,
        roughness: 0.78,
        metalness: 0,
        transparent: m.transparent,
        opacity: m.opacity,
      });
      if (colores[m.name]) n.color.set(colores[m.name]);
      return n;
    });
    o.material = Array.isArray(o.material) ? nuevos : nuevos[0];
  });
  if (alto) {
    raiz.updateMatrixWorld(true);
    const caja = new Box3().setFromObject(raiz);
    const h = caja.max.y - caja.min.y;
    if (h > 0) raiz.scale.setScalar(alto / h);
  }
  return raiz;
}

// Controlador de animaciones con transiciones suaves
export class Animador {
  constructor(raiz, clips) {
    this.mixer = new AnimationMixer(raiz);
    this.acciones = {};
    for (const c of clips) this.acciones[nombreCorto(c.name)] = this.mixer.clipAction(c);
    this.actual = null;
    this.nombre = '';
  }
  tiene(n) {
    return !!this.acciones[n];
  }
  play(nombre, { fundido = 0.18, escala = 1, unaVez = false, desde = null } = {}) {
    const a = this.acciones[nombre];
    if (!a) return;
    a.timeScale = escala;
    if (this.nombre === nombre && !desde) return;
    a.reset();
    a.setLoop(unaVez ? LoopOnce : LoopRepeat, Infinity);
    a.clampWhenFinished = unaVez;
    if (desde !== null) a.time = desde;
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.play();
    if (this.actual && this.actual !== a) this.actual.crossFadeTo(a, fundido, false);
    this.actual = a;
    this.nombre = nombre;
  }
  update(dt) {
    this.mixer.update(dt);
  }
}

// Pega un objeto a un hueso conservando una posición/orientación definidas en el espacio del modelo en reposo
export function pegarAHueso(raiz, nombreHueso, objeto, posModelo, rotYModelo = 0) {
  let hueso = null;
  raiz.traverse((o) => {
    if (!hueso && o.isBone && o.name === nombreHueso) hueso = o;
  });
  if (!hueso) return false;
  raiz.updateMatrixWorld(true);
  // Posición y orientación deseadas en espacio mundo (con la raíz en su transformación actual)
  const posMundo = posModelo.clone().applyMatrix4(raiz.matrixWorld);
  const qRaiz = new Quaternion();
  raiz.getWorldQuaternion(qRaiz);
  const qDeseada = qRaiz.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotYModelo));
  const qHueso = new Quaternion();
  hueso.getWorldQuaternion(qHueso);
  const escHueso = new Vector3();
  hueso.getWorldScale(escHueso);
  hueso.add(objeto);
  objeto.position.copy(hueso.worldToLocal(posMundo));
  objeto.quaternion.copy(qHueso.invert().multiply(qDeseada));
  objeto.scale.set(1 / escHueso.x, 1 / escHueso.y, 1 / escHueso.z);
  return true;
}

// Viste al estudiante: uniforme gris oscuro, zapatos blancos, cabello, escudo dorado y gafas
export function vestirEstudiante(gltf, avatar) {
  const PANTALON = '#33353b';
  const colores = {
    mujer: { White: UNIFORME, Orange: PANTALON, Grey: '#ececec', Hair_Blond: avatar.pelo, Skin: avatar.piel },
    barba: { Green: UNIFORME, LightGreen: UNIFORME, Brown2: PANTALON, Brown: PANTALON, Black: '#f0f0f0', Grey: '#dcdcdc', Hair: avatar.pelo, Eyebrows: avatar.pelo, Skin: avatar.piel },
    corto: { Suit: UNIFORME, White: '#2c2e33', Tie: UNIFORME, Black: '#f0f0f0', Hair: avatar.pelo, Eyebrows: avatar.pelo, Skin: avatar.piel },
  }[avatar.modelo];
  const raiz = clonarModelo(gltf, colores);
  // El aventurero trae morral: se oculta
  raiz.traverse((o) => {
    if (o.isMesh && /Backpack/i.test(o.name + (o.parent?.name || ''))) o.visible = false;
  });
  // Escudo dorado en el pecho (lado izquierdo)
  const escudo = new Mesh(
    new PlaneGeometry(0.11, 0.11),
    new MeshStandardMaterial({ map: texturaEscudo(), transparent: true, alphaTest: 0.3, metalness: 0.6, roughness: 0.3, emissive: '#7a5608', emissiveIntensity: 0.35 }),
  );
  const pecho = { mujer: new Vector3(0.085, 1.33, 0.155), barba: new Vector3(0.1, 1.36, 0.19), corto: new Vector3(0.1, 1.37, 0.18) }[avatar.modelo];
  pegarAHueso(raiz, 'Chest', escudo, pecho, 0);
  if (avatar.gafas) {
    const gafas = new Group();
    const mat = new MeshBasicMaterial({ color: '#111111' });
    for (const lado of [-1, 1]) {
      const aro = new Mesh(new TorusGeometry(0.032, 0.006, 6, 16), mat);
      aro.position.set(lado * 0.04, 0, 0);
      gafas.add(aro);
    }
    const puente = new Mesh(new PlaneGeometry(0.02, 0.006), mat);
    gafas.add(puente);
    pegarAHueso(raiz, 'Head', gafas, new Vector3(0, 1.655, 0.115), 0);
  }
  return raiz;
}
