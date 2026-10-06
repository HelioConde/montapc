const supabaseClient = window.IDEIAS_SUPABASE?.client || null;
const i18n = window.MONTAPC_I18N;
const t = (key, vars) => i18n?.t(key, vars) ?? key;
const trackEvent = (name, context = {}) => window.MONTAPC_ANALYTICS?.track(name, context);
const LOCAL_KEY = 'montapc-builds-v2';

const TYPE_ORDER = ['cpu','motherboard','gpu','memory','storage','psu','case','cooler'];
const TYPE_KEYS = {
  cpu: 'type.cpu',
  motherboard: 'type.motherboard',
  gpu: 'type.gpu',
  memory: 'type.memory',
  storage: 'type.storage',
  psu: 'type.psu',
  case: 'type.case',
  cooler: 'type.cooler'
};
function typeLabel(type) {
  return t(TYPE_KEYS[type] || type);
}

const plannerForm = document.querySelector('#planner-form');
const resultEmpty = document.querySelector('#result-empty');
const buildResult = document.querySelector('#build-result');
const partsList = document.querySelector('#parts-list');
const partsToggle = document.querySelector('#parts-toggle');
const compatibilityList = document.querySelector('#compatibility-list');
const recommendationInsights = document.querySelector('#recommendation-insights');
const performanceGrid = document.querySelector('#performance-grid');
const performanceQuality = document.querySelector('#performance-quality');
const saveBuildButton = document.querySelector('#save-build');
const savedBuilds = document.querySelector('#saved-builds');
const comparePanel = document.querySelector('#compare-panel');
const compareContent = document.querySelector('#compare-content');
const syncStatus = document.querySelector('#sync-status');
const accountOpen = document.querySelector('#account-open');
const accountDialog = document.querySelector('#account-dialog');
const accountForm = document.querySelector('#auth-form');
const accountProfile = document.querySelector('#account-profile');
const accountMessage = document.querySelector('#account-message');
const importLocalButton = document.querySelector('#import-local');
const nameDialog = document.querySelector('#name-dialog');
const nameForm = document.querySelector('#name-form');
const nameMessage = document.querySelector('#name-message');
const catalogSearch = document.querySelector('#catalog-search');
const catalogTypeFilter = document.querySelector('#catalog-type-filter');
const catalogBrandFilter = document.querySelector('#catalog-brand-filter');
const catalogMaxPrice = document.querySelector('#catalog-max-price');
const catalogGrid = document.querySelector('#catalog-grid');
const catalogResultsCount = document.querySelector('#catalog-results-count');
const catalogLoadMore = document.querySelector('#catalog-load-more');
const componentDialog = document.querySelector('#component-dialog');
const componentDialogBody = document.querySelector('#component-dialog-body');
const feedbackDialog = document.querySelector('#feedback-dialog');
const feedbackForm = document.querySelector('#feedback-form');
const feedbackMessage = document.querySelector('#feedback-message');

let catalog = [];
let byType = {};
let currentBuild = null;
let currentUser = null;
let cloudBuilds = [];
let cloudLoading = false;
let compareSelection = [];
let livePrices = new Map();
let partsCollapsed = false;
let catalogVisibleLimit = 0;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function makeUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function formatMoney(cents) {
  const locale = i18n?.locale === 'en' ? 'en-US' : 'pt-BR';
  return (Number(cents || 0) / 100).toLocaleString(locale, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('on');
  window.setTimeout(() => toast.classList.remove('on'), 1900);
}

function readLocal() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 60)));
}

function visibleSavedBuilds() {
  return currentUser ? cloudBuilds : readLocal();
}

function component(type, id) {
  return (byType[type] || []).find(item => item.id === id) || null;
}

function selectedComponents(build = currentBuild) {
  if (!build) return {};
  return Object.fromEntries(TYPE_ORDER.map(type => [type, component(type, build.selection?.[type])]));
}

function groupCatalog() {
  byType = {};
  for (const item of catalog) {
    if (!byType[item.component_type]) byType[item.component_type] = [];
    byType[item.component_type].push(item);
  }
  Object.values(byType).forEach(items => items.sort((a,b) => Number(a.price_cents || 0) - Number(b.price_cents || 0)));
}

function catalogSpecEntries(item) {
  const specs = item?.specs || {};
  const hidden = new Set(['performance_score','price_kind','price_updated','price_live','spec_source']);
  return Object.entries(specs)
    .filter(([key, value]) => !hidden.has(key) && value !== null && value !== '' && value !== false)
    .slice(0, 14);
}

