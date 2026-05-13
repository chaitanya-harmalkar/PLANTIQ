/* =====================================================
   PLANTIQ — AI ENGINE
   Decision Tree (Entropy + Information Gain)
   Best First Search (Yield-Impact Heuristic)
   ===================================================== */

'use strict';

// ─────────────────────────────────────────────
//  FEATURE DISCRETIZATION
//  Converts continuous values → categorical bins
// ─────────────────────────────────────────────
const BINS = {
  temp:     [12, 18, 30, 36],          // cold|cool|optimal|hot|extreme
  humidity: [25, 45, 65, 80],          // very_low|low|moderate|high|very_high
  moisture: [20, 35, 50, 75, 90],      // critical|dry|low|optimal|wet|saturated
  uv:       [3, 6, 9],                 // low|moderate|high|extreme
  rain:     [0.1, 5, 15],             // none|light|moderate|heavy
  wind:     [10, 25, 40],              // calm|light|strong|gale
};

const FEATURE_NAMES = ['temp', 'humidity', 'moisture', 'uv', 'rain', 'wind'];

function discretize(val, breakpoints) {
  for (let i = 0; i < breakpoints.length; i++) {
    if (val <= breakpoints[i]) return i;
  }
  return breakpoints.length;
}

function featurize(weather, soilMoisture) {
  return {
    temp:     discretize(weather.temp,     BINS.temp),
    humidity: discretize(weather.humidity, BINS.humidity),
    moisture: discretize(soilMoisture,     BINS.moisture),
    uv:       discretize(weather.uv,       BINS.uv),
    rain:     discretize(weather.rain,     BINS.rain),
    wind:     discretize(weather.wind,     BINS.wind),
  };
}

// ─────────────────────────────────────────────
//  NOTE: Training data is loaded from crop_dataset.js
//  (2200 samples — Kaggle Crop Recommendation Dataset)
//  window.CROP_DATASET is set by that script.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  DECISION TREE
// ─────────────────────────────────────────────
class DecisionTree {
  constructor({ maxDepth = 6, minLeafSize = 3 } = {}) {
    this.maxDepth    = maxDepth;
    this.minLeafSize = minLeafSize;
    this.root        = null;
    this.lastPredictLog = [];  // stores decision path for UI
  }

