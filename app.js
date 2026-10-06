const supabaseClient = window.IDEIAS_SUPABASE?.client || null;
const LOCAL_KEY = 'montapc-builds-v2';

const TYPE_ORDER = ['cpu','motherboard','gpu','memory','storage','psu','case','cooler'];
const TYPE_LABELS = {
  cpu: 'Processador',
  motherboard: 'Placa-mãe',
  gpu: 'Placa de vídeo',
  memory: 'Memória',
  storage: 'Armazenamento',
  psu: 'Fonte',
  case: 'Gabinete',
  cooler: 'Cooler'
};

const plannerForm = document.querySelector('#planner-form');
const resultEmpty = document.querySelector('#result-empty');
const buildResult = document.querySelector('#build-result');
const partsList = document.querySelector('#parts-list');
const compatibilityList = document.querySelector('#compatibility-list');
const saveBuildButton = document.querySelector('#save-build');
const savedBuilds = document.querySelector('#saved-builds');
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

let catalog = [];
let byType = {};
let currentBuild = null;
let currentUser = null;
let cloudBuilds = [];
let cloudLoading = false;

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
  return (Number(cents || 0) / 100).toLocaleString('pt-BR', {
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
    if (!parts[type]) push(false, TYPE_LABELS[type] + ' não selecionado.');
  }

  if (parts.cpu && parts.motherboard) {
    push(
      parts.cpu.socket === parts.motherboard.socket,
      parts.cpu.socket === parts.motherboard.socket
        ? `Socket ${parts.cpu.socket}: processador e placa-mãe combinam.`
        : `Socket incompatível: CPU ${parts.cpu.socket || '—'} e placa-mãe ${parts.motherboard.socket || '—'}.`
    );
  }

  if (parts.motherboard && parts.memory) {
    const boardMemory = String(parts.motherboard.specs?.memory_type || '');
    const ramMemory = String(parts.memory.specs?.memory_type || '');
    push(
      boardMemory === ramMemory,
      boardMemory === ramMemory
        ? `Memória ${ramMemory}: compatível com a placa-mãe.`
        : `Memória incompatível: placa-mãe usa ${boardMemory || 'outro padrão'} e o kit é ${ramMemory || 'desconhecido'}.`
    );
  }

  if (parts.motherboard && parts.case) {
    const supported = Array.isArray(parts.case.specs?.form_factors) ? parts.case.specs.form_factors : [];
    const formFactor = String(parts.motherboard.specs?.form_factor || '');
    push(
      supported.includes(formFactor),
      supported.includes(formFactor)
        ? `Gabinete aceita placa-mãe ${formFactor}.`
        : `Gabinete não declara suporte ao formato ${formFactor || 'da placa-mãe'}.`
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
          ? `GPU de referência (${gpuLength} mm) cabe no limite do gabinete (${maxGpu} mm).`
          : `GPU de referência (${gpuLength} mm) excede o limite do gabinete (${maxGpu} mm).`)
        : 'Dimensão da GPU ou gabinete não informada; confirme o SKU antes da compra.',
      known ? (gpuLength <= maxGpu ? 'ok' : 'error') : 'warning'
    );
  }

  if (parts.cpu) {
    const coolerIncluded = Boolean(parts.cpu.specs?.cooler_included);
    if (!coolerIncluded && !parts.cooler) {
      push(false, 'Este processador exige cooler separado.', 'error');
    }
    if (parts.cooler) {
      const sockets = Array.isArray(parts.cooler.specs?.supported_sockets) ? parts.cooler.specs.supported_sockets : [];
      push(
        sockets.includes(parts.cpu.socket),
        sockets.includes(parts.cpu.socket)
          ? `Cooler suporta o socket ${parts.cpu.socket}.`
          : `Cooler não declara suporte ao socket ${parts.cpu.socket}.`
      );

      if (parts.case) {
        const height = Number(parts.cooler.specs?.height_mm || 0);
        const maxHeight = Number(parts.case.specs?.max_cooler_mm || 0);
        if (height && maxHeight) {
          push(
            height <= maxHeight,
            height <= maxHeight
              ? `Cooler de ${height} mm cabe no limite de ${maxHeight} mm do gabinete.`
              : `Cooler de ${height} mm é mais alto que o limite de ${maxHeight} mm do gabinete.`
          );
        }
      }
    } else if (coolerIncluded) {
      push(true, 'Processador inclui solução de refrigeração no catálogo de referência.', 'ok');
    }
  }

  if (parts.psu) {
    const required = requiredPsuWatts(build.selection);
    const available = Number(parts.psu.specs?.wattage || 0);
    push(
      available >= required,
      available >= required
        ? `Fonte de ${available} W atende a recomendação calculada de ${required} W.`
        : `Fonte insuficiente: ${available} W para uma recomendação de pelo menos ${required} W.`
    );
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
  const usage = { gaming:'Jogos', work:'Produtividade', mixed:'Uso misto' }[settings.usage] || settings.usage;
  const strategy = { balanced:'Equilíbrio', fps:'Mais FPS', upgrade:'Upgrades', economy:'Economia' }[settings.strategy] || settings.strategy;
  return `${usage} · ${settings.resolution} · ${strategy}`;
}

