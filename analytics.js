(() => {
  const STORAGE_KEY = 'montapc-analytics-session';
  const client = window.IDEIAS_SUPABASE?.client || null;

  function sessionId() {
    let value = localStorage.getItem(STORAGE_KEY);
    if (!value) {
      value = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
      localStorage.setItem(STORAGE_KEY, value);
    }
    return value;
  }

  function viewport() {
    if (window.innerWidth < 650) return 'mobile';
    if (window.innerWidth < 1000) return 'tablet';
    return 'desktop';
  }

  async function track(eventName, context = {}) {
    if (!client) return;
    const allowedContext = {};
    for (const [key, value] of Object.entries(context || {})) {
      if (['string','number','boolean'].includes(typeof value) && String(key).length <= 50) {
        allowedContext[key] = String(value).slice(0, 160);
      }
    }

    try {
      await client.from('montapc_events').insert({
        session_id: sessionId(),
        user_id: null,
        event_name: eventName,
        locale: window.MONTAPC_I18N?.locale === 'en' ? 'en' : 'pt-BR',
        viewport: viewport(),
        context: allowedContext
      });
    } catch (error) {
      console.debug('MontaPC analytics unavailable', error);
    }
  }

  window.MONTAPC_ANALYTICS = { track, getSessionId: sessionId, getViewport: viewport };

  window.addEventListener('DOMContentLoaded', () => {
    track('page_view', {
      path: location.pathname,
      display: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    });
  });
})();
