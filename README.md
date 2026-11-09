# Código Alarma 3D

Videojuego 3D de acción en tercera persona (3 minutos) para la sustentación del artículo:

> *El análisis comparativo del conocimiento sobre los signos de alarma que diferencian la endometriosis de la dismenorrea en estudiantes de II, VI y VIII semestre de Medicina de la Universidad de Cartagena, periodo 2026-2.*
> Gino Petro Petro, Juan Camilo Pacheco Aljure y Liz Olivieri Jiménez · Producción y Comprensión Textual II · Universidad de Cartagena · Docente: Karen Ortega.

## Enlaces

| | Enlace | QR |
|---|---|---|
| **Juego** | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/ | `qr-juego.png` |
| **Modo demo** (se juega solo; para proyectar) | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/?demo=1 | |
| **Tablero en vivo** (para proyectar al final) | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/resultados.html | `qr-resultados.png` |
| Tablero con datos de ejemplo (para ensayar) | https://pachecoaljurejuancamilo-coder.github.io/consulta-de-alarma/resultados.html?demo | |

## Cómo se juega

Antes de empezar se escribe el nombre, se elige el semestre y el avatar (Liz, Gino o Juan Camilo). La carga y la selección no cuentan en el tiempo: el turno dura **3:00 exactos** y el cronómetro siempre está visible. Si una fase se alarga, el juego la resuelve solo.

| Fase | Tiempo | Qué pasa | Tutor por radio |
|---|---|---|---|
| 1. Turno de urgencias | 1:45 (35 s por misión) | Tres pacientes: correr al consultorio, recoger **solo** los signos de alarma, destruir los Mitos con el Rayo de evidencia y correr a Farmacia o a Ginecología | Liz |
| 2. Jefe final | 0:45 | «El Retraso Diagnóstico»: cuatro preguntas; se dispara al cristal de la respuesta correcta | Juan Camilo |
| 3. Salida | 0:30 | Encuesta corriendo: se pasa por el arco de la respuesta | Gino |
| Resultados | no cuenta | Puntaje, rango, precisión por signo de alarma, repaso de errores y ranking | |

**Controles**

- Celular: joystick a la izquierda, arrastrar el dedo a la derecha para girar la cámara, botones Rayo, Saltar, Dash e Interactuar. Al empezar se activa la pantalla completa y se pide girar el teléfono.
- Computador: WASD para moverse, mouse para la cámara (clic para bloquear el puntero), clic para el rayo, barra espaciadora para saltar, Shift para el dash y E para interactuar.

**Puntaje:** orbe de alarma +10, orbe esperable −10, mito destruido +5, destino correcto +40, pregunta del jefe +30 y medio punto por cada punto de Credibilidad Clínica que quede al final. Rangos: Interno curioso (menos de 160), Residente atento (160 a 279) y Especialista en alarma (280 o más).

## Editar pacientes, mitos y preguntas

Todo el contenido está en **`src/data/contenido.js`**:

- `PACIENTES`: nombre, edad, consultorio, destino correcto (`'farmacia'` o `'ginecologia'`) y sus `orbes`. Cada orbe tiene `tipo: 'alarma'` o `'esperable'`, su texto, su explicación y, si aplica, el porcentaje del estudio (`estudio`). También van los mitos que aparecen en esa misión y los mensajes de Liz.
- `MITOS`: frase del fantasma y dato real que aparece al destruirlo.
- `PREGUNTAS`: preguntas del jefe. **La primera opción es la correcta** (en el juego se barajan). No cambies las cifras del artículo.
- `ENCUESTA`: las tres filas de arcos de la salida.
- `DATOS`, `TEXTOS`, `TIEMPOS`, `PUNTAJE` y `RANGOS`: consejos de la pantalla de carga, mensajes de radio, tiempos y puntaje.

Después de editar, publica con:

```bash
npm run publicar
```

Eso compila el juego y lo sube a la rama `gh-pages`; GitHub lo publica en 1 o 2 minutos. Guarda también el cambio en la rama `main` (`git add -A`, `git commit -m "…"`, `git push`).

