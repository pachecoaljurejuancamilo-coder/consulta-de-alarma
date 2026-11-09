// Descarga los recursos 3D gratuitos (CC0) y los optimiza para la web.
// Uso: npm run recursos
// - Los originales quedan en recursos-originales/ (no se suben a git).
// - Los optimizados quedan en public/modelos, public/texturas y public/hdri.
// - Regenera CREDITOS.md con la licencia de cada recurso.
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, meshopt, resample, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const ORIG = path.join(RAIZ, 'recursos-originales');
const PP = 'https://static.poly.pizza/';
const PH = 'https://dl.polyhaven.org/file/ph-assets/';

// anims: animaciones que se conservan (por nombre parcial). null = todas.
const MODELOS = [
  // Personajes jugables (mismo esqueleto). Se recolorean en el juego con uniforme gris oscuro.
  { id: 'estudiante_mujer', url: PP + 'ba7a1955-ea51-4cb9-a561-188bdef0a6c7.glb', pagina: 'https://poly.pizza/m/qJ2gsTUBHL', nombre: 'Animated Woman', autor: 'Quaternius', anims: ['Idle', 'Walk', 'Run', 'Roll', 'Run_Shoot', 'Gun_Shoot', 'HitRecieve', 'Wave'] },
  { id: 'estudiante_hombre_barba', url: PP + 'bbe369ee-a686-42c7-adad-14356f5f2f15.glb', pagina: 'https://poly.pizza/m/5EGWBMpuXq', nombre: 'Adventurer', autor: 'Quaternius', anims: ['Idle', 'Walk', 'Run', 'Roll', 'Run_Shoot', 'Gun_Shoot', 'HitRecieve', 'Wave'] },
  { id: 'estudiante_hombre_corto', url: PP + 'e599abbe-7d73-488c-9d7e-3ead281e705c.glb', pagina: 'https://poly.pizza/m/JFrLIKqvCH', nombre: 'Business Man', autor: 'Quaternius', anims: ['Idle', 'Walk', 'Run', 'Roll', 'Run_Shoot', 'Gun_Shoot', 'HitRecieve', 'Wave'] },
  // Personajes no jugables (pacientes, enfermería y médicos)
  { id: 'npc_mujer_a', url: PP + '51d5abdd-bb87-4b8d-9967-21738ffb8437.glb', pagina: 'https://poly.pizza/m/jpKRgGDxhk', nombre: 'Woman Casual', autor: 'Quaternius', anims: ['Sitting', 'Idle', 'Walk'] },
  { id: 'npc_mujer_b', url: PP + '9a6a3e55-23ce-4d5c-89bc-7d3f30307ed0.glb', pagina: 'https://poly.pizza/m/XqzeZGB7iU', nombre: 'Woman in Tank Top', autor: 'Quaternius', anims: ['Sitting', 'Idle', 'Walk'] },
  { id: 'npc_mujer_c', url: PP + 'a642af96-e239-4c5f-b50d-7661ff51deec.glb', pagina: 'https://poly.pizza/m/zMyPlQXBzq', nombre: 'Woman in Dress', autor: 'Quaternius', anims: ['Sitting', 'Idle', 'Walk'] },
  { id: 'npc_hombre_a', url: PP + '3746be88-6799-4817-929b-6bc067c47caa.glb', pagina: 'https://poly.pizza/m/HMnuH5geEG', nombre: 'Man', autor: 'Quaternius', anims: ['Sitting', 'Idle', 'Walk'] },
  { id: 'npc_hombre_b', url: PP + '66b57880-bcb0-479a-8d72-5c3e88afaa39.glb', pagina: 'https://poly.pizza/m/mQnGoME1ez', nombre: 'Man in Suit', autor: 'Quaternius', anims: ['Sitting', 'Idle', 'Walk'] },
  // Mitos y jefe final
  { id: 'fantasma', url: PP + '810f60a2-6e45-4c4e-a0d5-da91cd7288bd.glb', pagina: 'https://poly.pizza/m/Iip30bDHmu', nombre: 'Ghost', autor: 'Quaternius', anims: ['Flying_Idle', 'Fast_Flying', 'Punch', 'HitReact', 'Death'] },
  // Escenario
  { id: 'palmera_1', url: PP + '4c17decd-3087-4afe-9611-cfd92cca47cd.glb', pagina: 'https://poly.pizza/m/A6cKJYFsIb', nombre: 'Palm Tree', autor: 'Quaternius', tex: 512 },
  { id: 'palmera_2', url: PP + '21d44b5b-efef-4abd-96ad-fc59e4ad373b.glb', pagina: 'https://poly.pizza/m/DsrrAYmucG', nombre: 'Palm Tree', autor: 'Quaternius', tex: 512 },
  { id: 'palmera_3', url: PP + '66cd7d94-abba-471e-8d8b-c8ad30aa5c70.glb', pagina: 'https://poly.pizza/m/P0tgwyXBgr', nombre: 'Palm Tree', autor: 'Quaternius', tex: 512 },
  { id: 'arbusto_flores', url: PP + 'af83abca-9b41-4229-9652-e336a5f5eaba.glb', pagina: 'https://poly.pizza/m/U1ymDy8tbY', nombre: 'Bush with Flowers', autor: 'Quaternius', tex: 512 },
  { id: 'banca', url: PP + '1361c268-20f7-4e73-a931-ce434c6b503e.glb', pagina: 'https://poly.pizza/m/jLxjFxFRpw', nombre: 'Bench', autor: 'Quaternius' },
  { id: 'silla_oficina', url: PP + 'ac2301f3-af86-435a-885a-d8f1a32f9f76.glb', pagina: 'https://poly.pizza/m/UfKvrZBK6C', nombre: 'Office Chair', autor: 'Quaternius' },
  { id: 'estante', url: PP + '511a3bba-fe26-475d-8a1b-0307e929d5a1.glb', pagina: 'https://poly.pizza/m/TDgvIuorcX', nombre: 'Shelf Tall', autor: 'Quaternius' },
  { id: 'escritorio', url: PP + '91c2bf8d-0876-4801-abd3-8dd5d017ecbd.glb', pagina: 'https://poly.pizza/m/V86Go2rlnq', nombre: 'Desk', autor: 'Quaternius' },
  { id: 'farol', url: PP + '9a8aac3e-d1ee-4860-b294-edca62ef50be.glb', pagina: 'https://poly.pizza/m/nFwrlcLvM5', nombre: 'Street Light', autor: 'Quaternius' },
];

