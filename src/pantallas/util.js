// Pantalla completa y orientación horizontal (con un solo toque).
export async function pantallaCompleta() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch {
    /* el navegador no lo permite (por ejemplo, iPhone) */
  }
  try {
    await screen.orientation?.lock?.('landscape');
  } catch {
    /* no se puede bloquear la orientación */
  }
}