function humanSpecKey(key) {
  const labels = {
    max_gpu_mm: 'spec.maxGpu',
    form_factors: 'spec.formFactors',
    max_cooler_mm: 'spec.maxCooler',
    cores: 'spec.cores',
    threads: 'spec.threads',
    memory_type: 'spec.memoryType',
    memory_slots: 'spec.memorySlots',
    max_memory_gb: 'spec.maxMemory',
    m2_slots: 'spec.m2Slots',
    sata_ports: 'spec.sataPorts',
    vram_gb: 'spec.vram',
    length_mm: 'spec.gpuLength',
    recommended_psu_watts: 'spec.psuRecommended',
    capacity_gb: 'spec.capacity',
    modules: 'spec.modules',
    speed_mt: 'spec.speed',
    interface: 'spec.interface',
    wattage: 'spec.wattage',
    efficiency: 'spec.efficiency',
    modular: 'spec.modular',
    supported_sockets: 'spec.supportedSockets',
    height_mm: 'spec.height',
    radiator_mm: 'spec.radiator',
    atx_version: 'spec.atxVersion',
    pcie_connector_count: 'spec.pcieConnectors',
    sata_connector_count: 'spec.sataConnectors'
  };
  return labels[key] ? t(labels[key]) : String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function humanSpecValue(key, value) {
  if (Array.isArray(value)) return value.join(' · ');
  if (typeof value === 'boolean') return value ? '✓' : '—';

  const number = Number(value);
  if (Number.isFinite(number)) {
    if (['max_gpu_mm','max_cooler_mm','length_mm','height_mm','ram_clearance_mm'].includes(key)) return number + ' mm';
    if (['vram_gb','capacity_gb','max_memory_gb'].includes(key)) return number + ' GB';
    if (['recommended_psu_watts','wattage'].includes(key)) return number + ' W';
    if (key === 'speed_mt') return number + ' MT/s';
    if (key === 'radiator_mm') return number + ' mm';
  }

  return String(value);
}

function componentTypeMark(type) {
  return {
    cpu: 'CPU',
    motherboard: 'MB',
    gpu: 'GPU',
    memory: 'RAM',
    storage: 'SSD',
    psu: 'PSU',
    case: 'CASE',
    cooler: 'COOL'
  }[type] || 'PC';
}

function localComponentImage(item) {
  const type = item?.component_type || '';
  if (type === 'cpu') return 'img/assets/cpu.png';
  if (type === 'motherboard') return 'img/assets/motherboard.png';
  if (type === 'gpu') return 'img/assets/gpu.png';
  if (type === 'memory') return 'img/assets/ram.png';
  if (type === 'psu') return 'img/assets/psu.png';
  if (type === 'case') return 'img/assets/case.png';
  if (type === 'cooler') {
    return item?.specs?.cooler_type === 'aio' ? 'img/assets/aio-cooler.png' : 'img/assets/cpu-cooler.png';
  }
  if (type === 'storage') {
    const interfaceName = String(item?.specs?.interface || '').toLowerCase();
    return interfaceName.includes('sata') && !interfaceName.includes('nvme')
      ? 'img/assets/ssd-sata.png'
      : 'img/assets/ssd-nvme.png';
  }
  return 'img/assets/pc-light.png';
}

function componentImage(item) {
  if (item?.component_type) return localComponentImage(item);
  const remote = String(item?.image_url || '');
  return remote.startsWith('https://') ? remote : 'img/assets/pc-light.png';
}

function componentHighlights(item) {
  const specs = item?.specs || {};
  const strengths = [];
  const attention = [];

  if (specs.cooler_included) strengths.push(t('catalog.strength.coolerIncluded'));
  if (Number(specs.performance_score || 0) >= 85) strengths.push(t('catalog.strength.highPerformance'));
  if (Number(specs.vram_gb || 0) >= 12) strengths.push(t('catalog.strength.vram'));
  if (Number(specs.capacity_gb || 0) >= 32 && item.component_type === 'memory') strengths.push(t('catalog.strength.memory32'));
  if (Number(specs.speed_mt || 0) >= 5600) strengths.push(t('catalog.strength.fastMemory'));
  if (/Gold|Platinum|Titanium/i.test(String(specs.efficiency || ''))) strengths.push(t('catalog.strength.gold'));
  if (specs.modular) strengths.push(t('catalog.strength.modular'));
  if (item.component_type === 'case' && (Number(specs.max_gpu_mm || 0) >= 350 || Number(specs.max_cooler_mm || 0) >= 165)) strengths.push(t('catalog.strength.clearance'));

  if (Number(item?.tdp_watts || 0) >= 200) attention.push(t('catalog.attention.highPower'));
  if (Number(specs.recommended_psu_watts || 0) >= 700) attention.push(t('catalog.attention.psuDemand'));
  if (item.component_type === 'memory' && Number(specs.capacity_gb || 0) > 0 && Number(specs.capacity_gb || 0) < 16) attention.push(t('catalog.attention.lowMemory'));

  return { strengths: strengths.slice(0, 3), attention: attention.slice(0, 3) };
}

function populateCatalogBrands() {
  if (!catalogBrandFilter) return;
  const selected = catalogBrandFilter.value;
  const brands = [...new Set(catalog.map(item => item.brand).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  catalogBrandFilter.innerHTML =
    '<option value="">' + escapeHtml(t('catalog.allBrands')) + '</option>' +
    brands.map(brand => '<option value="' + escapeHtml(brand) + '">' + escapeHtml(brand) + '</option>').join('');
  if (brands.includes(selected)) catalogBrandFilter.value = selected;
}

function catalogPageSize() {
  return window.matchMedia('(max-width: 650px)').matches ? 6 : 12;
}

function resetCatalogVisibleLimit() {
  catalogVisibleLimit = catalogPageSize();
}

function renderCatalogExplorer() {
  if (!catalogGrid || !catalogSearch || !catalogTypeFilter) return;
  if (!catalogVisibleLimit) resetCatalogVisibleLimit();

  const query = catalogSearch.value.trim().toLowerCase();
  const type = catalogTypeFilter.value;
  const brand = catalogBrandFilter?.value || '';
  const maxPriceValue = Number(catalogMaxPrice?.value || 0);
  const maxPriceCents = maxPriceValue > 0 ? Math.round(maxPriceValue * 100) : 0;

  const items = catalog.filter(item => {
    const matchesType = !type || item.component_type === type;
    const matchesBrand = !brand || item.brand === brand;
    const matchesPrice = !maxPriceCents || Number(item.price_cents || 0) <= maxPriceCents;
    const haystack = [item.brand, item.model, item.socket, item.component_type].filter(Boolean).join(' ').toLowerCase();
    return matchesType && matchesBrand && matchesPrice && (!query || haystack.includes(query));
  });

  const visibleItems = items.slice(0, catalogVisibleLimit);
  catalogResultsCount.textContent = items.length
    ? t('catalog.showing', { visible: visibleItems.length, total: items.length })
    : t('catalog.results', { count: 0 });

  if (catalogLoadMore) {
    catalogLoadMore.hidden = visibleItems.length >= items.length;
  }

  catalogGrid.innerHTML = items.length
    ? visibleItems.map(item =>
        '<article class="catalog-card">' +
          '<img class="catalog-card-image" src="' + escapeHtml(componentImage(item)) + '" alt="' + escapeHtml(item.brand + ' ' + item.model) + '" loading="lazy" referrerpolicy="no-referrer">' +
          '<span>' + escapeHtml(typeLabel(item.component_type)) + '</span>' +
          '<strong>' + escapeHtml(item.brand + ' ' + item.model) + '</strong>' +
          '<div class="part-meta">' + componentMeta(item, item.component_type).map(value => '<em>' + escapeHtml(value) + '</em>').join('') + '</div>' +
          '<small>' + escapeHtml(t('catalog.referencePrice')) + ': ' + escapeHtml(formatMoney(item.price_cents)) + '</small>' +
          (livePriceFor(item)
            ? '<small class="catalog-live-price">' +
                escapeHtml(livePriceFor(item).in_stock
                  ? t('catalog.liveAt', { store: livePriceFor(item).store_name, price: formatMoney(livePriceFor(item).price_cents) })
                  : t('catalog.outOfStock')) +
              '</small>'
            : '') +
          '<button class="button ghost" type="button" data-component-details="' + escapeHtml(item.id) + '">' + escapeHtml(t('catalog.details')) + '</button>' +
        '</article>'
      ).join('')
    : '<div class="catalog-no-results">' + escapeHtml(t('catalog.noResults')) + '</div>';
}

async function openComponentDialog(id) {
  const item = catalog.find(componentItem => componentItem.id === id);
  if (!item || !componentDialog || !componentDialogBody) return;

  document.querySelector('#component-dialog-title').textContent = item.brand + ' ' + item.model;
  const specs = catalogSpecEntries(item);
  const source = String(item.specs?.spec_source || '');
  const live = livePriceFor(item);
  const highlights = componentHighlights(item);

  componentDialogBody.innerHTML =
    '<img class="component-hero-image" src="' + escapeHtml(componentImage(item)) + '" alt="' + escapeHtml(item.brand + ' ' + item.model) + '" loading="lazy" referrerpolicy="no-referrer">' +
    '<div class="component-detail-summary">' +
      '<span>' + escapeHtml(typeLabel(item.component_type)) + '</span>' +
      '<strong>' + escapeHtml(formatMoney(item.price_cents)) + '</strong>' +
    '</div>' +
    (live
      ? '<div class="component-live-price">' +
          '<strong>' + escapeHtml(live.in_stock ? t('catalog.liveAt', { store: live.store_name, price: formatMoney(live.price_cents) }) : t('catalog.outOfStock')) + '</strong>' +
          '<span>' + escapeHtml(t('catalog.observed', { date: formatObservedDate(live.observed_at) })) + '</span>' +
        '</div>'
      : '') +
    '<div class="component-spec-grid">' +
      specs.map(([key, value]) =>
        '<div><span>' + escapeHtml(humanSpecKey(key)) + '</span><strong>' + escapeHtml(humanSpecValue(key, value)) + '</strong></div>'
      ).join('') +
    '</div>' +
    ((highlights.strengths.length || highlights.attention.length)
      ? '<div class="component-highlights">' +
          (highlights.strengths.length
            ? '<section><h3>' + escapeHtml(t('catalog.strengths')) + '</h3>' +
              highlights.strengths.map(text => '<p class="highlight-positive">✓ ' + escapeHtml(text) + '</p>').join('') + '</section>'
            : '') +
          (highlights.attention.length
            ? '<section><h3>' + escapeHtml(t('catalog.attention')) + '</h3>' +
              highlights.attention.map(text => '<p class="highlight-attention">! ' + escapeHtml(text) + '</p>').join('') + '</section>'
            : '') +
        '</div>'
      : '') +
    (source.startsWith('https://')
      ? '<a class="component-source" href="' + escapeHtml(source) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t('catalog.source')) + ' ↗</a>'
      : '') +
    '<button class="button ghost component-share" type="button" data-share-component="' + escapeHtml(item.id) + '">' + escapeHtml(t('catalog.share')) + '</button>' +
    '<section class="price-history"><h3>' + escapeHtml(t('catalog.history')) + '</h3><div id="price-history-list"></div></section>';

  componentDialog.showModal();

  componentDialogBody.querySelector('[data-share-component]')?.addEventListener('click', async () => {
    const url = new URL(window.location.href.split('#')[0]);
    url.searchParams.set('component', item.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      showToast(t('catalog.linkCopied'));
    } catch {
      showToast(t('toast.shareError'));
    }
  });

  const historyList = componentDialogBody.querySelector('#price-history-list');
  if (!historyList) return;

  if (!supabaseClient) {
    historyList.innerHTML = '<p>' + escapeHtml(t('catalog.historyEmpty')) + '</p>';
    return;
  }

  const { data: history, error } = await supabaseClient
    .from('montapc_price_snapshots')
    .select('store_name,price_cents,in_stock,observed_at,product_url')
    .eq('component_id', item.id)
    .order('observed_at', { ascending: false })
    .limit(12);

  if (error || !history?.length) {
    historyList.innerHTML = '<p>' + escapeHtml(t('catalog.historyEmpty')) + '</p>';
    return;
  }

  historyList.innerHTML = history.map(entry =>
    '<div class="price-history-row">' +
      '<span>' + escapeHtml(formatObservedDate(entry.observed_at)) + '</span>' +
      '<strong>' + escapeHtml(formatMoney(entry.price_cents)) + '</strong>' +
      '<small>' + escapeHtml(entry.store_name) + (entry.in_stock ? '' : ' · ' + escapeHtml(t('catalog.outOfStock'))) + '</small>' +
    '</div>'
  ).join('');
}

function priceOf(item) {
  return Number(item?.price_cents || 0);
}

function livePriceFor(item) {
  return item?.id ? livePrices.get(item.id) || null : null;
}

function formatObservedDate(value) {
  const locale = i18n?.locale === 'en' ? 'en-US' : 'pt-BR';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
}

async function loadLivePrices() {
  if (!supabaseClient || !catalog.length) return;
  const { data, error } = await supabaseClient
    .from('montapc_price_snapshots')
    .select('component_id,store_name,price_cents,product_url,in_stock,observed_at')
    .order('observed_at', { ascending: false })
    .limit(500);

  if (error) {
    console.warn('MontaPC live prices unavailable', error);
    return;
  }

  livePrices = new Map();
  for (const row of data || []) {
    if (!livePrices.has(row.component_id)) livePrices.set(row.component_id, row);
  }
}

function wattageOf(item) {
  return Number(item?.tdp_watts || 0);
}

function buildTotal(selection) {
  return TYPE_ORDER.reduce((sum, type) => sum + priceOf(component(type, selection[type])), 0);
}

function requiredPsuWatts(selection) {
  const parts = Object.fromEntries(TYPE_ORDER.map(type => [type, component(type, selection[type])]));
  const cpu = wattageOf(parts.cpu);
  const gpu = wattageOf(parts.gpu);
  const board = wattageOf(parts.motherboard);
  const extra = wattageOf(parts.memory) + wattageOf(parts.storage) + wattageOf(parts.cooler) + 80;
  const estimatedLoad = cpu + gpu + board + extra;
  const withHeadroom = Math.ceil((estimatedLoad * 1.35) / 50) * 50;
  const gpuRecommendation = Number(parts.gpu?.specs?.recommended_psu_watts || 0);
  return Math.max(450, withHeadroom, gpuRecommendation);
}

function compatibility(build = currentBuild) {
  if (!build) return { ok: false, checks: [] };
  const parts = selectedComponents(build);
  const checks = [];
  const push = (ok, text, level = ok ? 'ok' : 'error') => checks.push({ ok, text, level });

  for (const type of ['cpu','motherboard','gpu','memory','storage','psu','case']) {
    if (!parts[type]) push(false, t('part.notSelected', { type: typeLabel(type) }));
  }

  if (parts.cpu && parts.motherboard) {
    push(
      parts.cpu.socket === parts.motherboard.socket,
      parts.cpu.socket === parts.motherboard.socket
        ? t('compat.socketOk', { socket: parts.cpu.socket })
        : t('compat.socketError', { cpu: parts.cpu.socket || '—', board: parts.motherboard.socket || '—' })
    );
  }

  if (parts.motherboard && parts.memory) {
    const boardMemory = String(parts.motherboard.specs?.memory_type || '');
    const ramMemory = String(parts.memory.specs?.memory_type || '');
    push(
      boardMemory === ramMemory,
      boardMemory === ramMemory
        ? t('compat.memoryOk', { memory: ramMemory })
        : t('compat.memoryError', { board: boardMemory || '—', ram: ramMemory || '—' })
    );
  }

  if (parts.motherboard && parts.case) {
    const supported = Array.isArray(parts.case.specs?.form_factors) ? parts.case.specs.form_factors : [];
    const formFactor = String(parts.motherboard.specs?.form_factor || '');
    push(
      supported.includes(formFactor),
      supported.includes(formFactor)
        ? t('compat.caseBoardOk', { form: formFactor })
        : t('compat.caseBoardError', { form: formFactor || '—' })
    );
  }

  if (parts.gpu && parts.case) {
    const gpuLength = Number(parts.gpu.specs?.length_mm || 0);
    const maxGpu = Number(parts.case.specs?.max_gpu_mm || 0);
    const known = gpuLength > 0 && maxGpu > 0;
    push(
      !known || gpuLength <= maxGpu,
      known
        ? (gpuLength <= maxGpu
          ? t('compat.gpuFit', { gpu: gpuLength, max: maxGpu })
          : t('compat.gpuTooLong', { gpu: gpuLength, max: maxGpu }))
        : t('compat.gpuUnknown'),
      known ? (gpuLength <= maxGpu ? 'ok' : 'error') : 'warning'
    );
  }

  if (parts.cpu) {
    const coolerIncluded = Boolean(parts.cpu.specs?.cooler_included);
    if (!coolerIncluded && !parts.cooler) {
      push(false, t('compat.coolerRequired'), 'error');
    }
    if (parts.cooler) {
      const sockets = Array.isArray(parts.cooler.specs?.supported_sockets) ? parts.cooler.specs.supported_sockets : [];
      push(
        sockets.includes(parts.cpu.socket),
        sockets.includes(parts.cpu.socket)
          ? t('compat.coolerSocketOk', { socket: parts.cpu.socket })
          : t('compat.coolerSocketError', { socket: parts.cpu.socket })
      );

      if (parts.case) {
        const height = Number(parts.cooler.specs?.height_mm || 0);
        const maxHeight = Number(parts.case.specs?.max_cooler_mm || 0);
        if (height && maxHeight) {
          push(
            height <= maxHeight,
            height <= maxHeight
              ? t('compat.coolerFit', { height, max: maxHeight })
              : t('compat.coolerTooTall', { height, max: maxHeight })
          );
        }
      }
    } else if (coolerIncluded) {
      push(true, t('compat.coolerIncluded'), 'ok');
    }
  }

  if (parts.psu) {
    const required = requiredPsuWatts(build.selection);
    const available = Number(parts.psu.specs?.wattage || 0);
    push(
      available >= required,
      available >= required
        ? t('compat.psuOk', { available, required })
        : t('compat.psuError', { available, required })
    );
  }

  if (parts.motherboard && parts.storage && String(parts.storage.specs?.interface || '').toUpperCase().includes('NVME')) {
    const slots = Number(parts.motherboard.specs?.m2_slots || 0);
    push(
      slots > 0,
      slots > 0 ? t('compat.m2Ok', { slots }) : t('compat.m2Error')
    );
  }

  if (parts.motherboard && parts.memory) {
    const capacity = Number(parts.memory.specs?.capacity_gb || 0);
    const maxMemory = Number(parts.motherboard.specs?.max_memory_gb || 0);
    if (capacity && maxMemory) {
      push(
        capacity <= maxMemory,
        capacity <= maxMemory
          ? t('compat.ramCapacityOk', { capacity, max: maxMemory })
          : t('compat.ramCapacityError', { capacity, max: maxMemory })
      );
    }

    const modules = Number(parts.memory.specs?.modules || 0);
    const memorySlots = Number(parts.motherboard.specs?.memory_slots || 0);
    if (modules && memorySlots) {
      push(
        modules <= memorySlots,
        modules <= memorySlots
          ? t('compat.ramModulesOk', { modules, slots: memorySlots })
          : t('compat.ramModulesError', { modules, slots: memorySlots })
      );
    }
  }

  if (parts.gpu && parts.psu) {
    const connector = String(parts.gpu.specs?.power_connector || '');
    const connectors = Array.isArray(parts.psu.specs?.connectors) ? parts.psu.specs.connectors.map(String) : [];
    if (connector && connectors.length) {
      push(
        connectors.includes(connector),
        connectors.includes(connector)
          ? t('compat.gpuPowerOk', { connector })
          : t('compat.gpuPowerError', { connector })
      );
    }
  }

  if (parts.gpu && parts.case) {
    const gpuSlots = Number(parts.gpu.specs?.slot_width || 0);
    const maxSlots = Number(parts.case.specs?.max_gpu_slots || 0);
    if (gpuSlots && maxSlots) {
      push(
        gpuSlots <= maxSlots,
        gpuSlots <= maxSlots
          ? t('compat.gpuSlotsOk', { slots: gpuSlots, max: maxSlots })
          : t('compat.gpuSlotsError', { slots: gpuSlots, max: maxSlots })
      );
    }
  }

  if (parts.cooler && parts.case && parts.cooler.specs?.cooler_type === 'aio') {
    const radiator = Number(parts.cooler.specs?.radiator_mm || 0);
    const supported = Array.isArray(parts.case.specs?.radiator_support_mm) ? parts.case.specs.radiator_support_mm.map(Number) : [];
    if (radiator && supported.length) {
      push(
        supported.includes(radiator),
        supported.includes(radiator)
          ? t('compat.radiatorOk', { size: radiator })
          : t('compat.radiatorError', { size: radiator })
      );
    }
  }

  if (parts.cpu && parts.motherboard) {
    const family = String(parts.cpu.specs?.family || '');
    const supportedFamilies = Array.isArray(parts.motherboard.specs?.supported_cpu_families)
      ? parts.motherboard.specs.supported_cpu_families.map(String)
      : [];
    if (family && supportedFamilies.length) {
      push(
        supportedFamilies.includes(family),
        supportedFamilies.includes(family)
          ? t('compat.cpuFamilyOk', { family })
          : t('compat.cpuFamilyError', { family })
      );
    }

    const biosFamilies = Array.isArray(parts.motherboard.specs?.bios_update_families)
      ? parts.motherboard.specs.bios_update_families.map(String)
      : [];
    if (family && biosFamilies.includes(family)) {
      push(true, t('compat.biosWarning', { family }), 'warning');
    }
  }

  if (parts.motherboard && parts.storage && String(parts.storage.specs?.interface || '').toUpperCase().includes('SATA')) {
    const ports = Number(parts.motherboard.specs?.sata_ports || 0);
    push(
      ports > 0,
      ports > 0 ? t('compat.sataOk', { ports }) : t('compat.sataError')
    );
  }

  if (parts.memory && parts.cooler) {
    const ramHeight = Number(parts.memory.specs?.height_mm || 0);
    const clearance = Number(parts.cooler.specs?.ram_clearance_mm || 0);
    if (ramHeight && clearance) {
      push(
        ramHeight <= clearance,
        ramHeight <= clearance
          ? t('compat.ramClearanceOk', { height: ramHeight, clearance })
          : t('compat.ramClearanceError', { height: ramHeight, clearance })
      );
    }
  }

  if (parts.case && parts.motherboard) {
    const requiredHeaders = Array.isArray(parts.case.specs?.required_usb_headers)
      ? parts.case.specs.required_usb_headers.map(String)
      : [];
    const availableHeaders = Array.isArray(parts.motherboard.specs?.usb_headers)
      ? parts.motherboard.specs.usb_headers.map(String)
      : [];
    if (requiredHeaders.length && availableHeaders.length) {
      const normalizeHeader = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const headerMatches = (required, available) => {
        const need = normalizeHeader(required);
        const have = normalizeHeader(available);
        if (!need || !have) return false;
        if (need === have || have.includes(need) || need.includes(have)) return true;
        if (need.includes('usb c')) return have.includes('usb c') || have.includes('type c');
        if (need.includes('usb 3')) return have.includes('usb 3');
        if (need.includes('usb 2')) return have.includes('usb 2');
        return false;
      };
      const missing = requiredHeaders.filter(required =>
        !availableHeaders.some(available => headerMatches(required, available))
      );
      push(
        missing.length === 0,
        missing.length === 0
          ? t('compat.usbHeadersOk')
          : t('compat.usbHeadersError', { headers: missing.join(', ') })
      );
    }
  }

  if (parts.gpu && parts.motherboard) {
    const gpuPcie = Number(parts.gpu.specs?.pcie_version || 0);
    const boardPcie = Number(parts.motherboard.specs?.pcie_x16_version || 0);
    if (gpuPcie && boardPcie) {
      push(
        true,
        boardPcie >= gpuPcie
          ? t('compat.pcieOk')
          : t('compat.pcieOlder', { gpu: gpuPcie, board: boardPcie }),
        boardPcie >= gpuPcie ? 'ok' : 'warning'
      );
    }
  }

  const hardErrors = checks.filter(check => check.level === 'error' && !check.ok);
  return { ok: hardErrors.length === 0, checks, requiredPsu: requiredPsuWatts(build.selection) };
}

function performance(item) {
  return Number(item?.specs?.performance_score || 0);
}

function candidateScore(selection, settings, total, budget) {
  const p = Object.fromEntries(TYPE_ORDER.map(type => [type, component(type, selection[type])]));
  const cpu = performance(p.cpu);
  const gpu = performance(p.gpu);
  const memory = performance(p.memory);
  const storage = performance(p.storage);
  const psu = performance(p.psu);
  const pcCase = performance(p.case);

  let score;
  if (settings.usage === 'work') {
    score = cpu * .46 + gpu * .13 + memory * .20 + storage * .13 + psu * .04 + pcCase * .04;
  } else if (settings.usage === 'competitive') {
    score = cpu * .34 + gpu * .48 + memory * .10 + storage * .03 + psu * .03 + pcCase * .02;
  } else if (settings.usage === 'aaa') {
    score = cpu * .17 + gpu * .65 + memory * .10 + storage * .03 + psu * .03 + pcCase * .02;
  } else if (settings.usage === 'streaming') {
    score = cpu * .35 + gpu * .45 + memory * .11 + storage * .04 + psu * .03 + pcCase * .02;
  } else if (settings.usage === 'editing') {
    score = cpu * .42 + gpu * .28 + memory * .16 + storage * .10 + psu * .02 + pcCase * .02;
  } else if (settings.usage === 'programming') {
    score = cpu * .50 + gpu * .05 + memory * .25 + storage * .15 + psu * .03 + pcCase * .02;
  } else if (settings.usage === '3d') {
    score = cpu * .24 + gpu * .56 + memory * .12 + storage * .04 + psu * .02 + pcCase * .02;
  } else if (settings.usage === 'ai') {
    score = cpu * .14 + gpu * .70 + memory * .11 + storage * .02 + psu * .02 + pcCase * .01;
  } else if (settings.usage === 'office') {
    score = cpu * .45 + gpu * .03 + memory * .25 + storage * .17 + psu * .05 + pcCase * .05;
  } else if (settings.usage === 'mixed') {
    score = cpu * .32 + gpu * .38 + memory * .14 + storage * .09 + psu * .04 + pcCase * .03;
  } else if (settings.resolution === '4k') {
    score = cpu * .18 + gpu * .62 + memory * .10 + storage * .04 + psu * .03 + pcCase * .03;
  } else if (settings.resolution === '1080p') {
    score = cpu * .31 + gpu * .47 + memory * .11 + storage * .05 + psu * .03 + pcCase * .03;
  } else {
    score = cpu * .24 + gpu * .55 + memory * .11 + storage * .04 + psu * .03 + pcCase * .03;
  }

  const utilization = budget > 0 ? total / budget : 1;
  if (settings.strategy === 'fps') score += gpu * .16;
  if (settings.strategy === 'cpu') score += cpu * .18;
  if (settings.strategy === 'upgrade') {
    if (p.cpu?.socket === 'AM5') score += 10;
    if (p.memory?.specs?.memory_type === 'DDR5') score += 5;
    if (Number(p.psu?.specs?.wattage || 0) >= requiredPsuWatts(selection) + 100) score += 3;
  }
  if (settings.strategy === 'silent') {
    const draw = wattageOf(p.cpu) + wattageOf(p.gpu) + wattageOf(p.motherboard) +
      wattageOf(p.memory) + wattageOf(p.storage) + wattageOf(p.cooler);
    score -= draw / 24;
    if (/Gold|Platinum|Titanium/i.test(String(p.psu?.specs?.efficiency || ''))) score += 4;
  }
  if (settings.strategy === 'economy') {
    score += (1 - Math.min(utilization, 1)) * 30;
  } else {
    score += Math.min(utilization, 1) * 12;
  }

  return score;
}

function buildCandidate(selection, settings, budgetCents) {
  const total = buildTotal(selection);
  const base = {
    id: null,
    name: '',
    budgetCents,
    settings,
    selection,
    totalCents: total,
    updatedAt: Date.now(),
    createdAt: Date.now()
  };
  const state = compatibility(base);
  return { ...base, compatibilityStatus: state.ok ? 'compatible' : 'incompatible' };
}

function generateBestBuild(settings) {
  const budgetCents = Math.round(Number(settings.budget) * 100);
  const cpus = byType.cpu || [];
  const boards = byType.motherboard || [];
  const gpus = byType.gpu || [];
  const memories = byType.memory || [];
  const storages = byType.storage || [];
  const psus = byType.psu || [];
  const cases = byType.case || [];
  const coolers = byType.cooler || [];

  let best = null;
  let bestScore = -Infinity;
  let cheapest = null;

  for (const cpu of cpus) {
    const matchingBoards = boards.filter(board => board.socket === cpu.socket);
    for (const board of matchingBoards) {
      const matchingMemory = memories.filter(ram => ram.specs?.memory_type === board.specs?.memory_type);
      for (const memory of matchingMemory) {
        for (const gpu of gpus) {
          const coolerChoices = cpu.specs?.cooler_included
            ? [null]
            : coolers.filter(cooler => (cooler.specs?.supported_sockets || []).includes(cpu.socket));

          for (const cooler of coolerChoices) {
            for (const pcCase of cases) {
              const formFactors = pcCase.specs?.form_factors || [];
              if (!formFactors.includes(board.specs?.form_factor)) continue;
              if (Number(gpu.specs?.length_mm || 0) > Number(pcCase.specs?.max_gpu_mm || Infinity)) continue;
              if (cooler && Number(cooler.specs?.height_mm || 0) > Number(pcCase.specs?.max_cooler_mm || Infinity)) continue;

              for (const storage of storages) {
                const partial = {
                  cpu: cpu.id,
                  motherboard: board.id,
                  gpu: gpu.id,
                  memory: memory.id,
                  storage: storage.id,
                  psu: null,
                  case: pcCase.id,
                  cooler: cooler?.id || null
                };
                const required = requiredPsuWatts(partial);
                for (const psu of psus.filter(item => Number(item.specs?.wattage || 0) >= required)) {
                  const selection = { ...partial, psu: psu.id };
                  const candidate = buildCandidate(selection, settings, budgetCents);
                  if (candidate.compatibilityStatus !== 'compatible') continue;

                  if (!cheapest || candidate.totalCents < cheapest.totalCents) cheapest = candidate;
                  if (candidate.totalCents > budgetCents) continue;

                  const score = candidateScore(selection, settings, candidate.totalCents, budgetCents);
                  if (score > bestScore) {
                    bestScore = score;
                    best = candidate;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return { build: best || cheapest, withinBudget: Boolean(best) };
}

function settingsFromForm() {
  const values = Object.fromEntries(new FormData(plannerForm));
  return {
    budget: Number(values.budget),
    usage: values.usage,
    resolution: values.resolution,
    strategy: values.strategy
  };
}

function settingsLabel(settings) {
  const usage = t('settings.usage.' + settings.usage);
  const strategy = t('settings.strategy.' + settings.strategy);
  return `${usage} · ${settings.resolution} · ${strategy}`;
}


function renderRecommendationInsights() {
  if (!currentBuild || !recommendationInsights) return;
  const parts = selectedComponents();
  const settings = currentBuild.settings || {};
  const memoryType = parts.memory?.specs?.memory_type || parts.motherboard?.specs?.memory_type || '—';
  const socket = parts.cpu?.socket || parts.motherboard?.socket || '—';
  const total = Number(currentBuild.totalCents || 0);
  const budget = Number(currentBuild.budgetCents || 0);
  const percent = budget > 0 ? Math.round((total / budget) * 100) : 0;
  const margin = budget - total;
  const insights = [];

  const usageInsightKey = {
    work: 'insights.work',
    mixed: 'insights.mixed',
    competitive: 'insights.competitive',
    aaa: 'insights.aaa',
    streaming: 'insights.streaming',
    editing: 'insights.editing',
    programming: 'insights.programming',
    '3d': 'insights.3d',
    ai: 'insights.ai',
    office: 'insights.office'
  }[settings.usage];

  insights.push(
    usageInsightKey
      ? t(usageInsightKey)
      : t('insights.gaming', { resolution: settings.resolution || '—' })
  );

  insights.push(t('insights.platform', { socket, memory: memoryType }));

  if (margin >= 0) {
    insights.push(t('insights.budget', { percent, margin: formatMoney(margin) }));
  } else {
    insights.push(t('insights.overBudget', { amount: formatMoney(Math.abs(margin)) }));
  }

  if (settings.strategy === 'upgrade') insights.push(t('insights.upgrade'));
  if (settings.strategy === 'economy') insights.push(t('insights.economy'));
  if (settings.strategy === 'cpu') insights.push(t('insights.cpuPriority'));
  if (settings.strategy === 'silent') insights.push(t('insights.silent'));

  const cpuScore = performance(parts.cpu);
  const gpuScore = performance(parts.gpu);
  const gamingLike = ['gaming','competitive','aaa','streaming','mixed'].includes(settings.usage);
  if (gamingLike && cpuScore && gpuScore) {
    if (gpuScore - cpuScore >= 22) insights.push(t('insights.bottleneckCpu'));
    else if (cpuScore - gpuScore >= 22) insights.push(t('insights.bottleneckGpu'));
    else insights.push(t('insights.balanceOk'));
  }

  recommendationInsights.innerHTML = insights.map(text =>
    '<div class="recommendation-insight"><span>✓</span><p>' + escapeHtml(text) + '</p></div>'
  ).join('');
}

function renderCompatibility() {
  const state = compatibility(currentBuild);
  const badge = document.querySelector('#compatibility-badge');
  badge.textContent = state.ok ? t('result.compatible') : t('result.review');
  badge.className = 'compatibility-badge ' + (state.ok ? 'ok' : 'error');

  const passed = state.checks.filter(check => check.level === 'ok' && check.ok);
  const issues = state.checks.filter(check => !(check.level === 'ok' && check.ok));
  const renderCheck = check =>
    '<div class="compatibility-item ' + check.level + '">' +
      '<span>' + (check.level === 'ok' ? '✓' : check.level === 'warning' ? '!' : '×') + '</span>' +
      '<p>' + escapeHtml(check.text) + '</p>' +
    '</div>';

  const summaryText = issues.length
    ? t('compat.summaryMixed', { ok: passed.length, issues: issues.length })
    : t('compat.summaryOk', { count: passed.length });

  compatibilityList.innerHTML =
    '<div class="compatibility-summary ' + (issues.length ? 'has-issues' : 'all-ok') + '">' +
      '<strong>' + escapeHtml(summaryText) + '</strong>' +
      (issues.length ? issues.map(renderCheck).join('') : '') +
      (passed.length
        ? '<details class="compatibility-details">' +
            '<summary>' + escapeHtml(t('compat.details')) + '</summary>' +
            '<div class="compatibility-details-list">' + passed.map(renderCheck).join('') + '</div>' +
          '</details>'
        : '') +
    '</div>';

  saveBuildButton.disabled = !state.ok;
  document.querySelector('#build-psu').textContent = state.requiredPsu + ' W';
}

function optionLabel(item) {
  const live = livePriceFor(item);
  return `${item.brand} ${item.model} · ${formatMoney(item.price_cents)}` +
    (live?.in_stock ? ` · ${formatMoney(live.price_cents)} @ ${live.store_name}` : '');
}

const PERFORMANCE_GAMES = [
  { name: 'Valorant', base: 340, cpuWeight: .55, gpuWeight: .45 },
  { name: 'Counter-Strike 2', base: 290, cpuWeight: .55, gpuWeight: .45 },
  { name: 'Fortnite', base: 190, cpuWeight: .35, gpuWeight: .65 },
  { name: 'Cyberpunk 2077', base: 105, cpuWeight: .22, gpuWeight: .78 },
  { name: 'Baldur\'s Gate 3', base: 145, cpuWeight: .35, gpuWeight: .65 },
  { name: 'Forza Horizon 5', base: 150, cpuWeight: .25, gpuWeight: .75 }
];

function estimatedGameFps(build, game, quality = 'high') {
  const parts = selectedComponents(build);
  const cpu = Math.max(1, performance(parts.cpu));
  const gpu = Math.max(1, performance(parts.gpu));
  const combined = (cpu / 100) * game.cpuWeight + (gpu / 100) * game.gpuWeight;
  const resolutionFactor = { '1080p': 1, '1440p': .74, '4k': .48 }[build.settings?.resolution] || .74;
  const qualityFactor = { low: 1.35, medium: 1.17, high: 1, ultra: .82 }[quality] || 1;
  return Math.max(20, Math.round(game.base * combined * resolutionFactor * qualityFactor / 5) * 5);
}

function renderPerformanceEstimate() {
  if (!currentBuild || !performanceGrid) return;
  const quality = performanceQuality?.value || 'high';
  performanceGrid.innerHTML = PERFORMANCE_GAMES.map(game =>
    '<article class="performance-card">' +
      '<strong>' + escapeHtml(game.name) + '</strong>' +
      '<span>' + escapeHtml(t('performance.fps', { fps: estimatedGameFps(currentBuild, game, quality) })) + '</span>' +
    '</article>'
  ).join('');
}

function componentMeta(item, type) {
  if (!item) return [];
  const specs = item.specs || {};
  const values = [];

  if (type === 'cpu' && item.socket) values.push(item.socket);
  if (type === 'motherboard') {
    if (item.socket) values.push(item.socket);
    if (specs.memory_type) values.push(specs.memory_type);
    if (specs.form_factor) values.push(specs.form_factor);
  }
  if (type === 'gpu') {
    if (specs.vram_gb) values.push(specs.vram_gb + ' GB VRAM');
    if (specs.recommended_psu_watts) values.push(specs.recommended_psu_watts + ' W PSU');
  }
  if (type === 'memory') {
    if (specs.capacity_gb) values.push(specs.capacity_gb + ' GB');
    if (specs.memory_type) values.push(specs.memory_type);
    if (specs.speed_mt) values.push(specs.speed_mt + ' MT/s');
  }
  if (type === 'storage') {
    if (specs.capacity_gb) values.push((specs.capacity_gb >= 1000 ? (specs.capacity_gb / 1000) + ' TB' : specs.capacity_gb + ' GB'));
    if (specs.interface) values.push(specs.interface);
  }
  if (type === 'psu') {
    if (specs.wattage) values.push(specs.wattage + ' W');
    if (specs.efficiency) values.push(specs.efficiency);
  }
  if (type === 'case') {
    if (Array.isArray(specs.form_factors) && specs.form_factors.length) values.push(specs.form_factors.join(' / '));
    if (specs.max_gpu_mm) values.push(specs.max_gpu_mm + ' mm GPU');
  }
  if (type === 'cooler') {
    if (specs.height_mm) values.push(specs.height_mm + ' mm');
    if (Array.isArray(specs.supported_sockets) && specs.supported_sockets.length) values.push(specs.supported_sockets.join(' / '));
  }

  return values.slice(0, 3);
}

function updatePartsVisibility() {
  if (!partsToggle || !partsList) return;
  const mobile = window.matchMedia('(max-width: 650px)').matches;
  const collapsed = mobile && partsCollapsed;
  partsList.hidden = collapsed;
  partsToggle.hidden = !mobile;
  partsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  partsToggle.textContent = collapsed ? t('result.showParts') : t('result.hideParts');
}

function renderParts() {
  const parts = selectedComponents();
  const cpuHasCooler = Boolean(parts.cpu?.specs?.cooler_included);

  partsList.innerHTML = TYPE_ORDER.map(type => {
    const selectedId = currentBuild.selection[type] || '';
    const options = byType[type] || [];

    if (type === 'cooler' && cpuHasCooler && !selectedId) {
      return '<article class="part-row">' +
        '<div class="part-label"><span>' + escapeHtml(typeLabel('cooler')) + '</span><strong>' + escapeHtml(t('part.includedCooler')) + '</strong><small>' + escapeHtml(t('part.includedCoolerNote')) + '</small></div>' +
        '<select data-part="cooler"><option value="" selected>' + escapeHtml(t('part.useIncludedCooler')) + '</option>' +
        options.map(item => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(optionLabel(item)) + '</option>').join('') +
        '</select></article>';
    }

    const selected = parts[type];
    return '<article class="part-row">' +
      '<div class="part-label">' +
        (selected ? '<img class="part-type-image" src="' + escapeHtml(componentImage(selected)) + '" alt="" aria-hidden="true" loading="lazy">' : '') +
        '<div class="part-label-copy"><span>' + escapeHtml(typeLabel(type)) + '</span>' +
        '<strong>' + (selected ? escapeHtml(selected.brand + ' ' + selected.model) : t('part.notSelected', { type: typeLabel(type) })) + '</strong>' +
        (selected && componentMeta(selected, type).length
          ? '<div class="part-meta">' + componentMeta(selected, type).map(value => '<em>' + escapeHtml(value) + '</em>').join('') + '</div>'
          : '') +
        '<small>' + (selected ? escapeHtml(formatMoney(selected.price_cents)) : t('part.choose')) + '</small></div></div>' +
      '<select data-part="' + type + '">' +
        (type === 'cooler' ? '<option value="">' + escapeHtml(t('part.noSeparateCooler')) + '</option>' : '') +
        options.map(item => '<option value="' + escapeHtml(item.id) + '"' + (selectedId === item.id ? ' selected' : '') + '>' +
          escapeHtml(optionLabel(item)) + '</option>').join('') +
      '</select></article>';
  }).join('');
  updatePartsVisibility();
}

function renderBuild() {
  if (!currentBuild) {
    resultEmpty.hidden = false;
    buildResult.hidden = true;
    return;
  }

  currentBuild.totalCents = buildTotal(currentBuild.selection);
  const state = compatibility(currentBuild);
  currentBuild.compatibilityStatus = state.ok ? 'compatible' : 'incompatible';

  resultEmpty.hidden = true;
  buildResult.hidden = false;
  document.querySelector('#build-title').textContent = currentBuild.name || t('result.recommended');
  document.querySelector('#build-subtitle').textContent = settingsLabel(currentBuild.settings);
  document.querySelector('#build-total').textContent = formatMoney(currentBuild.totalCents);
  document.querySelector('#build-budget').textContent = formatMoney(currentBuild.budgetCents);
  const margin = currentBuild.budgetCents - currentBuild.totalCents;
  document.querySelector('#build-margin').textContent = (margin >= 0 ? '' : '−') + formatMoney(Math.abs(margin));
  document.querySelector('#build-margin').className = margin >= 0 ? 'positive' : 'negative';

  renderRecommendationInsights();
  renderCompatibility();
  renderPerformanceEstimate();
  renderParts();
}

function normalizeSavedBuild(build) {
  return {
    id: build.id || makeUuid(),
    name: build.name || t('saved.defaultName'),
    budgetCents: Number(build.budgetCents || 0),
    totalCents: Number(build.totalCents || buildTotal(build.selection || {})),
    compatibilityStatus: build.compatibilityStatus || 'pending',
    isFavorite: Boolean(build.isFavorite ?? build.is_favorite),
    visibility: build.visibility === 'public' ? 'public' : 'private',
    settings: {
      budget: Number(build.settings?.budget || Number(build.budgetCents || 0) / 100 || 5000),
      usage: build.settings?.usage || 'gaming',
      resolution: build.settings?.resolution || '1440p',
      strategy: build.settings?.strategy || 'balanced'
    },
    selection: build.selection || {},
    createdAt: Number(build.createdAt || Date.now()),
    updatedAt: Number(build.updatedAt || Date.now())
  };
}

function renderSavedBuilds() {
  const builds = visibleSavedBuilds().map(normalizeSavedBuild)
    .sort((a,b) => b.updatedAt - a.updatedAt);

  compareSelection = compareSelection.filter(id => builds.some(build => build.id === id)).slice(0, 2);

  savedBuilds.innerHTML = builds.length
    ? builds.map(build =>
      '<article class="saved-card' + (compareSelection.includes(build.id) ? ' selected-for-compare' : '') + '">' +
        '<div><strong>' + (build.isFavorite ? '★ ' : '') + escapeHtml(build.name) + '</strong>' +
        '<span>' + escapeHtml(settingsLabel(build.settings)) + ' · ' + escapeHtml(build.visibility === 'public' ? t('saved.public') : t('saved.private')) + '</span></div>' +
        '<div class="saved-values"><span>' + escapeHtml(formatMoney(build.totalCents)) + '</span>' +
        '<small class="' + (build.compatibilityStatus === 'compatible' ? 'status-ok' : 'status-warn') + '">' +
          (build.compatibilityStatus === 'compatible' ? t('result.compatible') : t('saved.review')) + '</small></div>' +
        '<div class="saved-actions">' +
          '<button class="button ghost" type="button" data-compare="' + escapeHtml(build.id) + '">' + escapeHtml(t('compare.select')) + '</button>' +
          '<button class="button ghost" type="button" data-open="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.open')) + '</button>' +
          '<button class="button ghost" type="button" data-share="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.share')) + '</button>' +
          '<details class="saved-more"><summary>' + escapeHtml(t('saved.moreActions')) + '</summary><div class="saved-more-menu">' +
            '<button class="button ghost" type="button" data-rename="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.rename')) + '</button>' +
            '<button class="button ghost" type="button" data-duplicate="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.duplicate')) + '</button>' +
            '<button class="button ghost" type="button" data-export-text="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.exportText')) + '</button>' +
            '<button class="button ghost" type="button" data-export-image="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.exportImage')) + '</button>' +
            '<button class="button ghost" type="button" data-favorite="' + escapeHtml(build.id) + '">' + escapeHtml(build.isFavorite ? t('saved.unfavorite') : t('saved.favorite')) + '</button>' +
            (currentUser ? '<button class="button ghost" type="button" data-visibility="' + escapeHtml(build.id) + '">' + escapeHtml(build.visibility === 'public' ? t('saved.makePrivate') : t('saved.makePublic')) + '</button>' : '') +
            '<button class="button text danger-text" type="button" data-delete="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.delete')) + '</button>' +
          '</div></details>' +
        '</div>' +
      '</article>'
    ).join('')
    : '<div class="saved-empty"><strong>' + escapeHtml(t('saved.emptyTitle')) + '</strong><span>' + escapeHtml(t('saved.emptyCopy')) + '</span></div>';

  renderComparison();
}


