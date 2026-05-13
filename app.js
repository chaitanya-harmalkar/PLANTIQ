/* =====================================================
   PLANTIQ — COMPLETE APPLICATION LOGIC
   Manual Weather Entry • AI Analysis • UI
   ===================================================== */

'use strict';

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
const STATE = {
  plant:   'tomato',
  soil:    'loamy',
  weather: null,
  moisture: null,
  alerts:  [],
  hasData: false,
  activeSection: 'dashboard'
};

// ─────────────────────────────────────────────
//  PLANT DATA
// ─────────────────────────────────────────────
const PLANTS = {
  tomato: {
    name: 'Tomatoes', emoji: '🍅',
    daysToHarvest: 70, optimalTempMin: 18, optimalTempMax: 29,
    optimalMoistureMin: 50, optimalMoistureMax: 75,
    npk: { N: 'High', P: 'Medium', K: 'High' },
    tips: [
      { icon: '💧', text: 'Water deeply 2-3x per week; avoid wetting foliage to prevent blight.' },
      { icon: '☀️', text: 'Needs 6-8 hours of direct sunlight daily for best fruit set.' },
      { icon: '🌡️', text: 'Keep temperatures between 18-29°C. Protect from frost.' },
      { icon: '🪴', text: 'Support with stakes or cages when plant reaches 30cm height.' },
      { icon: '✂️', text: 'Prune suckers regularly to improve airflow and yield.' }
    ],
    stages: ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Ripe'],
    stagePct: [10, 30, 55, 80, 100]
  },
  pepper: {
    name: 'Peppers', emoji: '🌶️',
    daysToHarvest: 80, optimalTempMin: 20, optimalTempMax: 32,
    optimalMoistureMin: 45, optimalMoistureMax: 70,
    npk: { N: 'Medium', P: 'High', K: 'High' },
    tips: [
      { icon: '💧', text: 'Keep soil consistently moist; pepper roots are sensitive to dry spells.' },
      { icon: '🌡️', text: 'Ideal soil temperature is 21-32°C. Cold stunts growth.' },
      { icon: '🌾', text: 'Apply phosphorus-rich fertilizer during flowering stage.' },
      { icon: '☀️', text: 'Requires full sun — minimum 6 hours per day.' },
      { icon: '🕷️', text: 'Watch for aphids and spider mites in dry, hot weather.' }
    ],
    stages: ['Seedling', 'Vegetative', 'Budding', 'Fruiting', 'Mature'],
    stagePct: [10, 30, 55, 80, 100]
  },
  lettuce: {
    name: 'Lettuce', emoji: '🥬',
    daysToHarvest: 45, optimalTempMin: 10, optimalTempMax: 22,
    optimalMoistureMin: 60, optimalMoistureMax: 80,
    npk: { N: 'High', P: 'Low', K: 'Medium' },
    tips: [
      { icon: '💧', text: 'Lettuce is 95% water — keep soil consistently moist, not waterlogged.' },
      { icon: '🌡️', text: 'Cool-season crop; bolts in heat above 24°C. Shade in summer.' },
      { icon: '🌿', text: 'Harvest outer leaves first (cut-and-come-again method).' },
      { icon: '🧪', text: 'Apply nitrogen-rich fertilizer every 2-3 weeks.' },
      { icon: '🪲', text: 'Protect from slugs with copper tape or diatomaceous earth.' }
    ],
    stages: ['Germination', 'Seedling', 'Rosette', 'Heading', 'Ready'],
    stagePct: [10, 25, 50, 80, 100]
  },
  wheat: {
    name: 'Wheat', emoji: '🌾',
    daysToHarvest: 120, optimalTempMin: 12, optimalTempMax: 25,
    optimalMoistureMin: 40, optimalMoistureMax: 65,
    npk: { N: 'High', P: 'Medium', K: 'Low' },
    tips: [
      { icon: '🌱', text: 'Sow winter wheat in autumn for spring harvest; spring wheat in early spring.' },
      { icon: '💧', text: 'Critical watering stages: tillering, jointing, and grain fill.' },
      { icon: '🧪', text: 'Top-dress with nitrogen at tillering stage for maximum yield.' },
      { icon: '🌾', text: 'Harvest when grain moisture reaches 20-25%; dry to 12% for storage.' },
      { icon: '🔬', text: 'Scout regularly for rust, powdery mildew, and fusarium head blight.' }
    ],
    stages: ['Germination', 'Tillering', 'Jointing', 'Heading', 'Ripe'],
    stagePct: [10, 30, 55, 80, 100]
  },
  corn: {
    name: 'Corn', emoji: '🌽',
    daysToHarvest: 90, optimalTempMin: 18, optimalTempMax: 32,
    optimalMoistureMin: 50, optimalMoistureMax: 75,
    npk: { N: 'Very High', P: 'High', K: 'Medium' },
    tips: [
      { icon: '☀️', text: 'Needs full sun and warm soil (>15°C) to germinate properly.' },
      { icon: '💧', text: 'Most critical watering period is during tasseling and silking stages.' },
      { icon: '🧪', text: 'Corn is a heavy nitrogen feeder — side-dress at V6 stage.' },
      { icon: '🌽', text: 'Ready to harvest when silk turns brown and kernels are milky.' },
      { icon: '🪲', text: 'Monitor for corn earworm and apply controls if pressure is high.' }
    ],
    stages: ['Germination', 'Vegetative', 'Tasseling', 'Silking', 'Mature'],
    stagePct: [10, 30, 60, 80, 100]
  },
  rice: {
    name: 'Rice', emoji: '🌾',
    daysToHarvest: 110, optimalTempMin: 20, optimalTempMax: 35,
    optimalMoistureMin: 70, optimalMoistureMax: 95,
    npk: { N: 'Very High', P: 'Medium', K: 'High' },
    tips: [
      { icon: '💧', text: 'Flood paddy to 5-10cm depth during vegetative and reproductive stages.' },
      { icon: '🌡️', text: 'Sensitive to cold — nighttime temperatures below 15°C reduce yield.' },
      { icon: '🧪', text: 'Split nitrogen applications: at transplanting, tillering, and panicle initiation.' },
      { icon: '🌾', text: 'Harvest when 80-85% of grains have turned golden-yellow.' },
      { icon: '🦟', text: 'Monitor for stem borer and brown planthopper — major pests.' }
    ],
    stages: ['Nursery', 'Tillering', 'Panicle Initiation', 'Flowering', 'Mature'],
    stagePct: [10, 30, 55, 75, 100]
  },
  herbs: {
    name: 'Herbs', emoji: '🌿',
    daysToHarvest: 30, optimalTempMin: 15, optimalTempMax: 28,
    optimalMoistureMin: 40, optimalMoistureMax: 65,
    npk: { N: 'Low', P: 'Low', K: 'Low' },
    tips: [
      { icon: '✂️', text: 'Harvest herbs in the morning after dew dries for maximum flavor.' },
      { icon: '✂️', text: 'Pinch off flower buds to keep herbs in vegetative, flavorful state.' },
      { icon: '💧', text: 'Most herbs prefer "dry feet" — well-draining soil with moderate watering.' },
      { icon: '🌱', text: 'Avoid over-fertilizing — herbs grow best in lean soils.' },
      { icon: '☀️', text: 'Most herbs need 4-6 hours of sun; basil and rosemary prefer full sun.' }
    ],
    stages: ['Seedling', 'Vegetative', 'Bushy', 'Pre-flower', 'Peak Flavor'],
    stagePct: [15, 35, 60, 80, 100]
  }
};

