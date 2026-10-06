(() => {
  let deferredPrompt = null;
  const button = document.querySelector('#install-app');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => console.warn('SW registration failed', error));
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    if (button) button.hidden = false;
  });

  button?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    button.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (button) button.hidden = true;
  });
})();
