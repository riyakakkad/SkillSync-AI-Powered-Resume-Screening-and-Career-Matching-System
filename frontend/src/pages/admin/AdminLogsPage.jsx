import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 15
      };
      if (targetTypeFilter) params.targetType = targetTypeFilter;
      if (actionFilter) params.action = actionFilter;

      const res = await axios.get(`${API_BASE_URL}/admin/logs`, { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.totalLogs || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError('Failed to fetch activity logs.');
      }
    } catch (err) {
      console.error('Error fetching admin logs:', err);
      setError(err.response?.data?.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, targetTypeFilter, actionFilter]);

  const getActionBadgeColor = (action) => {
    if (action.includes('DEACTIVATE') || action.includes('DELETE')) {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' };
    }
    if (action.includes('ACTIVATE')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
    }
    return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          Administrative Audit Activity Trail ({totalLogs})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Immutable log of privileged administrative actions for compliance, governance, and security auditing.
        </p>
      </div>

      {/* Filter Bar */}
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
          value={targetTypeFilter}
          onChange={(e) => {
            setTargetTypeFilter(e.target.value);
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
          <option value="">All Resource Types</option>
          <option value="User">User Accounts</option>
          <option value="Job">Job Postings</option>
          <option value="Application">Applications</option>
          <option value="System">System</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '0 1 200px'
          }}
        >
          <option value="">All Actions</option>
          <option value="USER_DEACTIVATE">USER_DEACTIVATE</option>
          <option value="USER_ACTIVATE">USER_ACTIVATE</option>
          <option value="JOB_TOGGLE_STATUS">JOB_TOGGLE_STATUS</option>
          <option value="JOB_DELETE">JOB_DELETE</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {logs.length} of {totalLogs} events
        </span>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <Loader message="Loading audit activity trail..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Administrator</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badgeStyle = getActionBadgeColor(log.action);
                  return (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{log.adminEmail}</div>
                        {log.ipAddress && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>IP: {log.ipAddress}</div>
                        )}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            fontWeight: 700
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
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
        <EmptyState icon="🛡️" title="No Audit Records" description="No administrative action logs recorded matching the criteria." />
      )}
    </div>
  );
}
