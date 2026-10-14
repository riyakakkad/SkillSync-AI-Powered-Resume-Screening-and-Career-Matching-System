import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/applications`);
      if (response.data.success) {
        setApplications(response.data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load job applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hired':
      case 'Selected':
      case 'Shortlisted':
        return <span className="badge badge-success">✓ {status}</span>;
      case 'Interview':
      case 'Interview Scheduled':
        return <span className="badge badge-pending">📅 {status}</span>;
      case 'Under Review':
        return <span className="badge badge-pending">🔍 {status}</span>;
      case 'Rejected':
        return <span className="badge badge-error">✕ {status}</span>;
      default:
        return <span className="badge badge-pending">📄 Applied</span>;
    }
  };

  if (loading) {
    return <Loader message="Fetching your submitted job applications..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchApplications} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          Applied Jobs ({applications.length})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Track the status and timeline of all job applications submitted through SkillSync.
        </p>
      </div>

      {applications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map((app) => (
            <div
              key={app._id}
              className="card"
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.25rem 1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontSize: '1.5rem'
                  }}
                >
                  {app.job?.companyLogo || '💼'}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                    {app.job?.title || 'Job Position'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {app.job?.company} • {app.job?.location} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {getStatusBadge(app.status)}

                <button
                  onClick={() => setSelectedApp(selectedApp?._id === app._id ? null : app)}
                  className="btn"
                  style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                >
                  {selectedApp?._id === app._id ? 'Hide Timeline ▲' : 'View Timeline ▼'}
                </button>
              </div>

              {/* Application Timeline Details */}
              {selectedApp?._id === app._id && (
                <div
                  style={{
                    width: '100%',
                    paddingTop: '1rem',
                    marginTop: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}
                >
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
                    Application Lifecycle Timeline
                  </h4>

                  {app.timeline && app.timeline.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {app.timeline.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                          <span style={{ fontWeight: 600, color: '#fff' }}>{item.status}:</span>
                          <span style={{ color: 'var(--text-muted)' }}>{item.notes}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {new Date(item.date).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Application submitted. Awaiting review from recruiter.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="💼"
          title="No Submitted Applications"
          description="Explore available jobs under Job Matching and apply to start tracking your applications."
        />
      )}
    </div>
  );
}
