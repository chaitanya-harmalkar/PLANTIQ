/**
 * tools/build_dataset.js  (ES5 — reads local cached CSV)
 * Converts the Kaggle Crop Recommendation Dataset into crop_dataset.js
 *
 * Run:  node tools/build_dataset.js
 */

var fs   = require('fs');
var path = require('path');

// Path to the cached raw file
var CACHE = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\35336a31-d9cc-4786-a84d-9ea1c3e0b5f6\\.system_generated\\steps\\121\\content.md';
var OUT   = path.join(__dirname, '..', 'crop_dataset.js');

// Per-crop seasonal water need (mm)
var CROP_WATER = {
  rice: 1200, wheat: 450, maize: 500, chickpea: 350, kidneybeans: 300,
  pigeonpeas: 400, mothbeans: 250, mungbean: 300, blackgram: 300,
  lentil: 250, pomegranate: 800, banana: 1200, mango: 800, grapes: 600,
  watermelon: 500, muskmelon: 400, apple: 800, orange: 900, papaya: 1200,
  coconut: 1500, cotton: 700, jute: 500
};

// Per-crop reference NPK values
var CROP_NPK = {
  rice:        { N: 80,  P: 45,  K: 40  }, wheat:       { N: 70,  P: 50,  K: 50  },
  maize:       { N: 80,  P: 50,  K: 20  }, chickpea:    { N: 40,  P: 68,  K: 80  },
  kidneybeans: { N: 20,  P: 68,  K: 20  }, pigeonpeas:  { N: 20,  P: 68,  K: 20  },
  mothbeans:   { N: 21,  P: 48,  K: 20  }, mungbean:    { N: 21,  P: 48,  K: 20  },
  blackgram:   { N: 40,  P: 67,  K: 19  }, lentil:      { N: 19,  P: 68,  K: 19  },
  pomegranate: { N: 18,  P: 18,  K: 40  }, banana:      { N: 100, P: 82,  K: 50  },
  mango:       { N: 20,  P: 27,  K: 30  }, grapes:      { N: 23,  P: 132, K: 200 },
  watermelon:  { N: 99,  P: 17,  K: 50  }, muskmelon:   { N: 100, P: 17,  K: 50  },
  apple:       { N: 21,  P: 134, K: 200 }, orange:      { N: 20,  P: 16,  K: 10  },
  papaya:      { N: 50,  P: 59,  K: 50  }, coconut:     { N: 22,  P: 16,  K: 30  },
  cotton:      { N: 118, P: 46,  K: 20  }, jute:        { N: 78,  P: 46,  K: 40  }
};

function bin(val, edges) {
  for (var i = 0; i < edges.length; i++) {
    if (val <= edges[i]) return i;
  }
  return edges.length;
}

function featurize(N, P, K, temp, humidity, ph, rainfall) {
  var moistureProxy = Math.min(99, (humidity * 0.45) + Math.min(rainfall * 0.15, 30));
  return {
    temp:     bin(temp,          [12, 18, 30, 36]),
    humidity: bin(humidity,      [25, 45, 65, 80]),
    moisture: bin(moistureProxy, [20, 35, 50, 75, 90]),
    uv:       bin(ph,            [5, 6, 7]),
    rain:     bin(rainfall,      [50, 200, 500]),
    wind:     bin(N,             [30, 60, 90])
  };
}

function computeLabels(N, P, K, temp, humidity, ph, rainfall, crop) {
  var waterNeed = CROP_WATER[crop] || 500;
  var npkRef    = CROP_NPK[crop]   || { N: 50, P: 50, K: 50 };
  var moistureProxy = Math.min(99, (humidity * 0.45) + Math.min(rainfall * 0.15, 30));

  var irr;
  if      (moistureProxy < 20)                      irr = 0;
  else if (moistureProxy < 35 && waterNeed > 600)   irr = 1;
  else if (moistureProxy < 35)                      irr = 1;
  else if (moistureProxy < 50 && waterNeed > 800)   irr = 2;
  else if (moistureProxy < 50)                      irr = 2;
  else if (moistureProxy < 75)                      irr = 3;
  else if (moistureProxy < 88)                      irr = 4;
  else                                              irr = 5;

  if (temp > 38 && irr > 0)  irr = irr - 1;
  if (temp < 10 && irr < 5)  irr = irr + 1;
  if (rainfall > 50)          irr = Math.min(irr + 2, 5);

  var nOk   = (N - npkRef.N) >= -15;
  var pOk   = (P - npkRef.P) >= -15;
  var kOk   = (K - npkRef.K) >= -15;
  var allOk = nOk && pOk && kOk;

  var fert;
  if      (moistureProxy < 30)                                   fert = 0;
  else if (rainfall > 30)                                        fert = 2;
  else if (moistureProxy > 85)                                   fert = 3;
  else if (allOk && moistureProxy >= 40 && moistureProxy <= 80)  fert = 1;
  else                                                           fert = 4;

  return { irr: irr, fert: fert };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(CACHE)) {
  console.error('Cache file not found: ' + CACHE);
  process.exit(1);
}

