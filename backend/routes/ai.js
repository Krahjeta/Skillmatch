const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const [skills] = await pool.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );

    const [applications] = await pool.query(
      `SELECT j.title, j.company, a.status
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    const skillText = skills.length
      ? skills.map((s) => `${s.name} (${s.level})`).join(', ')
      : 'no skills added yet';

    const lower = message.toLowerCase();

    let reply = '';

    if (lower.includes('skill') || lower.includes('learn')) {
      reply =
        `Based on your current profile, your skills are: ${skillText}.\n\n` +
        `To improve your chances, focus on adding practical skills that match the jobs you want. ` +
        `For software roles, useful skills are JavaScript, React, Node.js, SQL, Docker, AWS, and system design.`;
    } else if (lower.includes('job') || lower.includes('match')) {
      reply =
        `Your job recommendations are based on your skills and job activity. ` +
        `The system compares your skills with job requirements and also learns from jobs you view, save, or apply to.\n\n` +
        `Current skills: ${skillText}.`;
    } else if (lower.includes('salary')) {
      reply =
        `Salary depends on the job title, location, industry, and required skills. ` +
        `In your project, salary-related insights are estimated from the LinkedIn job dataset and job features.`;
    } else if (lower.includes('application') || lower.includes('apply')) {
      const appText = applications.length
        ? applications.map((a) => `${a.title} at ${a.company} (${a.status})`).join('\n')
        : 'You have not applied to jobs yet.';

      reply =
        `Here is your recent application activity:\n${appText}\n\n` +
        `Try to apply to jobs where your match percentage is higher and improve missing skills for better results.`;
    } else {
      reply =
        `Based on your profile, I can help you with job matching, missing skills, applications, and career planning.\n\n` +
        `Your current skills are: ${skillText}.\n\n` +
        `A good next step is to compare your skills with the jobs you want and improve the missing skills shown in Recommendations.`;
    }

    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI advisor error' });
  }
});

module.exports = router;