// Soil water-retention factors
const SOIL_RETENTION = {
  loamy: 0.9, sandy: 0.45, clay: 1.15, silty: 1.0, peaty: 1.3, chalky: 0.7
};

// Quick preset data
const PRESETS = {
  'hot-dry':    { temp: 38, humidity: 22, rain: 0,   uv: 11, wind: 25, et: 8,   label: 'Hot & Dry' },
  'warm-humid': { temp: 28, humidity: 78, rain: 3,   uv: 6,  wind: 10, et: 4,   label: 'Warm & Humid' },
  'cool-rainy': { temp: 15, humidity: 90, rain: 18,  uv: 2,  wind: 18, et: 1.5, label: 'Cool & Rainy' },
  'mild-clear': { temp: 23, humidity: 55, rain: 0,   uv: 7,  wind: 12, et: 3.5, label: 'Mild & Clear' },
  'winter':     { temp: 6,  humidity: 72, rain: 2,   uv: 1,  wind: 8,  et: 0.8, label: 'Winter Cold' }
};

// ─────────────────────────────────────────────
//  DOM REFERENCES
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  geoBtn:         $('geoBtn'),
  geoBtnText:     $('geoBtnText'),
  geoIcon:        $('geoIcon'),
  weatherModal:   $('weatherModal'),
  modalClose:     $('modalClose'),
  btnCancel:      $('btnCancel'),
  btnApply:       $('btnApply'),
  formError:      $('formError'),
  locationBanner: $('locationBanner'),
  locationText:   $('locationText'),
  locationCoords: $('locationCoords'),
  locEditBtn:     $('locEditBtn'),
  weatherRow:     $('weatherRow'),
  noDataHint:     $('noDataHint'),
  dashGrid:       document.querySelector('.dashboard-grid'),
  alertBadge:     $('alertBadge'),
  alertCount:     $('alertCount'),
  alertsList:     $('alertsList'),
  alertsEmpty:    $('alertsEmpty'),
  fullAlertsList: $('fullAlertsList'),
  lastUpdated:    $('lastUpdated').querySelector('.lu-text'),
  toastContainer: $('toastContainer'),
  menuToggle:     $('menuToggle'),
  sidebar:        $('sidebar'),
  // Form inputs
  inputLocation:  $('inputLocation'),
  inputTemp:      $('inputTemp'),
  inputHumidity:  $('inputHumidity'),
  inputRain:      $('inputRain'),
  inputUV:        $('inputUV'),
  inputWind:      $('inputWind'),
  inputET:        $('inputET'),
};

