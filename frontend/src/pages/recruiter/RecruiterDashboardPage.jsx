import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/recruiter/dashboard`);
      if (response.data.success) {
        setData(response.data);
      } else {
        setError('Failed to load recruiter analytics.');
      }
    } catch (err) {
      console.error('Error fetching recruiter dashboard:', err);
      setError(err.response?.data?.message || 'Error fetching dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Fetching recruiter metrics, candidate applications, and active postings..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const stats = data?.stats || {
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    statusBreakdown: { applied: 0, underReview: 0, shortlisted: 0, interview: 0, rejected: 0, hired: 0 }
  };

  const statusBreakdown = stats.statusBreakdown || {};
  const recentJobs = data?.recentJobs || [];
  const recentApplications = data?.recentApplications || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.15) 100%)',
          borderColor: 'rgba(6, 182, 212, 0.35)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>
            Phase 6 Recruiter Portal
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Recruiter Command Center 🎯
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '650px' }}>
            Manage your organization's job requirements, screen applicants with AI match analytics, and track hiring stages in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/recruiter/jobs/new')} className="btn btn-primary">
            ➕ Post New Role
          </button>
          <button
            onClick={() => navigate('/recruiter/applications')}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
          >
            👥 View Applicants
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px' }}>
            💼
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Jobs Posted</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.totalJobs}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)' }}>{stats.activeJobs} actively accepting</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px' }}>
            📄
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Applicants</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.totalApplications}</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Across all open roles</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px' }}>
            ⭐
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Shortlisted</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{statusBreakdown.shortlisted || 0}</div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Qualified for interview</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px' }}>
            🤝
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hired / Offers</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{statusBreakdown.hired || 0}</div>
            <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>Successful hires</div>
          </div>
        </div>
      </div>

      {/* Application Status Pipeline Breakdown */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
          Candidate Recruitment Pipeline
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Applied</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{statusBreakdown.applied || 0}</div>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)', textTransform: 'uppercase' }}>Under Review</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>{statusBreakdown.underReview || 0}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase' }}>Shortlisted</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>{statusBreakdown.shortlisted || 0}</div>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase' }}>Interviewing</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>{statusBreakdown.interview || 0}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase' }}>Hired</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{statusBreakdown.hired || 0}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase' }}>Rejected</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>{statusBreakdown.rejected || 0}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Postings & Recent Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="recruiter-grid">
        {/* Left Column: Recent Job Postings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Your Job Postings ({stats.totalJobs})
            </h3>
            <button
              onClick={() => navigate('/recruiter/jobs')}
              style={{ background: 'none', border: 'none', color: 'var(--cyan-accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Manage All Jobs →
            </button>
          </div>

          {recentJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentJobs.map((job) => (
                <div
                  key={job._id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{job.title}</span>
                      <span
                        className={job.isActive ? 'badge badge-success' : 'badge badge-pending'}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                      >
                        {job.isActive ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {job.company} • {job.location} • {job.domain || 'General'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--cyan-accent)', fontWeight: 600 }}>
                      👥 {job.applicantCount || 0} Applicants
                    </span>
                    <button
                      onClick={() => navigate(`/recruiter/applications?jobId=${job._id}`)}
                      className="btn"
                      style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You have not posted any job roles yet.
              </p>
              <button onClick={() => navigate('/recruiter/jobs/new')} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                ➕ Create First Job
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Applications Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Recent Candidate Inflow
            </h3>
            <button
              onClick={() => navigate('/recruiter/applications')}
              style={{ background: 'none', border: 'none', color: 'var(--cyan-accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              All Applicants →
            </button>
          </div>

          {recentApplications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentApplications.map((app) => (
                <div
                  key={app._id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{app.studentName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Applied for: <span style={{ color: '#cbd5e1' }}>{app.jobTitle}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <span
                    className={
                      app.status === 'Hired' || app.status === 'Shortlisted'
                        ? 'badge badge-success'
                        : app.status === 'Rejected'
                        ? 'badge badge-error'
                        : 'badge badge-pending'
                    }
                    style={{ fontSize: '0.72rem' }}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No applications submitted to your postings yet.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .recruiter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
