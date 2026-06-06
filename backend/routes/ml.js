const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const {
  tokenize,
  buildTfIdf,
  buildJobVector,
  buildUserVector,
  cosineSimilarity,
  kMeans,
  labelCluster,
  skillGapAnalysis,
} = require('../ml/engine');

const router = express.Router();

// ── Helper: load all jobs with their skills ──────────────────────────────────
async function loadJobs() {
  const [jobs] = await pool.query(
    `SELECT j.id, j.title, j.company, j.description, j.location, j.industry,
            j.job_type, j.salary_min, j.salary_max,
            GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR '|||') AS skill_names
     FROM jobs j
     LEFT JOIN job_skills js ON js.job_id = j.id
     LEFT JOIN skills s      ON s.id = js.skill_id
     GROUP BY j.id`
  );

  return jobs.map(j => ({
    ...j,
    skills: j.skill_names ? j.skill_names.split('|||') : [],
  }));
}

// ── Helper: load user skills ─────────────────────────────────────────────────
async function loadUserSkills(userId) {
  const [rows] = await pool.query(
    `SELECT s.name, us.level
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ?`,
    [userId]
  );

  return rows;
}

// ── Helper: behavior scores ──────────────────────────────────────────────────
async function loadUserBehaviorScores(userId) {
  const [rows] = await pool.query(
    `SELECT job_id, interaction_type
     FROM user_job_interactions
     WHERE user_id = ?`,
    [userId]
  );

  const weights = {
    view: 1,
    save: 3,
    apply: 5,
  };

  const scores = new Map();

  for (const row of rows) {
    scores.set(
      row.job_id,
      (scores.get(row.job_id) || 0) + (weights[row.interaction_type] || 0)
    );
  }

  return scores;
}

