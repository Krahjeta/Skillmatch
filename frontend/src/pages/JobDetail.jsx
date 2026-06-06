import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((r) => setJob(r.data))
      .catch(() => setError('Could not load job'));

    if (user) {
      api.post('/interactions', {
        job_id: Number(id),
        interaction_type: 'view',
      }).catch(() => {});
    }
  }, [id, user]);

  async function apply(e) {
    e.preventDefault();

    setMsg('');
    setError('');
    setSubmitting(true);

    try {
      await api.post('/applications', {
        job_id: Number(id),
        cover_letter: coverLetter,
      });

      await api.post('/interactions', {
        job_id: Number(id),
        interaction_type: 'apply',
      }).catch(() => {});

      setMsg('Application sent. Track its status under "My Applications".');
      setCoverLetter('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send application');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveJob() {
    setMsg('');
    setError('');
    setSaving(true);

    try {
      await api.post('/interactions', {
        job_id: Number(id),
        interaction_type: 'save',
      });

      setMsg('Job saved. Recommendations will improve based on this.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save job');
    } finally {
      setSaving(false);
    }
  }

  if (!job) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="job-detail">
        <div className="card">
          <Link to="/jobs">← Back to jobs</Link>
          {user?.role === 'admin' && (
  <div style={{ marginTop: 12, marginBottom: 12 }}>
    <Link
      to={`/admin/jobs/${job.id}/edit`}
      className="btn-ghost"
    >
      Edit / Delete Job
    </Link>
  </div>
)}

          <h1 style={{ marginBottom: 4 }}>
            {job.title}
          </h1>

          <div
            className="company"
            style={{
              color: '#6b7280',
              fontSize: 16,
              marginBottom: 14,
            }}
          >
            {job.company}
          </div>

          <div
            className="meta"
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            {job.location && <span style={chip}>{job.location}</span>}
            {job.industry && <span style={chip}>{job.industry}</span>}
            {job.job_type && <span style={chip}>{job.job_type}</span>}

            {(job.salary_min || job.salary_max) && (
              <span style={chip}>
                €{job.salary_min || '?'} – €{job.salary_max || '?'}
              </span>
            )}
          </div>

          <h3>Description</h3>

          <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {job.description || 'No description provided.'}
          </p>

          <h3>Required skills</h3>

          <div className="skills">
            {(job.skills || []).map((s) => (
              <span key={s.id} className="skill-pill">
                {s.name}
              </span>
            ))}

            {(!job.skills || job.skills.length === 0) && (
              <span>No specific skills listed.</span>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Apply</h3>

          {!user && (
            <p>
              Please <Link to="/login">sign in</Link> to apply for this job.
            </p>
          )}

          {user && (
            <>
              {msg && <div className="success">{msg}</div>}
              {error && <div className="error">{error}</div>}

              <button
                type="button"
                className="btn-ghost"
                onClick={saveJob}
                disabled={saving}
                style={{
                  width: '100%',
                  marginBottom: 14,
                }}
              >
                {saving ? 'Saving…' : 'Save job'}
              </button>

              <form onSubmit={apply}>
                <div className="form-group">
                  <label>Cover letter (optional)</label>

                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Why are you a great fit?"
                    rows={6}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Sending…' : 'Apply now'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const chip = {
  background: '#f3f4f6',
  color: '#374151',
  padding: '5px 10px',
  borderRadius: 999,
  fontSize: 13,
};