function comparePartName(build, type) {
  const item = component(type, build.selection?.[type]);
  return item ? item.brand + ' ' + item.model : '—';
}

function estimatedBuildPower(build) {
  const parts = selectedComponents(build);
  return TYPE_ORDER.reduce((sum, type) => sum + wattageOf(parts[type]), 0) + 80;
}

function buildPerformanceIndex(build) {
  const parts = selectedComponents(build);
  const cpu = performance(parts.cpu);
  const gpu = performance(parts.gpu);
  const memory = performance(parts.memory);
  const storage = performance(parts.storage);
  return Math.round(cpu * .30 + gpu * .50 + memory * .12 + storage * .08);
}

function buildUpgradePotential(build) {
  const parts = selectedComponents(build);
  let score = 0;
  if (parts.cpu?.socket === 'AM5') score += 3;
  if (parts.memory?.specs?.memory_type === 'DDR5') score += 2;
  if (Number(parts.motherboard?.specs?.m2_slots || 0) >= 2) score += 1;
  if (Number(parts.psu?.specs?.wattage || 0) >= requiredPsuWatts(build.selection) + 100) score += 2;
  if (Number(parts.case?.specs?.max_gpu_mm || 0) >= 350) score += 1;

  if (score >= 6) return t('compare.upgrade.high');
  if (score >= 3) return t('compare.upgrade.medium');
  return t('compare.upgrade.low');
}

