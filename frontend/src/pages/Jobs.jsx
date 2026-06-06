import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Jobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(true);

  async function loadJobs() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (industry) params.append('industry', industry);
      if (location) params.append('location', location);
      if (user) params.append('match', '1');

      const r = await api.get(`/jobs?${params.toString()}`);
      setJobs(r.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    if (!user) return;

    try {
      const r = await api.get('/ml/recommendations');
      setRecommendedJobs(r.data.jobs || []);
    } catch {
      setRecommendedJobs([]);
    }
  }

  async function loadFilters() {
    try {
      const [industryRes, locationRes] = await Promise.all([
        api.get('/jobs/industries'),
        api.get('/jobs/locations'),
      ]);

      setIndustries(industryRes.data || []);
      setLocations(locationRes.data || []);
    } catch {
      setIndustries([]);
      setLocations([]);
    }
  }

  useEffect(() => {
    loadFilters();
    loadRecommendations();
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [search, industry, location, user]);

  return (
    <div className="container jobs-page">
      <h1>Jobs</h1>

      {user && recommendedJobs.length > 0 && (
        <section style={{ marginBottom: 34 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Recommended For You</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
                Personalized using your skills and job interactions.
              </p>
            </div>

            <span
              style={{
                background: '#ede9fe',
                color: '#6d28d9',
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ML Recommendations
            </span>
          </div>

          <div className="job-grid">
            {recommendedJobs.slice(0, 4).map((job) => (
              <JobCard key={`rec-${job.id}`} job={job} recommended />
            ))}
          </div>

          <hr style={{ margin: '32px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />
        </section>
      )}

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>All Jobs</h2>
            <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
              Browse and filter available opportunities.
            </p>
          </div>
        </div>

        <div className="filters">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, or description..."
          />

          <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>

          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {(search || industry || location) && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSearch('');
                setIndustry('');
                setLocation('');
              }}
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="card">
            <p>No jobs found.</p>
          </div>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job, recommended = false }) {
  const matchValue = job.match_percent ?? job.matchPercent ?? job.mlScore;
  const matchClass =
    matchValue >= 70 ? 'match-high' :
    matchValue >= 40 ? 'match-mid' :
    'match-low';

  return (
    <div
      className="job-card"
      style={
        recommended
          ? { border: '1px solid #c4b5fd', boxShadow: '0 6px 18px rgba(99,102,241,0.12)' }
          : {}
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h3>{job.title}</h3>
          <div className="company">{job.company}</div>
        </div>

        {recommended && (
          <span
            style={{
              height: 'fit-content',
              background: '#ede9fe',
              color: '#6d28d9',
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            For You
          </span>
        )}
      </div>

      <div className="meta">
        {job.location && <span>{job.location}</span>}
        {job.industry && <span>{job.industry}</span>}
        {job.job_type && <span>{job.job_type}</span>}
      </div>

      {(job.salary_min || job.salary_max) && (
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          €{job.salary_min || '?'} – €{job.salary_max || '?'}
        </p>
      )}

      {typeof matchValue === 'number' && (
        <div style={{ marginBottom: 12 }}>
          <span className={`match-badge ${matchClass}`}>
            {Math.round(matchValue)}% match
          </span>
        </div>
      )}

      <div className="skills">
        {(job.skills || job.skill_names?.split(', ') || []).slice(0, 5).map((s) => (
          <span key={s.id || s.name || s} className="skill-pill">
            {s.name || s}
          </span>
        ))}
      </div>

      <div className="actions">
        <Link to={`/jobs/${job.id}`} className="btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
}