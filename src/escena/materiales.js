// Materiales PBR compartidos (texturas de Poly Haven, CC0) y geometría con UV en metros.
import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { BoxGeometry, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Color } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const RUTAS = {
  plaza: ['texturas/plaza_color.webp', 'texturas/plaza_normal.webp', 'texturas/plaza_rugosidad.webp'],
  piso: ['texturas/piso_color.webp', 'texturas/piso_normal.webp', 'texturas/piso_rugosidad.webp'],
  estuco: ['texturas/estuco_color.webp', 'texturas/estuco_normal.webp', 'texturas/estuco_rugosidad.webp'],
  tejas: ['texturas/tejas_color.webp', 'texturas/tejas_normal.webp', 'texturas/tejas_rugosidad.webp'],
  madera: ['texturas/madera_color.webp', 'texturas/madera_normal.webp', 'texturas/madera_rugosidad.webp'],
};

// Tamaño (m) que cubre una repetición de la textura
export const TILE = { plaza: 3.2, piso: 2.6, estuco: 2.4, tejas: 2.2, madera: 3, liso: 4 };

// Definición de cada material: textura base y color
const DEF = {
  plaza: { tex: 'plaza', color: '#f2e6d8', rugosidad: 0.95 },
  piso: { tex: 'piso', color: '#f4efe9', rugosidad: 0.6 },
  muroExt: { tex: 'estuco', color: '#efe3d0' },
  muroInt: { tex: 'estuco', color: '#f7f2ea' },
  columna: { tex: 'estuco', color: '#f6e8d0' },
  muroJardin: { tex: 'estuco', color: '#f0dcc0' },
  fachadaAmarilla: { tex: 'estuco', color: '#ecbb47' },
  fachadaCoral: { tex: 'estuco', color: '#ec7f66' },
  fachadaCrema: { tex: 'estuco', color: '#f6e6cb' },
  fachadaAzul: { tex: 'estuco', color: '#5b98cc' },
  fachadaRosa: { tex: 'estuco', color: '#ea93ab' },
  acentoFarmacia: { tex: 'estuco', color: '#9fdcbc' },
  acentoGine: { tex: 'estuco', color: '#f6b5c6' },
  zocalo: { tex: null, color: '#4fa596', rugosidad: 0.5 },
  recepcion: { tex: null, color: '#8e1b35', rugosidad: 0.45 },
  mesonClaro: { tex: null, color: '#f5f0ea', rugosidad: 0.35 },
  cortina: { tex: null, color: '#9cc8e6', rugosidad: 0.9 },
  mostrador: { tex: null, color: '#f3eee8', rugosidad: 0.4 },
  tejas: { tex: 'tejas', color: '#ffffff', rugosidad: 0.85 },
  madera: { tex: 'madera', color: '#ffffff', rugosidad: 0.8 },
  maderaOscura: { tex: 'madera', color: '#7a4f33', rugosidad: 0.75 },
  azotea: { tex: 'estuco', color: '#c9c0b5' },
  edificio: { tex: 'estuco', color: '#ffffff' },
  suelo: { tex: 'plaza', color: '#cbb89c', rugosidad: 1 },
};

export function useMateriales() {
  const lista = Object.values(RUTAS).flat();
  const texs = useTexture(lista);
  return useMemo(() => {
    const porNombre = {};
    Object.keys(RUTAS).forEach((k, i) => {
      const [c, n, r] = texs.slice(i * 3, i * 3 + 3);
      c.colorSpace = SRGBColorSpace;
      for (const t of [c, n, r]) {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = 4;
        t.needsUpdate = true;
      }
      porNombre[k] = { c, n, r };
    });
    const mats = {};
    for (const [nombre, d] of Object.entries(DEF)) {
      const t = d.tex ? porNombre[d.tex] : null;
      mats[nombre] = new MeshStandardMaterial({
        name: nombre,
        color: new Color(d.color),
        map: t?.c || null,
        normalMap: t?.n || null,
        roughnessMap: t?.r || null,
        roughness: d.rugosidad ?? 1,
        metalness: 0,
      });
      mats[nombre].userData.tile = d.tex ? TILE[d.tex] : TILE.liso;
    }
    return mats;
  }, [texs]);
}

// Caja con UV en metros (la textura se repite según el tamaño real)
export function geometriaCaja(sx, sy, sz, tile = 2.5) {
  const g = new BoxGeometry(sx, sy, sz);
  const uv = g.attributes.uv;
  const dims = [
    [sz, sy],
    [sz, sy],
    [sx, sz],
    [sx, sz],
    [sx, sy],
    [sx, sy],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  return g;
}

// Agrupa una lista de cajas {x,y,z,sx,sy,sz,mat} en una geometría por material
export function fusionarCajas(cajas, mats) {
  const grupos = {};
  for (const c of cajas) {
    if (!c.mat) continue;
    const tile = mats[c.mat]?.userData.tile || 2.5;
    const g = geometriaCaja(c.sx, c.sy, c.sz, tile);
    if (c.rotY) g.rotateY(c.rotY);
    if (c.rotX) g.rotateX(c.rotX);
    if (c.rotZ) g.rotateZ(c.rotZ);
    g.translate(c.x, c.y, c.z);
    (grupos[c.mat] ||= []).push(g);
  }
  return Object.entries(grupos).map(([mat, geos]) => {
    const g = mergeGeometries(geos, false);
    geos.forEach((x) => x.dispose());
    return { mat, geo: g };
  });
}

// Multiplica las UV de una geometría (para repetir texturas en cilindros y cajas grandes)
export function escalarUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
  return geo;
}