function renderComparison() {
  if (!comparePanel || !compareContent) return;
  const builds = visibleSavedBuilds().map(normalizeSavedBuild)
    .filter(build => compareSelection.includes(build.id));

  comparePanel.hidden = builds.length === 0;

  if (builds.length !== 2) {
    compareContent.innerHTML =
      '<div class="compare-placeholder compare-placeholder-visual">' +
        '<img src="img/assets/compare-builds.png" alt="" aria-hidden="true" loading="lazy">' +
        '<span>' + escapeHtml(t('compare.needTwo')) + '</span>' +
      '</div>';
    return;
  }

  const [a, b] = builds;
  const rows = [
    [t('compare.price'), formatMoney(a.totalCents), formatMoney(b.totalCents)],
    [t('compare.cpu'), comparePartName(a, 'cpu'), comparePartName(b, 'cpu')],
    [t('compare.gpu'), comparePartName(a, 'gpu'), comparePartName(b, 'gpu')],
    [t('compare.memory'), comparePartName(a, 'memory'), comparePartName(b, 'memory')],
    [t('compare.storage'), comparePartName(a, 'storage'), comparePartName(b, 'storage')],
    [t('compare.psu'), comparePartName(a, 'psu'), comparePartName(b, 'psu')],
    [t('compare.platform'),
      [component('cpu', a.selection?.cpu)?.socket, component('memory', a.selection?.memory)?.specs?.memory_type].filter(Boolean).join(' · ') || '—',
      [component('cpu', b.selection?.cpu)?.socket, component('memory', b.selection?.memory)?.specs?.memory_type].filter(Boolean).join(' · ') || '—'],
    [t('compare.headroom'),
      formatMoney(a.budgetCents - a.totalCents),
      formatMoney(b.budgetCents - b.totalCents)],
    [t('compare.power'),
      estimatedBuildPower(a) + ' W',
      estimatedBuildPower(b) + ' W'],
    [t('compare.performance'),
      String(buildPerformanceIndex(a)),
      String(buildPerformanceIndex(b))],
    [t('compare.upgrade'),
      buildUpgradePotential(a),
      buildUpgradePotential(b)]
  ];

  const priceWinner = a.totalCents === b.totalCents ? t('compare.same') : (a.totalCents < b.totalCents ? a.name : b.name);
  const perfA = buildPerformanceIndex(a);
  const perfB = buildPerformanceIndex(b);
  const performanceWinner = perfA === perfB ? t('compare.same') : (perfA > perfB ? a.name : b.name);
  const powerA = estimatedBuildPower(a);
  const powerB = estimatedBuildPower(b);
  const powerWinner = powerA === powerB ? t('compare.same') : (powerA < powerB ? a.name : b.name);

  compareContent.innerHTML =
    '<section class="compare-summary" aria-label="' + escapeHtml(t('compare.quickSummary')) + '">' +
      '<article><span>' + escapeHtml(t('compare.cheaper')) + '</span><strong>' + escapeHtml(priceWinner) + '</strong></article>' +
      '<article><span>' + escapeHtml(t('compare.faster')) + '</span><strong>' + escapeHtml(performanceWinner) + '</strong></article>' +
      '<article><span>' + escapeHtml(t('compare.lowerPower')) + '</span><strong>' + escapeHtml(powerWinner) + '</strong></article>' +
    '</section>' +
    '<div class="compare-grid compare-grid-head"><span></span><strong>' + escapeHtml(a.name) + '</strong><strong>' + escapeHtml(b.name) + '</strong></div>' +
    rows.map(row => {
      const differs = String(row[1]) !== String(row[2]);
      return '<div class="compare-grid' + (differs ? ' has-difference' : '') + '">' +
        '<span>' + escapeHtml(row[0]) + '</span>' +
        '<div>' + escapeHtml(row[1]) + '</div>' +
        '<div>' + escapeHtml(row[2]) + '</div>' +
      '</div>';
    }).join('') +
    '<div class="compare-verdict">' +
      escapeHtml(a.totalCents === b.totalCents
        ? t('compare.noDifference')
        : t('compare.betterValue') + ': ' + (a.totalCents < b.totalCents ? a.name : b.name)) +
    '</div>';
}

