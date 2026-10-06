(() => {
  const config = window.MONTAPC_ADS || {};
  if (!config.enabled) return;

  const client = String(config.client || '').trim();
  if (!client) {
    console.warn('[MontaPC Ads] enabled=true, mas nenhum client foi configurado.');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
  document.head.appendChild(script);

  document.querySelectorAll('[data-ad-slot]').forEach(container => {
    const key = container.dataset.adSlot;
    const slot = String(config.slots?.[key] || '').trim();
    if (!slot) return;

    container.hidden = false;
    const label = document.createElement('span');
    label.className = 'ad-label';
    label.textContent = document.documentElement.lang === 'en' ? 'Advertisement' : 'Publicidade';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = client;
    ins.dataset.adSlot = slot;
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';

    container.replaceChildren(label, ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('[MontaPC Ads] slot não carregado.', error);
    }
  });
})();
