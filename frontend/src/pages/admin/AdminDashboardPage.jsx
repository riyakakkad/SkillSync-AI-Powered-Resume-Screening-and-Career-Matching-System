import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/dashboard`);
      if (res.data.success) {
        setData(res.data);
      } else {
        setError('Failed to load system metrics.');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.response?.data?.message || 'Error fetching system metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Aggregating platform statistics and database records..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const stats = data?.stats || {
    users: { total: 0, students: 0, recruiters: 0, admins: 0, active: 0, deactivated: 0 },
    jobs: { total: 0, active: 0, closed: 0 },
    applications: { total: 0, statusBreakdown: {} },
    resumes: { total: 0, averageAtsScore: 0 }
  };

  const statusBreakdown = stats.applications?.statusBreakdown || {};
  const recentUsers = data?.recentUsers || [];
  const recentJobs = data?.recentJobs || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.16) 0%, rgba(139, 92, 246, 0.12) 100%)',
          borderColor: 'rgba(236, 72, 153, 0.35)',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: 'rgba(236, 72, 153, 0.2)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              color: '#f472b6',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}
          >
            Phase 7 System Administration
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            System Overview & Metrics Control 🛡️
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '680px' }}>
            Monitor real-time user registrations, platform job postings, candidate applications, and administrative audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin/users')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
            👥 Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/jobs')}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
          >
            💼 Moderate Jobs
          </button>
        </div>
      </div>

      {/* 4 Main Platform KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px' }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered Users</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.users.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#f472b6' }}>
              {stats.users.students} Students • {stats.users.recruiters} Recruiters
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px' }}>
            💼
          </div>
          <div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Platform Jobs</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.jobs.total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)' }}>
              {stats.jobs.active} active • {stats.jobs.closed} closed
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px' }}>
            📄
          </div>
          <div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Applications</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.applications.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
              {statusBreakdown.hired || 0} Hired • {statusBreakdown.interview || 0} Interviewing
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px' }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resumes & Avg ATS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{stats.resumes.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>
              Avg ATS: {stats.resumes.averageAtsScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment Pipeline Breakdown */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Platform Recruitment Pipeline Distribution
          </h3>
          <button
            onClick={() => navigate('/admin/applications')}
            style={{ background: 'none', border: 'none', color: '#f472b6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Monitor Applications →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
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
            <span style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase' }}>Interview</span>
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

      {/* Main Grid: Recent Registrations & Moderation Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="admin-grid">
        {/* Left Column: Recent Users */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Recent Registrations
            </h3>
            <button
              onClick={() => navigate('/admin/users')}
              style={{ background: 'none', border: 'none', color: '#f472b6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              All Users ({stats.users.total}) →
            </button>
          </div>

          {recentUsers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentUsers.map((u) => (
                <div
                  key={u._id}
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{u.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          u.role === 'admin'
                            ? 'rgba(236, 72, 153, 0.15)'
                            : u.role === 'recruiter'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(99, 102, 241, 0.15)',
                        color:
                          u.role === 'admin'
                            ? '#f472b6'
                            : u.role === 'recruiter'
                            ? '#38bdf8'
                            : '#a5b4fc',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {u.role}
                    </span>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: u.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: u.isActive ? '#34d399' : '#f87171',
                        fontWeight: 600
                      }}
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users recorded yet.</p>
          )}
        </div>

        {/* Right Column: Recent Admin Audit Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Recent Administrative Actions
            </h3>
            <button
              onClick={() => navigate('/admin/logs')}
              style={{ background: 'none', border: 'none', color: '#f472b6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Full Audit Trail →
            </button>
          </div>

          {recentLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(236, 72, 153, 0.15)',
                        color: '#f472b6',
                        fontWeight: 700
                      }}
                    >
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    {log.details || `Modified ${log.targetType} (${log.targetId})`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No administrative interventions recorded yet.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