function renderCompatibility() {
  const state = compatibility(currentBuild);
  const badge = document.querySelector('#compatibility-badge');
  badge.textContent = state.ok ? 'Compatível' : 'Revisar conflitos';
  badge.className = 'compatibility-badge ' + (state.ok ? 'ok' : 'error');

  compatibilityList.innerHTML = state.checks.map(check =>
    '<div class="compatibility-item ' + check.level + '">' +
      '<span>' + (check.level === 'ok' ? '✓' : check.level === 'warning' ? '!' : '×') + '</span>' +
      '<p>' + escapeHtml(check.text) + '</p>' +
    '</div>'
  ).join('');

  saveBuildButton.disabled = !state.ok;
  document.querySelector('#build-psu').textContent = state.requiredPsu + ' W';
}

function optionLabel(item) {
  return `${item.brand} ${item.model} · ${formatMoney(item.price_cents)}`;
}

function renderParts() {
  const parts = selectedComponents();
  const cpuHasCooler = Boolean(parts.cpu?.specs?.cooler_included);

  partsList.innerHTML = TYPE_ORDER.map(type => {
    const selectedId = currentBuild.selection[type] || '';
    const options = byType[type] || [];

    if (type === 'cooler' && cpuHasCooler && !selectedId) {
      return '<article class="part-row">' +
        '<div class="part-label"><span>Cooler</span><strong>Incluso com o processador</strong><small>Sem custo adicional no catálogo</small></div>' +
        '<select data-part="cooler"><option value="" selected>Usar cooler incluso</option>' +
        options.map(item => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(optionLabel(item)) + '</option>').join('') +
        '</select></article>';
    }

    const selected = parts[type];
    return '<article class="part-row">' +
      '<div class="part-label"><span>' + escapeHtml(TYPE_LABELS[type]) + '</span>' +
        '<strong>' + (selected ? escapeHtml(selected.brand + ' ' + selected.model) : 'Não selecionado') + '</strong>' +
        '<small>' + (selected ? escapeHtml(formatMoney(selected.price_cents)) : 'Escolha uma peça') + '</small></div>' +
      '<select data-part="' + type + '">' +
        (type === 'cooler' ? '<option value="">Sem cooler separado</option>' : '') +
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
  document.querySelector('#build-title').textContent = currentBuild.name || 'PC recomendado';
  document.querySelector('#build-subtitle').textContent = settingsLabel(currentBuild.settings);
  document.querySelector('#build-total').textContent = formatMoney(currentBuild.totalCents);
  document.querySelector('#build-budget').textContent = formatMoney(currentBuild.budgetCents);
  const margin = currentBuild.budgetCents - currentBuild.totalCents;
  document.querySelector('#build-margin').textContent = (margin >= 0 ? '' : '−') + formatMoney(Math.abs(margin));
  document.querySelector('#build-margin').className = margin >= 0 ? 'positive' : 'negative';

  renderCompatibility();
  renderParts();
}

function normalizeSavedBuild(build) {
  return {
    id: build.id || makeUuid(),
    name: build.name || 'Minha build',
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

  savedBuilds.innerHTML = builds.length
    ? builds.map(build =>
      '<article class="saved-card">' +
        '<div><strong>' + escapeHtml(build.name) + '</strong>' +
        '<span>' + escapeHtml(settingsLabel(build.settings)) + '</span></div>' +
        '<div class="saved-values"><span>' + escapeHtml(formatMoney(build.totalCents)) + '</span>' +
        '<small class="' + (build.compatibilityStatus === 'compatible' ? 'status-ok' : 'status-warn') + '">' +
          (build.compatibilityStatus === 'compatible' ? 'Compatível' : 'Revisar') + '</small></div>' +
        '<div class="saved-actions"><button class="button ghost" type="button" data-open="' + escapeHtml(build.id) + '">Abrir</button>' +
        '<button class="button text danger-text" type="button" data-delete="' + escapeHtml(build.id) + '">Excluir</button></div>' +
      '</article>'
    ).join('')
    : '<div class="saved-empty"><strong>Nenhuma build salva ainda.</strong><span>Gere uma configuração e salve quando gostar do resultado.</span></div>';
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
    accountMessage.textContent = 'Não foi possível carregar suas builds.';
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
      accountMessage.textContent = 'As builds foram carregadas, mas faltaram itens.';
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
      generated.name = 'Build migrada · ' + settings.resolution;
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
  if (message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('already registered')) return 'Este e-mail já possui conta.';
  if (message.includes('password should be at least')) return 'Use uma senha com pelo menos 8 caracteres.';
  return 'Não foi possível concluir. Confira os dados e tente novamente.';
}

function updateAccountUi() {
  accountOpen.disabled = !supabaseClient;
  accountOpen.textContent = currentUser ? 'Minha conta' : 'Entrar / sincronizar';

  if (!catalog.length) {
    syncStatus.textContent = 'Catálogo indisponível';
  } else if (currentUser) {
    syncStatus.textContent = cloudLoading ? 'Sincronizando…' : 'Nuvem · ' + (currentUser.email || 'conectado');
  } else {
    syncStatus.textContent = 'Catálogo carregado · modo local';
  }

  accountForm.hidden = Boolean(currentUser) || !supabaseClient;
  accountProfile.hidden = !currentUser;
  if (currentUser) {
    document.querySelector('#account-email').textContent = currentUser.email || 'Conta conectada';
    importLocalButton.hidden = readLocal().length === 0;
  }
}

async function importLocalBuilds() {
  if (!currentUser) return;
  const local = readLocal().map(normalizeSavedBuild);
  if (!local.length) return;

  importLocalButton.disabled = true;
  accountMessage.textContent = 'Importando builds deste dispositivo…';
  try {
    for (const build of local) {
      await saveCloudBuild({
        ...build,
        id: isUuid(build.id) ? build.id : makeUuid()
      });
    }
    localStorage.removeItem(LOCAL_KEY);
    await loadCloudBuilds();
    accountMessage.textContent = 'Importação concluída.';
    importLocalButton.hidden = true;
  } catch (error) {
    console.error(error);
    accountMessage.textContent = 'Não foi possível importar tudo. Os dados locais foram preservados.';
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
}

plannerForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!catalog.length) {
    showToast('O catálogo ainda não foi carregado.');
    return;
  }

  const settings = settingsFromForm();
  const result = generateBestBuild(settings);
  if (!result.build) {
    showToast('Não encontramos uma combinação compatível no catálogo.');
    return;
  }

  currentBuild = result.build;
  currentBuild.name = '';
  renderBuild();

  if (!result.withinBudget) {
    showToast('O orçamento ficou abaixo da configuração compatível mais barata do catálogo.');
  } else {
    showToast('Configuração gerada.');
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
  nameMessage.textContent = currentUser ? 'Será salvo na sua conta.' : 'Será salvo neste dispositivo.';
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
  nameMessage.textContent = currentUser ? 'Salvando na nuvem…' : 'Salvando…';
  try {
    await persistCurrentBuild(nameForm.elements.name.value);
    nameDialog.close();
    showToast('Build salva.');
  } catch (error) {
    console.error(error);
    nameMessage.textContent = error.message === 'incompatible'
      ? 'Resolva os conflitos de compatibilidade antes de salvar.'
      : 'Não foi possível salvar a build.';
  } finally {
    submit.disabled = false;
  }
});

savedBuilds.addEventListener('click', async event => {
  const open = event.target.closest('[data-open]');
  if (open) {
    openSavedBuild(open.dataset.open);
    return;
  }

  const remove = event.target.closest('[data-delete]');
  if (!remove) return;
  if (!window.confirm('Excluir esta build salva?')) return;
  remove.disabled = true;
  try {
    await deleteSavedBuild(remove.dataset.delete);
    showToast('Build excluída.');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível excluir.');
  } finally {
    remove.disabled = false;
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
  accountMessage.textContent = 'Entrando…';
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: accountForm.elements.email.value.trim(),
      password: accountForm.elements.password.value
    });
    if (error) throw error;
    accountMessage.textContent = 'Conta conectada.';
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
    accountMessage.textContent = 'Informe um e-mail e uma senha com pelo menos 8 caracteres.';
    return;
  }
  const button = document.querySelector('#sign-up');
  button.disabled = true;
  accountMessage.textContent = 'Criando conta…';
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    accountMessage.textContent = data.session
      ? 'Conta criada e conectada.'
      : 'Conta criada. Confirme seu e-mail e depois entre.';
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
    accountMessage.textContent = 'Informe seu e-mail primeiro.';
    return;
  }
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split('#')[0]
    });
    if (error) throw error;
    accountMessage.textContent = 'Se o e-mail estiver cadastrado, enviaremos um link de recuperação.';
  } catch (error) {
    accountMessage.textContent = authErrorText(error);
  }
});

document.querySelector('#sign-out').addEventListener('click', async () => {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  accountMessage.textContent = error ? 'Não foi possível sair.' : 'Você saiu da conta.';
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
    accountMessage.textContent = 'Não foi possível verificar sua sessão. O modo local continua disponível.';
    renderSavedBuilds();
    return;
  }
  setSession(data.session);
}

async function init() {
  updateAccountUi();
  renderBuild();
  renderSavedBuilds();

  try {
    await loadCatalog();
    await migrateLegacyRequests();
    renderSavedBuilds();
    updateAccountUi();
  } catch (error) {
    console.error(error);
    document.querySelector('#catalog-count').textContent = '0';
    syncStatus.textContent = 'Falha ao carregar catálogo';
    document.querySelector('#generate-build').disabled = true;
    showToast('Não foi possível carregar o catálogo do MontaPC.');
  }

  await initAuth();
}

init();