// ─────────────────────────────────────────────
//  PARTICLE BACKGROUND
// ─────────────────────────────────────────────
function initParticles() {
  const container = $('bgParticles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 180 + 60;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*20+15}s;
      animation-delay:${Math.random()*15}s;
    `;
    container.appendChild(p);
  }
}

// ─────────────────────────────────────────────
//  DROPDOWN MENUS
// ─────────────────────────────────────────────
function initDropdowns() {
  const pWrapper = $('plantSelectWrapper');
  const pOptions = document.querySelectorAll('#plantOptions .select-option');

  pWrapper.addEventListener('click', e => {
    e.stopPropagation();
    closeAllDropdowns();
    pWrapper.classList.toggle('open');
  });

  pOptions.forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      pOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      STATE.plant = opt.dataset.value;
      $('plantSelected').textContent = opt.textContent.trim();
      pWrapper.classList.remove('open');
      onPlantOrSoilChange();
    });
  });

  const sWrapper = $('soilSelectWrapper');
  const sOptions = document.querySelectorAll('#soilOptions .select-option');

  sWrapper.addEventListener('click', e => {
    e.stopPropagation();
    closeAllDropdowns();
    sWrapper.classList.toggle('open');
  });

  sOptions.forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      sOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      STATE.soil = opt.dataset.value;
      $('soilSelected').textContent = opt.textContent.trim();
      sWrapper.classList.remove('open');
      onPlantOrSoilChange();
    });
  });

  document.addEventListener('click', closeAllDropdowns);
}

function closeAllDropdowns() {
  document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
}

function onPlantOrSoilChange() {
  updateHarvestSection();
  updateHarvestDetailPage();
  if (STATE.hasData) runAnalysis();
}

// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchSection(item.dataset.section);
    });
  });

  DOM.menuToggle.addEventListener('click', () => DOM.sidebar.classList.toggle('open'));

  document.addEventListener('click', e => {
    if (!DOM.sidebar.contains(e.target) && !DOM.menuToggle.contains(e.target)) {
      DOM.sidebar.classList.remove('open');
    }
  });
}

function switchSection(sec) {
  STATE.activeSection = sec;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  $(`section${sec.charAt(0).toUpperCase() + sec.slice(1)}`).classList.add('active');
  $(`nav${sec.charAt(0).toUpperCase() + sec.slice(1)}`).classList.add('active');

  const titles = {
    dashboard: ['Dashboard',                'Monitor your plants in real-time'],
    soil:      ['Soil Monitor',             'Detailed soil moisture & health analysis'],
    alerts:    ['All Alerts & Actions',     'AI-powered irrigation & fertilizer recommendations'],
    harvest:   ['Harvest Planning',         'Track readiness and plan your harvest'],
    diary:     ['Crop Diary',               'Your daily log of crop condition checks']
  };
  $('pageTitle').textContent    = (titles[sec] || titles.dashboard)[0];
  $('pageSubtitle').textContent = (titles[sec] || titles.dashboard)[1];

  // Render diary when switching to it
  if (sec === 'diary' && window.Diary) {
    Diary.renderAll($('diaryEntries'));
    var n = Diary.count();
    $('diaryEntryCount').textContent = n + (n === 1 ? ' entry' : ' entries');
  }
}

// ─────────────────────────────────────────────
//  WEATHER MODAL — OPEN / CLOSE
// ─────────────────────────────────────────────
function openWeatherModal() {
  DOM.weatherModal.style.display = 'flex';
  DOM.formError.style.display = 'none';
  // Pre-fill if editing existing data
  if (STATE.weather) {
    DOM.inputLocation.value = STATE.weather.location || '';
    DOM.inputTemp.value     = STATE.weather.temp;
    DOM.inputHumidity.value = STATE.weather.humidity;
    DOM.inputRain.value     = STATE.weather.rain;
    DOM.inputUV.value       = STATE.weather.uv;
    DOM.inputWind.value     = STATE.weather.wind;
    DOM.inputET.value       = STATE.weather.et || '';
  }
  setTimeout(() => DOM.inputTemp.focus(), 120);
}

function closeWeatherModal() {
  DOM.weatherModal.style.display = 'none';
}

// ─────────────────────────────────────────────
//  WEATHER MODAL — PRESETS
// ─────────────────────────────────────────────
function initPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;
      DOM.inputTemp.value     = preset.temp;
      DOM.inputHumidity.value = preset.humidity;
      DOM.inputRain.value     = preset.rain;
      DOM.inputUV.value       = preset.uv;
      DOM.inputWind.value     = preset.wind;
      DOM.inputET.value       = preset.et;
      DOM.formError.style.display = 'none';

      // Flash all inputs briefly
      [DOM.inputTemp, DOM.inputHumidity, DOM.inputRain, DOM.inputUV, DOM.inputWind, DOM.inputET].forEach(inp => {
        inp.style.borderColor = 'var(--green-500)';
        inp.style.background  = 'rgba(74,222,128,0.07)';
        setTimeout(() => { inp.style.borderColor = ''; inp.style.background = ''; }, 800);
      });
    });
  });
}

// ─────────────────────────────────────────────
//  WEATHER MODAL — APPLY
// ─────────────────────────────────────────────
function applyWeatherData() {
  const temp     = parseFloat(DOM.inputTemp.value);
  const humidity = parseFloat(DOM.inputHumidity.value);
  const rain     = parseFloat(DOM.inputRain.value)     || 0;
  const uv       = parseFloat(DOM.inputUV.value)       || 0;
  const wind     = parseFloat(DOM.inputWind.value)     || 0;
  const etRaw    = DOM.inputET.value.trim();
  const location = DOM.inputLocation.value.trim();

  // Validate required fields
  const errors = [];
  if (!location) errors.push('Please enter a location name (e.g. New Delhi, My Farm…)');
  if (isNaN(temp)     || temp     < -20 || temp     > 60)  errors.push('Temperature must be between -20 and 60 °C');
  if (isNaN(humidity) || humidity < 0   || humidity > 100) errors.push('Humidity must be between 0 and 100 %');
  if (!isNaN(parseFloat(DOM.inputRain.value)) && rain < 0) errors.push('Rainfall cannot be negative');
  if (!isNaN(parseFloat(DOM.inputUV.value))   && (uv < 0 || uv > 12)) errors.push('UV Index must be between 0 and 12');

  if (errors.length > 0) {
    DOM.formError.textContent = errors[0];
    DOM.formError.style.display = 'block';
    return;
  }

  // Compute ET estimate if blank
  const et = etRaw ? parseFloat(etRaw) : estimateET(temp, humidity, wind, uv);

  STATE.weather = {
    temp, humidity, rain, uv, wind, et,
    location,
    unit: { temp: '°C', wind: 'km/h' },
    daily: buildSyntheticDaily(temp, humidity, rain, uv, wind, et)
  };

  STATE.hasData = true;
  closeWeatherModal();

  // Update all UI
  showLocationBanner(location);
  updateWeatherCards();
  runAnalysis();
  updateAllAlerts();
  updateSoilSection();
  updateHarvestSection();
  updateHarvestDetailPage();
  buildTimeline();
  hideNoDataHint();

  const now = new Date();
  DOM.lastUpdated.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  showToast(`✅ Weather data applied for ${location}!`, 'success');
}

// Auto-estimate evapotranspiration (simplified Penman-Monteith inspired)
// Returns realistic values: ~1-3 mm/day (cool/humid) → ~6-9 mm/day (hot/dry/windy)
function estimateET(temp, humidity, wind, uv) {
  const vpdFactor = (1 - humidity / 100);   // vapour pressure deficit proxy (0–1)
  const et = (temp * 0.08 + wind * 0.04)    // base: temperature + wind contribution
           * (1 + vpdFactor * 0.5)           // drier air → more evaporation
           * (1 + uv * 0.03);               // stronger sun → more evaporation
  return Math.max(0.5, Math.min(10, parseFloat(et.toFixed(1))));
}

// Build one week of synthetic daily data for the timeline (gentle variation)
function buildSyntheticDaily(temp, humidity, rain, uv, wind, et) {
  const variations = [-2, 1, 3, 0, -1, 2, 1];
  const rainPattern = [0, rain * 0.3, rain * 0.8, 0, rain * 0.5, rain * 0.2, 0];
  return {
    temperature_2m_max:             variations.map(d => +(temp + d + 2).toFixed(1)),
    temperature_2m_min:             variations.map(d => +(temp + d - 4).toFixed(1)),
    precipitation_sum:              rainPattern.map(r => +r.toFixed(1)),
    et0_fao_evapotranspiration:     variations.map(d => +(et + d * 0.2).toFixed(1)),
    uv_index_max:                   variations.map(d => Math.max(0, +(uv + d * 0.4).toFixed(1))),
    relative_humidity_2m_max:       variations.map(d => Math.min(100, Math.max(0, humidity + d * 2)))
  };
}

// ─────────────────────────────────────────────
//  WEATHER CARDS
// ─────────────────────────────────────────────
function updateWeatherCards() {
  const w = STATE.weather;
  DOM.weatherRow.style.display = 'grid';

  $('wTemp').textContent     = `${w.temp}${w.unit.temp}`;
  $('wHumidity').textContent = `${w.humidity}%`;
  $('wRain').textContent     = `${w.rain} mm`;
  $('wUV').textContent       = w.uv.toFixed(1);
  $('wWind').textContent     = `${w.wind} km/h`;
  $('wET').textContent       = `${w.et?.toFixed(1) ?? '--'} mm`;

  const uvCard = $('wc-uv');
  if (w.uv >= 8) uvCard.style.borderColor = 'rgba(239,68,68,0.4)';
  else if (w.uv >= 6) uvCard.style.borderColor = 'rgba(245,158,11,0.4)';
  else uvCard.style.borderColor = '';
}

// ─────────────────────────────────────────────
//  SOIL MOISTURE ESTIMATION
// ─────────────────────────────────────────────
function estimateSoilMoisture(w, soil, plant) {
  const retention = SOIL_RETENTION[soil] ?? 1;
  const p = PLANTS[plant] ?? PLANTS.tomato;

  let moisture = w.humidity * 0.5;
  moisture += Math.min(w.rain * 8, 30);
  moisture -= (w.et ?? 0) * 4;
  moisture -= (w.wind / 20) * 5;
  if (w.temp > 30) moisture -= (w.temp - 30) * 1.5;
  else if (w.temp < 15) moisture += (15 - w.temp) * 0.5;
  moisture *= retention;

  return Math.round(Math.max(5, Math.min(99, moisture)));
}

// ─────────────────────────────────────────────
//  GAUGE ANIMATION
// ─────────────────────────────────────────────
function animateGauge(pct) {
  const arcLen = 251;
  const filled = (pct / 100) * arcLen;
  const arc    = $('gaugeArc');
  const needle = $('gaugeNeedle');

  arc.style.transition = 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)';
  arc.setAttribute('stroke-dasharray', `${filled} ${arcLen - filled}`);

  const angle = -90 + (pct / 100) * 180;
  needle.style.transition = 'transform 1.2s cubic-bezier(0.34,1.56,0.64,1)';
  needle.setAttribute('transform', `rotate(${angle}, 100, 100)`);

  let count = 0;
  const start = parseInt($('moistureValue').textContent) || 0;
  const step  = (pct - start) / 40;
  const timer = setInterval(() => {
    count++;
    $('moistureValue').textContent = Math.round(start + step * count);
    if (count >= 40) { clearInterval(timer); $('moistureValue').textContent = pct; }
  }, 25);
}

function updateMoistureCard(moisture) {
  STATE.moisture = moisture;
  animateGauge(moisture);

  const dot = $('moistureDot');
  const txt = $('moistureStatusText');
  const plant = PLANTS[STATE.plant];
  dot.className = 'status-dot';

  let statusClass, statusMsg;
  if (moisture < 25) {
    statusClass = 'dry'; statusMsg = '🔴 Critical: Soil is very dry — irrigate immediately!';
  } else if (moisture < plant.optimalMoistureMin) {
    statusClass = 'low'; statusMsg = `⚠️ Low moisture — water soon (${plant.name} optimal: ${plant.optimalMoistureMin}-${plant.optimalMoistureMax}%)`;
  } else if (moisture <= plant.optimalMoistureMax) {
    statusClass = 'optimal'; statusMsg = `✅ Optimal moisture for ${plant.name}`;
  } else {
    statusClass = 'wet'; statusMsg = '🌊 High moisture — risk of root rot. Avoid watering.';
  }

  dot.classList.add(statusClass);
  txt.textContent = statusMsg;
}

// ─────────────────────────────────────────────
//  HARVEST STATUS
// ─────────────────────────────────────────────
function computeHarvestProgress(w, plant) {
  const p = PLANTS[plant];
  if (!p) return { pct: 0, stage: 'Unknown', stageIdx: 0, days: '--', emoji: '🌱', cssClass: '' };

  const tempFactor = Math.max(0.5, Math.min(1.4, (w.temp - p.optimalTempMin) / (p.optimalTempMax - p.optimalTempMin)));
  const growthPct  = Math.min(100, Math.round(Math.random() * 15 + 45 + tempFactor * 20));

  const stageIdx = p.stagePct.findIndex(v => growthPct <= v);
  const idx      = stageIdx === -1 ? p.stages.length - 1 : stageIdx;
  const stage    = p.stages[idx] ?? p.stages[p.stages.length - 1];

  let emoji = ['🌱', '🌿', '🌸', p.emoji, p.emoji][Math.min(idx, 4)];
  const daysLeft = Math.max(0, Math.round(p.daysToHarvest * (1 - growthPct / 100)));

  let cssClass = '';
  if (growthPct >= 95) cssClass = 'stage-ready';
  else if (growthPct >= 75) cssClass = 'stage-mature';
  else if (growthPct >= 40) cssClass = 'stage-growing';
  else cssClass = 'stage-seedling';

  return { pct: growthPct, stage, stageIdx: idx, days: daysLeft, emoji, cssClass };
}

function updateHarvestSection() {
  const p = PLANTS[STATE.plant];
  const ring    = $('harvestRing');
  const icon    = $('harvestIcon');
  const stageEl = $('harvestStage');
  const fillEl  = $('harvestFill');
  const pctEl   = $('harvestPct');
  const daysEl  = $('harvestDays');
  const alertsEl = $('harvestAlertsList');

  if (!STATE.hasData) {
    stageEl.textContent = 'Enter weather data to see status';
    return;
  }

  const h = computeHarvestProgress(STATE.weather, STATE.plant);
  ring.className = `harvest-ring ${h.cssClass}`;
  icon.textContent = h.emoji;
  stageEl.textContent = `${h.stage} Stage`;

  setTimeout(() => {
    fillEl.style.width = h.pct + '%';
    pctEl.textContent  = h.pct + '% ready';
  }, 200);

  daysEl.textContent = h.days === 0 ? '🎉 Ready to harvest now!' : `~${h.days} days to harvest`;

  alertsEl.innerHTML = '';
  getHarvestAlerts(STATE.weather, STATE.plant, h).forEach(a => {
    const div = document.createElement('div');
    div.className = 'harvest-alert-item';
    div.style.cssText = `background:${a.bg}; border:1px solid ${a.border}; color:${a.color}`;
    div.innerHTML = `<span>${a.icon}</span> ${a.msg}`;
    alertsEl.appendChild(div);
  });
}

function getHarvestAlerts(w, plant, h) {
  const p = PLANTS[plant];
  const alerts = [];

  if (h.pct >= 95) alerts.push({ icon: '🎉', msg: 'Ready to harvest! Harvest within 3-5 days.', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#4ade80' });
  else if (h.pct >= 80) alerts.push({ icon: '⏰', msg: `Approaching harvest — ~${h.days} days remaining.`, bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' });

  if (w.temp < p.optimalTempMin) alerts.push({ icon: '🥶', msg: `Cold stress! Temp ${w.temp}°C is below minimum (${p.optimalTempMin}°C).`, bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.3)', color: '#38bdf8' });
  if (w.temp > p.optimalTempMax) alerts.push({ icon: '🔥', msg: `Heat stress! Temp ${w.temp}°C exceeds optimal (${p.optimalTempMax}°C).`, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#f87171' });

  if (alerts.length === 0) alerts.push({ icon: '✅', msg: 'Conditions are good. Keep up current care routine.', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' });

  return alerts;
}

// ─────────────────────────────────────────────
//  ANALYSIS ENGINE (Decision Tree + BFS)
// ─────────────────────────────────────────────
function runAnalysis() {
  const w        = STATE.weather;
  const plant    = STATE.plant;
  const soil     = STATE.soil;
  const p        = PLANTS[plant];
  const moisture = estimateSoilMoisture(w, soil, plant);

  updateMoistureCard(moisture);

  // ── Call the AI Engine ─────────────────────
  const result  = window.PlantAI.analyse(w, moisture, plant, soil, p);
  STATE.alerts  = result.alerts;

  renderAlerts();
  updateAIEnginePanel(result.metrics);
  updateAlertBadge();

  // Show Save to Diary button after analysis
  var saveDiaryWrap = $('saveDiaryWrap');
  if (saveDiaryWrap) saveDiaryWrap.style.display = 'block';
}

// ─────────────────────────────────────────────
//  RENDER ALERTS
// ─────────────────────────────────────────────
function renderAlerts() {
  const list  = DOM.alertsList;
  const empty = DOM.alertsEmpty;
  const count = $('alertCount');

  list.innerHTML = '';

  if (STATE.alerts.length === 0) {
    empty.style.display = 'block';
    count.textContent   = '0 actions';
    return;
  }

  empty.style.display = 'none';
  count.textContent   = `${STATE.alerts.length} actions`;
  STATE.alerts.forEach((a, i) => list.appendChild(buildAlertCard(a, i)));
}

function updateAllAlerts() {
  const full = DOM.fullAlertsList;
  full.innerHTML = '';
  if (STATE.alerts.length === 0) {
    full.innerHTML = `<div class="alerts-empty"><div class="empty-icon">📡</div><p>No alerts yet. Click <strong>Enter Weather</strong> to input conditions and generate recommendations.</p></div>`;
    return;
  }
  STATE.alerts.forEach((a, i) => full.appendChild(buildAlertCard(a, i)));
}

function buildAlertCard(a, i) {
  const card = document.createElement('div');
  card.className = `alert-card ${a.type}`;
  card.style.animationDelay = `${i * 0.07}s`;
  const yieldBar = (a.yieldImpact != null)
    ? `<div class="alert-yield"><span class="yield-label">Yield Impact</span><div class="yield-bar"><div class="yield-fill" style="width:${Math.round(a.yieldImpact*100)}%"></div></div><span class="yield-pct">${Math.round(a.yieldImpact*100)}%</span></div>`
    : '';
  card.innerHTML = `
    <div class="alert-top">
      <span class="alert-icon">${a.icon}</span>
      <span class="alert-title">${a.title}</span>
      <span class="alert-severity">${a.severity}</span>
    </div>
    <div class="alert-action">${a.action}</div>
    ${yieldBar}
  `;
  return card;
}

// ─────────────────────────────────────────────
//  AI ENGINE PANEL UPDATE
// ─────────────────────────────────────────────
function updateAIEnginePanel(metrics) {
  if (!metrics) return;
  const panel = $('aiEnginePanel');
  panel.style.display = 'block';

  // ── Plain-English label maps ──────────────────────────
  const irrText = {
    'Emergency': '🚨 Water NOW — urgent!',
    'High':      '💧 Water a lot today',
    'Moderate':  '💧 Water moderately',
    'Low':       '💧 Light watering needed',
    'Skip':      '✅ No watering today',
    'Reduce':    '🌊 Stop watering — too wet'
  };
  const fertText = {
    'Delay(Dry)':  '⚠️ Wait — soil too dry',
    'Optimal':     '✅ Good time to fertilize',
    'Skip(Rain)':  '🌧️ Skip — rain will wash it',
    'Delay(Wet)':  '⏸️ Wait — soil too wet',
    'Normal':      '✅ Keep normal schedule'
  };
  const featureText = {
    'moisture': 'Soil Moisture',
    'temp':     'Temperature',
    'humidity': 'Air Humidity',
    'rain':     'Rainfall',
    'uv':       'Sunlight (UV)',
    'wind':     'Wind Speed'
  };

  // ── Irrigation box ────────────────────────────────────
  const irrLabel = metrics.irrLabel;
  const irrEl    = $('aepIrrLabel');
  const irrBox   = $('aepIrrBox');
  irrEl.textContent = irrText[irrLabel] ?? irrLabel;
  irrBox.className = 'aep-decision-box';
  if (['Emergency','High'].includes(irrLabel))     irrBox.classList.add('aep-box-urgent');
  else if (['Moderate','Low'].includes(irrLabel))  irrBox.classList.add('aep-box-moderate');
  else if (irrLabel === 'Skip')                    irrBox.classList.add('aep-box-good');
  else                                             irrBox.classList.add('aep-box-info');

  // ── Fertilizer box ────────────────────────────────────
  const fertLabel = metrics.fertLabel;
  const fertEl    = $('aepFertLabel');
  const fertBox   = $('aepFertBox');
  fertEl.textContent = fertText[fertLabel] ?? fertLabel;
  fertBox.className = 'aep-decision-box';
  if (fertLabel === 'Optimal')                         fertBox.classList.add('aep-box-good');
  else if (['Delay(Dry)','Delay(Wet)'].includes(fertLabel)) fertBox.classList.add('aep-box-moderate');
  else if (fertLabel === 'Skip(Rain)')                 fertBox.classList.add('aep-box-info');
  else                                                 fertBox.classList.add('aep-box-info');

  // ── Crop Benefit ──────────────────────────────────────
  const yieldPct = Math.round(metrics.topYieldImpact * 100);
  $('aepYield').textContent =
    yieldPct >= 80 ? '🌟 Very High' :
    yieldPct >= 60 ? '✅ High'       :
    yieldPct >= 40 ? '🟡 Medium'    : '🔵 Low';

  // ── Key Factor ────────────────────────────────────────
  const rawFeature = metrics.bestSplit?.feature ?? '--';
  $('aepFeature').textContent = featureText[rawFeature] ?? rawFeature;

  // ── Confidence bar (based on best split IG, max ~1.0) ─
  const ig        = Math.min(1, metrics.bestSplit?.ig ?? 0);
  const confPct   = Math.round(ig * 100);
  const confEl    = $('aepConfPct');
  const fillEl    = $('aepConfFill');
  confEl.textContent = confPct + '%';
  setTimeout(() => { fillEl.style.width = confPct + '%'; }, 100);
  fillEl.style.background =
    confPct >= 70 ? 'linear-gradient(90deg,#22c55e,#16a34a)' :
    confPct >= 40 ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                    'linear-gradient(90deg,#ef4444,#dc2626)';

  // ── Decision Steps (readable path) ───────────────────
  const rawPath   = metrics.decisionPath || '';
  const stepNames = rawPath.split('→').map(s => {
    const feat = s.trim().split('=')[0].trim();
    return featureText[feat] ?? feat;
  }).filter(s => s && s !== '--');

  const stepsEl = $('aepPath');
  if (stepNames.length > 0) {
    stepsEl.innerHTML = stepNames.map((s, i) =>
      `<span class="aep-step">${i + 1}. ${s} checked</span>`
    ).join('');
  } else {
    stepsEl.textContent = 'Analysis complete';
  }

  // ── Training records ──────────────────────────────────
  $('aepSamples').textContent = (metrics.trainingSamples || '--').toLocaleString('en-IN');
}

function updateAlertBadge() {
  const criticalCount = STATE.alerts.filter(a => a.type === 'critical' || a.type === 'warning').length;
  const badge = DOM.alertBadge;
  if (criticalCount > 0) {
    badge.textContent = criticalCount;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ─────────────────────────────────────────────
//  SOIL SECTION
// ─────────────────────────────────────────────
function updateSoilSection() {
  const w  = STATE.weather;
  const p  = PLANTS[STATE.plant];
  const moisture = estimateSoilMoisture(w, STATE.soil, STATE.plant);

  $('soilMoistureBig').textContent = moisture + '%';
  $('soilMoistureDesc').textContent = moisture < 30 ? '⚠️ Very dry — irrigate soon' : moisture < 50 ? '🟡 Below optimal' : moisture <= 75 ? '✅ Optimal range' : '💧 Saturated';

  const soilTemp = Math.round(w.temp * 0.92);
  $('soilTempBig').textContent  = soilTemp + '°C';
  $('soilTempDesc').textContent = soilTemp < 10 ? '🥶 Too cold for root activity' : soilTemp > 35 ? '🔥 Too hot — shade recommended' : '✅ Good root growth range';

  let score = 7;
  if (moisture < 25 || moisture > 90) score -= 2; else if (moisture < 40 || moisture > 80) score -= 1;
  if (w.temp > p.optimalTempMax + 5 || w.temp < p.optimalTempMin - 5) score -= 2;
  else if (w.temp > p.optimalTempMax || w.temp < p.optimalTempMin) score -= 1;
  if (w.rain > 20) score -= 1;
  score = Math.max(1, Math.min(10, score));

  $('soilHealthBig').textContent  = score + '/10';
  $('soilHealthDesc').textContent = score >= 8 ? '🌟 Excellent condition' : score >= 6 ? '✅ Good condition' : score >= 4 ? '⚠️ Needs attention' : '🔴 Poor — take action';

  $('soilNPKBig').textContent  = `N:${p.npk.N} P:${p.npk.P} K:${p.npk.K}`;
  $('soilNPKDesc').textContent = `Recommended for ${p.name} on ${STATE.soil} soil`;
}

// ─────────────────────────────────────────────
//  7-DAY TIMELINE
// ─────────────────────────────────────────────
function buildTimeline() {
  const w    = STATE.weather;
  const grid = $('timelineGrid');
  grid.innerHTML = '';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  for (let i = 0; i < 7; i++) {
    const dayName = days[(today + i) % 7];
    const rain    = w.daily.precipitation_sum?.[i] ?? 0;
    const maxT    = w.daily.temperature_2m_max?.[i] ?? w.temp;
    const et      = w.daily.et0_fao_evapotranspiration?.[i] ?? 0;
    const moisture = Math.round(Math.max(5, Math.min(99,
      (w.humidity * 0.5) + Math.min(rain * 8, 30) - (et * 4) - (STATE.soil === 'sandy' ? 10 : 0)
    )));

    let icon = '☁️';
    if (rain > 10) icon = '🌧️';
    else if (rain > 2) icon = '🌦️';
    else if (maxT > 30) icon = '☀️';
    else if (maxT < 15) icon = '🌥️';

    const mColor = moisture < 30 ? '#f87171' : moisture < 50 ? '#fbbf24' : '#4ade80';

    const day = document.createElement('div');
    day.className = 'tl-day';
    day.innerHTML = `
      <div class="tl-day-name">${i === 0 ? 'Today' : dayName}</div>
      <div class="tl-icon">${icon}</div>
      <div class="tl-moisture" style="color:${mColor}">${moisture}%</div>
      <div class="tl-temp">${Math.round(maxT)}°C</div>
    `;
    grid.appendChild(day);
  }
}

// ─────────────────────────────────────────────
//  HARVEST DETAIL PAGE
// ─────────────────────────────────────────────
function updateHarvestDetailPage() {
  const p = PLANTS[STATE.plant];
  $('hdPlantType').textContent      = p.name + ' ' + p.emoji;
  $('harvestTipsPlant').textContent = p.name;

  if (STATE.hasData) {
    const h = computeHarvestProgress(STATE.weather, STATE.plant);
    $('hdStage').textContent     = h.stage;
    $('hdReadiness').textContent = h.pct + '%';
    $('hdDays').textContent      = h.days === 0 ? 'Ready Now!' : `~${h.days} days`;
  } else {
    $('hdStage').textContent     = '--';
    $('hdReadiness').textContent = '--';
    $('hdDays').textContent      = '--';
  }

  const tipsList = $('tipsList');
  tipsList.innerHTML = '';
  p.tips.forEach(tip => {
    const div = document.createElement('div');
    div.className = 'tip-item';
    div.innerHTML = `<span class="tip-icon">${tip.icon}</span> <span>${tip.text}</span>`;
    tipsList.appendChild(div);
  });
}

// ─────────────────────────────────────────────
//  UI HELPERS
// ─────────────────────────────────────────────
function showLocationBanner(name) {
  DOM.locationBanner.style.display = 'flex';
  DOM.locationText.textContent = `📍 ${name}`;
  DOM.locationCoords.textContent = `Manually entered • ${new Date().toLocaleDateString()}`;
}

function hideNoDataHint() {
  DOM.noDataHint.style.display = 'none';
  DOM.dashGrid.style.display   = 'grid';
}

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  t.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  DOM.toastContainer.appendChild(t);
  setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 500);
  }, 4000);
}

// ─────────────────────────────────────────────
//  AUTH + USER BADGE
// ─────────────────────────────────────────────
function initAuth() {
  // Set username display
  const username = window.Auth ? Auth.currentUser() : null;
  const display  = $('userNameDisplay');
  if (display && username) display.textContent = username;

  // Logout button (also has inline onclick as fallback)
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (window.Auth) Auth.logout();
    });
  }
}

// ─────────────────────────────────────────────
//  DIARY INTEGRATION
// ─────────────────────────────────────────────
function initDiary() {
  if (!window.Diary) return;

  // Update diary badge on load
  Diary._updateBadge();

  // Save to Diary button → open modal
  const saveBtn = $('saveDiaryBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', openDiaryModal);
  }

  // Modal close
  const closeBtn = $('diaryModalClose');
  const backdrop  = $('diaryModalBackdrop');
  if (closeBtn)  closeBtn.addEventListener('click', closeDiaryModal);
  if (backdrop)  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeDiaryModal(); });

  // Character counter
  const textarea = $('diaryNotesInput');
  if (textarea) {
    textarea.addEventListener('input', () => {
      var el = $('diaryCharCount');
      if (el) el.textContent = textarea.value.length;
    });
  }

  // Save button inside modal
  const modalSave = $('diaryModalSave');
  if (modalSave) {
    modalSave.addEventListener('click', saveDiaryEntry);
  }

  // Clear all
  const clearBtn = $('diaryClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (Diary.count() === 0) return;
      if (confirm('Delete ALL diary entries? This cannot be undone.')) {
        localStorage.removeItem('plantiq_diary_' + (Auth.currentUser() || 'guest').toLowerCase());
        Diary.renderAll($('diaryEntries'));
        Diary._updateBadge();
        $('diaryEntryCount').textContent = '0 entries';
        showToast('🗑️ All entries cleared', 'info');
      }
    });
  }
}

function openDiaryModal() {
  if (!STATE.hasData) { showToast('⚠️ Run an analysis first before saving', 'error'); return; }

  const backdrop = $('diaryModalBackdrop');
  if (!backdrop) return;

  // Build snapshot
  const p        = PLANTS[STATE.plant];
  const moisture = estimateSoilMoisture(STATE.weather, STATE.soil, STATE.plant);
  const w        = STATE.weather;
  const snap     = $('diaryModalSnapshot');

  snap.innerHTML =
    '<strong>' + p.emoji + ' ' + p.name + ' on ' + STATE.soil.charAt(0).toUpperCase() + STATE.soil.slice(1) + ' Soil</strong>' +
    '<span class="diary-snap-item">🌡️ ' + w.temp + '°C</span>' +
    '<span class="diary-snap-item">💧 ' + w.humidity + '%</span>' +
    '<span class="diary-snap-item">🌧️ ' + w.rain + 'mm</span>' +
    '<span class="diary-snap-item">☀️ UV ' + (w.uv || 0) + '</span>' +
    '<span class="diary-snap-item">💨 ' + (w.wind || 0) + 'km/h</span>' +
    '<span class="diary-snap-item">💦 Moisture ' + moisture + '%</span>';

  // Reset textarea
  const textarea = $('diaryNotesInput');
  if (textarea) textarea.value = '';
  const counter  = $('diaryCharCount');
  if (counter)   counter.textContent = '0';

  backdrop.style.display = 'flex';
  if (textarea) setTimeout(() => textarea.focus(), 100);
}

function closeDiaryModal() {
  var backdrop = $('diaryModalBackdrop');
  if (backdrop) backdrop.style.display = 'none';
}

function saveDiaryEntry() {
  if (!STATE.hasData) return;

  const p        = PLANTS[STATE.plant];
  const moisture = estimateSoilMoisture(STATE.weather, STATE.soil, STATE.plant);
  const notes    = ($('diaryNotesInput') || {}).value || '';

  const entry = {
    cropName:  p.name,
    cropEmoji: p.emoji,
    plant:     STATE.plant,
    soil:      STATE.soil.charAt(0).toUpperCase() + STATE.soil.slice(1),
    moisture:  moisture,
    weather:   Object.assign({}, STATE.weather),
    alerts:    STATE.alerts.slice(0, 5).map(a => ({ icon: a.icon, title: a.title, type: a.type })),
    notes:     notes.trim()
  };

  Diary.save(entry);
  Diary._updateBadge();
  closeDiaryModal();

  showToast('📔 Saved to diary!', 'success');

  // Refresh diary view if open
  if (STATE.activeSection === 'diary') {
    Diary.renderAll($('diaryEntries'));
    var n = Diary.count();
    $('diaryEntryCount').textContent = n + (n === 1 ? ' entry' : ' entries');
  }
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
function init() {
  initParticles();
  initDropdowns();
  initNav();
  initPresets();
  initAuth();
  initDiary();

  // Open modal triggers
  DOM.geoBtn.addEventListener('click', openWeatherModal);
  $('hintGeoBtn').addEventListener('click', openWeatherModal);
  DOM.locEditBtn.addEventListener('click', openWeatherModal);

  // Close modal triggers
  DOM.modalClose.addEventListener('click', closeWeatherModal);
  DOM.btnCancel.addEventListener('click', closeWeatherModal);
  DOM.weatherModal.addEventListener('click', e => {
    if (e.target === DOM.weatherModal) closeWeatherModal();
  });

  // Apply
  DOM.btnApply.addEventListener('click', applyWeatherData);

  // Enter key in modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && DOM.weatherModal.style.display !== 'none') closeWeatherModal();
    if (e.key === 'Enter'  && DOM.weatherModal.style.display !== 'none') applyWeatherData();
  });

  // Init display
  DOM.dashGrid.style.display   = 'none';
  DOM.noDataHint.style.display = 'flex';
  updateHarvestDetailPage();
}

document.addEventListener('DOMContentLoaded', init);
