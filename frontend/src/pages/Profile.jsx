import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();

  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [careerInsight, setCareerInsight] = useState(null);

  const [skillName, setSkillName] = useState('');
  const [level, setLevel] = useState('intermediate');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function loadSkills() {
    const r = await api.get('/users/me/skills');
    setSkills(r.data);
  }

  async function loadAllSkills() {
    const r = await api.get('/users/skills/all');
    setAllSkills(r.data);
  }

  async function loadCareerInsight() {
    try {
      const r = await api.get('/users/me/career-insights');
      setCareerInsight(r.data);
    } catch (err) {
      setCareerInsight({
        currentLevel: 'Not enough data yet',
        level: 'Unknown',
        path: 'Unknown',
        progress: 0,
        missingSkills: ['Add skills to your profile first'],
        summary: 'Add your skills to unlock career insights.',
      });
    }
  }

  async function refreshProfileData() {
    await loadSkills();
    await loadAllSkills();
    await loadCareerInsight();
  }

  useEffect(() => {
    refreshProfileData();
  }, []);

  async function addSkill(e) {
    e.preventDefault();

    if (!skillName.trim()) return;

    setError('');

    try {
      await api.post('/users/me/skills', {
        name: skillName.trim(),
        level,
      });

      setSkillName('');
      setLevel('intermediate');

      await refreshProfileData();

      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add skill');
    }
  }

  async function removeSkill(skillId) {
    setError('');

    try {
      await api.delete(`/users/me/skills/${skillId}`);
      await refreshProfileData();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove skill');
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    setMsg('');
    setError('');

    try {
      const r = await api.put('/users/me', profile);

      setUser(r.data);
      setMsg('Profile updated.');

      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update profile');
    }
  }

  return (
    <div className="container">
      <h1>Your profile</h1>

      {error && <div className="error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>About you</h2>

        {msg && <div className="success">{msg}</div>}

        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label>Name</label>
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  name: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              value={profile.location}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  location: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  bio: e.target.value,
                })
              }
            />
          </div>

          <button type="submit" className="btn-primary">
            Save profile
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Your skills</h2>

        <p style={{ color: '#6b7280', marginTop: 0 }}>
          The more skills you add, the better we can match you to the right jobs.
        </p>

        <div style={{ marginBottom: 16 }}>
          {skills.length === 0 && (
            <p style={{ color: '#6b7280' }}>
              You haven&apos;t added any skills yet.
            </p>
          )}

          {skills.map((s) => (
            <span key={s.id} className="chip-remove">
              {s.name}
              <small style={{ opacity: 0.7 }}>({s.level})</small>

              <button
                type="button"
                onClick={() => removeSkill(s.id)}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <form
          onSubmit={addSkill}
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div
            className="form-group"
            style={{
              flex: '1 1 220px',
              marginBottom: 0,
            }}
          >
            <label>Add a skill</label>

            <input
              list="skill-suggestions"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Docker"
            />

            <datalist id="skill-suggestions">
              {allSkills.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div
            className="form-group"
            style={{
              flex: '0 0 180px',
              marginBottom: 0,
            }}
          >
            <label>Level</label>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Add skill
          </button>
        </form>
      </div>

      <CareerInsightCard careerInsight={careerInsight} skills={skills} />
    </div>
  );
}

function CareerInsightCard({ careerInsight, skills }) {
  if (!careerInsight) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Career Insights</h2>
        <p style={{ color: '#6b7280' }}>Loading career insights...</p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 20,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>
            Career Insights
          </h2>

          <p style={{ color: '#6b7280', marginTop: 0 }}>
            Based on your current skills and skill levels.
          </p>
        </div>

        <span
          style={{
            background: '#f3f4f6',
            color: '#374151',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {careerInsight.path || 'Unknown'}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginTop: 10,
        }}
      >
        <div
          style={{
            background: '#f9fafb',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            Current Career Level
          </p>

          <h3
            style={{
              margin: 0,
              fontSize: 22,
              color: '#111827',
            }}
          >
            {careerInsight.currentLevel}
          </h3>

          <div
            style={{
              marginTop: 14,
              height: 10,
              background: '#e5e7eb',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${careerInsight.progress || 0}%`,
                height: '100%',
                background: '#2563eb',
              }}
            />
          </div>

          <p
            style={{
              margin: '8px 0 0',
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            Senior readiness: {careerInsight.progress || 0}%
          </p>
        </div>

        <div
          style={{
            background: '#f9fafb',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e5e7eb',
          }}
        >
          <p
            style={{
              margin: '0 0 10px',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            To reach Senior level
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {(careerInsight.missingSkills || []).map((skill) => (
              <span
                key={skill}
                style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: '16px 0 0',
          color: '#4b5563',
          lineHeight: 1.6,
        }}
      >
        {careerInsight.summary}
      </p>

      {skills.length === 0 && (
        <p style={{ marginBottom: 0, color: '#b45309' }}>
          Add skills such as JavaScript, React, Node.js, Docker, AWS, or SQL to get better career insights.
        </p>
      )}
    </div>
  );
}