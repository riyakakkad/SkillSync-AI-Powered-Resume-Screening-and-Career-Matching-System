import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function RecruiterJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/recruiter/jobs`);
      if (response.data.success) {
        setJobs(response.data.jobs || []);
      } else {
        setError('Failed to retrieve your job postings.');
      }
    } catch (err) {
      console.error('Error fetching recruiter jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (jobId) => {
    try {
      await axios.patch(`${API_BASE_URL}/recruiter/jobs/${jobId}/status`);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating job status');
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete the job posting "${jobTitle}"?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/recruiter/jobs/${jobId}`);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting job posting');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.requiredSkills && job.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesDomain = domainFilter === 'All Domains' || job.domain === domainFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && job.isActive) ||
      (statusFilter === 'Closed' && !job.isActive);

    return matchesSearch && matchesDomain && matchesStatus;
  });

  if (loading) {
    return <Loader message="Fetching your organization's job requirements..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchJobs} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            My Job Postings ({jobs.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage active vacancies, customize requirements, and review candidate applications.
          </p>
        </div>

        <button onClick={() => navigate('/recruiter/jobs/new')} className="btn btn-primary">
          ➕ Post New Vacancy
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Search by role title, skill, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '1 1 220px'
          }}
        />

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '1 1 180px'
          }}
        >
          {ALL_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem'
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Closed">Closed Only</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filteredJobs.length} of {jobs.length} postings
        </span>
      </div>

      {/* Jobs Listing Grid */}
      {filteredJobs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: job.isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: job.isActive ? 'var(--card-bg)' : 'rgba(15, 23, 42, 0.5)'
              }}
            >
              <div>
                {/* Top Header: Title, Active Badge, and Domain */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                      {job.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {job.company} • {job.location}
                    </p>
                  </div>

                  <span
                    className={job.isActive ? 'badge badge-success' : 'badge badge-pending'}
                    style={{ fontSize: '0.72rem', flexShrink: 0 }}
                  >
                    {job.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                {/* Domain & Level Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: '#a5b4fc',
                      fontWeight: 600
                    }}
                  >
                    🌐 {job.domain || 'General'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {job.experienceLevel || 'Entry-level'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {job.jobType || 'Full-time'}
                  </span>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    marginTop: '0.75rem',
                    lineClamp: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {job.description}
                </p>

                {/* Required Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                  {job.requiredSkills && job.requiredSkills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '5px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills && job.requiredSkills.length > 4 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{job.requiredSkills.length - 4} more
                    </span>
                  )}
                </div>

                {/* Applicant Metric Tag */}
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(6, 182, 212, 0.08)',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.825rem'
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    👥 {job.applicantCount || 0} Total Applicants
                  </span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    ⭐ {job.shortlistedCount || 0} Shortlisted
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div
                style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigate(`/recruiter/applications?jobId=${job._id}`)}
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    View Applicants ({job.applicantCount || 0})
                  </button>

                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Edit
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleStatus(job._id)}
                    className="btn"
                    style={{
                      background: job.isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: job.isActive ? '#fbbf24' : '#34d399',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      border: 'none'
                    }}
                    title={job.isActive ? 'Deactivate job' : 'Activate job'}
                  >
                    {job.isActive ? 'Close' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job._id, job.title)}
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#f87171',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      border: 'none'
                    }}
                    title="Delete job"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="💼"
          title="No Jobs Found"
          description="Create your first job posting to start receiving AI-screened candidate applications."
        />
      )}
    </div>
  );
}
