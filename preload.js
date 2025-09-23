// preload.js
// Executa antes do renderer — bom lugar para indicar que estamos no Electron
window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Preload carregado 🚀 (Adicionando classe is-electron)');
    // Marca o documento para permitir CSS/JS específico ao Electron
    if (document && document.documentElement) {
      document.documentElement.classList.add('is-electron');
    }
  } catch (e) {
    console.warn('Preload warning:', e && e.message);
  }

  // Captura erros no renderer e loga no main process console (apenas console local)
  window.addEventListener('error', (ev) => {
    console.error('Renderer uncaught error:', ev && ev.error ? ev.error : ev);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    console.error('Renderer unhandled rejection:', ev && ev.reason ? ev.reason : ev);
  });
});
