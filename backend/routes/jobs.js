const express = require('express');
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs?search=&industry=&location=&match=1
router.get('/', async (req, res) => {
  try {
    const { search, industry, location, match } = req.query;
    const params = [];
    let where = ' WHERE 1=1 ';

    if (search) {
      where += ' AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?) ';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    if (industry) {
      where += ' AND j.industry = ? ';
      params.push(industry);
    }

    if (location) {
      where += ' AND j.location = ? ';
      params.push(location);
    }

    const [jobs] = await pool.query(
      `SELECT j.*,
              (SELECT GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ',')
               FROM job_skills js
               JOIN skills s ON s.id = js.skill_id
               WHERE js.job_id = j.id) AS skills_csv
       FROM jobs j
       ${where}
       ORDER BY j.created_at DESC`,
      params
    );

    const result = jobs.map((j) => ({
      ...j,
      skills: j.skills_csv ? j.skills_csv.split(',') : [],
      skills_csv: undefined,
    }));

    if (match === '1') {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        try {
          const jwt = require('jsonwebtoken');
          const token = authHeader.replace('Bearer ', '');
          const payload = jwt.verify(token, process.env.JWT_SECRET);

          const [userSkills] = await pool.query(
            'SELECT skill_id FROM user_skills WHERE user_id = ?',
            [payload.id]
          );

          const userSkillIds = new Set(userSkills.map((r) => r.skill_id));

          const [allJobSkills] = await pool.query(
            'SELECT job_id, skill_id FROM job_skills'
          );

          const jobSkillMap = new Map();

          for (const row of allJobSkills) {
            if (!jobSkillMap.has(row.job_id)) {
              jobSkillMap.set(row.job_id, new Set());
            }

            jobSkillMap.get(row.job_id).add(row.skill_id);
          }

          for (const j of result) {
            const required = jobSkillMap.get(j.id) || new Set();
            const matched = [...required].filter((id) => userSkillIds.has(id)).length;

            j.match_score = matched;
            j.match_percent = required.size
              ? Math.round((matched / required.size) * 100)
              : 0;
          }

          result.sort((a, b) => (b.match_percent || 0) - (a.match_percent || 0));
        } catch (_) {}
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/jobs/industries
router.get('/industries', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT industry FROM jobs WHERE industry IS NOT NULL ORDER BY industry'
  );

  res.json(rows.map((r) => r.industry));
});

// GET /api/jobs/locations
router.get('/locations', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT location FROM jobs WHERE location IS NOT NULL ORDER BY location'
  );

  res.json(rows.map((r) => r.location));
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  const [jobs] = await pool.query(
    'SELECT * FROM jobs WHERE id = ?',
    [req.params.id]
  );

  if (!jobs.length) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const job = jobs[0];

  const [skills] = await pool.query(
    `SELECT s.id, s.name
     FROM job_skills js
     JOIN skills s ON s.id = js.skill_id
     WHERE js.job_id = ?`,
    [job.id]
  );

  job.skills = skills;

  res.json(job);
});

// POST /api/jobs
router.post('/', auth, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const {
      title,
      company,
      description,
      location,
      industry,
      job_type,
      salary_min,
      salary_max,
      skill_ids = [],
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: 'title and company are required' });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO jobs
       (title, company, description, location, industry, job_type, salary_min, salary_max, posted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        company,
        description || null,
        location || null,
        industry || null,
        job_type || 'full-time',
        salary_min || null,
        salary_max || null,
        req.user.id,
      ]
    );

    const jobId = result.insertId;

    if (Array.isArray(skill_ids) && skill_ids.length) {
      const values = skill_ids.map((skillId) => [jobId, skillId]);

      await conn.query(
        'INSERT INTO job_skills (job_id, skill_id) VALUES ?',
        [values]
      );
    }

    await conn.commit();

    res.status(201).json({ id: jobId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// PUT /api/jobs/:id
router.put('/:id', auth, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const {
      title,
      company,
      description,
      location,
      industry,
      job_type,
      salary_min,
      salary_max,
      skill_ids = [],
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: 'title and company are required' });
    }

    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT id FROM jobs WHERE id = ?',
      [req.params.id]
    );

    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Job not found' });
    }

    await conn.query(
      `UPDATE jobs
       SET title = ?,
           company = ?,
           description = ?,
           location = ?,
           industry = ?,
           job_type = ?,
           salary_min = ?,
           salary_max = ?
       WHERE id = ?`,
      [
        title,
        company,
        description || null,
        location || null,
        industry || null,
        job_type || 'full-time',
        salary_min || null,
        salary_max || null,
        req.params.id,
      ]
    );

    await conn.query(
      'DELETE FROM job_skills WHERE job_id = ?',
      [req.params.id]
    );

    if (Array.isArray(skill_ids) && skill_ids.length) {
      const values = skill_ids.map((skillId) => [req.params.id, skillId]);

      await conn.query(
        'INSERT INTO job_skills (job_id, skill_id) VALUES ?',
        [values]
      );
    }

    await conn.commit();

    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT id FROM jobs WHERE id = ?',
      [req.params.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await pool.query(
      'DELETE FROM jobs WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;