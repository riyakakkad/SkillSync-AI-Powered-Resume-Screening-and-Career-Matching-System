import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STATUS_OPTIONS = ['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];

export default function RecruiterApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialJobId = searchParams.get('jobId') || '';

  const [applications, setApplications] = useState([]);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Quick review modal state
  const [activeModalApp, setActiveModalApp] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalInterviewDate, setModalInterviewDate] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch recruiter's jobs for filter dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/recruiter/jobs`);
        if (res.data.success) {
          setRecruiterJobs(res.data.jobs || []);
        }
      } catch (err) {
        console.error('Failed to fetch jobs for filter:', err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedJobId) params.jobId = selectedJobId;
      if (selectedStatus && selectedStatus !== 'All') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_BASE_URL}/recruiter/applications`, { params });
      if (res.data.success) {
        setApplications(res.data.applications || []);
      } else {
        setError('Failed to fetch candidate applications.');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.response?.data?.message || 'Error fetching candidate applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedJobId, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  // Quick inline status update
  const handleQuickStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      const res = await axios.patch(`${API_BASE_URL}/recruiter/applications/${appId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setApplications((prev) =>
          prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open modal for detailed review and status update
  const openReviewModal = (app) => {
    setActiveModalApp(app);
    setModalStatus(app.status || 'Applied');
    setModalNotes(app.notes || '');
    setModalInterviewDate(app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '');
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalApp) return;

    setModalSubmitting(true);
    try {
      const payload = {
        status: modalStatus,
        notes: modalNotes,
        interviewDate: modalInterviewDate || null
      };

      const res = await axios.patch(`${API_BASE_URL}/recruiter/applications/${activeModalApp._id}/status`, payload);
      if (res.data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === activeModalApp._id
              ? {
                  ...app,
                  status: modalStatus,
                  notes: modalNotes,
                  interviewDate: modalInterviewDate
                }
              : app
          )
        );
        setActiveModalApp(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const getMatchScoreBadge = (score = 0) => {
    if (score >= 80) {
      return (
        <span
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontWeight: 800,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>🎯</span> {score}% Match (Strong Fit)
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span
          style={{
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            color: '#38bdf8',
            fontWeight: 800,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>✨</span> {score}% Match (Good Fit)
        </span>
      );
    }
    return (
      <span
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          fontWeight: 800,
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <span>⚠️</span> {score}% Match (Partial Fit)
      </span>
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Hired':
      case 'Selected':
        return 'badge-success';
      case 'Shortlisted':
      case 'Interview':
      case 'Interview Scheduled':
        return 'badge-info';
      case 'Rejected':
        return 'badge-error';
      default:
        return 'badge-pending';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          Candidate Applications ({applications.length})
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Review candidate resumes with AI skill matching, manage candidate stages, and advance qualified talent.
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
        {/* Job selector */}
        <select
          value={selectedJobId}
          onChange={(e) => {
            setSelectedJobId(e.target.value);
            setSearchParams(e.target.value ? { jobId: e.target.value } : {});
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
          <option value="">All Job Postings ({recruiterJobs.length})</option>
          {recruiterJobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title} ({j.company})
            </option>
          ))}
        </select>

        {/* Status selector */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.875rem',
            flex: '0 1 170px'
          }}
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st === 'All' ? 'All Statuses' : st}
            </option>
          ))}
        </select>

        {/* Search by text */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search candidate, role, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {loading ? (
        <Loader message="Evaluating candidate matching and loading applications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchApplications} />
      ) : applications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {applications.map((app) => {
            const match = app.match || {};
            const candidate = app.candidate || {};
            const job = app.job || {};

            return (
              <div
                key={app._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)'
                }}
              >
                {/* Header row: Candidate name, Job, Match Score, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {candidate.fullName}
                      </h3>
                      {getMatchScoreBadge(match.matchScore)}
                      {candidate.atsScore > 0 && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#a5b4fc',
                            fontWeight: 600
                          }}
                        >
                          ATS Score: {candidate.atsScore}/100
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Applied for <strong style={{ color: '#fff' }}>{job.title}</strong> at {job.company} •{' '}
                      <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                    <select
                      value={app.status}
                      disabled={updatingId === app._id}
                      onChange={(e) => handleQuickStatusChange(app._id, e.target.value)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        fontSize: '0.825rem',
                        fontWeight: 600
                      }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview">Interview</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => openReviewModal(app)}
                      className="btn"
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.35)',
                        color: '#38bdf8',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.825rem',
                        fontWeight: 600
                      }}
                    >
                      Candidate Details & Match 🔍
                    </button>
                  </div>
                </div>

                {/* Candidate Matching Details: Matched & Missing Skills */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  {/* Score explanation */}
                  {match.explanation && (
                    <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
                      💡 <strong style={{ color: '#38bdf8' }}>AI Evaluation:</strong> {match.explanation}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.25rem' }}>
                    {/* Matched Skills */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        ✓ Matched Skills ({match.matchedSkills?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {match.matchedSkills && match.matchedSkills.length > 0 ? (
                          match.matchedSkills.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#34d399',
                                fontWeight: 600
                              }}
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        ✕ Missing Required Skills ({match.missingSkills?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {match.missingSkills && match.missingSkills.length > 0 ? (
                          match.missingSkills.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#fca5a5',
                                fontWeight: 500
                              }}
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>All requirements satisfied!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer notes or interview scheduled info */}
                {(app.notes || app.interviewDate) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {app.interviewDate && (
                      <span>
                        📅 <strong style={{ color: '#fff' }}>Interview:</strong>{' '}
                        {new Date(app.interviewDate).toLocaleDateString()}
                      </span>
                    )}
                    {app.notes && (
                      <span>
                        📝 <strong style={{ color: '#fff' }}>Notes:</strong> {app.notes}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="👥"
          title="No Applications Found"
          description={
            selectedJobId
              ? 'No candidates have applied for this specific job posting yet.'
              : 'You do not have any candidate applications matching the selected criteria.'
          }
        />
      )}

      {/* Review Modal */}
      {activeModalApp && (
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
              maxWidth: '680px',
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
                  Candidate Review: {activeModalApp.candidate?.fullName}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Position: <strong style={{ color: '#fff' }}>{activeModalApp.job?.title}</strong> ({activeModalApp.job?.company})
                </p>
              </div>

              <button
                onClick={() => setActiveModalApp(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Candidate Snapshot */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email:</span>{' '}
                  <span style={{ color: '#fff', fontWeight: 600 }}>{activeModalApp.candidate?.email || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Candidate Domain:</span>{' '}
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{activeModalApp.candidate?.detectedDomain || 'General'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ATS Score:</span>{' '}
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{activeModalApp.candidate?.atsScore || 0}/100</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Match Rating:</span>{' '}
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{activeModalApp.match?.matchScore || 0}% Fit</span>
                </div>
              </div>

              {/* All Extracted Skills */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Extracted Candidate Resume Skills:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {activeModalApp.candidate?.skills?.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#cbd5e1'
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Update Application Pipeline Status
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Stage Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {modalStatus === 'Interview' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--cyan-accent)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Interview Date & Time
                  </label>
                  <input
                    type="date"
                    value={modalInterviewDate}
                    onChange={(e) => setModalInterviewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Recruiter Feedback / Internal Notes
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Impressive domain experience, proceed to technical panel."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalApp(null)}
                  className="btn"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
                >
                  {modalSubmitting ? 'Updating...' : 'Save & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