function toggleCompare(id) {
  if (compareSelection.includes(id)) {
    compareSelection = compareSelection.filter(value => value !== id);
  } else if (compareSelection.length < 2) {
    compareSelection.push(id);
  } else {
    compareSelection = [compareSelection[1], id];
  }
  renderSavedBuilds();
}

function purposeString(settings) {
  return [settings.usage, settings.resolution, settings.strategy].join('|');
}

function parsePurpose(value) {
  const [usage='gaming', resolution='1440p', strategy='balanced'] = String(value || '').split('|');
  return { usage, resolution, strategy };
}

async function saveCloudBuild(build) {
  const id = isUuid(build.id) ? build.id : makeUuid();
  const state = compatibility(build);
  const payload = {
    id,
    user_id: currentUser.id,
    name: build.name,
    budget_cents: build.budgetCents,
    purpose: purposeString(build.settings),
    total_cents: build.totalCents,
    compatibility_status: state.ok ? 'compatible' : 'incompatible',
    is_favorite: Boolean(build.isFavorite),
    visibility: build.visibility === 'public' ? 'public' : 'private',
    created_at: new Date(build.createdAt || Date.now()).toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseClient
    .from('montapc_builds')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;

  const { error: deleteError } = await supabaseClient
    .from('montapc_build_items')
    .delete()
    .eq('build_id', id);
  if (deleteError) throw deleteError;

  const rows = TYPE_ORDER
    .map(type => component(type, build.selection[type]))
    .filter(Boolean)
    .map(item => ({
      user_id: currentUser.id,
      build_id: id,
      component_id: item.id,
      quantity: 1,
      price_cents: Number(item.price_cents || 0)
    }));

  if (rows.length) {
    const { error: itemError } = await supabaseClient.from('montapc_build_items').insert(rows);
    if (itemError) throw itemError;
  }

  return {
    ...normalizeSavedBuild({
      id: data.id,
      name: data.name,
      budgetCents: data.budget_cents,
      totalCents: data.total_cents,
      compatibilityStatus: data.compatibility_status,
      isFavorite: data.is_favorite,
      visibility: data.visibility,
      settings: {
        ...parsePurpose(data.purpose),
        budget: Number(data.budget_cents || 0) / 100
      },
      selection: build.selection,
      createdAt: Date.parse(data.created_at),
      updatedAt: Date.parse(data.updated_at)
    })
  };
}

async function loadCloudBuilds() {
  if (!currentUser) return;
  cloudLoading = true;
  updateAccountUi();

  const ownerId = currentUser.id;
  const { data: builds, error: buildError } = await supabaseClient
    .from('montapc_builds')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(60);

  if (buildError) {
    cloudLoading = false;
    accountMessage.textContent = t('auth.loadBuildsError');
    updateAccountUi();
    return;
  }
  if (currentUser?.id !== ownerId) return;

  const buildIds = (builds || []).map(build => build.id);
  let items = [];
  if (buildIds.length) {
    const { data, error } = await supabaseClient
      .from('montapc_build_items')
      .select('build_id,component_id,price_cents')
      .in('build_id', buildIds);
    if (error) {
      cloudLoading = false;
      accountMessage.textContent = t('auth.loadItemsError');
      updateAccountUi();
      return;
    }
    items = data || [];
  }

  cloudBuilds = (builds || []).map(row => {
    const selection = {};
    for (const item of items.filter(entry => entry.build_id === row.id)) {
      const part = catalog.find(c => c.id === item.component_id);
      if (part) selection[part.component_type] = part.id;
    }
    const settings = parsePurpose(row.purpose);
    settings.budget = Number(row.budget_cents || 0) / 100;
    return normalizeSavedBuild({
      id: row.id,
      name: row.name,
      budgetCents: row.budget_cents,
      totalCents: row.total_cents,
      compatibilityStatus: row.compatibility_status,
      isFavorite: row.is_favorite,
      visibility: row.visibility,
      settings,
      selection,
      createdAt: Date.parse(row.created_at),
      updatedAt: Date.parse(row.updated_at)
    });
  });

  cloudLoading = false;
  renderSavedBuilds();
  updateAccountUi();
}

function saveLocalBuild(build) {
  const normalized = normalizeSavedBuild({
    ...build,
    id: isUuid(build.id) ? build.id : makeUuid(),
    updatedAt: Date.now()
  });
  const builds = readLocal().map(normalizeSavedBuild);
  const index = builds.findIndex(item => item.id === normalized.id);
  if (index >= 0) builds[index] = normalized;
  else builds.unshift(normalized);
  writeLocal(builds);
  return normalized;
}

async function persistCurrentBuild(name) {
  const state = compatibility(currentBuild);
  if (!state.ok) throw new Error('incompatible');
  currentBuild.name = name.trim();
  currentBuild.totalCents = buildTotal(currentBuild.selection);
  currentBuild.compatibilityStatus = 'compatible';
  currentBuild.updatedAt = Date.now();

  if (currentUser && supabaseClient) {
    const saved = await saveCloudBuild(currentBuild);
    cloudBuilds = [saved, ...cloudBuilds.filter(item => item.id !== saved.id)];
    currentBuild = { ...saved };
  } else {
    currentBuild = saveLocalBuild(currentBuild);
  }

  renderBuild();
  renderSavedBuilds();
}

async function deleteSavedBuild(id) {
  if (currentUser && supabaseClient) {
    const { error } = await supabaseClient.from('montapc_builds').delete().eq('id', id);
    if (error) throw error;
    cloudBuilds = cloudBuilds.filter(build => build.id !== id);
  } else {
    writeLocal(readLocal().map(normalizeSavedBuild).filter(build => build.id !== id));
  }
  if (currentBuild?.id === id) currentBuild = null;
  renderBuild();
  renderSavedBuilds();
}

function openSavedBuild(id) {
  const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === id);
  if (!build) return;

  currentBuild = JSON.parse(JSON.stringify(build));
  partsCollapsed = window.matchMedia('(max-width: 650px)').matches;
  plannerForm.elements.budget.value = Math.round(build.budgetCents / 100);
  plannerForm.elements.usage.value = build.settings.usage;
  plannerForm.elements.resolution.value = build.settings.resolution;
  plannerForm.elements.strategy.value = build.settings.strategy;
  renderBuild();
  document.querySelector('.result-panel').scrollIntoView({ behavior:'smooth', block:'start' });
}