## Guardar las respuestas en Google Sheets

Sigue **`INSTRUCCIONES_BACKEND.md`**: pega `apps-script/Code.gs` en Apps Script, publícalo como aplicación web y pega la URL en **`config.js`** (en la rama `gh-pages` para que funcione de inmediato, y en `public/config.js` para las próximas publicaciones). Sin esa URL el juego funciona igual: guarda las respuestas en cada dispositivo y las envía cuando haya conexión y URL. El modo demo no envía nada.

Cada partida envía: fecha, nombre, semestre, avatar, puntaje, rango, Credibilidad final, aciertos por misión (`m1_ok`…`m3_ok`) y por pregunta (`p1_ok`…`p4_ok`), los orbes recogidos correcta e incorrectamente (y `t_<id>` = 1 si cada hallazgo quedó bien clasificado), las tres opiniones y el tiempo.

## Correrlo en tu computador

Necesitas [Node.js](https://nodejs.org) 20.19 o más reciente.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (por ejemplo `http://localhost:5173`). Otras órdenes:

```bash
npm run build      # genera la carpeta dist/ para publicar
npm run preview    # sirve dist/ en http://localhost:4173
npm test           # pruebas con Playwright: partida demo completa en celular y escritorio (unos 5 minutos)
npm run recursos   # vuelve a descargar y comprimir los modelos, texturas y el HDRI (CC0)
npm run publicar   # compila y publica en GitHub Pages (rama gh-pages)
npm run qr -- URL  # genera qr-juego.png y qr-resultados.png para esa URL
```

Opciones en la dirección:

- `?demo=1`: el juego se juega solo de principio a fin y vuelve a empezar (añade `&loop=0` para que se detenga en los resultados).
- `?debug=1`: muestra los fps y la calidad.
- `?q=alta`, `?q=media` o `?q=baja`: fija la calidad gráfica (por defecto se ajusta sola según el rendimiento).

## Rendimiento

- Carga total de unos 11 MB (motor 3D 1,4 MB comprimido, modelos 3 MB, texturas 1,6 MB, HDRI 1 MB).
- Mientras la persona escribe su nombre y elige el avatar, el hospital termina de cargar detrás.
- Calidad automática: empieza en alta (computador) o media (celular) y baja sola si los fps no alcanzan. En baja no hay sombras ni postprocesado, hay menos partículas y menos personajes, y la resolución es menor.

## Estructura

```
index.html                juego
resultados.html           tablero en vivo (se actualiza cada 5 s)
public/config.js          URL del Apps Script
public/modelos|texturas|hdri   recursos 3D comprimidos (ver CREDITOS.md)
src/data/contenido.js     ← pacientes, mitos, preguntas, encuesta y textos
src/juego/director.js     reloj de 3:00, misiones, jefe, salida y resultados
src/juego/autopiloto.js   modo demo
src/escena/               mundo 3D (React Three Fiber, Rapier, postprocesado)
src/hud/                  interfaz del juego (HUD, minimapa, controles táctiles)
src/pantallas/            selección, cuenta regresiva y resultados
src/audio/audio.js        música dinámica (Tone.js) y efectos (jsfxr)
src/api.js                envío de respuestas y cola sin conexión
apps-script/Code.gs       backend de Google Sheets
tests/                    pruebas de Playwright
scripts/recursos.mjs      descarga y compresión de los recursos CC0
```

## Plan B: publicar con Netlify Drop

1. Ejecuta `npm run build`.
2. Entra a [app.netlify.com/drop](https://app.netlify.com/drop).
3. Arrastra la carpeta **`dist`** a la página. Netlify te da un enlace público.
4. Genera los QR con `npm run qr -- ENLACE_DE_NETLIFY`.

La versión 2D anterior quedó guardada en la etiqueta de git `v1-2d`.

Referencias citadas en el juego: ACOG (2018); Becker et al. (2022); De Corte et al. (2025); Itani et al. (2022); Shim (2024); Tomsett et al. (2025). Créditos de los recursos 3D en `CREDITOS.md`.
