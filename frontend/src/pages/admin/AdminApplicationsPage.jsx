import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STATUS_OPTIONS = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 12
      };
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axios.get(`${API_BASE_URL}/admin/applications`, { params });
      if (res.data.success) {
        setApplications(res.data.applications || []);
        setTotalApplications(res.data.totalApplications || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError('Failed to fetch platform applications.');
      }
    } catch (err) {
      console.error('Error fetching applications for admin:', err);
      setError(err.response?.data?.message || 'Error monitoring platform applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hired':
      case 'Selected':
        return 'badge badge-success';
      case 'Shortlisted':
      case 'Interview':
      case 'Interview Scheduled':
        return 'badge badge-info';
      case 'Rejected':
        return 'badge badge-error';
      default:
        return 'badge badge-pending';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          Application Monitoring Oversight ({totalApplications})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Cross-platform candidate application monitoring. Read-only oversight respecting recruiter hiring autonomy.
        </p>
      </div>

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
            flex: '0 1 180px'
          }}
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st === 'All' ? 'All Application Statuses' : st}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search candidate name, email, or role..."
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
            Filter
          </button>
        </form>
      </div>

      {/* Applications Table */}
      {loading ? (
        <Loader message="Fetching platform applications stream..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchApplications} />
      ) : applications.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Candidate</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role & Company</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Domain</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>ATS Score</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Current Stage</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{app.student?.fullName || 'Candidate'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.student?.email || 'N/A'}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{app.job?.title || 'Job Unavailable'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.job?.company || ''}</div>
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
                        {app.job?.domain || app.resume?.detectedDomain || 'General'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      {app.resume?.atsScore ? (
                        <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
                          {app.resume.atsScore}/100
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span className={getStatusBadge(app.status)} style={{ fontSize: '0.75rem' }}>
                        {app.status}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(app.appliedAt).toLocaleDateString()}
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
        <EmptyState icon="📄" title="No Applications Found" description="No platform applications match the selected criteria." />
      )}
    </div>
  );
}