const TEXTURAS = [
  { id: 'plaza', ph: 'patterned_paving', nombre: 'Patterned Paving', autor: 'Poly Haven', tam: 1024 },
  { id: 'piso', ph: 'terrazzo_tiles', nombre: 'Terrazzo Tiles', autor: 'Poly Haven', tam: 1024 },
  { id: 'estuco', ph: 'white_stucco', nombre: 'White Stucco', autor: 'Poly Haven', tam: 512 },
  { id: 'tejas', ph: 'clay_roof_tiles', nombre: 'Clay Roof Tiles', autor: 'Poly Haven', tam: 512 },
  { id: 'madera', ph: 'wood_floor_deck', nombre: 'Wood Floor Deck', autor: 'Poly Haven', tam: 1024 },
];

const HDRI = { id: 'atardecer', ph: 'qwantani_sunset_puresky', nombre: 'Qwantani Sunset (Pure Sky)', autor: 'Greg Zaal y Jarod Guest (Poly Haven)' };

async function descargar(url, destino) {
  if (fs.existsSync(destino) && fs.statSync(destino).size > 0) return;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo descargar ${url}: ${r.status}`);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  console.log('  ↓', path.basename(destino));
}

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';

async function main() {
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

  const dirModelos = path.join(RAIZ, 'public', 'modelos');
  fs.mkdirSync(dirModelos, { recursive: true });
  console.log('Modelos:');
  for (const m of MODELOS) {
    const orig = path.join(ORIG, 'modelos', m.id + '.glb');
    await descargar(m.url, orig);
    const doc = await io.read(orig);
    if (m.anims) {
      for (const a of doc.getRoot().listAnimations()) {
        const corto = a.getName().split('|').pop();
        if (!m.anims.some((n) => corto === n || corto.endsWith('_' + n))) a.dispose();
      }
      // Algunos archivos traen cada animación duplicada (con y sin prefijo): conserva una.
      const vistos = new Set();
      for (const a of doc.getRoot().listAnimations()) {
        const corto = a.getName().split('|').pop();
        if (vistos.has(corto)) a.dispose();
        else vistos.add(corto);
      }
    }
    await doc.transform(
      dedup(),
      prune(),
      weld(),
      resample(),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [m.tex || 512, m.tex || 512], quality: 82 }),
      quantize(),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    );
    const destino = path.join(dirModelos, m.id + '.glb');
    await io.write(destino, doc);
    console.log(`  ✓ ${m.id}: ${kb(orig)} → ${kb(destino)} (${doc.getRoot().listAnimations().map((a) => a.getName().split('|').pop()).join(', ') || 'sin animaciones'})`);
  }

  const dirTex = path.join(RAIZ, 'public', 'texturas');
  fs.mkdirSync(dirTex, { recursive: true });
  console.log('Texturas:');
  for (const t of TEXTURAS) {
    for (const [mapa, sufijo] of [['diff', 'color'], ['nor_gl', 'normal'], ['rough', 'rugosidad']]) {
      const url = `${PH}Textures/jpg/1k/${t.ph}/${t.ph}_${mapa}_1k.jpg`;
      const orig = path.join(ORIG, 'texturas', `${t.ph}_${mapa}_1k.jpg`);
      await descargar(url, orig);
      const destino = path.join(dirTex, `${t.id}_${sufijo}.webp`);
      await sharp(orig).resize(t.tam, t.tam).webp({ quality: mapa === 'diff' ? 80 : 75 }).toFile(destino);
      console.log(`  ✓ ${t.id}_${sufijo}: ${kb(destino)}`);
    }
  }

  console.log('HDRI:');
  const dirHdri = path.join(RAIZ, 'public', 'hdri');
  fs.mkdirSync(dirHdri, { recursive: true });
  const origHdri = path.join(ORIG, 'hdri', HDRI.ph + '_1k.hdr');
  await descargar(`${PH}HDRIs/hdr/1k/${HDRI.ph}_1k.hdr`, origHdri);
  fs.copyFileSync(origHdri, path.join(dirHdri, HDRI.id + '.hdr'));
  console.log(`  ✓ ${HDRI.id}: ${kb(origHdri)}`);

  // ---- CREDITOS.md ----
  const filas = [
    ...MODELOS.map((m) => `| Modelo 3D | ${m.nombre} (\`public/modelos/${m.id}.glb\`) | ${m.autor} | CC0 1.0 | [enlace](${m.pagina}) · [descarga directa](${m.url}) |`),
    ...TEXTURAS.map((t) => `| Textura PBR | ${t.nombre} (\`public/texturas/${t.id}_*.webp\`) | ${t.autor} | CC0 1.0 | [enlace](https://polyhaven.com/a/${t.ph}) |`),
    `| HDRI | ${HDRI.nombre} (\`public/hdri/${HDRI.id}.hdr\`) | ${HDRI.autor} | CC0 1.0 | [enlace](https://polyhaven.com/a/${HDRI.ph}) |`,
  ];
  const md = `# Créditos y licencias

Todos los recursos externos del juego son de dominio público (**CC0 1.0**): se pueden usar, modificar y publicar sin pedir permiso ni pagar. Aun así, agradecemos a sus autores.

Los archivos originales se descargan con \`npm run recursos\` desde los enlaces de esta tabla y se comprimen (Meshopt + WebP) para que el juego cargue rápido.

| Tipo | Recurso | Autor | Licencia | Fuente |
|---|---|---|---|---|
${filas.join('\n')}

## Creado para este juego (sin licencia externa)

- Hospital, consultorios, fachadas, balcones, camillas, televisores con ECG, cristales, relojes rotos, pasarela y portal: geometría generada por código (\`src/escena/\`).
- Música dinámica: generada en el navegador con [Tone.js](https://tonejs.github.io/) (licencia MIT).
- Efectos de sonido: generados en el navegador con [jsfxr](https://github.com/chr15m/jsfxr) (licencia Unlicense).
- Tipografías: Baloo 2 y Nunito (SIL Open Font License), servidas desde el propio juego con [Fontsource](https://fontsource.org/).
- Fotos de los integrantes (\`public/assets/\`): propiedad del equipo, usadas con su permiso.

## Librerías

React, React Three Fiber, drei, @react-three/rapier (Rapier), @react-three/postprocessing, three.js, zustand, nipplejs, Tone.js y jsfxr (licencias MIT, Apache 2.0 o Unlicense).
`;
  fs.writeFileSync(path.join(RAIZ, 'CREDITOS.md'), md);
  console.log('✓ CREDITOS.md');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