function sharedBuildToken(build) {
  const payload = {
    v: 1,
    n: build.name || '',
    b: build.budgetCents,
    s: build.settings,
    p: build.selection
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeSharedBuild(token) {
  const padded = String(token || '').replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(token || '').length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function shareSavedBuild(id) {
  const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === id);
  if (!build) return;
  const url = new URL(window.location.href.split('#')[0]);
  url.hash = currentUser && build.visibility === 'public'
    ? 'public=' + encodeURIComponent(build.id)
    : 'build=' + sharedBuildToken(build);

  try {
    await navigator.clipboard.writeText(url.toString());
    showToast(t('toast.shared'));
    trackEvent('build_shared', { mode: currentUser && build.visibility === 'public' ? 'public' : 'encoded' });
  } catch {
    const input = document.createElement('textarea');
    input.value = url.toString();
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    input.remove();
    showToast(ok ? t('toast.shared') : t('toast.shareError'));
    if (ok) trackEvent('build_shared', { mode: currentUser && build.visibility === 'public' ? 'public' : 'encoded' });
  }
}

function safeFilename(value) {
  return String(value || 'montapc-build')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'montapc-build';
}

function buildToText(build) {
  const normalized = normalizeSavedBuild(build);
  const state = compatibility(normalized);
  const lines = [
    t('export.title'),
    '='.repeat(32),
    normalized.name || t('saved.defaultName'),
    settingsLabel(normalized.settings),
    '',
    t('result.total') + ': ' + formatMoney(normalized.totalCents),
    t('result.budget') + ': ' + formatMoney(normalized.budgetCents),
    t('result.psu') + ': ' + state.requiredPsu + ' W',
    t('result.compatible') + ': ' + (state.ok ? '✓' : '×'),
    ''
  ];

  for (const type of TYPE_ORDER) {
    const item = component(type, normalized.selection?.[type]);
    if (!item) continue;
    lines.push(typeLabel(type) + ': ' + item.brand + ' ' + item.model + ' — ' + formatMoney(item.price_cents));
  }

  lines.push('', t('export.generatedBy') + ' — https://helioconde.github.io/montapc/');
  return lines.join('\n');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBuildText(build) {
  triggerDownload(
    new Blob([buildToText(build)], { type: 'text/plain;charset=utf-8' }),
    safeFilename(build.name) + '.txt'
  );
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function exportBuildImage(build) {
  const normalized = normalizeSavedBuild(build);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f5f7f8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#182126';
  ctx.font = '700 34px Arial';
  ctx.fillText('MontaPC', 72, 82);

  ctx.fillStyle = '#315d72';
  ctx.font = '700 58px Arial';
  const titleLines = wrapCanvasText(ctx, normalized.name || t('saved.defaultName'), 1040);
  titleLines.slice(0, 2).forEach((line, index) => ctx.fillText(line, 72, 170 + index * 66));

  let y = 330;
  ctx.fillStyle = '#6e7a80';
  ctx.font = '24px Arial';
  ctx.fillText(settingsLabel(normalized.settings), 72, y);
  y += 64;

  ctx.fillStyle = '#182126';
  ctx.font = '700 30px Arial';
  ctx.fillText(t('result.total') + ': ' + formatMoney(normalized.totalCents), 72, y);
  ctx.fillText(t('result.budget') + ': ' + formatMoney(normalized.budgetCents), 620, y);
  y += 70;

  for (const type of TYPE_ORDER) {
    const item = component(type, normalized.selection?.[type]);
    if (!item) continue;

    ctx.fillStyle = '#6e7a80';
    ctx.font = '700 19px Arial';
    ctx.fillText(typeLabel(type).toUpperCase(), 72, y);

    ctx.fillStyle = '#182126';
    ctx.font = '700 25px Arial';
    const itemName = item.brand + ' ' + item.model;
    const lines = wrapCanvasText(ctx, itemName, 820);
    ctx.fillText(lines[0], 72, y + 34);

    ctx.fillStyle = '#315d72';
    ctx.font = '700 22px Arial';
    ctx.fillText(formatMoney(item.price_cents), 930, y + 34);

    const meta = componentMeta(item, type);
    if (meta.length) {
      ctx.fillStyle = '#6e7a80';
      ctx.font = '18px Arial';
      ctx.fillText(meta.join(' · '), 72, y + 64);
      y += 106;
    } else {
      y += 80;
    }

    ctx.strokeStyle = '#dfe5e8';
    ctx.beginPath();
    ctx.moveTo(72, y - 18);
    ctx.lineTo(1128, y - 18);
    ctx.stroke();
  }

  ctx.fillStyle = '#6e7a80';
  ctx.font = '18px Arial';
  ctx.fillText(t('export.generatedBy') + ' · helioconde.github.io/montapc', 72, 1430);

  canvas.toBlob(blob => {
    if (blob) triggerDownload(blob, safeFilename(normalized.name) + '.png');
  }, 'image/png');
}

async function updateSavedBuildMeta(id, patch) {
  const builds = visibleSavedBuilds().map(normalizeSavedBuild);
  const build = builds.find(item => item.id === id);
  if (!build) return;

  const next = { ...build, ...patch, updatedAt: Date.now() };

  if (currentUser && supabaseClient) {
    const payload = {};
    if ('isFavorite' in patch) payload.is_favorite = Boolean(patch.isFavorite);
    if ('visibility' in patch) payload.visibility = patch.visibility === 'public' ? 'public' : 'private';
    payload.updated_at = new Date().toISOString();

    const { error } = await supabaseClient
      .from('montapc_builds')
      .update(payload)
      .eq('id', id);
    if (error) throw error;

    cloudBuilds = cloudBuilds.map(item => item.id === id ? normalizeSavedBuild(next) : item);
  } else {
    const locals = readLocal().map(normalizeSavedBuild).map(item => item.id === id ? normalizeSavedBuild(next) : item);
    writeLocal(locals);
  }

  if (currentBuild?.id === id) currentBuild = normalizeSavedBuild(next);
  renderSavedBuilds();
}

async function loadPublicBuildFromHash() {
  if (!window.location.hash.startsWith('#public=') || !supabaseClient) return false;
  try {
    const id = decodeURIComponent(window.location.hash.slice(8));
    if (!isUuid(id)) throw new Error('invalid_public_id');

    const { data: build, error } = await supabaseClient
      .from('montapc_builds')
      .select('*')
      .eq('id', id)
      .eq('visibility', 'public')
      .single();
    if (error || !build) throw error || new Error('public_not_found');

    const { data: items, error: itemError } = await supabaseClient
      .from('montapc_build_items')
      .select('component_id')
      .eq('build_id', id);
    if (itemError) throw itemError;

    const selection = {};
    for (const entry of items || []) {
      const part = catalog.find(item => item.id === entry.component_id);
      if (part) selection[part.component_type] = part.id;
    }

    const settings = parsePurpose(build.purpose);
    settings.budget = Number(build.budget_cents || 0) / 100;
    currentBuild = normalizeSavedBuild({
      id: null,
      name: build.name || t('share.title'),
      budgetCents: build.budget_cents,
      totalCents: build.total_cents,
      compatibilityStatus: build.compatibility_status,
      settings,
      selection,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visibility: 'private'
    });
    partsCollapsed = window.matchMedia('(max-width: 650px)').matches;

    plannerForm.elements.budget.value = Math.round(currentBuild.budgetCents / 100);
    plannerForm.elements.usage.value = settings.usage;
    plannerForm.elements.resolution.value = settings.resolution;
    plannerForm.elements.strategy.value = settings.strategy;
    renderBuild();
    showToast(t('share.publicLoaded'));
    return true;
  } catch (error) {
    console.error(error);
    showToast(t('share.invalid'));
    return false;
  }
}

async function duplicateSavedBuild(id) {
  const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === id);
  if (!build) return;

  const copy = normalizeSavedBuild({
    ...JSON.parse(JSON.stringify(build)),
    id: makeUuid(),
    name: build.name + ' · ' + t('saved.copySuffix'),
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  if (currentUser && supabaseClient) {
    const saved = await saveCloudBuild(copy);
    cloudBuilds = [saved, ...cloudBuilds];
  } else {
    saveLocalBuild(copy);
  }

  renderSavedBuilds();
  showToast(t('toast.duplicated'));
}

function renameSavedBuild(id) {
  const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === id);
  if (!build) return;
  currentBuild = JSON.parse(JSON.stringify(build));
  nameForm.elements.name.value = build.name;
  nameMessage.textContent = currentUser ? t('build.cloudSave') : t('build.localSave');
  nameDialog.showModal();
  window.setTimeout(() => nameForm.elements.name.select(), 30);
}

function loadSharedBuildFromHash() {
  if (!window.location.hash.startsWith('#build=')) return false;
  try {
    const payload = decodeSharedBuild(window.location.hash.slice(7));
    if (payload?.v !== 1 || !payload?.s || !payload?.p) throw new Error('invalid_share');

    const selection = {};
    for (const type of TYPE_ORDER) {
      const id = payload.p[type] || null;
      if (id && !component(type, id)) throw new Error('missing_component');
      selection[type] = id;
    }

    const settings = {
      budget: Number(payload.s.budget || Number(payload.b || 0) / 100 || 5000),
      usage: payload.s.usage || 'gaming',
      resolution: payload.s.resolution || '1440p',
      strategy: payload.s.strategy || 'balanced'
    };

    currentBuild = buildCandidate(selection, settings, Number(payload.b || settings.budget * 100));
    currentBuild.name = payload.n || t('share.title');
    partsCollapsed = window.matchMedia('(max-width: 650px)').matches;
    plannerForm.elements.budget.value = Math.round(currentBuild.budgetCents / 100);
    plannerForm.elements.usage.value = settings.usage;
    plannerForm.elements.resolution.value = settings.resolution;
    plannerForm.elements.strategy.value = settings.strategy;
    renderBuild();
    showToast(t('share.loaded'));
    return true;
  } catch (error) {
    console.error(error);
    showToast(t('share.invalid'));
    return false;
  }
}

async function migrateLegacyRequests() {
  if (readLocal().length || !catalog.length) return;
  try {
    const legacy = JSON.parse(localStorage.getItem('ideias-plus-04-monta-pc') || '[]');
    if (!Array.isArray(legacy) || !legacy.length) return;
    const migrated = [];
    for (const entry of legacy.slice(0, 10)) {
      const budget = Number(String(entry.title || '').replace(/[^0-9.,]/g,'').replace(',','.'));
      const parts = String(entry.meta || '').split(' · ');
      if (!Number.isFinite(budget) || budget < 1500) continue;
      const settings = {
        budget,
        usage: /trabalho|produt/i.test(parts[0] || '') ? 'work' : 'gaming',
        resolution: /4k/i.test(parts[1] || '') ? '4k' : /1080/i.test(parts[1] || '') ? '1080p' : '1440p',
        strategy: 'balanced'
      };
      const generated = generateBestBuild(settings).build;
      if (!generated) continue;
      generated.id = makeUuid();
      generated.name = t('saved.migrated') + ' · ' + settings.resolution;
      generated.createdAt = Number(entry.time || Date.now());
      generated.updatedAt = generated.createdAt;
      migrated.push(generated);
    }
    if (migrated.length) writeLocal(migrated);
  } catch {
    // O histórico antigo é preservado caso não possa ser migrado.
  }
}

function authErrorText(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return t('auth.invalid');
  if (message.includes('email not confirmed')) return t('auth.confirmEmail');
  if (message.includes('already registered')) return t('auth.registered');
  if (message.includes('password should be at least')) return t('auth.password');
  return t('auth.generic');
}

function updateAccountUi() {
  accountOpen.disabled = !supabaseClient;
  accountOpen.textContent = currentUser ? t('header.myAccount') : t('header.account');

  if (!catalog.length) {
    syncStatus.textContent = t('status.catalogUnavailable');
  } else if (currentUser) {
    syncStatus.textContent = cloudLoading ? t('status.syncing') : t('status.cloud', { user: currentUser.email || t('account.connectedFallback') });
  } else {
    syncStatus.textContent = t('status.local');
  }

  accountForm.hidden = Boolean(currentUser) || !supabaseClient;
  accountProfile.hidden = !currentUser;
  if (currentUser) {
    document.querySelector('#account-email').textContent = currentUser.email || t('account.connectedFallback');
    importLocalButton.hidden = readLocal().length === 0;
  }
}

async function importLocalBuilds() {
  if (!currentUser) return;
  const local = readLocal().map(normalizeSavedBuild);
  if (!local.length) return;

  importLocalButton.disabled = true;
  accountMessage.textContent = t('auth.importing');
  try {
    for (const build of local) {
      await saveCloudBuild({
        ...build,
        id: isUuid(build.id) ? build.id : makeUuid()
      });
    }
    localStorage.removeItem(LOCAL_KEY);
    await loadCloudBuilds();
    accountMessage.textContent = t('auth.imported');
    importLocalButton.hidden = true;
  } catch (error) {
    console.error(error);
    accountMessage.textContent = t('auth.importError');
  } finally {
    importLocalButton.disabled = false;
  }
}

async function loadCatalog() {
  if (!supabaseClient) throw new Error('supabase_unavailable');
  const { data, error } = await supabaseClient
    .from('montapc_components')
    .select('*')
    .eq('active', true)
    .order('component_type', { ascending:true })
    .order('price_cents', { ascending:true });
  if (error) throw error;
  catalog = data || [];
  groupCatalog();
  document.querySelector('#catalog-count').textContent = String(catalog.length);
  populateCatalogBrands();
  renderCatalogExplorer();
}

plannerForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!catalog.length) {
    showToast(t('toast.catalogLoading'));
    return;
  }

  const settings = settingsFromForm();
  const result = generateBestBuild(settings);
  if (!result.build) {
    showToast(t('toast.noCompatible'));
    return;
  }

  currentBuild = result.build;
  currentBuild.name = '';
  partsCollapsed = window.matchMedia('(max-width: 650px)').matches;
  renderBuild();
  trackEvent('build_generated', {
    usage: settings.usage,
    resolution: settings.resolution,
    strategy: settings.strategy,
    budget: Math.round(settings.budget)
  });

  if (!result.withinBudget) {
    showToast(t('toast.belowBudget'));
  } else {
    showToast(t('toast.generated'));
  }
});

partsList.addEventListener('change', event => {
  const select = event.target.closest('[data-part]');
  if (!select || !currentBuild) return;
  currentBuild.selection[select.dataset.part] = select.value || null;
  currentBuild.id = currentBuild.id || null;
  currentBuild.updatedAt = Date.now();
  renderBuild();
  trackEvent('part_swapped', { type: select.dataset.part });
});

performanceQuality?.addEventListener('change', renderPerformanceEstimate);

document.querySelector('#print-build')?.addEventListener('click', () => {
  if (!currentBuild) return;
  document.body.classList.add('printing-build');
  window.print();
  window.setTimeout(() => document.body.classList.remove('printing-build'), 300);
});

partsToggle?.addEventListener('click', () => {
  partsCollapsed = !partsCollapsed;
  updatePartsVisibility();
});

window.addEventListener('resize', updatePartsVisibility);

document.querySelector('#reset-build').addEventListener('click', () => {
  const result = generateBestBuild(settingsFromForm());
  currentBuild = result.build;
  if (currentBuild) currentBuild.name = '';
  renderBuild();
});

document.querySelector('.alternative-actions')?.addEventListener('click', event => {
  const button = event.target.closest('[data-alternative]');
  if (!button || !currentBuild) return;

  const settings = { ...currentBuild.settings };
  if (button.dataset.alternative === 'save500') {
    settings.budget = Math.max(1500, Math.floor(Number(settings.budget || 0) - 500));
    settings.strategy = 'economy';
  } else if (button.dataset.alternative === 'gpu') {
    settings.strategy = 'fps';
  } else if (button.dataset.alternative === 'cpu') {
    settings.strategy = 'cpu';
  } else if (button.dataset.alternative === 'upgrade') {
    settings.strategy = 'upgrade';
  }

  plannerForm.elements.budget.value = settings.budget;
  plannerForm.elements.strategy.value = settings.strategy;
  const result = generateBestBuild(settings);
  if (!result.build) {
    showToast(t('toast.noCompatible'));
    return;
  }

  currentBuild = result.build;
  currentBuild.name = '';
  renderBuild();
  showToast(t('alternatives.applied'));
});

saveBuildButton.addEventListener('click', () => {
  if (!currentBuild || !compatibility(currentBuild).ok) return;
  nameForm.elements.name.value = currentBuild.name || `PC ${currentBuild.settings.resolution} · ${formatMoney(currentBuild.totalCents)}`;
  nameMessage.textContent = currentUser ? t('build.cloudSave') : t('build.localSave');
  nameDialog.showModal();
  window.setTimeout(() => nameForm.elements.name.select(), 30);
});

document.querySelector('#name-close').addEventListener('click', () => nameDialog.close());
nameDialog.addEventListener('click', event => {
  if (event.target === nameDialog) nameDialog.close();
});

nameForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentBuild || !nameForm.reportValidity()) return;
  const submit = nameForm.querySelector('[type="submit"]');
  submit.disabled = true;
  nameMessage.textContent = currentUser ? t('build.savingCloud') : t('build.saving');
  try {
    await persistCurrentBuild(nameForm.elements.name.value);
    nameDialog.close();
    showToast(t('toast.saved'));
    trackEvent('build_saved', {
      storage: currentUser ? 'cloud' : 'local',
      resolution: currentBuild?.settings?.resolution || ''
    });
  } catch (error) {
    console.error(error);
    nameMessage.textContent = error.message === 'incompatible'
      ? t('build.incompatibleSave')
      : t('build.saveError');
  } finally {
    submit.disabled = false;
  }
});

