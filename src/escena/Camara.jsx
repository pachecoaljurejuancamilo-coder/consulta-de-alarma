// Cámara en tercera persona suave con colisión contra paredes, más tomas de cine.
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { Vector3 } from 'three';
import { G, ahora } from '../juego/mundo.js';

const objetivo = new Vector3();
const deseada = new Vector3();
const mira = new Vector3();
const dir = new Vector3();
const derecha = new Vector3();
const DESFASES = [
  [0, 0],
  [0.45, 0],
  [-0.45, 0],
  [0, 0.35],
  [0, -0.3],
];

export default function Camara() {
  const { camera, size } = useThree();
  const { world, rapier } = useRapier();
  const distSuave = useRef(5.6);
  const miraSuave = useRef(new Vector3(0, 2, 10));
  const inicioCine = useRef({ modo: null, t: 0 });

  useFrame((state, dtReal) => {
    const dt = Math.min(dtReal, 0.1);
    const c = G.camara;
    const j = G.jugador;
    const E = G.entrada;
    const t = ahora();
    const vertical = size.height > size.width;
    const fov = vertical ? 78 : E.tactil ? 66 : 60;
    if (Math.abs(camera.fov - fov) > 0.1) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (inicioCine.current.modo !== c.modo) inicioCine.current = { modo: c.modo, t };

    if (c.modo === 'libre') {
      const sens = E.tactil ? 0.0055 : 0.0026;
      if (E.lookDx || E.lookDy) c.ultimoArrastre = t;
      c.yaw -= E.lookDx * sens;
      c.pitch = Math.max(-0.2, Math.min(1.0, c.pitch + E.lookDy * sens));
      // En celular, la cámara se acomoda sola detrás del jugador al correr
      if (E.tactil && t - c.ultimoArrastre > 1.2 && j.velocidadActual > 2 && t > j.disparoHasta) {
        let d = j.yaw - c.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        if (Math.abs(d) < 2.3) c.yaw += d * Math.min(1, dt * 1.1);
      }
      const jefe = c.jefe;
      if (jefe) c.pitch = Math.max(-0.12, Math.min(0.55, c.pitch));
      const dist = (jefe ? 6.8 : c.dist) + (vertical ? 1.2 : 0);
      objetivo.set(j.pos.x, j.pos.y + (jefe ? 1.9 : 1.55), j.pos.z);
      dir.set(Math.sin(c.yaw) * Math.cos(c.pitch), -Math.sin(c.pitch), Math.cos(c.yaw) * Math.cos(c.pitch));
      derecha.set(-Math.cos(c.yaw), 0, Math.sin(c.yaw));
      objetivo.addScaledVector(derecha, 0.35);
      // Colisión de la cámara con muros
      // Colisión: varios rayos (centro y bordes) contra los cuerpos fijos del escenario
      let d = dist;
      try {
        const fijo = rapier.RigidBodyType?.Fixed ?? 1;
        const filtro = (col) => col.parent()?.bodyType() === fijo;
        for (const [ox, oy] of DESFASES) {
          const o = { x: objetivo.x + derecha.x * ox, y: objetivo.y + oy, z: objetivo.z + derecha.z * ox };
          const rayo = new rapier.Ray(o, { x: -dir.x, y: -dir.y, z: -dir.z });
          const golpe = world.castRay(rayo, dist + 0.3, true, undefined, undefined, undefined, undefined, filtro);
          if (golpe) d = Math.min(d, Math.max(0.8, (golpe.timeOfImpact ?? golpe.toi) - 0.35));
        }
      } catch {
        /* sin colisión */
      }
      // Acercar rápido, alejar despacio
      const k = d < distSuave.current ? 1 - Math.exp(-25 * dt) : 1 - Math.exp(-4 * dt);
      distSuave.current += (d - distSuave.current) * k;
      deseada.copy(objetivo).addScaledVector(dir, -distSuave.current);
      camera.position.copy(deseada);
      mira.copy(objetivo).addScaledVector(dir, 10);
      miraSuave.current.copy(mira);
      camera.lookAt(mira);
    } else if (c.modo === 'cine' && c.cine) {
      const p = Math.min(1, (t - inicioCine.current.t) / 3);
      const suave = p * p * (3 - 2 * p);
      deseada.copy(c.cine.pos).addScaledVector(c.cine.deriva || dir.set(0, 0, 0), suave);
      camera.position.lerp(deseada, 1 - Math.exp(-6 * dt));
      miraSuave.current.lerp(c.cine.mira, 1 - Math.exp(-8 * dt));
      camera.lookAt(miraSuave.current);
    } else if (c.modo === 'carrera') {
      deseada.set(j.pos.x + 6.8, j.pos.y + 3.3, j.pos.z * 0.6);
      if (t - inicioCine.current.t < 0.1) camera.position.copy(deseada);
      camera.position.lerp(deseada, 1 - Math.exp(-10 * dt));
      mira.set(j.pos.x - 8, j.pos.y + 1.4, j.pos.z * 0.85);
      miraSuave.current.lerp(mira, 1 - Math.exp(-10 * dt));
      camera.lookAt(miraSuave.current);
      c.yaw = -Math.PI / 2;
    } else if (c.modo === 'resultados') {
      // Toma cinematográfica: la cámara oscila frente al avatar y lo deja a la izquierda del panel
      const a = Math.sin(t * 0.25) * 0.85;
      deseada.set(j.pos.x + Math.cos(a) * 5.2, j.pos.y + 1.6 + Math.sin(t * 0.3) * 0.25, j.pos.z + Math.sin(a) * 5.2);
      camera.position.lerp(deseada, 1 - Math.exp(-3 * dt));
      dir.set(j.pos.x - camera.position.x, 0, j.pos.z - camera.position.z).normalize();
      derecha.set(-dir.z, 0, dir.x);
      // Deja al avatar en el lado izquierdo de la pantalla (el panel de resultados ocupa la derecha)
      const tanH = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
      const fx = size.width < 900 ? 0.17 : 0.26;
      const dCam = Math.hypot(j.pos.x - camera.position.x, j.pos.z - camera.position.z);
      const corrimiento = vertical ? 0 : dCam * (0.5 - fx) * 2 * tanH;
      mira.set(j.pos.x + derecha.x * corrimiento, j.pos.y + 1.15, j.pos.z + derecha.z * corrimiento);
      miraSuave.current.lerp(mira, 1 - Math.exp(-5 * dt));
      camera.lookAt(miraSuave.current);
    } else {
      // Órbita de presentación sobre la plaza (pantalla de selección)
      const a = Math.sin(t * 0.09) * 0.65;
      deseada.set(Math.sin(a) * 15, 5.4 + Math.sin(t * 0.13) * 0.8, 24 + Math.cos(a) * 12);
      camera.position.lerp(deseada, 1 - Math.exp(-2 * dt));
      mira.set(0, 4.2, 8);
      miraSuave.current.lerp(mira, 1 - Math.exp(-3 * dt));
      camera.lookAt(miraSuave.current);
    }

    // Temblor de cámara
    if (c.shake > 0.001) {
      const s = c.shake * 0.35;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      camera.position.z += (Math.random() - 0.5) * s;
      c.shake *= Math.exp(-7 * dt);
    }
  }, -1);

  return null;
}
