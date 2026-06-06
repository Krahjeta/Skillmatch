import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    industry: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
  });

  useEffect(() => {
    async function loadJob() {
      try {
        const { data } = await api.get(`/jobs/${id}`);

        setForm({
          title: data.title || '',
          company: data.company || '',
          description: data.description || '',
          location: data.location || '',
          industry: data.industry || '',
          job_type: data.job_type || '',
          salary_min: data.salary_min || '',
          salary_max: data.salary_max || '',
        });
      } catch (err) {
        setError('Job not found');
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [id]);

  function update(field) {
    return (e) =>
      setForm({
        ...form,
        [field]: e.target.value,
      });
  }

  async function save(e) {
    e.preventDefault();

    try {
      await api.put(`/jobs/${id}`, form);

      navigate(`/jobs/${id}`);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Could not update job'
      );
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Edit Job</h1>

      <div className="card">
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={save}>
          <div className="form-group">
            <label>Title</label>
            <input
              value={form.title}
              onChange={update('title')}
            />
          </div>

          <div className="form-group">
            <label>Company</label>
            <input
              value={form.company}
              onChange={update('company')}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={update('description')}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              value={form.location}
              onChange={update('location')}
            />
          </div>

          <div className="form-group">
            <label>Industry</label>
            <input
              value={form.industry}
              onChange={update('industry')}
            />
          </div>

          <div className="form-group">
            <label>Job Type</label>
            <input
              value={form.job_type}
              onChange={update('job_type')}
            />
          </div>

          <div className="form-group">
            <label>Salary Min</label>
            <input
              type="number"
              value={form.salary_min}
              onChange={update('salary_min')}
            />
          </div>

          <div className="form-group">
            <label>Salary Max</label>
            <input
              type="number"
              value={form.salary_max}
              onChange={update('salary_max')}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}