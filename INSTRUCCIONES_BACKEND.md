# Cómo conectar el juego con Google Sheets (5 minutos)

El juego funciona sin esto, pero así podrán ver todas las respuestas y el ranking en vivo de todo el salón.

## 1. Crear la hoja y el script

1. Entra a [sheets.new](https://sheets.new) con tu cuenta de Google. Se crea una hoja de cálculo nueva. Ponle un nombre, por ejemplo «Respuestas Consulta de Alarma».
2. En el menú, ve a **Extensiones > Apps Script**.
3. Borra todo lo que aparece en el editor y pega el contenido completo del archivo `apps-script/Code.gs`.
4. Pulsa el ícono de **guardar** (💾).

## 2. Publicarlo como aplicación web

1. Arriba a la derecha, pulsa **Implementar > Nueva implementación**.
2. En «Seleccionar tipo» (el engranaje ⚙), elige **Aplicación web**.
3. Llena así:
   - **Descripción:** Juego endometriosis
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** **Cualquier usuario**
4. Pulsa **Implementar**.
5. Google pedirá permisos: **Autorizar acceso**, elige tu cuenta. Si sale «Google no verificó esta app», pulsa **Configuración avanzada > Ir a … (no seguro)** y luego **Permitir**. Es seguro: el script es tuyo y solo escribe en tu hoja.
6. Copia la **URL de la aplicación web** (termina en `/exec`).

## 3. Pegar la URL en el juego (desde la página de GitHub, 1 minuto)

1. Abre https://github.com/pachecoaljurejuancamilo-coder/consulta-de-alarma/edit/gh-pages/config.js
   (es el archivo `config.js` de la rama **gh-pages**, la que está publicada).
2. Pega la URL entre las comillas:

   ```js
   window.CONFIG_JUEGO = {
     APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   };
   ```

3. Pulsa **Commit changes**. En 1 o 2 minutos el juego y el tablero publicados ya usan Google Sheets.
4. Para que no se pierda si vuelven a publicar con `npm run publicar`, pega la misma URL en `public/config.js` de la carpeta del proyecto.

## 4. Comprobar que funciona

- Abre la URL `/exec` en el navegador: debe mostrar un texto que empieza con `{"participantes":0,...`.
- Juega una partida. Debe aparecer una fila nueva en la hoja «Respuestas».
- Abre el tablero (`resultados.html`): el aviso amarillo desaparece y verás el ranking.

## Si algo falla

- **Cambié el código del script y no se nota:** en Apps Script ve a **Implementar > Gestionar implementaciones**, pulsa el lápiz, elige **Versión: Nueva versión** e **Implementar**. La URL no cambia.
- **No llegan filas:** revisa que «Quién tiene acceso» sea **Cualquier usuario** (no «Cualquier usuario con cuenta de Google»).
- **Sin internet en el salón:** las respuestas quedan guardadas en cada celular y se envían solas la próxima vez que abran el juego con conexión.
