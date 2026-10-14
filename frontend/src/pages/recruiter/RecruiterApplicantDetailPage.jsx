import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ALLOWED_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Hired',
  'Rejected'
];

export default function RecruiterApplicantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status form state
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/recruiter/applications/${id}`);
      if (res.data.success && res.data.application) {
        const app = res.data.application;
        setApplication(app);
        setStatus(app.status || 'Applied');
        setNotes(app.notes || '');
        setInterviewDate(app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : '');
      } else {
        setError('Application details not found.');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      setError(err.response?.data?.message || 'Failed to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await axios.patch(`${API_BASE_URL}/recruiter/applications/${id}/status`, {
        status,
        notes,
        interviewDate: interviewDate || null
      });

      if (res.data.success) {
        setSuccessMsg(`Status successfully updated to "${status}". Candidate notified.`);
        // Reload details to update timeline
        fetchApplicationDetails();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setErrorMsg(err.response?.data?.message || 'Error updating application status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Analyzing candidate profile and computing match breakdown..." />;
  }

  if (error || !application) {
    return <ErrorState message={error || 'Application not found'} onRetry={fetchApplicationDetails} />;
  }

  const { candidate = {}, job = {}, match = {}, timeline = [] } = application;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/recruiter/applications')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cyan-accent)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          ← Back to All Applications
        </button>
      </div>

      {/* Top Banner: Candidate Overview */}
      <div
        className="card"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderColor: 'rgba(6, 182, 212, 0.3)'
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0
            }}
          >
            {candidate.fullName?.charAt(0).toUpperCase() || 'C'}
          </div>

          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {candidate.fullName}
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              ✉️ {candidate.email} • Domain: <strong style={{ color: '#38bdf8' }}>{candidate.detectedDomain}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Target Role: <strong style={{ color: '#fff' }}>{job.title}</strong> at {job.company} ({job.location})
            </div>
          </div>
        </div>

        {/* Current status pill */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Current Stage
          </div>
          <span
            className={
              application.status === 'Hired'
                ? 'badge badge-success'
                : application.status === 'Rejected'
                ? 'badge badge-error'
                : 'badge badge-info'
            }
            style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}
          >
            {application.status}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Applied {new Date(application.appliedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Grid: Left Column (AI Candidate Match) & Right Column (Status Manager & Timeline) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.75rem' }} className="candidate-grid">
        {/* Left Column: AI Match Breakdown & Resume Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Match Score Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                AI Candidate Match Analysis 🎯
              </h3>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: match.matchScore >= 80 ? '#34d399' : match.matchScore >= 60 ? '#38bdf8' : '#fbbf24'
                }}
              >
                {match.matchScore}% Match
              </span>
            </div>

            {/* Score progress bar */}
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div
                style={{
                  width: `${match.matchScore}%`,
                  height: '100%',
                  background:
                    match.matchScore >= 80
                      ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                      : match.matchScore >= 60
                      ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>

            {/* Explanation */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                fontSize: '0.85rem',
                color: '#cbd5e1',
                lineHeight: 1.5,
                marginBottom: '1.25rem'
              }}
            >
              💡 <strong style={{ color: '#38bdf8' }}>Match Assessment:</strong> {match.explanation}
            </div>

            {/* Matched Skills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ✓ Matched Skills ({match.matchedSkills?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {match.matchedSkills && match.matchedSkills.length > 0 ? (
                  match.matchedSkills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No direct skill overlaps</span>
                )}
              </div>
            </div>

            {/* Missing Required Skills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ✕ Missing Required Skills ({match.missingSkills?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {match.missingSkills && match.missingSkills.length > 0 ? (
                  match.missingSkills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
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
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>All requirements satisfied!</span>
                )}
              </div>
            </div>

            {/* Domain & Skill Match Rate stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Domain Alignment</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{match.domainAlignment}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Skill Match Rate</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{match.skillMatchRate}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Resume ATS Score</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a5b4fc' }}>{candidate.atsScore || 0}/100</div>
              </div>
            </div>
          </div>

          {/* Full Extracted Resume Skills */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
              Extracted Resume Skills ({candidate.skills?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1'
                    }}
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skills extracted.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status Transition Panel & Application Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Update Form */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Update Candidate Stage ⚙️
            </h3>

            {errorMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Application Stage
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  {ALLOWED_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {status === 'Interview' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--cyan-accent)', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#fff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Recruiter Feedback Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record screening remarks or candidate feedback..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.65rem', fontWeight: 700 }}
              >
                {submitting ? 'Updating...' : 'Save Stage & Notify Candidate'}
              </button>
            </form>
          </div>

          {/* Application Timeline Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
              Application Timeline 🕒
            </h3>

            {timeline && timeline.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map((event, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      paddingLeft: '0.5rem',
                      borderLeft: '2px solid rgba(6, 182, 212, 0.4)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ color: '#fff', fontSize: '0.875rem' }}>{event.status}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.notes && (
                        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem', margin: 0 }}>
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Applied on {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .candidate-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
