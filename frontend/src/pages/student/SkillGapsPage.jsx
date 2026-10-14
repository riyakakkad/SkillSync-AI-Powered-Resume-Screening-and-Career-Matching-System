import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function SkillGapsPage() {
  const navigate = useNavigate();
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSkillGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/skill-gaps`);
      if (response.data.success) {
        setGapData(response.data);
      } else {
        setError('Unable to calculate skill gap analysis.');
      }
    } catch (err) {
      console.error('Error fetching skill gaps:', err);
      setError(err.response?.data?.message || 'Failed to load skill gap analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillGaps();
  }, []);

  if (loading) {
    return <Loader message="Analyzing domain benchmarks and evaluating prioritized skill gaps..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSkillGaps} />;
  }

  const readinessScore = gapData?.readinessScore || 0;
  const targetDomain = gapData?.targetDomain || 'General';
  const possessedSkills = gapData?.possessedSkills || [];
  const criticalGaps = gapData?.criticalGaps || [];
  const growthGaps = gapData?.growthGaps || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Domain Skill Gap Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            AI-driven comparison between your validated resume skills and industry role benchmarks.
          </p>
        </div>

        <button onClick={fetchSkillGaps} className="btn" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem' }}>
          🔄 Recalculate Gaps
        </button>
      </div>

      {/* Main Readiness Gauge & Summary Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          padding: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2rem',
          alignItems: 'center'
        }}
      >
        {/* Readiness Circular / Metric Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: `conic-gradient(#10b981 ${readinessScore}%, rgba(255, 255, 255, 0.08) ${readinessScore}% 100%)`,
            padding: '8px'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
              {readinessScore}%
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Readiness
            </span>
          </div>
        </div>

        {/* Narrative & Domain Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8'
              }}
            >
              🌐 Target Domain: {targetDomain}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {possessedSkills.length} Validated Skills
            </span>
            <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
              {criticalGaps.length + growthGaps.length} Identified Gaps
            </span>
          </div>

          <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
            {gapData?.summaryText || `You have ${readinessScore}% readiness against the ${targetDomain} industry benchmark.`}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/student/courses')}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
            >
              🎓 Explore Bridging Courses →
            </button>
            <button
              onClick={() => navigate('/student/job-matching')}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              💼 View Matching Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Validated Possessed Skills Cloud */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem' }}>
          Your Verified Domain Skills ({possessedSkills.length})
        </h3>
        {possessedSkills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {possessedSkills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.825rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
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
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            No verified skills detected. Upload a resume to automatically extract your domain competencies.
          </p>
        )}
      </div>

      {/* Two Column Section: Critical Gaps vs Growth Opportunities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Critical Skill Gaps */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚠️ Critical Skill Gaps ({criticalGaps.length})
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171'
              }}
            >
              High Priority
            </span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            Essential foundational skills required by {targetDomain} industry standards that are missing from your profile.
          </p>

          {criticalGaps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {criticalGaps.map((gap, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      {gap.skill}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {gap.reason}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate('/student/courses')}
                    className="btn btn-primary"
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    Bridge Gap ↗
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#34d399', fontSize: '0.875rem' }}>
              🎉 Zero critical gaps! You cover all foundational benchmarks for {targetDomain}.
            </div>
          )}
        </div>

        {/* Growth Opportunities */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📈 Growth Opportunities ({growthGaps.length})
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24'
              }}
            >
              Medium Priority
            </span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            Skills frequently demanded in open {targetDomain} roles that will elevate your candidacy above peers.
          </p>

          {growthGaps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {growthGaps.map((gap, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      {gap.skill}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {gap.reason}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate('/student/courses')}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    Learn Skill ↗
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              All high-frequency market skills are covered or aligned with your profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
