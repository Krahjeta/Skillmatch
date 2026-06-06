const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ml-outputs');

// GET /api/mlresults/status  — check if Python ML outputs exist
router.get('/status', (req, res) => {
  const csvPath = path.join(OUTPUT_DIR, 'comparison_table.csv');
  const exists  = fs.existsSync(csvPath);
  res.json({ ready: exists });
});

// GET /api/mlresults/comparison  — classifier comparison table as JSON
router.get('/comparison', (req, res) => {
  const csvPath = path.join(OUTPUT_DIR, 'comparison_table.csv');
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: 'ML results not found. Run python main.py first.' });
  }
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = isNaN(vals[i]) ? vals[i] : parseFloat(parseFloat(vals[i]).toFixed(4));
    });
    return obj;
  });
  res.json({ headers, rows });
});

// GET /api/mlresults/clusters  — cluster composition table as JSON
router.get('/clusters', (req, res) => {
  const csvPath = path.join(OUTPUT_DIR, 'cluster_composition.csv');
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: 'Cluster data not found. Run python main.py first.' });
  }
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = isNaN(vals[i]) ? vals[i] : parseFloat(parseFloat(vals[i]).toFixed(3));
    });
    return obj;
  });
  res.json({ headers, rows });
});

// GET /api/mlresults/images  — list of available chart images
router.get('/images', (req, res) => {
  const imageFiles = [
    { key: 'comparison',   file: 'classifier_comparison.png',       title: 'Classifier Comparison' },
    { key: 'confusion',    file: 'confusion_matrices.png',           title: 'Confusion Matrices' },
    { key: 'clustering',   file: 'clustering_pca.png',               title: 'Clustering (PCA 2D)' },
    { key: 'silhouette',   file: 'silhouette_curve.png',             title: 'Silhouette Score vs K' },
    { key: 'heatmap',      file: 'cluster_composition_heatmap.png',  title: 'Cluster Composition' },
  ];
  const available = imageFiles
    .filter(img => fs.existsSync(path.join(OUTPUT_DIR, img.file)))
    .map(img => ({ ...img, url: `/ml-outputs/${img.file}` }));
  res.json({ images: available });
});

module.exports = router;