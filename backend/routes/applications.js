const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/applications/all  (admin only)
router.get('/all', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.user_id,
          a.job_id,
          a.cover_letter,
          a.status,
          a.applied_at,
          u.name AS applicant_name,
          u.email AS applicant_email,
          j.title AS job_title,
          j.company,
          j.location,
          j.industry
       FROM applications a
       JOIN users u ON u.id = a.user_id
       JOIN jobs j ON j.id = a.job_id
       ORDER BY a.applied_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Admin applications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/applications/me
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.user_id,
          a.job_id,
          a.cover_letter,
          a.status,
          a.applied_at,
          j.title,
          j.company,
          j.location,
          j.industry
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('My applications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/applications
router.post('/', auth, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { job_id, cover_letter } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO applications (user_id, job_id, cover_letter)
       VALUES (?, ?, ?)`,
      [req.user.id, job_id, cover_letter || null]
    );

    await conn.query(
      `INSERT INTO user_job_interactions (user_id, job_id, interaction_type)
       VALUES (?, ?, 'apply')
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [req.user.id, job_id]
    );

    await conn.commit();

    res.status(201).json({ ok: true });
  } catch (err) {
    await conn.rollback();

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'You have already applied to this job',
      });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({
        error: 'Job not found',
      });
    }

    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// GET /api/applications/job/:jobId  (admin only)
router.get('/job/:jobId', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          a.id,
          a.user_id,
          a.job_id,
          a.cover_letter,
          a.status,
          a.applied_at,
          u.name AS user_name,
          u.email AS user_email
       FROM applications a
       JOIN users u ON u.id = a.user_id
       WHERE a.job_id = ?
       ORDER BY a.applied_at DESC`,
      [req.params.jobId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Job applications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/applications/:id/status  (admin only)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ['pending', 'reviewed', 'accepted', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `status must be one of ${allowed.join(', ')}`,
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE id = ?',
      [req.params.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await pool.query(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;