require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const jobRoutes       = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const aiRoutes        = require('./routes/ai');
const mlRoutes        = require('./routes/ml');
const mlResultsRoutes = require('./routes/mlresults');

const app = express();

app.use(cors());
app.use(express.json());

// Serve Python ML output images statically
app.use('/ml-outputs', express.static(path.join(__dirname, 'public', 'ml-outputs')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/mlresults', mlResultsRoutes);
const interactionsRoutes = require('./routes/interactions');

app.use('/api/interactions', interactionsRoutes);

// fallback 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SkillPath API listening on http://localhost:${PORT}`);
});