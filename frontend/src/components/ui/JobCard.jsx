import React, { useState } from 'react';

export default function JobCard({
  job,
  onSave,
  onUnsave,
  onApply,
  isSaved = false,
  isApplied = false
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  const matchScore = typeof job.matchScore === 'number' ? job.matchScore : null;

  // Determine badge styling based on score
  let badgeStyle = {
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#818cf8'
  };

  if (matchScore !== null) {
    if (matchScore >= 75) {
      badgeStyle = {
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        color: '#34d399'
      };
    } else if (matchScore >= 50) {
      badgeStyle = {
        background: 'rgba(6, 182, 212, 0.15)',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        color: '#22d3ee'
      };
    } else {
      badgeStyle = {
        background: 'rgba(148, 163, 184, 0.1)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        color: '#94a3b8'
      };
    }
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.9rem',
        position: 'relative'
      }}
    >
      <div>
        {/* Top Header: Company, Title, Badges, and Save Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.45rem',
                flexShrink: 0
              }}
            >
              {job.companyLogo || '🏢'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {job.title}
                </h3>
                {matchScore !== null && (
                  <span
                    style={{
                      ...badgeStyle,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    ⚡ {matchScore}% Match
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {job.company} • {job.location}
              </p>
            </div>
          </div>

          <button
            onClick={() => (isSaved ? onUnsave && onUnsave(job._id) : onSave && onSave(job._id))}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: isSaved ? '#f43f5e' : 'var(--text-muted)',
              transition: 'transform 0.15s ease'
            }}
            title={isSaved ? 'Remove from saved' : 'Save job'}
          >
            {isSaved ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Domain Badge */}
        {job.domain && (
          <div style={{ marginTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600
              }}
            >
              🌐 {job.domain}
            </span>
          </div>
        )}

        {/* Description */}
        <p
          style={{
            fontSize: '0.875rem',
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

        {/* Matched vs Missing Skills breakdown if available */}
        {job.matchedSkills || job.missingSkills ? (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {/* Matched Skills */}
            {job.matchedSkills && job.matchedSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>Matched:</span>
                {job.matchedSkills.slice(0, 4).map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '5px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      fontWeight: 600
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Missing Skills */}
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>Gap:</span>
                {job.missingSkills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '5px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: '#fbbf24'
                    }}
                  >
                    ! {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Fallback skill tags when match breakdown not active */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
            {job.requiredSkills && job.requiredSkills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Explainability toggle */}
        {job.explanation && (
          <div style={{ marginTop: '0.65rem' }}>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cyan-accent)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              {showExplanation ? 'Hide match details' : 'Why this match score?'}
            </button>
            {showExplanation && (
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.775rem',
                  color: '#e2e8f0',
                  lineHeight: '1.35'
                }}
              >
                {job.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Salary & Apply Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          marginTop: '0.35rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
            {job.salary || 'Competitive'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            {job.jobType || 'Full-time'}
          </span>
        </div>

        {isApplied ? (
          <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            ✓ Applied
          </span>
        ) : (
          <button
            onClick={() => onApply && onApply(job)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}
