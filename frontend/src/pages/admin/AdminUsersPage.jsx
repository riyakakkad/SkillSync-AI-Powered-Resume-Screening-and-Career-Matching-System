import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // User Profile Inspection Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [extraData, setExtraData] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axios.get(`${API_BASE_URL}/admin/users`, { params });
      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotalUsers(res.data.totalUsers || 0);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError('Failed to fetch user accounts.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Error fetching user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentAdmin?._id || user._id === currentAdmin?.id) {
      alert('Security Protection: You cannot deactivate your own administrator account.');
      return;
    }

    const actionText = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} the account for ${user.fullName} (${user.email})?`)) {
      return;
    }

    setActionLoadingId(user._id);
    setActionMessage(null);
    try {
      const res = await axios.patch(`${API_BASE_URL}/admin/users/${user._id}/status`);
      if (res.data.success) {
        setActionMessage(`Account for ${user.email} was successfully ${res.data.user?.isActive ? 'activated' : 'deactivated'}.`);
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: res.data.user?.isActive } : u))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUserDetails = async (userId) => {
    setDetailLoading(true);
    setSelectedUser(null);
    setExtraData(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users/${userId}`);
      if (res.data.success) {
        setSelectedUser(res.data.user);
        setExtraData(res.data.extraData || {});
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading user details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          User Accounts Management ({totalUsers})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Inspect user accounts, manage active statuses, and prevent unauthorized account access.
        </p>
      </div>

      {actionMessage && (
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
          ✅ {actionMessage}
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
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '0 1 160px'
          }}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Administrator</option>
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
            flex: '0 1 160px'
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="deactivated">Deactivated Only</option>
        </select>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by full name or email address..."
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

      {/* Users Table */}
      {loading ? (
        <Loader message="Loading user accounts from database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>User Identity</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Account Status</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registered</th>
                  <th style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin = u._id === currentAdmin?._id || u._id === currentAdmin?.id;
                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isCurrentAdmin ? 'rgba(236, 72, 153, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {u.fullName} {isCurrentAdmin && <span style={{ color: '#ec4899', fontSize: '0.75rem' }}>(You)</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
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
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: u.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: u.isActive ? '#34d399' : '#f87171',
                            fontWeight: 700
                          }}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openUserDetails(u._id)}
                            className="btn"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: '#fff',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              border: 'none'
                            }}
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrentAdmin || actionLoadingId === u._id}
                            className="btn"
                            style={{
                              background: u.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: u.isActive ? '#f87171' : '#34d399',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              border: 'none',
                              opacity: isCurrentAdmin ? 0.4 : 1,
                              cursor: isCurrentAdmin ? 'not-allowed' : 'pointer'
                            }}
                            title={isCurrentAdmin ? 'Cannot deactivate self' : u.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {actionLoadingId === u._id ? 'Updating...' : u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
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
        <EmptyState icon="👥" title="No Users Found" description="No registered user records match the selected filters." />
      )}

      {/* User Inspection Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedUser.fullName}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  {selectedUser.email} • Role:{' '}
                  <span style={{ textTransform: 'capitalize', color: '#f472b6', fontWeight: 700 }}>
                    {selectedUser.role}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <strong style={{ color: '#fff' }}>Account Status:</strong>{' '}
                <span style={{ color: selectedUser.isActive ? '#34d399' : '#f87171' }}>
                  {selectedUser.isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Registration Date:</strong>{' '}
                <span style={{ color: 'var(--text-muted)' }}>{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>

              {selectedUser.role === 'student' && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Student Profile Summary</div>
                  <div>College: {selectedUser.college || 'Not specified'}</div>
                  <div>Degree: {selectedUser.degree || 'Not specified'}</div>
                  <div>Applications Submitted: {extraData?.applicationCount || 0}</div>
                  <div>Resumes Uploaded: {extraData?.resumes?.length || 0}</div>
                </div>
              )}

              {selectedUser.role === 'recruiter' && (
                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Recruiter Activity Summary</div>
                  <div>Total Jobs Posted: {extraData?.jobCount || 0}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setSelectedUser(null)} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
