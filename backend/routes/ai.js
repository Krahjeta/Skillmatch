// ============================================================================
// AI.JS - Career Advisor API
// Project: SkillPath
//
// Work Distribution:
//
// Krahjeta:
// - Career Advisor Logic
// - AI Response Generation
// - Profile Analysis
// - Career Suggestions
//
// Anita:
// - Database Queries
// - Skills Retrieval
// - Application Retrieval
// - User Data Processing
//
// Sara:
// - API Route Structure
// - Request Validation
// - Error Handling
// - Response Formatting
//
// Shared Work:
// - Testing
// - Backend Integration
// - Debugging
// ============================================================================

const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();


// ============================================================================
// SARA
// POST /api/ai/chat
// Main endpoint used by CareerAdvisor.jsx.
// Receives user questions and returns career advice.
// ============================================================================
router.post('/chat', auth, async (req, res) => {
  try {

    // ==========================================================================
    // SARA
    // Request validation.
    // Ensures a message was provided before processing.
    // ==========================================================================
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }


    // ==========================================================================
    // ANITA
    // Load user skills from database.
    // Used to personalize career advice.
    // ==========================================================================
    const [skills] = await pool.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?
       ORDER BY s.name`,
      [req.user.id]
    );


    // ==========================================================================
    // ANITA
    // Load recent applications.
    // Used when users ask about applications or job activity.
    // ==========================================================================
    const [applications] = await pool.query(
      `SELECT j.title, j.company, a.status
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       WHERE a.user_id = ?
       ORDER BY a.applied_at DESC
       LIMIT 5`,
      [req.user.id]
    );


    // ==========================================================================
    // ANITA
    // Convert skill list into readable text.
    // ==========================================================================
    const skillText = skills.length
      ? skills
          .map((s) => `${s.name} (${s.level})`)
          .join(', ')
      : 'no skills added yet';

    const lower = message.toLowerCase();

    let reply = '';


    // ==========================================================================
    // KRAHJETA
    // Skill Learning Advisor
    // Gives recommendations about skills to learn next.
    // ==========================================================================
    if (lower.includes('skill') || lower.includes('learn')) {

      reply =
        `Based on your current profile, your skills are: ${skillText}.\n\n` +
        `To improve your chances, focus on adding practical skills that match the jobs you want. ` +
        `For software roles, useful skills are JavaScript, React, Node.js, SQL, Docker, AWS, and system design.`;

    }


    // ==========================================================================
    // KRAHJETA
    // Job Matching Advisor
    // Explains how SkillPath recommendations work.
    // ==========================================================================
    else if (
      lower.includes('job') ||
      lower.includes('match')
    ) {

      reply =
        `Your job recommendations are based on your skills and job activity. ` +
        `The system compares your skills with job requirements and also learns from jobs you view, save, or apply to.\n\n` +
        `Current skills: ${skillText}.`;

    }


    // ==========================================================================
    // KRAHJETA
    // Salary Advisor
    // Provides salary-related explanations.
    // ==========================================================================
    else if (lower.includes('salary')) {

      reply =
        `Salary depends on the job title, location, industry, and required skills. ` +
        `In your project, salary-related insights are estimated from the LinkedIn job dataset and job features.`;

    }


    // ==========================================================================
    // KRAHJETA
    // Application Advisor
    // Shows user's recent applications and guidance.
    // ==========================================================================
    else if (
      lower.includes('application') ||
      lower.includes('apply')
    ) {

      const appText = applications.length
        ? applications
            .map(
              (a) =>
                `${a.title} at ${a.company} (${a.status})`
            )
            .join('\n')
        : 'You have not applied to jobs yet.';

      reply =
        `Here is your recent application activity:\n${appText}\n\n` +
        `Try to apply to jobs where your match percentage is higher and improve missing skills for better results.`;

    }


    // ==========================================================================
    // KRAHJETA
    // General Career Advisor
    // Default response for all other questions.
    // ==========================================================================
    else {

      reply =
        `Based on your profile, I can help you with job matching, missing skills, applications, and career planning.\n\n` +
        `Your current skills are: ${skillText}.\n\n` +
        `A good next step is to compare your skills with the jobs you want and improve the missing skills shown in Recommendations.`;

    }


    // ==========================================================================
    // SARA
    // Send response back to frontend.
    // ==========================================================================
    res.json({
      reply
    });

  } catch (err) {

    // ==========================================================================
    // SARA
    // Error handling.
    // ==========================================================================
    console.error('AI chat error:', err);

    res.status(500).json({
      error: 'AI advisor error'
    });
  }
});

module.exports = router;