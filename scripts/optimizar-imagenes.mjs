// Convierte las fotos de assets/ a WebP livianas en public/assets/ (se corre con: npm run imagenes)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/assets', { recursive: true });
const tutores = ['liz', 'gino', 'juan_camilo'];
for (const t of tutores) {
  await sharp(`assets/${t}.png`).resize({ height: 900 }).webp({ quality: 82, alphaQuality: 90 }).toFile(`public/assets/${t}.webp`);
  await sharp(`assets/${t}_retrato.png`).resize({ width: 240 }).webp({ quality: 85, alphaQuality: 90 }).toFile(`public/assets/${t}_retrato.webp`);
}
await sharp('assets/logo_udc.jpg').png().toFile('public/assets/logo_udc.png');
console.log('Imágenes optimizadas en public/assets/');
