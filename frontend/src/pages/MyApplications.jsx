import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function MyApplications() {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const url = user?.role === 'admin'
        ? '/applications/all'
        : '/applications/me';

      const r = await api.get(url);
      setApplications(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [user]);

  async function updateStatus(applicationId, status) {
    setMsg('');
    setError('');

    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setMsg(`Application marked as ${status}.`);
      await loadApplications();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update application');
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Loading applications...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container">
      <h1>{isAdmin ? 'All Applications' : 'My Applications'}</h1>

      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      {applications.length === 0 && (
        <div className="card">
          <p>
            {isAdmin
              ? 'No applications have been submitted yet.'
              : 'You have not applied to any jobs yet.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {applications.map((app) => (
          <div key={app.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                  {isAdmin ? app.job_title : app.title}
                </h3>

                <p style={{ margin: 0, color: '#6b7280' }}>
                  {app.company}
                  {app.location ? ` · ${app.location}` : ''}
                </p>

                {isAdmin && (
                  <p style={{ margin: '8px 0 0', color: '#374151' }}>
                    <strong>Applicant:</strong> {app.applicant_name} ({app.applicant_email})
                  </p>
                )}
              </div>

              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 13,
                  background:
                    app.status === 'accepted'
                      ? '#dcfce7'
                      : app.status === 'rejected'
                      ? '#fee2e2'
                      : app.status === 'reviewed'
                      ? '#dbeafe'
                      : '#fef3c7',
                  color:
                    app.status === 'accepted'
                      ? '#166534'
                      : app.status === 'rejected'
                      ? '#991b1b'
                      : app.status === 'reviewed'
                      ? '#1d4ed8'
                      : '#92400e',
                }}
              >
                {app.status}
              </span>
            </div>

            {app.cover_letter && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  background: '#f8fafc',
                  borderRadius: 10,
                }}
              >
                <strong>Cover letter:</strong>
                <p style={{ marginBottom: 0, whiteSpace: 'pre-line' }}>
                  {app.cover_letter}
                </p>
              </div>
            )}

            <div
              style={{
                marginTop: 14,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <Link to={`/jobs/${app.job_id}`} className="btn-ghost">
                View Job
              </Link>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => updateStatus(app.id, 'reviewed')}
                  >
                    Mark Reviewed
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => updateStatus(app.id, 'accepted')}
                  >
                    Accept
                  </button>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => updateStatus(app.id, 'rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}