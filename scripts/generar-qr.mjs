// Genera qr-juego.png y qr-resultados.png (1000 × 1000 px, con margen blanco).
// Uso: npm run qr -- https://usuario.github.io/consulta-de-alarma/
import QRCode from 'qrcode';

let base = process.argv[2];
if (!base) {
  console.error('Falta la URL. Ejemplo: npm run qr -- https://usuario.github.io/consulta-de-alarma/');
  process.exit(1);
}
if (!base.endsWith('/')) base += '/';

const opciones = { width: 1000, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#3A1724', light: '#FFFFFF' } };
await QRCode.toFile('qr-juego.png', base, opciones);
await QRCode.toFile('qr-resultados.png', base + 'resultados.html', opciones);
console.log('QR del juego:      qr-juego.png      →', base);
console.log('QR del tablero:    qr-resultados.png →', base + 'resultados.html');