var raw = fs.readFileSync(CACHE, 'utf8');

// Extract CSV block (after the '---' separator in the markdown)
var csvStart = raw.indexOf('N,P,K,temperature');
if (csvStart === -1) {
  console.error('Could not find CSV header in cache file');
  process.exit(1);
}

var csv   = raw.slice(csvStart);
var lines = csv.trim().split('\n').slice(1); // skip header

var samples = [];
var skipped = 0;

lines.forEach(function(rawLine) {
  var line  = rawLine.trim();
  // The content.md prepends line numbers: "6: 90,42,43,..."
  // Strip the leading "NNN: " prefix if present
  var m = line.match(/^\d+:\s+(.+)/);
  if (m) line = m[1].trim();

  if (!line || line.indexOf(',') === -1) { skipped++; return; }

  var parts = line.split(',');
  if (parts.length < 8) { skipped++; return; }

  var N        = parseFloat(parts[0]);
  var P        = parseFloat(parts[1]);
  var K        = parseFloat(parts[2]);
  var temp     = parseFloat(parts[3]);
  var humidity = parseFloat(parts[4]);
  var ph       = parseFloat(parts[5]);
  var rainfall = parseFloat(parts[6]);
  var crop     = parts[7].trim();

  if (isNaN(N) || isNaN(temp) || !crop) { skipped++; return; }

  var features = featurize(N, P, K, temp, humidity, ph, rainfall);
  var labels   = computeLabels(N, P, K, temp, humidity, ph, rainfall, crop);

  samples.push({
    features: features,
    labels:   { irrigation: labels.irr, fertilizer: labels.fert },
    meta:     {
      crop: crop,
      N:    Math.round(N),
      P:    Math.round(P),
      K:    Math.round(K),
      temp: parseFloat(temp.toFixed(1))
    }
  });
});

// Stats
var cropCounts = {};
var irrDist    = {};
var fertDist   = {};
samples.forEach(function(s) {
  cropCounts[s.meta.crop]       = (cropCounts[s.meta.crop]       || 0) + 1;
  irrDist[s.labels.irrigation]  = (irrDist[s.labels.irrigation]  || 0) + 1;
  fertDist[s.labels.fertilizer] = (fertDist[s.labels.fertilizer] || 0) + 1;
});

console.log('Parsed ' + samples.length + ' samples (' + skipped + ' skipped)');
console.log('Crop distribution:', JSON.stringify(cropCounts));
console.log('Irrigation labels:', JSON.stringify(irrDist));
console.log('Fertilizer labels:', JSON.stringify(fertDist));

var cropList  = Object.keys(cropCounts).sort();
var generated = new Date().toISOString();

var js = '/* ================================================================\n'
  + '   crop_dataset.js — AUTO-GENERATED from Kaggle Crop Recommendation Dataset\n'
  + '   Source: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset\n'
  + '   Rows: ' + samples.length + '  |  Features: N, P, K, temperature, humidity, ph, rainfall\n'
  + '   Generated: ' + generated + '\n'
  + '   Regenerate: node tools/build_dataset.js\n'
  + '   ================================================================ */\n\n'
  + '/* global window */\n'
  + 'window.CROP_DATASET = ' + JSON.stringify(samples) + ';\n\n'
  + 'window.CROP_DATASET_META = {\n'
  + '  source:     "Kaggle Crop Recommendation Dataset",\n'
  + '  rows:       ' + samples.length + ',\n'
  + '  features:   ["N","P","K","temperature","humidity","ph","rainfall"],\n'
  + '  crops:      ' + JSON.stringify(cropList) + ',\n'
  + '  irrLabels:  ["emergency","high","moderate","low","skip","reduce"],\n'
  + '  fertLabels: ["delay_dry","optimal","skip_rain","delay_wet","normal"],\n'
  + '  generated:  "' + generated + '"\n'
  + '};\n';

fs.writeFileSync(OUT, js, 'utf8');
console.log('Written: ' + OUT + '  (' + Math.round(js.length / 1024) + ' KB)');
