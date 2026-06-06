const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

const CAREER_PATHS = {
  developer: {
    label: 'Developer',
    seniorSkills: ['docker', 'aws', 'system design', 'kubernetes', 'ci/cd', 'typescript'],
  },
  data: {
    label: 'Data / AI',
    seniorSkills: ['deep learning', 'mlops', 'aws', 'docker'],
  },
  general: {
    label: 'Professional',
    seniorSkills: ['leadership', 'strategy', 'mentoring'],
  },
};

function normalizeSkill(skill) {
  return String(skill || '').trim().toLowerCase();
}

function detectCareerPath(skillNames) {
  const joined = skillNames.join(' ');

  const developerWords = [
    'html',
    'css',
    'javascript',
    'react',
    'node',
    'express',
    'mysql',
    'sql',
    'api',
    'jwt',
  ];

  const dataWords = [
    'python',
    'pandas',
    'numpy',
    'machine learning',
    'tensorflow',
    'pytorch',
  ];

  const devScore = developerWords.filter((w) => joined.includes(w)).length;
  const dataScore = dataWords.filter((w) => joined.includes(w)).length;

  if (dataScore > devScore) return 'data';
  if (devScore > 0) return 'developer';

  return 'general';
}

function calculateCareerInsight(userSkills) {
  const skillNames = userSkills.map((s) => normalizeSkill(s.name));
  const skillSet = new Set(skillNames);

  const pathKey = detectCareerPath(skillNames);
  const path = CAREER_PATHS[pathKey];

  let level = 'Junior';
  let progress = 25;

  if (skillNames.length >= 5) {
    level = 'Mid-Level';
    progress = 60;
  }

  if (
    path.seniorSkills.some((skill) => skillSet.has(skill)) &&
    skillNames.length >= 9
  ) {
    level = 'Senior';
    progress = 90;
  }

  const missingSkills = path.seniorSkills
    .filter((skill) => !skillSet.has(skill))
    .slice(0, 5);

  return {
    currentLevel: `${level} ${path.label}`,
    level,
    path: path.label,
    progress,
    missingSkills,
    summary:
      level === 'Senior'
        ? 'You already match many senior-level signals.'
        : 'Focus on advanced engineering and architecture skills to reach senior level.',
  };
}

// GET /api/users/me/skills
router.get('/me/skills', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, us.level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get user skills error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/me/skills
router.post('/me/skills', auth, async (req, res) => {
  try {
    let { skill_id, name, level } = req.body;

    level = level || 'intermediate';

    if (!skill_id && name) {
      const cleanName = name.trim();

      const [existing] = await pool.query(
        'SELECT id FROM skills WHERE LOWER(name) = LOWER(?)',
        [cleanName]
      );

      if (existing.length) {
        skill_id = existing[0].id;
      } else {
        const [result] = await pool.query(
          'INSERT INTO skills (name) VALUES (?)',
          [cleanName]
        );

        skill_id = result.insertId;
      }
    }

    if (!skill_id) {
      return res.status(400).json({
        error: 'skill_id or name is required',
      });
    }

    await pool.query(
      `INSERT INTO user_skills (user_id, skill_id, level)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE level = VALUES(level)`,
      [req.user.id, skill_id, level]
    );

    res.status(201).json({
      ok: true,
      skill_id,
      level,
    });
  } catch (err) {
    console.error('Add user skill error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/me/skills/:skillId
router.delete('/me/skills/:skillId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [req.user.id, req.params.skillId]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete user skill error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/me/career-insights
router.get('/me/career-insights', auth, async (req, res) => {
  try {
    const [skills] = await pool.query(
      `SELECT s.id, s.name, us.level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );

    if (!skills.length) {
      return res.json({
        currentLevel: 'Not enough data yet',
        level: 'Unknown',
        path: 'Unknown',
        progress: 0,
        missingSkills: ['Add skills to your profile first'],
        summary: 'Add your skills to unlock career insights.',
      });
    }

    const insight = calculateCareerInsight(skills);

    res.json(insight);
  } catch (err) {
    console.error('Career insights error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/skills/all
router.get('/skills/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name FROM skills ORDER BY name'
    );

    res.json(rows);
  } catch (err) {
    console.error('Get all skills error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/skills/create
router.post('/skills/create', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Skill name is required',
      });
    }

    const cleanName = name.trim();

    const [existing] = await pool.query(
      'SELECT id, name FROM skills WHERE LOWER(name) = LOWER(?)',
      [cleanName]
    );

    if (existing.length) {
      return res.status(200).json(existing[0]);
    }

    const [result] = await pool.query(
      'INSERT INTO skills (name) VALUES (?)',
      [cleanName]
    );

    res.status(201).json({
      id: result.insertId,
      name: cleanName,
    });
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, location, bio } = req.body;

    await pool.query(
      `UPDATE users
       SET name = COALESCE(?, name),
           location = ?,
           bio = ?
       WHERE id = ?`,
      [name, location || null, bio || null, req.user.id]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, role, location, bio FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;