savedBuilds.addEventListener('click', async event => {
  const compare = event.target.closest('[data-compare]');
  if (compare) {
    toggleCompare(compare.dataset.compare);
    return;
  }

  const open = event.target.closest('[data-open]');
  if (open) {
    openSavedBuild(open.dataset.open);
    return;
  }

  const rename = event.target.closest('[data-rename]');
  if (rename) {
    renameSavedBuild(rename.dataset.rename);
    return;
  }

  const duplicate = event.target.closest('[data-duplicate]');
  if (duplicate) {
    duplicate.disabled = true;
    try {
      await duplicateSavedBuild(duplicate.dataset.duplicate);
    } catch (error) {
      console.error(error);
      showToast(t('build.saveError'));
    } finally {
      duplicate.disabled = false;
    }
    return;
  }

  const share = event.target.closest('[data-share]');
  if (share) {
    await shareSavedBuild(share.dataset.share);
    return;
  }

  const exportText = event.target.closest('[data-export-text]');
  if (exportText) {
    const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === exportText.dataset.exportText);
    if (build) exportBuildText(build);
    return;
  }

  const exportImage = event.target.closest('[data-export-image]');
  if (exportImage) {
    const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === exportImage.dataset.exportImage);
    if (build) exportBuildImage(build);
    return;
  }

  const favorite = event.target.closest('[data-favorite]');
  if (favorite) {
    const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === favorite.dataset.favorite);
    if (build) {
      try {
        await updateSavedBuildMeta(build.id, { isFavorite: !build.isFavorite });
        showToast(t('toast.favoriteUpdated'));
      } catch (error) {
        console.error(error);
        showToast(t('build.saveError'));
      }
    }
    return;
  }

  const visibility = event.target.closest('[data-visibility]');
  if (visibility) {
    const build = visibleSavedBuilds().map(normalizeSavedBuild).find(item => item.id === visibility.dataset.visibility);
    if (build) {
      try {
        await updateSavedBuildMeta(build.id, { visibility: build.visibility === 'public' ? 'private' : 'public' });
        showToast(t('toast.visibilityUpdated'));
      } catch (error) {
        console.error(error);
        showToast(t('build.saveError'));
      }
    }
    return;
  }

  const remove = event.target.closest('[data-delete]');
  if (!remove) return;
  if (!window.confirm(t('confirm.delete'))) return;
  remove.disabled = true;
  try {
    await deleteSavedBuild(remove.dataset.delete);
    showToast(t('toast.deleted'));
  } catch (error) {
    console.error(error);
    showToast(t('toast.deleteError'));
  } finally {
    remove.disabled = false;
  }
});

