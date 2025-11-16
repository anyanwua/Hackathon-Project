/**
 * Calculate Random Forest feature importance weights
 * This uses a simple approximation based on correlation with stress_level
 * For exact RF weights, run the Python script with pandas/sklearn installed
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the CSV file
const csvPath = join(__dirname, '../unified_lifestyle_dataset.csv');
const csvContent = readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');
const data = lines.slice(1).map(line => {
  const values = line.split(',');
  const row = {};
  headers.forEach((header, i) => {
    row[header.trim()] = parseFloat(values[i]);
  });
  return row;
});

console.log(`Loaded ${data.length} rows`);
console.log(`Features: ${headers.join(', ')}`);

// Calculate correlation with stress_level for each feature
function calculateCorrelation(featureData, stressData) {
  const n = featureData.length;
  const meanFeature = featureData.reduce((a, b) => a + b, 0) / n;
  const meanStress = stressData.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sumSqFeature = 0;
  let sumSqStress = 0;
  
  for (let i = 0; i < n; i++) {
    const diffFeature = featureData[i] - meanFeature;
    const diffStress = stressData[i] - meanStress;
    numerator += diffFeature * diffStress;
    sumSqFeature += diffFeature * diffFeature;
    sumSqStress += diffStress * diffStress;
  }
  
  const denominator = Math.sqrt(sumSqFeature * sumSqStress);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Extract feature columns and stress
const features = ['sleep_hours', 'screen_time_hours', 'exercise_minutes', 'water_intake_liters', 'meditation_minutes'];
const stressData = data.map(row => row.stress_level);

// Calculate absolute correlations (importance proxy)
const correlations = {};
features.forEach(feature => {
  const featureData = data.map(row => row[feature]);
  const corr = Math.abs(calculateCorrelation(featureData, stressData));
  correlations[feature] = corr;
  console.log(`${feature}: correlation = ${corr.toFixed(4)}`);
});

// Normalize to sum to 1 (like RF importance weights)
const totalCorr = Object.values(correlations).reduce((a, b) => a + b, 0);
const weights = {};
Object.keys(correlations).forEach(feature => {
  weights[feature] = correlations[feature] / totalCorr;
});

console.log('\n' + '='.repeat(60));
console.log('Feature Importance Weights (normalized to sum to 1):');
console.log('='.repeat(60));
Object.entries(weights).forEach(([feature, weight]) => {
  console.log(`${feature}: ${weight.toFixed(6)}`);
});

const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
console.log(`\nTotal weight sum: ${totalWeight.toFixed(10)} (should be 1.0)`);

// Save to JSON
const outputPath = join(__dirname, 'models/feature_weights.json');
writeFileSync(outputPath, JSON.stringify(weights, null, 2), 'utf-8');

console.log(`\n✅ Weights saved to: ${outputPath}`);

// Print JavaScript format
console.log('\nJavaScript format (for server/index.js):');
console.log('const FEATURE_WEIGHTS = {');
Object.entries(weights).forEach(([feature, weight]) => {
  console.log(`  ${feature}: ${weight.toFixed(6)},`);
});
console.log('};');

