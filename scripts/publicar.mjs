// Compila el juego y lo publica en GitHub Pages (rama gh-pages).
// Uso: npm run publicar
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const remoto = execSync('git remote get-url origin').toString().trim();
const nombre = execSync('git config user.name').toString().trim() || 'Equipo';
const correo = execSync('git config user.email').toString().trim() || 'equipo@example.com';

sh('npm run build');
const dir = mkdtempSync(join(tmpdir(), 'publicar-'));
cpSync('dist', dir, { recursive: true });
writeFileSync(join(dir, '.nojekyll'), '');
sh('git init -q -b gh-pages', dir);
sh(`git -c user.name="${nombre}" -c user.email="${correo}" add -A`, dir);
sh(`git -c user.name="${nombre}" -c user.email="${correo}" commit -q -m "Publicación ${new Date().toISOString()}"`, dir);
sh(`git push -q -f ${remoto} gh-pages`, dir);
rmSync(dir, { recursive: true, force: true });
console.log('\n✓ Publicado. En 1 o 2 minutos se ve en GitHub Pages.');