  // H(S) = -Σ pi * log2(pi)
  entropy(labels) {
    if (labels.length === 0) return 0;
    const counts = {};
    labels.forEach(l => counts[l] = (counts[l] || 0) + 1);
    const n = labels.length;
    return Object.values(counts).reduce((H, count) => {
      const p = count / n;
      return H - (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
  }

  // IG(S, A) = H(S) - Σ (|Sv|/|S|) * H(Sv)
  informationGain(parentLabels, groups) {
    const parentH = this.entropy(parentLabels);
    const n       = parentLabels.length;
    const weightedH = groups.reduce((sum, g) => {
      return sum + (g.length / n) * this.entropy(g);
    }, 0);
    return +(parentH - weightedH).toFixed(6);
  }

  // Split dataset on a feature value
  splitOn(samples, feature, value) {
    return {
      left:  samples.filter(s => s.features[feature] === value),
      right: samples.filter(s => s.features[feature] !== value)
    };
  }

  // Find best (feature, value) split by maximum IG
  bestSplit(samples, target) {
    const parentLabels = samples.map(s => s.labels[target]);
    const parentH      = this.entropy(parentLabels);

    let bestIG       = -Infinity;
    let bestFeature  = null;
    let bestValue    = null;
    const gainLog    = [];

    for (const feature of FEATURE_NAMES) {
      const values = [...new Set(samples.map(s => s.features[feature]))];
      for (const val of values) {
        const { left, right } = this.splitOn(samples, feature, val);
        if (left.length === 0 || right.length === 0) continue;

        const ig = this.informationGain(
          parentLabels,
          [left.map(s => s.labels[target]), right.map(s => s.labels[target])]
        );

        gainLog.push({ feature, value: val, ig: +ig.toFixed(4) });

        if (ig > bestIG) {
          bestIG      = ig;
          bestFeature = feature;
          bestValue   = val;
        }
      }
    }

    return { feature: bestFeature, value: bestValue, ig: bestIG, parentH: +parentH.toFixed(4), gainLog };
  }

  // Majority vote label
  majorityLabel(samples, target) {
    const counts = {};
    samples.forEach(s => {
      const l = s.labels[target];
      counts[l] = (counts[l] || 0) + 1;
    });
    return +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Recursive tree builder
  buildNode(samples, target, depth, usedFeatures) {
    const labels  = samples.map(s => s.labels[target]);
    const labelH  = this.entropy(labels);
    const unique  = [...new Set(labels)];

    // Leaf conditions
    if (unique.length === 1 || depth >= this.maxDepth || samples.length <= this.minLeafSize) {
      return {
        type:     'leaf',
        label:    this.majorityLabel(samples, target),
        entropy:  +labelH.toFixed(4),
        count:    samples.length
      };
    }

    const { feature, value, ig, parentH } = this.bestSplit(samples, target);
    if (!feature || ig <= 0) {
      return { type: 'leaf', label: this.majorityLabel(samples, target), entropy: +labelH.toFixed(4), count: samples.length };
    }

    const { left, right } = this.splitOn(samples, feature, value);

    return {
      type:    'node',
      feature,
      value,
      ig:      +ig.toFixed(4),
      entropy: +parentH.toFixed(4),
      count:   samples.length,
      depth,
      left:    this.buildNode(left,  target, depth + 1, [...usedFeatures, feature]),
      right:   this.buildNode(right, target, depth + 1, [...usedFeatures, feature]),
    };
  }

  train(samples) {
    this.rootIrr  = this.buildNode(samples, 'irrigation',  0, []);
    this.rootFert = this.buildNode(samples, 'fertilizer',  0, []);
    this.trained  = true;
    this.rootEntropy = this.entropy(samples.map(s => s.labels.irrigation));
  }

  // Walk tree, collecting path
  _predict(node, features, path) {
    if (node.type === 'leaf') {
      path.push({ type: 'leaf', label: node.label, entropy: node.entropy, count: node.count });
      return node.label;
    }

    const goLeft = features[node.feature] === node.value;
    path.push({
      type: 'split',
      feature:  node.feature,
      value:    node.value,
      ig:       node.ig,
      entropy:  node.entropy,
      branch:   goLeft ? 'match' : 'other'
    });

    return this._predict(goLeft ? node.left : node.right, features, path);
  }

  predict(features) {
    if (!this.trained) return null;
    const irrPath  = [];
    const fertPath = [];
    const irrigation  = this._predict(this.rootIrr,  features, irrPath);
    const fertilizer  = this._predict(this.rootFert, features, fertPath);

    // Capture key metrics for UI
    this.lastPredictLog = {
      irrPath,
      fertPath,
      irrLabel:  irrigation,
      fertLabel: fertilizer,
      rootH:     +this.rootEntropy.toFixed(4)
    };

    return { irrigation, fertilizer };
  }

  // Tree depth helper
  treeDepth(node) {
    if (!node || node.type === 'leaf') return 0;
    return 1 + Math.max(this.treeDepth(node.left), this.treeDepth(node.right));
  }
}

// ─────────────────────────────────────────────
//  BEST FIRST SEARCH
//  Priority queue ordered by yieldImpact score
// ─────────────────────────────────────────────

// Actions catalogue: { id, icon, title, severity, basePriority, description }
const ACTION_CATALOGUE = {
  // Irrigation
  irrigate_emergency: { id: 'irrigate_emergency', icon: '🚨', title: 'Emergency Irrigation',     severity: 'critical', basePriority: 1.00, type: 'irrigation' },
  irrigate_high:      { id: 'irrigate_high',      icon: '💧', title: 'High-Volume Irrigation',   severity: 'warning',  basePriority: 0.85, type: 'irrigation' },
  irrigate_moderate:  { id: 'irrigate_moderate',  icon: '💧', title: 'Moderate Irrigation',      severity: 'warning',  basePriority: 0.70, type: 'irrigation' },
  irrigate_low:       { id: 'irrigate_low',       icon: '💧', title: 'Light Irrigation',         severity: 'info',     basePriority: 0.50, type: 'irrigation' },
  skip_irrigation:    { id: 'skip_irrigation',    icon: '✅', title: 'Skip Irrigation',          severity: 'success',  basePriority: 0.40, type: 'irrigation' },
  reduce_irrigation:  { id: 'reduce_irrigation',  icon: '🌊', title: 'Reduce Watering',          severity: 'info',     basePriority: 0.55, type: 'irrigation' },
  // Fertilizer
  apply_fert:         { id: 'apply_fert',         icon: '🧪', title: 'Apply Fertilizer Now',     severity: 'info',     basePriority: 0.65, type: 'fertilizer' },
  delay_fert_dry:     { id: 'delay_fert_dry',     icon: '⚠️', title: 'Delay Fertilizer (Dry Soil)', severity: 'warning', basePriority: 0.72, type: 'fertilizer' },
  delay_fert_wet:     { id: 'delay_fert_wet',     icon: '⏸️', title: 'Delay Fertilizer (Wet Soil)', severity: 'info',   basePriority: 0.55, type: 'fertilizer' },
  skip_fert_rain:     { id: 'skip_fert_rain',     icon: '🌧️', title: 'Skip Fertilizer (Rain)',   severity: 'info',     basePriority: 0.48, type: 'fertilizer' },
  normal_fert:        { id: 'normal_fert',        icon: '✅', title: 'Fertilizer Schedule OK',   severity: 'success',  basePriority: 0.30, type: 'fertilizer' },
  // Environmental
  add_shade:          { id: 'add_shade',          icon: '🌂', title: 'Install Shade Cloth',      severity: 'warning',  basePriority: 0.68, type: 'environmental' },
  add_mulch:          { id: 'add_mulch',          icon: '🌿', title: 'Apply Organic Mulch',      severity: 'info',     basePriority: 0.55, type: 'environmental' },
  stake_plants:       { id: 'stake_plants',       icon: '🪵', title: 'Stake & Secure Plants',    severity: 'warning',  basePriority: 0.62, type: 'environmental' },
  spray_fungicide:    { id: 'spray_fungicide',    icon: '🍄', title: 'Apply Preventive Fungicide', severity: 'warning', basePriority: 0.70, type: 'environmental' },
  drain_field:        { id: 'drain_field',        icon: '🚰', title: 'Improve Field Drainage',   severity: 'warning',  basePriority: 0.65, type: 'environmental' },
  frost_protection:   { id: 'frost_protection',   icon: '🥶', title: 'Apply Frost Protection',   severity: 'critical', basePriority: 0.90, type: 'environmental' },
};

class BestFirstSearch {
  constructor() {
    this.candidates = [];
    this.explored   = [];
    this.log        = [];
  }

  // Compute yield-impact heuristic for a given action + conditions
  yieldImpact(actionId, features, plantData, moisture) {
    const action = ACTION_CATALOGUE[actionId];
    if (!action) return 0;

    let score = action.basePriority;

    // Stress multiplier: how extreme are conditions?
    const tempStress  = features.temp  >= 3 ? 1.3 : features.temp  <= 0 ? 1.2 : 1.0;
    const moistStress = features.moisture === 0 ? 1.5 : features.moisture === 5 ? 1.3 : 1.0;
    const uvStress    = features.uv    >= 3 ? 1.2 : 1.0;
    const windStress  = features.wind  >= 3 ? 1.15 : 1.0;
    const rainBoost   = features.rain  >= 2 && actionId.includes('irrigat') ? 0.5 : 1.0;

    // Plant sensitivity factor (some plants are more drought/heat/waterlog sensitive)
    const sensitivity = plantData?.sensitivity ?? 1.0;

    score = score * tempStress * moistStress * uvStress * windStress * rainBoost * sensitivity;
    return Math.min(1.0, +score.toFixed(4));
  }

  // Push action into priority queue (max-heap by yieldImpact)
  push(actionId, score, description) {
    this.candidates.push({ actionId, score, description });
    this.candidates.sort((a, b) => b.score - a.score);
  }

  pop() {
    return this.candidates.shift();
  }

  // Seed all possible actions, score them, return top-maxResults
  search(irrLabel, fertLabel, features, plantData, moisture, maxResults = 8) {
    this.candidates = [];
    this.explored   = [];
    this.log        = [];

    const irr  = IRRIGATION_LABEL_MAP[irrLabel]  ?? [];
    const fert = FERTILIZER_LABEL_MAP[fertLabel] ?? [];

    // Build action candidates from DT predictions
    const allActions = [...irr, ...fert];

    // Add conditional environmental actions
    if (features.temp >= 3)    allActions.push('add_shade');
    if (features.temp <= 0)    allActions.push('frost_protection');
    if (features.wind >= 3)    allActions.push('stake_plants');
    if (features.moisture > 4) allActions.push('drain_field');
    if (features.humidity >= 4 && features.moisture >= 3) allActions.push('spray_fungicide');
    if (features.moisture <= 2 && features.uv >= 2) allActions.push('add_mulch');

    // Score + enqueue
    allActions.forEach(actionId => {
      if (ACTION_CATALOGUE[actionId]) {
        const score = this.yieldImpact(actionId, features, plantData, moisture);
        this.push(actionId, score, '');
        this.log.push({ actionId, score });
      }
    });

    // Best-first extraction
    const selected = [];
    while (this.candidates.length > 0 && selected.length < maxResults) {
      const best = this.pop();
      this.explored.push(best);
      selected.push(best);
    }

    return selected;
  }
}

// DT label → action IDs mapping
const IRRIGATION_LABEL_MAP = {
  0: ['irrigate_emergency'],                 // emergency
  1: ['irrigate_high', 'add_mulch'],         // high
  2: ['irrigate_moderate', 'add_mulch'],     // moderate
  3: ['irrigate_low'],                       // low
  4: ['skip_irrigation'],                    // skip
  5: ['reduce_irrigation', 'drain_field'],   // reduce
};

const FERTILIZER_LABEL_MAP = {
  0: ['delay_fert_dry'],    // delay (dry)
  1: ['apply_fert'],        // optimal window
  2: ['skip_fert_rain'],    // skip (rain)
  3: ['delay_fert_wet'],    // delay (wet)
  4: ['normal_fert'],       // normal schedule
};

// ─────────────────────────────────────────────
//  ACTION → ALERT CARD BUILDER
// ─────────────────────────────────────────────
function buildActionDescription(actionId, weather, soilMoisture, plant) {
  const p    = plant || {};
  const name = p.name || 'your plant';
  const T    = weather.temp;
  const M    = Math.round(soilMoisture);
  const R    = weather.rain;
  const UV   = weather.uv;
  const W    = weather.wind;
  const H    = weather.humidity;

  const descriptions = {
    irrigate_emergency: `Soil moisture critically low (${M}%). Apply 25-35mm of water immediately using drip or soaker irrigation. Avoid wetting foliage. Recheck moisture in 4 hours.`,
    irrigate_high:      `Moisture at ${M}% — well below optimal for ${name}. Apply 18-25mm in the early morning. Add 5cm mulch to reduce evaporation rate.`,
    irrigate_moderate:  `Moisture at ${M}% — below target range. Apply 12-15mm water in morning hours. Increase frequency in hot/windy conditions (current: ${T}°C, ${W}km/h).`,
    irrigate_low:       `Moisture at ${M}% — slightly low. Apply 6-8mm water. Monitor daily; today's conditions (UV ${UV}, ${T}°C) will increase evapotranspiration.`,
    skip_irrigation:    `Moisture at ${M}% is within optimal range for ${name}. Skip irrigation today. Re-assess tomorrow based on forecast conditions.`,
    reduce_irrigation:  `Soil is oversaturated (${M}%). Suspend irrigation for 2-4 days. Check drainage; prolonged saturation causes root hypoxia and fungal risk.`,
    apply_fert:         `Soil moisture (${M}%) is in the ideal window for fertilizer uptake. Apply NPK blend recommended for ${name}. Water lightly (3-5mm) after application.`,
    delay_fert_dry:     `Do NOT fertilize at ${M}% moisture — concentrated fertilizer salts will cause root burn. Irrigate to ≥${(p.optimalMoistureMin)||45}% first, then apply.`,
    delay_fert_wet:     `Soil is too wet (${M}%) for fertilizer application — nutrients will leach. Wait until moisture drops below 80%, then apply in dry weather.`,
    skip_fert_rain:     `${R}mm of rain detected. Skip fertilizer today to prevent nutrient washoff. Apply fertilizer 24-48h after rain stops when soil is moist but not wet.`,
    normal_fert:        `Conditions nominal for ${name} (Temp: ${T}°C, Moisture: ${M}%). Maintain regular fertilizer schedule every 2-3 weeks per plant requirements.`,
    add_shade:          `Temperature ${T}°C (UV: ${UV}) exceeds thresholds for ${name}. Install 30-40% shade cloth between 10am-4pm. Shading reduces crop stress by up to 35%.`,
    add_mulch:          `Current evapotranspiration conditions are high (Temp: ${T}°C, UV: ${UV}, Wind: ${W}km/h). Apply 5-8cm organic mulch around base to retain soil moisture and regulate temperature.`,
    stake_plants:       `Wind speed at ${W}km/h poses physical damage risk. Stake all tall plants and secure with soft ties. Avoid pesticide/foliar sprays in these wind conditions.`,
    spray_fungicide:    `High humidity (${H}%) combined with moisture (${M}%) creates favorable conditions for fungal diseases. Apply preventive copper-based fungicide. Do not apply in rain or strong wind.`,
    drain_field:        `Soil saturation at ${M}% indicates drainage issues. Check and clear drainage channels. Consider raised beds or French drains if waterlogging recurs.`,
    frost_protection:   `Temperature at ${T}°C — frost risk for ${name}. Cover plants immediately with frost cloth or cloches. Avoid irrigation before frost — wet soil freezes faster.`,
  };

  return descriptions[actionId] || 'No description available.';
}

// ─────────────────────────────────────────────
//  PLANT SENSITIVITY TABLE
// ─────────────────────────────────────────────
const PLANT_SENSITIVITY = {
  tomato: 1.1, pepper: 1.0, lettuce: 1.3, wheat: 0.9, corn: 1.0, rice: 1.2, herbs: 0.8
};

// ─────────────────────────────────────────────
//  PUBLIC API — PlantAI
// ─────────────────────────────────────────────
const PlantAI = (() => {
  const dt  = new DecisionTree({ maxDepth: 6, minLeafSize: 3 });
  const bfs = new BestFirstSearch();
  let trainingData = [];
  let initialized  = false;

  function init() {
    if (initialized) return;
    // Use real Kaggle dataset if available, otherwise warn
    if (window.CROP_DATASET && window.CROP_DATASET.length > 0) {
      trainingData = window.CROP_DATASET;
      const meta   = window.CROP_DATASET_META;
      console.log('[PlantAI] Using Kaggle Crop Recommendation Dataset: ' + trainingData.length + ' samples (' + (meta ? meta.crops.length : '?') + ' crops)');
    } else {
      console.warn('[PlantAI] CROP_DATASET not found — falling back to built-in samples');
      trainingData = _fallbackData();
    }
    dt.train(trainingData);
    initialized = true;
    console.log('[PlantAI] Decision Tree trained. Root entropy: ' + dt.rootEntropy.toFixed(4) + ' bits');
    console.log('[PlantAI] Tree depth — Irr: ' + dt.treeDepth(dt.rootIrr) + ', Fert: ' + dt.treeDepth(dt.rootFert));
  }

  function analyse(weather, soilMoisture, plantKey, soilKey, plantData) {
    init();

    const features = featurize(weather, soilMoisture);
    const pred     = dt.predict(features);
    const log      = dt.lastPredictLog;
    const sensitivity = PLANT_SENSITIVITY[plantKey] ?? 1.0;

    // Best First Search for action selection
    const selected = bfs.search(
      pred.irrigation,
      pred.fertilizer,
      features,
      { ...plantData, sensitivity },
      soilMoisture
    );

    // Build alert cards from selected actions
    const alerts = selected.map(item => {
      const ac  = ACTION_CATALOGUE[item.actionId];
      return {
        type:    ac.severity,
        icon:    ac.icon,
        title:   ac.title,
        action:  buildActionDescription(item.actionId, weather, soilMoisture, plantData),
        severity: ac.severity.charAt(0).toUpperCase() + ac.severity.slice(1),
        yieldImpact: item.score,
        actionId: item.actionId,
      };
    });

    // Engine metrics for UI
    // Best split info from irrigation tree root
    const rootNode  = dt.rootIrr;
    const bestSplit = rootNode?.type === 'node' ? {
      feature: rootNode.feature,
      ig:      rootNode.ig,
      entropy: rootNode.entropy
    } : { feature: '—', ig: 0, entropy: 0 };

    // Decision path summary
    const decisionPath = log.irrPath
      .filter(s => s.type === 'split')
      .map(s => `${s.feature}=${s.value} (IG=${s.ig})`)
      .join(' → ');

    return {
      alerts,
      metrics: {
        trainingSamples: trainingData.length,
        treeDepthIrr:    dt.treeDepth(dt.rootIrr),
        treeDepthFert:   dt.treeDepth(dt.rootFert),
        rootEntropy:     +dt.rootEntropy.toFixed(4),
        bestSplit,
        decisionPath:    decisionPath || `${log.irrPath.slice(-1)[0]?.feature ?? '—'} → leaf`,
        irrLabel:        ['Emergency','High','Moderate','Low','Skip','Reduce'][pred.irrigation] ?? pred.irrigation,
        fertLabel:       ['Delay(Dry)','Optimal','Skip(Rain)','Delay(Wet)','Normal'][pred.fertilizer] ?? pred.fertilizer,
        bfsCandidates:   bfs.log.length,
        bfsSelected:     selected.length,
        topYieldImpact:  selected[0]?.score ?? 0,
      }
    };
  }

  return { analyse, init };
})();

// Auto-initialize on load
window.PlantAI = PlantAI;