document.querySelector('#compare-clear')?.addEventListener('click', () => {
  compareSelection = [];
  renderSavedBuilds();
});

const resetCatalogFilters = () => {
  resetCatalogVisibleLimit();
  renderCatalogExplorer();
};
catalogSearch?.addEventListener('input', resetCatalogFilters);
catalogTypeFilter?.addEventListener('change', resetCatalogFilters);
catalogBrandFilter?.addEventListener('change', resetCatalogFilters);
catalogMaxPrice?.addEventListener('input', resetCatalogFilters);
catalogLoadMore?.addEventListener('click', () => {
  catalogVisibleLimit += catalogPageSize();
  renderCatalogExplorer();
});
catalogGrid?.addEventListener('click', event => {
  const button = event.target.closest('[data-component-details]');
  if (button) openComponentDialog(button.dataset.componentDetails);
});
document.querySelector('#component-dialog-close')?.addEventListener('click', () => componentDialog.close());
componentDialog?.addEventListener('click', event => {
  if (event.target === componentDialog) componentDialog.close();
});

document.querySelector('#feedback-open')?.addEventListener('click', () => {
  feedbackMessage.textContent = '';
  feedbackDialog?.showModal();
});
document.querySelector('#feedback-close')?.addEventListener('click', () => feedbackDialog?.close());
feedbackDialog?.addEventListener('click', event => {
  if (event.target === feedbackDialog) feedbackDialog.close();
});
feedbackForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabaseClient || !feedbackForm.reportValidity()) return;
  const submit = feedbackForm.querySelector('[type="submit"]');
  submit.disabled = true;
  feedbackMessage.textContent = '';
  try {
    const analytics = window.MONTAPC_ANALYTICS;
    const { error } = await supabaseClient.from('montapc_feedback').insert({
      session_id: analytics?.getSessionId?.() || makeUuid(),
      user_id: currentUser?.id || null,
      rating: Number(feedbackForm.elements.rating.value),
      category: feedbackForm.elements.category.value,
      comment: feedbackForm.elements.comment.value.trim(),
      locale: i18n?.locale === 'en' ? 'en' : 'pt-BR',
      viewport: analytics?.getViewport?.() || (window.innerWidth < 650 ? 'mobile' : window.innerWidth < 1000 ? 'tablet' : 'desktop')
    });
    if (error) throw error;
    feedbackMessage.textContent = t('feedback.sent');
    feedbackForm.reset();
  } catch (error) {
    console.error(error);
    feedbackMessage.textContent = t('feedback.error');
  } finally {
    submit.disabled = false;
  }
});

accountOpen.addEventListener('click', () => accountDialog.showModal());
document.querySelector('#account-close').addEventListener('click', () => accountDialog.close());
accountDialog.addEventListener('click', event => {
  if (event.target === accountDialog) accountDialog.close();
});

accountForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabaseClient) return;
  const submit = accountForm.querySelector('[type="submit"]');
  submit.disabled = true;
  accountMessage.textContent = t('auth.signingIn');
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: accountForm.elements.email.value.trim(),
      password: accountForm.elements.password.value
    });
    if (error) throw error;
    accountMessage.textContent = t('auth.connected');
  } catch (error) {
    accountMessage.textContent = authErrorText(error);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector('#sign-up').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const email = accountForm.elements.email.value.trim();
  const password = accountForm.elements.password.value;
  if (!email || password.length < 8) {
    accountMessage.textContent = t('auth.fillCredentials');
    return;
  }
  const button = document.querySelector('#sign-up');
  button.disabled = true;
  accountMessage.textContent = t('auth.creating');
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    accountMessage.textContent = data.session
      ? t('auth.createdConnected')
      : t('auth.createdConfirm');
  } catch (error) {
    accountMessage.textContent = authErrorText(error);
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#reset-password').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const email = accountForm.elements.email.value.trim();
  if (!email) {
    accountMessage.textContent = t('auth.enterEmail');
    return;
  }
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split('#')[0]
    });
    if (error) throw error;
    accountMessage.textContent = t('auth.resetSent');
  } catch (error) {
    accountMessage.textContent = authErrorText(error);
  }
});

document.querySelector('#sign-out').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  accountMessage.textContent = error ? t('auth.signOutError') : t('auth.signedOut');
});

importLocalButton.addEventListener('click', importLocalBuilds);

async function initAuth() {
  if (!supabaseClient) {
    updateAccountUi();
    renderSavedBuilds();
    return;
  }

  let activeUserId = null;
  const setSession = session => {
    const user = session?.user || null;
    if (user?.id === activeUserId) return;
    activeUserId = user?.id || null;
    currentUser = user;
    cloudBuilds = [];
    updateAccountUi();
    if (user) window.setTimeout(loadCloudBuilds, 0);
    else renderSavedBuilds();
  };

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => setSession(session), 0);
  });

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    accountMessage.textContent = t('auth.sessionError');
    renderSavedBuilds();
    return;
  }
  setSession(data.session);
}

document.addEventListener('montapc:languagechange', event => {
  updateAccountUi();
  renderBuild();
  renderSavedBuilds();
  populateCatalogBrands();
  renderCatalogExplorer();
  trackEvent('language_changed', { locale: event.detail?.locale || i18n?.locale || 'pt-BR' });
});

async function init() {
  updateAccountUi();
  renderBuild();
  renderSavedBuilds();

  try {
    await loadCatalog();
    await loadLivePrices();
    renderCatalogExplorer();
    const componentId = new URLSearchParams(window.location.search).get('component');
    const sharedComponent = componentId ? catalog.find(item => item.id === componentId) : null;
    if (sharedComponent) window.setTimeout(() => openComponentDialog(sharedComponent.id), 0);
    await migrateLegacyRequests();
    const loadedPublic = await loadPublicBuildFromHash();
    if (!loadedPublic) loadSharedBuildFromHash();
    renderSavedBuilds();
    updateAccountUi();
  } catch (error) {
    console.error(error);
    document.querySelector('#catalog-count').textContent = '0';
    syncStatus.textContent = t('status.catalogUnavailable');
    document.querySelector('#generate-build').disabled = true;
    showToast(t('toast.catalogError'));
  }

  await initAuth();
}

init();
