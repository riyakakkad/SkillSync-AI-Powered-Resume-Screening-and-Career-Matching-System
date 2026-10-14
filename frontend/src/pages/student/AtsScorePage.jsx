import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoreCard from '../../components/ui/ScoreCard';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AtsScorePage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResumesAndAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/resumes`);
      if (response.data.success && response.data.resumes.length > 0) {
        const resumeList = response.data.resumes;
        setResumes(resumeList);
        const latest = resumeList[0];

        const analysisRes = await axios.get(`${API_BASE_URL}/resumes/${latest._id}/analysis`);
        if (analysisRes.data.success) {
          setSelectedResume(analysisRes.data.resume);
        } else {
          setSelectedResume(latest);
        }
      }
    } catch (err) {
      console.error('Error fetching ATS score details:', err);
      setError('Failed to load ATS score analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumesAndAnalysis();
  }, []);

  if (loading) {
    return <Loader message="Evaluating ATS score parameters..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchResumesAndAnalysis} />;
  }

  if (!resumes || resumes.length === 0) {
    return (
      <EmptyState
        icon="🎯"
        title="No Resume Uploaded"
        description="Upload your resume to calculate your ATS compatibility score and view improvement recommendations."
        actionText="Upload Resume"
        onAction={() => navigate('/student/resume-upload')}
      />
    );
  }

  const status = selectedResume?.analysisStatus || selectedResume?.status || 'uploaded';
  const atsBreakdown = selectedResume?.atsBreakdown || {};
  const overallScore = selectedResume?.atsScore || atsBreakdown.overallScore || 0;
  const detectedSkills = selectedResume?.detectedSkills || atsBreakdown.detectedSkills || [];
  const missingSkills = atsBreakdown.missingCommonSkills || [];
  const recommendations = atsBreakdown.recommendations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
          ATS Optimization & Score Breakdown
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Transparent, rule-based Applicant Tracking System evaluation computed by SkillSync ML Service.
        </p>
      </div>

      {status !== 'analyzed' ? (
        <div
          className="card"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            textAlign: 'center',
            padding: '2.5rem 1.5rem'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>
            ATS Calculation Pending
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.25rem auto' }}>
            Your resume document metadata is recorded, but ML text analysis has not run yet. Click below to run analysis.
          </p>
          <button onClick={() => navigate('/student/resume-upload')} className="btn btn-primary">
            Run Resume Analysis Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overall ATS Score Radial & Summary Banner */}
          <div
            className="card ats-banner-grid"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(6, 182, 212, 0.12) 100%)',
              borderColor: 'rgba(99, 102, 241, 0.35)',
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '1.5rem',
              alignItems: 'center'
            }}
          >
            <ScoreCard
              title="Overall ATS Score"
              score={overallScore}
              isPending={false}
              label="ATS Score"
              statusText={overallScore >= 75 ? 'High Compatibility' : overallScore >= 50 ? 'Moderate Fit' : 'Needs Optimization'}
            />

            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>
                Rule-Based Explainable Scoring
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                ATS Compatibility Assessment: {overallScore}%
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Evaluated from document structure, technical keywords, skills coverage, and section completeness.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {(selectedResume?.detectedDomain || atsBreakdown?.detectedDomain) && (
                  <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#c7d2fe', fontWeight: 600 }}>
                    Domain: <strong>{selectedResume?.detectedDomain || atsBreakdown?.detectedDomain}</strong>
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                  Extracted Skills: <strong>{detectedSkills.length}</strong>
                </span>
                <span style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                  Missing Common Skills: <strong>{missingSkills.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Score Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <ScoreCard
              title="Keyword Score"
              score={atsBreakdown.keywordScore || 0}
              isPending={false}
              label="Keywords"
              statusText="Text & terminology density"
            />

            <ScoreCard
              title="Skills Score"
              score={atsBreakdown.skillsScore || 0}
              isPending={false}
              label="Skills"
              statusText="Technical skill count"
            />

            <ScoreCard
              title="Section Completeness"
              score={atsBreakdown.sectionCompletenessScore || 0}
              isPending={false}
              label="Sections"
              statusText="Essential header check"
            />

            <ScoreCard
              title="Experience Match"
              score={atsBreakdown.experienceScore || 0}
              isPending={false}
              label="Work History"
              statusText="Employment details"
            />

            <ScoreCard
              title="Education Score"
              score={atsBreakdown.educationScore || 0}
              isPending={false}
              label="Academic"
              statusText="Degree & institution info"
            />

            <ScoreCard
              title="Project Score"
              score={atsBreakdown.projectScore || 0}
              isPending={false}
              label="Projects"
              statusText="Technical project details"
            />
          </div>

          {/* Skills Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="skills-grid">
            {/* Detected Skills */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem' }}>
                ✅ Detected Technical Skills ({detectedSkills.length})
              </h3>
              {detectedSkills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {detectedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.15)',
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No technical skills detected in document text.</p>
              )}
            </div>

            {/* Missing Common Skills */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem' }}>
                💡 Missing Common Core Skills ({missingSkills.length})
              </h3>
              {missingSkills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        fontWeight: 600
                      }}
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>All core common tech skills detected!</p>
              )}
            </div>
          </div>

          {/* Actionable Recommendations List */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.85rem' }}>
              📋 Actionable Recommendations to Improve Score
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>📌</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .ats-banner-grid {
            grid-template-columns: 1fr !important;
          }
          .skills-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
