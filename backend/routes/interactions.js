const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { job_id, interaction_type } = req.body;

    const allowed = ['view', 'save', 'apply'];

    if (!job_id || !allowed.includes(interaction_type)) {
      return res.status(400).json({
        error: 'job_id and valid interaction_type are required',
      });
    }

    await pool.query(
      `INSERT INTO user_job_interactions (user_id, job_id, interaction_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [req.user.id, job_id, interaction_type]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Interaction error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/saved', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          j.id,
          j.title,
          j.company,
          j.location,
          j.industry,
          j.job_type,
          j.salary_min,
          j.salary_max,
          i.created_at AS saved_at
       FROM user_job_interactions i
       JOIN jobs j ON j.id = i.job_id
       WHERE i.user_id = ?
       AND i.interaction_type = 'save'
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Saved jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;