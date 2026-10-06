const supabaseClient = window.IDEIAS_SUPABASE?.client || null;
const i18n = window.MONTAPC_I18N;
const t = (key, vars) => i18n?.t(key, vars) ?? key;
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
const compatibilityList = document.querySelector('#compatibility-list');
const recommendationInsights = document.querySelector('#recommendation-insights');
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
const catalogGrid = document.querySelector('#catalog-grid');
const catalogResultsCount = document.querySelector('#catalog-results-count');
const componentDialog = document.querySelector('#component-dialog');
const componentDialogBody = document.querySelector('#component-dialog-body');

let catalog = [];
let byType = {};
let currentBuild = null;
let currentUser = null;
let cloudBuilds = [];
let cloudLoading = false;
let compareSelection = [];

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
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function humanSpecValue(value) {
  if (Array.isArray(value)) return value.join(' · ');
  if (typeof value === 'boolean') return value ? '✓' : '—';
  return String(value);
}

function renderCatalogExplorer() {
  if (!catalogGrid || !catalogSearch || !catalogTypeFilter) return;
  const query = catalogSearch.value.trim().toLowerCase();
  const type = catalogTypeFilter.value;

  const items = catalog.filter(item => {
    const matchesType = !type || item.component_type === type;
    const haystack = [item.brand, item.model, item.socket, item.component_type].filter(Boolean).join(' ').toLowerCase();
    return matchesType && (!query || haystack.includes(query));
  });

  catalogResultsCount.textContent = t('catalog.results', { count: items.length });
  catalogGrid.innerHTML = items.length
    ? items.map(item =>
        '<article class="catalog-card">' +
          '<span>' + escapeHtml(typeLabel(item.component_type)) + '</span>' +
          '<strong>' + escapeHtml(item.brand + ' ' + item.model) + '</strong>' +
          '<div class="part-meta">' + componentMeta(item, item.component_type).map(value => '<em>' + escapeHtml(value) + '</em>').join('') + '</div>' +
          '<small>' + escapeHtml(t('catalog.referencePrice')) + ': ' + escapeHtml(formatMoney(item.price_cents)) + '</small>' +
          '<button class="button ghost" type="button" data-component-details="' + escapeHtml(item.id) + '">' + escapeHtml(t('catalog.details')) + '</button>' +
        '</article>'
      ).join('')
    : '<div class="catalog-no-results">' + escapeHtml(t('catalog.noResults')) + '</div>';
}

function openComponentDialog(id) {
  const item = catalog.find(componentItem => componentItem.id === id);
  if (!item || !componentDialog || !componentDialogBody) return;

  document.querySelector('#component-dialog-title').textContent = item.brand + ' ' + item.model;
  const specs = catalogSpecEntries(item);
  const source = String(item.specs?.spec_source || '');

  componentDialogBody.innerHTML =
    '<div class="component-detail-summary">' +
      '<span>' + escapeHtml(typeLabel(item.component_type)) + '</span>' +
      '<strong>' + escapeHtml(formatMoney(item.price_cents)) + '</strong>' +
    '</div>' +
    '<div class="component-spec-grid">' +
      specs.map(([key, value]) =>
        '<div><span>' + escapeHtml(humanSpecKey(key)) + '</span><strong>' + escapeHtml(humanSpecValue(value)) + '</strong></div>'
      ).join('') +
    '</div>' +
    (source.startsWith('https://')
      ? '<a class="component-source" href="' + escapeHtml(source) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t('catalog.source')) + ' ↗</a>'
      : '');

  componentDialog.showModal();
}

function priceOf(item) {
  return Number(item?.price_cents || 0);
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
  if (settings.strategy === 'upgrade') {
    if (p.cpu?.socket === 'AM5') score += 10;
    if (p.memory?.specs?.memory_type === 'DDR5') score += 5;
    if (Number(p.psu?.specs?.wattage || 0) >= requiredPsuWatts(selection) + 100) score += 3;
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

  if (settings.usage === 'work') {
    insights.push(t('insights.work'));
  } else if (settings.usage === 'mixed') {
    insights.push(t('insights.mixed'));
  } else {
    insights.push(t('insights.gaming', { resolution: settings.resolution || '—' }));
  }

  insights.push(t('insights.platform', { socket, memory: memoryType }));

  if (margin >= 0) {
    insights.push(t('insights.budget', { percent, margin: formatMoney(margin) }));
  } else {
    insights.push(t('insights.overBudget', { amount: formatMoney(Math.abs(margin)) }));
  }

  if (settings.strategy === 'upgrade') insights.push(t('insights.upgrade'));
  if (settings.strategy === 'economy') insights.push(t('insights.economy'));

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
  return `${item.brand} ${item.model} · ${formatMoney(item.price_cents)}`;
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
      '<div class="part-label"><span>' + escapeHtml(typeLabel(type)) + '</span>' +
        '<strong>' + (selected ? escapeHtml(selected.brand + ' ' + selected.model) : t('part.notSelected', { type: typeLabel(type) })) + '</strong>' +
        (selected && componentMeta(selected, type).length
          ? '<div class="part-meta">' + componentMeta(selected, type).map(value => '<em>' + escapeHtml(value) + '</em>').join('') + '</div>'
          : '') +
        '<small>' + (selected ? escapeHtml(formatMoney(selected.price_cents)) : t('part.choose')) + '</small></div>' +
      '<select data-part="' + type + '">' +
        (type === 'cooler' ? '<option value="">' + escapeHtml(t('part.noSeparateCooler')) + '</option>' : '') +
        options.map(item => '<option value="' + escapeHtml(item.id) + '"' + (selectedId === item.id ? ' selected' : '') + '>' +
          escapeHtml(optionLabel(item)) + '</option>').join('') +
      '</select></article>';
  }).join('');
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
  renderParts();
}

