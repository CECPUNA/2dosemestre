// ============================================================
// HorarioCentro — Registro del Service Worker
// Incluir este script en index.html antes de </body>
// ============================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        updateViaCache: 'none' // nunca usa caché HTTP para el propio sw.js
      });

      // Fuerza verificación de actualización en cada carga
      registration.update();

      // Cuando el SW cambia (nueva versión activa), recarga la página una sola vez
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      console.log('[SW] Registrado correctamente:', registration.scope);
    } catch (error) {
      console.error('[SW] Error al registrar:', error);
    }
  });
}