// ── GET /api/ml/recommendations ──────────────────────────────────────────────
router.get('/recommendations', auth, async (req, res) => {
  try {
    const jobs = await loadJobs();
    const userSkills = await loadUserSkills(req.user.id);
    const behaviorScores = await loadUserBehaviorScores(req.user.id);

    if (!jobs.length) {
      return res.json({ jobs: [], message: 'No jobs in database.' });
    }

    if (!userSkills.length) {
      return res.json({
        jobs: [],
        message: 'Add skills to your profile to get recommendations.',
      });
    }

    const tokenized = jobs.map(j =>
      tokenize(`${j.description || ''} ${j.title || ''}`)
    );

    const tfidfVecs = buildTfIdf(tokenized);

    const jobVectors = jobs.map((job, i) =>
      buildJobVector(job, tfidfVecs[i])
    );

    const userVec = buildUserVector(userSkills);

    const maxBehaviorScore = Math.max(...behaviorScores.values(), 1);

    const scored = jobs.map((job, i) => {
      const sim = cosineSimilarity(userVec, jobVectors[i]);

     const levelWeight = {
  beginner: 0.5,
  intermediate: 1,
  advanced: 1.5,
  expert: 2,
};

const userSkillMap = new Map();

userSkills.forEach((s) => {
  userSkillMap.set(
    s.name.toLowerCase(),
    levelWeight[String(s.level).toLowerCase()] || 1
  );
});

let matched = 0;
let weightedMatch = 0;

job.skills.forEach((skill) => {
  const weight = userSkillMap.get(skill.toLowerCase());

  if (weight) {
    matched += 1;
    weightedMatch += weight;
  }
});

const maxPossible = job.skills.length * 2;

const matchPct = maxPossible
  ? Math.min(100, Math.round((weightedMatch / maxPossible) * 100))
  : 0;
      const behaviorScoreRaw = behaviorScores.get(job.id) || 0;
      const behaviorBoost = behaviorScoreRaw / maxBehaviorScore;

      const finalScore =
        (sim * 0.55) +
        ((matchPct / 100) * 0.30) +
        (behaviorBoost * 0.15);

      return {
        ...job,
        mlScore: parseFloat((finalScore * 100).toFixed(2)),
        contentScore: parseFloat((sim * 100).toFixed(2)),
        behaviorScore: behaviorScoreRaw,
        matchPercent: matchPct,
        matchedSkills: matched,
        totalSkills: job.skills.length,
      };
    });

    const top = scored
      .filter(j => j.mlScore > 0)
      .sort((a, b) => b.mlScore - a.mlScore)
      .slice(0, 10);

    res.json({
      jobs: top,
      algorithm: 'TF-IDF + Cosine Similarity + Behavior Boost',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ML recommendation error' });
  }
});

// ── GET /api/ml/skill-gap ────────────────────────────────────────────────────
router.get('/skill-gap', auth, async (req, res) => {
  try {
    const jobs = await loadJobs();
    const userSkills = await loadUserSkills(req.user.id);

    const tokenized = jobs.map(j =>
      tokenize(`${j.description || ''} ${j.title || ''}`)
    );

    const tfidfVecs = buildTfIdf(tokenized);

    const jobVectors = jobs.map((job, i) =>
      buildJobVector(job, tfidfVecs[i])
    );

    const userVec = buildUserVector(userSkills);

    const topJobs = jobs
      .map((job, i) => ({
        ...job,
        sim: cosineSimilarity(userVec, jobVectors[i]),
      }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 20);

    const gaps = skillGapAnalysis(userSkills, topJobs);

    res.json({
      gaps,
      algorithm: 'Skill Gap Analysis on Top-20 Recommendations',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Skill gap analysis error' });
  }
});

// ── GET /api/ml/clusters ─────────────────────────────────────────────────────
router.get('/clusters', auth, async (req, res) => {
  try {
    const jobs = await loadJobs();

    if (jobs.length < 6) {
      return res.json({ clusters: [] });
    }

    const tokenized = jobs.map(j =>
      tokenize(`${j.description || ''} ${j.title || ''}`)
    );

    const tfidfVecs = buildTfIdf(tokenized);

    const jobVectors = jobs.map((job, i) =>
      buildJobVector(job, tfidfVecs[i])
    );

    const K = Math.min(6, Math.floor(Math.sqrt(jobs.length / 2)));

    const assignments = kMeans(jobVectors, K);

    const clusters = {};

    jobs.forEach((job, i) => {
      const ci = assignments[i];

      if (!clusters[ci]) {
        clusters[ci] = [];
      }

      clusters[ci].push(job);
    });

    const result = Object.entries(clusters).map(([ci, members]) => ({
      id: parseInt(ci),
      label: labelCluster(jobs, parseInt(ci), assignments),
      size: members.length,
      sampleJobs: members.slice(0, 5).map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        industry: j.industry,
      })),
    }));

    res.json({
      clusters: result,
      k: K,
      algorithm: 'K-Means Clustering',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Clustering error' });
  }
});

// ── GET /api/ml/collaborative ────────────────────────────────────────────────
router.get('/collaborative', auth, async (req, res) => {
  try {
    const weights = {
      view: 1,
      save: 3,
      apply: 5,
    };

    const [myRows] = await pool.query(
      `SELECT job_id, interaction_type
       FROM user_job_interactions
       WHERE user_id = ?`,
      [req.user.id]
    );

    if (!myRows.length) {
      return res.json({
        jobs: [],
        message: 'View, save, or apply to jobs to get collaborative recommendations.',
      });
    }

    const myVector = new Map();

    for (const row of myRows) {
      myVector.set(
        row.job_id,
        (myVector.get(row.job_id) || 0) + weights[row.interaction_type]
      );
    }

    const myJobIds = new Set([...myVector.keys()]);

    const [otherRows] = await pool.query(
      `SELECT user_id, job_id, interaction_type
       FROM user_job_interactions
       WHERE user_id <> ?`,
      [req.user.id]
    );

    const users = new Map();

    for (const row of otherRows) {
      if (!users.has(row.user_id)) {
        users.set(row.user_id, new Map());
      }

      const vec = users.get(row.user_id);

      vec.set(
        row.job_id,
        (vec.get(row.job_id) || 0) + weights[row.interaction_type]
      );
    }

    function cosineMap(a, b) {
      const keys = new Set([...a.keys(), ...b.keys()]);
      let dot = 0;
      let magA = 0;
      let magB = 0;

      for (const key of keys) {
        const av = a.get(key) || 0;
        const bv = b.get(key) || 0;

        dot += av * bv;
        magA += av * av;
        magB += bv * bv;
      }

      if (magA === 0 || magB === 0) return 0;

      return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    const similarUsers = [...users.entries()]
      .map(([userId, vector]) => ({
        userId,
        vector,
        similarity: cosineMap(myVector, vector),
      }))
      .filter(u => u.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    const jobScores = new Map();

    for (const u of similarUsers) {
      for (const [jobId, score] of u.vector.entries()) {
        if (myJobIds.has(jobId)) continue;

        jobScores.set(
          jobId,
          (jobScores.get(jobId) || 0) + score * u.similarity
        );
      }
    }

    const suggestions = [...jobScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (!suggestions.length) {
      return res.json({
        jobs: [],
        message: 'No collaborative recommendations yet.',
      });
    }

    const ids = suggestions.map(([jobId]) => jobId);

    const placeholders = ids.map(() => '?').join(',');

    const [jobRows] = await pool.query(
      `SELECT j.*, GROUP_CONCAT(s.name SEPARATOR ', ') AS skill_names
       FROM jobs j
       LEFT JOIN job_skills js ON js.job_id = j.id
       LEFT JOIN skills s ON s.id = js.skill_id
       WHERE j.id IN (${placeholders})
       GROUP BY j.id`,
      ids
    );

    const jobs = jobRows.map(job => {
      const found = suggestions.find(([jobId]) => jobId === job.id);

      return {
        ...job,
        collaborativeScore: found ? Number(found[1].toFixed(3)) : 0,
      };
    });

    jobs.sort((a, b) => b.collaborativeScore - a.collaborativeScore);

    res.json({
      jobs,
      algorithm: 'Behavior-Based Collaborative Filtering',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Collaborative filtering error' });
  }
});

// ── GET /api/ml/similar/:id ──────────────────────────────────────────────────
router.get('/similar/:id', auth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);

    const jobs = await loadJobs();

    const target = jobs.find(j => j.id === jobId);

    if (!target) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const tokenized = jobs.map(j =>
      tokenize(`${j.description || ''} ${j.title || ''}`)
    );

    const tfidfVecs = buildTfIdf(tokenized);

    const jobVectors = jobs.map((job, i) =>
      buildJobVector(job, tfidfVecs[i])
    );

    const targetIdx = jobs.findIndex(j => j.id === jobId);

    const similar = jobs
      .map((job, i) => ({
        ...job,
        similarity: cosineSimilarity(jobVectors[targetIdx], jobVectors[i]),
      }))
      .filter(j => j.id !== jobId && j.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    res.json({
      jobs: similar,
      algorithm: 'Item-Based Cosine Similarity',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Similar jobs error' });
  }
});
// GET /api/ml/career-level
router.get('/career-level', auth, async (req, res) => {
  try {
    const userSkills = await loadUserSkills(req.user.id);

    if (!userSkills.length) {
      return res.json({
        currentLevel: 'Unknown',
        progress: 0,
        missingSkills: ['Add skills to your profile first'],
      });
    }

    const skillNames = userSkills.map(s => s.name.toLowerCase());

    const seniorSkills = [
      'docker',
      'aws',
      'system design',
      'kubernetes',
      'typescript',
      'ci/cd',
      'microservices',
    ];

    let currentLevel = 'Junior Developer';
    let progress = 30;

    if (skillNames.length >= 5) {
      currentLevel = 'Mid-Level Developer';
      progress = 60;
    }

    const hasSeniorSkill = seniorSkills.some(skill =>
      skillNames.includes(skill)
    );

    if (skillNames.length >= 9 && hasSeniorSkill) {
      currentLevel = 'Senior Developer';
      progress = 90;
    }

    const missingSkills = seniorSkills
      .filter(skill => !skillNames.includes(skill))
      .slice(0, 5);

    res.json({
      currentLevel,
      progress,
      missingSkills,
      algorithm: 'Live Career Level Estimation',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Career level error' });
  }
});


// GET /api/ml/job-fit/:jobId
router.get('/job-fit/:jobId', auth, async (req, res) => {
  try {
    const jobId = Number(req.params.jobId);

    const userSkills = await loadUserSkills(req.user.id);
    const jobs = await loadJobs();

    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!userSkills.length) {
      return res.json({
        fitScore: 0,
        level: 'Low Fit',
        matchedSkills: [],
        missingSkills: job.skills || [],
      });
    }

    const userSkillNames = new Set(
      userSkills.map(s => s.name.toLowerCase())
    );

    const jobSkills = job.skills || [];

    const matchedSkills = jobSkills.filter(skill =>
      userSkillNames.has(skill.toLowerCase())
    );

    const missingSkills = jobSkills.filter(skill =>
      !userSkillNames.has(skill.toLowerCase())
    );

    const fitScore = jobSkills.length
      ? Math.round((matchedSkills.length / jobSkills.length) * 100)
      : 0;

    let level = 'Low Fit';

    if (fitScore >= 70) level = 'High Fit';
    else if (fitScore >= 40) level = 'Medium Fit';

    res.json({
      jobId,
      fitScore,
      level,
      matchedSkills,
      missingSkills,
      algorithm: 'Live Skill Match Prediction',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Job fit prediction error' });
  }
});


module.exports = router;