function normalizeSavedBuild(build) {
  return {
    id: build.id || makeUuid(),
    name: build.name || t('saved.defaultName'),
    budgetCents: Number(build.budgetCents || 0),
    totalCents: Number(build.totalCents || buildTotal(build.selection || {})),
    compatibilityStatus: build.compatibilityStatus || 'pending',
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
        '<div><strong>' + escapeHtml(build.name) + '</strong>' +
        '<span>' + escapeHtml(settingsLabel(build.settings)) + '</span></div>' +
        '<div class="saved-values"><span>' + escapeHtml(formatMoney(build.totalCents)) + '</span>' +
        '<small class="' + (build.compatibilityStatus === 'compatible' ? 'status-ok' : 'status-warn') + '">' +
          (build.compatibilityStatus === 'compatible' ? t('result.compatible') : t('saved.review')) + '</small></div>' +
        '<div class="saved-actions"><button class="button ghost" type="button" data-compare="' + escapeHtml(build.id) + '">' + escapeHtml(t('compare.select')) + '</button>' +
        '<button class="button ghost" type="button" data-open="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.open')) + '</button>' +
        '<button class="button ghost" type="button" data-rename="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.rename')) + '</button>' +
        '<button class="button ghost" type="button" data-duplicate="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.duplicate')) + '</button>' +
        '<button class="button ghost" type="button" data-share="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.share')) + '</button>' +
        '<button class="button text danger-text" type="button" data-delete="' + escapeHtml(build.id) + '">' + escapeHtml(t('saved.delete')) + '</button></div>' +
      '</article>'
    ).join('')
    : '<div class="saved-empty"><strong>' + escapeHtml(t('saved.emptyTitle')) + '</strong><span>' + escapeHtml(t('saved.emptyCopy')) + '</span></div>';

  renderComparison();
}


function comparePartName(build, type) {
  const item = component(type, build.selection?.[type]);
  return item ? item.brand + ' ' + item.model : '—';
}

function renderComparison() {
  if (!comparePanel || !compareContent) return;
  const builds = visibleSavedBuilds().map(normalizeSavedBuild)
    .filter(build => compareSelection.includes(build.id));

  comparePanel.hidden = builds.length === 0;

  if (builds.length !== 2) {
    compareContent.innerHTML = '<div class="compare-placeholder">' + escapeHtml(t('compare.needTwo')) + '</div>';
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
      formatMoney(b.budgetCents - b.totalCents)]
  ];

  compareContent.innerHTML =
    '<div class="compare-grid compare-grid-head"><span></span><strong>' + escapeHtml(a.name) + '</strong><strong>' + escapeHtml(b.name) + '</strong></div>' +
    rows.map(row =>
      '<div class="compare-grid"><span>' + escapeHtml(row[0]) + '</span><div>' + escapeHtml(row[1]) + '</div><div>' + escapeHtml(row[2]) + '</div></div>'
    ).join('') +
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
  url.hash = 'build=' + sharedBuildToken(build);

  try {
    await navigator.clipboard.writeText(url.toString());
    showToast(t('toast.shared'));
  } catch {
    const input = document.createElement('textarea');
    input.value = url.toString();
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    input.remove();
    showToast(ok ? t('toast.shared') : t('toast.shareError'));
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
  renderBuild();

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
});

document.querySelector('#reset-build').addEventListener('click', () => {
  const result = generateBestBuild(settingsFromForm());
  currentBuild = result.build;
  if (currentBuild) currentBuild.name = '';
  renderBuild();
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

catalogSearch?.addEventListener('input', renderCatalogExplorer);
catalogTypeFilter?.addEventListener('change', renderCatalogExplorer);
catalogGrid?.addEventListener('click', event => {
  const button = event.target.closest('[data-component-details]');
  if (button) openComponentDialog(button.dataset.componentDetails);
});
document.querySelector('#component-dialog-close')?.addEventListener('click', () => componentDialog.close());
componentDialog?.addEventListener('click', event => {
  if (event.target === componentDialog) componentDialog.close();
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

document.addEventListener('montapc:languagechange', () => {
  updateAccountUi();
  renderBuild();
  renderSavedBuilds();
  renderCatalogExplorer();
});

async function init() {
  updateAccountUi();
  renderBuild();
  renderSavedBuilds();

  try {
    await loadCatalog();
    await migrateLegacyRequests();
    loadSharedBuildFromHash();
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
