// Objetos repetidos dibujados con instancing (palmeras, bancas, arbustos, sillas…)
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { InstancedMesh, Matrix4, Object3D, Color, MeshStandardMaterial, BufferAttribute } from 'three';

const dummy = new Object3D();

// Extrae (geometría con la transformación horneada, materiales) de cada malla del GLTF
export function usePartes(url, colores = {}) {
  const gltf = useGLTF(url, false, true);
  return useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const partes = [];
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const geo = aFlotantes(o.geometry.clone());
      geo.applyMatrix4(o.matrixWorld);
      const mats = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => {
        const n = new MeshStandardMaterial({
          name: m.name,
          color: m.color ? m.color.clone() : new Color('#fff'),
          map: m.map || null,
          roughness: 0.85,
          metalness: 0,
          alphaTest: m.alphaTest || (m.map ? 0.4 : 0),
          transparent: false,
          side: m.side,
        });
        if (colores[m.name]) n.color.set(colores[m.name]);
        if (colores._emisivo && colores._emisivo[m.name]) {
          n.emissive.set(colores._emisivo[m.name]);
          n.emissiveIntensity = 2.2;
          n.toneMapped = false;
        }
        return n;
      });
      partes.push({ geo, mat: mats.length === 1 ? mats[0] : mats });
    });
    // Altura del modelo (para escalar)
    geoAltura(partes);
    return partes;
  }, [gltf, JSON.stringify(colores)]);
}

// Los modelos comprimidos guardan posiciones como enteros normalizados; antes de
// aplicarles una transformación hay que pasarlas a flotantes (si no, se recortan).
function aFlotantes(geo) {
  for (const nombre of ['position', 'normal']) {
    const a = geo.getAttribute(nombre);
    if (!a) continue;
    if (a.array instanceof Float32Array && !a.normalized && !a.isInterleavedBufferAttribute) continue;
    const arr = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) arr[i * a.itemSize + k] = a.getComponent(i, k);
    geo.setAttribute(nombre, new BufferAttribute(arr, a.itemSize));
  }
  return geo;
}

function geoAltura(partes) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of partes) {
    p.geo.computeBoundingBox();
    min = Math.min(min, p.geo.boundingBox.min.y);
    max = Math.max(max, p.geo.boundingBox.max.y);
  }
  partes.altura = max - min;
  partes.base = min;
}

// transformaciones: [{x, y, z, ry, s, sy, color}]
export function Instancias({ url, transformaciones, colores, alto = null, sombra = true, recibe = true }) {
  const partes = usePartes(url, colores);
  const escalaBase = alto && partes.altura ? alto / partes.altura : 1;
  return partes.map((p, i) => (
    <MallaInstanciada key={i} geo={p.geo} mat={p.mat} transformaciones={transformaciones} escalaBase={escalaBase} base={partes.base} sombra={sombra} recibe={recibe} />
  ));
}

export function MallaInstanciada({ geo, mat, transformaciones, escalaBase = 1, base = 0, sombra = true, recibe = true }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    transformaciones.forEach((t, i) => {
      const s = (t.s ?? 1) * escalaBase;
      dummy.position.set(t.x, (t.y ?? 0) - base * s * (t.sy ?? 1), t.z);
      dummy.rotation.set(t.rx ?? 0, t.ry ?? 0, t.rz ?? 0);
      dummy.scale.set(s * (t.sx ?? 1), s * (t.sy ?? 1), s * (t.sz ?? 1));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (t.color) m.setColorAt(i, new Color(t.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [transformaciones, escalaBase, base]);
  return <instancedMesh ref={ref} args={[geo, mat, transformaciones.length]} castShadow={sombra} receiveShadow={recibe} frustumCulled={false} />;
}

// Cajas instanciadas (geometría de caja unitaria escalada)
export function CajasInstanciadas({ cajas, material, sombra = true, recibe = true }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat4 = new Matrix4();
    cajas.forEach((c, i) => {
      dummy.position.set(c.x, c.y, c.z);
      dummy.rotation.set(c.rx ?? 0, c.ry ?? 0, c.rz ?? 0);
      dummy.scale.set(c.sx, c.sy, c.sz);
      dummy.updateMatrix();
      mat4.copy(dummy.matrix);
      m.setMatrixAt(i, mat4);
      if (c.color) m.setColorAt(i, new Color(c.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [cajas]);
  return (
    <instancedMesh ref={ref} args={[undefined, material, cajas.length]} castShadow={sombra} receiveShadow={recibe}>
      <boxGeometry />
    </instancedMesh>
  );
}

export { InstancedMesh };
