# Consulta de Alarma: ¿dolor normal o endometriosis?

Juego web educativo para el taller de gamificación de la sustentación del artículo:

> *Análisis comparativo del conocimiento sobre los signos de alarma que diferencian la endometriosis de la dismenorrea en estudiantes de II, VI y VIII semestre de Medicina de la Universidad de Cartagena, periodo 2026-2.*
> Gino Petro Petro, Juan Camilo Pacheco Aljure y Liz Olivieri Jiménez · Producción y Comprensión Textual II · Programa de Medicina · Universidad de Cartagena · Docente: Karen Ortega.

## Enlaces

| | URL | QR |
|---|---|---|
| **Juego** | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/ | `qr-juego.png` |
| **Tablero en vivo** (para proyectar) | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/resultados.html | `qr-resultados.png` |
| Tablero con datos de ejemplo (para ensayar) | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/resultados.html?demo | |

## Cómo se juega (3:00 exactos)

| Etapa | Tiempo | Tutor |
|---|---|---|
| 0. Ingreso: nombre y semestre | sin tiempo | |
| 1. Consulta: 3 pacientes, marcar signos de alarma y decidir | 1:45 (35 s por paciente) | Liz |
| 2. Lo que encontramos: 4 preguntas sobre el artículo | 0:45 | Juan Camilo |
| 3. Tu opinión: 4 preguntas cortas | 0:30 (más lo que haya sobrado, hasta completar 3:00) | Gino |
| 4. Resultados, repaso de errores y ranking | no cuenta | los tres |

Si el jugador responde rápido, el juego avanza de inmediato. Si se agota el tiempo de una etapa, avanza solo. El tiempo que sobre pasa a la etapa 3, así que quien no pulse «Terminar turno» termina exactamente en 3:00. Nunca pasa de 3:00.

Puntaje: +10 por tarjeta bien clasificada, +30 por decisión clínica correcta, hasta +15 por rapidez en cada paciente, +20 por pregunta correcta. Rangos: Interno curioso (menos de 150), Residente atento (150 a 249), Especialista en alarma (250 o más).

## Editar casos, preguntas y textos

Todo el contenido está en **`src/data/contenido.js`**: pacientes, hallazgos (`tipo: 'alarma'` o `'esperable'`), explicaciones, preguntas (la **primera opción es la correcta**; en pantalla se barajan), opiniones, rangos y tiempos.

Después de editar, publica el cambio con:

```bash
npm run publicar
```

Eso compila el juego y lo sube a la rama `gh-pages`. En 1 o 2 minutos se ve en el enlace. Guarda también tu cambio en la rama `main` (`git add -A`, `git commit`, `git push`).

## Guardar respuestas en Google Sheets

Sigue **`INSTRUCCIONES_BACKEND.md`**: pega `apps-script/Code.gs` en Apps Script, publícalo como aplicación web y pega la URL en **`config.js`** de la rama `gh-pages` (se puede hacer desde la página de GitHub, sin compilar nada). Para que no se pierda en la próxima publicación, pégala también en `public/config.js`. Sin esa URL el juego funciona igual: guarda las respuestas en cada celular y las envía cuando la URL exista.

## Correrlo en tu computador

Necesitas [Node.js](https://nodejs.org) 20 o más reciente.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (por ejemplo `http://localhost:5173`). Otras órdenes:

```bash
npm run build      # genera la carpeta dist/ para publicar
npm test           # pruebas automáticas con Playwright (tardan unos 4 minutos)
npm run publicar   # compila y publica en GitHub Pages
npm run qr -- URL  # genera qr-juego.png y qr-resultados.png para esa URL
npm run imagenes   # vuelve a optimizar las fotos de assets/
```

Para probar en otro modo: agrega `?modo=2d` (fondo animado sin 3D) o `?modo=3d` a la dirección.

## Estructura

```
index.html              juego
resultados.html         tablero en vivo (se actualiza cada 5 s)
public/config.js        URL del Apps Script
src/data/contenido.js   ← casos, preguntas y textos
src/main.js             flujo del juego y cronómetro
src/escena3d.js         consultorio 3D (Three.js)
src/audio.js            sonidos con Web Audio API
src/api.js              envío de respuestas y cola sin conexión
src/tablero.js          tablero en vivo
apps-script/Code.gs     backend de Google Sheets
tests/                  pruebas de Playwright
```

## Plan B: publicar con Netlify Drop

1. Ejecuta `npm run build`.
2. Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
3. Arrastra la carpeta **`dist`** a la página. Netlify te da un enlace público.
4. Genera los QR con `npm run qr -- ENLACE_DE_NETLIFY`.

Referencias citadas en el juego: ACOG (2018); Becker et al. (2022); De Corte et al. (2025); Itani et al. (2022); Shim (2024); Tomsett et al. (2025).
