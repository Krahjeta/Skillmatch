import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interactions/saved')
      .then((r) => setJobs(r.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p>Loading saved jobs...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Saved Jobs</h1>

      {jobs.length === 0 && (
        <div className="card">
          <p>You have not saved any jobs yet.</p>
        </div>
      )}

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="card">
            <h3>{job.title}</h3>
            <p style={{ color: '#6b7280' }}>{job.company}</p>

            <p>
              {job.location && <span>{job.location}</span>}
              {job.industry && <span> · {job.industry}</span>}
            </p>

            <Link to={`/jobs/${job.id}`} className="btn-primary">
              View Job
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}