import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ALL_DOMAINS = [
  'All Domains',
  'IT and Software Development',
  'Data Science and Data Analytics',
  'Healthcare',
  'Finance and Accounting',
  'Marketing',
  'Human Resources',
  'Education',
  'Mechanical, Civil, and Electrical Engineering',
  'Business and Management'
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [statusFilter, setStatusFilter] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (domainFilter && domainFilter !== 'All Domains') params.domain = domainFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axios.get(`${API_BASE_URL}/admin/jobs`, { params });
      if (res.data.success) {
        setJobs(res.data.jobs || []);
        setTotalJobs(res.data.totalJobs || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError('Failed to fetch platform jobs.');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Error fetching platform jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, domainFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  const handleToggleStatus = async (job) => {
    setActionLoadingId(job._id);
    setFeedbackMsg(null);
    try {
      const res = await axios.patch(`${API_BASE_URL}/admin/jobs/${job._id}/status`);
      if (res.data.success) {
        setFeedbackMsg(`Job "${job.title}" is now ${res.data.job?.isActive ? 'Active' : 'Closed'}.`);
        setJobs((prev) =>
          prev.map((j) => (j._id === job._id ? { ...j, isActive: res.data.job?.isActive } : j))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating job status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to permanently delete the job posting "${job.title}" by "${job.company}"? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(job._id);
    setFeedbackMsg(null);
    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/jobs/${job._id}`);
      if (res.data.success) {
        setFeedbackMsg(`Job "${job.title}" was permanently removed.`);
        fetchJobs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting job posting');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          Platform Job Moderation ({totalJobs})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Supervise job vacancies across all organizations, toggle listings, and delete inappropriate content.
        </p>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.875rem'
          }}
        >
          ✅ {feedbackMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <select
          value={domainFilter}
          onChange={(e) => {
            setDomainFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '1 1 200px'
          }}
        >
          {ALL_DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '0 1 150px'
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="closed">Closed Only</option>
        </select>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by job title, company, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              fontSize: '0.875rem'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            Search
          </button>
        </form>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <Loader message="Loading platform job postings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchJobs} />
      ) : jobs.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role & Company</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Domain</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recruiter Contact</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Applicants</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{job.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {job.company} • {job.location}
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: '#a5b4fc',
                          fontWeight: 600
                        }}
                      >
                        {job.domain || 'General'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', fontSize: '0.8rem' }}>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{job.postedBy?.fullName || 'System Seeded'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>{job.postedBy?.email || 'N/A'}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--cyan-accent)', fontWeight: 700 }}>
                        👥 {job.applicantCount || 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: job.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: job.isActive ? '#34d399' : '#f87171',
                          fontWeight: 700
                        }}
                      >
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleToggleStatus(job)}
                          disabled={actionLoadingId === job._id}
                          className="btn"
                          style={{
                            background: job.isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: job.isActive ? '#fbbf24' : '#34d399',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            border: 'none'
                          }}
                          title={job.isActive ? 'Deactivate posting' : 'Activate posting'}
                        >
                          {job.isActive ? 'Close' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteJob(job)}
                          disabled={actionLoadingId === job._id}
                          className="btn"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            border: 'none'
                          }}
                          title="Delete inappropriate posting"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="btn"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="btn"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon="💼" title="No Jobs Found" description="No platform job records match the selected filters." />
      )}
    </div>
  );
}
